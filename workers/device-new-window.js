globalThis.sidekickNewDeviceWindow = true;
async function hasDeviceSystemsRole() {
  return (await chrome.storage.local.get("ttmtSidekickUserProfile")).ttmtSidekickUserProfile?.role === "Device Systems Coordinator";
}
function showView(id) {
  document.getElementById("apiWipeTestView").style.display = id === "apiWipeTestView" ? "block" : "none";
}
function showLandingView() { window.close(); }
