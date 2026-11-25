const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function setup(role = 'Device Systems Coordinator') {
  let handler;
  const windows = [], created = [], updated = [];
  const chrome = {
    runtime: { id: 'self', getURL: page => `chrome-extension://self/${page}`, onMessage: { addListener: fn => { handler = fn; } } },
    storage: { local: { get: async () => ({ ttmtSidekickUserProfile: { role } }) } },
    alarms: { clear: async () => {} },
    system: { display: { getInfo: async () => [{ isPrimary: true, bounds: { left: 0, top: 0, width: 1920, height: 1080 }, workArea: { left: 0, top: 0, width: 1920, height: 1040 } }] } },
    windows: {
      getAll: async () => windows,
      getLastFocused: async () => ({ left: 0, top: 0, width: 1920, height: 1040 }),
      create: async options => { created.push(options); windows.push({ id: windows.length + 1, tabs: [{ url: options.url }] }); },
      update: async (id, options) => { updated.push({ id, ...options }); }
    }
  };
  const context = { chrome, console }; vm.createContext(context);
  vm.runInContext(fs.readFileSync(require.resolve('../workers/device-window-worker.js'), 'utf8'), context);
  const send = type => new Promise(resolve => { if (!handler({ type }, { id: 'self' }, resolve)) resolve(undefined); });
  return { send, created, updated, windows };
}
test('Device Sidekick opens centered, reuses its popup and has no old launcher', async () => {
  const client = setup();
  await Promise.all([client.send('sidekick-open-new-device'), client.send('sidekick-open-new-device')]);
  assert.equal(client.created.length, 1);
  assert.equal(client.created[0].url, 'chrome-extension://self/device-new-window.html');
  assert.equal(client.created[0].type, 'popup'); assert.equal(client.created[0].width, 1180);
  assert.equal(client.created[0].left, 370); assert.equal(client.updated.length, 1);
  client.windows[0].state = 'minimized'; await client.send('sidekick-open-new-device');
  assert.equal(client.updated[1].state, 'normal');
  assert.equal(await client.send('sidekick-open-device'), undefined);
  assert.equal(client.created.length, 1);
});
test('new popup is restricted to Device Systems Coordinators', async () => {
  const client = setup('Device Coordinator');
  assert.equal((await client.send('sidekick-open-new-device')).ok, false);
  assert.equal(client.created.length, 0);
});


test('Lock Down defaults to its own centered popup and reuses it', async()=>{
 const client=setup();
 await client.send('sidekick-open-lockdown');await client.send('sidekick-open-lockdown');
 assert.equal(client.created.length,1);assert.equal(client.created[0].type,'popup');
 assert.equal(client.created[0].url,'chrome-extension://self/panel.html?tool=lockdown');
 assert.equal(client.updated.length,1);
 client.windows[0].state='minimized';await client.send('sidekick-open-lockdown');assert.equal(client.updated.at(-1).state,'normal');
 const denied=setup('Device Coordinator');assert.equal((await denied.send('sidekick-open-lockdown')).ok,false);assert.equal(denied.created.length,0);
 const panel=fs.readFileSync(require.resolve('../panel.js'),'utf8');
 assert.match(panel,/type: "sidekick-open-lockdown"/);assert.match(panel,/if \(isLockDownWindow\) return;/);
});
