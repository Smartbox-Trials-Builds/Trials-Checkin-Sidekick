(() => {
  const client = globalThis.sidekickSupabase.getClient();
  const LINK = 'sidekickDesktopPairing';
  const REQUEST = 'sidekickDesktopZipRequest';
  const status = document.getElementById('desktopZipStatus');
  const encode = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const decode = text => Uint8Array.from(atob(text.replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0));
  async function keyFor(code) { return crypto.subtle.importKey('raw',decode(code),'AES-GCM',false,['encrypt','decrypt']); }
  async function encrypt(code,id,value) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(id)},await keyFor(code),new TextEncoder().encode(JSON.stringify(value)));
    return {iv:encode(iv),data:encode(new Uint8Array(encrypted))};
  }
  async function decrypt(code,id,envelope) {
    const plain = await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(envelope.iv),additionalData:new TextEncoder().encode(id)},await keyFor(code),decode(envelope.data));
    return JSON.parse(new TextDecoder().decode(plain));
  }
  async function getLink() {
    const link = (await chrome.storage.local.get(LINK))[LINK];
    if (!link) return null;
    const session = await client.auth.getSession();
    if (session.data.session?.user.id !== link.ownerId) throw new Error('Pair the helper again for your current Sidekick profile.');
    return link;
  }
  async function updateStatus() {
    try {
      const link = await getLink();
      if (!link) { status.textContent = 'Not paired. Pair the desktop helper before zipping vocabulary files.'; return; }
      const {data,error} = await client.from('sidekick_desktop_links').select('heartbeat,owner_id').eq('helper_id',link.helperId).single();
      status.textContent = !error && data.owner_id === link.ownerId && Date.now()-new Date(data.heartbeat).getTime()<30000 ? 'Helper paired and online. Next Step will zip and name files automatically.' : 'Helper paired but offline. Open it and click Connect to Sidekick.';
    } catch(error) { status.textContent = error.message; }
  }
  document.getElementById('desktopZipPairBtn').addEventListener('click',async event => {
    const button = event.currentTarget; button.disabled = true;
    try {
      const input = document.getElementById('desktopZipPairCode'),code = input.value.trim();
      if (!/^[A-Za-z0-9_-]{43}$/.test(code) || decode(code).length!==32) throw new Error('Paste the pairing code copied by the desktop helper.');
      const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256',decode(code)))].map(x=>x.toString(16).padStart(2,'0')).join('');
      const session = await client.auth.getSession();
      if (!session.data.session) throw new Error('Save your Sidekick profile first.');
      const {data,error} = await client.rpc('sidekick_pair_desktop',{p_hash:hash});
      if (error) throw error;
      await chrome.storage.local.set({[LINK]:{helperId:data.helper_id,code,ownerId:session.data.session.user.id}});
      input.value = ''; await updateStatus();
    } catch(error) { status.textContent = error.message; }
    finally { button.disabled = false; }
  });
  document.getElementById('desktopZipDisconnectBtn').addEventListener('click',async () => { await chrome.storage.local.remove(LINK); await updateStatus(); });
  async function zip(names, onProgress = () => {}) {
    const link = await getLink();
    if (!link) throw new Error("Pair the desktop zipper in User settings before continuing.");
    const signature = JSON.stringify(names);
    let request = (await chrome.storage.session.get(REQUEST))[REQUEST];
    if (request && request.signature !== signature) throw new Error('A different ZIP request is still recorded. Finish or check that request before changing the client.');
    if (!request) {
      request = {id:crypto.randomUUID(),signature};
      await chrome.storage.session.set({[REQUEST]:request});
    }
    const {error} = await client.rpc('sidekick_request_zip',{p_helper:link.helperId,p_id:request.id,p_payload:await encrypt(link.code,request.id,names)});
    if (error) throw new Error(error.message);
    const deadline = Date.now()+1800000;
    while (Date.now()<deadline) {
      const {data,error} = await client.from('sidekick_zip_jobs').select('status,result,progress,phase').eq('id',request.id).single();
      if (error) throw new Error('Could not check ZIP progress. Keep the helper open and click Next Step again to check the same request.');
      onProgress({percent:data.status === 'done' ? 100 : data.progress || 0,phase:data.phase || 'waiting'});
      if (data.status==='done' || data.status==='failed') {
        const result = await decrypt(link.code,request.id,data.result);
        if (data.status==='failed') { await chrome.storage.session.remove(REQUEST); throw new Error(result.error || 'The helper could not zip the files.'); }
        return result;
      }
      if (data.status==='expired') { await chrome.storage.session.remove(REQUEST); throw new Error('The ZIP request expired before the helper picked it up. Reconnect the helper and try again.'); }
      await new Promise(resolve=>setTimeout(resolve,1500));
    }
    throw new Error('Still waiting for the helper. Check its window, then click Next Step again to check this request without re-zipping.');
  }
  globalThis.sidekickDesktopZip = {zip,clear:()=>chrome.storage.session.remove(REQUEST)};
  const poll = setInterval(updateStatus,15000);
  globalThis.addEventListener('pagehide',()=>clearInterval(poll));
  void updateStatus();
})();
