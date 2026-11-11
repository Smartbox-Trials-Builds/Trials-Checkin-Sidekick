const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Zip = require('../libs/jszip.min.js');
const reader = require('../workers/sticker-workbook.js');
async function fixture() {
  const z = new Zip();
  z.file('xl/workbook.xml','<workbook><sheets><sheet name="Sheet1" r:id="r1"/></sheets></workbook>');
  z.file('xl/_rels/workbook.xml.rels','<Relationships><Relationship Id="r1" Target="worksheets/sheet1.xml"/></Relationships>');
  z.file('xl/sharedStrings.xml','<sst><si><t> dtp8.0033 </t></si></sst>');
  z.file('xl/worksheets/sheet1.xml','<worksheet><sheetData><row><c r="E1" t="inlineStr"><is><t>Header</t></is></c><c r="E7" t="s"><v>0</v></c><c r="H9" t="inlineStr"><is><t>DTP8.0033</t></is></c><c r="A10" t="s"><v>0</v></c><c r="E11" t="str"><f>NEVER_RUN()</f><v>DTP10.013</v></c><c r="H12"/></row></sheetData></worksheet>');
  return z.generateAsync({type:'nodebuffer'});
}
test('read-only parser indexes E/H and returns exact worksheet row and cell, including duplicate matches', async () => {
  const bytes = await fixture(), before = Buffer.from(bytes);
  const map = await reader.parse(bytes,Zip);
  assert.deepEqual(map['DTP8.0033'],[{sheet:'Sheet1',row:7,column:'E',cell:'E7'},{sheet:'Sheet1',row:9,column:'H',cell:'H9'}]);
  assert.equal(map['DTP10.013'][0].row,11);
  assert.equal(map.Header,undefined); assert.equal(map['DTP8.003'],undefined);
  assert.deepEqual(bytes,before);
});
test('worker reads each scan with GET and credentials, restricts access, and reports failures rather than a false no-match', async () => {
  let handle, calls = 0, role = 'Device Systems Coordinator', fail = false;
  const context = { console, AbortController, setTimeout, clearTimeout,
    sidekickStickerWorkbook: { normalize:reader.normalize,parse:async()=>({'DTP8.0033':[{sheet:'Sheet1',row:7,cell:'E7'}]}) },
    fetch: async (url,options) => { calls++; assert.equal(options.method,'GET'); assert.equal(options.credentials,'include'); assert.equal(options.cache,'no-store'); if(fail)throw new Error('network failed'); return {ok:true,url,headers:{get:()=>''},arrayBuffer:async()=>new ArrayBuffer(1)}; },
    chrome: { runtime: {id:'self',onMessage:{addListener:fn=>{handle=fn;}}}, storage:{local:{get:async()=>({ttmtSidekickUserProfile:{role}})}} }
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../workers/sticker-lookup-worker.js'),'utf8'),context);
  const request = device => new Promise(resolve=>handle({type:'sidekick-sticker-lookup',device},{id:'self'},resolve));
  assert.equal((await request(' dtp8.0033 ')).matches[0].row,7);
  assert.equal((await request('DTP8.003')).matches.length,0); assert.equal(calls,2);
  fail=true; assert.equal((await request('DTP8.0033')).ok,false);
  role='Device Coordinator'; assert.equal((await request('DTP8.0033')).ok,false); assert.equal(calls,3);
  assert.equal(handle({type:'sidekick-sticker-lookup'},{id:'other'},()=>{}),undefined);
});
async function uiSetup(result) {
  const dialogs = [], tabs = [], messages = [];
  const element = () => ({children:[],listeners:{},append(...items){this.children.push(...items);},setAttribute(){},addEventListener(type,fn){this.listeners[type]=fn;},showModal(){},focus(){},close(){this.listeners.close?.();},remove(){}});
  const context = { console,URL,crypto:{randomUUID:()=> 'test'},
    document:{getElementById:()=>null,querySelectorAll:()=>[],createElement:element,body:{append:dialog=>dialogs.push(dialog)}},
    chrome:{storage:{local:{get:async()=>({ttmtSidekickUserProfile:{role:'Device Systems Coordinator'}})},session:{get:async()=>({})},onChanged:{addListener(){}}},runtime:{sendMessage:async message=>{messages.push(message);return result;}},tabs:{create:async tab=>tabs.push(tab)}}
  };
  vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../workers/device-sidekick.js'),'utf8'),context);
  await new Promise(setImmediate);
  vm.runInContext('prePrepRows=[{id:"one",deviceSerial:"DTP8.0033"}]',context);
  return {context,dialogs,tabs,messages};
}
test('matching scan shows sticker reminder with row and opens only the supplied workbook; no matches open nothing', async () => {
  for(const matches of [[],[{sheet:'Sheet1',row:7,cell:'E7'}]]) {
    const {context,dialogs,tabs}=await uiSetup({ok:true,matches});
    await context.checkDeviceSticker('one','DTP8.0033');
    assert.equal(dialogs.length,matches.length);assert.equal(tabs.length,matches.length);
    if(matches.length){assert.match(dialogs[0].children[1].textContent,/Replace the Serial Number sticker.*Sheet1, row 7 \(E7\)/);assert.match(tabs[0].url,/0EA98517-551F-426A-BFB3-8EB6A8125B17/);assert.equal(tabs[0].active,false);}
  }
});
test('removed or edited device suppresses delayed match notifications and tab opening',async()=>{
  for(const change of ['prePrepRows=[]','prePrepRows[0].deviceSerial="OTHER"']) {
    const {context,dialogs,tabs}=await uiSetup({ok:true,matches:[{sheet:'Sheet1',row:7,cell:'E7'}]});
    let complete;context.chrome.runtime.sendMessage=()=>new Promise(resolve=>{complete=resolve;});
    const pending=context.checkDeviceSticker('one','DTP8.0033');await new Promise(setImmediate);
    vm.runInContext(change,context);complete({ok:true,matches:[{sheet:'Sheet1',row:7,cell:'E7'}]});await pending;
    assert.equal(dialogs.length,0);assert.equal(tabs.length,0);
  }
});
