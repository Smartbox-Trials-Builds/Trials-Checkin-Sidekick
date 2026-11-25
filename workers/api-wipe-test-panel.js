(() => {
  const el = id => document.getElementById(`apiWipe${id}`);
  const LIST_KEY = "sidekickApiWipeTestList";
  const status = el("Status");
  let devices = [], job = null, batch = null, profiles = null, groups = null, syncs = null, groupCatalog = [], busy = false;
  let groupNameCounts = new Map();
  let pendingScans = 0, scanQueue = Promise.resolve();
  const stickerNotices = [];
  let stickerDialogOpen = false;
  const STICKER_WORKBOOK_URL = "https://smartboxassistivetnam.sharepoint.com/:x:/r/sites/TrialsSharePoint.us/_layouts/15/Doc.aspx?sourcedoc=%7B0EA98517-551F-426A-BFB3-8EB6A8125B17%7D&file=Missing%20DTP%20Stickers.xlsx&action=default&mobileredirect=true&wdwpf=doclib-c";
  const categories = { "Talkpad 10": "Wego TalkPad 10", "Talkpad 8": "Wego TalkPad 8", "Wego 13": "Wego 13a", "Wego 5": "Wego 5a" };
  const categoryFromAudit = value => {
    const aliases = { "Wego 10s": "Talkpad 10", "Wego 7": "Talkpad 8" };
    return Object.keys(categories).find(key => key === value || categories[key] === value) || (Object.hasOwn(aliases, value) ? aliases[value] : "");
  };
  const activeProfiles = () => profiles && !["complete", "stopped"].includes(profiles.stage);
  const activeGroups = () => groups && !["complete", "stopped"].includes(groups.stage);
  const activeSync = () => syncs && !["complete", "stopped"].includes(syncs.stage);
  const activeBatch = () => batch && !["complete", "stopped"].includes(batch.stage);
  const focusScan = () => { if (!stickerDialogOpen && !el("Scan").disabled && document.getElementById("apiWipeTestView").style.display !== "none") el("Scan").focus({ preventScroll: true }); };
  const batchLabels = {
    removing: "Removing apps", revoking: "Revoking licenses", wiping: "Sending wipes", deleting: "Deleting Entra records",
    awaitApps: "Confirm app removal", awaitWipe: "Approve wipes", awaitOutcome: "Confirm wipe outcomes", awaitDelete: "Approve Entra deletion",
    complete: "Complete", stopped: "Stopped", queued: "Waiting", ready: "Verified", appsConfirmed: "Apps removed", readyWipe: "Ready for wipe",
    wipeApproved: "Wipe approved", wipeSent: "Wipe sent", wiped: "Wipe confirmed", deleteApproved: "Deletion approved", deleted: "Deletion verified",
    deletePending: "Deletion awaiting verification", manualDelete: "Delete manually", manual: "Manual completion needed", failed: "Needs attention"
  };
  const stages = {
    preview: "Preview only. No device actions have been sent.",
    removalRequested: "App removal requested. Verify the selected apps have finished removing before revoking licenses.",
    removalSkipped: "No apps selected for removal. Continue to revoke this device's Apple VPP licenses.",
    licensesRequested: "License revocation requested. Check completion in Intune before approving the wipe.",
    wipeRequested: "Wipe request sent. Confirm on the device whether the factory reset actually happened.",
    wipeConfirmed: "Wipe confirmed. Choose whether to delete the linked device record from Entra.",
    entraDeleted: "The linked device record was deleted from Entra.",
    entraDeletePending: "Microsoft accepted deletion. Check device status to verify whether the Entra record is gone.",
    uncertain: "The last action may have been sent. Check Intune and complete manually; this tool will not repeat it."
  };
  const save = () => chrome.storage.session.set({ [LIST_KEY]: devices });
  async function send(action, extra = {}) {
    const result = await chrome.runtime.sendMessage({ type: "sidekick-api-wipe-test", action, nonce: job?.nonce, serial: job?.serial, batchNonce: batch?.nonce, profileNonce: profiles?.nonce, groupNonce: groups?.nonce, syncNonce: syncs?.nonce, ...extra });
    if (!result?.ok) {
      if (result?.missingSerial) {
        const device = devices.find(item => String(item.serial).trim().toUpperCase() === result.missingSerial);
        if (device) { device.manualWipeWarning = true; device.manualWipeCheckAt = Date.now(); await save(); }
      }
      throw new Error(result?.error || "Device Sidekick (new) unavailable. Reload Sidekick.");
    }
    job = result.job;
    if (Object.hasOwn(result, "batch")) batch = result.batch;
    if (Object.hasOwn(result, "profiles")) profiles = result.profiles;
    if (Object.hasOwn(result, "groups")) groups = result.groups;
    if (Object.hasOwn(result, "syncs")) syncs = result.syncs;
    if (Object.hasOwn(result, "groupCatalog")) {
      groupCatalog = result.groupCatalog;
      groupNameCounts = new Map();
      for (const group of groupCatalog) groupNameCounts.set(group.displayName, (groupNameCounts.get(group.displayName) || 0) + 1);
    }
    await updateMissingWarnings();
    return result;
  }
  async function updateMissingWarnings() {
    let changed = false;
    const sources = [batch, profiles, groups, syncs].filter(Boolean).sort((a, b) => a.createdAt - b.createdAt);
    if (job) sources.push({ createdAt: job.createdAt, items: [{ serial: job.serial, device: job.device }] });
    for (const source of sources) for (const item of source.items) {
      const device = devices.find(entry => String(entry.serial).trim().toUpperCase() === item.serial);
      if (!device || source.createdAt < (device.manualWipeCheckAt || 0)) continue;
      const missing = item.missingDevice || /No Intune device has this exact internal serial number|No exact Intune serial match/.test(item.error || "");
      if (!missing && !item.device && !item.job?.device) continue;
      if (Boolean(device.manualWipeWarning) !== Boolean(missing)) changed = true;
      device.manualWipeWarning = Boolean(missing); device.manualWipeCheckAt = source.createdAt;
    }
    if (changed) await save();
  }
  function fillGroups(select, search, selectedId = "", savedName = "", lazy = false) {
    const needle = String(search || "").trim().toLowerCase();
    const matching = lazy ? [] : groupCatalog.filter(group => String(group.displayName || "").toLowerCase().includes(needle) || group.id.toLowerCase().includes(needle));
    const selected = groupCatalog.find(group => group.id === selectedId);
    if (selected && !matching.includes(selected)) matching.unshift(selected);
    select.replaceChildren();
    const empty = document.createElement("option"); empty.value = ""; empty.textContent = groupCatalog.length ? "Choose group" : "Load groups first"; select.append(empty);
    if (selectedId && !selected) { const option = document.createElement("option"); option.value = selectedId; option.textContent = savedName || "Saved group — refresh to verify"; select.append(option); }
    for (const group of matching) {
      const option = document.createElement("option"); option.value = group.id;
      const duplicateName = groupNameCounts.get(group.displayName) > 1;
      option.textContent = `${group.displayName || "Unnamed group"}${duplicateName ? ` (${group.id.slice(-8)})` : ""}${group.unavailable ? ` — ${group.unavailable}` : ""}`;
      option.disabled = Boolean(group.unavailable); select.append(option);
    }
    select.value = selectedId;
  }
  function ask(title, message, yes = "Yes", no = "No", items = null) {
    return new Promise(resolve => {
      const dialog = document.createElement("dialog");
      dialog.className = "prep-assignment-dialog";
      const heading = document.createElement("h2"); heading.textContent = title;
      const text = document.createElement("p"); text.textContent = message;
      const list = document.createElement("div"); list.className = "api-wipe-group-list";
      const choices = [];
      for (const item of items || []) {
        const label = document.createElement("label"); label.className = "checkbox-row";
        const input = document.createElement("input"); input.type = "checkbox"; input.checked = true; input.value = item.serial;
        const name = document.createElement("span"); name.textContent = `${item.device?.deviceName || item.job?.device.deviceName || "Device"} · ${item.serial}${item.targetName ? ` → ${item.targetName}` : ""}`;
        choices.push(input); label.append(input, name); list.append(label);
      }
      const actions = document.createElement("div"); actions.className = "queue-actions";
      const decline = document.createElement("button"); decline.textContent = no; decline.type = "button"; decline.hidden = no === null;
      const approve = document.createElement("button"); approve.textContent = yes; approve.type = "button";
      for (const button of [decline, approve]) button.className = "toggle-btn";
      const finish = value => { dialog.remove(); resolve(items ? { confirmed: value, serials: choices.filter(input => input.checked).map(input => input.value) } : value); };
      decline.addEventListener("click", () => finish(false));
      approve.addEventListener("click", () => finish(true));
      dialog.addEventListener("cancel", event => { event.preventDefault(); finish(false); });
      actions.append(decline, approve); dialog.append(heading, text, list, actions); document.body.append(dialog);
      dialog.showModal(); (no === null ? approve : decline).focus();
    });
  }
  function render() {
    const operationLocked = busy || Boolean(job) || Boolean(activeBatch()) || Boolean(activeProfiles()) || Boolean(activeGroups()) || Boolean(activeSync());
    const locked = operationLocked || pendingScans > 0;
    const rows = el("Rows"); rows.replaceChildren();
    for (const device of devices) {
      const row = document.createElement("tr");
      if (device.manualWipeWarning) { row.className = "api-manual-wipe-warning"; row.title = "Device not found in Intune. Verify whether a manual wipe is needed."; }
      const number = document.createElement("td");
      const deviceNumber = document.createElement("input"); deviceNumber.type = "text"; deviceNumber.value = device.number || ""; deviceNumber.disabled = locked;
      deviceNumber.setAttribute("aria-label", `Scanned device number for ${device.serial || "device"}`);
      deviceNumber.addEventListener("change", () => { device.number = deviceNumber.value.trim().toUpperCase(); device.gipodCode = ""; void save(); render(); });
      number.append(deviceNumber);
      const serialCell = document.createElement("td");
      const serial = document.createElement("input"); serial.type = "text"; serial.value = device.serial;
      serial.setAttribute("aria-label", `Internal serial for ${device.number || device.serial || "device"}`);
      serial.disabled = locked;
      serial.addEventListener("change", () => {
        const value = serial.value.trim().toUpperCase();
        if (value !== device.serial) { device.serial = value; device.gipodCode = ""; device.profileAdded = false; device.wiped = false; device.groupAdded = false; device.manualWipeWarning = false; device.manualWipeCheckAt = 0; device.lastProfileBatch = null; device.lastWipeBatch = null; }
        void save(); render();
      });
      serialCell.append(serial);
      const categoryCell = document.createElement("td");
      const category = document.createElement("select"); category.disabled = locked;
      category.setAttribute("aria-label", `Device category for ${device.number || device.serial}`);
      for (const name of ["", ...Object.keys(categories)]) { const option = document.createElement("option"); option.value = name; option.textContent = name || "Choose category"; category.append(option); }
      category.value = device.category || "";
      category.addEventListener("change", () => { device.category = category.value; device.profileAdded = false; void save(); render(); });
      categoryCell.append(category);
      const wipedCell = document.createElement("td");
      const wiped = document.createElement("input"); wiped.type = "checkbox"; wiped.checked = device.wiped;
      wiped.setAttribute("aria-label", `Wiped ${device.number || device.serial}`); wiped.disabled = locked;
      wiped.addEventListener("change", () => { device.wiped = wiped.checked; if (device.wiped) { device.manualWipeWarning = false; device.manualWipeCheckAt = Date.now(); } void save(); render(); }); wipedCell.append(wiped);
      const profileCell = document.createElement("td");
      const profileAdded = document.createElement("input"); profileAdded.type = "checkbox"; profileAdded.checked = Boolean(device.profileAdded); profileAdded.disabled = locked;
      profileAdded.setAttribute("aria-label", `Profile added ${device.number || device.serial}`);
      profileAdded.addEventListener("change", () => { device.profileAdded = profileAdded.checked; void save(); render(); }); profileCell.append(profileAdded);
      const codeCell = document.createElement("td");
      const code = document.createElement("input"); code.type = "text"; code.className = "api-gipod-code"; code.value = device.gipodCode || ""; code.placeholder = "GIPOD code"; code.disabled = locked;
      code.setAttribute("aria-label", `GIPOD code for ${device.number || device.serial}`);
      code.addEventListener("change", () => { device.gipodCode = code.value.trim().toUpperCase(); code.value = device.gipodCode; void save(); }); codeCell.append(code);
      const noteCell = document.createElement("td");
      const note = document.createElement("button"); note.type = "button"; note.className = "toggle-btn"; note.textContent = "Dashboard Note"; note.disabled = busy || pendingScans > 0;
      note.addEventListener("click", () => void run(async () => {
        if (!devices.includes(device) || !String(device.number || "").trim()) throw new Error("Add the scanned device number before copying its Dashboard Note.");
        const value = String(device.gipodCode || "").trim().toUpperCase();
        if (!/^GIPOD-\d{4}-\d{4}-\d{4}$/.test(value)) throw new Error("Import or enter a valid GIPOD code before copying the Dashboard Note.");
        try { await navigator.clipboard.writeText(`${device.number.trim()}\n${value}`); }
        catch { throw new Error("Could not copy the Dashboard Note. Please try again."); }
        status.textContent = `Dashboard Note copied for ${device.number}.`;
      })); noteCell.append(note);
      const groupCell = document.createElement("td");
      const picker = document.createElement("div"); picker.className = "api-group-picker";
      const groupSearch = document.createElement("input"); groupSearch.type = "search"; groupSearch.placeholder = "Search groups"; groupSearch.value = device.groupSearch || ""; groupSearch.disabled = locked;
      groupSearch.setAttribute("aria-label", `Search groups for ${device.number || device.serial}`);
      const groupSelect = document.createElement("select"); groupSelect.disabled = locked; groupSelect.setAttribute("aria-label", `Group for ${device.number || device.serial}`);
      fillGroups(groupSelect, groupSearch.value, device.groupId, device.groupName, true);
      groupSelect.addEventListener("focus", () => fillGroups(groupSelect, groupSearch.value, device.groupId, device.groupName));
      groupSearch.addEventListener("input", () => { device.groupSearch = groupSearch.value; fillGroups(groupSelect, groupSearch.value, device.groupId, device.groupName); });
      groupSelect.addEventListener("change", () => { device.groupId = groupSelect.value; device.groupName = groupCatalog.find(group => group.id === device.groupId)?.displayName || ""; device.groupAdded = false; void save(); render(); });
      picker.append(groupSearch, groupSelect); groupCell.append(picker);
      const syncCell = document.createElement("td");
      const sync = document.createElement("button"); sync.type = "button"; sync.className = "toggle-btn"; sync.textContent = "Sync"; sync.disabled = busy || pendingScans > 0 || Boolean(activeSync()) || !device.serial;
      sync.setAttribute("aria-label", `Sync ${device.number || device.serial}`);
      sync.addEventListener("click", () => void run(() => beginSync([device.serial], false))); syncCell.append(sync);
      const removeCell = document.createElement("td");
      const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "Remove"; remove.className = "toggle-btn"; remove.disabled = locked;
      remove.addEventListener("click", () => { devices = devices.filter(item => item !== device); void save(); render(); }); removeCell.append(remove);
      row.append(number, serialCell, categoryCell, wipedCell, profileCell, codeCell, noteCell, groupCell, syncCell, removeCell); rows.append(row);
    }
    el("Review").hidden = !job && !batch;
    for (const name of ["Disconnect", "Clear", "Mode", "InternalOnly", "GipodImport"]) el(name).disabled = locked;
    el("Scan").disabled = operationLocked;
    el("AddForm").querySelector("button").disabled = operationLocked;
    el("Begin").disabled = locked || !devices.some(device => !device.wiped && device.serial);
    el("ProfilesBegin").disabled = locked || !devices.some(device => !device.profileAdded && device.serial);
    for (const name of ["GroupsLoad", "GroupsSearch", "GroupsSelect", "GroupsApply"]) el(name).disabled = locked;
    el("GroupsBegin").disabled = busy || pendingScans > 0 || !devices.length;
    fillGroups(el("GroupsSelect"), el("GroupsSearch").value, el("GroupsSelect").value);
    el("LoanSearch").disabled = busy || pendingScans > 0;
    renderProfiles();
    renderGroups();
    renderSyncs();
    el("SyncAll").disabled = busy || pendingScans > 0 || Boolean(activeSync()) || !devices.some(device => device.serial);
    el("Prepare").hidden = job ? job.stage === "uncertain" : !activeBatch();
    el("Stop").hidden = !job && !activeBatch();
    el("Prepare").textContent = "Continue workflow";
    for (const name of ["Prepare", "Connect", "Check", "Stop"]) el(name).disabled = busy || pendingScans > 0;
    el("Scan").previousElementSibling.textContent = el("InternalOnly").checked ? "Internal serial number" : "Scan device number";
    el("BulkResults").hidden = !batch || Boolean(job);
    const results = el("BulkRows"); results.replaceChildren();
    for (const item of !job && batch?.items || []) {
      const row = document.createElement("tr");
      if (item.missingDevice || /No Intune device has this exact internal serial number/.test(item.error || "")) row.className = "api-manual-wipe-warning";
      for (const value of [item.serial, batchLabels[item.status] || item.status, item.error || item.job?.deletionStatus || ""]) {
        const cell = document.createElement("td"); cell.textContent = value; row.append(cell);
      }
      results.append(row);
    }
    el("Check").textContent = !job && batch ? "Check bulk deletion status" : "Check device status";
    if (!job && batch) {
      el("Device").textContent = `Bulk operation · ${batch.items.length} device(s)`;
      el("Progress").textContent = `${batchLabels[batch.stage] || batch.stage}. Each device's result is listed below.`;
      el("Apps").replaceChildren();
    }
    if (!job) return;
    el("Device").textContent = `${job.device.deviceName} · ${job.serial} · ${job.device.operatingSystem} · Last sync: ${job.device.lastSyncDateTime ? new Date(job.device.lastSyncDateTime).toLocaleString() : "unknown"}`;
    el("Progress").textContent = `${stages[job.stage] || job.stage}${job.error ? ` ${job.error}` : ""}${job.deletionStatus ? ` ${job.deletionStatus}` : ""}`;
    const apps = el("Apps");
    apps.replaceChildren(); apps.dataset.nonce = job.nonce;
    for (const app of job.apps) {
      const label = document.createElement("label"); label.className = "checkbox-row";
      const input = document.createElement("input"); input.type = "checkbox"; input.value = app.id;
      input.checked = job.stage === "preview" || job.selected.includes(app.id);
      input.disabled = true;
      const text = document.createElement("span"); text.textContent = `${app.name}${app.token ? ` (${app.token})` : ""}`;
      label.append(input, text); apps.append(label);
    }
    if (!job.apps.length) apps.textContent = "No matching AAC apps found in the Intune app catalog. You can continue without requesting app removal.";
  }
  async function run(work) {
    if (busy || pendingScans || stickerDialogOpen) return;
    busy = true; render();
    try {
      if (!(await hasDeviceSystemsRole())) throw new Error("Device Sidekick (new) is available to Device Systems Coordinators.");
      await work();
    } catch (error) {
      status.textContent = error.message;
      try { await send("state"); } catch { /* Retain the last known job if the connection is unavailable. */ }
    } finally { busy = false; render(); void showStickerNotices(); }
  }
  async function openTool() {
    showView("apiWipeTestView");
    devices = (await chrome.storage.session.get(LIST_KEY))[LIST_KEY] || [];
    await send("state");
    await markBatchWiped();
    await markProfilesAdded();
    await markGroupsAdded();
      status.textContent = job || activeBatch() || activeProfiles() || activeGroups() || activeSync() ? "Resumed the current operation. Use its Continue button when ready; no action was repeated." : "Begin verifies the device and automatically requests removal of matching AAC apps. Bulk processes all unfinished devices with group confirmations.";
  }
  const launcher = document.getElementById("apiWipeTestBtn");
  launcher?.addEventListener("click", () => {
    if (globalThis.sidekickNewDeviceWindow) { void run(openTool).then(focusScan); return; }
    void (async () => {
      try {
        if (!(await hasDeviceSystemsRole())) throw new Error("Device Sidekick is available to Device Systems Coordinators.");
        const result = await chrome.runtime.sendMessage({ type: "sidekick-open-new-device" });
        if (!result?.ok) throw new Error(result?.error || "Could not open Device Sidekick (new).");
      } catch (error) { alert(error.message); }
    })();
  });
  if (globalThis.sidekickNewDeviceWindow && !launcher) void run(openTool).then(focusScan);
  el("Connect").addEventListener("click", () => void run(async () => {
    status.textContent = "Signing in to Microsoft for wiping, profiles and Entra deletion…";
    await send("connect");
    await send("groups-list"); status.textContent = "Connected for wiping, profiles, groups and Entra deletion.";
  }));
  el("Disconnect").addEventListener("click", () => void run(async () => { await send("disconnect"); status.textContent = "Microsoft account disconnected."; }));
  el("InternalOnly").addEventListener("change", render);
  el("AddForm").addEventListener("submit", event => {
    event.preventDefault(); if (busy || job || activeBatch() || activeProfiles() || activeGroups() || activeSync()) return;
    const raw = el("Scan").value.trim();
    if (!raw) { focusScan(); return; }
    const internalOnly = el("InternalOnly").checked;
    el("Scan").value = "";
    pendingScans++; render(); focusScan();
    scanQueue = scanQueue.then(async () => {
      if (!(await hasDeviceSystemsRole())) throw new Error("Device Sidekick is available to Device Systems Coordinators.");
      let number = "", serial = "", category = "";
      if (internalOnly) {
        serial = raw.toUpperCase();
        if (!/^[A-Z0-9-]{5,40}$/.test(serial)) throw new Error("Enter a valid internal serial number.");
      } else {
        number = extractValidSerial(raw);
        if (!number) throw new Error("Device number not recognized. Check the scan or use internal serial numbers only.");
        status.textContent = "Looking up the internal serial in Audit…";
        const result = await chrome.runtime.sendMessage({ type: "sidekick-audit-lookup", device: number });
        serial = result?.ok && !result.ambiguous ? String(result.internalSerial || "").trim().toUpperCase() : "";
        if (result?.ok && !result.categoryAmbiguous) category = categoryFromAudit(result.category);
      }
      if (devices.some(device => number && device.number === number || serial && device.serial === serial)) throw new Error("This device is already in the test list.");
      const group = groupCatalog.find(item => item.id === el("GroupsSelect").value && !item.unavailable);
      const device = { number, serial, category, gipodCode: "", wiped: false, profileAdded: false, groupId: group?.id || "", groupName: group?.displayName || "", groupAdded: false };
      devices.push(device); await save();
      if (number) void checkSticker(device, number);
      status.textContent = serial ? `Added ${number || serial}.` : `Added ${number}. Enter its internal serial in the row before beginning.`;
    }).catch(error => { status.textContent = `${raw}: ${error.message}`; })
      .finally(() => { pendingScans--; render(); focusScan(); void showStickerNotices(); });
  });
  async function checkSticker(row, number) {
    const stillListed = () => devices.includes(row) && row.number === number;
    try {
      const result = await chrome.runtime.sendMessage({ type: "sidekick-sticker-lookup", device: number });
      if (!stillListed() || !(await hasDeviceSystemsRole())) return;
      if (!result?.ok) throw new Error(result?.error || "Sticker check unavailable. Check Missing DTP Stickers.xlsx manually.");
      if (!result.matches?.length) return;
      stickerNotices.push({ row, number, matches: result.matches });
      void showStickerNotices();
    } catch (error) {
      if (stillListed()) { el("StickerStatus").textContent = `${number}: ${error.message}`; el("StickerLink").hidden = false; }
    }
  }
  async function showStickerNotices() {
    if (stickerDialogOpen || busy || pendingScans || !stickerNotices.length) return;
    stickerDialogOpen = true;
    try {
      while (stickerNotices.length && !busy && !pendingScans) {
        const notice = stickerNotices.shift();
        const stillListed = () => devices.includes(notice.row) && notice.row.number === notice.number;
        if (!stillListed() || !(await hasDeviceSystemsRole()) || !stillListed()) continue;
        if (busy || pendingScans) { stickerNotices.unshift(notice); break; }
        const locations = notice.matches.map(match => `${match.sheet}, row ${match.row} (${match.cell})`).join("; ");
        const message = `${notice.number}: Replace the Serial Number sticker. Found in Missing DTP Stickers.xlsx: ${locations}.`;
        el("StickerStatus").textContent = message; el("StickerLink").hidden = false;
        let tabMessage = "The sticker workbook opened in a new tab.";
        try { await chrome.tabs.create({ url: STICKER_WORKBOOK_URL, active: false }); }
        catch { tabMessage = "Could not open the workbook automatically. Use Open Missing DTP Stickers below the device list."; }
        await ask("Replace Serial Number sticker", `${message}\n${tabMessage}`, "Close", null);
      }
    } catch (error) { el("StickerStatus").textContent = `Sticker notification unavailable: ${error.message}`; }
    finally { stickerDialogOpen = false; focusScan(); }
  }
  el("Clear").addEventListener("click", () => void run(async () => { if (job) return; devices = []; stickerNotices.length = 0; el("StickerStatus").textContent = ""; el("StickerLink").hidden = true; await save(); status.textContent = "Device list cleared."; }));
  async function beginNext() {
    const next = devices.find(device => !device.wiped && device.serial);
    if (!next) throw new Error("Add an unfinished device with an internal serial first.");
    status.textContent = `Finding the exact Intune device for ${next.serial}…`;
    await send("preview", { serial: next.serial }); render();
  }
  async function markWiped() {
    const device = devices.find(item => item.serial === job.serial);
    if (device) device.wiped = true;
    await save();
  }
  async function closeAndNext(deleted) {
    const serial = job.serial;
    await send("close", { confirmed: true });
    const next = devices.some(item => !item.wiped && item.serial);
    status.textContent = `${serial} wiped. ${deleted ? "Device record deleted from Entra." : "Delete its device record from Entra manually."}`;
    if (next) {
      const proceed = await ask(deleted ? "Device complete" : "Delete the wiped device", `${deleted ? `${serial} was deleted from Entra.` : `Delete ${serial} from Entra's All devices list manually.`} Click Next device when ready to begin the next unfinished device.`, "Next device", "Close");
      if (proceed) { await beginNext(); return true; }
    } else {
      await ask("Device complete", `${deleted ? `${serial} was deleted from Entra.` : `Remember to delete ${serial} from Entra's All devices list manually.`} No more test devices remain.`, "Close", null);
    }
    return false;
  }
  async function automate() {
    while (job) {
      render();
      const identity = `${job.device.deviceName} · ${job.serial}`;
      if (job.stage === "preview") {
        const appIds = job.apps.map(app => app.id);
        status.textContent = "Requesting removal of the matching AAC apps…";
        await send("remove", { appIds, confirmed: true });
      } else if (["removalRequested", "removalSkipped"].includes(job.stage)) {
        const removed = await ask("Were the AAC apps removed?", `${identity}\n${job.stage === "removalRequested" ? "Confirm the apps finished removing on the device." : "No apps were selected for removal. Confirm no AAC apps still need removing."} Yes continues by revoking all Apple VPP licenses for this device. No stops for manual completion.`);
        if (!removed) { await send("stop"); status.textContent = "Stopped. Remove the apps and complete the wipe manually; mark Wiped when finished."; return; }
        status.textContent = "Revoking the device's Apple VPP licenses…";
        await send("revoke", { confirmed: true });
      } else if (job.stage === "licensesRequested") {
        if (!(await ask("Continue to wipe?", `${identity}\nLicense revocation was requested. This factory resets the device and erases device data and cellular data plans.`, "Yes — wipe device", "No"))) {
          await send("stop"); status.textContent = "Wipe cancelled. Earlier app removal and license revocation requests remain active. Complete manually if needed."; return;
        }
        status.textContent = "Sending the approved wipe request…";
        await send("wipe", { confirmed: true });
      } else if (job.stage === "wipeRequested") {
        if (!(await ask("Did the wipe go through?", `${identity}\nChoose Yes only after verifying the device reset. No stops for manual completion.`))) {
          await send("stop"); status.textContent = "Stopped. Complete the wipe manually, then mark the row Wiped."; return;
        }
        await send("finish", { confirmed: true }); await markWiped();
      } else if (job.stage === "wipeConfirmed") {
        await markWiped();
        const deleteIt = await ask("Delete device from Entra?", `${identity}\nThe wipe is confirmed. Delete this device's linked record from Entra's All devices list? This removes the Entra record only; it does not separately delete the Intune management record.`, "Delete from Entra", "Delete manually");
        if (deleteIt) {
          status.textContent = "Connecting Entra deletion if needed…";
          await send("ensure-delete");
          status.textContent = "Verifying the linked Entra device and deleting its record…";
          await send("delete-entra", { confirmed: true });
          if (job.stage === "entraDeletePending") { status.textContent = job.deletionStatus; return; }
        } else if (!(await closeAndNext(false))) return;
      } else if (job.stage === "entraDeleted") {
        if (!(await closeAndNext(true))) return;
      } else return;
    }
  }
  async function markBatchWiped() {
    let changed = false;
    for (const item of batch?.items || []) {
      if (!item.wiped) continue;
      const device = devices.find(entry => entry.serial === item.serial);
      if (device && !device.wiped && device.lastWipeBatch !== batch.nonce) { device.wiped = true; device.lastWipeBatch = batch.nonce; changed = true; }
    }
    if (changed) await save();
  }
  async function automateBulk() {
    render();
    while (activeBatch()) {
      render();
      if (["removing", "revoking", "wiping", "deleting"].includes(batch.stage)) {
        status.textContent = `${batchLabels[batch.stage]}: processing the next eligible device…`;
        await send("bulk-step");
        continue;
      }
      const steps = {
        awaitApps: { status: "awaitApps", title: "Were the apps removed on these devices?", text: "Confirm all devices below, or uncheck devices that still need manual app removal. Confirming automatically revokes all Apple VPP licenses for the selected devices.", action: "bulk-apps", yes: "Apps removed — continue" },
        awaitWipe: { status: "readyWipe", title: "Wipe these devices?", text: "License revocation was requested. This factory resets every checked device and erases device data and cellular data plans. Uncheck any device you do not want to wipe.", action: "bulk-wipe", yes: "Wipe selected devices" },
        awaitOutcome: { status: "wipeSent", title: "Did the wipes go through?", text: "Leave checked only devices you have verified actually reset. Uncheck any that failed or need manual completion. Only checked devices will be marked wiped and offered for deletion.", action: "bulk-outcome", yes: "Confirm wiped devices" },
        awaitDelete: { status: "wiped", title: "Delete these devices from Entra?", text: "Delete the linked Entra records for the checked, confirmed-wiped devices. This does not separately delete their Intune management records. Unchecked devices can be deleted manually.", action: "bulk-delete", yes: "Delete selected from Entra" }
      };
      const step = steps[batch.stage];
      if (!step) return;
      const items = batch.items.filter(item => item.status === step.status);
      const decision = await ask(step.title, step.text, step.yes, step.action === "bulk-delete" ? "Delete manually" : "Stop", items);
      if (!decision.confirmed) {
        if (step.action === "bulk-delete") await send("bulk-delete", { selectedSerials: [], confirmed: true });
        else { await send("bulk-stop"); status.textContent = "Bulk operation stopped. Submitted actions remain active; complete unfinished devices manually."; return; }
      } else {
        if (step.action === "bulk-delete" && decision.serials.length) {
          status.textContent = "Connecting Entra deletion if needed…";
          await send("ensure-delete");
        }
        await send(step.action, { selectedSerials: decision.serials, confirmed: true });
        await markBatchWiped();
      }
    }
    if (batch?.stage === "complete") {
      const count = statusName => batch.items.filter(item => item.status === statusName).length;
      const summary = `${batch.items.filter(item => item.wiped).length} confirmed wiped; ${count("deleted")} verified deleted from Entra; ${count("deletePending")} deletion(s) awaiting verification; ${count("failed")} failed. Review individual results for manual work.`;
      status.textContent = summary;
      await ask("Bulk operation complete", summary, "Close", null);
    }
  }
  el("Begin").addEventListener("click", () => void run(async () => {
    if (el("Mode").value === "single") { await beginNext(); await automate(); return; }
    const unfinished = devices.filter(device => !device.wiped);
    if (unfinished.some(device => !device.serial)) throw new Error("Fill in every unfinished device's internal serial before starting bulk wipe.");
    status.textContent = "Verifying the bulk device list…";
    await send("bulk-start", { serials: unfinished.map(device => device.serial) });
    await automateBulk();
  }));
  el("Prepare").addEventListener("click", () => void run(() => activeBatch() ? automateBulk() : automate()));
  el("Check").addEventListener("click", () => void run(async () => {
    if (!job && batch) {
      const pending = batch.items.filter(item => item.job?.entraTarget && item.status !== "deleted");
      for (const item of pending) await send("bulk-status", { itemSerial: item.serial });
      status.textContent = pending.length ? "Bulk Entra deletion status updated. Review each device's result." : "No pending Entra deletions to check.";
      return;
    }
    const result = await send("status");
    if (result.entraStatus) { status.textContent = result.entraStatus; return; }
    const device = result.deviceStatus;
    status.textContent = `Intune state: ${device.managementState || "unknown"}. ${device.deviceActionResults?.map(action => `${action.actionName}: ${action.actionState}`).join("; ") || "No action status was returned."} A sent request does not confirm completion.`;
  }));
  el("Stop").addEventListener("click", () => void run(async () => {
    if (!(await ask("Stop this test?", "Any actions already sent will continue in Intune. Check the device and finish manually before starting it again.", "Stop", "Keep testing"))) return;
    await send(activeBatch() ? "bulk-stop" : "stop"); status.textContent = "Test stopped. Any submitted actions remain active. Complete manually and mark Wiped when finished.";
  }));
  function renderProfiles() {
    el("ProfilesReview").hidden = !profiles;
    el("ProfilesContinue").hidden = !activeProfiles();
    el("ProfilesStop").hidden = !activeProfiles();
    for (const name of ["ProfilesContinue", "ProfilesStop", "ProfilesCheck"]) el(name).disabled = busy || pendingScans > 0;
    const rows = el("ProfilesRows"); rows.replaceChildren();
    const labels = { ready: "Ready", queued: "Waiting", added: "Profile added", pending: "Awaiting verification", uncertain: "Check manually", failed: "Needs attention", skipped: "Skipped" };
    for (const item of profiles?.items || []) {
      const row = document.createElement("tr");
      if (item.missingDevice) row.className = "api-manual-wipe-warning";
      for (const value of [item.serial, item.targetName, labels[item.status] || item.status, item.error || ""]) {
        const cell = document.createElement("td"); cell.textContent = value; row.append(cell);
      }
      rows.append(row);
    }
    if (profiles) el("ProfilesProgress").textContent = `${profiles.items.filter(item => item.status === "added").length} of ${profiles.items.length} profiles verified. ${profiles.stage === "review" ? "Ready for group confirmation." : profiles.stage === "running" ? "Applying device categories…" : profiles.stage === "stopped" ? "Stopped." : "Review results below."}`;
  }
  async function markProfilesAdded() {
    let changed = false;
    for (const item of profiles?.items || []) {
      if (item.status !== "added") continue;
      const device = devices.find(entry => entry.serial === item.serial && entry.category === item.category);
      if (device && !device.profileAdded && device.lastProfileBatch !== profiles.nonce) {
        device.profileAdded = true; device.lastProfileBatch = profiles.nonce; changed = true;
      }
    }
    if (changed) await save();
  }
  async function automateProfiles() {
    render();
    if (profiles?.stage === "review") {
      const decision = await ask("Add profiles to these devices?", "Confirm the device categories shown below. Uncheck any devices you want to skip.", "Add selected profiles", "Cancel", profiles.items.filter(item => item.status === "ready"));
      if (!decision.confirmed) { await send("profiles-stop"); status.textContent = "Profile assignment cancelled. No categories were changed."; return; }
      await send("profiles-approve", { selectedSerials: decision.serials, confirmed: true });
    }
    while (profiles?.stage === "running") {
      status.textContent = "Applying and verifying device categories…";
      await send("profiles-step"); await markProfilesAdded(); render();
    }
    if (profiles?.stage === "complete") {
      const added = profiles.items.filter(item => item.status === "added").length;
      status.textContent = `Profiles complete: ${added} verified; ${profiles.items.length - added} skipped, pending or needing attention. Review the profile results.`;
      await ask("Bulk profiles complete", status.textContent, "Close", null);
    }
  }
  el("ProfilesBegin").addEventListener("click", () => void run(async () => {
    const pending = devices.filter(device => !device.profileAdded);
    if (pending.some(device => !device.serial || !Object.hasOwn(categories, device.category))) throw new Error("Enter an internal serial and select a category for every unfinished profile.");
    status.textContent = "Verifying devices and category mappings…";
    await send("profiles-start", { devices: pending.map(device => ({ serial: device.serial, category: device.category })) });
    await automateProfiles();
  }));
  el("ProfilesContinue").addEventListener("click", () => void run(automateProfiles));
  el("ProfilesCheck").addEventListener("click", () => void run(async () => {
    for (const item of profiles?.items.filter(entry => ["pending", "uncertain"].includes(entry.status)) || []) await send("profiles-check", { itemSerial: item.serial });
    await markProfilesAdded(); status.textContent = "Profile status updated. Only verified categories are marked Profile added.";
  }));
  el("ProfilesStop").addEventListener("click", () => void run(async () => {
    await send("profiles-stop"); status.textContent = "Profile operation stopped. Updates already submitted remain active.";
  }));
  el("GipodImport").addEventListener("click", () => void run(async () => {
    if (!devices.length) throw new Error("Add devices before importing GIPOD codes.");
    const snapshot = devices.map(device => ({ device, number: device.number, serial: device.serial }));
    const text = await new Promise(resolve => {
      const dialog = document.createElement("dialog"); dialog.className = "prep-assignment-dialog device-gipod-import-dialog";
      const title = document.createElement("h2"); title.textContent = "Bulk import GIPOD codes";
      const hint = document.createElement("p"); hint.textContent = `Paste exactly ${snapshot.length} codes, one per device in the list order below. This replaces existing codes.`;
      const order = document.createElement("ol");
      snapshot.forEach(entry => { const item = document.createElement("li"); item.textContent = entry.number || entry.serial; order.append(item); });
      const input = document.createElement("textarea"); input.rows = 7; input.placeholder = "GIPOD-1234-5678-9012"; input.setAttribute("aria-label", "GIPOD codes in device list order");
      const actions = document.createElement("div"); actions.className = "queue-actions";
      const cancel = document.createElement("button"); cancel.type = "button"; cancel.className = "toggle-btn"; cancel.textContent = "Cancel";
      const apply = document.createElement("button"); apply.type = "button"; apply.className = "toggle-btn"; apply.textContent = "Import codes";
      const finish = value => { dialog.remove(); resolve(value); };
      cancel.addEventListener("click", () => finish(null)); apply.addEventListener("click", () => finish(input.value));
      dialog.addEventListener("cancel", event => { event.preventDefault(); finish(null); });
      actions.append(cancel, apply); dialog.append(title, hint, order, input, actions); document.body.append(dialog); dialog.showModal(); input.focus();
    });
    if (text === null) return;
    if (devices.length !== snapshot.length || snapshot.some((entry, index) => devices[index] !== entry.device || devices[index].serial !== entry.serial || devices[index].number !== entry.number)) throw new Error("The device list changed. Start the GIPOD import again.");
    const codes = String(text).trim().toUpperCase().split(/[\s,;]+/).filter(Boolean);
    if (codes.length !== devices.length) throw new Error(`Paste exactly ${devices.length} GIPOD codes, one per device in list order.`);
    if (codes.some(code => !/^GIPOD-\d{4}-\d{4}-\d{4}$/.test(code))) throw new Error("Each code must use the format GIPOD-1234-5678-9012.");
    if (new Set(codes).size !== codes.length) throw new Error("The pasted list contains a duplicate GIPOD code.");
    devices.forEach((device, index) => { device.gipodCode = codes[index]; }); await save();
    status.textContent = `Imported ${codes.length} GIPOD codes in device list order. Use Dashboard Note beside each device to copy it.`;
  }));
  el("LoanSearch").addEventListener("click", () => void run(async () => {
    const serials = devices.map(device => String(device.serial || "").trim().toUpperCase()).filter(Boolean);
    if (!serials.length) throw new Error("Add an internal serial number before copying a loan library search.");
    try { await navigator.clipboard.writeText(serials.join(" OR ")); }
    catch { throw new Error("Could not copy the loan library search. Click Get Loan Library Search again."); }
    status.textContent = `Copied loan library search for ${serials.length} device${serials.length === 1 ? "" : "s"}. Paste it into SharePoint search.`;
  }));
  function renderGroups() {
    el("GroupsReview").hidden = !groups;
    el("GroupsContinue").hidden = !activeGroups(); el("GroupsStop").hidden = !activeGroups();
    for (const name of ["GroupsContinue", "GroupsStop", "GroupsCheck"]) el(name).disabled = busy || pendingScans > 0;
    const rows = el("GroupsRows"); rows.replaceChildren();
    const labels = { ready: "Ready", queued: "Waiting", added: "Group added", pending: "Awaiting verification", uncertain: "Check manually", failed: "Needs attention", skipped: "Skipped" };
    for (const item of groups?.items || []) {
      const row = document.createElement("tr"); if (item.missingDevice) row.className = "api-manual-wipe-warning";
      for (const value of [item.serial, item.targetName, labels[item.status] || item.status, item.error || ""]) { const cell = document.createElement("td"); cell.textContent = value; row.append(cell); }
      rows.append(row);
    }
    if (groups) el("GroupsProgress").textContent = `${groups.items.filter(item => item.status === "added").length} of ${groups.items.length} group additions verified. ${groups.stage === "review" ? "Ready for confirmation." : groups.stage === "running" ? "Adding devices…" : "Review results below."}`;
  }
  async function markGroupsAdded() {
    let changed = false;
    for (const item of groups?.items || []) {
      if (item.status !== "added") continue;
      const device = devices.find(entry => entry.serial === item.serial && entry.groupId === item.groupId);
      if (device && !device.groupAdded) { device.groupAdded = true; changed = true; }
    }
    if (changed) await save();
  }
  async function automateGroups() {
    render();
    if (groups?.stage === "review") {
      const decision = await ask("Add devices to these groups?", "Confirm the device/group pairs below. This adds memberships and does not remove existing groups.", "Add selected devices", "Cancel", groups.items.filter(item => item.status === "ready"));
      if (!decision.confirmed) { await send("groups-stop"); status.textContent = "Group additions cancelled. No memberships were changed."; return; }
      await send("groups-approve", { selectedSerials: decision.serials, confirmed: true });
    }
    while (groups?.stage === "running") { status.textContent = "Adding devices and verifying group membership…"; await send("groups-step"); await markGroupsAdded(); render(); }
    if (groups?.stage === "complete") {
      const added = groups.items.filter(item => item.status === "added").length;
      status.textContent = `${added} group additions verified; ${groups.items.length - added} skipped, pending or needing attention.`;
      await ask("Group additions complete", status.textContent, "Close", null);
    }
  }
  el("GroupsLoad").addEventListener("click", () => void run(async () => { status.textContent = "Loading groups…"; await send("groups-list"); status.textContent = `Loaded ${groupCatalog.length} groups. Search by name and select an available device group.`; }));
  el("GroupsSearch").addEventListener("input", () => fillGroups(el("GroupsSelect"), el("GroupsSearch").value, el("GroupsSelect").value));
  async function applyBulkGroup() {
    const group = groupCatalog.find(item => item.id === el("GroupsSelect").value && !item.unavailable);
    if (!group) throw new Error("Choose an available group first.");
    for (const device of devices) { if (device.groupId !== group.id) device.groupAdded = false; device.groupId = group.id; device.groupName = group.displayName; device.groupSearch = ""; }
    await save(); status.textContent = `Selected ${group.displayName} for all listed devices. Change individual rows as needed, then click Add devices to groups.`;
  }
  el("GroupsApply").addEventListener("click", () => void run(applyBulkGroup));
  el("GroupsSelect").addEventListener("change", () => { if (el("GroupsSelect").value) void run(applyBulkGroup); });
  el("GroupsBegin").addEventListener("click", () => void run(async () => {
    // Recheck current memberships; a cached completion flag must never hide a selected device.
    const pending = devices.filter(device => device.groupId);
    if (!pending.length) throw new Error("Choose a group in the bulk dropdown or a device row before adding devices to groups.");
    if (pending.some(device => !device.serial)) throw new Error("Enter the internal serial for each device with a selected group.");
    status.textContent = "Verifying the selected devices and groups…";
    await send("groups-start", { devices: pending.map(device => ({ serial: device.serial, groupId: device.groupId })) }); await automateGroups();
  }));
  el("GroupsContinue").addEventListener("click", () => void run(automateGroups));
  el("GroupsCheck").addEventListener("click", () => void run(async () => {
    for (const item of groups?.items.filter(entry => ["pending", "uncertain"].includes(entry.status)) || []) await send("groups-check", { itemSerial: item.serial });
    await markGroupsAdded(); status.textContent = "Group status updated. Only verified memberships are marked complete.";
  }));
  el("GroupsStop").addEventListener("click", () => void run(async () => { await send("groups-stop"); status.textContent = "Group operation stopped. Memberships already added remain in place."; }));
  function renderSyncs() {
    el("SyncReview").hidden = !syncs;
    el("SyncContinue").hidden = !activeSync(); el("SyncStop").hidden = !activeSync();
    for (const name of ["SyncContinue", "SyncStop"]) el(name).disabled = busy || pendingScans > 0;
    const rows = el("SyncRows"); rows.replaceChildren();
    const labels = { ready: "Ready", queued: "Waiting", requested: "Sync requested", uncertain: "Check Intune", failed: "Needs attention", skipped: "Skipped" };
    for (const item of syncs?.items || []) {
      const row = document.createElement("tr"); if (item.missingDevice) row.className = "api-manual-wipe-warning";
      for (const value of [item.serial, labels[item.status] || item.status, item.error || ""]) { const cell = document.createElement("td"); cell.textContent = value; row.append(cell); }
      rows.append(row);
    }
    if (syncs) el("SyncProgress").textContent = `${syncs.items.filter(item => item.status === "requested").length} of ${syncs.items.length} sync requests accepted. This reports requests sent, not completed device syncs.`;
  }
  async function continueSync(single = false) {
    render();
    if (syncs?.stage === "review") {
      const eligible = syncs.items.filter(item => item.status === "ready");
      const decision = single ? { confirmed: true, serials: eligible.map(item => item.serial) } : await ask("Sync these devices?", "Send an Intune sync request to every checked device. Uncheck devices you want to skip.", "Sync selected devices", "Cancel", eligible);
      if (!decision.confirmed) { await send("sync-stop"); status.textContent = "Sync cancelled. No sync requests were sent."; return; }
      await send("sync-approve", { selectedSerials: decision.serials, confirmed: true });
    }
    while (syncs?.stage === "running") { status.textContent = "Sending Intune sync requests…"; await send("sync-step"); render(); }
    if (syncs?.stage === "complete") {
      const requested = syncs.items.filter(item => item.status === "requested").length;
      status.textContent = `${requested} sync request${requested === 1 ? "" : "s"} accepted; ${syncs.items.length - requested} skipped or needing attention. Review sync results.`;
      if (!single) await ask("Bulk sync requests sent", status.textContent, "Close", null);
    }
  }
  async function beginSync(serials, bulk = false) {
    status.textContent = "Finding the exact Intune devices for sync…";
    await send("sync-start", { serials }); await continueSync(!bulk);
  }
  el("SyncAll").addEventListener("click", () => void run(async () => {
    if (devices.some(device => !device.serial)) throw new Error("Enter an internal serial for every device before bulk sync.");
    await beginSync(devices.map(device => device.serial), true);
  }));
  el("SyncContinue").addEventListener("click", () => void run(() => continueSync(false)));
  el("SyncStop").addEventListener("click", () => void run(async () => { await send("sync-stop"); status.textContent = "Sync stopped. Requests already accepted by Intune remain active."; }));
  el("Return").addEventListener("click", () => { if (!busy) showLandingView(); });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.ttmtSidekickUserProfile) void hasDeviceSystemsRole().then(allowed => {
      if (!allowed) { devices = []; job = null; batch = null; profiles = null; groups = null; syncs = null; groupCatalog = []; render(); if (document.getElementById("apiWipeTestView").style.display !== "none") showLandingView(); }
    });
  });
})();
