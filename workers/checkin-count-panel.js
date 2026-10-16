(() => {
  const section = document.getElementById('systemsCheckinCounter');
  const value = document.getElementById('systemsCheckinTotal');
  const status = document.getElementById('systemsCheckinStatus');
  let refreshing = false;
  async function refresh() {
    if (refreshing) return;
    refreshing = true;
    try {
      const stored = await chrome.storage.local.get('ttmtSidekickUserProfile');
      const isSystems = stored.ttmtSidekickUserProfile?.role === 'Device Systems Coordinator';
      section.hidden = !isSystems;
      if (!isSystems || document.getElementById('landingView').style.display === 'none') return;
      const { data, error } = await globalThis.sidekickSupabase.getClient().rpc('sidekick_daily_checkin_total');
      if (error) throw error;
      value.textContent = String(data.total);
      status.textContent = 'All Device Coordinators · Today, Central time';
    } catch {
      value.textContent = '—';
      status.textContent = 'Count unavailable. Retrying automatically.';
    } finally { refreshing = false; }
  }
  globalThis.sidekickCheckinCount = Object.freeze({ refresh });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.ttmtSidekickUserProfile) void refresh();
  });
  setInterval(() => void refresh(), 30000);
  void refresh();
})();
