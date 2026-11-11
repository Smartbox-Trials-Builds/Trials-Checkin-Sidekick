(() => {
  const KEY = "sidekickGipodCount", ALARM = "sidekick-gipod-one-minute", PERIOD = 60000;
  const URL = "https://smartboxassistivetnam.sharepoint.com/sites/TrialsSharePoint.us/_api/web/GetFileById('9f76c7de-2c28-442e-8221-950469862b13')/$value";
  let pending;
  const access = async () => (await chrome.storage.local.get("ttmtSidekickUserProfile")).ttmtSidekickUserProfile?.role === "Device Systems Coordinator";
  async function refresh() {
    if (!(await access())) throw new Error("Available codes are shown to Device Systems Coordinators.");
    const previous = (await chrome.storage.local.get(KEY))[KEY];
    if (previous?.attemptedAt && Date.now() - previous.attemptedAt < PERIOD) return previous;
    if (pending) return pending;
    pending = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      try {
        // Read-only download. No Excel updates or macro execution.
        const response = await fetch(URL, { method: "GET", credentials: "include", cache: "no-store", signal: controller.signal });
        if (!response.ok || !response.url.startsWith("https://smartboxassistivetnam.sharepoint.com/") || /text\/html/i.test(response.headers.get("content-type") || "")) throw new Error("Sign in to the purchasing tracker in SharePoint. Retrying every minute.");
        const bytes = await response.arrayBuffer();
        if (bytes.byteLength > 20000000) throw new Error("The purchasing tracker is too large to read.");
        const result = await globalThis.sidekickGipodWorkbook.parse(bytes);
        const state = { count: result.count, fetchedAt: Date.now(), attemptedAt: Date.now(), error: null };
        if (await access()) await chrome.storage.local.set({ [KEY]: state });
        return state;
      } catch (error) {
        const state = { count: previous?.count ?? null, fetchedAt: previous?.fetchedAt ?? null, attemptedAt: Date.now(), error: /fetch|abort|network/i.test(error.message || "") ? "Could not read SharePoint. Retrying every minute." : error.message };
        if (await access()) await chrome.storage.local.set({ [KEY]: state });
        return state;
      } finally { clearTimeout(timeout); pending = null; }
    })();
    return pending;
  }
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (message?.type !== "sidekick-gipod-count" || sender.id !== chrome.runtime.id) return;
    refresh().then(state => respond({ ok: true, ...state })).catch(error => respond({ ok: false, error: error.message }));
    return true;
  });
  async function initialize() {
    await chrome.alarms.clear("sidekick-gipod-five-minutes");
    if (!(await access())) { await chrome.alarms.clear(ALARM); return; }
    await chrome.alarms.create(ALARM, { periodInMinutes: 1 });
    await refresh();
  }
  chrome.alarms.onAlarm.addListener(alarm => { if (alarm.name === ALARM) void refresh().catch(console.warn); });
  chrome.storage.onChanged.addListener((changes, area) => { if (area === "local" && changes.ttmtSidekickUserProfile) void initialize().catch(console.warn); });
  chrome.runtime.onStartup?.addListener(() => { void initialize().catch(console.warn); });
  void initialize().catch(console.warn);
})();
