// Owns extension popup windows and notification delivery independently of the side panel.
(() => {
  const ALARM = "sidekick-assignment-check";
  let jobs = Promise.resolve();
  let noticeChannel;
  let clientNameChannel;
  let noticeUser;
  let noticeToken;

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
  async function reconcile() {
    const win = await findWindow("queue-window.html");
    await chrome.storage.session.set({ sidekickQueueWindowId: win?.id ?? null });
    await chrome.storage.local.set({ sidekickQueueDetached: Boolean(win) });
  }
  async function openQueue() {
    let win = await findWindow("queue-window.html");
    if (win) {
      await chrome.windows.update(win.id, { focused: true, ...(win.state === "minimized" ? { state: "normal" } : {}) });
    } else {
      win = await chrome.windows.create({ url: chrome.runtime.getURL("queue-window.html"), type: "popup", focused: true, ...await centeredBounds(440, 580) });
    }
    if (!win?.id) throw new Error("Could not open the queue window.");
    await chrome.storage.session.set({ sidekickQueueWindowId: win.id });
    await chrome.storage.local.set({ sidekickQueueDetached: true });
  }
  async function returnQueue() {
    const win = await findWindow("queue-window.html");
    // A deliberate return expands the queue even if it was previously hidden.
    await chrome.storage.local.set({ sidekickQueueDetached: false, sidekickQueueCollapsed: false });
    await chrome.storage.session.set({ sidekickQueueWindowId: null });
    if (win) await chrome.windows.remove(win.id);
  }
  async function dismissPending(client) {
    const stored = await chrome.storage.local.get("sidekickPendingDismissals");
    const pending = stored.sidekickPendingDismissals || [];
    const remaining = [];
    for (const id of pending) {
      const { error } = await client.rpc("sidekick_queue_action", { p_action: "dismiss", p_notification_id: id });
      if (error) remaining.push(id);
    }
    await chrome.storage.local.set({ sidekickPendingDismissals: remaining });
    return new Set(remaining);
  }
  async function receiveClientName(payload) {
    if (!payload || typeof payload.name !== "string" || !payload.name.trim() || payload.name.length > 200 ||
        !/^[0-9a-f-]{36}$/i.test(payload.notificationId || "")) return;
    const client = globalThis.sidekickSupabase.getClient();
    const result = await client.from("sidekick_prep_notifications").select("id,assigned_by,dismissed_at")
      .eq("id", payload.notificationId).maybeSingle();
    // RLS confirms this notification belongs to this recipient.
    if (result.error || !result.data || result.data.dismissed_at || result.data.assigned_by !== payload.senderId) return;
    const stored = await chrome.storage.session.get("sidekickLiveClientNames");
    await chrome.storage.session.set({ sidekickLiveClientNames: {
      ...(stored.sidekickLiveClientNames || {}), [payload.notificationId]: payload.name.trim()
    } });
    await checkNotifications();
  }
  async function pruneClientNames(ids) {
    const stored = await chrome.storage.session.get("sidekickLiveClientNames");
    const active = new Set(ids);
    const names = Object.fromEntries(Object.entries(stored.sidekickLiveClientNames || {}).filter(([id]) => active.has(id)));
    if (JSON.stringify(names) !== JSON.stringify(stored.sidekickLiveClientNames || {})) {
      await chrome.storage.session.set({ sidekickLiveClientNames: names });
    }
  }
  async function checkNotifications() {
    const client = globalThis.sidekickSupabase.getClient();
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    const session = data.session;
    if (!session) return;
    if (noticeToken !== session.access_token) {
      await client.realtime.setAuth(session.access_token);
      noticeToken = session.access_token;
    }
    if (noticeUser !== session.user.id) {
      if (noticeChannel) await client.removeChannel(noticeChannel);
      if (clientNameChannel) await client.removeChannel(clientNameChannel);
      noticeUser = session.user.id;
      noticeChannel = client.channel(`sidekick-background-assignments-${noticeUser}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "sidekick_prep_notifications", filter: `user_id=eq.${noticeUser}` }, () => void enqueue(checkNotifications))
        .subscribe(state => { if (state === "SUBSCRIBED") void enqueue(checkNotifications); });
      clientNameChannel = client.channel(`sidekick-clients:${noticeUser}`, { config: { private: true } })
        .on("broadcast", { event: "client-name" }, message => void enqueue(() => receiveClientName(message.payload)))
        .subscribe(state => { if (state === "SUBSCRIBED") void enqueue(checkNotifications); });
    }
    const pendingDismissals = await dismissPending(client);
    const result = await client.from("sidekick_prep_notifications").select("id").is("dismissed_at", null).order("created_at");
    if (result.error) throw result.error;
    const ids = result.data.map(entry => entry.id).filter(id => !pendingDismissals.has(id));
    await pruneClientNames(ids);
    let win = await findWindow("assignment-window.html");
    const stored = await chrome.storage.session.get("sidekickNoticeIds");
    const previous = stored.sidekickNoticeIds || [];
    if (!ids.length) {
      await chrome.storage.session.set({ sidekickNoticeWindowId: null, sidekickNoticeIds: [] });
      if (win) await chrome.windows.remove(win.id);
      return;
    }
    if (!win) {
      win = await chrome.windows.create({ url: chrome.runtime.getURL("assignment-window.html"), type: "popup", focused: true, ...await centeredBounds(480, 450) });
    } else if (ids.some(id => !previous.includes(id))) {
      await chrome.windows.update(win.id, { focused: true, ...(win.state === "minimized" ? { state: "normal" } : {}) });
    }
    if (!win?.id) throw new Error("Could not open the assignment notification.");
    await chrome.storage.session.set({ sidekickNoticeWindowId: win.id, sidekickNoticeIds: ids });
  }

  const handlers = {
    "sidekick-open-assignment-log": async () => {
      const stored = await chrome.storage.local.get("ttmtSidekickUserProfile");
      if (stored.ttmtSidekickUserProfile?.role !== "Device Systems Coordinator") throw new Error("Assignment log is available to Device Systems Coordinators.");
      const win = await findWindow("assignment-log-window.html");
      if (win) await chrome.windows.update(win.id,{focused:true,...(win.state === "minimized" ? {state:"normal"} : {})});
      else await chrome.windows.create({url:chrome.runtime.getURL("assignment-log-window.html"),type:"popup",focused:true,...await centeredBounds(640,600)});
    },
    "sidekick-open-device": async () => {
      const stored = await chrome.storage.local.get("ttmtSidekickUserProfile");
      if (stored.ttmtSidekickUserProfile?.role !== "Device Systems Coordinator") {
        throw new Error("Device Sidekick is available to Device Systems Coordinators.");
      }
      const win = await findWindow("device-window.html");
      if (win) {
        await chrome.windows.update(win.id, { focused: true, ...(win.state === "minimized" ? { state: "normal" } : {}) });
      } else {
        await chrome.windows.create({ url: chrome.runtime.getURL("device-window.html"), type: "popup", focused: true, ...await centeredBounds(620, 680) });
      }
    },
    "sidekick-open-queue": openQueue,
    "sidekick-return-queue": returnQueue,
    "sidekick-reconcile-windows": reconcile,
    "sidekick-check-notifications": checkNotifications
  };
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    const handler = handlers[message?.type];
    if (!handler || sender.id !== chrome.runtime.id) return;
    enqueue(handler).then(() => respond({ ok: true }), error => respond({ ok: false, error: error.message }));
    return true;
  });
  chrome.windows.onRemoved.addListener(id => {
    void enqueue(async () => {
      const stored = await chrome.storage.session.get(["sidekickQueueWindowId", "sidekickNoticeWindowId", "sidekickNoticeIds"]);
      if (id === stored.sidekickQueueWindowId) {
        await chrome.storage.session.set({ sidekickQueueWindowId: null });
        await chrome.storage.local.set({ sidekickQueueDetached: false, sidekickQueueCollapsed: false });
      }
      if (id === stored.sidekickNoticeWindowId) {
        const local = await chrome.storage.local.get("sidekickPendingDismissals");
        const pending = [...new Set([...(local.sidekickPendingDismissals || []), ...(stored.sidekickNoticeIds || [])])];
        await chrome.storage.local.set({ sidekickPendingDismissals: pending });
        const names = await chrome.storage.session.get("sidekickLiveClientNames");
        const remainingNames = Object.fromEntries(Object.entries(names.sidekickLiveClientNames || {})
          .filter(([key]) => !(stored.sidekickNoticeIds || []).includes(key)));
        await chrome.storage.session.set({ sidekickLiveClientNames: remainingNames });
        await chrome.storage.session.set({ sidekickNoticeWindowId: null, sidekickNoticeIds: [] });
        await checkNotifications();
      }
    });
  });
  chrome.alarms.onAlarm.addListener(alarm => { if (alarm.name === ALARM) void enqueue(checkNotifications); });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes["sidekick-supabase-session"]) void enqueue(checkNotifications);
  });
  async function start() {
    await chrome.alarms.create(ALARM, { periodInMinutes: 0.5 });
    await reconcile();
    await checkNotifications();
  }
  chrome.runtime.onStartup.addListener(() => void enqueue(start));
  chrome.runtime.onInstalled.addListener(() => void enqueue(start));
  void enqueue(start);
})();
