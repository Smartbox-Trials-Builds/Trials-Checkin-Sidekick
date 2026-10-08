(() => {
  let pending;
  globalThis.verifyDeviceSystemsRole = async () => {
    if (pending) return pending;
    const client = globalThis.sidekickSupabase.getClient();
    const session = await client.auth.getSession();
    if (session.error) throw session.error;
    if (!session.data.session) {
      const signed = await client.auth.signInAnonymously();
      if (signed.error) throw signed.error;
    }
    const checked = await client.rpc('sidekick_verify_systems', {p_code:null});
    if (checked.error) throw checked.error;
    if (checked.data) return true;
    pending = new Promise(resolve => {
      const dialog = document.createElement('dialog');
      dialog.className = 'prep-assignment-dialog systems-role-dialog';
      dialog.innerHTML = '<form><h2>Device Systems access</h2><p class="hint-text">Enter the passcode once to unlock this role for your profile.</p><label for="systemsRoleCode">Passcode</label><input id="systemsRoleCode" type="password" autocomplete="off" required><p role="status" class="status-line"></p><div class="queue-actions"><button type="submit">Verify</button><button type="button">Cancel</button></div></form>';
      const input = dialog.querySelector('input'), form = dialog.querySelector('form');
      const buttons = [...dialog.querySelectorAll('button')]; let busy = false;
      const finish = value => { input.value = ''; dialog.close(); dialog.remove(); pending = null; resolve(value); };
      buttons[1].addEventListener('click',()=>{ if (!busy) finish(false); });
      dialog.addEventListener('cancel',event=>{event.preventDefault();if (!busy) finish(false);});
      form.addEventListener('submit',async event=>{
        event.preventDefault();if (busy) return;
        busy=true;buttons.forEach(b=>b.disabled=true);
        try {
          const result = await client.rpc('sidekick_verify_systems',{p_code:input.value});
          input.value='';
          if (result.error) throw result.error;
          if (result.data) { finish(true); return; }
          dialog.querySelector('[role="status"]').textContent='Incorrect passcode. Try again.';
        } catch(error) { dialog.querySelector('[role="status"]').textContent=error.message || 'Could not verify passcode.'; }
        finally { busy=false;buttons.forEach(b=>b.disabled=false);if(dialog.isConnected)input.focus(); }
      });
      document.body.append(dialog);dialog.showModal();input.focus();
    });
    return pending;
  };
})();
