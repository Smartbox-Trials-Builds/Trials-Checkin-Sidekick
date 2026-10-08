(() => {
  const section = document.getElementById("coordinatorQueueSection");
  const placeholder = document.getElementById("coordinatorQueueDetached");
  const body = document.getElementById("coordinatorQueueBody");
  const toggle = document.getElementById("toggleCoordinatorQueueBtn");
  const popOut = document.getElementById("popOutCoordinatorQueueBtn");
  const status = document.getElementById("queueWindowStatus") || document.getElementById("coordinatorQueueStatus");
  const detachedPage = location.pathname.endsWith("/queue-window.html");

  function apply(values) {
    if (!detachedPage) { section.hidden = true; if (placeholder) placeholder.hidden = true; return; }
    const detached = values.sidekickQueueDetached === true;
    if (!detachedPage) {
      section.hidden = detached;
      if (placeholder) placeholder.hidden = !detached;
      const collapsed = values.sidekickQueueCollapsed === true;
      body.hidden = collapsed;
      section.dataset.collapsed = String(collapsed);
      if (popOut) popOut.hidden = collapsed;
      if (toggle) {
        toggle.textContent = collapsed ? "Show Queue" : "Hide";
        toggle.setAttribute("aria-expanded", String(!collapsed));
      }
    }
  }
  async function load() {
    apply(await chrome.storage.local.get(["sidekickQueueDetached", "sidekickQueueCollapsed"]));
  }
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && (changes.sidekickQueueDetached || changes.sidekickQueueCollapsed)) void load();
  });
  toggle?.addEventListener("click", async () => {
    try { await chrome.storage.local.set({ sidekickQueueCollapsed: !body.hidden }); }
    catch { status.textContent = "Could not save the queue display preference."; }
  });
  async function request(type, button) {
    button.disabled = true;
    try {
      const result = await chrome.runtime.sendMessage({ type });
      if (!result?.ok) throw new Error(result?.error || "Could not update the queue window.");
      if (status) status.textContent = "";
    } catch (error) { if (status) status.textContent = error.message; }
    finally { button.disabled = false; }
  }
  for (const [id, type] of [
    ["popOutCoordinatorQueueBtn", "sidekick-open-queue"],
    ["focusCoordinatorQueueBtn", "sidekick-open-queue"],
    ["returnCoordinatorQueueBtn", "sidekick-return-queue"]
  ]) {
    const button = document.getElementById(id);
    button?.addEventListener("click", () => void request(type, button));
  }
  void load();
  void chrome.runtime.sendMessage({ type: "sidekick-reconcile-windows" }).catch(() => {});
})();
