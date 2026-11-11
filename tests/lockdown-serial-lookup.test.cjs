const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../panel.js'),'utf8');
const lookup = source.slice(source.indexOf('async function lookupLockDownInternalSerial('),source.indexOf('function addLockDownEntry('));
function setup(result) {
  const fields = {
    '[data-lock-down-device-number]': {value:' dtp8-0033 '},
    '[data-lock-down-internal-serial]': {value:''},
    '[data-lock-down-lookup-status]': {textContent:''}
  };
  const entry = {isConnected:true,dataset:{lookupRevision:'0'},querySelector:selector=>fields[selector]};
  const requests=[];
  const context={extractValidSerial:()=> 'DTP8.0033',chrome:{runtime:{sendMessage:async message=>{requests.push(message);return result;}}}};
  vm.createContext(context);vm.runInContext(lookup,context);
  return {context,entry,fields,requests};
}
test('Lock Down looks up corrected device number and fills serial using existing read-only Audit lookup',async()=>{
  const {context,entry,fields,requests}=setup({ok:true,internalSerial:'INTERNAL-001',stale:true});
  await context.lookupLockDownInternalSerial(entry);
  assert.equal(requests[0].device,'DTP8.0033');assert.equal(requests[0].type,'sidekick-audit-lookup');
  assert.equal(fields['[data-lock-down-internal-serial]'].value,'INTERNAL-001');
  assert.match(fields['[data-lock-down-lookup-status]'].textContent,/older cached/);
});
test('Lock Down preserves manual serials and reports unmatched, conflicting and failed lookups',async()=>{
  for(const scenario of ['manual','missing','ambiguous','error','invalid']) {
    const {context,entry,fields,requests}=setup(scenario==='error'?{ok:false,error:'Unavailable'}:{ok:true,internalSerial:scenario==='missing'?null:'AUTO',ambiguous:scenario==='ambiguous'});
    if(scenario==='manual')fields['[data-lock-down-internal-serial]'].value='MANUAL';
    if(scenario==='invalid')context.extractValidSerial=()=>null;
    await context.lookupLockDownInternalSerial(entry);
    assert.equal(fields['[data-lock-down-internal-serial]'].value,scenario==='manual'?'MANUAL':'');
    assert.ok(fields['[data-lock-down-lookup-status]'].textContent);
    if(scenario==='invalid')assert.equal(requests.length,0);
  }
});
test('late Lock Down lookup cannot overwrite an edited or removed row or a submission in progress',async()=>{
  for(const scenario of ['changed-device','manual','removed','running','revision']) {
    const {context,entry,fields}=setup();let finish;
    context.chrome.runtime.sendMessage=()=>new Promise(resolve=>{finish=resolve;});
    const pending=context.lookupLockDownInternalSerial(entry);
    if(scenario==='changed-device')fields['[data-lock-down-device-number]'].value='OTHER';
    if(scenario==='manual')fields['[data-lock-down-internal-serial]'].value='MANUAL';
    if(scenario==='removed')entry.isConnected=false;
    if(scenario==='running')fields['[data-lock-down-device-number]'].disabled=true;
    if(scenario==='revision')entry.dataset.lookupRevision='1';
    finish({ok:true,internalSerial:'AUTO'});await pending;
    assert.equal(fields['[data-lock-down-internal-serial]'].value,scenario==='manual'?'MANUAL':'');
  }
});
