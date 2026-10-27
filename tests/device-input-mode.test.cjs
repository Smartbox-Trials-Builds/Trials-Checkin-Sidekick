const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../workers/device-sidekick.js'), 'utf8');

test('internal-only entry adds ordered wipe rows, rejects duplicates and respects locked edits', async () => {
  const elements = new Map();
  const element = () => ({ children: [], listeners: {}, dataset: {}, style: {},
    append(...items) { this.children.push(...items); }, setAttribute() {},
    addEventListener(type, fn) { this.listeners[type] = fn; } });
  for (const id of ['prePrepRows', 'internalSerialOnlyBtn', 'internalSerialForm', 'prePrepScanForm', 'deviceSerialHeading', 'deviceSidekickTable']) elements.set(id, element());
  const context = {
    console, URL, crypto: { randomUUID: () => 'test' },
    document: { getElementById: id => elements.get(id), createElement: element, createTextNode: value => value, querySelectorAll: () => [] },
    chrome: { storage: {
      local: { get: async () => ({}) },
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
  vm.runInContext('prePrepEditsLocked = true', context);
  assert.equal(context.addInternalSerial('LOCKED'), false);
  await elements.get('internalSerialOnlyBtn').listeners.click();
  assert.equal(elements.get('prePrepScanForm').hidden, false);
  assert.equal(elements.get('internalSerialForm').hidden, true);
  assert.equal(vm.runInContext('prePrepRows[0].deviceSerial', context), 'SCANNED');
});
