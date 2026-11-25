(() => {
  const view = document.getElementById("intuneLicensesView");
  const status = document.getElementById("intuneLicenseStatus");
  const updated = document.getElementById("intuneLicenseUpdated");
  const rows = document.getElementById("intuneLicenseRows");
  const buttons = ["intuneLicenseConnect", "intuneLicenseRefresh", "intuneLicenseDisconnect"].map(id => document.getElementById(id));
  let busy = false;
  const send = async action => {
    const result = await chrome.runtime.sendMessage({ type: `sidekick-intune-license-${action}` });
    if (!result?.ok) throw new Error(result?.error || "Microsoft connection unavailable. Reload Sidekick and try again.");
    return result;
  };
  function render(data) {
    rows.replaceChildren();
    for (const app of data.rows) {
      const row = document.createElement("tr");
      const count = value => value === 2147483647 ? "Unlimited" : value ?? "—";
      for (const value of [app.name, count(app.total), count(app.available), count(app.used)]) {
        const cell = document.createElement("td");
        cell.textContent = String(value);
        row.append(cell);
      }
      rows.append(row);
    }
    updated.textContent = `Updated ${new Date(data.updatedAt).toLocaleString()}.`;
  }
  async function run(action) {
    if (busy) return;
    busy = true;
    buttons.forEach(button => { button.disabled = true; });
    try {
      if (!(await hasDeviceSystemsRole())) throw new Error("App License Monitor is available to Device Systems Coordinators.");
      status.textContent = action === "connect" ? "Waiting for Microsoft sign-in…" : action === "disconnect" ? "Disconnecting…" : "Reading Intune license counts…";
      if (action === "connect" || action === "disconnect") { rows.replaceChildren(); updated.textContent = ""; }
      const result = await send(action);
      if (action === "disconnect") { status.textContent = "Microsoft account disconnected."; return; }
      const data = action === "connect" ? await send("refresh") : result;
      if (!(await hasDeviceSystemsRole())) { rows.replaceChildren(); updated.textContent = ""; return; }
      render(data);
      status.textContent = data.rows.length ? "" : "No matching apps were returned for this account.";
    } catch (error) {
      status.textContent = `${error.message}${rows.children.length ? " Showing the last successful counts." : ""}`;
    } finally {
      busy = false;
      buttons.forEach(button => { button.disabled = false; });
    }
  }
  document.getElementById("intuneLicensesBtn").addEventListener("click", async () => {
    if (!(await hasDeviceSystemsRole())) return;
    showView("intuneLicensesView");
    void run("refresh");
  });
  document.getElementById("intuneLicenseConnect").addEventListener("click", () => void run("connect"));
  document.getElementById("intuneLicenseRefresh").addEventListener("click", () => void run("refresh"));
  document.getElementById("intuneLicenseDisconnect").addEventListener("click", () => void run("disconnect"));
  document.getElementById("intuneLicenseReturn").addEventListener("click", () => showLandingView());
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.ttmtSidekickUserProfile) {
      rows.replaceChildren(); updated.textContent = "";
      if (view.style.display !== "none") void hasDeviceSystemsRole().then(allowed => { if (!allowed) showLandingView(); });
    }
  });
})();
