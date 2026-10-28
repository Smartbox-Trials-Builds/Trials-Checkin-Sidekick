const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../workers/device-sidekick.js'), 'utf8');

test('internal-only entry adds ordered wipe rows, rejects duplicates and respects locked edits', async () => {
  const elements = new Map();
  const element = () => ({ children: [], listeners: {}, dataset: {}, style: {},
    querySelector() { return null; },
    append(...items) { this.children.push(...items); }, setAttribute() {},
    addEventListener(type, fn) { this.listeners[type] = fn; } });
  for (const id of ['prePrepRows', 'internalSerialOnlyBtn', 'internalSerialForm', 'prePrepScanForm', 'deviceSerialHeading', 'deviceSidekickTable', 'beginWipeBtn']) elements.set(id, element());
  const context = {
    console, URL, crypto: { randomUUID: () => 'test' },
    document: { getElementById: id => elements.get(id), createElement: element, createTextNode: value => value, querySelectorAll: () => [] },
    chrome: { storage: {
      local: { get: async () => ({ ttmtSidekickUserProfile: { role: 'Device Systems Coordinator' } }) },
      session: { get: async () => ({ sidekickDeviceDraft: { mode: 'prep', rows: [{ id: 'existing', deviceSerial: 'SCANNED', internalSerial: 'OLD' }] } }), set: async value => { context.saved = value; } },
      onChanged: { addListener(fn) { context.changed = fn; } }
    } }
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(vm.runInContext('deviceSidekickMode', context), 'wipe');
  await elements.get('internalSerialOnlyBtn').listeners.click();
  assert.equal(elements.get('prePrepScanForm').hidden, true);
  assert.equal(elements.get('internalSerialForm').hidden, false);
  assert.equal(elements.get('deviceSerialHeading').hidden, true);
  assert.equal(context.addInternalSerial('  NEXT-123  '), true);
  assert.equal(context.addInternalSerial('next-123'), false);
  assert.equal(context.addInternalSerial(' '), false);
  assert.equal(context.addPrePrepScan('SCANNED'), false);
  assert.equal(vm.runInContext('prePrepRows.length', context), 2);
  assert.equal(vm.runInContext('prePrepRows[1].internalSerial', context), 'NEXT-123');
  assert.equal(vm.runInContext('prePrepRows[1].wiped', context), false);
  assert.equal(vm.runInContext('nextUnwipedDevice().internalSerial', context), 'OLD');
  assert.equal(context.saved.sidekickDeviceDraft.internalSerialOnly, true);
  const category = elements.get('prePrepRows').children.at(-2).children.at(-2);
  assert.deepEqual(category.children.map(option => option.textContent), ['Select category', 'Talkpad 10', 'Talkpad 8', 'Wego 13', 'Wego 5']);
  category.value = 'Wego 13';
  await category.listeners.change();
  assert.equal(context.saved.sidekickDeviceDraft.rows[0].category, 'Wego 13');
  // A manual completion remains editable even while serial-number edits are locked.
  vm.runInContext('prePrepEditsLocked = true', context);
  const checkbox = elements.get('prePrepRows').children.at(-2).children.at(-1).children[0].children[0];
  assert.notEqual(checkbox.disabled, true);
  checkbox.checked = true;
  await checkbox.listeners.change();
  assert.equal(context.saved.sidekickDeviceDraft.rows[0].wiped, true);
  const profileCheckbox = elements.get('prePrepRows').children.at(-2).children.at(-1).children[1].children[0];
  assert.notEqual(profileCheckbox.disabled, true);
  profileCheckbox.checked = true;
  await profileCheckbox.listeners.change();
  assert.equal(context.saved.sidekickDeviceDraft.rows[0].profileAdded, true);
  assert.equal(context.saved.sidekickDeviceDraft.rows[0].wiped, true);
  assert.equal(vm.runInContext('nextUnprofiledDevice().internalSerial', context), 'NEXT-123');
  profileCheckbox.checked = false;
  await profileCheckbox.listeners.change();
  assert.equal(vm.runInContext('nextUnprofiledDevice().internalSerial', context), 'OLD');
  await context.loadDeviceDraft();
  // Restore the saved completion as another window/reload would.
  context.changed({ sidekickDeviceDraft: { newValue: { ...context.saved.sidekickDeviceDraft, origin: 'other-window' } } }, 'session');
  assert.equal(vm.runInContext('nextUnwipedDevice().internalSerial', context), 'NEXT-123');
  const started = [];
  const overview = 'https://entra.microsoft.com/#view/Microsoft_AAD_Devices/DevicesMenuBlade/~/Devices/menuId/Overview';
  context.chrome.tabs = { query: async () => [{ id: 7, windowId: 2, url: overview }], update: async id => ({ id }) };
  context.chrome.windows = { update: async () => {} };
  context.searchFirstWipeDevice = async (tabId, serial) => { started.push(serial); };
  await elements.get('beginWipeBtn').listeners.click({ currentTarget: elements.get('beginWipeBtn') });
  assert.deepEqual(started, ['NEXT-123']);
  checkbox.checked = false;
  await checkbox.listeners.change();
  assert.equal(vm.runInContext('nextUnwipedDevice().internalSerial', context), 'OLD');
  assert.equal(context.addInternalSerial('LOCKED'), false);
  await elements.get('internalSerialOnlyBtn').listeners.click();
  assert.equal(elements.get('prePrepScanForm').hidden, false);
  assert.equal(elements.get('internalSerialForm').hidden, true);
  assert.equal(vm.runInContext('prePrepRows[0].deviceSerial', context), 'SCANNED');
});
