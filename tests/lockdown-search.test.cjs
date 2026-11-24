const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../panel.js'),'utf8');
const search = source.slice(source.indexOf('let lockDownSearchRunning ='),source.indexOf('function lockDownImportTextFromHtml('));
const overview = 'https://intune.microsoft.com/#view/Microsoft_Intune_DeviceSettings/DevicesMenu/~/allDevices';
const lostModeScript = source.slice(source.indexOf('function openIntuneLockDownLostMode('),source.indexOf('let lockDownSearchRunning ='));

test('Locate selects only enabled Lost mode on verified serial, supports labelled menus and never clicks other actions',async()=>{
  for(const scenario of ['matching','wrong-device','disabled','duplicate-locate','unrelated-menu']) {
    let menuOpen=false,expire; const clicks=[];
    const visible={isConnected:true,getClientRects:()=>[{}],getAttribute:()=>null};
    const lost={...visible,textContent:'Lost mode (supervised only)',disabled:scenario==='disabled',click:()=>clicks.push('lost-mode')};
    const other={...visible,textContent:'Locate device',click:()=>{throw Error('Wrong action');}};
    const menu={...visible,getAttribute:key=>key==='aria-labelledby'?'locate-label':null,querySelectorAll:()=>[other,lost]};
    const locate={...visible,textContent:'Locate',click:()=>{clicks.push('locate');menuOpen=true;}};
    const toolbar={...visible,querySelectorAll:()=>scenario==='duplicate-locate'?[locate,locate]:[locate]};
    const context={location:{hostname:'sandbox-2.reactblade.portal.azure.net'},queueMicrotask,setTimeout:fn=>{expire=fn;return 1;},clearTimeout(){},
      MutationObserver:class{observe(){}disconnect(){}},getComputedStyle:()=>({display:'block',visibility:'visible'}),
      document:{body:{},getElementById:id=>id==='resourceViewToolbar'?toolbar:id==='locate-label'?{textContent:scenario==='unrelated-menu'?'Secure':'Locate'}:null,
        querySelectorAll:selector=>selector==='[role="menu"]'?(menuOpen?[menu]:[]):[{...visible,textContent:scenario==='wrong-device'?'OTHER':'SERIAL-001'}]}
    };
    vm.createContext(context);vm.runInContext(lostModeScript,context);
    const discovery=context.openIntuneLockDownLostMode('SERIAL-001');assert.equal(discovery.found,!['wrong-device','duplicate-locate'].includes(scenario));assert.equal(clicks.length,0);
    const pending=context.openIntuneLockDownLostMode('SERIAL-001',true);await new Promise(setImmediate);expire?.();const result=await pending;
    assert.equal(result.status,scenario==='matching'?'opened':['disabled','unrelated-menu'].includes(scenario)?'not-found':undefined);
    assert.deepEqual(clicks,scenario==='matching'?['locate','lost-mode']:['disabled','unrelated-menu'].includes(scenario)?['locate']:[]);
  }
});

function setup(scenario) {
  let deviceOpen = false;
  const requests=[],opened=[],activated=[];
  const fields={
    '[data-lock-down-begin]':{}, '[data-lock-down-lookup-status]':{textContent:''},
    '[data-lock-down-internal-serial]':{value:scenario==='missing'?'':' SERIAL-001 '},
    '[data-lock-down-device-number]':{value:'DTP8.0033'}
  };
  const entry={isConnected:true,querySelector:selector=>fields[selector]};
  const context={console,URL,Date,setTimeout,INTUNE_ALL_DEVICES_URL:overview,
    hasDeviceSystemsRole:async()=>scenario!=='wrong-role',
    isIntuneAllDevices:url=>url===overview,
    fillIntuneProfileSearch:function fillIntuneProfileSearch(){},
    openIntuneProfileDevice:function openIntuneProfileDevice(){},
    openIntuneLockDownLostMode:function openIntuneLockDownLostMode(){},
    fillIntuneLockDownLostMode:function fillIntuneLockDownLostMode(){},
    chrome:{tabs:{
      query:async()=>scenario==='new-tab'?[]:[{id:7,windowId:2,url:overview,active:true}],
      update:async id=>{activated.push(id);return{id,windowId:2};},
      create:async options=>{opened.push(options);return{id:9,windowId:2};},
      get:async()=>({url:deviceOpen?'https://intune.microsoft.com/#view/Microsoft_Intune_ManagedDevices/ManagedDeviceMenu.MenuView/~/overview/managedDeviceId/test-id':overview})
    },windows:{update:async()=>{}},scripting:{executeScript:async request=>{
      requests.push(request);
      if(request.func.name==='fillIntuneLockDownLostMode')return request.args?.[1]?[{result:{status:request.args[1]==='fill'?(scenario==='form-failed'?'not-ready':'filled'):'submitted'}}]:[{frameId:0,result:{found:true}}];
      if(request.func.name==='openIntuneProfileDevice'){deviceOpen=true;return[{result:{status:scenario==='no-result'?'not-found':scenario==='search-changed'?'search-changed':'opened'}}];}
      if(request.func.name==='openIntuneLockDownLostMode')return request.args?.[1]?[{result:{status:'opened'}}]:[{frameId:24,result:{found:true}}];
      if(request.target.allFrames){
        if(scenario==='changed')fields['[data-lock-down-internal-serial]'].value='OTHER';
        return scenario==='ambiguous'?[{frameId:13,result:{found:true}},{frameId:14,result:{found:true}}]:[{frameId:0,result:{found:false}},{frameId:13,result:{found:true}}];
      }
      return[{result:{entered:scenario!=='write-failed'}}];
    }}}
  };
  vm.createContext(context);vm.runInContext(search,context);
  return{context,entry,fields,requests,opened,activated};
}
test('Begin Lockdown searches and opens matching result, then discovers verified device controls and selects Lost Mode',async()=>{
  for(const scenario of ['existing','new-tab']) {
    const {context,entry,fields,requests,opened,activated}=setup(scenario);
    await context.beginLockDownSearch(entry);
    assert.equal(requests.length,8);assert.equal(requests[0].args,undefined);
    assert.deepEqual(Array.from(requests[1].target.frameIds),[13]);assert.deepEqual(Array.from(requests[1].args),['SERIAL-001']);
    assert.deepEqual(requests.map(r=>r.func.name),['fillIntuneProfileSearch','fillIntuneProfileSearch','openIntuneProfileDevice','openIntuneLockDownLostMode','openIntuneLockDownLostMode','fillIntuneLockDownLostMode','fillIntuneLockDownLostMode','fillIntuneLockDownLostMode']);
    assert.deepEqual(Array.from(requests[7].args),['SERIAL-001','submit']);
    assert.deepEqual(Array.from(requests[4].target.frameIds),[24]); assert.deepEqual(Array.from(requests[4].args),['SERIAL-001',true]);
    assert.deepEqual(Array.from(requests[2].target.frameIds),[13]);assert.deepEqual(Array.from(requests[2].args),['SERIAL-001']);
    assert.equal(opened.length,scenario==='new-tab'?1:0);assert.equal(activated.length,scenario==='existing'?1:0);
    if(opened.length)assert.equal(opened[0].url,overview);
    assert.match(fields['[data-lock-down-lookup-status]'].textContent,/Lost Mode request submitted for SERIAL-001/);
    assert.equal(fields['[data-lock-down-begin]'].disabled,false);
  }
});
test('missing serial, wrong role, ambiguous frames and changed card never write a serial',async()=>{
  for(const scenario of ['missing','wrong-role','ambiguous','changed']) {
    const {context,entry,requests,fields}=setup(scenario);
    await context.beginLockDownSearch(entry);
    assert.equal(requests.filter(r=>r.args).length,0);
    assert.doesNotMatch(fields['[data-lock-down-lookup-status]'].textContent,/Search complete/);
  }
});
test('failed Intune write reports a retry message and releases the button',async()=>{
  const {context,entry,fields}=setup('write-failed');await context.beginLockDownSearch(entry);
  assert.match(fields['[data-lock-down-lookup-status]'].textContent,/did not keep/);
  assert.equal(fields['[data-lock-down-begin]'].disabled,false);
});

test('missing or changed results stop without opening any further device actions',async()=>{
  for(const scenario of ['no-result','search-changed']) {
    const {context,entry,fields,requests}=setup(scenario);await context.beginLockDownSearch(entry);
    assert.equal(requests.length,3);assert.equal(requests.at(-1).func.name,'openIntuneProfileDevice');
    assert.match(fields['[data-lock-down-lookup-status]'].textContent,scenario==='no-result'?/No unique matching/:/search changed/);
    assert.equal(fields['[data-lock-down-begin]'].disabled,false);
  }
});

test('failed form verification never sends the OK action',async()=>{
  const {context,entry,requests,fields}=setup('form-failed');await context.beginLockDownSearch(entry);
  assert.equal(requests.some(r=>r.func.name==='fillIntuneLockDownLostMode'&&r.args[1]==='submit'),false);
  assert.match(fields['[data-lock-down-lookup-status]'].textContent,/No OK click/);
});

test('Lost Mode form enables, fills exact requested values and submits only when unchanged',async()=>{
  const code=source.slice(source.indexOf('function fillIntuneLockDownLostMode('),source.indexOf('function openIntuneLockDownLostMode('));
  for(const scenario of ['matching','wrong-device','changed-message','duplicate-ok']) {
    const clicks=[];let expire;
    const base={isConnected:true,getClientRects:()=>[{}],getAttribute:()=>null};
    class Input {constructor(label){Object.assign(this,base);this.label=label;this.labels=[{textContent:label}];this.disabled=true;}get value(){return this._value||'';}set value(value){this._value=value;}dispatchEvent(){return true;}}
    class Textarea extends Input {}
    const message=new Textarea('Messages to display on lock screen'),phone=new Input('Phone number to display');
    const enable={...base,textContent:'Enable',checked:false,click(){clicks.push('enable');this.checked=true;message.disabled=false;phone.disabled=false;}};
    const ok={...base,textContent:'OK',click:()=>clicks.push('ok')};
    const panel={...base,textContent:'Lost Mode (supervised only) iPad-'+(scenario==='wrong-device'?'OTHER':'SERIAL-001'),
      querySelectorAll:selector=>selector.includes('radio')?[enable]:selector==='input, textarea'?[message,phone]:scenario==='duplicate-ok'?[ok,ok]:[ok]};
    const heading={...base,textContent:'Lost Mode (supervised only)',closest:()=>panel};
    const context={location:{origin:'https://intune.microsoft.com',hash:'#view/Microsoft_Intune_ManagedDevices/ManagedDeviceMenu.MenuView/~/overview/managedDeviceId/test'},
      HTMLInputElement:Input,HTMLTextAreaElement:Textarea,Event:class{constructor(type){this.type=type;}},queueMicrotask,
      setTimeout:fn=>{expire=fn;return 1;},clearTimeout(){},MutationObserver:class{observe(){}disconnect(){}},getComputedStyle:()=>({display:'block',visibility:'visible'}),
      document:{body:{},querySelectorAll:()=>[heading],getElementById:()=>null}
    };
    // Native textarea has its own value accessor, as browsers do.
    Object.defineProperty(Textarea.prototype,'value',Object.getOwnPropertyDescriptor(Input.prototype,'value'));
    vm.createContext(context);vm.runInContext(code,context);
    assert.equal(context.fillIntuneLockDownLostMode('SERIAL-001').found,scenario!=='wrong-device');
    const pending=context.fillIntuneLockDownLostMode('SERIAL-001','fill');await new Promise(setImmediate);expire?.();const filled=await pending;
    if(scenario==='wrong-device'){assert.deepEqual(clicks,[]);continue;}
    assert.equal(message.value,'This device is durable medical equipment, property of Smartbox. If found, please contact 877-392-2299 ext.6 or trials.us@smartboxaac.com');
    assert.equal(phone.value,'877-392-2299 ext.6');assert.deepEqual(clicks,['enable']);
    if(scenario==='changed-message')message.value='Changed';
    const result=context.fillIntuneLockDownLostMode('SERIAL-001','submit');
    assert.equal(result.status,scenario==='matching'?'submitted':'form-changed');
    assert.equal(clicks.filter(c=>c==='ok').length,scenario==='matching'?1:0);
  }
});
