const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const JSZip = require('../libs/jszip.min.js');
const reader = require('../workers/gipod-workbook.js');
async function workbook(cells) {
  const zip = new JSZip();
  zip.file('xl/workbook.xml', '<workbook><sheets><sheet name="Smartbox Grid Licenses" r:id="rId3"/></sheets></workbook>');
  zip.file('xl/_rels/workbook.xml.rels', '<Relationships><Relationship Id="rId3" Target="worksheets/sheet3.xml"/></Relationships>');
  zip.file('xl/sharedStrings.xml', '<sst><si><t>Grid + PODD (iPad)</t></si><si><t>Client Name</t></si><si><t> </t></si></sst>');
  zip.file('xl/worksheets/sheet3.xml', `<worksheet><sheetData><row><c r="E1" t="s"><v>0</v></c><c r="F1" t="s"><v>1</v></c>${cells}</row></sheetData></worksheet>`);
  zip.file('xl/vbaProject.bin', 'DO NOT EXECUTE');
  return zip.generateAsync({ type: 'nodebuffer' });
}
test('counts from first empty F up to exclusive empty E, including omitted cells and excluding later blocks', async () => {
  const buffer = await workbook('<c r="E2" t="inlineStr"><is><t>used</t></is></c><c r="F2" t="inlineStr"><is><t>Assigned</t></is></c><c r="E3" t="inlineStr"><is><t>code1</t></is></c><c r="F3" t="s"><v>2</v></c><c r="E4" t="str"><f>NEVER_RUN()</f><v>code2</v></c><c r="F4"/><c r="E5"/><c r="E6" t="inlineStr"><is><t>later</t></is></c>');
  const before = Buffer.from(buffer);
  assert.deepEqual(await reader.parse(buffer, JSZip), { count: 2, firstAvailable: 3, firstEmptyCode: 5 });
  assert.deepEqual(buffer, before);
});
test('zero availability and first blank F semantics are preserved', async () => {
  assert.equal((await reader.parse(await workbook(''), JSZip)).count, 0);
  assert.equal((await reader.parse(await workbook('<c r="E2" t="inlineStr"><is><t>code</t></is></c><c r="F3" t="inlineStr"><is><t>assigned later</t></is></c>'), JSZip)).count, 1);
});
test('refuses broken worksheet headers and unsaved formula values', async () => {
  await assert.rejects(reader.parse(await workbook('<c r="E2"><f>UNKNOWN()</f></c>'), JSZip), /unsaved formula/);
  await assert.rejects(reader.parse(await workbook('<c r="E1" t="inlineStr"><is><t>Wrong column</t></is></c>'), JSZip), /Expected GIPOD/);
});
test('worker uses only GET, refreshes at one minute, preserves last count on failure and restricts roles', async () => {
  let now = 1000000, role = 'Device Systems Coordinator', calls = 0, fail = false;
  const store = {}, alarms = [], listeners = {};
  const context = {
    console, AbortController, setTimeout, clearTimeout,
    Date: { now: () => now },
    sidekickGipodWorkbook: { parse: async () => ({ count: 22 }) },
    fetch: async (url, options) => {
      calls++; assert.equal(options.method, 'GET'); assert.equal(options.credentials, 'include');
      if (fail) throw new Error('network failure');
      return { ok: true, url, headers: { get: () => 'application/octet-stream' }, arrayBuffer: async () => new ArrayBuffer(1) };
    },
    chrome: {
      runtime: { id: 'self', onMessage: { addListener: fn => { listeners.message = fn; } }, onStartup: { addListener() {} } },
      storage: { local: { get: async key => key === 'ttmtSidekickUserProfile' ? { ttmtSidekickUserProfile: { role } } : store, set: async values => Object.assign(store, values) }, onChanged: { addListener() {} } },
      alarms: { create: async (name, options) => alarms.push({ name, ...options }), clear: async () => {}, onAlarm: { addListener: fn => { listeners.alarm = fn; } } }
    }
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../workers/gipod-count-worker.js'), 'utf8'), context);
  await new Promise(setImmediate);
  assert.equal(alarms[0].periodInMinutes, 1);
  assert.equal(calls, 1);
  const request = () => new Promise(resolve => listeners.message({ type: 'sidekick-gipod-count' }, { id: 'self' }, resolve));
  assert.equal((await request()).count, 22); assert.equal(calls, 1);
  now += 59999; await request(); assert.equal(calls, 1);
  now += 1; fail = true;
  const stale = await request(); assert.equal(calls, 2); assert.equal(stale.count, 22); assert.match(stale.error, /Could not read/);
  role = 'Device Coordinator'; assert.equal((await request()).ok, false); assert.equal(calls, 2);
  assert.equal(listeners.message({ type: 'sidekick-gipod-count' }, { id: 'other' }, () => {}), undefined);
});
