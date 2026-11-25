const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const source = fs.readFileSync(require.resolve('../workers/intune-license-worker.js'), 'utf8');

function setup(options = {}) {
  const storage = {};
  const calls = [];
  let handler;
  const context = {
    URL, URLSearchParams, TextEncoder, Uint8Array, crypto: webcrypto, btoa, AbortController, setTimeout, clearTimeout, Date,
    chrome: {
      identity: {
        getRedirectURL: path => `https://test-extension.chromiumapp.org/${path}`,
        launchWebAuthFlow: async ({ url }) => {
          const auth = new URL(url);
          assert.equal(auth.origin, 'https://login.microsoftonline.com');
          assert.match(auth.pathname, /7870fa94-0832-4bfd-b39b-44927dfd207b/);
          assert.equal(auth.searchParams.get('client_id'), 'c3568020-d287-44a2-91f0-0435507fab91');
          assert.equal(auth.searchParams.get('code_challenge_method'), 'S256');
          assert.ok(auth.searchParams.get('code_challenge'));
          return `${auth.searchParams.get('redirect_uri')}?code=authorization-code&state=${options.badState ? 'wrong' : auth.searchParams.get('state')}`;
        }
      },
      runtime: { id: 'self', onMessage: { addListener: fn => { handler = fn; } } },
      storage: {
        local: { get: async () => ({ ttmtSidekickUserProfile: { role: options.role || 'Device Systems Coordinator' } }) },
        session: { get: async key => ({ [key]: storage[key] }), set: async values => Object.assign(storage, values), remove: async key => { delete storage[key]; } },
        onChanged: { addListener() {} }
      }
    },
    fetch: async (url, settings) => {
      calls.push({ url, settings });
      if (url.includes('/token')) {
        const body = new URLSearchParams(settings.body);
        assert.equal(body.has('client_secret'), false);
        if (body.get('grant_type') === 'authorization_code') assert.ok(body.get('code_verifier'));
        return { ok: true, status: 200, json: async () => ({ access_token: 'private-token', refresh_token: 'private-refresh', scope: 'DeviceManagementApps.Read.All', expires_in: 3600 }) };
      }
      assert.equal(settings.headers.Authorization, 'Bearer private-token');
      assert.equal(new URL(url).pathname, '/v1.0/deviceAppManagement/mobileApps');
      if (options.denied) return { ok: false, status: 403, json: async () => ({}) };
      if (options.badRequest) return { ok: false, status: 400, json: async () => ({error:{code:'BadRequest'}}) };
      const next = options.evilNext ? 'https://example.com/steal' : null;
      return { ok: true, status: 200, json: async () => ({ value: options.apps || [{ '@odata.type':'#microsoft.graph.iosVppApp', id: 'lamp', displayName: 'LAMP Words For Life', totalLicenseCount: 701, usedLicenseCount: 522, vppTokenDisplayName: 'Trials II' }, { '@odata.type':'#microsoft.graph.win32LobApp', id:'other',displayName:'Other app' }], '@odata.nextLink': next }) };
    }
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  const send = action => new Promise(resolve => handler({ type: `sidekick-intune-license-${action}` }, { id: 'self' }, resolve));
  return { send, calls, storage };
}

test('Graph connection validates PKCE and state, keeps tokens private and calculates available licenses', async () => {
  const { send, calls, storage } = setup();
  assert.equal((await send('config')).redirectUri, 'https://test-extension.chromiumapp.org/microsoft');
  const connected = await send('connect');
  assert.equal(connected.ok, true);
  assert.doesNotMatch(JSON.stringify(connected), /private-token|private-refresh/);
  const result = await send('refresh');
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].available, 179);
  assert.equal(result.rows[0].total, 701);
  assert.equal(result.rows[0].used, 522);
  assert.doesNotMatch(JSON.stringify(result), /private-token|private-refresh/);
  assert.equal(calls.length, 2);
  await send('disconnect');
  assert.deepEqual(storage, {});
});

test('monitor excludes unlisted apps and preserves unlimited availability', async () => {
  const app = (displayName, totalLicenseCount, usedLicenseCount) => ({ '@odata.type': '#microsoft.graph.iosVppApp', id: displayName, displayName, totalLicenseCount, usedLicenseCount });
  const { send } = setup({ apps: [app('Grid for iPad - AAC', 2147483647, 1113), app('Unlisted app', 100, 10), app('CoughDrop', 50, 20)] });
  await send('connect');
  const result = await send('refresh');
  assert.equal(result.rows.length, 2);
  const grid = result.rows.find(row => row.name === 'Grid for iPad - AAC');
  assert.equal(grid.total, 2147483647);
  assert.equal(grid.available, 2147483647);
  assert.equal(grid.used, 1113);
  assert.equal(result.rows.find(row => row.name === 'CoughDrop').available, 30);
});

test('Graph failure exposes HTTP status and error code for diagnosis', async () => {
  const { send } = setup({badRequest:true});
  await send('connect');
  const result = await send('refresh');
  assert.equal(result.ok,false);
  assert.match(result.error,/HTTP 400 \(BadRequest\)/);
});

test('wrong OAuth state and non-systems role never redeem tokens', async () => {
  for (const options of [{ badState: true }, { role: 'Device Coordinator' }]) {
    const { send, calls } = setup(options);
    assert.equal((await send('connect')).ok, false);
    assert.equal(calls.length, 0);
  }
});

test('Graph permission failure is shown and pagination cannot send a token to another host', async () => {
  for (const options of [{ denied: true }, { evilNext: true }]) {
    const { send, calls } = setup(options);
    await send('connect');
    const result = await send('refresh');
    assert.equal(result.ok, false);
    assert.match(result.error, options.denied ? /denied access/ : /invalid license results page/);
    assert.equal(calls.filter(call => call.url.startsWith('https://example.com')).length, 0);
  }
});
