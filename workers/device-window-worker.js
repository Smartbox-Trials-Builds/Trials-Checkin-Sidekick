(() => {
  let jobs = Promise.resolve();
  function enqueue(task) {
    const result = jobs.then(task);
    jobs = result.catch(error => console.warn("Sidekick window operation failed:", error.message));
    return result;
  }
  async function findWindow(page) {
    const url = chrome.runtime.getURL(page);
    return (await chrome.windows.getAll({ populate: true })).find(win =>
      win.tabs?.some(tab => tab.url === url || tab.pendingUrl === url));
  }
  async function centeredBounds(width, height) {
    const displays = await chrome.system.display.getInfo();
    const focused = await chrome.windows.getLastFocused().catch(() => null);
    const x = focused ? focused.left + focused.width / 2 : null;
    const y = focused ? focused.top + focused.height / 2 : null;
    const display = displays.find(item => x !== null && x >= item.bounds.left &&
      x < item.bounds.left + item.bounds.width && y >= item.bounds.top && y < item.bounds.top + item.bounds.height)
      || displays.find(item => item.isPrimary) || displays[0];
    if (!display) return { width, height };
    const area = display.workArea;
    width = Math.min(width, area.width);
    height = Math.min(height, area.height);
    return { width, height, left: Math.round(area.left + (area.width - width) / 2), top: Math.round(area.top + (area.height - height) / 2) };
  }
  const handlers = {
    "sidekick-open-lockdown": async () => {
      const stored = await chrome.storage.local.get("ttmtSidekickUserProfile");
      if (stored.ttmtSidekickUserProfile?.role !== "Device Systems Coordinator") throw new Error("Lock Down is available to Device Systems Coordinators.");
      const page = "panel.html?tool=lockdown";
      const win = await findWindow(page);
      if (win) await chrome.windows.update(win.id, { focused: true, ...(win.state === "minimized" ? { state: "normal" } : {}) });
      else await chrome.windows.create({ url: chrome.runtime.getURL(page), type: "popup", focused: true, ...await centeredBounds(1000, 760) });
    },
    "sidekick-open-new-device": async () => {
      const stored = await chrome.storage.local.get("ttmtSidekickUserProfile");
      if (stored.ttmtSidekickUserProfile?.role !== "Device Systems Coordinator") throw new Error("Device Sidekick is available to Device Systems Coordinators.");
      const win = await findWindow("device-new-window.html");
      if (win) await chrome.windows.update(win.id, { focused: true, ...(win.state === "minimized" ? { state: "normal" } : {}) });
      else await chrome.windows.create({ url: chrome.runtime.getURL("device-new-window.html"), type: "popup", focused: true, ...await centeredBounds(1180, 760) });
    },
  };
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    const handler = handlers[message?.type];
    if (!handler || sender.id !== chrome.runtime.id) return;
    enqueue(() => handler(message)).then(() => respond({ ok: true }), error => respond({ ok: false, error: error.message }));
    return true;
  });
  void chrome.alarms.clear("sidekick-assignment-check");
})();
