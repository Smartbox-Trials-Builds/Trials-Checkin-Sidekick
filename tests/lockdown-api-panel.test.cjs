const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../workers/lockdown-api-panel.js'),'utf8');
function setup(approved=true, scanOptions={}){
 const calls=[],confirmations=[],nodes={};
 const node=()=>({focus(){this.focused=true;},disabled:false,textContent:'',children:[],addEventListener(type,fn){this.click=fn;},replaceChildren(){this.children=[];},appendChild(child){this.children.push(child);}});
 for(const id of ['lockDownApiStatus','lockDownApiResults','lockDownSubmitBtn','lockDownBulkBtn','lockDownConnectBtn','lockDownResumeBtn','lockDownCheckBtn','lockDownStopBtn','lockDownScanInput','lockDownScanStatus','lockDownScanForm','lockDownScanSection'])nodes[id]=node();
 const rows=['SERIAL1234','SECOND1234'].map(value=>({isConnected:true,result:node(),querySelector(selector){return selector==='[data-lock-down-internal-serial]'?{value}:this.result;}}));
 let batch;
 const context={hasDeviceSystemsRole:async()=>scanOptions.access!==false,
 addLockDownEntry:values=>{const result=node();const row={dataset:{disableOnly:values.disableOnly?'true':'false'},isConnected:true,result,querySelector:selector=>selector==='[data-lock-down-internal-serial]'?{value:values.internalSerial}:selector==='[data-lock-down-device-number]'?{value:values.deviceNumber}:result};rows.push(row);return row;},window:{confirm:text=>{confirmations.push(text);return approved;}},document:{getElementById:id=>nodes[id],querySelectorAll:selector=>selector.includes('.lock-down-entry')?rows:Object.values(nodes),createElement:node},chrome:{runtime:{sendMessage:async message=>{
 calls.push(message);
 if(message.type==='sidekick-audit-lookup') return scanOptions.lookup?await scanOptions.lookup(message.device):{ok:true,internalSerial:'SCAN123456'};
 if(message.action==='lockdown-start')batch={mode:message.mode,nonce:'current',stage:'review',items:message.serials.map(serial=>({serial,status:'ready',device:{deviceName:'iPad-'+serial}}))};
 if(message.action==='lockdown-approve'){batch.stage='running';batch.items.forEach(item=>item.status='queued');}
 if(message.action==='lockdown-stop')batch.stage='stopped';
 if(message.action==='lockdown-step'){batch.items.find(item=>item.status==='queued').status='requested';if(!batch.items.some(item=>item.status==='queued'))batch.stage='complete';}
 return {ok:true,lockdowns:batch};
 }}}};vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../workers/serial-utils.js'),'utf8'),context);vm.runInContext(source,context);return{context,calls,confirmations,nodes,rows};
}
test('bulk lockdown confirms all devices once, preserves message and sends one step per device',async()=>{
 const app=setup();await app.context.sidekickLockDownApi.begin();
 assert.equal(app.confirmations.length,1);assert.match(app.confirmations[0],/SERIAL1234/);assert.match(app.confirmations[0],/SECOND1234/);assert.match(app.confirmations[0],/877-392-2299 ext.6/);
 assert.equal(app.calls.filter(call=>call.action==='lockdown-step').length,2);
 assert.equal(app.calls.some(call=>/wipe|delete|revoke/i.test(call.action)),false);
 assert.match(app.rows[0].result.textContent,/requested/);assert.equal(app.nodes.lockDownSubmitBtn.disabled,false);
});
test('cancel sends no lockdown steps and individual button previews only that card',async()=>{
 const app=setup(false);await app.context.sidekickLockDownApi.begin(app.rows[1]);
 assert.equal(app.calls.find(call=>call.action==='lockdown-start').serials.join(','),'SECOND1234');
 assert.equal(app.calls.some(call=>call.action==='lockdown-step'),false);assert.equal(app.calls.at(-1).action,'lockdown-stop');
});

test('individual and bulk disable use a distinct disable confirmation and keep CRM notes separate',async()=>{
 for(const individual of [true,false]){
 const app=setup();await app.context.sidekickLockDownApi.begin(individual?app.rows[0]:null,'disable');
 assert.equal(app.calls[0].mode,'disable');assert.equal(app.calls[0].serials.length,individual?1:2);
 assert.match(app.confirmations[0],/^Disable Lost Mode/);assert.doesNotMatch(app.confirmations[0],/Message:/);
 assert.equal(app.calls.filter(call=>call.action==='lockdown-step').length,individual?1:2);
 }
});

test('device scans read Audit, normalize numbers, reject duplicates and stay excluded from enable actions',async()=>{
 const app=setup();await app.context.sidekickLockDownApi.addScan('dtp8.1247');
 assert.equal(app.rows.length,3);assert.equal(app.rows[2].dataset.disableOnly,'true');
 assert.equal(app.calls[0].device,'DTP8.1247');assert.equal(app.rows[2].querySelector('[data-lock-down-internal-serial]').value,'SCAN123456');
 assert.equal(app.calls.some(call=>call.action==='lockdown-start'),false);
 await app.context.sidekickLockDownApi.addScan('DTP8.1247');assert.equal(app.rows.length,3);assert.match(app.nodes.lockDownScanStatus.textContent,/already in the list/);
 await app.context.sidekickLockDownApi.begin();assert.equal(app.calls.find(call=>call.action==='lockdown-start').serials.length,2);
 await app.context.sidekickLockDownApi.begin(null,'disable');assert.equal(app.calls.filter(call=>call.action==='lockdown-start').at(-1).serials.length,3);
 assert.equal(app.nodes.lockDownScanInput.focused,true);
});
test('missing, ambiguous and failed Audit lookups never create actionable cards',async()=>{
 for(const response of [{ok:true,internalSerial:null},{ok:true,internalSerial:'SERIAL12345',ambiguous:true},{ok:false,error:'Sign in to SharePoint'}]){
 const app=setup(true,{lookup:async()=>response});await app.context.sidekickLockDownApi.addScan('DTP8.1247');assert.equal(app.rows.length,2);assert.ok(app.nodes.lockDownScanStatus.textContent.includes(':'));
 }
 const app=setup(true,{access:false});await app.context.sidekickLockDownApi.addScan('DTP8.1247');assert.equal(app.calls.length,0);
});
test('rapid scans queue Audit lookups and block actions until all serials are ready',async()=>{
 let release;const gate=new Promise(resolve=>release=resolve);
 const app=setup(true,{lookup:async number=>{if(number==='DTP8.1247')await gate;return{ok:true,internalSerial:number==='DTP8.1247'?'FIRST12345':'THIRD12345'};}});
 const first=app.context.sidekickLockDownApi.addScan('DTP8.1247');const second=app.context.sidekickLockDownApi.addScan('DTP8.1248');
 await app.context.sidekickLockDownApi.begin(null,'disable');assert.equal(app.calls.some(call=>call.action==='lockdown-start'),false);
 release();await Promise.all([first,second]);assert.equal(app.rows.length,4);
 assert.equal(app.rows[2].querySelector('[data-lock-down-internal-serial]').value,'FIRST12345');assert.equal(app.rows[3].querySelector('[data-lock-down-internal-serial]').value,'THIRD12345');
});
