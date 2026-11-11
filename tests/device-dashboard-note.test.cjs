const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../workers/device-sidekick.js'), 'utf8');
async function setup() {
  const elements = new Map();
  const element = () => ({ children: [], listeners: {}, dataset: {}, style: {},
    querySelector() { return null; }, closest() { return null; },
    append(...items) { this.children.push(...items); }, setAttribute() {},
    addEventListener(type, fn) { this.listeners[type] = fn; } });
  elements.set('prePrepRows', element()); elements.set('prePrepStatus', element());
  const context = { console, URL, crypto: { randomUUID: () => 'test' },
    navigator: { clipboard: { writeText: async text => { context.copied = text; } } },
    document: { getElementById: id => elements.get(id), createElement: element, createTextNode: value => value, querySelectorAll: () => [] },
    chrome: { storage: {
      local: { get: async () => ({ ttmtSidekickUserProfile: { role: 'Device Systems Coordinator' } }) },
      session: { get: async () => ({}), set: async value => { context.saved = JSON.parse(JSON.stringify(value)); } },
      onChanged: { addListener(fn) { context.changed = fn; } }
    } }
  };
  vm.createContext(context); vm.runInContext(source, context); await new Promise(setImmediate);
  vm.runInContext('prePrepRows = [{id:"a",deviceSerial:"DTP10.0001",internalSerial:"INTERNAL1"},{id:"b",deviceSerial:"DTP8.0002",internalSerial:"INTERNAL2"}]', context);
  return { context, elements };
}
const codes = 'gipod-1111-2222-3333\nGIPOD-4444-5555-6666';
test('bulk import assigns codes in list order, persists and copies exactly two lines using scanned device number', async () => {
  const { context } = await setup();
  assert.equal(context.assignDeviceGipodCodes(codes, ['a','b']), 2);
  await context.saveDeviceDraft();
  assert.equal(context.saved.sidekickDeviceDraft.rows[1].gipodCode, 'GIPOD-4444-5555-6666');
  await context.copyDeviceDashboardNote('a');
  assert.equal(context.copied, 'DTP10.0001\nGIPOD-1111-2222-3333');
  context.changed({ sidekickDeviceDraft: { newValue: { ...context.saved.sidekickDeviceDraft, origin:'other' } } }, 'session');
  await context.copyDeviceDashboardNote('b');
  assert.equal(context.copied, 'DTP8.0002\nGIPOD-4444-5555-6666');
});
test('invalid imports, changed lists and locked edits never partially assign codes', async () => {
  const { context } = await setup();
  for (const text of ['', 'GIPOD-1111-2222-3333', 'GIPOD-1111-2222-3333\nBAD', 'GIPOD-1111-2222-3333\nGIPOD-1111-2222-3333']) {
    assert.throws(() => context.assignDeviceGipodCodes(text));
    assert.equal(vm.runInContext('prePrepRows.some(row => row.gipodCode)',context),false);
  }
  assert.throws(() => context.assignDeviceGipodCodes(codes,['b','a']), /list changed/);
  vm.runInContext('prePrepEditsLocked = true',context);
  assert.throws(() => context.assignDeviceGipodCodes(codes), /Unlock/);
});
test('clearing a serial, removing a device or clearing the list discards its code and prevents stale copies', async () => {
  const { context, elements } = await setup();
  context.assignDeviceGipodCodes(codes);
  const row = vm.runInContext('prePrepRows[0]',context);
  const field = context.buildPrePrepCopyCell(row,'deviceSerial','Device').children[0];
  field.value = ''; field.listeners.input();
  assert.equal(row.gipodCode,'');
  await context.copyDeviceDashboardNote('a'); assert.equal(context.copied,undefined);
  context.renderPrePrepRows();
  const lastRow = elements.get('prePrepRows').children.at(-1);
  const actions = lastRow.children.at(-1);
  await actions.children.find(item => item.textContent === 'Remove').listeners.click();
  await context.copyDeviceDashboardNote('b'); assert.equal(context.copied,undefined);
  assert.equal(context.saved.sidekickDeviceDraft.rows.some(row => row.id === 'b'),false);
  context.clearPrePrepRows(); await new Promise(setImmediate);
  assert.deepEqual(context.saved.sidekickDeviceDraft.rows,[]);
});
test('missing code and clipboard failure give a status without copying incomplete data', async () => {
  const { context, elements } = await setup();
  await context.copyDeviceDashboardNote('a'); assert.equal(context.copied,undefined);
  assert.match(elements.get('prePrepStatus').textContent,/valid GIPOD/);
  context.assignDeviceGipodCodes(codes);
  context.navigator.clipboard.writeText = async () => { throw new Error('blocked'); };
  await context.copyDeviceDashboardNote('a'); assert.match(elements.get('prePrepStatus').textContent,/Could not copy/);
});
