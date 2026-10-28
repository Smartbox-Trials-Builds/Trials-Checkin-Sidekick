const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const JSZip = require('../libs/jszip.min.js');
const reader = require('../workers/audit-workbook.js');
const workerSource = fs.readFileSync(path.join(__dirname, '../workers/audit-lookup-worker.js'), 'utf8');
const deviceSource = fs.readFileSync(path.join(__dirname, '../workers/device-sidekick.js'), 'utf8');

async function fixture() {
  const zip = new JSZip();
  zip.file('xl/workbook.xml', '<workbook><sheets><sheet name="query" r:id="rId2"/></sheets></workbook>');
  zip.file('xl/_rels/workbook.xml.rels', '<Relationships><Relationship Id="rId2" Target="worksheets/sheet2.xml"/></Relationships>');
  zip.file('xl/sharedStrings.xml', '<sst><si><t>TTMT Serial Number</t></si><si><t>Title</t></si><si><r><t>ABC&amp;</t></r><r><t>123</t></r></si></sst>');
  zip.file('xl/worksheets/sheet2.xml', `<worksheet><sheetData>
    <row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row>
    <row r="2"><c r="A2" t="inlineStr"><is><t>DTP8.0001</t></is></c><c r="B2" t="s"><v>2</v></c><c r="D2" t="inlineStr"><is><t>Talk Pad 10</t></is></c></row>
    <row r="3"><c r="A3" t="inlineStr"><is><t>DTP8.0002</t></is></c><c r="B3" t="str"><f>DO_NOT_RUN()</f><v>0000123</v></c><c r="D3" t="inlineStr"><is><t>Wego 7</t></is></c></row>
    <row r="4"><c r="A4" t="inlineStr"><is><t>DTP8.0001</t></is></c><c r="B4" t="s"><v>2</v></c></row>
    <row r="5"><c r="A5" t="inlineStr"><is><t>DTP8.0003</t></is></c><c r="B5" t="inlineStr"><is><t>FIRST</t></is></c></row>
    <row r="6"><c r="A6" t="inlineStr"><is><t>DTP8.0003</t></is></c><c r="B6" t="inlineStr"><is><t>OTHER</t></is></c></row>
    <row r="7"><c r="B7" t="inlineStr"><is><t>NO DEVICE</t></is></c></row>
  </sheetData></worksheet>`);
  zip.file('xl/vbaProject.bin', 'VBA must never execute');
  return zip;
}

test('Audit parser reads query A/B/D saved values, preserves leading zeros, and excludes conflicting devices', async () => {
  const zip = await fixture();
  const result = await reader.parse(await zip.generateAsync({ type: 'nodebuffer' }), JSZip);
  assert.equal(result.map['DTP8.0001'], 'ABC&123');
  assert.equal(result.map['DTP8.0002'], '0000123');
  assert.equal(result.categories['DTP8.0001'], 'Talkpad 10');
  assert.equal(result.categories['DTP8.0002'], 'Talkpad 8');
  assert.equal(result.schemaVersion, 2);
  assert.equal(result.map['DTP8.0003'], undefined);
  assert.deepEqual(result.ambiguous, ['DTP8.0003']);
  assert.equal(result.count, 2);
  zip.file('xl/workbook.xml', '<workbook><sheets><sheet name="wrong" r:id="rId2"/></sheets></workbook>');
  await assert.rejects(reader.parse(await zip.generateAsync({ type: 'nodebuffer' }), JSZip), /named query/);
});

test('Wednesday refresh is 5 AM Chicago time across daylight saving and catches missed refreshes', () => {
  const before = reader.refreshWindow(Date.parse('2026-10-28T09:59:00Z'));
  assert.equal(new Date(before.next).toISOString(), '2026-10-28T10:00:00.000Z');
  const after = reader.refreshWindow(Date.parse('2026-10-28T10:00:00Z'));
  assert.equal(new Date(after.previous).toISOString(), '2026-10-28T10:00:00.000Z');
  assert.equal(new Date(after.next).toISOString(), '2026-11-04T11:00:00.000Z');
  const spring = reader.refreshWindow(Date.parse('2026-03-05T12:00:00Z'));
  assert.equal(new Date(spring.next).toISOString(), '2026-03-11T10:00:00.000Z');
});

async function workerSetup({ stale = false, offline = false, role = 'Device Systems Coordinator' } = {}) {
  const now = Date.parse('2026-10-28T12:00:00Z');
  const store = { ttmtSidekickUserProfile: { role }, sidekickAuditLookupV1: {
    schemaVersion: 2, map: { 'DTP8.0001': 'CACHED' }, categories: { 'DTP8.0001': 'Talkpad 10' }, ambiguous: [], count: 1, source: 'SharePoint', fetchedAt: now - (stale ? 86400000 : 1000)
  } };
  const messages = [], alarms = [], fetches = [];
  const context = { console, AbortController, Uint8Array, atob, setTimeout, clearTimeout,
    Date: class extends Date { static now() { return now; } },
    sidekickAuditWorkbook: { ...reader, refreshWindow: () => reader.refreshWindow(now), parse: async () => ({ schemaVersion: 2, map: { 'DTP8.0001': 'FRESH' }, categories: { 'DTP8.0001': 'Talkpad 8' }, ambiguous: [], count: 1 }) },
    fetch: async (url, options) => { fetches.push({ url, options }); if (offline) throw new Error('Failed to fetch'); return { ok: true, url, headers: { get: () => 'application/octet-stream' }, arrayBuffer: async () => new ArrayBuffer(1) }; },
    chrome: {
      storage: { local: { get: async keys => typeof keys === 'string' ? { [keys]: store[keys] } : Object.fromEntries(keys.map(key => [key, store[key]])), set: async values => Object.assign(store, values) }, onChanged: { addListener() {} } },
      alarms: { create: async (name, options) => alarms.push({ name, options }), clear: async () => {}, onAlarm: { addListener() {} } },
      runtime: { id: 'sidekick', onMessage: { addListener: fn => messages.push(fn) }, onStartup: { addListener() {} } }
    }
  };
  vm.createContext(context); vm.runInContext(workerSource, context);
  await new Promise(resolve => setImmediate(resolve));
  const send = message => new Promise(resolve => messages[0](message, { id: 'sidekick' }, resolve));
  return { store, alarms, fetches, send };
}

test('cached scans use no network; stale cache refreshes with GET only; failures keep cached data and schedule retry', async () => {
  const cached = await workerSetup();
  assert.equal((await cached.send({ type: 'sidekick-audit-lookup', device: ' dtp8.0001 ' })).internalSerial, 'CACHED');
  assert.equal(cached.fetches.length, 0);
  assert.equal((await cached.send({ type: 'sidekick-audit-lookup', device: 'DTP8.0001' })).category, 'Talkpad 10');
  const refreshed = await workerSetup({ stale: true });
  assert.equal((await refreshed.send({ type: 'sidekick-audit-lookup', device: 'DTP8.0001' })).internalSerial, 'FRESH');
  assert.equal(refreshed.fetches.length, 1);
  assert.equal(refreshed.fetches[0].options.method, 'GET');
  assert.equal(refreshed.fetches[0].options.body, undefined);
  assert.equal(refreshed.fetches[0].options.cache, 'no-store');
  assert.match(refreshed.fetches[0].url, /GetFileById/);
  const failed = await workerSetup({ stale: true, offline: true });
  const result = await failed.send({ type: 'sidekick-audit-lookup', device: 'DTP8.0001' });
  assert.equal(result.internalSerial, 'CACHED');
  assert.equal(result.stale, true);
  assert.match(result.error, /SharePoint/);
  assert.equal(failed.fetches.length, 1); // Cooldown prevents each scan retrying a failing download.
  assert.ok(failed.alarms.some(alarm => alarm.name === 'sidekick-audit-retry'));
});

test('lookup access is restricted to Device Systems; missing device is left unmatched', async () => {
  const denied = await workerSetup({ role: 'Device Coordinator', stale: true });
  assert.equal((await denied.send({ type: 'sidekick-audit-lookup', device: 'DTP8.0001' })).ok, false);
  assert.equal(denied.fetches.length, 0);
  const normal = await workerSetup();
  assert.equal((await normal.send({ type: 'sidekick-audit-lookup', device: 'UNKNOWN' })).internalSerial, null);
});

test('scan autofill never overwrites manual edits, removed rows, locked edits, or changed device numbers', async () => {
  for (const scenario of ['fill', 'manual', 'manual-category', 'existing-category', 'removed', 'locked', 'changed', 'ambiguous']) {
    let deliver;
    const context = { console, crypto: { randomUUID: () => 'test' }, URL,
      document: { getElementById: () => null, querySelectorAll: () => [] },
      chrome: { storage: { local: { get: async () => ({ ttmtSidekickUserProfile: { role: 'Device Systems Coordinator' } }) }, session: { get: async () => ({}) }, onChanged: { addListener() {} } },
        runtime: { sendMessage: () => new Promise(resolve => { deliver = resolve; }) } } };
    vm.createContext(context); vm.runInContext(deviceSource, context);
    await new Promise(resolve => setImmediate(resolve));
    let saves = 0;
    context.saveDeviceDraft = async () => { saves++; };
    context.renderPrePrepRows = () => {};
    vm.runInContext('prePrepRows = [{ id: "row", deviceSerial: "DTP8.0001", internalSerial: "" }]', context);
    if (scenario === 'existing-category') vm.runInContext('prePrepRows[0].category = "Wego 13"', context);
    const pending = context.populateAuditInternalSerial('row', 'DTP8.0001');
    await new Promise(resolve => setImmediate(resolve));
    if (scenario === 'manual') vm.runInContext('prePrepRows[0].internalSerial = "MANUAL"; prePrepRows[0].auditLookupRevision = 1', context);
    if (scenario === 'manual-category') vm.runInContext('prePrepRows[0].category = "Wego 5"; prePrepRows[0].auditLookupRevision = 1', context);
    if (scenario === 'removed') vm.runInContext('prePrepRows = []', context);
    if (scenario === 'locked') vm.runInContext('prePrepEditsLocked = true', context);
    if (scenario === 'changed') vm.runInContext('prePrepRows[0].deviceSerial = "OTHER"', context);
    deliver({ ok: true, internalSerial: scenario === 'ambiguous' ? null : 'AUTO', category: scenario === 'ambiguous' ? null : 'Talkpad 10', ambiguous: scenario === 'ambiguous' });
    await pending;
    assert.equal(saves, ['fill', 'existing-category'].includes(scenario) ? 1 : 0);
    if (scenario === 'manual') assert.equal(vm.runInContext('prePrepRows[0].internalSerial', context), 'MANUAL');
    if (scenario === 'fill') assert.equal(vm.runInContext('prePrepRows[0].internalSerial', context), 'AUTO');
    if (scenario === 'fill') assert.equal(vm.runInContext('prePrepRows[0].category', context), 'Talkpad 10');
    if (scenario === 'manual-category') assert.equal(vm.runInContext('prePrepRows[0].category', context), 'Wego 5');
    if (scenario === 'existing-category') assert.equal(vm.runInContext('prePrepRows[0].category', context), 'Wego 13');
  }
});

test('adding a scanned device requests its corrected device number and fills the matching row', async () => {
  const requests = [];
  const context = { console, crypto: { randomUUID: () => 'test' }, URL,
    document: { getElementById: () => null, querySelectorAll: () => [] },
    extractValidSerial: () => 'DTP8.0001',
    chrome: { storage: { local: { get: async () => ({ ttmtSidekickUserProfile: { role: 'Device Systems Coordinator' } }) }, session: { get: async () => ({}), set: async () => {} }, onChanged: { addListener() {} } },
      runtime: { sendMessage: async message => { requests.push(message); return { ok: true, internalSerial: 'AUTO', category: 'Talkpad 8' }; } } } };
  vm.createContext(context); vm.runInContext(deviceSource, context);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(context.addPrePrepScan('(21)dtp8-0001'), true);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(requests.length, 1);
  assert.equal(requests[0].device, 'DTP8.0001');
  assert.equal(vm.runInContext('prePrepRows[0].internalSerial', context), 'AUTO');
  assert.equal(vm.runInContext('prePrepRows[0].category', context), 'Talkpad 8');
});

test('column D aliases map exactly, including Wego 10s and Wego 7, without accepting unrestricted or unknown models', () => {
  for (const [input, expected] of [['Talk Pad 10', 'Talkpad 10'], ['Wego 10', 'Talkpad 10'], ['Wego 10s', 'Talkpad 10'],
    ['Talk Pad 8', 'Talkpad 8'], [' Wego  7 ', 'Talkpad 8'], ['Wego 13', 'Wego 13'], ['Wego 13a', 'Wego 13'], ['Wego 5', 'Wego 5'], ['Wego 5a', 'Wego 5'],
    ['Unknown', null], ['Wego TalkPad 8 - Unrestricted', null], ['', null]]) assert.equal(reader.categoryFor(input), expected);
});

test('conflicting column D categories are omitted without losing an unambiguous internal serial', async () => {
  const zip = await fixture();
  const xml = await zip.file('xl/worksheets/sheet2.xml').async('string');
  zip.file('xl/worksheets/sheet2.xml', xml.replace('</sheetData>', '<row r="8"><c r="A8" t="inlineStr"><is><t>DTP8.0002</t></is></c><c r="B8" t="str"><v>0000123</v></c><c r="D8" t="inlineStr"><is><t>Wego 5</t></is></c></row></sheetData>'));
  const parsed = await reader.parse(await zip.generateAsync({ type: 'nodebuffer' }), JSZip);
  assert.equal(parsed.map['DTP8.0002'], '0000123');
  assert.equal(parsed.categories['DTP8.0002'], undefined);
  assert.deepEqual(parsed.categoryAmbiguous, ['DTP8.0002']);
});
