const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');
const values = {};
const listeners = [];
class Element {
  constructor() { this.children = []; this.listeners = {}; this.value = ''; this.style = {}; this.dataset = {}; }
  set innerHTML(_) { this.children = []; }
  append(...items) { this.children.push(...items); }
  setAttribute() {}
  addEventListener(name, fn) { this.listeners[name] = fn; }
  focus() {}
  showModal() { this.open = true; }
  close() { this.open = false; }
  fire(name) { return this.listeners[name]?.({ target: this, preventDefault() {} }); }
}
function page() {
  const elements = new Map();
  const byId = id => { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); };
  const messages = [];
  const copied = [];
  const context = {
    crypto: { randomUUID },
    document: { getElementById: byId, createElement: () => new Element(), querySelectorAll: selector => selector === '#prePrepRows input' ? byId('prePrepRows').children.flatMap(row => row.children.filter(cell => cell.children.length).map(cell => cell.children[0])) : selector === '.device-row-remove' ? byId('prePrepRows').children.map(row => row.children.at(-1)) : [] },
    chrome: { storage: {
      session: {
        get: async key => ({ [key]: structuredClone(values[key]) }),
        set: async update => {
          Object.assign(values, structuredClone(update));
          for (const fn of listeners) fn(Object.fromEntries(Object.entries(update).map(([key, value]) => [key, { newValue: structuredClone(value) }])), 'session');
        }
      },
      onChanged: { addListener: fn => listeners.push(fn) }
    }, runtime: { sendMessage: async message => { messages.push(message); return { ok: true }; } } },
    navigator: { clipboard: { writeText: async value => copied.push(value) } },
    confirm: () => true, alert: () => {}, setTimeout
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('serial-utils.js', 'utf8'), context);
  vm.runInContext(fs.readFileSync('device-sidekick.js', 'utf8'), context);
  return { byId, messages, copied };
}
const settle = async () => { for (let i = 0; i < 10; i++) await new Promise(r => setImmediate(r)); };
(async () => {
  const panel = page(); await settle();
  panel.byId('prePrepScanInput').value = '(21)DTP101234';
  panel.byId('prePrepScanForm').fire('submit'); await settle();
  assert.equal(values.sidekickDeviceDraft.rows[0].deviceSerial, 'DTP10.1234');
  const popup = page(); await settle();
  const internal = popup.byId('prePrepRows').children[0].children[1].children[0];
  internal.value = 'INTERNAL-123'; internal.fire('input'); await settle();
  assert.equal(panel.byId('prePrepRows').children[0].children[1].children[0].value, 'INTERNAL-123');
  popup.byId('prePrepLockBtn').fire('click'); await settle();
  assert.equal(values.sidekickDeviceDraft.locked, true);
  assert.equal(panel.byId('prePrepRows').children[0].children[0].children[0].readOnly, true);
  popup.byId('prePrepLockBtn').fire('click'); await settle();
  popup.byId('deviceSidekickMode').value = 'prep';
  await popup.byId('deviceSidekickMode').fire('change'); await settle();
  assert.equal(panel.byId('prePrepRows').children[0].children.length, 5);
  const crm = popup.byId('prePrepRows').children[0].children[2].children[0];
  crm.value = '12345'; crm.fire('input'); await settle();
  popup.byId('prePrepScanInput').value = 'DW13123456';
  popup.byId('prePrepScanForm').fire('submit'); await settle();
  popup.byId('bulkAddGipodBtn').fire('click');
  popup.byId('bulkGipodInput').value = 'ONLY-ONE';
  await popup.byId('bulkGipodForm').fire('submit');
  assert.equal(popup.byId('bulkGipodDialog').open, true);
  assert.equal(values.sidekickDeviceDraft.rows[0].gipodCode, '');
  popup.byId('bulkGipodInput').value = 'A\tB\nC\tD';
  await popup.byId('bulkGipodForm').fire('submit');
  assert.match(popup.byId('bulkGipodStatus').textContent, /single Excel column/);
  popup.byId('bulkGipodInput').value = ' CODE-001\r\nCODE-002\r\n';
  await popup.byId('bulkGipodForm').fire('submit'); await settle();
  assert.equal(popup.byId('bulkGipodDialog').open, false);
  assert.deepEqual(values.sidekickDeviceDraft.rows.map(row => row.gipodCode), ['CODE-001', 'CODE-002']);
  await popup.byId('prePrepRows').children[0].children[3].children[1].fire('click');
  await popup.byId('prePrepRows').children[0].children[2].children[1].fire('click');
  assert.deepEqual(popup.copied, ['CODE-001', '12345']);
  popup.byId('deviceSidekickMode').value = 'wipe';
  await popup.byId('deviceSidekickMode').fire('change'); await settle();
  assert.equal(panel.byId('prePrepRows').children[0].children.length, 3);
  popup.byId('deviceSidekickMode').value = 'prep';
  await popup.byId('deviceSidekickMode').fire('change'); await settle();
  assert.equal(panel.byId('prePrepRows').children[0].children[3].children[0].value, 'CODE-001');
  popup.byId('bulkAddGipodBtn').fire('click');
  popup.byId('prePrepLockBtn').fire('click'); await settle();
  await popup.byId('bulkGipodForm').fire('submit');
  assert.match(popup.byId('bulkGipodStatus').textContent, /unlock edits/);
  popup.byId('prePrepLockBtn').fire('click'); await settle();
  await panel.byId('popOutDeviceSidekickBtn').fire('click');
  assert.equal(panel.messages[0].type, 'sidekick-open-device');
  const lockedRemove = popup.byId('prePrepRows').children[0].children.at(-1);
  popup.byId('prePrepLockBtn').fire('click'); await settle();
  assert.equal(lockedRemove.disabled, true);
  await lockedRemove.fire('click');
  assert.equal(values.sidekickDeviceDraft.rows.length, 2);
  popup.byId('prePrepLockBtn').fire('click'); await settle();
  await popup.byId('prePrepRows').children[0].children.at(-1).fire('click'); await settle();
  assert.equal(values.sidekickDeviceDraft.rows.length, 1);
  assert.equal(values.sidekickDeviceDraft.rows[0].gipodCode, 'CODE-002');
  assert.equal(panel.byId('prePrepRows').children.length, 1);
  popup.byId('deviceSidekickMode').value = 'wipe';
  await popup.byId('deviceSidekickMode').fire('change'); await settle();
  await popup.byId('prePrepRows').children[0].children.at(-1).fire('click'); await settle();
  assert.equal(values.sidekickDeviceDraft.rows.length, 0);
  popup.byId('prePrepClearBtn').fire('click'); await settle();
  assert.equal(panel.byId('prePrepRows').children.length, 0);
  assert.equal(values.sidekickDeviceDraft.rows.length, 0);
  console.log('PASS: scans, shared drafts and lock state, Wipe/Prep switching, retained CRM and codes, Excel bulk assignment, count and column validation, copy buttons, pop-out, and clearing.');
})().catch(error => { console.error(error); process.exitCode = 1; });
