(() => {
  const URL = "https://smartboxassistivetnam.sharepoint.com/sites/TrialsSharePoint.us/_api/web/GetFileById('0ea98517-551f-426a-bfb3-8eb6a8125b17')/$value";
  let pending;
  async function lookup(device) {
    const profile = (await chrome.storage.local.get("ttmtSidekickUserProfile")).ttmtSidekickUserProfile;
    if (profile?.role !== "Device Systems Coordinator") throw new Error("Sticker checks are available to Device Systems Coordinators.");
    const serial = globalThis.sidekickStickerWorkbook.normalize(device);
    if (!serial || serial.length > 100) throw new Error("Missing device number for sticker check.");
    // Re-read on every scan; simultaneous scans can share the same read-only download.
    if (!pending) pending = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch(URL, { method: "GET", credentials: "include", cache: "no-store", signal: controller.signal });
        if (!response.ok || !response.url.startsWith("https://smartboxassistivetnam.sharepoint.com/") || /text\/html/i.test(response.headers.get("content-type") || "")) throw new Error("Open Missing DTP Stickers.xlsx in SharePoint and sign in, then scan again.");
        const bytes = await response.arrayBuffer();
        if (bytes.byteLength > 20000000) throw new Error("The sticker workbook is too large to read.");
        return await globalThis.sidekickStickerWorkbook.parse(bytes);
      } finally { clearTimeout(timer); pending = null; }
    })();
    const matches = await pending;
    return { ok: true, matches: Object.hasOwn(matches, serial) ? matches[serial] : [] };
  }
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (message?.type !== "sidekick-sticker-lookup" || sender.id !== chrome.runtime.id) return;
    lookup(message.device).then(respond).catch(error => respond({ ok: false, error: /fetch|network|abort/i.test(error.message || "") ? "Could not read the sticker workbook. Check SharePoint and scan again." : error.message }));
    return true;
  });
})();
