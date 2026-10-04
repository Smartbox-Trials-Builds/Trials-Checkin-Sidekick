(() => {
  const api = globalThis.sidekickSupabase;
  const client = api.getClient();
  const join = document.getElementById("joinCoordinatorQueueBtn");
  const indicator = document.getElementById("coordinatorQueueIndicator");
  const list = document.getElementById("coordinatorQueueList");
  const status = document.getElementById("coordinatorQueueStatus");
  const dialog = document.getElementById("prepAssignmentDialog");
  const form = document.getElementById("prepAssignmentForm");
  const rowInput = document.getElementById("prepAssignmentRow");
  const crmInput = document.getElementById("prepAssignmentCrm");
  const clientInput = document.getElementById("prepAssignmentClient");
  const deviceInput = document.getElementById("prepAssignmentDevice");
  const priorityInput = document.getElementById("prepAssignmentPriority");
  const assignButton = document.getElementById("prepAssignmentSubmit");
  const cancel = document.getElementById("prepAssignmentCancel");
  const assignStatus = document.getElementById("prepAssignmentStatus");
  let profile = null;
  let queue = [];
  let selectedEntry = null;
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
    updateIndicator();
  }

  function renderQueue() {
    list.replaceChildren();
    for (const entry of queue) {
      const item = document.createElement("li");
      const canAssign = profile?.role === "Device Systems Coordinator";
      const reserved = entry.reserved_by && new Date(entry.reserved_until).getTime() > Date.now();
      const label = document.createElement(canAssign ? "button" : "span");
      label.textContent = `${entry.name} (${entry.dashboard_initials})${entry.user_id === profile?.user_id ? " — You" : ""}${reserved ? " · Reserved" : ""}`;
      if (canAssign) {
        label.type = "button";
        label.className = "toggle-btn queue-user";
        label.disabled = Boolean(reserved && entry.reserved_by !== profile.user_id);
        label.addEventListener("click", () => {
          selectedEntry = entry;
          document.getElementById("prepAssignmentUser").textContent = `${entry.name} (${entry.dashboard_initials})`;
          rowInput.value = "";
          crmInput.value = "";
          clientInput.value = "";
          deviceInput.value = "";
          priorityInput.value = "";
          assignStatus.textContent = "";
          dialog.showModal();
          crmInput.focus();
        });
      }
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
  cancel.addEventListener("click", () => dialog.close());
  dialog.addEventListener("cancel", event => { if (assigning) event.preventDefault(); });
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (assigning || !selectedEntry || !form.reportValidity()) return;
    const row = rowInput.value.trim() ? Number(rowInput.value) : null;
    if (row !== null && (!Number.isInteger(row) || row < 1 || row > 2147483647)) return;
    const crmId = crmInput.value.trim();
    if (!crmId || crmId.length > 100) {
      assignStatus.textContent = "Enter a CRM ID (up to 100 characters).";
      crmInput.focus();
      return;
    }
    const clientName = clientInput.value.trim();
    if (!clientName || clientName.length > 200) {
      assignStatus.textContent = "Enter a client name (up to 200 characters).";
      clientInput.focus();
      return;
    }
    if (!["Talkpad", "Zuvo", "Gridpad", "Wego"].includes(deviceInput.value) ||
        !["Expedite", "Funded rental", "Ship request", "Daily queue"].includes(priorityInput.value)) {
      assignStatus.textContent = "Select a device type and priority.";
      return;
    }
    assigning = true;
    assignButton.disabled = true;
    cancel.disabled = true;
    assignStatus.textContent = "Assigning prep…";
    try {
      const { data: notificationId, error } = await client.rpc("sidekick_assign_prep", {
        p_entry_id: selectedEntry.id,
        p_row_number: row,
        p_crm_id: crmId,
        p_device_type: deviceInput.value,
        p_priority: priorityInput.value
      });
      if (error) throw new Error(error.message || "Could not assign the prep. Please try again.");
      clientInput.value = "";
      let nameDelivered = true;
      try {
        await api.sendLiveClientName({ recipientId: selectedEntry.user_id, notificationId, name: clientName, senderId: profile.user_id });
      } catch { nameDelivered = false; }
      dialog.close();
      await refresh();
      if (!nameDelivered) status.textContent = "Prep assigned. The client name could not be sent live; CRM ID, device and priority were delivered.";
    } catch (error) { assignStatus.textContent = error.message; }
    finally { assigning = false; assignButton.disabled = false; cancel.disabled = false; }
  });
  globalThis.addEventListener("sidekick-profile-saved", () => void refresh());
  globalThis.addEventListener("online", () => void refresh());
  globalThis.addEventListener("offline", () => { connected = false; updateControls(); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) void refresh(); });
  const poll = setInterval(() => { if (!document.hidden) void refresh(); }, 15000);
  globalThis.addEventListener("pagehide", () => { clearInterval(poll); if (channel) void client.removeChannel(channel); });
  void refresh();
})();
