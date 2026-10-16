// Durable outbox: retry shared counts independently of the panel and workflow.
(() => {
  const PREFIX = 'sidekickPendingCheckin:';
  const ALARM = 'sidekick-checkin-count-sync';
  const client = globalThis.sidekickSupabase.getClient();
  let jobs = Promise.resolve();
  function enqueue(task) {
    const result = jobs.then(task);
    jobs = result.catch(error => console.warn('Check-in count sync:', error.message));
    return result;
  }
  async function flush() {
    const { data, error } = await client.auth.getSession();
    if (error || !data.session) return;
    const pending = await chrome.storage.local.get(null);
    for (const [key, entry] of Object.entries(pending)) {
      if (!key.startsWith(PREFIX) || entry.userId !== data.session.user.id) continue;
      const { error } = await client.rpc('sidekick_record_checkin', {
        p_completion_id: entry.completionId, p_completed_at: entry.completedAt
      });
      if (error) throw error;
      await chrome.storage.local.remove(key);
    }
  }
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (message?.type !== 'sidekick-record-checkin' || sender.id !== chrome.runtime.id) return;
    enqueue(async () => {
      const { data, error } = await client.auth.getSession();
      if (error || !data.session) throw new Error('Check-in count needs a signed-in profile.');
      if (!/^[0-9a-f-]{36}$/i.test(message.completionId || '')) throw new Error('Missing completion ID.');
      const key = PREFIX + data.session.user.id + ':' + message.completionId;
      const stored = await chrome.storage.local.get(key);
      // Preserve the original completion day on duplicate delivery or retry.
      if (!stored[key]) await chrome.storage.local.set({ [key]: {
        userId: data.session.user.id, completionId: message.completionId,
        completedAt: new Date().toISOString()
      } });
      respond({ ok: true });
      await flush().catch(error => console.warn('Check-in count sync:', error.message));
    }).catch(error => respond({ ok: false, error: error.message }));
    return true;
  });
  chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === ALARM) void enqueue(flush).catch(() => {});
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes['sidekick-supabase-session']) void enqueue(flush).catch(() => {});
  });
  void chrome.alarms.create(ALARM, { periodInMinutes: 1 });
  void enqueue(flush).catch(() => {});
})();
