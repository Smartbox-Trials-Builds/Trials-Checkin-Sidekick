const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../workers/device-sidekick.js'), 'utf8').split('function makePrePrepRowId()')[0];
const overview = 'https://intune.microsoft.com/#view/Microsoft_Intune_DeviceSettings/DevicesMenu/~/allDevices';

function setup(executeScript = async () => []) {
  const buttons = Object.fromEntries(['beginWipeBtn', 'beginAddingProfilesBtn'].map(id => [id, { listeners: {}, addEventListener(type, fn) { this.listeners[type] = fn; } }]));
  const context = { URL, console, deviceToolSetText() {}, document: { getElementById: id => buttons[id] },
    chrome: { storage: { local: { get: async () => ({ ttmtSidekickUserProfile: { role: 'Device Systems Coordinator' } }) } },
      tabs: { get: async () => ({ url: overview }) }, scripting: { executeScript } } };
  vm.createContext(context);
  vm.runInContext(source, context);
  vm.runInContext('prePrepRows = [{ internalSerial: "FIRST", wiped: true, category: "Talkpad 10" }, { internalSerial: "SECOND" }]', context);
  return { context, buttons };
}

test('profile search discovers the device-list frame, submits once, then opens the matching device', async () => {
  const calls = [];
  const { context } = setup(async request => {
    calls.push(request);
    if (request.func.name === 'openIntuneProfileDevice') return [{ result: { status: 'opened' } }];
    return request.target.allFrames ? [{ frameId: 0, result: { found: false } }, { frameId: 9, result: { found: true } }] : [{ result: { entered: true } }];
  });
  let propertiesSerial;
  context.openIntunePropertiesForProfiles = async (tabId, serial) => { assert.equal(tabId, 7); propertiesSerial = serial; };
  let selectedCategory;
  context.applyIntuneProfileCategory = async (tabId, serial, category) => { assert.equal(serial, 'FIRST'); selectedCategory = category; };
  await context.searchIntuneForProfiles(7, 'FIRST');
  assert.equal(propertiesSerial, 'FIRST');
  assert.equal(selectedCategory, 'Talkpad 10');
  assert.equal(calls.length, 3);
  assert.equal(calls[0].args, undefined);
  assert.equal(calls[1].args[0], 'FIRST');
  assert.deepEqual(Array.from(calls[1].target.frameIds), [9]);
  assert.equal(calls[2].func.name, 'openIntuneProfileDevice');
  assert.equal(calls[2].args[0], 'FIRST');
  assert.deepEqual(Array.from(calls[2].target.frameIds), [9]);
});

test('profile button reuses Intune tab or opens one and takes the first serial regardless of Wiped', async () => {
  for (const existing of [true, false]) {
    const { context, buttons } = setup();
    const actions = [];
    context.chrome.tabs.query = async () => existing ? [{ id: 7, windowId: 2, url: overview }] : [];
    context.chrome.tabs.update = async id => { actions.push('focus'); return { id }; };
    context.chrome.tabs.create = async options => { assert.equal(options.url, overview); actions.push('create'); return { id: 8 }; };
    context.chrome.windows = { update: async () => {} };
    context.searchIntuneForProfiles = async (tabId, serial) => { assert.equal(serial, 'FIRST'); assert.equal(tabId, existing ? 7 : 8); actions.push('search'); };
    await buttons.beginAddingProfilesBtn.listeners.click({ currentTarget: buttons.beginAddingProfilesBtn });
    assert.deepEqual(actions, [existing ? 'focus' : 'create', 'search']);
    assert.equal(buttons.beginAddingProfilesBtn.disabled, false);
    assert.equal(buttons.beginWipeBtn.disabled, false);
  }
});

test('profile search rejects ambiguous fields and changed list, page or role without writing', async () => {
  for (const scenario of ['ambiguous', 'list', 'page', 'role']) {
    const calls = [];
    const { context } = setup(async request => { calls.push(request); return [{ frameId: 1, result: { found: true } }, { frameId: 2, result: { found: true } }]; });
    if (scenario === 'list') vm.runInContext('prePrepRows = []', context);
    if (scenario === 'page') context.chrome.tabs.get = async () => ({ url: 'https://intune.microsoft.com/#home' });
    if (scenario === 'role') context.chrome.storage.local.get = async () => ({ ttmtSidekickUserProfile: { role: 'Device Coordinator' } });
    await assert.rejects(context.searchIntuneForProfiles(7, 'FIRST'));
    assert.equal(calls.length, scenario === 'ambiguous' ? 1 : 0);
    assert.equal(calls.some(call => call.args), false);
  }
});

test('mapped Intune input excludes shell search and only enters a unique visible device search', () => {
  const { context } = setup();
  const events = [];
  class Input {
    get value() { return this._value || ''; }
    set value(value) { this._value = value; }
    focus() {}
    getClientRects() { return [{}]; }
    dispatchEvent(event) { events.push(event.type); }
  }
  const input = new Input(); input.isConnected = true;
  context.HTMLInputElement = Input;
  context.location = { hostname: 'intune.microsoft.com' };
  context.getComputedStyle = () => ({ display: 'block', visibility: 'visible', opacity: '1' });
  const table = { isConnected: true, getClientRects: () => [{}] };
  context.document.querySelectorAll = selector => selector.startsWith('[role=') ? [table] : [input];
  context.Event = class { constructor(type, options) { this.type = type; Object.assign(this, options); } };
  context.KeyboardEvent = context.Event;
  assert.equal(context.fillIntuneProfileSearch('FIRST').found, false);
  assert.equal(input.value, '');
  context.location.hostname = 'sandbox-2.reactblade.portal.azure.net';
  assert.equal(context.fillIntuneProfileSearch().found, true);
  assert.equal(input.value, '');
  assert.equal(context.fillIntuneProfileSearch('FIRST').entered, true);
  assert.equal(input.value, 'FIRST');
  assert.deepEqual(events, ['input', 'change', 'keydown', 'keypress', 'keyup']);
  context.document.querySelectorAll = selector => selector.startsWith('[role=') ? [table] : [input, input];
  assert.equal(context.fillIntuneProfileSearch('SECOND').ambiguous, true);
  assert.equal(input.value, 'FIRST');
});

test('Intune result opening handles generic iPad names and refuses changed search, multiple results and wrong links', async () => {
  for (const scenario of ['named', 'generic', 'multiple', 'changed', 'wrong-link', 'loading']) {
    const { context } = setup();
    const clicks = [];
    const timers = new Map(); let id = 0;
    context.setTimeout = (fn, delay) => { timers.set(++id, { fn, delay }); return id; };
    context.clearTimeout = timer => timers.delete(timer);
    context.MutationObserver = class { observe() {} disconnect() {} };
    context.getComputedStyle = () => ({ visibility: 'visible', display: 'block' });
    const visible = { isConnected: true, getClientRects: () => [{}] };
    const link = (name, key, origin = 'https://intune.microsoft.com') => ({ ...visible, textContent: name,
      getAttribute: () => `${origin}/#blade/Microsoft_Intune_ManagedDevices/ManagedDeviceMenu.MenuView/managedDeviceId/${key}`,
      click: () => clicks.push(key) });
    const links = scenario === 'multiple' ? [link('iPad-FIRST', 'a'), link('iPad-FIRST', 'b')]
      : [link(scenario === 'generic' ? 'iPad' : 'iPad-FIRST', 'a', scenario === 'wrong-link' ? 'https://example.com' : undefined)];
    const table = { ...visible, getAttribute: () => scenario === 'loading' ? 'true' : null, querySelectorAll: () => links };
    context.document.body = {};
    context.document.querySelectorAll = selector => selector.startsWith('input') ? [{ ...visible, value: scenario === 'changed' ? 'OTHER' : 'FIRST' }]
      : selector.startsWith('[role="progressbar"]') ? [] : [table];
    const pending = context.openIntuneProfileDevice('FIRST');
    const settle = [...timers.values()].find(timer => timer.delay === 800);
    if (settle) settle.fn();
    else [...timers.values()].find(timer => timer.delay === 20000)?.fn();
    const result = await pending;
    assert.equal(result.status, ['named', 'generic'].includes(scenario) ? 'opened' : scenario === 'changed' ? 'search-changed' : 'not-found');
    assert.deepEqual(clicks, ['named', 'generic'].includes(scenario) ? ['a'] : []);
  }
});

test('Properties clicks the tab and only Basics Edit after verifying the exact device serial', async () => {
  for (const scenario of ['normal', 'already-selected', 'wrong-serial', 'ambiguous-edit', 'disabled-edit']) {
    const { context } = setup();
    const clicks = [];
    const visible = { isConnected: true, getClientRects: () => [{}] };
    const properties = { ...visible, textContent: 'Properties', selected: scenario === 'already-selected',
      getAttribute: key => key === 'aria-label' ? 'Properties tab' : key === 'aria-selected' ? String(properties.selected) : null,
      click: () => { properties.selected = true; clicks.push('properties'); } };
    const edit = { ...visible, textContent: 'Edit', disabled: scenario === 'disabled-edit', getAttribute: () => null, click: () => clicks.push('edit') };
    const tabs = { ...visible, querySelectorAll: selector => selector === '[role="tab"]' ? [properties]
      : selector.startsWith('h1') ? [{ ...visible, textContent: 'Basics' }]
      : scenario === 'ambiguous-edit' ? [edit, edit] : [edit] };
    context.document.getElementById = id => id === 'managed-device-resource-view-tab-view' ? tabs : null;
    context.document.querySelectorAll = () => [{ ...visible, textContent: scenario === 'wrong-serial' ? 'OTHER' : 'FIRST' }];
    context.document.body = {};
    context.getComputedStyle = () => ({ display: 'block', visibility: 'visible' });
    context.MutationObserver = class { observe() {} disconnect() {} };
    let expire;
    context.setTimeout = fn => { expire = fn; return 1; };
    context.clearTimeout = () => {};
    assert.equal(context.clickIntunePropertiesEdit('FIRST').found, scenario !== 'wrong-serial');
    assert.deepEqual(clicks, []);
    const pending = context.clickIntunePropertiesEdit('FIRST', true);
    if (['ambiguous-edit', 'disabled-edit'].includes(scenario)) expire();
    const result = await pending;
    if (scenario === 'wrong-serial') { assert.equal(result.found, false); assert.deepEqual(clicks, []); }
    else if (['normal', 'already-selected'].includes(scenario)) {
      assert.equal(result.status, 'clicked');
      assert.deepEqual(clicks, scenario === 'normal' ? ['properties', 'edit'] : ['edit']);
    } else { assert.equal(result.status, 'not-found'); assert.deepEqual(clicks, ['properties']); }
  }
});

test('Properties workflow finds the verified device frame and confirms Edit properties opens', async () => {
  let opened = false;
  const calls = [];
  const { context } = setup(async request => {
    calls.push(request);
    if (request.target.allFrames) return [{ frameId: 0, result: { found: false } }, { frameId: 12, result: { found: true } }];
    opened = true;
    return [{ result: { status: 'clicked' } }];
  });
  context.chrome.tabs.get = async () => ({ url: opened
    ? 'https://intune.microsoft.com/#view/Microsoft_Intune_ManagedDevices/PropertiesWizard.ReactView/formType/DeviceBasic'
    : 'https://intune.microsoft.com/#view/Microsoft_Intune_ManagedDevices/ManagedDeviceMenu.MenuView/~/overview/managedDeviceId/device-id' });
  await context.openIntunePropertiesForProfiles(7, 'FIRST');
  assert.equal(calls.length, 2);
  assert.deepEqual(Array.from(calls[1].target.frameIds), [12]);
  assert.deepEqual(Array.from(calls[1].args), ['FIRST', true]);
});

test('each Sidekick category maps to its exact Intune category on the verified Edit form', async () => {
  for (const [choice, expected] of [['Talkpad 10', 'Wego TalkPad 10'], ['Talkpad 8', 'Wego TalkPad 8'], ['Wego 13', 'Wego 13a'], ['Wego 5', 'Wego 5a']]) {
    const calls = [];
    const { context } = setup(async request => {
      calls.push(request);
      if (request.func.name === 'clickIntuneProfileNext') return [{ result: { status: 'review' } }];
      if (request.func.name === 'saveIntuneProfileCategory') return [{ result: { status: 'clicked' } }];
      if (request.func.name === 'returnToIntuneAllDevices') return [{ result: { status: 'clicked' } }];
      return request.target.allFrames ? [{ frameId: 15, result: { found: true } }] : [{ result: { status: 'selected' } }];
    });
    vm.runInContext(`prePrepRows[0].category = ${JSON.stringify(choice)}`, context);
    let clearedSerial;
    context.clearIntuneSearchAfterProfiles = async (tabId, serial) => { assert.equal(tabId, 7); clearedSerial = serial; };
    context.chrome.tabs.get = async () => ({ url: `https://intune.microsoft.com/#view/Microsoft_Intune_ManagedDevices/PropertiesWizard.ReactView/initialValues~/${encodeURIComponent(JSON.stringify({ deviceIntuneName: 'FIRST_9_date', deviceName: 'iPad' }))}/formConfig~/{}` });
    await context.applyIntuneProfileCategory(7, 'FIRST', choice);
    assert.equal(clearedSerial, 'FIRST');
    assert.equal(calls.length, 5);
    assert.deepEqual(Array.from(calls[1].args), [expected, true]);
    assert.deepEqual(Array.from(calls[1].target.frameIds), [15]);
    assert.equal(calls[2].func.name, 'clickIntuneProfileNext');
    assert.deepEqual(Array.from(calls[2].args), [expected]);
    assert.equal(calls[3].func.name, 'saveIntuneProfileCategory');
    assert.deepEqual(Array.from(calls[3].args), ['FIRST', expected]);
    assert.equal(calls[4].func.name, 'returnToIntuneAllDevices');
    assert.deepEqual(Array.from(calls[4].target.frameIds), [0]);
    context.chrome.tabs.get = async () => ({ url: 'https://intune.microsoft.com/#view/Microsoft_Intune_ManagedDevices/PropertiesWizard.ReactView/initialValues~/%7B%22deviceName%22%3A%22OTHER%22%7D/formConfig~/%7B%7D' });
    await assert.rejects(context.applyIntuneProfileCategory(7, 'FIRST', choice));
    assert.equal(calls.length, 5);
  }
});

test('category dropdown selects exact labels, skips an existing match and rejects unrestricted or ambiguous options', async () => {
  for (const scenario of ['select', 'already', 'unrestricted', 'ambiguous']) {
    const { context } = setup();
    const clicks = [];
    let expire;
    const visible = { isConnected: true, getClientRects: () => [{}] };
    const control = { ...visible, value: scenario === 'already' ? 'Wego TalkPad 10' : 'Wego TalkPad 8', getAttribute: key => key === 'aria-controls' ? 'category-list' : null,
      click: () => clicks.push('open') };
    const option = { ...visible, textContent: scenario === 'unrestricted' ? 'Wego TalkPad 10 - Unrestricted' : 'Wego TalkPad 10',
      getAttribute: () => null, click: () => { clicks.push('category'); control.value = option.textContent; } };
    const list = { ...visible, querySelectorAll: () => scenario === 'ambiguous' ? [option, option] : [option] };
    context.document.getElementById = id => id === 'device-category-dropdown' ? control : id === 'category-list' ? list : null;
    context.document.querySelectorAll = () => [];
    context.document.body = {};
    context.MutationObserver = class { observe() {} disconnect() {} };
    context.getComputedStyle = () => ({ display: 'block', visibility: 'visible' });
    context.setTimeout = fn => { expire = fn; return 1; };
    context.clearTimeout = () => {};
    context.queueMicrotask = fn => fn();
    assert.equal(context.selectIntuneDeviceCategory('Wego TalkPad 10').found, true);
    const pending = context.selectIntuneDeviceCategory('Wego TalkPad 10', true);
    if (['unrestricted', 'ambiguous'].includes(scenario)) expire();
    const result = await pending;
    assert.equal(result.status, ['select', 'already'].includes(scenario) ? 'selected' : 'not-found');
    assert.deepEqual(clicks, scenario === 'select' ? ['open', 'category'] : scenario === 'already' ? [] : ['open']);
  }
});

test('profile button requires a category before opening or searching Intune', async () => {
  const { context, buttons } = setup();
  vm.runInContext('prePrepRows[0].category = ""', context);
  context.chrome.tabs.query = async () => { throw new Error('Must not open Intune without a category'); };
  const statuses = [];
  context.deviceToolSetText = (_, text) => statuses.push(text);
  await buttons.beginAddingProfilesBtn.listeners.click({ currentTarget: buttons.beginAddingProfilesBtn });
  assert.match(statuses.at(-1), /Select a device category/);
});

test('profile Next clicks once after verifying category and stops when Review + save appears', async () => {
  for (const scenario of ['normal', 'wrong-category', 'disabled', 'ambiguous']) {
    const { context } = setup();
    let review = false, expire;
    const clicks = [];
    const visible = { isConnected: true, getClientRects: () => [{}] };
    const next = { ...visible, textContent: 'Next', disabled: scenario === 'disabled', getAttribute: () => null,
      click: () => { clicks.push('next'); review = true; } };
    const save = { ...visible, textContent: 'Save', getAttribute: () => null, click: () => clicks.push('save') };
    context.document.getElementById = () => ({ value: scenario === 'wrong-category' ? 'Wego 5a' : 'Wego TalkPad 8' });
    context.document.querySelectorAll = selector => selector.startsWith('button') ? review ? [save] : scenario === 'ambiguous' ? [next, next] : [next]
      : [{ ...visible, textContent: 'Review + save - In progress', getAttribute: () => null }];
    context.document.body = {};
    context.getComputedStyle = () => ({ display: 'block', visibility: 'visible' });
    context.MutationObserver = class { observe() {} disconnect() {} };
    context.setTimeout = fn => { expire = fn; return 1; };
    context.clearTimeout = () => {};
    context.queueMicrotask = fn => fn();
    const pending = context.clickIntuneProfileNext('Wego TalkPad 8');
    if (['disabled', 'ambiguous'].includes(scenario)) expire();
    const result = await pending;
    assert.equal(result.status, scenario === 'normal' ? 'review' : scenario === 'wrong-category' ? 'category-changed' : 'not-found');
    assert.deepEqual(clicks, scenario === 'normal' ? ['next'] : []);
  }
});

test('profile Save clicks once only for the reviewed serial and exact category', () => {
  for (const scenario of ['correct', 'wrong-serial', 'wrong-category', 'disabled', 'ambiguous', 'not-review']) {
    const { context } = setup();
    const clicks = [];
    const visible = { isConnected: true, getClientRects: () => [{}] };
    const save = { ...visible, textContent: 'Save', disabled: scenario === 'disabled', getAttribute: () => null, click: () => clicks.push('save') };
    const values = ['Management name', scenario === 'wrong-serial' ? 'OTHER_9_date' : 'FIRST_9_date', 'Device category', scenario === 'wrong-category' ? 'Wego TalkPad 8 - Unrestricted' : 'Wego TalkPad 8'];
    const root = { ...visible, querySelectorAll: selector => selector.startsWith('a,')
      ? [{ ...visible, textContent: 'Review + save - In progress', getAttribute: () => null }]
      : selector.startsWith('button') ? scenario === 'ambiguous' ? [save, save] : [save]
      : values.map(textContent => ({ ...visible, textContent })) };
    context.document.getElementById = id => id === 'root-container' ? root : scenario === 'not-review' ? {} : null;
    context.getComputedStyle = () => ({ display: 'block', visibility: 'visible' });
    const result = context.saveIntuneProfileCategory('FIRST', 'Wego TalkPad 8');
    assert.equal(result.status, scenario === 'correct' ? 'clicked' : scenario === 'not-review' ? 'not-review'
      : ['wrong-serial', 'wrong-category'].includes(scenario) ? 'review-mismatch' : 'not-ready');
    assert.deepEqual(clicks, scenario === 'correct' ? ['save'] : []);
  }
});

test('return to All devices waits for Save to leave the wizard and clicks only the Intune breadcrumb', async () => {
  for (const scenario of ['overview', 'saving', 'wrong-link', 'multiple']) {
    const { context } = setup();
    const clicks = [];
    let hashChanged, expire;
    context.location = { origin: 'https://intune.microsoft.com', href: overview,
      hash: scenario === 'saving' ? '#view/Microsoft_Intune_ManagedDevices/PropertiesWizard.ReactView/test'
        : '#view/Microsoft_Intune_ManagedDevices/ManagedDeviceMenu.MenuView/~/overview/managedDeviceId/test' };
    context.window = { addEventListener: (_, fn) => { hashChanged = fn; }, removeEventListener() {} };
    context.MutationObserver = class { observe() {} disconnect() {} };
    context.setTimeout = fn => { expire = fn; return 1; };
    context.clearTimeout = () => {};
    context.getComputedStyle = () => ({ display: 'block', visibility: 'visible' });
    const link = { isConnected: true, getClientRects: () => [{}], textContent: 'Devices | All devices',
      getAttribute: () => scenario === 'wrong-link' ? 'https://entra.microsoft.com/#view/Microsoft_Intune_DeviceSettings/DevicesMenu/~/overview' : overview,
      click: () => clicks.push('breadcrumb') };
    context.document.body = {};
    context.document.querySelectorAll = () => scenario === 'multiple' ? [link, link] : [link];
    const pending = context.returnToIntuneAllDevices();
    if (scenario === 'saving') {
      assert.deepEqual(clicks, []);
      context.location.hash = '#view/Microsoft_Intune_ManagedDevices/ManagedDeviceMenu.MenuView/~/overview/managedDeviceId/test';
      hashChanged();
    }
    if (scenario === 'multiple') expire();
    const result = await pending;
    assert.equal(result.status, ['saving', 'overview'].includes(scenario) ? 'clicked' : scenario === 'wrong-link' ? 'wrong-link' : 'not-found');
    assert.deepEqual(clicks, ['saving', 'overview'].includes(scenario) ? ['breadcrumb'] : []);
  }
});

test('device search clearing clicks only its Clear text button and leaves changed searches alone', async () => {
  for (const scenario of ['clear', 'empty', 'changed', 'ambiguous']) {
    const { context } = setup();
    const clicks = [];
    const visible = { isConnected: true, getClientRects: () => [{}] };
    const clear = { ...visible, getAttribute: key => key === 'aria-label' ? 'Clear text' : null,
      click: () => { clicks.push('clear'); input.value = ''; } };
    const scope = { querySelectorAll: () => scenario === 'ambiguous' ? [clear, clear] : [clear] };
    const input = { ...visible, value: scenario === 'empty' ? '' : scenario === 'changed' ? 'OTHER' : 'FIRST', closest: () => scope };
    context.location = { hostname: 'sandbox-1.reactblade.portal.azure.net' };
    context.document.body = {};
    context.document.querySelectorAll = selector => selector.startsWith('input') ? [input] : [visible];
    context.getComputedStyle = () => ({ display: 'block', visibility: 'visible' });
    context.MutationObserver = class { observe() {} disconnect() {} };
    context.setTimeout = () => 1;
    context.clearTimeout = () => {};
    context.queueMicrotask = fn => fn();
    assert.equal(context.clearIntuneProfileSearch('FIRST').found, true);
    assert.deepEqual(clicks, []);
    const result = await context.clearIntuneProfileSearch('FIRST', true);
    assert.equal(result.status, ['clear', 'empty'].includes(scenario) ? 'cleared' : scenario === 'changed' ? 'search-changed' : 'not-found');
    assert.deepEqual(clicks, scenario === 'clear' ? ['clear'] : []);
  }
});

test('search clearing discovers the new All devices frame and verifies it clears', async () => {
  const calls = [];
  const { context } = setup(async request => {
    calls.push(request);
    return request.target.allFrames ? [{ frameId: 0, result: { found: false } }, { frameId: 20, result: { found: true } }] : [{ result: { status: 'cleared' } }];
  });
  await context.clearIntuneSearchAfterProfiles(7, 'FIRST');
  assert.equal(calls.length, 2);
  assert.deepEqual(Array.from(calls[1].target.frameIds), [20]);
  assert.deepEqual(Array.from(calls[1].args), ['FIRST', true]);
  assert.equal(calls.every(call => call.func.name === 'clearIntuneProfileSearch'), true);
});

test('profile queue skips manual marks, marks completed rows, and resumes after a failed device', async () => {
  const { context } = setup();
  vm.runInContext(`prePrepRows = [
    { internalSerial: 'MANUAL', category: 'Wego 5', profileAdded: true },
    { internalSerial: 'FIRST', category: 'Talkpad 10', wiped: true },
    { internalSerial: 'SECOND', category: 'Talkpad 8' },
    { internalSerial: 'THIRD', category: 'Wego 13' }
  ]`, context);
  const started = [], saved = [];
  context.saveDeviceDraft = async () => { saved.push(vm.runInContext('prePrepRows.filter(row => row.profileAdded).map(row => row.internalSerial).join(",")', context)); };
  context.renderPrePrepRows = () => {};
  context.searchIntuneForProfiles = async (tabId, serial) => {
    started.push(serial);
    if (serial === 'SECOND') throw new Error('Save failed');
    return true;
  };
  await assert.rejects(context.runPendingProfiles(7), /Save failed/);
  assert.deepEqual(started, ['FIRST', 'SECOND']);
  assert.deepEqual(saved, ['MANUAL,FIRST']);
  assert.equal(vm.runInContext('nextUnprofiledDevice().internalSerial', context), 'SECOND');
  // Manually completed SECOND is skipped when Begin Adding Profiles is run again.
  vm.runInContext('prePrepRows[2].profileAdded = true', context);
  await context.runPendingProfiles(7);
  assert.deepEqual(started, ['FIRST', 'SECOND', 'THIRD']);
  assert.equal(vm.runInContext('nextUnprofiledDevice()', context), undefined);
  assert.equal(vm.runInContext('prePrepRows[1].wiped', context), true);
});

test('profile queue stops before a row with no category and never marks an incomplete script', async () => {
  const { context } = setup();
  const started = [];
  context.saveDeviceDraft = async () => {};
  context.renderPrePrepRows = () => {};
  context.searchIntuneForProfiles = async (_, serial) => { started.push(serial); return false; };
  await context.runPendingProfiles(7);
  assert.deepEqual(started, ['FIRST']);
  assert.equal(vm.runInContext('nextUnprofiledDevice().internalSerial', context), 'FIRST');
  vm.runInContext('prePrepRows[0].profileAdded = true', context);
  await assert.rejects(context.runPendingProfiles(7), /Select a device category for SECOND/);
  assert.deepEqual(started, ['FIRST']);
});
