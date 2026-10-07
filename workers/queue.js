(() => {
  const api = globalThis.sidekickSupabase;
  const client = api.getClient();
  const join = document.getElementById("joinCoordinatorQueueBtn");
  const indicator = document.getElementById("coordinatorQueueIndicator");
  const list = document.getElementById("coordinatorQueueList");
  const status = document.getElementById("coordinatorQueueStatus");
  const dialog = document.getElementById("prepAssignmentDialog");
  const form = document.getElementById("prepAssignmentForm");
  const countInput = document.getElementById("prepAssignmentCount");
  const openAssign = document.getElementById("assignDevicesBtn");
  const copyInitials = document.getElementById("copyAssignedInitialsBtn");
  let assignedInitials = '';
  let requestId = null;
  const assignButton = document.getElementById("prepAssignmentSubmit");
  const cancel = document.getElementById("prepAssignmentCancel");
  const assignStatus = document.getElementById("prepAssignmentStatus");
  let profile = null;
  let queue = [];

  let busy = false;
  let assigning = false;
  let refreshing = false;
  let refreshAgain = false;
  let channel = null;
  let channelUser = null;
  let channelToken = null;
  let live = false;
  let queueOpen = false;
  let connected = false;

  function updateIndicator() {
    const state = !connected ? "disconnected" : !queueOpen ? "closed" : live ? "open" : "disconnected";
    const label = state === "open" ? "Queue is live and open" : state === "closed" ? "Queue is closed. Opens at 7 AM Central time" : "Queue is not connected. Retrying automatically";
    indicator.dataset.state = state;
    indicator.setAttribute("aria-label", label);
    indicator.title = label;
  }

  function updateControls() {
    const queued = queue.some(entry => entry.user_id === profile?.user_id);
    join.textContent = queued ? "Leave Queue" : "Join Queue";
    join.disabled = !profile || busy || !connected || (!queued && !queueOpen);
    openAssign.hidden = profile?.role !== "Device Systems Coordinator";
    openAssign.disabled = busy || assigning || !connected || !queueOpen || !queue.length;
    copyInitials.hidden = openAssign.hidden;
    updateIndicator();
  }

  function renderQueue() {
    list.replaceChildren();
    for (const entry of queue) {
      const item = document.createElement("li");
      const label = document.createElement("span");
      label.textContent = entry.name + ' (' + entry.dashboard_initials + ')' + (entry.user_id === profile?.user_id ? ' — You' : '');
      item.append(label);
      list.append(item);
    }
    updateControls();
  }

  function renderNotifications(entries) {
    // The background worker opens one centered notification window for this user.
    if (entries.length) {
      void chrome.runtime.sendMessage({ type: "sidekick-check-notifications" }).catch(() => {
        status.textContent = "Could not open the assignment alert. Reload the extension and try again.";
      });
    }
  }
  async function action(name, args = {}) {
    const { error } = await client.rpc("sidekick_queue_action", { p_action: name, ...args });
    if (error) throw new Error(error.message || "Could not update the queue. Please try again.");
  }

  async function subscribe(userId, accessToken) {
    // Authenticate Realtime explicitly before subscribing to protected tables.
    if (channelToken !== accessToken) {
      await client.realtime.setAuth(accessToken);
      channelToken = accessToken;
    }
    if (channelUser === userId) return;
    if (channel) void client.removeChannel(channel);
    channelUser = userId;
    channel = client.channel(`sidekick-queue-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "sidekick_queue" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "sidekick_prep_notifications", filter: `user_id=eq.${userId}` }, () => void refresh())
      .subscribe(state => {
        live = state === "SUBSCRIBED";
        updateIndicator();
        void refresh();
      });
  }

  async function refresh() {
    if (refreshing) { refreshAgain = true; return; }
    refreshing = true;
    try {
      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw sessionError;
      const userId = sessionData.session?.user?.id;
      if (!userId) {
        connected = false;
        profile = null;
        queue = [];
        renderQueue();
        renderNotifications([]);
        status.textContent = "Save your name, role, and Dashboard Initials in User settings → Edit user profile to use the queue.";
        return;
      }
      const result = await client.from("sidekick_user_profiles").select().eq("user_id", userId).maybeSingle();
      if (result.error) throw result.error;
      profile = result.data;
      if (!profile) {
        connected = false;
        queue = [];
        renderQueue();
        status.textContent = "Complete your Sidekick profile to use the queue.";
        return;
      }
      await subscribe(userId, sessionData.session.access_token);
      const [queueResult, notificationResult, hoursResult] = await Promise.all([
        client.from("sidekick_queue").select().order("joined_at").order("id"),
        client.from("sidekick_prep_notifications").select().is("dismissed_at", null).order("created_at"),
        client.rpc("sidekick_queue_hours")
      ]);
      if (queueResult.error) throw queueResult.error;
      if (notificationResult.error) throw notificationResult.error;
      if (hoursResult.error) throw hoursResult.error;
      connected = true;
      queueOpen = hoursResult.data.is_open;
      queue = queueResult.data;
      renderQueue();
      renderNotifications(notificationResult.data);
      status.textContent = "";
    } catch {
      connected = false;
      updateIndicator();
      status.textContent = "";
      join.disabled = true;
      openAssign.disabled = true;
    } finally {
      refreshing = false;
      if (refreshAgain) { refreshAgain = false; void refresh(); }
    }
  }

  async function changeMembership(name) {
    if (busy) return;
    busy = true;
    updateControls();
    try {
      await action(name);
      await refresh();
    } catch (error) { status.textContent = error.message; }
    finally { busy = false; updateControls(); }
  }
  join.addEventListener("click", () => {
    if (join.disabled) return;
    const queued = queue.some(entry => entry.user_id === profile?.user_id);
    void changeMembership(queued ? "leave" : "join");
  });
  openAssign.addEventListener('click',() => {
    if (openAssign.disabled) return;
    requestId = crypto.randomUUID(); countInput.value = '1'; countInput.disabled = false;
    assignStatus.textContent = ''; dialog.showModal(); countInput.focus();
  });
  copyInitials.addEventListener('click',async () => {
    try { const result = await chrome.runtime.sendMessage({type:'sidekick-open-assignment-log'}); if (!result?.ok) throw new Error(result?.error || 'Could not open assignment log.'); }
    catch(error) { status.textContent = error.message; }
  });
  cancel.addEventListener('click',() => { if (!assigning) dialog.close(); });
  dialog.addEventListener('cancel',event => { if (assigning) event.preventDefault(); });
  form.addEventListener('submit',async event => {
    event.preventDefault();
    const count = Number(countInput.value);
    if (assigning || !form.reportValidity() || !Number.isInteger(count) || count < 1 || count > 10) return;
    assigning = true; countInput.disabled = true; assignButton.disabled = true; cancel.disabled = true; updateControls();
    assignStatus.textContent = 'Assigning devices…';
    try {
      const {data,error} = await client.rpc('sidekick_assign_devices',{p_count:count,p_request_id:requestId});
      if (error) { const failure = new Error(error.message); failure.databaseRejected = true; throw failure; }
      assignedInitials = data.map(entry => entry.dashboard_initials).join('\r\n');
      let copied = true;
      try { await navigator.clipboard.writeText(assignedInitials); } catch { copied = false; }
      dialog.close(); await refresh();
      status.textContent = 'Assigned ' + data.length + ' users. ' + (copied ? 'Initials copied for Excel.' : 'Open Assignment log to copy their initials.');
    } catch(error) {
      if (error.databaseRejected) { countInput.disabled = false; requestId = crypto.randomUUID(); }
      assignStatus.textContent = error.message;
    }
    finally { assigning = false; assignButton.disabled = false; cancel.disabled = false; updateControls(); }
  });
  globalThis.addEventListener("sidekick-profile-saved", () => void refresh());
  globalThis.addEventListener("online", () => void refresh());
  globalThis.addEventListener("offline", () => { connected = false; updateControls(); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) void refresh(); });
  const poll = setInterval(() => { if (!document.hidden) void refresh(); }, 15000);
  globalThis.addEventListener("pagehide", () => { clearInterval(poll); if (channel) void client.removeChannel(channel); });
  void refresh();
})();
