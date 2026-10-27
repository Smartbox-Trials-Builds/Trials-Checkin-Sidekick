const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'workers', 'device-sidekick.js'), 'utf8').split('function makePrePrepRowId()')[0];
const overview = 'https://entra.microsoft.com/#view/Microsoft_AAD_Devices/DevicesMenuBlade/~/Devices/menuId/Overview';

function setup(executeScript) {
  const context = {
    URL, console,
    document: { getElementById: () => null },
    deviceToolSetText() {},
    chrome: {
      storage: { local: { get: async () => ({ ttmtSidekickUserProfile: { role: 'Device Systems Coordinator' } }) } },
      tabs: { get: async () => ({ url: overview }) },
      scripting: { executeScript }
    }
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  context.requestContinueDeviceWipe = async () => false;
  return context;
}

test('discovers frames without sending a serial, then writes only to the device frame', async () => {
  const requests = [];
  let wizard = false;
  let managed = false;
  const context = setup(async request => {
    requests.push(request);
    if (request.func.name === 'revokeEntraDeviceLicenses') { managed = true; return [{ frameId: 0, result: { status: 'confirmed' } }]; }
    if (request.func.name === 'clickEntraRemovalConfirm') return [{ frameId: 25, result: { status: 'clicked' } }];
    if (request.func.name === 'clickEntraRemovalNext') return [{ frameId: 25, result: { status: 'clicked' } }];
    if (request.func.name === 'selectManagedAacApps') return [{ frameId: 0, result: { status: 'selected', count: 4, appNames: ['LAMP Words For Life','Grid for iPad - AAC','Proloquo2Go AAC','TouchChat HD- AAC w/ WordPower'] } }];
    if (request.func.name === 'openEntraRemoveAppsConfiguration') { wizard = true; return [{ frameId: 0, result: { status: 'opened' } }]; }
    if (request.func.name === 'selectEntraAppOption') return request.args?.[0]
      ? [{ frameId: 25, result: { status: 'selected' } }]
      : [{ frameId: 25, result: { found: true } }];
    if (request.func.name === 'clickEntraDeviceManage') return [{ frameId: 0, result: { status: 'clicked' } }];
    if (request.func.name === 'openMatchingEntraDevice') return [{ frameId: 13, result: { status: 'opened' } }];
    return request.target.allFrames
      ? [{ frameId: 0, result: { found: false } }, { frameId: 13, result: { found: true } }]
      : [{ frameId: 13, result: { entered: true } }];
  });
  context.chrome.tabs.get = async () => ({ url: managed
    ? 'https://entra.microsoft.com/#view/Microsoft_Intune_Devices/DeviceSettingsMenuBlade/~/overview/aadDeviceId/test'
    : wizard
    ? 'https://entra.microsoft.com/#view/Microsoft_Intune_Devices/SyncPayloadsWizard.ReactView/deviceName/iPad-INTERNAL-001/userId/test'
    : overview });
  await context.searchFirstWipeDevice(7, 'INTERNAL-001');
  assert.equal(requests.length, 11);
  assert.equal(requests[0].args.length, 1);
  assert.deepEqual(Array.from(requests[1].target.frameIds), [13]);
  assert.equal(requests[1].args[1], 'INTERNAL-001');
  assert.deepEqual(Array.from(requests[2].target.frameIds), [13]);
  assert.deepEqual(Array.from(requests[3].target.frameIds), [0]);
  assert.equal(requests[3].args[0], 'INTERNAL-001');
  assert.deepEqual(Array.from(requests[4].target.frameIds), [0]);
  assert.deepEqual(Array.from(requests[6].target.frameIds), [25]);
  assert.deepEqual(Array.from(requests[8].target.frameIds), [25]);
  assert.deepEqual(Array.from(requests[9].target.frameIds), [25]);
  assert.deepEqual(Array.from(requests[10].target.frameIds), [0]);
  assert.equal(requests.some(request => request.func.name === 'wipeEntraApprovedDevice'), false);
});

test('missing or ambiguous fields do not trigger any write or retry', async () => {
  for (const frames of [[], [{ frameId: 1, result: { found: true } }, { frameId: 2, result: { found: true } }]]) {
    let calls = 0;
    const context = setup(async () => { calls++; return frames; });
    await assert.rejects(context.searchFirstWipeDevice(7, 'INTERNAL-001'));
    assert.equal(calls, 1);
  }
});

test('frame discovery leaves the field untouched; writing sets value and sends Enter', () => {
  const events = [];
  class Input {
    get value() { return this._value || ''; }
    set value(value) { this._value = value; }
    getClientRects() { return [{}]; }
    focus() {}
    dispatchEvent(event) { events.push(event); }
  }
  const input = new Input();
  input.isConnected = true;
  const context = setup(async () => []);
  context.HTMLInputElement = Input;
  context.location = { hostname: 'sandbox-2.reactblade.portal.azure.net' };
  context.document.querySelector = () => input;
  context.getComputedStyle = () => ({ display: 'block', visibility: 'visible', opacity: '1' });
  context.Event = class { constructor(type, options) { this.type = type; Object.assign(this, options); } };
  context.KeyboardEvent = context.Event;
  assert.equal(context.fillEntraDeviceSearch('xpath').found, true);
  assert.equal(input.value, '');
  assert.equal(events.length, 0);
  assert.equal(context.fillEntraDeviceSearch('xpath', 'INTERNAL-001').entered, true);
  assert.equal(input.value, 'INTERNAL-001');
  assert.deepEqual(events.map(event => event.type), ['input', 'change', 'keydown', 'keypress', 'keyup']);
  assert.equal(events[2].key, 'Enter');
  // Never fall back to a generic XPath field in the outer portal shell.
  context.location.hostname = 'entra.microsoft.com';
  context.document.querySelector = () => null;
  assert.equal(context.fillEntraDeviceSearch('xpath').found, false);
});

test('opens only a unique visible device result containing the searched serial', async () => {
  for (const names of [['Other device', 'Talkpad-INTERNAL-001'], ['Other device'], ['INTERNAL-001-A', 'INTERNAL-001-B']]) {
    const context = setup(async () => []);
    const clicked = [];
    let expire;
    context.clearTimeout = () => {};
    context.setTimeout = callback => { expire = callback; return 1; };
    context.MutationObserver = class { observe() {} disconnect() {} };
    context.document.body = {};
    context.document.querySelector = () => ({ value: 'INTERNAL-001' });
    context.document.querySelectorAll = () => names.map(name => ({
      textContent: name, isConnected: true, getClientRects: () => [{}],
      getAttribute: () => null, click: () => clicked.push(name)
    }));
    context.getComputedStyle = () => ({ visibility: 'visible', display: 'block' });
    const pending = context.openMatchingEntraDevice('xpath', 'INTERNAL-001');
    if (expire) expire();
    const result = await pending;
    if (names.length === 2 && names[0] === 'Other device') {
      assert.equal(result.status, 'opened');
      assert.deepEqual(clicked, ['Talkpad-INTERNAL-001']);
    } else {
      assert.equal(result.status, names.length === 1 ? 'not-found' : 'multiple');
      assert.deepEqual(clicked, []);
    }
  }
});

test('Manage clicks only the matching device toolbar and ignores disabled or ambiguous controls', async () => {
  for (const scenario of ['matching', 'wrong-device', 'disabled', 'multiple', 'list-page']) {
    const context = setup(async () => []);
    let clicked = 0, expire;
    context.location = { hash: scenario === 'list-page' ? '#view/DevicesMenuBlade/' : '#view/DeviceDetailsMenuBlade/~/Properties' };
    context.clearTimeout = () => {};
    context.setTimeout = callback => { expire = callback; return 1; };
    context.MutationObserver = class { observe() {} disconnect() {} };
    context.getComputedStyle = () => ({ visibility: 'visible', display: 'block' });
    const button = {
      isConnected: true, getClientRects: () => [{}], getAttribute: () => null,
      disabled: scenario === 'disabled', textContent: 'Manage', click: () => { clicked++; }
    };
    const region = { querySelectorAll: () => scenario === 'multiple' ? [button, { ...button }] : [button] };
    context.document.body = {};
    context.document.querySelectorAll = () => [{
      textContent: scenario === 'wrong-device' ? 'OTHER | Properties' : 'iPad-INTERNAL-001 | Properties',
      isConnected: true, getClientRects: () => [{}], closest: () => region
    }];
    const pending = context.clickEntraDeviceManage('INTERNAL-001');
    if (expire) expire();
    const result = await pending;
    assert.equal(clicked, scenario === 'matching' ? 1 : 0);
    assert.equal(result.status, scenario === 'matching' ? 'clicked' : scenario === 'multiple' ? 'multiple' : 'not-found');
  }
});

test('opens more options once and selects only Remove apps and configuration on the matching device', async () => {
  for (const matching of [true, false]) {
    const context = setup(async () => []);
    const clicks = [];
    let menuOpen = false, expire;
    context.location = { hash: '#view/Microsoft_Intune_Devices/DeviceSettingsMenuBlade/~/overview' };
    context.clearTimeout = () => {};
    context.setTimeout = callback => { expire = callback; return 1; };
    context.MutationObserver = class { observe() {} disconnect() {} };
    context.getComputedStyle = () => ({ visibility: 'visible', display: 'block' });
    const control = (label, click) => ({
      isConnected: true, getClientRects: () => [{}],
      getAttribute: key => key === 'aria-label' ? label : null, click
    });
    const overflow = control('Show more options', () => { clicks.push('more'); menuOpen = true; });
    const remove = control('Remove apps and configuration', () => clicks.push('remove-page'));
    const unrelated = control('Wipe', () => clicks.push('wrong-action'));
    context.document.body = {};
    context.document.querySelectorAll = selector => selector === '[role="menuitem"]'
      ? (menuOpen ? [unrelated, remove] : [])
      : [{ textContent: matching ? 'iPad-INTERNAL-001' : 'iPad-OTHER',
          isConnected: true, getClientRects: () => [{}], closest: () => ({ querySelectorAll: () => [overflow] }) }];
    const pending = context.openEntraRemoveAppsConfiguration('INTERNAL-001');
    if (expire) expire();
    const result = await pending;
    assert.equal(result.status, matching ? 'opened' : 'not-found');
    assert.deepEqual(clicks, matching ? ['more', 'remove-page'] : []);
  }
});

test('Add dropdown selects App and leaves Configuration item untouched', async () => {
  const context = setup(async () => []);
  const clicked = [];
  let open = false;
  context.clearTimeout = () => {};
  context.setTimeout = () => 1;
  context.MutationObserver = class { observe() {} disconnect() {} };
  context.getComputedStyle = () => ({ display: 'block', visibility: 'visible' });
  const control = (text, click) => ({ textContent: text, isConnected: true, getClientRects: () => [{}], getAttribute: () => null, click });
  const add = control('Add', () => { clicked.push('Add'); open = true; });
  const app = control('App', () => clicked.push('App'));
  const config = control('Configuration item', () => clicked.push('Configuration item'));
  context.document.body = {};
  context.document.querySelectorAll = selector => selector === '[role="tab"]'
    ? [control('Apps and configuration to remove', () => {})]
    : selector.includes('menubar') ? [add] : open ? [config, app] : [];
  assert.equal(context.selectEntraAppOption().found, true);
  assert.deepEqual(clicked, []);
  assert.equal((await context.selectEntraAppOption(true)).status, 'selected');
  assert.deepEqual(clicked, ['Add', 'App']);
});

test('AAC app selection includes requested families and variants but never unrelated apps', async () => {
  for (const preselected of [[], ['Smartbox Link']]) {
    const context = setup(async () => []);
    const selected = [...preselected], clicked = [];
    const names = ['Grid for iPad - AAC', 'LAMP Words For Life', 'Proloquo2Go AAC', 'Smartbox Link', 'TouchChat HD- AAC w/ WordPower', 'Dialogue AAC'];
    let expire;
    context.location = { hash: '#view/Microsoft_Intune_Devices/SyncPayloadsWizard.ReactView/deviceName/iPad-INTERNAL-001/userId/test' };
    context.clearTimeout = () => {};
    context.setTimeout = callback => { expire = callback; return 1; };
    context.queueMicrotask = queueMicrotask;
    context.MutationObserver = class { observe() {} disconnect() {} };
    context.getComputedStyle = () => ({ display: 'block', visibility: 'visible' });
    const visible = { isConnected: true, getClientRects: () => [{}], getAttribute: () => null };
    const row = name => ({ ...visible,
      querySelector: () => ({ textContent: name }),
      querySelectorAll: () => [{ textContent: name }, { textContent: 'Installed' }],
      click: () => { selected.push(name); clicked.push(name); }
    });
    const headerRow = { querySelector: selector => selector.includes(', td') ? { textContent: 'App name' } : null };
    const availableGrid = { getAttribute: () => null, querySelectorAll: selector => selector.includes('columnheader')
      ? [{ textContent: 'App name' }, { textContent: 'Installation status' }]
      : names.filter(name => !selected.includes(name)).map(row) };
    const selectedGrid = { getAttribute: () => 'Selected apps', querySelectorAll: () => [headerRow, ...selected.map(row)] };
    const select = { ...visible, textContent: 'Select', click: () => clicked.push('Select') };
    const panel = { querySelector: () => null,
      querySelectorAll: selector => selector === '[role="grid"]' ? [availableGrid, selectedGrid] : [select] };
    context.document.body = {};
    context.document.querySelectorAll = () => [{ ...visible, textContent: 'Select managed apps',
      closest: selector => selector.includes('section') ? panel : null }];
    const pending = context.selectManagedAacApps('INTERNAL-001');
    // Let row-click updates finish before the simulated timeout.
    await new Promise(resolve => setImmediate(resolve));
    expire();
    const result = await pending;
    if (preselected.length) {
      assert.equal(result.status, 'unrelated-selection');
      assert.deepEqual(clicked, []);
    } else {
      assert.equal(result.status, 'selected');
      assert.equal(result.count, 5);
      assert.deepEqual(clicked, [...names.filter(name => name !== 'Smartbox Link'), 'Select']);
    }
  }
});

test('Remove is clicked once only when the review contains exactly the prepared apps', async () => {
  for (const scenario of ['matching', 'changed-app', 'configuration', 'disabled']) {
    const context = setup(async () => []);
    let clicks = 0, expire;
    context.clearTimeout = () => {};
    context.setTimeout = callback => { expire = callback; return 1; };
    context.MutationObserver = class { observe() {} disconnect() {} };
    context.getComputedStyle = () => ({ display: 'block', visibility: 'visible' });
    const visible = { isConnected: true, getClientRects: () => [{}] };
    const review = { ...visible, getAttribute: name => name === 'aria-label' ? 'Review + remove' : null,
      querySelectorAll: () => [{ querySelectorAll: () => [
        { textContent: scenario === 'changed-app' ? 'Smartbox Link' : 'LAMP Words For Life' },
        { textContent: scenario === 'configuration' ? 'Configuration item' : 'Application' }
      ] }] };
    const button = { ...visible, disabled: scenario === 'disabled', getAttribute: () => null,
      textContent: 'Remove', click: () => { clicks++; } };
    context.document.body = {};
    context.document.querySelectorAll = selector => selector === '[role="tabpanel"]' ? [review] : [button];
    const pending = context.clickEntraRemovalConfirm(['LAMP Words For Life']);
    if (expire) expire();
    const result = await pending;
    assert.equal(clicks, scenario === 'matching' ? 1 : 0);
    assert.equal(result.status, scenario === 'matching' ? 'clicked' : scenario === 'disabled' ? 'not-found' : 'selection-changed');
  }
});

test('Revoke Licenses confirms only its own matching-device popup, including overflow controls', async () => {
  for (const scenario of ['direct', 'overflow', 'wrong-device', 'wrong-action', 'preexisting-dialog']) {
    const context = setup(async () => []);
    const clicks = [];
    let dialogOpen = scenario === 'preexisting-dialog', menuOpen = false, expire;
    context.location = { origin: 'https://entra.microsoft.com', hash: '#view/Microsoft_Intune_Devices/DeviceSettingsMenuBlade/~/overview' };
    context.clearTimeout = () => {};
    context.setTimeout = callback => { expire = callback; return 1; };
    context.queueMicrotask = queueMicrotask;
    context.MutationObserver = class { observe() {} disconnect() {} };
    context.getComputedStyle = () => ({ display: 'block', visibility: 'visible' });
    const visible = { isConnected: true, getClientRects: () => [{}] };
    const control = (label, action) => ({ ...visible, textContent: label, getAttribute: () => null, click: action });
    const revoke = control('Revoke Licenses', () => { clicks.push('revoke'); dialogOpen = true; });
    const more = control('Show more options', () => { clicks.push('more'); menuOpen = true; });
    const yes = control('Yes', () => clicks.push('yes'));
    const title = scenario === 'wrong-action' ? 'Wipe device - INTERNAL-001'
      : 'Revoke all licensed apps - ' + (scenario === 'wrong-device' ? 'OTHER' : 'iPad-INTERNAL-001');
    const dialog = { ...visible, getAttribute: key => key === 'aria-label' ? title : null, querySelectorAll: () => [yes] };
    const region = { querySelectorAll: () => scenario === 'overflow' ? [more] : [revoke] };
    const heading = { ...visible, textContent: 'iPad-INTERNAL-001', closest: () => region };
    context.document.body = {};
    context.document.querySelectorAll = selector => selector.startsWith('h1') ? [heading]
      : selector.startsWith('[role="dialog"]') ? (dialogOpen ? [dialog] : [])
      : (menuOpen ? [revoke] : []);
    const pending = context.revokeEntraDeviceLicenses('INTERNAL-001');
    await new Promise(resolve => setImmediate(resolve));
    if (expire) expire();
    const result = await pending;
    const success = scenario === 'direct' || scenario === 'overflow';
    assert.equal(result.status, success ? 'confirmed' : 'unexpected-dialog');
    assert.equal(clicks.filter(click => click === 'yes').length, success ? 1 : 0);
    if (scenario === 'overflow') assert.deepEqual(clicks, ['more', 'revoke', 'yes']);
    if (scenario === 'preexisting-dialog') assert.deepEqual(clicks, []);
  }
});

test('Sidekick wipe confirmation defaults focus to No; Yes, No and Escape resolve correctly', async () => {
  for (const choice of ['Yes', 'No', 'Escape']) {
    const context = setup(async () => []);
    context.chrome.windows = { getCurrent: async () => ({ id: 1 }), update: async () => {} };
    let dialog, focused;
    context.document.createElement = tag => ({
      tag, children: [], listeners: {}, setAttribute() {},
      append(...children) { this.children.push(...children); },
      addEventListener(type, listener) { this.listeners[type] = listener; },
      showModal() {}, focus() { focused = this.textContent; },
      close() { this.closed = true; this.listeners.close?.(); },
      remove() { this.removed = true; }
    });
    context.document.body = { append: element => { dialog = element; } };
    const original = source.slice(source.indexOf('async function requestContinueDeviceWipe('), source.indexOf('function wipeEntraApprovedDevice('));
    vm.runInContext(original, context);
    const pending = context.requestContinueDeviceWipe('INTERNAL-001');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(focused, 'No');
    assert.equal(dialog.children[0].textContent, 'Continue to wipe?');
    if (choice === 'Escape') dialog.listeners.cancel({ preventDefault() {} });
    else dialog.children[2].children.find(button => button.textContent === choice).listeners.click();
    assert.equal(await pending, choice === 'Yes');
    assert.equal(dialog.closed, true);
    assert.equal(dialog.removed, true);
  }
});

test('approved wipe clicks both Wipe buttons once and refuses changed devices or other popups', async () => {
  for (const scenario of ['matching', 'changed-page', 'wrong-popup', 'preexisting-popup']) {
    const context = setup(async () => []);
    const clicks = [];
    let popup = scenario === 'preexisting-popup', expire;
    const approved = '#view/Microsoft_Intune_Devices/DeviceSettingsMenuBlade/~/overview/aadDeviceId/device-1';
    context.location = { origin: 'https://entra.microsoft.com', hash: scenario === 'changed-page' ? 'other' : approved };
    context.clearTimeout = () => {};
    context.setTimeout = callback => { expire = callback; return 1; };
    context.queueMicrotask = queueMicrotask;
    context.MutationObserver = class { observe() {} disconnect() {} };
    context.getComputedStyle = () => ({ display: 'block', visibility: 'visible' });
    const visible = { isConnected: true, getClientRects: () => [{}] };
    const control = (action) => ({ ...visible, getAttribute: () => null, textContent: 'Wipe', click: action });
    const start = control(() => { clicks.push('toolbar-wipe'); popup = true; });
    const final = control(() => clicks.push('popup-wipe'));
    const region = { querySelectorAll: () => [start] };
    const heading = { ...visible, textContent: 'iPad-INTERNAL-001', closest: () => region };
    const dialog = { ...visible, getAttribute: key => key === 'aria-label'
      ? 'Are you sure you want to wipe ' + (scenario === 'wrong-popup' ? 'OTHER' : 'iPad-INTERNAL-001') : null,
      querySelectorAll: () => [final] };
    context.document.body = {};
    context.document.querySelectorAll = selector => selector.startsWith('h1') ? [heading] : popup ? [dialog] : [];
    const pending = context.wipeEntraApprovedDevice('INTERNAL-001', approved);
    await new Promise(resolve => setImmediate(resolve));
    if (expire) expire();
    const result = await pending;
    assert.equal(result.status, scenario === 'matching' ? 'confirmed' : scenario === 'changed-page' ? 'device-changed' : 'unexpected-dialog');
    assert.equal(clicks.filter(click => click === 'popup-wipe').length, scenario === 'matching' ? 1 : 0);
    if (scenario === 'matching') assert.deepEqual(clicks, ['toolbar-wipe', 'popup-wipe']);
  }
});

test('post-wipe No stops; Yes only clicks All devices then shows the ending prompt', async () => {
  for (const approved of [false, true]) {
    const requests = [], alerts = [];
    let inOverview = false, endings = 0;
    const context = setup(async request => {
      requests.push(request);
      if (request.func.name === 'clickEntraAllDevicesBreadcrumb') { inOverview = true; return [{ result: { status: 'clicked' } }]; }
      throw new Error('Unexpected action: ' + request.func.name);
    });
    vm.runInContext('prePrepRows = [{ internalSerial: "INTERNAL-001" }]', context);
    context.requestWipeOutcome = async () => approved;
    context.finishWipeDevice = async serial => { endings++; assert.equal(serial, 'INTERNAL-001'); return null; };
    context.alert = message => alerts.push(message);
    context.chrome.tabs.get = async () => ({ windowId: 2, url: inOverview ? overview : 'https://entra.microsoft.com/#view/Microsoft_Intune_Devices/DeviceSettingsMenuBlade/aadDeviceId/test' });
    context.chrome.tabs.update = async () => {};
    context.chrome.windows = { update: async () => {} };
    await context.selectDeviceAfterWipe(7, 'INTERNAL-001');
    assert.deepEqual(requests.map(request => request.func.name), approved
      ? ['clickEntraAllDevicesBreadcrumb'] : []);
    assert.equal(endings, approved ? 1 : 0);
    if (!approved) assert.match(alerts[0], /complete the wipe manually/);
    else {
      assert.equal(alerts.length, 0);
      assert.deepEqual(Array.from(requests.at(-1).target.frameIds), [0]);
    }
  }
});

test('completion persists Wiped and offers the next unfinished device, or Close for the last device', async () => {
  for (const scenario of ['next', 'last', 'close', 'escape']) {
    const context = setup(async () => { throw new Error('Completion must not send browser actions'); });
    context.chrome.windows = { getCurrent: async () => ({ id: 1 }), update: async () => {} };
    let dialog, saved = 0, rendered = 0;
    context.saveDeviceDraft = async () => { saved++; };
    context.renderPrePrepRows = () => { rendered++; };
    context.document.createElement = tag => ({
      tag, children: [], listeners: {}, setAttribute() {},
      append(...children) { this.children.push(...children); },
      addEventListener(type, listener) { this.listeners[type] = listener; },
      showModal() {}, focus() {},
      close() { this.listeners.close?.(); }, remove() {}
    });
    context.document.body = { append: element => { dialog = element; } };
    vm.runInContext(`prePrepRows = [
      {id: 'old', internalSerial: 'OLD', wiped: true},
      {id: 'current', internalSerial: 'CURRENT'},
      ${scenario === 'last' ? '' : "{id: 'next', internalSerial: 'NEXT'},"}
    ]`, context);
    const pending = context.finishWipeDevice('CURRENT');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(vm.runInContext('prePrepRows[1].wiped', context), true);
    assert.equal(saved, 1);
    assert.equal(rendered, 1);
    assert.match(dialog.children[1].textContent, /Delete this device from Entra/);
    const buttons = dialog.children[2].children;
    assert.deepEqual(buttons.map(button => button.textContent), scenario === 'last' ? ['Close'] : ['Close', 'Next device']);
    if (scenario === 'escape') dialog.listeners.cancel({ preventDefault() {} });
    else buttons.find(button => button.textContent === (scenario === 'next' ? 'Next device' : 'Close')).listeners.click();
    const result = await pending;
    if (scenario === 'next') { assert.equal(result.id, 'next'); assert.equal(result.serial, 'NEXT'); }
    else assert.equal(result, null);
  }
});

test('device checkbox selection never selects all, a name link, duplicate matches or an unrelated row', async () => {
  for (const scenario of ['matching', 'already-selected', 'multiple', 'other-selected', 'no-match']) {
    const context = setup(async () => []);
    const clicked = [];
    let expire;
    context.clearTimeout = () => {};
    context.setTimeout = callback => { expire = callback; return 1; };
    context.queueMicrotask = queueMicrotask;
    context.MutationObserver = class { observe() {} disconnect() {} };
    context.getComputedStyle = () => ({ display: 'block', visibility: 'visible' });
    const visible = { isConnected: true, getClientRects: () => [{}] };
    const row = (name, checked) => {
      const checkbox = { ...visible, checked, getAttribute: () => null,
        click: () => { checkbox.checked = true; clicked.push(name); } };
      const cells = [{}, { querySelector: () => ({ textContent: name, click: () => { throw new Error('Device name must not be clicked'); } }) }];
      return { ...visible, querySelectorAll: () => cells,
        querySelector: selector => selector === '[role="gridcell"]' ? cells[0] : checkbox };
    };
    const rows = [row(scenario === 'no-match' ? 'Other' : 'iPad-INTERNAL-001', scenario === 'already-selected')];
    if (scenario === 'multiple') rows.push(row('Talkpad-INTERNAL-001', false));
    if (scenario === 'other-selected') rows.push(row('Other', true));
    const grid = { ...visible, getAttribute: key => key === 'aria-label' ? 'All devices' : null,
      querySelectorAll: selector => selector === '[role="columnheader"]' ? [{ textContent: 'Select row' }, { textContent: 'Name' }] : rows };
    context.document.body = {};
    context.document.querySelector = () => ({ value: 'INTERNAL-001' });
    context.document.querySelectorAll = () => [grid];
    const pending = context.selectEntraDeviceCheckbox('xpath', 'INTERNAL-001');
    await new Promise(resolve => setImmediate(resolve));
    if (expire) expire();
    const result = await pending;
    assert.equal(result.status, scenario === 'multiple' ? 'multiple' : scenario === 'other-selected' ? 'other-selected'
      : scenario === 'no-match' ? 'not-found' : 'selected');
    assert.deepEqual(clicked, scenario === 'matching' ? ['iPad-INTERNAL-001'] : []);
  }
});


