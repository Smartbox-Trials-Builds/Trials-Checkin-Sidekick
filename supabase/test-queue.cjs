// Live integration test. Creates temporary anonymous users; prints their IDs for
// an administrator to remove after the run. No real profiles are modified.
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const assert = require("node:assert/strict");
vm.runInThisContext(fs.readFileSync(path.join(__dirname, "../libs/supabase.min.js"), "utf8"));
const source = fs.readFileSync(path.join(__dirname, "connection.js"), "utf8");
const url = source.match(/const url = "([^"]+)"/)[1];
const key = source.match(/const publishableKey = "([^"]+)"/)[1];
const clients = [];
const channels = [];

async function user(role, initials) {
  const client = supabase.createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  clients.push(client);
  const { data, error } = await client.auth.signInAnonymously();
  assert.ifError(error);
  console.log(`Temporary test user: ${data.user.id}`);
  const result = await client.from("sidekick_user_profiles").insert({
    user_id: data.user.id, name: "Queue integration test", dashboard_initials: initials, role
  });
  assert.ifError(result.error);
  return { client, id: data.user.id };
}

async function action(client, p_action, args = {}) {
  if (p_action === "assign") return client.rpc("sidekick_assign_prep", {
    p_device_type: "Talkpad", p_priority: "Daily queue", p_crm_id: "12345", ...args
  });
  return client.rpc("sidekick_queue_action", { p_action, ...args });
}

async function listen(client, table, event, filter) {
  const { data } = await client.auth.getSession();
  await client.realtime.setAuth(data.session.access_token);
  let resolveEvent;
  const received = new Promise(resolve => { resolveEvent = resolve; });
  const channel = client.channel(`test-${table}-${crypto.randomUUID()}`)
    .on("postgres_changes", { schema: "public", table, event, ...(filter ? { filter } : {}) }, resolveEvent);
  channels.push({ client, channel });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Realtime subscription timeout")), 12000);
    channel.subscribe(state => {
      if (state === "SUBSCRIBED") { clearTimeout(timer); resolve(); }
      if (state === "CHANNEL_ERROR" || state === "TIMED_OUT") { clearTimeout(timer); reject(new Error(state)); }
    });
  });
  return { received };
}

async function listenClientName(client, recipientId) {
  const { data } = await client.auth.getSession();
  await client.realtime.setAuth(data.session.access_token);
  let resolveMessage;
  const received = new Promise(resolve => { resolveMessage = resolve; });
  const channel = client.channel(`sidekick-clients:${recipientId}`, { config: { private: true, broadcast: { ack: true } } })
    .on("broadcast", { event: "client-name" }, message => resolveMessage(message.payload));
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Private client-name subscription timeout")), 12000);
    channel.subscribe(state => {
      if (state === "SUBSCRIBED") { clearTimeout(timer); resolve(); }
      if (state === "CHANNEL_ERROR" || state === "TIMED_OUT") { clearTimeout(timer); reject(new Error("Private broadcast authorization failed")); }
    });
  });
  return { channel, received };
}

async function run() {
  const coordinator = await user("Device Coordinator", "QC");
  const systems = await user("Device Systems Coordinator", "QS");
  const otherSystems = await user("Device Systems Coordinator", "QO");
  const queueEvents = await listen(systems.client, "sidekick_queue", "INSERT");
  const notificationEvents = await listen(coordinator.client, "sidekick_prep_notifications", "INSERT", `user_id=eq.${coordinator.id}`);
  const liveNames = await listenClientName(coordinator.client, coordinator.id);
  assert.ifError((await action(coordinator.client, "join")).error);
  const event = await Promise.race([queueEvents.received, new Promise((_, reject) => setTimeout(() => reject(new Error("Live queue update missing")), 12000))]);
  assert.equal(event.new.user_id, coordinator.id);
  let entries = await systems.client.from("sidekick_queue").select().eq("user_id", coordinator.id);
  assert.ifError(entries.error);
  assert.equal(entries.data.length, 1);
  const entry = entries.data[0];
  assert.ifError((await action(coordinator.client, "join")).error);
  entries = await systems.client.from("sidekick_queue").select().eq("user_id", coordinator.id);
  assert.equal(entries.data[0].id, entry.id, "Joining twice must retain original position");
  assert.ok((await action(coordinator.client, "assign", { p_entry_id: entry.id, p_row_number: 12 })).error, "Coordinator must not assign");
  assert.ok((await action(systems.client, "assign", { p_entry_id: entry.id, p_row_number: 0 })).error, "Invalid rows must be rejected");
  assert.ok((await action(systems.client, "assign", { p_entry_id: entry.id, p_row_number: 12, p_device_type: "Invalid" })).error, "Unsupported device types must be rejected");
  assert.ok((await action(systems.client, "assign", { p_entry_id: entry.id, p_row_number: 12, p_priority: "Invalid" })).error, "Unsupported priorities must be rejected");
  assert.ok((await clientLegacyAssign(systems.client, entry.id)).error, "Old assignment route must not bypass required details");
  assert.ok((await systems.client.from("sidekick_queue").delete().eq("id", entry.id)).error, "Direct queue writes must be blocked");
  assert.ok((await action(systems.client, "assign", { p_entry_id: entry.id, p_row_number: null, p_crm_id: " " })).error, "Blank CRM IDs must be rejected");
  const assignments = await Promise.all([
    action(systems.client, "assign", { p_entry_id: entry.id, p_row_number: null }),
    action(otherSystems.client, "assign", { p_entry_id: entry.id, p_row_number: null })
  ]);
  assert.equal(assignments.filter(result => !result.error).length, 1, "Only one concurrent assignment can win");
  const noticeEvent = await Promise.race([notificationEvents.received, new Promise((_, reject) => setTimeout(() => reject(new Error("Live notification missing")), 12000))]);
  assert.equal(noticeEvent.new.user_id, coordinator.id);
  entries = await coordinator.client.from("sidekick_queue").select().eq("user_id", coordinator.id);
  assert.equal(entries.data.length, 0);
  const notices = await coordinator.client.from("sidekick_prep_notifications").select().is("dismissed_at", null);
  assert.ifError(notices.error);
  assert.equal(notices.data.length, 1);
  const notice = notices.data[0];
  assert.equal(Object.hasOwn(notice, "client_name"), false, "Client names must not be stored in notifications");
  assert.equal(notice.row_number, null, "Assignments must work without a row number");
  assert.equal(notice.crm_id, "12345");
  assert.equal(notice.device_type, "Talkpad");
  assert.equal(notice.priority, "Daily queue");
  await assert.rejects(
    liveNames.channel.httpSend("client-name", { notificationId: notice.id, name: "UNAUTHORIZED TEST NAME", senderId: coordinator.id }, { timeout: 6000 }),
    "Device Coordinators must not be able to send live client names"
  );
  await assert.rejects(listenClientName(otherSystems.client, coordinator.id), "Other users must not read the recipient's private live-name inbox");
  const winner = assignments[0].error ? otherSystems : systems;
  const winnerSession = (await winner.client.auth.getSession()).data.session;
  const browserStorage = { "sidekick-supabase-session": JSON.stringify(winnerSession) };
  globalThis.chrome = { storage: { local: {
    get: async key => ({ [key]: browserStorage[key] }),
    set: async values => Object.assign(browserStorage, values),
    remove: async key => delete browserStorage[key]
  } } };
  require("./connection.js");
  await sidekickSupabase.sendLiveClientName({ recipientId: coordinator.id, notificationId: notice.id, name: "EPHEMERAL TEST CLIENT", senderId: winner.id });
  const livePayload = await Promise.race([liveNames.received, new Promise((_, reject) => setTimeout(() => reject(new Error("Private live client name missing")), 12000))]);
  assert.equal(livePayload.notificationId, notice.id);
  assert.equal(livePayload.name, "EPHEMERAL TEST CLIENT");
  assert.equal(livePayload.senderId, winner.id);
  console.log("PASS: client name delivered privately via live Broadcast, separate from the database notification.");
  const unauthorized = await systems.client.from("sidekick_prep_notifications").select().eq("id", notice.id);
  assert.deepEqual(unauthorized.data, [], "Other users cannot read assignment notifications");
  await action(systems.client, "dismiss", { p_notification_id: notice.id });
  const retained = await coordinator.client.from("sidekick_prep_notifications").select().is("dismissed_at", null);
  assert.equal(retained.data.length, 1, "Notifications persist until their owner closes them");
  assert.ifError((await action(coordinator.client, "dismiss", { p_notification_id: notice.id })).error);
  const dismissed = await coordinator.client.from("sidekick_prep_notifications").select().is("dismissed_at", null);
  assert.equal(dismissed.data.length, 0);
  assert.ifError((await action(coordinator.client, "join")).error);
  const rejoined = await coordinator.client.from("sidekick_queue").select().eq("user_id", coordinator.id);
  assert.notEqual(rejoined.data[0].id, entry.id);
  assert.ok((await action(systems.client, "assign", { p_entry_id: entry.id, p_row_number: 44 })).error, "Stale dialogs must not assign a rejoined user");
  assert.ifError((await action(coordinator.client, "leave")).error);
  const left = await coordinator.client.from("sidekick_queue").select().eq("user_id", coordinator.id);
  assert.equal(left.data.length, 0);
  console.log("PASS: join, duplicate join, leave, role checks, row validation, concurrent assignment, stale entries, private persistent notifications, and Realtime delivery.");
}

async function clientLegacyAssign(client, id) {
  return client.rpc("sidekick_queue_action", { p_action: "assign", p_entry_id: id, p_row_number: 12 });
}

run().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });
