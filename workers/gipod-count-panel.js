(() => {
  const container = document.getElementById("systemsCounters");
  const value = document.getElementById("gipodCount"), status = document.getElementById("gipodStatus");
  let pending = false;
  async function refresh() {
    if (pending) return;
    pending = true;
    try {
      const stored = await chrome.storage.local.get("ttmtSidekickUserProfile");
      container.hidden = stored.ttmtSidekickUserProfile?.role !== "Device Systems Coordinator";
      if (container.hidden) return;
      const result = await chrome.runtime.sendMessage({ type: "sidekick-gipod-count" });
      if (!result?.ok) throw new Error(result?.error || "Count unavailable. Retrying automatically.");
      value.textContent = result.count === null ? "—" : String(result.count);
      status.textContent = result.error ? `${result.count === null ? "" : "Last known count. "}${result.error}` : "";
    } catch (error) { value.textContent = "—"; status.textContent = error.message; }
    finally { pending = false; }
  }
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && (changes.ttmtSidekickUserProfile || changes.sidekickGipodCount)) void refresh();
  });
  setInterval(() => void refresh(), 30000);
  void refresh();
})();
