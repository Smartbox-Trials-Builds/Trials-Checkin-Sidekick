const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const source = fs.readFileSync(require.resolve('../workers/api-wipe-test-worker.js'), 'utf8');
const DEVICE_ID = '11111111-2222-3333-4444-555555555555';
const APP_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const SERIAL = 'DRJ9H5C4PD';
const ENTRA_DEVICE_ID = '99999999-2222-3333-4444-555555555555';
const ENTRA_OBJECT_ID = '88888888-2222-3333-4444-555555555555';
const SCOPES = 'DeviceManagementApps.Read.All DeviceManagementManagedDevices.Read.All DeviceManagementManagedDevices.PrivilegedOperations.All Device.Read.All Directory.AccessAsUser.All DeviceManagementManagedDevices.ReadWrite.All Group.Read.All GroupMember.ReadWrite.All';
const GROUPS = [
  { id: 'aaaaaaaa-1111-2222-3333-444444444444', displayName: 'Loan Library', securityEnabled: true, mailEnabled: false, groupTypes: [], onPremisesSyncEnabled: false, isAssignableToRole: false },
  { id: 'bbbbbbbb-1111-2222-3333-444444444444', displayName: 'Prep Pool', securityEnabled: true, mailEnabled: false, groupTypes: [], onPremisesSyncEnabled: false, isAssignableToRole: false },
  { id: 'cccccccc-1111-2222-3333-444444444444', displayName: 'Automatic Devices', securityEnabled: true, mailEnabled: false, groupTypes: ['DynamicMembership'] }
];
const CATEGORY_NAMES = ['Wego TalkPad 10', 'Wego TalkPad 8', 'Wego 13a', 'Wego 5a'];
const CATEGORIES = CATEGORY_NAMES.map((displayName, index) => ({ id: `${index + 1}aaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee`, displayName }));

function setup(options = {}, sharedStorage) {
  const storage = sharedStorage || { sidekickIntuneLicenseAuth: { marker: 'original-license-session' }, sidekickDeviceDraft: { rows: [{ internalSerial: 'ORIGINAL' }] } };
  const calls = [];
  const deletedObjects = new Set();
  const deviceCategories = {};
  const memberships = new Set();
  let handler;
  const device = { id: DEVICE_ID, deviceName: `iPad-${SERIAL}`, serialNumber: SERIAL, operatingSystem: 'iOS', isSupervised: true, lostModeState: 'disabled', managementState: 'managed', lastSyncDateTime: '2026-11-25T12:00:00Z', deviceActionResults: [], azureADDeviceId: ENTRA_DEVICE_ID };
  const context = {
    URL, URLSearchParams, TextEncoder, Uint8Array, crypto: webcrypto, btoa, AbortController, setTimeout, clearTimeout, Date,
    chrome: {
      identity: {
        getRedirectURL: path => `https://test.chromiumapp.org/${path}`,
        launchWebAuthFlow: async ({ url }) => {
          const parsed = new URL(url);
          assert.equal(parsed.searchParams.get('code_challenge_method'), 'S256');
          assert.ok(parsed.searchParams.get('code_challenge'));
          assert.match(parsed.searchParams.get('scope'), parsed.searchParams.get('scope').includes('Directory.AccessAsUser.All') ? /Device.Read.All/ : /DeviceManagementManagedDevices.PrivilegedOperations.All/);
          return `${parsed.searchParams.get('redirect_uri')}?code=test-code&state=${options.badState ? 'bad' : parsed.searchParams.get('state')}`;
        }
      },
      runtime: { id: 'self', getURL: path => `chrome-extension://self/${path}`, onMessage: { addListener: fn => { handler = fn; } } },
      storage: {
        local: { get: async () => ({ ttmtSidekickUserProfile: { role: options.role || 'Device Systems Coordinator' } }) },
        session: { get: async key => ({ [key]: storage[key] }), set: async values => Object.assign(storage, JSON.parse(JSON.stringify(values))), remove: async key => { delete storage[key]; } },
        onChanged: { addListener() {} }
      }
    },
    fetch: async (url, settings) => {
      calls.push({ url, settings });
      const ok = data => ({ ok: true, status: 200, json: async () => data });
      if (url.includes('/token')) {
        assert.equal(new URLSearchParams(settings.body).has('client_secret'), false);
        return ok({ access_token: 'test-private-token', refresh_token: 'test-private-refresh', expires_in: 3600, scope: options.scopes || SCOPES });
      }
      assert.equal(new URL(url).origin, 'https://graph.microsoft.com');
      assert.equal(settings.headers.Authorization, 'Bearer test-private-token');
      const groupPath = new URL(url).pathname;
      if (groupPath === '/v1.0/groups') return ok({ value: options.groups || GROUPS, '@odata.nextLink': options.evilGroupsNext ? 'https://evil.example/steal' : undefined });
      if (/^\/v1.0\/groups\/[^/]+\/members\/\$ref$/.test(groupPath) && settings.method === 'POST') {
        const groupId = groupPath.split('/')[3];
        const objectId = JSON.parse(settings.body)['@odata.id'].split('/').pop();
        assert.ok([ENTRA_OBJECT_ID, ...Object.values(options.entraTargets || {}).map(target => target.id)].includes(objectId));
        if (options.failGroupId === groupId) throw new Error('Group response lost');
        memberships.add(`${groupId}|${objectId}`);
        if (options.failGroupAfterApply) throw new Error('Membership response lost after applying');
        return { ok: true, status: 204 };
      }
      if (/^\/v1.0\/groups\/[^/]+\/members$/.test(groupPath)) {
        const groupId = groupPath.split('/')[3];
        const ids = [...(options.memberships?.[groupId] || []), ...(!options.groupPending ? [...memberships].filter(value => value.startsWith(`${groupId}|`)).map(value => value.split('|')[1]) : [])];
        return ok({ value: [...new Set(ids)].map(id => ({ id })) });
      }
      if (/^\/v1.0\/groups\/[^/]+$/.test(groupPath)) return ok((options.groups || GROUPS).find(group => group.id === groupPath.split('/')[3]));
      if (settings.method === 'PUT') {
        assert.match(new URL(url).pathname, /\/managedDevices\/[a-z0-9-]+\/deviceCategory\/\$ref$/);
        const id = new URL(url).pathname.split('/')[4];
        if (options.failProfileDevice === id) throw new Error('Profile response lost');
        const categoryId = JSON.parse(settings.body)['@odata.id'].split('/').pop();
        assert.ok(CATEGORIES.some(category => category.id === categoryId));
        deviceCategories[id] = categoryId;
        if (options.failProfileAfterApply) throw new Error('Profile response lost after applying');
        return { ok: true, status: 204 };
      }
      if (settings.method === 'DELETE') {
        const objectId = new URL(url).pathname.split('/').pop();
        assert.ok([ENTRA_OBJECT_ID, ...Object.values(options.entraTargets || {}).map(target => target.id)].includes(objectId));
        if (options.failAction === 'deleteEntra') throw new Error('Delete response lost');
        if (options.forbiddenDelete) return { ok: false, status: 403, json: async () => ({ error: { code: 'Authorization_RequestDenied' } }) };
        deletedObjects.add(objectId);
        return { ok: true, status: 204 };
      }
      if (settings.method === 'POST') {
        if (options.failAction && url.endsWith(options.failAction) && (!options.failDeviceId || url.includes(options.failDeviceId))) throw new Error('Network response lost');
        return { ok: true, status: 204, json: async () => { throw new Error('204 must not be parsed'); } };
      }
      const path = new URL(url).pathname;
      if (path === '/v1.0/deviceManagement/deviceCategories') return ok({ value: options.categories || CATEGORIES });
      if (path.startsWith('/v1.0/deviceManagement/deviceCategories/')) return ok(CATEGORIES.find(category => category.id === path.split('/').pop()));
      if (path.endsWith('/deviceCategory')) {
        const id = path.split('/')[4];
        const categoryId = options.profilePending ? options.initialCategory : deviceCategories[id] || options.initialCategory;
        if (!categoryId) return { ok: false, status: 404, json: async () => ({ error: { code: 'NotFound' } }) };
        return ok(CATEGORIES.find(category => category.id === categoryId));
      }
      if (path.startsWith('/v1.0/devices(')) {
        const linked = path.match(/deviceId='([^']+)'/)[1];
        const target = options.entraTargets?.[linked] || { id: ENTRA_OBJECT_ID, deviceId: options.wrongEntraId ? DEVICE_ID : ENTRA_DEVICE_ID, displayName: `iPad-${SERIAL}` };
        return ok(target);
      }
      if (path.startsWith('/v1.0/devices/')) {
        const id = path.split('/').pop();
        if (deletedObjects.has(id) && !options.deletePending) return { ok: false, status: 404, json: async () => ({ error: { code: 'Request_ResourceNotFound' } }) };
        return ok(Object.values(options.entraTargets || {}).find(target => target.id === id) || { id: ENTRA_OBJECT_ID, deviceId: ENTRA_DEVICE_ID, displayName: `iPad-${SERIAL}` });
      }
      if (path.endsWith('/managedDevices')) return ok({ value: options.devices || (options.duplicate ? [device, { ...device, id: 'other' }] : [device]), '@odata.nextLink': options.evilNext ? 'https://evil.example/steal' : undefined });
      if (path.endsWith('/detectedApps')) {
        if (options.inventoryFailure) throw new Error('Inventory unavailable');
        return ok({ value: [{ displayName: 'LAMP Words For Life' }] });
      }
      if (path.endsWith('/mobileApps')) return ok({ value: [
        { '@odata.type': '#microsoft.graph.iosVppApp', id: APP_ID, displayName: 'LAMP Words For Life', vppTokenDisplayName: 'Trials II' },
        { '@odata.type': '#microsoft.graph.iosVppApp', id: 'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee', displayName: 'Unrelated app' },
        ...(options.extraApps || [])
      ] });
      const matched = options.devices?.find(entry => path.endsWith(`/${entry.id}`));
      if (!matched) assert.ok([`/v1.0/deviceManagement/managedDevices/${DEVICE_ID}`, `/beta/deviceManagement/managedDevices/${DEVICE_ID}`].includes(path));
      return ok(matched || device);
    }
  };
  vm.createContext(context); vm.runInContext(source, context);
  const send = (action, extra = {}, sender = { id: 'self', url: 'chrome-extension://self/panel.html' }) => new Promise(resolve => {
    const handled = handler({ type: 'sidekick-api-wipe-test', action, ...extra }, sender, result => setImmediate(() => resolve(result)));
    if (!handled) setImmediate(() => resolve(undefined));
  });
  const posts = () => calls.filter(call => call.settings.method === 'POST' && new URL(call.url).origin === 'https://graph.microsoft.com');
  return { send, calls, storage, posts, device, options };
}
async function preview(client) {
  assert.equal((await client.send('connect')).ok, true);
  const result = await client.send('preview', { serial: SERIAL });
  assert.equal(result.ok, true, result.error);
  return { nonce: result.job.nonce, serial: SERIAL, confirmed: true };
}

test('preview is read-only, matches exact serial, limits AAC apps, and isolates original data', async () => {
  const client = setup(); const original = JSON.stringify(client.storage);
  await preview(client);
  const { job } = await client.send('state');
  assert.equal(job.stage, 'preview'); assert.equal(job.apps.length, 1); assert.equal(job.apps[0].detected, true);
  assert.equal(client.posts().length, 0);
  assert.doesNotMatch(JSON.stringify(job), /test-private/);
  await client.send('stop', { nonce: job.nonce, serial: SERIAL });
  await client.send('disconnect');
  assert.equal(JSON.stringify(client.storage), original);
});

test('staged workflow sends device-specific removal, revocation and wipe only after confirmations', async () => {
  const client = setup(); const identity = await preview(client);
  assert.equal((await client.send('wipe', identity)).ok, false);
  assert.equal((await client.send('remove', { ...identity, confirmed: false, appIds: [APP_ID] })).ok, false);
  assert.equal((await client.send('remove', { ...identity, appIds: ['unrelated'] })).ok, false);
  assert.equal((await client.send('remove', { ...identity, nonce: 'old', appIds: [APP_ID] })).ok, false);
  assert.equal(client.posts().length, 0);
  const removed = await client.send('remove', { ...identity, appIds: [APP_ID] });
  assert.equal(removed.job.stage, 'removalRequested');
  assert.equal(client.posts().length, 1);
  assert.deepEqual(JSON.parse(client.posts()[0].settings.body).deviceAssignmentItems, [{ '@odata.type': '#microsoft.graph.deviceAssignmentItem', itemId: APP_ID, itemType: 'application', assignmentItemActionIntent: 'remove' }]);
  assert.equal((await client.send('revoke', identity)).job.stage, 'licensesRequested');
  assert.equal((await client.send('revoke', identity)).ok, false);
  assert.equal((await client.send('wipe', identity)).job.stage, 'wipeRequested');
  assert.equal((await client.send('wipe', identity)).ok, false);
  assert.deepEqual(client.posts().map(call => new URL(call.url).pathname), [
    `/beta/deviceManagement/managedDevices/${DEVICE_ID}/changeAssignments`,
    `/beta/deviceManagement/managedDevices/${DEVICE_ID}/revokeAppleVppLicenses`,
    `/v1.0/deviceManagement/managedDevices/${DEVICE_ID}/wipe`
  ]);
  const finished = await client.send('finish', identity);
  assert.equal(finished.completedSerial, SERIAL); assert.equal(finished.job.stage, 'wipeConfirmed');
  assert.equal((await client.send('close', identity)).job, null);
});

test('no selected apps skips removal but still requires separate revocation and wipe decisions', async () => {
  const client = setup(); const identity = await preview(client);
  assert.equal((await client.send('remove', { ...identity, appIds: [] })).job.stage, 'removalSkipped');
  assert.equal(client.posts().length, 0);
  assert.equal((await client.send('wipe', identity)).ok, false);
  assert.equal((await client.send('revoke', identity)).job.stage, 'licensesRequested');
});

test('uncertain action remains blocked across worker restart and never auto retries', async () => {
  const client = setup({ failAction: 'changeAssignments' }); const identity = await preview(client);
  const result = await client.send('remove', { ...identity, appIds: [APP_ID] });
  assert.equal(result.ok, false); assert.match(result.error, /will not be repeated/);
  assert.equal((await client.send('state')).job.stage, 'uncertain');
  const restarted = setup({}, client.storage);
  assert.equal((await restarted.send('remove', { ...identity, appIds: [APP_ID] })).ok, false);
  assert.equal((await restarted.send('wipe', identity)).ok, false);
  assert.equal((await restarted.send('preview', { serial: SERIAL })).ok, false);
  assert.equal(restarted.posts().length, 0);
});

test('duplicate devices and untrusted pagination stop before actions', async () => {
  for (const options of [{ duplicate: true }, { evilNext: true }]) {
    const client = setup(options); await client.send('connect');
    assert.equal((await client.send('preview', { serial: SERIAL })).ok, false);
    assert.equal(client.posts().length, 0);
    assert.equal(client.calls.some(call => call.url.startsWith('https://evil.example')), false);
  }
});

test('changed device identity, pending device actions, and changed roles prevent mutations', async () => {
  for (const change of ['serial', 'state', 'role']) {
    const client = setup(); const identity = await preview(client);
    if (change === 'serial') client.device.serialNumber = 'OTHER12345';
    if (change === 'state') client.device.managementState = 'wipePending';
    if (change === 'role') client.options.role = 'Device Coordinator';
    assert.equal((await client.send('remove', { ...identity, appIds: [APP_ID] })).ok, false);
    assert.equal(client.posts().length, 0);
  }
});

test('missing new permissions and invalid OAuth state cannot establish the test connection', async () => {
  for (const options of [{ scopes: 'DeviceManagementApps.Read.All' }, { badState: true }]) {
    const client = setup(options);
    assert.equal((await client.send('connect')).ok, false);
    assert.equal(client.storage.sidekickApiWipeTestAuth, undefined);
  }
});

test('content scripts cannot invoke API Wipe Test actions', async () => {
  const client = setup();
  assert.equal(await client.send('connect', {}, { id: 'self', url: 'https://intune.microsoft.com/' }), undefined);
  assert.equal(client.calls.length, 0);
});

function panel(client, mode = 'single', standalone = true) {
  const copied = [];
  const opened = [];
  const stickerRequests = [], tabs = [];
  class Element {
    constructor(tag = 'div') { this.tagName = tag; this.children = []; this.listeners = {}; this.dataset = {}; this.style = {}; this.value = ''; this.checked = false; this.hidden = false; this.disabled = false; }
    append(...children) { for (const child of children) { child.parent = this; this.children.push(child); } }
    replaceChildren(...children) { this.children = []; this.append(...children); }
    setAttribute() {}
    addEventListener(event, listener) { (this.listeners[event] ||= []).push(listener); }
    querySelectorAll(selector) {
      const descendants = this.children.flatMap(child => [child, ...child.querySelectorAll('*')]);
      return descendants.filter(child => selector === '*' || selector === 'input:checked' && child.tagName === 'input' && child.checked || selector === 'button' && child.tagName === 'button');
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0]; }
    focus() { this.focusCalls = (this.focusCalls || 0) + 1; }
    showModal() { this.open = true; }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); }
    click() { if (!this.disabled) for (const listener of this.listeners.click || []) listener({ preventDefault() {} }); }
  }
  const ids = {};
  const html = fs.readFileSync(require.resolve('../panel.html'), 'utf8');
  for (const [, id] of html.matchAll(/id="(apiWipe[^" ]*)"/g)) ids[id] = new Element();
  ids.apiWipeScan.previousElementSibling = new Element('label');
  ids.apiWipeMode.value = mode;
  ids.apiWipeAddForm.append(new Element('button'));
  const body = new Element('body');
  const context = {
    sidekickNewDeviceWindow: standalone,
    document: { getElementById: id => ids[id], createElement: tag => new Element(tag), body },
    Date, hasDeviceSystemsRole: async () => !client.options.role || client.options.role === 'Device Systems Coordinator', showView() {}, showLandingView() {}, extractValidSerial: value => value,
    navigator: { clipboard: { writeText: async text => { if (client.options.clipboardFailure) throw new Error('Clipboard blocked'); copied.push(text); } } },
    chrome: { runtime: { sendMessage: message => {
      if (message.type === 'sidekick-open-new-device') { opened.push(message); return Promise.resolve({ ok: true }); }
      if (message.type === 'sidekick-audit-lookup') return client.options.auditLookup ? client.options.auditLookup(message.device) : Promise.resolve({ ok: true, ...client.options.audit });
      if (message.type === 'sidekick-sticker-lookup') { stickerRequests.push(message.device); return client.options.stickerLookup ? client.options.stickerLookup(message.device) : Promise.resolve({ ok: true, matches: client.options.stickerMatches || [] }); }
      return client.send(message.action, message);
    } }, tabs: { create: async options => { if (client.options.stickerTabFailure) throw new Error('Could not open tab'); tabs.push(options); } }, storage: {
      session: { get: async key => ({ [key]: client.storage[key] }), set: async values => Object.assign(client.storage, JSON.parse(JSON.stringify(values))) },
      onChanged: { addListener() {} }
    } }
  };
  vm.createContext(context); vm.runInContext(fs.readFileSync(require.resolve('../workers/api-wipe-test-panel.js'), 'utf8'), context);
  const settle = async () => {
    const deadline = Date.now() + 3000;
    while (ids.apiWipeCheck.disabled && !body.children.some(child => child.tagName === 'dialog')) {
      assert.ok(Date.now() < deadline, 'panel finishes its request or opens the next confirmation');
      await new Promise(resolve => setTimeout(resolve, 2));
    }
    await new Promise(resolve => setImmediate(resolve));
  };
  return {
    ids,
    copied,
    opened,
    stickerRequests, tabs,
    dialogText: () => body.querySelectorAll('*').map(element => element.textContent || '').join(' '),
    clickElement: async element => { element.click(); await settle(); },
    changeElement: async (element, value) => { element.value = value; for (const listener of element.listeners.change || []) listener(); await settle(); },
    pasteGipod: text => {
      const input = body.querySelectorAll('*').find(child => child.tagName === 'textarea');
      assert.ok(input, 'GIPOD import is open'); input.value = text;
    },
    scan: async (value, internalOnly = false) => {
      ids.apiWipeScan.value = value; ids.apiWipeInternalOnly.checked = internalOnly;
      for (const listener of ids.apiWipeAddForm.listeners.submit || []) listener({ preventDefault() {} });
      await settle();
    },
    click: async id => { ids[id].click(); await settle(); },
    decide: async yes => {
      const dialog = body.children.find(child => child.tagName === 'dialog'); assert.ok(dialog, 'confirmation dialog is open');
      const buttons = dialog.querySelectorAll('button'); buttons[yes ? 1 : 0].click(); await settle();
    },
    dialogOpen: () => body.children.some(child => child.tagName === 'dialog')
    ,uncheck: serial => {
      const input = body.querySelectorAll('*').find(child => child.tagName === 'input' && child.value === serial);
      assert.ok(input, 'group contains this serial'); input.checked = false;
    }
  };
}

test('Begin automates removal and revocation, with prompts before wipe and after reset', async () => {
  const client = setup(); await client.send('connect');
  client.storage.sidekickApiWipeTestList = [{ number: 'DTP8.1247', serial: SERIAL, wiped: false }];
  const ui = panel(client);
  await ui.click('apiWipeTestBtn'); await ui.click('apiWipeBegin');
  assert.equal(client.posts().length, 1); // Automatic app removal, waiting for removal confirmation.
  assert.equal(ui.dialogOpen(), true);
  await ui.decide(true); assert.equal(client.posts().length, 2); // Automatic revocation, waiting for wipe approval.
  await ui.decide(true); assert.equal(client.posts().length, 3); // Approved wipe, waiting for actual outcome.
  assert.equal(client.storage.sidekickApiWipeTestList[0].wiped, false);
  await ui.decide(true); // Wipe outcome confirmed, waiting for optional Entra deletion.
  assert.equal(client.storage.sidekickApiWipeTestList[0].wiped, true);
  await ui.decide(false); // Manual deletion.
  await ui.decide(true); // Close final reminder.
  assert.equal(ui.ids.apiWipeReview.hidden, true);
  assert.equal(client.storage.sidekickDeviceDraft.rows[0].internalSerial, 'ORIGINAL');
  assert.equal(client.calls.some(call => call.settings.method === 'DELETE'), false);
});

test('Start automatically selects every matching AAC app including duplicate titles and missing inventory', async () => {
  const extraApps = [
    { '@odata.type': '#microsoft.graph.iosVppApp', id: 'cccccccc-bbbb-cccc-dddd-eeeeeeeeeeee', displayName: 'LAMP Words For Life', vppTokenDisplayName: 'Other token' },
    { '@odata.type': '#microsoft.graph.iosVppApp', id: 'dddddddd-bbbb-cccc-dddd-eeeeeeeeeeee', displayName: 'Dialogue AAC' }
  ];
  const client = setup({ extraApps, inventoryFailure: true }); await client.send('connect');
  client.storage.sidekickApiWipeTestList = [{ number: '', serial: SERIAL, wiped: false }];
  const ui = panel(client); await ui.click('apiWipeTestBtn'); await ui.click('apiWipeBegin');
  assert.equal(client.posts().length, 1);
  const selected = JSON.parse(client.posts()[0].settings.body).deviceAssignmentItems;
  assert.deepEqual(selected.map(app => app.itemId), [APP_ID, ...extraApps.map(app => app.id)]);
  assert.equal(ui.ids.apiWipeApps.querySelectorAll('input:checked').length, 3);
  assert.equal(ui.dialogOpen(), true); // Already at the app-removal outcome prompt.
  await ui.decide(false);
});

test('No at app removal, wipe approval or wipe outcome stops further automation', async () => {
  for (const decision of ['apps', 'approval', 'outcome']) {
    const client = setup(); await client.send('connect');
    client.storage.sidekickApiWipeTestList = [{ number: '', serial: SERIAL, wiped: false }];
    const ui = panel(client); await ui.click('apiWipeTestBtn'); await ui.click('apiWipeBegin');
    if (decision !== 'apps') await ui.decide(true);
    if (decision === 'outcome') await ui.decide(true);
    await ui.decide(false);
    assert.equal(client.posts().length, decision === 'apps' ? 1 : decision === 'approval' ? 2 : 3);
    assert.equal(client.storage.sidekickApiWipeTestList[0].wiped, false);
    assert.equal((await client.send('state')).job, null);
    assert.equal(client.calls.some(call => call.settings.method === 'DELETE'), false);
  }
});

async function wipedClient(options = {}) {
  const client = setup(options); const identity = await preview(client);
  await client.send('remove', { ...identity, appIds: [APP_ID] });
  await client.send('revoke', identity); await client.send('wipe', identity);
  await client.send('finish', identity);
  return { client, identity };
}

test('Entra deletion is optional, uses the combined connection and targets only the linked object after confirmed wipe', async () => {
  const client = setup(); const identity = await preview(client);
  assert.equal((await client.send('delete-entra', identity)).ok, false);
  assert.equal((await client.send('connect-delete')).ok, true);
  assert.ok(client.storage.sidekickApiWipeTestAuth);
  assert.equal(client.storage.sidekickApiWipeTestDeleteAuth, undefined);
  assert.equal((await client.send('state')).job.stage, 'preview');
  await client.send('remove', { ...identity, appIds: [] }); await client.send('revoke', identity); await client.send('wipe', identity);
  assert.equal((await client.send('delete-entra', identity)).ok, false);
  await client.send('finish', identity);
  assert.equal((await client.send('delete-entra', { ...identity, confirmed: false })).ok, false);
  assert.equal((await client.send('delete-entra', { ...identity, nonce: 'stale' })).ok, false);
  const result = await client.send('delete-entra', identity);
  assert.equal(result.job.stage, 'entraDeleted');
  assert.equal(result.job.entraTarget.id, ENTRA_OBJECT_ID);
  const deletes = client.calls.filter(call => call.settings.method === 'DELETE');
  assert.equal(deletes.length, 1);
  assert.equal(deletes[0].url, `https://graph.microsoft.com/v1.0/devices/${ENTRA_OBJECT_ID}`);
  assert.equal((await client.send('delete-entra', identity)).ok, false);
  assert.equal((await client.send('close', identity)).job, null);
});

test('missing deletion connection, wrong linked identity and role loss never delete a device', async () => {
  for (const failure of ['connection', 'identity', 'role', 'missing-link']) {
    const { client, identity } = await wipedClient();
    if (failure === 'connection') delete client.storage.sidekickApiWipeTestAuth;
    if (failure !== 'connection') await client.send('connect-delete');
    if (failure === 'identity') client.options.wrongEntraId = true;
    if (failure === 'role') client.options.role = 'Device Coordinator';
    if (failure === 'missing-link') client.storage.sidekickApiWipeTestJob.device.azureADDeviceId = '';
    assert.equal((await client.send('delete-entra', identity)).ok, false);
    assert.equal(client.calls.some(call => call.settings.method === 'DELETE'), false);
    assert.equal(client.storage.sidekickApiWipeTestJob.stage, 'wipeConfirmed');
  }
});

test('uncertain Entra deletion is not repeated after a worker restart', async () => {
  const { client, identity } = await wipedClient({ failAction: 'deleteEntra' });
  await client.send('connect-delete');
  assert.equal((await client.send('delete-entra', identity)).ok, false);
  assert.equal(client.storage.sidekickApiWipeTestJob.stage, 'uncertain');
  const restarted = setup({}, client.storage);
  assert.equal((await restarted.send('delete-entra', identity)).ok, false);
  assert.equal(restarted.calls.some(call => call.settings.method === 'DELETE'), false);
});

test('automated panel deletes only after the final explicit Entra confirmation', async () => {
  const client = setup(); await client.send('connect');
  client.storage.sidekickApiWipeTestList = [{ number: '', serial: SERIAL, wiped: false }];
  const ui = panel(client); await ui.click('apiWipeTestBtn');
  await ui.click('apiWipeBegin'); await ui.decide(true); await ui.decide(true); await ui.decide(true);
  assert.equal(client.calls.some(call => call.settings.method === 'DELETE'), false);
  await ui.decide(true);
  assert.equal(client.calls.filter(call => call.settings.method === 'DELETE').length, 1);
  assert.equal(client.storage.sidekickApiWipeTestList[0].wiped, true);
  await ui.decide(true); assert.equal(ui.ids.apiWipeReview.hidden, true);
});

test('missing deletion grant preserves the confirmed wipe, then automatically reconnects when granted', async () => {
  const client = setup(); await client.send('connect');
  client.storage.sidekickApiWipeTestList = [{ number: '', serial: SERIAL, wiped: false }];
  const ui = panel(client); await ui.click('apiWipeTestBtn'); await ui.click('apiWipeBegin');
  await ui.decide(true); await ui.decide(true); await ui.decide(true);
  delete client.storage.sidekickApiWipeTestAuth;
  client.options.scopes = 'DeviceManagementApps.Read.All'; // Combined connection cannot be restored until all permissions are granted.
  await ui.decide(true);
  assert.equal(client.storage.sidekickApiWipeTestJob.stage, 'wipeConfirmed');
  assert.equal(client.storage.sidekickApiWipeTestList[0].wiped, true);
  assert.equal(client.posts().length, 3);
  client.options.scopes = undefined;
  await ui.click('apiWipePrepare'); await ui.decide(true);
  assert.equal(client.calls.filter(call => call.settings.method === 'DELETE').length, 1);
  assert.equal(client.posts().length, 3); // No repeated removal, revocation or wipe.
  await ui.decide(true);
});

test('one combined sign-in covers the full single-device wipe and deletion workflow', async () => {
  const client = setup(); await client.send('connect');
  client.storage.sidekickApiWipeTestList = [{ number: '', serial: SERIAL, wiped: false }];
  const ui = panel(client); await ui.click('apiWipeTestBtn'); await ui.click('apiWipeBegin');
  await ui.decide(true); await ui.decide(true); await ui.decide(true); await ui.decide(true);
  assert.equal(client.calls.filter(call => call.settings.method === 'DELETE').length, 1);
  assert.ok(client.storage.sidekickApiWipeTestAuth);
  assert.equal(client.storage.sidekickApiWipeTestDeleteAuth, undefined);
  assert.equal(client.calls.filter(call => call.url.includes('/token')).length, 1);
  await ui.decide(true);
});

test('accepted deletion remains pending until a read verifies absence; status never repeats DELETE', async () => {
  const { client, identity } = await wipedClient({ deletePending: true });
  await client.send('ensure-delete');
  assert.equal((await client.send('delete-entra', identity)).job.stage, 'entraDeletePending');
  assert.match((await client.send('status', identity)).entraStatus, /still visible/);
  client.options.deletePending = false;
  const result = await client.send('status', identity);
  assert.equal(result.job.stage, 'entraDeleted');
  assert.match(result.entraStatus, /no longer in Entra/);
  assert.equal(client.calls.filter(call => call.settings.method === 'DELETE').length, 1);
});

function bulkClient(extra = {}) {
  const serials = [SERIAL, 'SECOND12345', 'THIRD12345'];
  const records = serials.map((serial, index) => ({
    id: `${index + 1}1111111-2222-3333-4444-555555555555`, serialNumber: serial, deviceName: `iPad-${serial}`, operatingSystem: 'iOS', managementState: 'managed',
    azureADDeviceId: `${index + 7}9999999-2222-3333-4444-555555555555`
  }));
  const targets = Object.fromEntries(records.map((record, index) => [record.azureADDeviceId, { id: `${index + 4}8888888-2222-3333-4444-555555555555`, deviceId: record.azureADDeviceId, displayName: record.deviceName }]));
  const client = setup({ devices: records, entraTargets: targets, ...extra });
  return { client, serials, records };
}
async function bulkStart(client, serials) {
  await client.send('connect');
  const result = await client.send('bulk-start', { serials });
  assert.equal(result.ok, true, result.error);
  return result.batch;
}
async function phase(client, batch) {
  const oldStage = batch.stage;
  for (let count = 0; count < 110 && batch.stage === oldStage; count++) {
    const result = await client.send('bulk-step', { batchNonce: batch.nonce });
    assert.equal(result.ok, true, result.error); batch = result.batch;
  }
  assert.notEqual(batch.stage, oldStage);
  return batch;
}
async function approve(client, batch, action, selectedSerials) {
  const result = await client.send(action, { batchNonce: batch.nonce, selectedSerials, confirmed: true });
  assert.equal(result.ok, true, result.error); return result.batch;
}

test('bulk processes all stages with group approvals and deletes only confirmed successful wipes', async () => {
  const { client, serials } = bulkClient(); let batch = await bulkStart(client, serials);
  assert.equal(client.posts().length, 0); // Group lookup alone is read-only.
  batch = await phase(client, batch); assert.equal(batch.stage, 'awaitApps');
  assert.equal(client.posts().length, 3);
  batch = await approve(client, batch, 'bulk-apps', serials);
  batch = await phase(client, batch); assert.equal(batch.stage, 'awaitWipe');
  batch = await approve(client, batch, 'bulk-wipe', serials);
  batch = await phase(client, batch); assert.equal(batch.stage, 'awaitOutcome');
  batch = await approve(client, batch, 'bulk-outcome', serials.slice(0, 2));
  assert.equal(batch.items.filter(item => item.wiped).length, 2);
  assert.equal(batch.items[2].status, 'manual');
  await client.send('ensure-delete');
  batch = await approve(client, batch, 'bulk-delete', serials.slice(0, 2));
  batch = await phase(client, batch);
  assert.equal(batch.stage, 'complete'); assert.equal(batch.items.filter(item => item.status === 'deleted').length, 2);
  assert.equal(client.calls.filter(call => call.settings.method === 'DELETE').length, 2);
  assert.equal(client.storage.sidekickApiWipeTestJob, undefined);
  assert.equal(client.storage.sidekickDeviceDraft.rows[0].internalSerial, 'ORIGINAL');
});

test('one failed bulk removal does not stop other devices and is never wiped', async () => {
  const { client, serials, records } = bulkClient({ failAction: 'changeAssignments', failDeviceId: '21111111-2222-3333-4444-555555555555' });
  let batch = await bulkStart(client, serials); batch = await phase(client, batch);
  assert.equal(batch.items[1].status, 'failed');
  assert.equal(batch.items.filter(item => item.status === 'awaitApps').length, 2);
  batch = await approve(client, batch, 'bulk-apps', [serials[0], serials[2]]); batch = await phase(client, batch);
  batch = await approve(client, batch, 'bulk-wipe', [serials[0], serials[2]]); batch = await phase(client, batch);
  assert.equal(client.posts().filter(call => call.url.includes(records[1].id)).length, 1);
  assert.equal(batch.items.filter(item => item.status === 'wipeSent').length, 2);
});

test('bulk refuses stale approvals, unlisted devices and skipped group confirmations', async () => {
  const { client, serials } = bulkClient(); let batch = await bulkStart(client, serials);
  assert.equal((await client.send('bulk-step', { batchNonce: 'stale' })).ok, false);
  assert.equal((await client.send('bulk-wipe', { batchNonce: batch.nonce, selectedSerials: serials, confirmed: true })).ok, false);
  batch = await phase(client, batch);
  assert.equal((await client.send('bulk-apps', { batchNonce: batch.nonce, selectedSerials: ['UNLISTED123'], confirmed: true })).ok, false);
  assert.equal((await client.send('bulk-apps', { batchNonce: batch.nonce, selectedSerials: serials, confirmed: false })).ok, false);
  assert.equal(client.posts().length, 3);
});

test('bulk panel uses one confirmation per group and excludes an unchecked unsuccessful wipe', async () => {
  const { client, serials } = bulkClient(); await client.send('connect');
  client.storage.sidekickApiWipeTestList = serials.map(serial => ({ number: '', serial, wiped: false }));
  const ui = panel(client, 'bulk'); await ui.click('apiWipeTestBtn'); await ui.click('apiWipeBegin');
  assert.equal(client.posts().length, 3); // Removal for all, then one group prompt.
  await ui.decide(true); assert.equal(client.posts().length, 6);
  await ui.decide(true); assert.equal(client.posts().length, 9);
  ui.uncheck(serials[1]); await ui.decide(true);
  assert.equal(client.storage.sidekickApiWipeTestList[1].wiped, false);
  assert.equal(client.storage.sidekickApiWipeTestList[0].wiped, true);
  await ui.decide(true); // One group deletion approval, with automatic deletion sign-in.
  assert.equal(client.calls.filter(call => call.settings.method === 'DELETE').length, 2);
  await ui.decide(true);
  assert.equal(client.storage.sidekickApiWipeTestBatch.stage, 'complete');
});

test('bulk resumes saved progress without repeating an uncertain or already accepted removal', async () => {
  const { client, serials } = bulkClient(); const batch = await bulkStart(client, serials);
  const stored = client.storage.sidekickApiWipeTestBatch;
  stored.items[0].job.stage = 'uncertain';
  stored.items[1].job.stage = 'removalRequested'; // Response was saved before the per-device status update.
  const restarted = setup(client.options, client.storage);
  let result = await restarted.send('bulk-step', { batchNonce: batch.nonce });
  assert.equal(result.batch.items[0].status, 'failed');
  result = await restarted.send('bulk-step', { batchNonce: batch.nonce });
  assert.equal(result.batch.items[1].status, 'awaitApps');
  assert.equal(restarted.posts().length, 0);
  result = await restarted.send('bulk-step', { batchNonce: batch.nonce });
  assert.equal(result.batch.stage, 'awaitApps');
  assert.equal(restarted.posts().length, 1);
});

test('explicit Entra permission rejection is shown accurately and allows a later approved retry', async () => {
  const { client, identity } = await wipedClient({ forbiddenDelete: true });
  await client.send('ensure-delete');
  const rejected = await client.send('delete-entra', identity);
  assert.equal(rejected.ok, false); assert.match(rejected.error, /HTTP 403/);
  assert.equal(client.storage.sidekickApiWipeTestJob.stage, 'wipeConfirmed');
  const status = await client.send('status', identity);
  assert.doesNotMatch(status.entraStatus, /accepted/);
  assert.match(status.entraStatus, /has not been confirmed/);
  client.options.forbiddenDelete = false;
  assert.equal((await client.send('delete-entra', identity)).job.stage, 'entraDeleted');
});

test('combined start control defaults to bulk and replaces the duplicate controls', async () => {
  const html = fs.readFileSync(require.resolve('../panel.html'), 'utf8');
  assert.match(html, /<option value="bulk" selected>/);
  assert.match(html, /<option value="single">Next device only/);
  assert.equal([...html.matchAll(/id="apiWipeBegin"/g)].length, 1);
  assert.doesNotMatch(html, /id="apiWipe(?:BulkBegin|CopyList|EnableDelete)"/);
  const client = setup();
  client.storage.sidekickApiWipeTestList = [{ number: '', serial: SERIAL, wiped: false }];
  const ui = panel(client, 'bulk');
  await ui.click('apiWipeTestBtn'); await ui.click('apiWipeConnect'); await ui.click('apiWipeBegin');
  assert.equal(client.storage.sidekickApiWipeTestBatch.items.length, 1);
  assert.equal(client.storage.sidekickApiWipeTestJob, undefined);
  await ui.decide(true); await ui.decide(true); await ui.decide(true); await ui.decide(true); await ui.decide(true);
  assert.equal(client.calls.filter(call => call.url.includes('/token')).length, 1);
  assert.equal(client.calls.filter(call => call.settings.method === 'DELETE').length, 1);
});

test('combined connection refreshes all permissions without another interactive sign-in', async () => {
  const client = setup(); await client.send('connect');
  const token = client.storage.sidekickApiWipeTestAuth;
  assert.ok(token.scopes.includes('directory.accessasuser.all'));
  assert.ok(token.scopes.includes('devicemanagementmanageddevices.privilegedoperations.all'));
  token.expiresAt = 0;
  assert.equal((await client.send('ensure-delete')).ok, true);
  const grants = client.calls.filter(call => call.url.includes('/token')).map(call => new URLSearchParams(call.settings.body).get('grant_type'));
  assert.deepEqual(grants, ['authorization_code', 'refresh_token']);
  assert.equal(client.storage.sidekickApiWipeTestDeleteAuth, undefined);
});

async function profileStart(client, devices) {
  await client.send('connect');
  const result = await client.send('profiles-start', { devices });
  assert.equal(result.ok, true, result.error); return result.profiles;
}
async function profileApprove(client, profiles, serials) {
  const result = await client.send('profiles-approve', { profileNonce: profiles.nonce, selectedSerials: serials, confirmed: true });
  assert.equal(result.ok, true, result.error); return result.profiles;
}
async function profileRun(client, profiles) {
  while (profiles.stage === 'running') {
    const result = await client.send('profiles-step', { profileNonce: profiles.nonce });
    assert.equal(result.ok, true, result.error); profiles = result.profiles;
  }
  return profiles;
}

test('all four profile mappings use the category reference endpoint and verify before completion', async () => {
  for (const [index, category] of ['Talkpad 10', 'Talkpad 8', 'Wego 13', 'Wego 5'].entries()) {
    const client = setup();
    let profiles = await profileStart(client, [{ serial: SERIAL, category }]);
    assert.equal(client.calls.some(call => call.settings.method === 'PUT'), false);
    assert.equal((await client.send('profiles-step', { profileNonce: profiles.nonce })).ok, false);
    profiles = await profileApprove(client, profiles, [SERIAL]);
    profiles = await profileRun(client, profiles);
    assert.equal(profiles.items[0].status, 'added');
    const writes = client.calls.filter(call => call.settings.method === 'PUT');
    assert.equal(writes.length, 1);
    assert.equal(writes[0].url, `https://graph.microsoft.com/v1.0/deviceManagement/managedDevices/${DEVICE_ID}/deviceCategory/$ref`);
    assert.equal(JSON.parse(writes[0].settings.body)['@odata.id'], `https://graph.microsoft.com/v1.0/deviceManagement/deviceCategories/${CATEGORIES[index].id}`);
    assert.equal(client.posts().length, 0); // No wipe, license or app-removal action.
  }
});

test('stale category summary does not prevent a confirmed profile assignment', async () => {
  const client = setup({ initialCategory: CATEGORIES[2].id });
  client.device.deviceCategoryDisplayName = 'Unassigned';
  let profiles = await profileStart(client, [{ serial: SERIAL, category: 'Talkpad 8' }]);
  assert.equal(profiles.items[0].previousCategoryId, CATEGORIES[2].id);
  profiles = await profileApprove(client, profiles, [SERIAL]);
  profiles = await profileRun(client, profiles);
  assert.equal(profiles.items[0].status, 'added');
  assert.equal(client.calls.filter(call => call.settings.method === 'PUT').length, 1);
});

test('profile plan rejects invalid categories and stale approvals; already matching categories need no write', async () => {
  const client = setup({ initialCategory: CATEGORIES[0].id }); await client.send('connect');
  assert.equal((await client.send('profiles-start', { devices: [{ serial: SERIAL, category: 'Unknown' }] })).ok, false);
  const result = await client.send('profiles-start', { devices: [{ serial: SERIAL, category: 'Talkpad 10' }] });
  let profiles = result.profiles;
  assert.equal((await client.send('profiles-approve', { profileNonce: 'stale', selectedSerials: [SERIAL], confirmed: true })).ok, false);
  assert.equal((await client.send('profiles-approve', { profileNonce: profiles.nonce, selectedSerials: [SERIAL], confirmed: false })).ok, false);
  profiles = await profileApprove(client, profiles, [SERIAL]); profiles = await profileRun(client, profiles);
  assert.equal(profiles.items[0].status, 'added');
  assert.equal(client.calls.some(call => call.settings.method === 'PUT'), false);
});

test('bulk profiles isolate per-device failures and support Windows devices as well as iPads', async () => {
  const { client, serials, records } = bulkClient();
  records[2].operatingSystem = 'Windows'; client.options.failProfileDevice = records[1].id;
  let profiles = await profileStart(client, serials.map(serial => ({ serial, category: 'Wego 13' })));
  assert.equal((await client.send('bulk-start', { serials })).ok, false);
  assert.equal((await client.send('preview', { serial: SERIAL })).ok, false);
  profiles = await profileApprove(client, profiles, serials); profiles = await profileRun(client, profiles);
  assert.deepEqual(Array.from(profiles.items, item => item.status), ['added', 'uncertain', 'added']);
  assert.equal(profiles.stage, 'complete');
  assert.equal(client.storage.sidekickApiWipeTestJob, undefined);
});

test('accepted category changes are not marked added until verified; status does not repeat PUT', async () => {
  const client = setup({ profilePending: true });
  let profiles = await profileStart(client, [{ serial: SERIAL, category: 'Talkpad 8' }]);
  profiles = await profileApprove(client, profiles, [SERIAL]); profiles = await profileRun(client, profiles);
  assert.equal(profiles.items[0].status, 'pending');
  client.options.profilePending = false;
  const checked = await client.send('profiles-check', { profileNonce: profiles.nonce, itemSerial: SERIAL });
  assert.equal(checked.profiles.items[0].status, 'added');
  assert.equal(client.calls.filter(call => call.settings.method === 'PUT').length, 1);
});

test('uncertain category response survives restart and can be verified without another update', async () => {
  const client = setup({ failProfileAfterApply: true });
  let profiles = await profileStart(client, [{ serial: SERIAL, category: 'Wego 5' }]);
  profiles = await profileApprove(client, profiles, [SERIAL]); profiles = await profileRun(client, profiles);
  assert.equal(profiles.items[0].status, 'uncertain');
  const restarted = setup({ initialCategory: CATEGORIES[3].id }, client.storage);
  assert.equal((await restarted.send('profiles-step', { profileNonce: profiles.nonce })).ok, false);
  const checked = await restarted.send('profiles-check', { profileNonce: profiles.nonce, itemSerial: SERIAL });
  assert.equal(checked.profiles.items[0].status, 'added');
  assert.equal(restarted.calls.some(call => call.settings.method === 'PUT'), false);
});

test('profiles stop on changed serial, duplicate categories or lost role without writing', async () => {
  for (const failure of ['serial', 'category', 'role']) {
    const client = setup(); let profiles = await profileStart(client, [{ serial: SERIAL, category: 'Talkpad 10' }]);
    profiles = await profileApprove(client, profiles, [SERIAL]);
    if (failure === 'serial') client.device.serialNumber = 'CHANGED123';
    if (failure === 'role') client.options.role = 'Device Coordinator';
    if (failure === 'category') { client.options.initialCategory = CATEGORIES[1].id; }
    await client.send('profiles-step', { profileNonce: profiles.nonce });
    assert.equal(client.calls.some(call => call.settings.method === 'PUT'), false);
  }
  const client = setup({ categories: [CATEGORIES[0], CATEGORIES[0]] });
  const profiles = await profileStart(client, [{ serial: SERIAL, category: 'Talkpad 10' }]);
  assert.equal(profiles.items[0].status, 'failed');
});

test('profile panel confirms once, skips manual marks and persists only verified completions', async () => {
  const { client, serials } = bulkClient(); await client.send('connect');
  client.storage.sidekickApiWipeTestList = serials.map((serial, index) => ({ number: '', serial, category: 'Talkpad 10', profileAdded: index === 1, wiped: false }));
  const ui = panel(client); await ui.click('apiWipeTestBtn'); await ui.click('apiWipeProfilesBegin');
  assert.equal(client.calls.some(call => call.settings.method === 'PUT'), false);
  await ui.decide(true);
  assert.equal(client.calls.filter(call => call.settings.method === 'PUT').length, 2);
  assert.equal(client.storage.sidekickApiWipeTestList.every(device => device.profileAdded), true);
  assert.equal(client.storage.sidekickApiWipeTestList.some(device => device.wiped), false);
  await ui.decide(true);
  assert.equal(client.storage.sidekickDeviceDraft.rows[0].internalSerial, 'ORIGINAL');
});

test('loan search copies all nonempty internal serials in order, uppercase and OR-separated', async () => {
  const client = setup();
  client.storage.sidekickApiWipeTestList = [{ serial: ' abc123 ', wiped: true }, { serial: '' }, { serial: 'def456', profileAdded: true }];
  const ui = panel(client); await ui.click('apiWipeTestBtn'); await ui.click('apiWipeLoanSearch');
  assert.deepEqual(ui.copied, ['ABC123 OR DEF456']);
  client.options.clipboardFailure = true;
  await ui.click('apiWipeLoanSearch'); assert.match(ui.ids.apiWipeStatus.textContent, /Could not copy/);
  assert.equal(client.calls.length, 0);
});

test('device scans fill the Audit category and profile checkbox remains manually editable', async () => {
  const client = setup({ audit: { internalSerial: SERIAL, category: 'Wego 10s' } });
  const ui = panel(client); await ui.click('apiWipeTestBtn'); await ui.scan('DTP10.1234');
  assert.equal(client.storage.sidekickApiWipeTestList[0].category, 'Talkpad 10');
  assert.equal(client.storage.sidekickApiWipeTestList[0].serial, SERIAL);
  const profile = ui.ids.apiWipeRows.children[0].children[4].children[0];
  profile.checked = true; profile.listeners.change[0]();
  assert.equal(client.storage.sidekickApiWipeTestList[0].profileAdded, true);
});

test('profile write permission is required while existing wipe permissions continue to work', async () => {
  const client = setup(); await client.send('connect');
  const oldScopes = SCOPES.replace(' DeviceManagementManagedDevices.ReadWrite.All', '');
  client.storage.sidekickApiWipeTestAuth.scopes = oldScopes.split(' ').map(scope => scope.toLowerCase());
  client.options.scopes = oldScopes;
  assert.equal((await client.send('preview', { serial: SERIAL })).ok, true);
  const { job } = await client.send('state'); await client.send('stop', { nonce: job.nonce, serial: SERIAL });
  const result = await client.send('profiles-start', { devices: [{ serial: SERIAL, category: 'Talkpad 10' }] });
  assert.equal(result.ok, false); assert.match(result.error, /DeviceManagementManagedDevices.ReadWrite.All/);
  assert.equal(client.calls.some(call => call.settings.method === 'PUT'), false);
});

test('rapid scans stay enabled, keep focus and queue Audit lookups without losing scan text', async () => {
  let releaseFirst;
  const client = setup({ auditLookup: async number => {
    if (number === 'DTP10.0001') await new Promise(resolve => { releaseFirst = resolve; });
    return { ok: true, internalSerial: number === 'DTP10.0001' ? 'FIRST12345' : 'SECOND12345', category: 'Talkpad 10' };
  } });
  const ui = panel(client); await ui.click('apiWipeTestBtn');
  const first = ui.scan('DTP10.0001');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(ui.ids.apiWipeScan.disabled, false);
  assert.ok(ui.ids.apiWipeScan.focusCalls > 0);
  const second = ui.scan('DTP8.0002');
  assert.equal(ui.ids.apiWipeScan.value, '');
  assert.equal(ui.ids.apiWipeBegin.disabled, true);
  releaseFirst(); await first; await second;
  assert.deepEqual(client.storage.sidekickApiWipeTestList.map(device => device.serial), ['FIRST12345', 'SECOND12345']);
  assert.equal(ui.ids.apiWipeScan.disabled, false);
  assert.ok(ui.ids.apiWipeScan.focusCalls >= 4);
  await ui.scan('DTP8.0002'); // Duplicate is reported while leaving the scanner ready.
  assert.equal(client.storage.sidekickApiWipeTestList.length, 2);
  assert.equal(ui.ids.apiWipeScan.disabled, false);
});

test('landing launcher opens the new popup instead of initializing an inline workflow', async () => {
  const client = setup(); const ui = panel(client, 'bulk', false);
  await ui.click('apiWipeTestBtn');
  assert.equal(ui.opened.length, 1);
  assert.equal(client.calls.length, 0);
  const sender = { id: 'self', url: 'chrome-extension://self/device-new-window.html' };
  assert.equal((await client.send('state', {}, sender)).ok, true);
});

test('GIPOD import assigns one per row and Dashboard Note copies exactly the device and code', async () => {
  const client = setup();
  client.storage.sidekickApiWipeTestList = [{ number: 'DTP10.0001', serial: 'FIRST12345' }, { number: 'DTP8.0002', serial: 'SECOND12345' }];
  const ui = panel(client); await ui.click('apiWipeTestBtn'); await ui.click('apiWipeGipodImport');
  ui.pasteGipod('gipod-1111-2222-3333\nGIPOD-4444-5555-6666'); await ui.decide(true);
  assert.deepEqual(client.storage.sidekickApiWipeTestList.map(device => device.gipodCode), ['GIPOD-1111-2222-3333', 'GIPOD-4444-5555-6666']);
  await ui.clickElement(ui.ids.apiWipeRows.children[0].children[6].children[0]);
  await ui.clickElement(ui.ids.apiWipeRows.children[1].children[6].children[0]);
  assert.deepEqual(ui.copied, ['DTP10.0001\nGIPOD-1111-2222-3333', 'DTP8.0002\nGIPOD-4444-5555-6666']);
  assert.equal(client.storage.sidekickDeviceDraft.rows[0].internalSerial, 'ORIGINAL');
});

test('invalid GIPOD imports never partially replace codes', async () => {
  for (const text of ['GIPOD-1111-2222-3333', 'BAD\nGIPOD-4444-5555-6666', 'GIPOD-1111-2222-3333\nGIPOD-1111-2222-3333']) {
    const client = setup();
    client.storage.sidekickApiWipeTestList = [{ number: 'DTP10.0001', serial: 'FIRST12345', gipodCode: 'GIPOD-1234-1234-1234' }, { number: 'DTP8.0002', serial: 'SECOND12345' }];
    const ui = panel(client); await ui.click('apiWipeTestBtn'); await ui.click('apiWipeGipodImport'); ui.pasteGipod(text); await ui.decide(true);
    assert.equal(client.storage.sidekickApiWipeTestList[0].gipodCode, 'GIPOD-1234-1234-1234');
    assert.equal(client.storage.sidekickApiWipeTestList[1].gipodCode, undefined);
  }
});

test('clearing a serial, removing a row and clearing the new list discard associated GIPOD codes', async () => {
  const client = setup();
  client.storage.sidekickApiWipeTestList = [{ number: 'DTP10.0001', serial: 'FIRST12345', gipodCode: 'GIPOD-1111-2222-3333' }, { number: 'DTP8.0002', serial: 'SECOND12345', gipodCode: 'GIPOD-4444-5555-6666' }];
  const ui = panel(client); await ui.click('apiWipeTestBtn');
  const serial = ui.ids.apiWipeRows.children[0].children[1].children[0]; serial.value = ''; serial.listeners.change[0]();
  assert.equal(client.storage.sidekickApiWipeTestList[0].gipodCode, '');
  await ui.clickElement(ui.ids.apiWipeRows.children[0].children[6].children[0]); assert.equal(ui.copied.length, 0);
  await ui.clickElement(ui.ids.apiWipeRows.children[0].children[9].children[0]);
  assert.equal(client.storage.sidekickApiWipeTestList.length, 1);
  assert.equal(client.storage.sidekickApiWipeTestList[0].gipodCode, 'GIPOD-4444-5555-6666');
  await ui.click('apiWipeClear'); assert.deepEqual(client.storage.sidekickApiWipeTestList, []);
});

test('standalone new window contains the full tool and its required scripts', () => {
  const html = fs.readFileSync(require.resolve('../device-new-window.html'), 'utf8');
  const panelHtml = fs.readFileSync(require.resolve('../panel.html'), 'utf8');
  assert.match(html, /<title>Device Sidekick \(new\)<\/title>/);
  assert.doesNotMatch(panelHtml, /Device Sidekick \(old ver\)/);
  for (const [, id] of fs.readFileSync(require.resolve('../workers/api-wipe-test-panel.js'), 'utf8').matchAll(/el\("([A-Za-z]+)"\)/g)) assert.ok(html.includes(`id="apiWipe${id}"`), `${id} exists in new window`);
  for (const [, script] of html.matchAll(/<script src="([^"]+)"/g)) assert.ok(fs.existsSync(require.resolve(`../${script}`)));
  assert.doesNotMatch(html, /id="apiWipeTestBtn"/); // Window auto-starts; it cannot launch another copy of itself.
});

async function groupStart(client, devices) {
  await client.send('connect');
  const result = await client.send('groups-start', { devices });
  assert.equal(result.ok, true, result.error); return result.groups;
}
async function groupApprove(client, groups, serials) {
  const result = await client.send('groups-approve', { groupNonce: groups.nonce, selectedSerials: serials, confirmed: true });
  assert.equal(result.ok, true, result.error); return result.groups;
}
async function groupRun(client, groups) {
  while (groups.stage === 'running') {
    const result = await client.send('groups-step', { groupNonce: groups.nonce });
    assert.equal(result.ok, true, result.error); groups = result.groups;
  }
  return groups;
}
const memberPosts = client => client.posts().filter(call => call.url.includes('/members/$ref'));

test('missing Intune devices show the manual-wipe reminder and highlight both list and bulk result rows', async () => {
  for (const mode of ['single', 'bulk']) {
    const client = setup({ devices: [] }); await client.send('connect');
    client.storage.sidekickApiWipeTestList = [{ serial: SERIAL, wiped: false }];
    const ui = panel(client, mode); await ui.click('apiWipeTestBtn'); await ui.click('apiWipeBegin');
    assert.equal(client.storage.sidekickApiWipeTestList[0].manualWipeWarning, true);
    assert.equal(ui.ids.apiWipeRows.children[0].className, 'api-manual-wipe-warning');
    if (mode === 'single') assert.match(ui.ids.apiWipeStatus.textContent, /Verify whether a manual wipe is needed/);
    else {
      const row = ui.ids.apiWipeBulkRows.children[0];
      assert.equal(row.className, 'api-manual-wipe-warning'); assert.match(row.children[2].textContent, /Verify whether a manual wipe is needed/);
      await ui.decide(true);
    }
    assert.equal(client.posts().length, 0);
  }
});

test('group catalog lists dynamic groups as unavailable and restricts untrusted pagination', async () => {
  const client = setup(); await client.send('connect');
  const result = await client.send('groups-list');
  assert.equal(result.groupCatalog.length, 3);
  assert.match(result.groupCatalog.find(group => group.id === GROUPS[2].id).unavailable, /Dynamic/);
  client.options.evilGroupsNext = true;
  assert.equal((await client.send('groups-list')).ok, false);
  assert.equal(client.calls.some(call => call.url.startsWith('https://evil.example')), false);
});

test('bulk group additions support different groups and reference Entra object IDs, never managed-device IDs', async () => {
  const { client, serials } = bulkClient();
  let groups = await groupStart(client, serials.map((serial, index) => ({ serial, groupId: GROUPS[index % 2].id })));
  assert.equal(memberPosts(client).length, 0);
  assert.equal((await client.send('groups-step', { groupNonce: groups.nonce })).ok, false);
  groups = await groupApprove(client, groups, serials); groups = await groupRun(client, groups);
  assert.equal(groups.items.every(item => item.status === 'added'), true);
  assert.equal(memberPosts(client).length, 3);
  for (let index = 0; index < groups.items.length; index++) {
    const item = groups.items[index];
    assert.notEqual(item.objectId, item.device.id);
    assert.equal(memberPosts(client)[index].url, `https://graph.microsoft.com/v1.0/groups/${item.groupId}/members/$ref`);
    assert.equal(JSON.parse(memberPosts(client)[index].settings.body)['@odata.id'], `https://graph.microsoft.com/v1.0/directoryObjects/${item.objectId}`);
  }
  assert.equal(client.storage.sidekickDeviceDraft.rows[0].internalSerial, 'ORIGINAL');
});

test('existing group membership is verified without sending another addition', async () => {
  const client = setup({ memberships: { [GROUPS[0].id]: [ENTRA_OBJECT_ID] } });
  let groups = await groupStart(client, [{ serial: SERIAL, groupId: GROUPS[0].id }]);
  groups = await groupApprove(client, groups, [SERIAL]); groups = await groupRun(client, groups);
  assert.equal(groups.items[0].status, 'added'); assert.equal(memberPosts(client).length, 0);
});

test('unsupported group types, changed Entra links and stale approvals never add members', async () => {
  for (const properties of [{ groupTypes: ['DynamicMembership'] }, { securityEnabled: false, groupTypes: ['Unified'] }, { onPremisesSyncEnabled: true }, { isAssignableToRole: true }, { mailEnabled: true }]) {
    const group = { ...GROUPS[0], ...properties };
    const client = setup({ groups: [group] }); const result = await groupStart(client, [{ serial: SERIAL, groupId: group.id }]);
    assert.equal(result.items[0].status, 'failed'); assert.equal(memberPosts(client).length, 0);
  }
  const client = setup(); let groups = await groupStart(client, [{ serial: SERIAL, groupId: GROUPS[0].id }]);
  assert.equal((await client.send('groups-approve', { groupNonce: 'stale', selectedSerials: [SERIAL], confirmed: true })).ok, false);
  assert.equal((await client.send('groups-approve', { groupNonce: groups.nonce, selectedSerials: ['OTHER1234'], confirmed: true })).ok, false);
  groups = await groupApprove(client, groups, [SERIAL]); client.device.azureADDeviceId = DEVICE_ID;
  groups = await groupRun(client, groups); assert.equal(groups.items[0].status, 'failed'); assert.equal(memberPosts(client).length, 0);
});

test('uncertain group addition can be verified after restart without another POST', async () => {
  const client = setup({ failGroupAfterApply: true });
  let groups = await groupStart(client, [{ serial: SERIAL, groupId: GROUPS[0].id }]);
  groups = await groupApprove(client, groups, [SERIAL]); groups = await groupRun(client, groups);
  assert.equal(groups.items[0].status, 'uncertain');
  const restarted = setup({ memberships: { [GROUPS[0].id]: [ENTRA_OBJECT_ID] } }, client.storage);
  const checked = await restarted.send('groups-check', { groupNonce: groups.nonce, itemSerial: SERIAL });
  assert.equal(checked.groups.items[0].status, 'added'); assert.equal(memberPosts(restarted).length, 0);
});

test('one group failure does not stop other devices, and active groups block other write workflows', async () => {
  const { client, serials } = bulkClient({ failGroupId: GROUPS[1].id });
  let groups = await groupStart(client, serials.map((serial, index) => ({ serial, groupId: GROUPS[index % 2].id })));
  assert.equal((await client.send('bulk-start', { serials })).ok, false);
  assert.equal((await client.send('profiles-start', { devices: [{ serial: SERIAL, category: 'Talkpad 10' }] })).ok, false);
  groups = await groupApprove(client, groups, serials); groups = await groupRun(client, groups);
  assert.deepEqual(Array.from(groups.items, item => item.status), ['added', 'uncertain', 'added']);
});

test('searchable bulk group selection allows per-row override and uses one confirmation', async () => {
  const { client, serials } = bulkClient();
  client.storage.sidekickApiWipeTestList = serials.map(serial => ({ serial, wiped: false }));
  const ui = panel(client); await ui.click('apiWipeTestBtn'); await ui.click('apiWipeConnect');
  ui.ids.apiWipeGroupsSelect.value = GROUPS[0].id; await ui.click('apiWipeGroupsApply');
  assert.equal(client.storage.sidekickApiWipeTestList.every(device => device.groupId === GROUPS[0].id), true);
  const picker = ui.ids.apiWipeRows.children[1].children[7].children[0];
  const search = picker.children[0]; search.value = 'Prep'; search.listeners.input[0]();
  const select = picker.children[1]; assert.equal(select.children.some(option => option.value === GROUPS[1].id), true);
  select.value = GROUPS[1].id; select.listeners.change[0]();
  assert.equal(client.storage.sidekickApiWipeTestList[1].groupId, GROUPS[1].id);
  await ui.click('apiWipeGroupsBegin'); assert.equal(memberPosts(client).length, 0);
  await ui.decide(true); assert.equal(memberPosts(client).length, 3);
  assert.equal(client.storage.sidekickApiWipeTestList.every(device => device.groupAdded), true);
  await ui.decide(true);
});

async function syncStart(client, serials) {
  await client.send('connect');
  const result = await client.send('sync-start', { serials });
  assert.equal(result.ok, true, result.error); return result.syncs;
}
async function syncApprove(client, syncs, serials) {
  const result = await client.send('sync-approve', { syncNonce: syncs.nonce, selectedSerials: serials, confirmed: true });
  assert.equal(result.ok, true, result.error); return result.syncs;
}
async function syncRun(client, syncs) {
  while (syncs.stage === 'running') {
    const result = await client.send('sync-step', { syncNonce: syncs.nonce });
    assert.equal(result.ok, true, result.error); syncs = result.syncs;
  }
  return syncs;
}
const syncPosts = client => client.posts().filter(call => call.url.endsWith('/syncDevice'));

test('sync uses the verified managed-device endpoint without a body and preserves the current wipe job', async () => {
  const client = setup(); await preview(client);
  const originalJob = JSON.stringify(client.storage.sidekickApiWipeTestJob);
  let syncs = await syncStart(client, [SERIAL]);
  assert.equal(syncPosts(client).length, 0);
  syncs = await syncApprove(client, syncs, [SERIAL]); syncs = await syncRun(client, syncs);
  assert.equal(syncs.items[0].status, 'requested');
  assert.match(syncs.items[0].error, /does not confirm/);
  assert.equal(syncPosts(client).length, 1);
  assert.equal(syncPosts(client)[0].url, `https://graph.microsoft.com/v1.0/deviceManagement/managedDevices/${DEVICE_ID}/syncDevice`);
  assert.equal(syncPosts(client)[0].settings.body, undefined);
  assert.equal(JSON.stringify(client.storage.sidekickApiWipeTestJob), originalJob);
});

test('bulk sync skips unchecked devices and continues after one uncertain request', async () => {
  const { client, serials, records } = bulkClient({ failAction: 'syncDevice', failDeviceId: '21111111-2222-3333-4444-555555555555' });
  let syncs = await syncStart(client, serials);
  syncs = await syncApprove(client, syncs, serials.slice(0, 2)); syncs = await syncRun(client, syncs);
  assert.deepEqual(Array.from(syncs.items, item => item.status), ['requested', 'uncertain', 'skipped']);
  assert.equal(syncPosts(client).length, 2);
  assert.equal(syncPosts(client).some(call => call.url.includes(records[2].id)), false);
});

test('sync refuses changed serials, stale approvals, wrong roles and missing devices', async () => {
  const client = setup(); let syncs = await syncStart(client, [SERIAL]);
  assert.equal((await client.send('sync-approve', { syncNonce: 'wrong', selectedSerials: [SERIAL], confirmed: true })).ok, false);
  assert.equal((await client.send('sync-step', { syncNonce: syncs.nonce })).ok, false);
  syncs = await syncApprove(client, syncs, [SERIAL]); client.device.serialNumber = 'OTHER12345';
  syncs = await syncRun(client, syncs); assert.equal(syncs.items[0].status, 'failed'); assert.equal(syncPosts(client).length, 0);
  client.options.role = 'Device Coordinator';
  assert.equal((await client.send('sync-start', { serials: [SERIAL] })).ok, false);
  const missing = setup({ devices: [] }); const absent = await syncStart(missing, [SERIAL]);
  assert.equal(absent.items[0].missingDevice, true); assert.match(absent.items[0].error, /manual wipe/);
});

test('sync does not automatically repeat an uncertain request after worker restart', async () => {
  const { client, serials } = bulkClient({ failAction: 'syncDevice', failDeviceId: '11111111-2222-3333-4444-555555555555' });
  let syncs = await syncStart(client, serials); syncs = await syncApprove(client, syncs, serials);
  const partial = await client.send('sync-step', { syncNonce: syncs.nonce });
  assert.equal(partial.syncs.items[0].status, 'uncertain');
  const restarted = setup(client.options, client.storage);
  syncs = await syncRun(restarted, partial.syncs);
  assert.deepEqual(Array.from(syncs.items, item => item.status), ['uncertain', 'requested', 'requested']);
  assert.equal(syncPosts(restarted).length, 2);
});

test('row Sync sends one request, while bulk Sync asks once for the group', async () => {
  const { client, serials } = bulkClient(); await client.send('connect');
  client.storage.sidekickApiWipeTestList = serials.map(serial => ({ serial, wiped: false }));
  const ui = panel(client); await ui.click('apiWipeTestBtn');
  await ui.clickElement(ui.ids.apiWipeRows.children[1].children[8].children[0]);
  assert.equal(syncPosts(client).length, 1); assert.equal(ui.dialogOpen(), false);
  assert.equal(client.storage.sidekickApiSyncTestBatch.items[0].serial, serials[1]);
  await ui.click('apiWipeSyncAll'); assert.equal(syncPosts(client).length, 1);
  ui.uncheck(serials[1]); await ui.decide(true);
  assert.equal(syncPosts(client).length, 3);
  assert.equal(client.storage.sidekickApiSyncTestBatch.items[1].status, 'skipped');
  await ui.decide(true);
  assert.equal(client.storage.sidekickApiWipeTestList.some(device => device.wiped), false);
});

test('choosing the bulk group immediately selects it for every device without an extra apply click', async () => {
  const { client, serials } = bulkClient();
  client.storage.sidekickApiWipeTestList = serials.map(serial => ({ serial, wiped: false }));
  const ui = panel(client); await ui.click('apiWipeTestBtn'); await ui.click('apiWipeConnect');
  await ui.changeElement(ui.ids.apiWipeGroupsSelect, GROUPS[0].id);
  assert.equal(client.storage.sidekickApiWipeTestList.every(device => device.groupId === GROUPS[0].id), true);
  assert.equal(ui.ids.apiWipeGroupsBegin.disabled, false);
  await ui.click('apiWipeGroupsBegin'); assert.equal(ui.dialogOpen(), true);
  await ui.decide(true); assert.equal(memberPosts(client).length, 3); await ui.decide(true);
});

test('group action rechecks every selected device despite cached groupAdded flags', async () => {
  const { client, serials } = bulkClient();
  client.storage.sidekickApiWipeTestList = serials.map((serial, index) => ({ serial, groupId: GROUPS[index % 2].id, groupAdded: true, wiped: false }));
  const ui = panel(client); await ui.click('apiWipeTestBtn'); await ui.click('apiWipeConnect');
  assert.equal(ui.ids.apiWipeGroupsBegin.disabled, false);
  await ui.click('apiWipeGroupsBegin'); await ui.decide(true);
  assert.equal(client.storage.sidekickApiGroupTestBatch.items.length, 3);
  assert.equal(memberPosts(client).length, 3);
  await ui.decide(true);
});

test('group button provides a visible message for missing choices and reacts to row selection', async () => {
  const client = setup(); client.storage.sidekickApiWipeTestList = [{ serial: SERIAL, wiped: false }];
  const ui = panel(client); await ui.click('apiWipeTestBtn'); await ui.click('apiWipeGroupsBegin');
  assert.match(ui.ids.apiWipeStatus.textContent, /Choose a group/);
  await ui.click('apiWipeConnect');
  const picker = ui.ids.apiWipeRows.children[0].children[7].children[0];
  await ui.changeElement(picker.children[1], GROUPS[0].id);
  assert.equal(ui.ids.apiWipeGroupsBegin.disabled, false);
  await ui.click('apiWipeGroupsBegin'); await ui.decide(true);
  assert.equal(memberPosts(client).length, 1); await ui.decide(true);
});

test('new Device Sidekick checks each device scan and reports sticker matches with worksheet rows', async () => {
  const client = setup({ audit: { internalSerial: SERIAL }, stickerMatches: [{ sheet: 'Sheet1', row: 7, cell: 'E7' }, { sheet: 'Sheet1', row: 9, cell: 'H9' }] });
  const ui = panel(client); await ui.click('apiWipeTestBtn'); await ui.scan('DTP8.0033');
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(ui.stickerRequests, ['DTP8.0033']);
  assert.equal(ui.dialogOpen(), true);
  assert.match(ui.dialogText(), /Replace the Serial Number sticker.*Sheet1, row 7 \(E7\).*row 9 \(H9\)/);
  assert.equal(ui.tabs.length, 1); assert.equal(ui.tabs[0].active, false);
  assert.match(ui.tabs[0].url, /0EA98517-551F-426A-BFB3-8EB6A8125B17/);
  await ui.decide(true);
  assert.equal(ui.ids.apiWipeScan.disabled, false);
  assert.ok(ui.ids.apiWipeScan.focusCalls > 0);
});

test('sticker no-match opens nothing; lookup and tab errors give a manual workbook link', async () => {
  const normal = setup({ audit: { internalSerial: SERIAL } }); const ui = panel(normal);
  await ui.click('apiWipeTestBtn'); await ui.scan('DTP8.0033'); await new Promise(resolve => setImmediate(resolve));
  assert.equal(ui.dialogOpen(), false); assert.equal(ui.tabs.length, 0);
  normal.options.stickerLookup = async () => ({ ok: false, error: 'Could not read the sticker workbook.' });
  normal.options.audit.internalSerial = 'ANOTHER12345';
  await ui.scan('DTP8.0044'); await new Promise(resolve => setImmediate(resolve));
  assert.match(ui.ids.apiWipeStickerStatus.textContent, /Could not read the sticker workbook/);
  assert.equal(ui.ids.apiWipeStickerLink.hidden, false);
  const failTab = setup({ stickerTabFailure: true, stickerMatches: [{ sheet: 'Sheet1', row: 7, cell: 'E7' }] });
  const other = panel(failTab); await other.click('apiWipeTestBtn'); await other.scan('DTP8.0033'); await new Promise(resolve => setImmediate(resolve));
  assert.match(other.dialogText(), /Could not open the workbook automatically/); await other.decide(true);
});

test('sticker results cannot alert after the scanned row is cleared, edited or access is lost', async () => {
  for (const scenario of ['removed', 'edited', 'role']) {
    let deliver;
    const client = setup({ stickerLookup: async () => new Promise(resolve => { deliver = resolve; }) });
    const ui = panel(client); await ui.click('apiWipeTestBtn'); await ui.scan('DTP8.0033');
    if (scenario === 'removed') await ui.click('apiWipeClear');
    if (scenario === 'edited') await ui.changeElement(ui.ids.apiWipeRows.children[0].children[0].children[0], 'DTP8.0044');
    if (scenario === 'role') client.options.role = 'Device Coordinator';
    deliver({ ok: true, matches: [{ sheet: 'Sheet1', row: 7, cell: 'E7' }] });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(ui.dialogOpen(), false); assert.equal(ui.tabs.length, 0);
  }
});

test('old Device Sidekick and browser lockdown navigation are removed', () => {
  const html = fs.readFileSync(require.resolve('../panel.html'), 'utf8');
  assert.doesNotMatch(html, /id="prePrepSidekickBtn"|id="prePrepView"|workers\/device-sidekick.js/);
  assert.equal(fs.existsSync(require('node:path').join(__dirname, '../device-window.html')), false);
  assert.equal(fs.existsSync(require('node:path').join(__dirname, '../workers/device-sidekick.js')), false);
  assert.ok(html.includes('workers/lockdown-api-panel.js'));
  assert.doesNotMatch(html, /workers\/intune-device-navigation.js/);
});



test('Graph lockdown previews, confirms once and sends fixed settings without repeating uncertain requests', async () => {
  const app = setup(); await app.send('connect');
  let r = await app.send('lockdown-start', { serials: [SERIAL] });
  assert.equal(r.lockdowns.stage, 'review');
  assert.equal(app.posts().filter(x => x.url.endsWith('/enableLostMode')).length, 0);
  const lockdownNonce = r.lockdowns.nonce;
  assert.equal((await app.send('lockdown-step', {lockdownNonce})).ok, false);
  await app.send('lockdown-approve', {lockdownNonce, confirmed:true});
  r=await app.send('lockdown-step', {lockdownNonce});
  assert.equal(r.lockdowns.items[0].status, 'requested');
  const post=app.posts().find(x=>x.url.endsWith('/enableLostMode'));
  assert.match(post.url, /\/beta\/deviceManagement\/managedDevices\//);
  assert.deepEqual(JSON.parse(post.settings.body), {message:'This device is durable medical equipment, property of Smartbox. If found, please contact 877-392-2299 ext.6 or trials.us@smartboxaac.com',phoneNumber:'877-392-2299 ext.6',footer:''});
  await app.send('lockdown-check', {lockdownNonce});
  await app.send('lockdown-step', {lockdownNonce});
  assert.equal(app.posts().filter(x=>x.url.endsWith('/enableLostMode')).length,1);
});

test('Graph lockdown rejects duplicates, unsupported devices and changed identities; bulk continues after failure',async()=>{
  const first={id:DEVICE_ID,serialNumber:SERIAL,operatingSystem:'iOS',isSupervised:true,managementState:'managed'};
  const second={...first,id:'22222222-2222-3333-4444-555555555555',serialNumber:'SECOND1234'};
  const options={devices:[first,second],failAction:'enableLostMode',failDeviceId:DEVICE_ID};
  const app=setup(options);await app.send('connect');
  assert.equal((await app.send('lockdown-start',{serials:[SERIAL,SERIAL]})).ok,false);
  let r=await app.send('lockdown-start',{serials:[SERIAL,'SECOND1234']});const lockdownNonce=r.lockdowns.nonce;
  await app.send('lockdown-approve',{lockdownNonce,confirmed:true});
  r=await app.send('lockdown-step',{lockdownNonce});assert.equal(r.lockdowns.items[0].status,'uncertain');
  r=await app.send('lockdown-step',{lockdownNonce});assert.equal(r.lockdowns.items[1].status,'requested');assert.equal(r.lockdowns.stage,'complete');
  options.devices=[{...first,isSupervised:false}];
  r=await app.send('lockdown-start',{serials:[SERIAL]});assert.equal(r.lockdowns.items[0].status,'failed');
  options.devices=[first];r=await app.send('lockdown-start',{serials:[SERIAL]});const nonce=r.lockdowns.nonce;
  await app.send('lockdown-approve',{lockdownNonce:nonce,confirmed:true});
  options.devices=[{...first,serialNumber:'CHANGED123'}];r=await app.send('lockdown-step',{lockdownNonce:nonce});assert.equal(r.lockdowns.items[0].status,'failed');
});


test('disable Lost Mode uses confirmed device IDs, no request body and read-only completion checks',async()=>{
 const device={id:DEVICE_ID,serialNumber:SERIAL,operatingSystem:'iOS',isSupervised:true,managementState:'managed',lostModeState:'enabled'};
 const options={devices:[device]};const app=setup(options);await app.send('connect');
 let r=await app.send('lockdown-start',{serials:[SERIAL],mode:'disable'});assert.equal(r.lockdowns.mode,'disable');
 const lockdownNonce=r.lockdowns.nonce;
 assert.equal((await app.send('lockdown-step',{lockdownNonce})).ok,false);
 await app.send('lockdown-approve',{lockdownNonce,confirmed:true});
 r=await app.send('lockdown-step',{lockdownNonce});assert.equal(r.lockdowns.items[0].status,'requested');
 const post=app.posts().find(call=>call.url.endsWith('/disableLostMode'));
 assert.equal(post.url,'https://graph.microsoft.com/v1.0/deviceManagement/managedDevices/'+DEVICE_ID+'/disableLostMode');assert.equal(post.settings.body,undefined);
 assert.equal(app.posts().some(call=>call.url.endsWith('/enableLostMode')),false);
 options.devices=[{...device,lostModeState:'disabled'}];
 r=await app.send('lockdown-check',{lockdownNonce});assert.equal(r.lockdowns.items[0].status,'reported disabled');
 assert.match(r.lockdowns.items[0].error,/Verify the Lost Mode screen/);
 assert.equal(app.posts().filter(call=>call.url.endsWith('/disableLostMode')).length,1);
 r=await app.send('lockdown-start',{serials:[SERIAL],mode:'disable'});assert.equal(r.lockdowns.stage,'review');assert.equal(r.lockdowns.items[0].status,'ready');
});

test('bulk disable isolates uncertain responses and never repeats them on resume or status check',async()=>{
 const first={id:DEVICE_ID,serialNumber:SERIAL,operatingSystem:'iOS',isSupervised:true,managementState:'managed',lostModeState:'enabled'};
 const second={...first,id:'22222222-2222-3333-4444-555555555555',serialNumber:'SECOND1234'};
 const options={devices:[first,second],failAction:'disableLostMode',failDeviceId:DEVICE_ID};const app=setup(options);await app.send('connect');
 let r=await app.send('lockdown-start',{serials:[SERIAL,'SECOND1234'],mode:'disable'});const lockdownNonce=r.lockdowns.nonce;
 await app.send('lockdown-approve',{lockdownNonce,confirmed:true});r=await app.send('lockdown-step',{lockdownNonce});assert.equal(r.lockdowns.items[0].status,'uncertain');
 const restarted=setup(options,app.storage);r=await restarted.send('lockdown-step',{lockdownNonce});assert.equal(r.lockdowns.items[1].status,'requested');
 await restarted.send('lockdown-check',{lockdownNonce});assert.equal(restarted.posts().filter(call=>call.url.endsWith('/disableLostMode')).length,1);
 assert.ok(restarted.posts()[0].url.includes(second.id));
});


test('disable command is sent after approval even when both preview and device GET report disabled', async()=>{
 const app=setup();await app.send('connect');
 let r=await app.send('lockdown-start',{serials:[SERIAL],mode:'disable'});
 assert.equal(r.lockdowns.stage,'review');assert.equal(app.posts().filter(call=>call.url.endsWith('/disableLostMode')).length,0);
 const lockdownNonce=r.lockdowns.nonce;await app.send('lockdown-approve',{lockdownNonce,confirmed:true});
 r=await app.send('lockdown-step',{lockdownNonce});assert.equal(r.lockdowns.items[0].status,'requested');
 assert.equal(app.posts().filter(call=>call.url.endsWith('/disableLostMode')).length,1);
 r=await app.send('lockdown-check',{lockdownNonce});assert.equal(r.lockdowns.items[0].status,'reported disabled');
 assert.match(r.lockdowns.items[0].error,/does not confirm/);
 await app.send('lockdown-check',{lockdownNonce});await app.send('lockdown-step',{lockdownNonce});
 assert.equal(app.posts().filter(call=>call.url.endsWith('/disableLostMode')).length,1);
});
