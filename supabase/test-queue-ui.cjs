const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

class Element {
  constructor(tag = "div") { this.tagName = tag; this.children = []; this.listeners = {}; this.dataset = {}; this.disabled = false; this.hidden = false; this.value = ""; }
  addEventListener(name, handler) { this.listeners[name] = handler; }
  setAttribute() {}
  append(...elements) { for (const element of elements) { element.parent = this; this.children.push(element); } }
  replaceChildren() { this.children = []; }
  remove() { this.parent.children = this.parent.children.filter(child => child !== this); }
  showModal() { this.open = true; }
  close() { this.open = false; }
  focus() {}
  reportValidity() { return true; }
  fire(name) { return this.listeners[name]?.({ preventDefault() {} }); }
}

const elements = new Map();
const byId = id => {
  if (!elements.has(id)) elements.set(id, new Element());
  return elements.get(id);
};
const profile = { user_id: "me", role: "Device Coordinator" };
const target = { id: "entry", user_id: "other", name: "Other User", dashboard_initials: "OU" };
let queue = [target];
let notices = [{ id: "notice", row_number: 17 }];
let failAction = false;
let authenticated = false;
let queueOpen = true;
const events = {};
const windowMessages = [];
const client = {
  auth: { getSession: async () => ({ data: { session: { user: { id: "me" }, access_token: "session-token" } } }) },
  realtime: { setAuth: async token => { assert.equal(token, "session-token"); authenticated = true; } },
  channel() {
    const channel = {
      on() { return channel; },
      subscribe(callback) { assert.ok(authenticated); callback("SUBSCRIBED"); return channel; }
    };
    return channel;
  },
  removeChannel: async () => {},
  from(table) {
    const query = {
      select() { return query; }, eq() { return query; }, is() { return query; }, order() { return query; },
      async maybeSingle() { return { data: profile }; },
      then(resolve, reject) { return Promise.resolve({ data: table === "sidekick_queue" ? queue : notices }).then(resolve, reject); }
    };
    return query;
  },
  async rpc(rpcName, args) {
    if (rpcName === "sidekick_queue_hours") return { data: { is_open: queueOpen } };
    if (failAction) return { error: { message: "Test connection error" } };
    if (args.p_action === "join") queue.push({ id: "mine", user_id: "me", name: "Me", dashboard_initials: "ME" });
    if (args.p_action === "leave") queue = queue.filter(entry => entry.user_id !== "me");
    if (rpcName === "sidekick_assign_prep") {
      assert.equal(args.p_entry_id, "entry"); assert.equal(args.p_row_number, null);
      assert.equal(args.p_crm_id, "12345");
      assert.equal(Object.hasOwn(args, "p_client_name"), false, "Client names must never go to SQL");
      assert.equal(args.p_device_type, "Gridpad");
      assert.equal(args.p_priority, "Funded rental");
      queue = queue.filter(entry => entry.id !== args.p_entry_id);
    }
    if (args.p_action === "dismiss") notices = notices.filter(notice => notice.id !== args.p_notification_id);
    return { error: null, data: "notice-id" };
  }
};
const context = {
  chrome: { runtime: { sendMessage: async message => { windowMessages.push(message); return { ok: true }; } } },
  sidekickSupabase: { getClient: () => client, sendLiveClientName: async payload => {
    assert.equal(payload.name, "Test Client");
    assert.equal(payload.notificationId, "notice-id");
    assert.equal(payload.recipientId, "other");
  } },
  document: { getElementById: byId, createElement: tag => new Element(tag), addEventListener() {}, hidden: false },
  addEventListener: (name, handler) => { events[name] = handler; },
  setInterval() { return 1; }, clearInterval() {}, console
};
vm.runInNewContext(fs.readFileSync(`${__dirname}/queue.js`, "utf8"), context);
const settle = async () => { for (let i = 0; i < 20; i++) await new Promise(resolve => setImmediate(resolve)); };

(async () => {
  await settle();
  const join = byId("joinCoordinatorQueueBtn"), leave = byId("leaveCoordinatorQueueBtn");
  const list = byId("coordinatorQueueList");
  assert.equal(list.children[0].children[0].tagName, "span", "Coordinators cannot open assignment dialogs");
  assert.equal(join.disabled, false); assert.equal(leave.disabled, true);
  queueOpen = false; events.online(); await settle();
  assert.equal(join.disabled, true, "Closed queue disables joining");
  assert.match(byId("coordinatorQueueStatus").textContent, /Reopens at 7 AM/);
  queueOpen = true; events.online(); await settle();
  join.fire("click"); await settle();
  assert.equal(join.disabled, true); assert.equal(leave.disabled, false);
  leave.fire("click"); await settle();
  assert.equal(join.disabled, false); assert.equal(leave.disabled, true);
  assert.ok(windowMessages.some(message => message.type === "sidekick-check-notifications"), "Assignments are forwarded to the centered window");
  events["sidekick-profile-saved"](); await settle();
  profile.role = "Device Systems Coordinator";
  events["sidekick-profile-saved"](); await settle();
  assert.equal(list.children[0].children[0].tagName, "button");
  list.children[0].children[0].fire("click");
  assert.equal(byId("prepAssignmentDialog").open, true);
  byId("prepAssignmentRow").value = "";
  byId("prepAssignmentCrm").value = "12345";
  byId("prepAssignmentClient").value = "   ";
  await byId("prepAssignmentForm").fire("submit");
  assert.equal(byId("prepAssignmentDialog").open, true, "Blank client names must not consume the queue entry");
  byId("prepAssignmentClient").value = " Test Client ";
  byId("prepAssignmentDevice").value = "Gridpad";
  byId("prepAssignmentPriority").value = "Funded rental";
  failAction = true;
  await byId("prepAssignmentForm").fire("submit");
  assert.equal(byId("prepAssignmentDialog").open, true, "Failed assignments retain the dialog");
  assert.equal(byId("prepAssignmentSubmit").disabled, false);
  failAction = false;
  await byId("prepAssignmentForm").fire("submit"); await settle();
  assert.equal(byId("prepAssignmentDialog").open, false);
  assert.equal(list.children.length, 0);
  console.log("PASS: role-specific UI, join/leave controls, assignment dialog, notification-window forwarding, and failed-action recovery.");
})().catch(error => { console.error(error); process.exitCode = 1; });
