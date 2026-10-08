(() => {
  document.getElementById('queueBetaAccessBtn')?.addEventListener('click',()=>{
    const dialog=document.createElement('dialog');
    dialog.className='prep-assignment-dialog systems-role-dialog';
    dialog.innerHTML='<form><h2>Device Prep Queue</h2><p class="hint-text">Private testing access. Enter the queue password.</p><label for="queueBetaCode">Password</label><input id="queueBetaCode" type="password" autocomplete="off" required><p class="status-line" role="status"></p><div class="queue-actions"><button type="submit">Open queue</button><button type="button">Cancel</button></div></form>';
    const input=dialog.querySelector('input'),buttons=[...dialog.querySelectorAll('button')];let busy=false;
    const close=()=>{input.value='';dialog.close();dialog.remove();};
    buttons[1].addEventListener('click',()=>{if(!busy)close();});
    dialog.addEventListener('cancel',event=>{event.preventDefault();if(!busy)close();});
    dialog.querySelector('form').addEventListener('submit',async event=>{
      event.preventDefault();if(busy)return;busy=true;buttons.forEach(b=>b.disabled=true);
      try {
        const result=await chrome.runtime.sendMessage({type:'sidekick-open-queue-beta',code:input.value});input.value='';
        if(!result?.ok)throw new Error(result?.error || 'Could not open queue.');close();
      } catch(error) {dialog.querySelector('[role="status"]').textContent=error.message;}
      finally {busy=false;buttons.forEach(b=>b.disabled=false);}
    });
    document.body.append(dialog);dialog.showModal();input.focus();
  });
})();
