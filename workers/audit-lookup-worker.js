(() => {
  const CACHE = "sidekickAuditLookupV1", STATUS = "sidekickAuditLookupStatus";
  const ALARM = "sidekick-audit-wednesday", RETRY = "sidekick-audit-retry";
  const URL = "https://smartboxassistivetnam.sharepoint.com/sites/TrialsSharePoint.us/_api/web/GetFileById('4541ab44-2f93-401b-bb0f-371e8f6f23a2')/$value";
  const reader = globalThis.sidekickAuditWorkbook;
  let pending;
  const access = async () => (await chrome.storage.local.get("ttmtSidekickUserProfile")).ttmtSidekickUserProfile?.role === "Device Systems Coordinator";
  async function schedule() { await chrome.alarms.create(ALARM, { when: reader.refreshWindow().next }); }
  async function status() {
    const stored = await chrome.storage.local.get([CACHE, STATUS]);
    const cache = stored[CACHE];
    return { count: cache?.count || 0, fetchedAt: cache?.fetchedAt || null, source: cache?.source || null,
      stale: !cache || cache.schemaVersion !== 2 || cache.fetchedAt < reader.refreshWindow().previous,
      error: stored[STATUS]?.error || null, nextRefreshAt: reader.refreshWindow().next };
  }
  async function store(parsed, source) {
    if (!(await access())) throw new Error("Serial lookup is available to Device Systems Coordinators.");
    await chrome.storage.local.set({ [CACHE]: { ...parsed, source, fetchedAt: Date.now() }, [STATUS]: { error: null, attemptedAt: Date.now() } });
    await chrome.alarms.clear(RETRY);
    await schedule();
    return await status();
  }
  async function refresh(force = false) {
    if (pending) return await pending;
    if (!(await access())) throw new Error("Serial lookup is available to Device Systems Coordinators.");
    const stored = await chrome.storage.local.get([CACHE, STATUS]);
    if (!force && stored[CACHE]?.schemaVersion === 2 && stored[CACHE].fetchedAt >= reader.refreshWindow().previous) return await status();
    if (!force && stored[STATUS]?.error && Date.now() - stored[STATUS].attemptedAt < 15 * 60000) return await status();
    if (pending) return await pending; // Another scan may have started a read during the awaits above.
    pending = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      try {
        // GET only. No workbook updates, query refreshes, or macro execution.
        const response = await fetch(URL, { method: "GET", credentials: "include", cache: "no-store", signal: controller.signal });
        if (!response.ok || !response.url.startsWith("https://smartboxassistivetnam.sharepoint.com/")) throw new Error("Open Audit.xlsm in SharePoint and sign in, then refresh the serial lookup.");
        if (/text\/html/i.test(response.headers.get("content-type") || "")) throw new Error("Open Audit.xlsm in SharePoint and sign in, then refresh the serial lookup.");
        const buffer = await response.arrayBuffer();
        if (buffer.byteLength > 20000000) throw new Error("Audit.xlsm is too large for serial lookup.");
        return await store(await reader.parse(buffer), "SharePoint");
      } catch (error) {
        const message = /fetch|abort|network/i.test(error.message || "") ? "Could not read SharePoint. Sign in there and refresh, or use your local Audit.xlsm file." : error.message;
        await chrome.storage.local.set({ [STATUS]: { error: message, attemptedAt: Date.now() } });
        await chrome.alarms.create(RETRY, { when: Date.now() + 15 * 60000 });
        return await status(); // Keep the last successfully read mapping on failures.
      } finally { clearTimeout(timeout); pending = null; }
    })();
    return await pending;
  }
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (!message?.type?.startsWith("sidekick-audit-") || sender.id !== chrome.runtime.id) return;
    (async () => {
      if (!(await access())) throw new Error("Serial lookup is available to Device Systems Coordinators.");
      if (message.type === "sidekick-audit-status") return { ok: true, ...await refresh() };
      if (message.type === "sidekick-audit-refresh") return { ok: true, ...await refresh(true) };
      if (message.type === "sidekick-audit-import") {
        if (pending) await pending;
        if (typeof message.base64 !== "string" || message.base64.length > 28000000) throw new Error("Choose the Audit.xlsm workbook.");
        const buffer = Uint8Array.from(atob(message.base64), char => char.charCodeAt(0));
        return { ok: true, ...await store(await reader.parse(buffer), "local Audit file") };
      }
      if (message.type === "sidekick-audit-lookup") {
        const device = reader.normalize(message.device);
        if (!device || device.length > 100) throw new Error("Missing device number.");
        const state = await refresh();
        const cache = (await chrome.storage.local.get(CACHE))[CACHE];
        return { ok: true, ...state, internalSerial: cache && Object.hasOwn(cache.map, device) ? cache.map[device] : null,
          category: cache?.categories && Object.hasOwn(cache.categories, device) ? cache.categories[device] : null,
          categoryAmbiguous: cache?.categoryAmbiguous?.includes(device) || false,
          ambiguous: cache?.ambiguous?.includes(device) || false };
      }
      throw new Error("Unknown Audit lookup request.");
    })().then(respond).catch(error => respond({ ok: false, error: error.message }));
    return true;
  });
  async function initialize() {
    await schedule();
    if (await access()) await refresh();
  }
  chrome.alarms.onAlarm.addListener(alarm => {
    if ([ALARM, RETRY].includes(alarm.name)) void initialize().catch(console.warn);
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.ttmtSidekickUserProfile) void initialize().catch(console.warn);
  });
  chrome.runtime.onStartup?.addListener(() => { void initialize().catch(console.warn); });
  void initialize().catch(console.warn);
})();
