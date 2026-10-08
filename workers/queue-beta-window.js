(async () => {
  try {
    const client=globalThis.sidekickSupabase.getClient();
    const session=await client.auth.getSession();
    const user=session.data.session?.user.id;
    const allowed=await chrome.storage.session.get('sidekickQueueBetaUser');
    if(!user || allowed.sidekickQueueBetaUser!==user)throw new Error('Locked');
    const profile=await client.from('sidekick_user_profiles').select('role').eq('user_id',user).single();
    if(profile.error || profile.data.role!=='Device Systems Coordinator')throw new Error('Locked');
    document.body.style.visibility='visible';
  } catch { window.close(); }
})();
