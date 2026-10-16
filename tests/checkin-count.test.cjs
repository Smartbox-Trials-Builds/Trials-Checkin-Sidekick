const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));

test('outbox persists offline, retries with original timestamp, and clears only on success', async () => {
  const stored = {};
  const calls = [];
  let offline = true;
  let messageListener, alarmListener;
  const client = {
    auth: { getSession: async () => ({ data: { session: { user: { id: 'coordinator' } } } }) },
    rpc: async (name, args) => { calls.push({ name, args }); return { error: offline ? new Error('offline') : null }; }
  };
  vm.runInNewContext(source('workers/checkin-count-worker.js'), {
    globalThis: { sidekickSupabase: { getClient: () => client } }, Date,
    console: { warn() {} },
    chrome: {
      runtime: { id: 'extension', onMessage: { addListener: fn => { messageListener = fn; } } },
      alarms: { create: async () => {}, onAlarm: { addListener: fn => { alarmListener = fn; } } },
      storage: {
        local: {
          get: async key => key === null ? { ...stored } : { [key]: stored[key] },
          set: async values => Object.assign(stored, values),
          remove: async key => { delete stored[key]; }
        },
        onChanged: { addListener() {} }
      }
    }
  });
  await tick();
  const completionId = '12345678-1234-4234-8234-123456789abc';
  const replies = [];
  assert.equal(messageListener({ type: 'sidekick-record-checkin', completionId }, { id: 'extension' }, value => replies.push(value)), true);
  await tick();
  assert.equal(replies.length, 1);
  assert.equal(replies[0].ok, true);
  assert.equal(Object.keys(stored).length, 1);
  const originalTimestamp = calls[0].args.p_completed_at;
  offline = false;
  alarmListener({ name: 'sidekick-checkin-count-sync' });
  await tick();
  assert.equal(calls.length, 2);
  assert.equal(calls[1].args.p_completed_at, originalTimestamp);
  assert.equal(calls[1].args.p_completion_id, completionId);
  assert.equal(Object.keys(stored).length, 0);
});

test('counter is role gated, refreshes its day total, and shows connection errors', async () => {
  const elements = Object.fromEntries(['systemsCheckinCounter', 'systemsCheckinTotal', 'systemsCheckinStatus', 'landingView'].map(id => [id, { hidden: true, textContent: '', style: {} }]));
  let role = 'Device Coordinator';
  let total = 14;
  let failed = false;
  let queries = 0;
  const global = { sidekickSupabase: { getClient: () => ({ rpc: async () => {
    queries++;
    return { data: { total }, error: failed ? new Error('offline') : null };
  } }) } };
  vm.runInNewContext(source('workers/checkin-count-panel.js'), {
    globalThis: global,
    document: { getElementById: id => elements[id] },
    chrome: { storage: {
      local: { get: async () => ({ ttmtSidekickUserProfile: { role } }) },
      onChanged: { addListener() {} }
    } },
    setInterval() {}
  });
  await tick();
  assert.equal(elements.systemsCheckinCounter.hidden, true);
  assert.equal(queries, 0);
  role = 'Device Systems Coordinator';
  await global.sidekickCheckinCount.refresh();
  assert.equal(elements.systemsCheckinCounter.hidden, false);
  assert.equal(elements.systemsCheckinTotal.textContent, '14');
  total = 0;
  await global.sidekickCheckinCount.refresh();
  assert.equal(elements.systemsCheckinTotal.textContent, '0');
  failed = true;
  await global.sidekickCheckinCount.refresh();
  assert.equal(elements.systemsCheckinTotal.textContent, '—');
  assert.match(elements.systemsCheckinStatus.textContent, /Retrying/);
  elements.landingView.style.display = 'none';
  const before = queries;
  await global.sidekickCheckinCount.refresh();
  assert.equal(queries, before);
});

test('shared completion hook runs only after email completion and excludes LTL updates', async () => {
  const panel = source('panel.js');
  const hook = panel.slice(panel.indexOf('async function handleOutlookEmailTabClosed()'), panel.indexOf('async function renderDafRecap()'));
  let data = { completionId: 'existing-id', isLtlUpdate: false };
  const messages = [];
  let personal = 0, cleanup = 0;
  const context = {
    activeCheckinFlow: 'checkin', CHECKIN_FLOW: { CHECKIN: 'checkin' },
    getLastCheckinDataForDaf: async () => data,
    saveLastCheckinDataForDaf: async () => {},
    crypto: { randomUUID: () => 'new-id' },
    chrome: { runtime: { sendMessage: async message => { messages.push(message); return { ok: true }; } } },
    finalizeCheckinCleanupAndCounters: async () => { personal++; },
    finishCheckinAndReset: async () => { cleanup++; }, console
  };
  vm.createContext(context);
  vm.runInContext(hook, context);
  await context.handleOutlookEmailTabClosed();
  assert.equal(messages.length, 1);
  assert.equal(messages[0].completionId, 'existing-id');
  data = { isLtlUpdate: true };
  await context.handleOutlookEmailTabClosed();
  assert.equal(messages.length, 1);
  assert.equal(personal, 2);
  assert.equal(cleanup, 2);
  assert.equal((panel.match(/type: "sidekick-record-checkin"/g) || []).length, 1);
  assert.equal(panel.includes('navigator.clipboard.writeText(note)'), false);
});
