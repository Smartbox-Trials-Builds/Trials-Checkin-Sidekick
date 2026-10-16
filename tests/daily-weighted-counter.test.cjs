const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const panel = fs.readFileSync(path.join(__dirname, '..', 'panel.js'), 'utf8');
const extract = (start, end) => panel.slice(panel.indexOf(start), panel.indexOf(end, panel.indexOf(start)));

function setup() {
  const storage = {};
  const text = {};
  let today = '2026-10-16T12:00:00';
  let raw = { checkins: 25, preps: 10, qas: 5, custom: 2 };
  let weekly = 100;
  const context = {
    Date: class extends Date { constructor() { super(today); } }, console, setInterval() {},
    DAILY_WEIGHTED_COUNTER_ENABLED_STORAGE_KEY: 'enabled', DAILY_WEIGHTED_COUNTER_STORAGE_KEY: 'weighted',
    getStoredValue: async key => storage[key], setStoredValue: async (key, value) => { storage[key] = value; },
    setText: (key, value) => { text[key] = value; },
    getDailyCounters: async () => ({ ...raw }), setDailyCounters: async counters => { raw = counters; },
    updateDailyCounterDisplay() {}, adjustWeeklyCounterByDelta: async delta => { weekly += delta; }
  };
  vm.createContext(context);
  vm.runInContext([
    extract('const DAILY_COUNTER_WEIGHTS =', 'function normalizeCustomCounterLabel('),
    extract('async function getDailyWeightedCounterEnabled()', 'async function getDailyCustomCounterLabel()'),
    extract('async function incrementDailyCounter(key)', 'async function clearWeeklyCounters()')
  ].join('\n'), context);
  return { context, storage, text, nextDay: () => { today = '2026-10-17T00:00:01'; }, weekly: () => weekly };
}

test('uses weekly weights, tracks while disabled, and ignores undated old counts', async () => {
  const { context, text, weekly } = setup();
  assert.equal(await context.getDailyWeightedCounterEnabled(), false);
  await context.refreshDailyWeightedCounter();
  assert.equal(text.dailyWeightedCount, '0');
  await context.incrementDailyCounter('checkins');
  await context.incrementDailyCounter('preps');
  await context.incrementDailyCounter('qas');
  await context.incrementDailyCounter('custom');
  assert.equal(text.dailyWeightedCount, '4');
  assert.equal(Math.round(weekly() * 10000) / 10000, 104);
  await context.adjustDailyCounter('preps', -1);
  assert.equal(text.dailyWeightedCount, '2.3988');
});

test('rolls over at midnight without changing weekly totals; clear resets today', async () => {
  const { context, text, nextDay, weekly } = setup();
  await context.incrementDailyCounter('preps');
  const before = weekly();
  nextDay();
  await context.refreshDailyWeightedCounter();
  assert.equal(text.dailyWeightedCount, '0');
  assert.equal(weekly(), before);
  await context.incrementDailyCounter('qas');
  assert.equal(text.dailyWeightedCount, '0.693');
  await context.clearDailyCounters();
  assert.equal(text.dailyWeightedCount, '0');
});

test('both optional tiles are independent and limited to the coordinator role', async () => {
  const elements = Object.fromEntries(['dailyCustomCounterItem', 'dailyWeightedCounterItem', 'dailyCounterGrid'].map(id => [id, { style: {}, classList: { toggle(name, on) { this[name] = on; } } }]));
  let custom = true, weighted = true, role = 'Device Coordinator';
  const context = {
    Promise, document: { getElementById: id => elements[id] },
    getDailyCustomCounterEnabled: async () => custom,
    getDailyCustomCounterLabel: async () => 'Calls',
    getDailyWeightedCounterEnabled: async () => weighted,
    getUserProfile: async () => ({ role }), updateDailyCustomLabel() {}, refreshDailyWeightedCounter: async () => {}
  };
  vm.createContext(context);
  vm.runInContext(extract('async function updateDailyCustomCounterSettings()', 'async function updateWeeklyAverageVisibility()'), context);
  await context.updateDailyCustomCounterSettings();
  assert.equal(elements.dailyCustomCounterItem.style.display, '');
  assert.equal(elements.dailyWeightedCounterItem.style.display, '');
  custom = false;
  await context.updateDailyCustomCounterSettings();
  assert.equal(elements.dailyCustomCounterItem.style.display, 'none');
  assert.equal(elements.dailyWeightedCounterItem.style.display, '');
  custom = true; weighted = false;
  await context.updateDailyCustomCounterSettings();
  assert.equal(elements.dailyCustomCounterItem.style.display, '');
  assert.equal(elements.dailyWeightedCounterItem.style.display, 'none');
  weighted = true; role = 'Device Systems Coordinator';
  await context.updateDailyCustomCounterSettings();
  assert.equal(elements.dailyWeightedCounterItem.style.display, 'none');
});
