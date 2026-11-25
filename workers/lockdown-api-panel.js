/* Graph Lost Mode is separate from CRM note submission. */
(() => {
  let busy = false;
  let pendingScans = 0;
  let scanQueue = Promise.resolve();
  const message = "This device is durable medical equipment, property of Smartbox. If found, please contact 877-392-2299 ext.6 or trials.us@smartboxaac.com";
  const phone = "877-392-2299 ext.6";
  const entries = () => [...document.querySelectorAll("#lockDownList .lock-down-entry")];
  const serial = entry => (entry.querySelector("[data-lock-down-internal-serial]")?.value || "").trim().toUpperCase();
  const status = text => { document.getElementById("lockDownApiStatus").textContent = text; };
  async function send(action, extra = {}) {
    const response = await chrome.runtime.sendMessage({ type: "sidekick-api-wipe-test", action, ...extra });
    if (!response?.ok) throw new Error(response?.error || "Microsoft did not respond.");
    if (response.lockdowns) render(response.lockdowns);
    return response.lockdowns;
  }
  function render(batch) {
    const results = document.getElementById("lockDownApiResults");
    results.replaceChildren();
    for (const item of batch.items) {
      const text = item.serial + " — " + item.status + (item.error ? ": " + item.error : "");
      const line = document.createElement("div"); line.textContent = text; results.appendChild(line);
      for (const entry of entries().filter(entry => serial(entry) === item.serial)) entry.querySelector("[data-lock-down-api-status]").textContent = text;
    }
    status(batch.stage === "complete" ? (batch.mode === "disable" ? "Disable requests finished. Keep devices online and verify their Lost Mode screens have cleared. Intune status alone does not confirm this." : "Lockdown requests finished. Requested means accepted by Intune; use Check lockdown status to verify Lost Mode.") : "Lockdown: " + batch.stage);
  }
  async function run(work) {
    if (busy) return;
    if (pendingScans) { status("Wait for the Audit lookups to finish."); return; }
    if (document.getElementById("lockDownSubmitBtn")?.disabled) { status("Wait for CRM note submission to finish."); return; }
    busy = true;
    const controls = [...document.querySelectorAll("#lockDownView button, #lockDownImportForm button, #lockDownScanInput")].map(control => [control, control.disabled]);
    controls.forEach(([control]) => { control.disabled = true; });
    try { await work(); } catch (error) { status(error.message); }
    finally { controls.forEach(([control, disabled]) => { control.disabled = disabled; }); busy = false; }
  }
  async function continueBatch(batch) {
    if (!batch) return;
    if (batch.stage === "review") {
      const ready = batch.items.filter(item => item.status === "ready");
      const approved = window.confirm((batch.mode === "disable" ? "Disable" : "Enable") + " Lost Mode for these " + ready.length + " device(s)?\n\n" + ready.map(item => item.serial + " — " + item.device.deviceName).join("\n") + (batch.mode === "disable" ? "\n\nThis removes the Lost Mode lock screen from these devices." : "\n\nMessage: " + message + "\nPhone: " + phone));
      batch = await send(approved ? "lockdown-approve" : "lockdown-stop", { lockdownNonce: batch.nonce, confirmed: approved });
    }
    while (batch.stage === "running") batch = await send("lockdown-step", { lockdownNonce: batch.nonce });
  }
  async function begin(entry, mode = "enable") {
    await run(async () => {
      const rows = (entry ? [entry] : entries()).filter(row => mode === "disable" || row.dataset?.disableOnly !== "true");
      if (!rows.length || rows.some(row => !row.isConnected || !serial(row))) throw new Error("Add eligible devices with internal serial numbers first.");
      await continueBatch(await send("lockdown-start", { serials: rows.map(serial), mode }));
    });
  }

  const scanInput = document.getElementById("lockDownScanInput");
  const scanStatus = text => { const output = document.getElementById("lockDownScanStatus"); if (output) output.textContent = text; };
  const focusScan = () => { if (!busy && scanInput && !scanInput.disabled) scanInput.focus(); };
  document.getElementById("lockDownScanSection")?.addEventListener("toggle", event => { if (event.currentTarget.open) focusScan(); });
  async function addScan(raw) {
    if (busy) { scanStatus("Wait for the current operation to finish."); return; }
    raw = String(raw || "").trim();
    if (!raw) { focusScan(); return; }
    pendingScans++;
    const task = scanQueue.then(async () => {
      if (!(await hasDeviceSystemsRole())) throw new Error("Device Systems access is required.");
      const number = extractValidSerial(raw);
      if (!number) throw new Error("Device number not recognized. Check the scan and try again.");
      scanStatus("Looking up " + number + " in Audit…");
      const result = await chrome.runtime.sendMessage({ type: "sidekick-audit-lookup", device: number });
      if (!result?.ok) throw new Error(result?.error || "Audit lookup is unavailable.");
      if (result.ambiguous) throw new Error("Audit has conflicting internal serials for " + number + ". Check the workbook.");
      const internalSerial = String(result.internalSerial || "").trim().toUpperCase();
      if (!/^[A-Z0-9-]{5,40}$/.test(internalSerial)) throw new Error(result.error || "No internal serial was found in Audit for " + number + ".");
      if (!(await hasDeviceSystemsRole())) throw new Error("Device Systems access is required.");
      if (entries().some(row => serial(row) === internalSerial || row.querySelector("[data-lock-down-device-number]")?.value === number)) throw new Error(number + " is already in the list.");
      addLockDownEntry({ deviceNumber: number, internalSerial, disableOnly: true });
      scanStatus("Added " + number + " · " + internalSerial + " for disabling Lost Mode." + (result.error ? " Using the last saved Audit data: " + result.error : ""));
    });
    scanQueue = task.catch(error => scanStatus(raw + ": " + error.message)).finally(() => { pendingScans--; focusScan(); });
    return await scanQueue;
  }
  document.getElementById("lockDownScanForm")?.addEventListener("submit", event => {
    event.preventDefault();
    const raw = scanInput.value;
    if (busy) { scanStatus("Wait for the current operation to finish."); return; }
    scanInput.value = ""; focusScan(); void addScan(raw);
  });

  globalThis.sidekickLockDownApi = { begin, addScan };
  document.getElementById("lockDownDisableBulkBtn")?.addEventListener("click", () => void begin(null, "disable"));
  document.getElementById("lockDownBulkBtn")?.addEventListener("click", () => void begin());
  document.getElementById("lockDownConnectBtn")?.addEventListener("click", () => void run(async () => { await send("connect"); status("Microsoft connected. Ready for individual or bulk lockdown."); }));
  document.getElementById("lockDownResumeBtn")?.addEventListener("click", () => void run(async () => continueBatch(await send("lockdown-state"))));
  for (const [id, action] of [["lockDownCheckBtn", "lockdown-check"], ["lockDownStopBtn", "lockdown-stop"]]) {
    document.getElementById(id)?.addEventListener("click", () => void run(async () => {
      const batch = await send("lockdown-state");
      if (!batch) throw new Error("No lockdown operation is available.");
      await send(action, { lockdownNonce: batch.nonce });
    }));
  }
})();
