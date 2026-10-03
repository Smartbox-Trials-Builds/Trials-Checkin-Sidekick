const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function event() {
  const listeners = [];
  return { addListener(fn) { listeners.push(fn); }, fire(...args) { return listeners.map(fn => fn(...args)); } };
}
const changed = event();
const removed = event();
const messages = event();
const alarms = event();
const local = { sidekickQueueDetached: true, sidekickQueueCollapsed: true };
const sessionStore = {};
const windows = new Map([[1, { id: 1, type: "normal", left: 2200, top: 0, width: 1000, height: 800, tabs: [] }]]);
let nextId = 2;
let createCount = 0;
let focusCount = 0;
let notices = [];
let offline = false;
const dismissals = [];
let broadcastHandler;
const storage = area => ({
  async get(keys) {
    const values = area === "local" ? local : sessionStore;
    if (typeof keys === "string") return { [keys]: values[keys] };
    return Object.fromEntries(keys.map(key => [key, values[key]]));
  },
  async set(values) {
    const target = area === "local" ? local : sessionStore;
    const changes = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { oldValue: target[key], newValue: value }]));
    Object.assign(target, values);
    changed.fire(changes, area);
  }
});
const client = {
  auth: { getSession: async () => ({ data: { session: { user: { id: "me" }, access_token: "token" } } }) },
  realtime: { setAuth: async () => {} },
  channel() { const c = { on(type, _, fn) { if (type === "broadcast") broadcastHandler = fn; return c; }, subscribe(fn) { fn("SUBSCRIBED"); return c; } }; return c; },
  removeChannel: async () => {},
  from() {
    let id;
    const query = {
      select() { return query; }, is() { return query; },
      eq(_, value) { id = value; return query; },
      maybeSingle: async () => ({ data: notices.find(n => n.id === id && !n.dismissed) || null }),
      order() { return Promise.resolve({ data: notices.filter(n => !n.dismissed) }); }
    };
    return query;
  },
  async rpc(_, args) {
    if (offline) return { error: { message: "Offline" } };
    dismissals.push(args.p_notification_id);
    for (const notice of notices) if (notice.id === args.p_notification_id) notice.dismissed = true;
    return {};
  }
};
const chrome = {
  runtime: { id: "test-extension", getURL: path => `chrome-extension://test-extension/${path}`, onMessage: messages, onStartup: event(), onInstalled: event() },
  storage: { local: storage("local"), session: storage("session"), onChanged: changed },
  system: { display: { getInfo: async () => [
    { isPrimary: true, bounds: { left: 0, top: 0, width: 1920, height: 1080 }, workArea: { left: 0, top: 0, width: 1920, height: 1040 } },
    { isPrimary: false, bounds: { left: 1920, top: 0, width: 1920, height: 1080 }, workArea: { left: 1920, top: 0, width: 1920, height: 1040 } }
  ] } },
  alarms: { create: async (name, data) => { assert.equal(data.periodInMinutes, 0.5); }, onAlarm: alarms },
  windows: {
    getAll: async () => [...windows.values()], getLastFocused: async () => windows.get(1), onRemoved: removed,
    async create(data) {
      const win = { ...data, id: nextId++, state: "normal", tabs: [{ url: data.url }] };
      windows.set(win.id, win); createCount++; return win;
    },
    async update(id, values) { assert.ok(windows.has(id)); Object.assign(windows.get(id), values); focusCount++; },
    async remove(id) { windows.delete(id); removed.fire(id); }
  }
};
const context = { chrome, sidekickSupabase: { getClient: () => client }, console };
vm.runInNewContext(fs.readFileSync(`${__dirname}/queue-window-worker.js`, "utf8"), context);
const settle = async () => { for (let i = 0; i < 30; i++) await new Promise(resolve => setImmediate(resolve)); };
const request = type => new Promise(resolve => messages.fire({ type }, { id: chrome.runtime.id }, resolve));

(async () => {
  await settle();
  assert.equal(local.sidekickQueueDetached, false, "Startup repairs stale detached state");
  await Promise.all([request("sidekick-open-queue"), request("sidekick-open-queue")]);
  assert.equal(createCount, 1, "Concurrent pop-out clicks create only one window");
  assert.equal(local.sidekickQueueDetached, true);
  const queueId = sessionStore.sidekickQueueWindowId;
  const queueWindow = windows.get(queueId);
  assert.equal(queueWindow.left, 2660); assert.equal(queueWindow.top, 230);
  assert.equal(queueWindow.type, "popup");
  await request("sidekick-return-queue"); await settle();
  assert.equal(local.sidekickQueueDetached, false); assert.equal(local.sidekickQueueCollapsed, false);
  assert.ok(!windows.has(queueId));
  await request("sidekick-open-queue");
  await chrome.windows.remove(sessionStore.sidekickQueueWindowId); await settle();
  assert.equal(local.sidekickQueueDetached, false, "Native close restores the landing queue");
  notices = [{ id: "notice-1" }];
  alarms.fire({ name: "sidekick-assignment-check" }); await settle();
  const noticeId = sessionStore.sidekickNoticeWindowId;
  const noticeWindow = windows.get(noticeId);
  assert.equal(noticeWindow.left, 2640); assert.equal(noticeWindow.top, 295);
  const count = createCount, focus = focusCount;
  await request("sidekick-check-notifications");
  assert.equal(createCount, count); assert.equal(focusCount, focus, "Existing notices do not repeatedly steal focus");
  notices.push({ id: "notice-2" });
  await request("sidekick-check-notifications");
  assert.equal(createCount, count); assert.equal(focusCount, focus + 1, "New assignments focus the existing alert");
  offline = true;
  await chrome.windows.remove(noticeId); await settle();
  assert.equal(local.sidekickPendingDismissals.length, 2);
  assert.equal(sessionStore.sidekickNoticeWindowId, null, "Closed alerts stay closed during an outage");
  await request("sidekick-check-notifications");
  assert.equal(createCount, count);
  offline = false;
  alarms.fire({ name: "sidekick-assignment-check" }); await settle();
  assert.equal(local.sidekickPendingDismissals.length, 0);
  assert.deepEqual(dismissals.sort(), ["notice-1", "notice-2"]);
  notices.push({ id: "notice-3" });
  await request("sidekick-check-notifications");
  const thirdId = sessionStore.sidekickNoticeWindowId;
  notices.find(n => n.id === "notice-3").dismissed = true;
  await request("sidekick-check-notifications"); await settle();
  assert.ok(!windows.has(thirdId));
  assert.ok(!dismissals.includes("notice-3"), "Auto-closing an empty popup does not dismiss unseen assignments");
  const liveId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
  notices.push({ id: liveId, assigned_by: "sender" });
  await request("sidekick-check-notifications");
  broadcastHandler({ payload: { notificationId: liveId, senderId: "wrong-sender", name: "SESSION TEST NAME" } });
  await settle();
  assert.equal(sessionStore.sidekickLiveClientNames?.[liveId], undefined, "Unmatched assignment senders must be ignored");
  broadcastHandler({ payload: { notificationId: liveId, senderId: "sender", name: "SESSION TEST NAME" } });
  await settle();
  assert.equal(sessionStore.sidekickLiveClientNames[liveId], "SESSION TEST NAME");
  assert.ok(!JSON.stringify(local).includes("SESSION TEST NAME"), "Live client names must never be written to persistent browser storage");
  await chrome.windows.remove(sessionStore.sidekickNoticeWindowId); await settle();
  assert.equal(sessionStore.sidekickLiveClientNames[liveId], undefined, "Closing an alert removes its name from browser memory");
  const foreign = messages.fire({ type: "sidekick-open-queue" }, { id: "other-extension" }, () => { throw Error("Foreign request accepted"); });
  assert.equal(foreign[0], undefined);
  local.ttmtSidekickUserProfile = { role: "Device Systems Coordinator" };
  await Promise.all([request("sidekick-open-device"), request("sidekick-open-device")]);
  const deviceWindows = [...windows.values()].filter(win => win.tabs.some(tab => tab.url.endsWith("device-window.html")));
  assert.equal(deviceWindows.length, 1, "Repeated pop-outs reuse the Device Sidekick window");
  const deviceWindow = deviceWindows[0];
  assert.equal(deviceWindow.type, "popup");
  assert.equal(deviceWindow.width, 620);
  deviceWindow.state = "minimized";
  await request("sidekick-open-device");
  assert.equal(deviceWindow.state, "normal");
  local.ttmtSidekickUserProfile.role = "Device Coordinator";
  assert.equal((await request("sidekick-open-device")).ok, false);
  await chrome.windows.remove(deviceWindow.id); await settle();
  assert.equal(sessionStore.sidekickNoticeWindowId, null);
  console.log("PASS: singleton windows, multi-monitor centering, docking, native close, background delivery, focus behavior, offline dismissal recovery, sender validation, and Device Sidekick pop-outs.");
})().catch(error => { console.error(error); process.exitCode = 1; });
