(() => {
  const client = globalThis.sidekickSupabase.getClient();
  const container = document.getElementById("prepAssignmentNotifications");
  const status = document.getElementById("assignmentWindowStatus");
  let channel;
  let userId;
  let refreshing = false;
  let refreshAgain = false;

  function render(entries) {
    const active = new Set(entries.map(entry => entry.id));
    for (const card of [...container.children]) if (!active.has(card.dataset.id)) card.remove();
    for (const entry of entries) {
      const existingCard = [...container.children].find(card => card.dataset.id === entry.id);
      if (existingCard) {
        if (existingCard.clientNameValue) existingCard.clientNameValue.textContent = entry.liveClientName || "Not available — live delivery only";
        continue;
      }
      const card = document.createElement("div");
      card.className = "prep-notification";
      card.dataset.id = entry.id;
      const message = document.createElement("p");
      message.textContent = "You have been assigned a prep. Look for your initials on the Dashboard and the device prep slip.";
      const details = document.createElement("dl");
      details.className = "prep-assignment-details";
      for (const [label, value] of [
        ["Client", entry.assignment_request_id ? null : entry.liveClientName || "Not available — live delivery only"],
        ["Device", entry.device_type],
        ["CRM ID", entry.crm_id],
        ["Row", entry.row_number],
        ["Priority", entry.priority]
      ]) {
        if (!value) continue;
        const term = document.createElement("dt");
        const description = document.createElement("dd");
        term.textContent = label;
        description.textContent = value;
        if (label === "Client") card.clientNameValue = description;
        if (label === "Priority") {
          description.className = "prep-priority";
          description.dataset.priority = value;
        }
        details.append(term, description);
      }
      const close = document.createElement("button");
      close.type = "button";
      close.className = "toggle-btn";
      close.textContent = "Close";
      close.setAttribute("aria-label", "Close prep assignment");
      const errorText = document.createElement("div");
      errorText.setAttribute("role", "status");
      const openCrm = document.createElement("button");
      openCrm.type = "button";
      openCrm.className = "toggle-btn";
      openCrm.textContent = "Open CRM";
      openCrm.disabled = !entry.crm_id;
      openCrm.addEventListener("click", async () => {
        const url = globalThis.sidekickCrmLinks.build(entry.crm_id);
        if (!url) return;
        try {
          await chrome.tabs.create({ url });
        } catch { errorText.textContent = "Could not open CRM. Please try again."; }
      });
      close.addEventListener("click", async () => {
        close.disabled = true;
        try {
          const { error } = await client.rpc("sidekick_queue_action", { p_action: "dismiss", p_notification_id: entry.id });
          if (error) throw error;
          card.remove();
          await chrome.runtime.sendMessage({ type: "sidekick-check-notifications" });
          void refresh();
        } catch {
          errorText.textContent = "Could not close the assignment. Check your connection and try again.";
          close.disabled = false;
        }
      });
      card.append(message);
      if (details.children.length) card.append(details);
      card.append(close);
      if (entry.crm_id) card.append(openCrm);
      card.append(errorText);
      container.append(card);
    }
  }
  async function refresh() {
    if (refreshing) { refreshAgain = true; return; }
    refreshing = true;
    try {
      const { data, error } = await client.auth.getSession();
      if (error || !data.session) throw new Error("No user session");
      if (userId !== data.session.user.id) {
        if (channel) await client.removeChannel(channel);
        userId = data.session.user.id;
        await client.realtime.setAuth(data.session.access_token);
        channel = client.channel(`sidekick-assignment-window-${userId}`)
          .on("postgres_changes", { event: "*", schema: "public", table: "sidekick_prep_notifications", filter: `user_id=eq.${userId}` }, () => void refresh())
          .subscribe(state => { if (state === "SUBSCRIBED") void refresh(); });
      }
      const result = await client.from("sidekick_prep_notifications").select().is("dismissed_at", null).order("created_at");
      if (result.error) throw result.error;
      const stored = await chrome.storage.local.get("sidekickPendingDismissals");
      const live = await chrome.storage.session.get("sidekickLiveClientNames");
      const pending = new Set(stored.sidekickPendingDismissals || []);
      const visible = result.data.filter(entry => !pending.has(entry.id))
        .map(entry => ({ ...entry, liveClientName: live.sidekickLiveClientNames?.[entry.id] || "" }));
      render(visible);
      status.textContent = visible.length ? "" : "All assignments closed.";
      if (!visible.length) void chrome.runtime.sendMessage({ type: "sidekick-check-notifications" }).catch(() => {});
    } catch { status.textContent = "Connection unavailable. Your assignment will remain here while we reconnect."; }
    finally {
      refreshing = false;
      if (refreshAgain) { refreshAgain = false; void refresh(); }
    }
  }
  const poll = setInterval(() => void refresh(), 15000);
  globalThis.addEventListener("online", () => void refresh());
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "session" && changes.sidekickLiveClientNames) void refresh();
  });
  globalThis.addEventListener("pagehide", () => { clearInterval(poll); if (channel) void client.removeChannel(channel); });
  void refresh();
})();
