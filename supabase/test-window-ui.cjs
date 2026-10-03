const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

class Element {
  constructor() { this.children = []; this.listeners = {}; this.dataset = {}; this.attributes = {}; this.hidden = false; this.disabled = false; }
  addEventListener(name, fn) { this.listeners[name] = fn; }
  setAttribute(name, value) { this.attributes[name] = value; }
  append(...elements) { for (const e of elements) { e.parent = this; this.children.push(e); } }
  remove() { this.parent.children = this.parent.children.filter(e => e !== this); }
  fire(name) { return this.listeners[name]?.(); }
}
const settle = async () => { for (let i = 0; i < 25; i++) await new Promise(resolve => setImmediate(resolve)); };

async function testLayout(detachedPage) {
  const values = { sidekickQueueDetached: false, sidekickQueueCollapsed: false };
  const listeners = [];
  const ids = ["coordinatorQueueSection", "coordinatorQueueBody", "queueWindowStatus", "returnCoordinatorQueueBtn"];
  if (!detachedPage) ids.push("coordinatorQueueDetached", "toggleCoordinatorQueueBtn", "popOutCoordinatorQueueBtn", "focusCoordinatorQueueBtn");
  const elements = new Map(ids.map(id => [id, new Element()]));
  const local = {
    async get() { return { ...values }; },
    async set(update) {
      Object.assign(values, update);
      for (const fn of listeners) fn(Object.fromEntries(Object.keys(update).map(key => [key, {}])), "local");
    }
  };
  const context = {
    location: { pathname: detachedPage ? "/queue-window.html" : "/panel.html" },
    document: { getElementById: id => elements.get(id) || null },
    chrome: {
      tabs: { create: async options => tabs.push(options) },
      storage: { local, onChanged: { addListener: fn => listeners.push(fn) } },
      runtime: { async sendMessage(message) {
        if (message.type === "sidekick-open-queue") await local.set({ sidekickQueueDetached: true });
        if (message.type === "sidekick-return-queue") await local.set({ sidekickQueueDetached: false, sidekickQueueCollapsed: false });
        return { ok: true };
      } }
    }
  };
  vm.runInNewContext(fs.readFileSync(`${__dirname}/queue-layout.js`, "utf8"), context);
  await settle();
  if (detachedPage) {
    await local.set({ sidekickQueueCollapsed: true, sidekickQueueDetached: true }); await settle();
    assert.equal(elements.get("coordinatorQueueBody").hidden, false, "The detached queue must remain visible");
    await elements.get("returnCoordinatorQueueBtn").fire("click"); await settle();
    assert.equal(values.sidekickQueueDetached, false);
    return;
  }
  const toggle = elements.get("toggleCoordinatorQueueBtn");
  await toggle.fire("click"); await settle();
  assert.equal(elements.get("coordinatorQueueBody").hidden, true);
  assert.equal(toggle.textContent, "Show Queue"); assert.equal(toggle.attributes["aria-expanded"], "false");
  assert.equal(elements.get("popOutCoordinatorQueueBtn").hidden, true, "Only Show Queue remains when collapsed");
  assert.equal(elements.get("coordinatorQueueSection").dataset.collapsed, "true");
  await toggle.fire("click"); await settle();
  assert.equal(elements.get("coordinatorQueueBody").hidden, false);
  assert.equal(elements.get("popOutCoordinatorQueueBtn").hidden, false);
  await elements.get("popOutCoordinatorQueueBtn").fire("click"); await settle();
  assert.equal(elements.get("coordinatorQueueSection").hidden, true);
  assert.equal(elements.get("coordinatorQueueDetached").hidden, false);
  await elements.get("returnCoordinatorQueueBtn").fire("click"); await settle();
  assert.equal(elements.get("coordinatorQueueSection").hidden, false);
  assert.equal(elements.get("coordinatorQueueDetached").hidden, true);
  assert.equal(elements.get("coordinatorQueueBody").hidden, false);
}

async function testAlert() {
  const elements = new Map(["prepAssignmentNotifications", "assignmentWindowStatus"].map(id => [id, new Element()]));
  let notices = [{ id: "notice", row_number: null, crm_id: "12345", device_type: "Gridpad", priority: "Funded rental" }];
  const liveNames = { notice: "Test Client" };
  let pending = ["already-closed"];
  let fail = false;
  const events = {};
  const requests = [];
  const tabs = [];
  const client = {
    auth: { getSession: async () => ({ data: { session: { user: { id: "me" }, access_token: "token" } } }) },
    realtime: { setAuth: async () => {} }, removeChannel: async () => {},
    channel() { const c = { on() { return c; }, subscribe(fn) { fn("SUBSCRIBED"); return c; } }; return c; },
    from() { const q = { select() { return q; }, is() { return q; }, order: async () => ({ data: notices }) }; return q; },
    async rpc(_, args) {
      if (fail) return { error: { message: "Offline" } };
      notices = notices.filter(n => n.id !== args.p_notification_id);
      return {};
    }
  };
  const context = {
    sidekickSupabase: { getClient: () => client },
    document: { getElementById: id => elements.get(id), createElement: () => new Element() },
    chrome: {
      tabs: { create: async options => tabs.push(options) },
      storage: {
        local: { get: async () => ({ sidekickPendingDismissals: pending }) },
        session: { get: async () => ({ sidekickLiveClientNames: liveNames }) },
        onChanged: { addListener() {} }
      },
      runtime: { sendMessage: async message => { requests.push(message); return { ok: true }; } }
    },
    setInterval: () => 1, clearInterval() {}, addEventListener: (name, fn) => { events[name] = fn; }
  };
  vm.runInNewContext(fs.readFileSync(`${__dirname}/../crm-links.js`, "utf8"), context);
  const realBuilder = context.sidekickCrmLinks.build;
  context.sidekickCrmLinks = { build: id => realBuilder(id, "https://www.example.com/crmid") };
  vm.runInNewContext(fs.readFileSync(`${__dirname}/assignment-window.js`, "utf8"), context);
  await settle();
  const cards = elements.get("prepAssignmentNotifications");
  const card = cards.children[0];
  assert.match(card.children[0].textContent, /initials on the Dashboard and the device prep slip/);
  await card.children[3].fire("click");
  assert.equal(tabs[0].url, "https://www.example.com/crmid12345");
  assert.equal(cards.children.length, 1, "Open CRM must not dismiss the assignment");
  assert.deepEqual(card.children[1].children.map(e => e.textContent), ["Client", "Test Client", "Device", "Gridpad", "CRM ID", "12345", "Priority", "Funded rental"]);
  notices.push({ id: "already-closed", row_number: 99 });
  events.online(); await settle();
  assert.equal(cards.children.length, 1, "Locally closed alerts must stay dismissed while waiting for sync");
  assert.equal(cards.children[0], card, "Refresh must preserve the card and keyboard focus");
  fail = true;
  await card.children[2].fire("click");
  assert.equal(cards.children.length, 1, "Failed dismissals must retain the alert");
  assert.equal(card.children[2].disabled, false);
  fail = false;
  await card.children[2].fire("click"); await settle();
  assert.equal(cards.children.length, 0);
  assert.ok(requests.some(message => message.type === "sidekick-check-notifications"));
}

(async () => {
  await testLayout(false); await testLayout(true); await testAlert();
  console.log("PASS: hide/show, detached landing state, return controls, alert content, persistent cards, and dismissal error recovery.");
})().catch(error => { console.error(error); process.exitCode = 1; });
