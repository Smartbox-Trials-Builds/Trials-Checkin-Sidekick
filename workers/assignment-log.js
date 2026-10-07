(() => {
 const client = globalThis.sidekickSupabase.getClient(), list = document.getElementById('assignmentLogEntries'), status = document.getElementById('assignmentLogStatus');
 let busy = false;
 async function refresh() {
  if (busy) return; busy = true;
  try {
   const session = await client.auth.getSession();
   if (!session.data.session) throw new Error('Sign in to view the assignment log.');
   const profile = await client.from('sidekick_user_profiles').select('role').eq('user_id',session.data.session.user.id).single();
   if (profile.error || profile.data.role !== 'Device Systems Coordinator') throw new Error('Only Device Systems Coordinators can view the assignment log.');
   const result = await client.from('sidekick_assignment_log').select().order('created_at',{ascending:false}).order('id');
   if (result.error) throw result.error;
   list.replaceChildren();
   for (const batch of result.data) {
    const card = document.createElement('article'); card.className = 'prep-notification';
    const title = document.createElement('strong'); title.textContent = batch.assigner_name;
    const time = document.createElement('p'); time.textContent = new Date(batch.created_at).toLocaleString('en-US',{timeZone:'America/Chicago'}) + ' Central';
    const initials = document.createElement('p'); initials.textContent = batch.initials.join(', ');
    const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'toggle-btn queue-small-btn'; copy.textContent = 'Copy initials';
    copy.addEventListener('click',async () => { try { await navigator.clipboard.writeText(batch.initials.join('\r\n')); status.textContent = 'Initials copied as Excel rows.'; } catch { status.textContent = 'Could not copy. Please try again.'; } });
    card.append(title,time,initials,copy); list.append(card);
   }
   status.textContent = result.data.length ? '' : 'No assignments since the last 8 PM reset.';
  } catch(error) { list.replaceChildren(); status.textContent = error.message || 'Could not load assignment log.'; }
  finally { busy = false; }
 }
 const poll = setInterval(refresh,10000);
 globalThis.addEventListener('online',refresh);
 document.addEventListener('visibilitychange',() => { if (!document.hidden) void refresh(); });
 globalThis.addEventListener('pagehide',() => clearInterval(poll));
 void refresh();
})();