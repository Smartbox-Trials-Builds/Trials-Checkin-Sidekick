let prePrepRows = [];
let prePrepEditsLocked = false;
let deviceSidekickMode = "wipe";
let bulkGipodRows = [];

function makePrePrepRowId() {
  return `pre-prep-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function updatePrePrepLockState() {
  const lockButton = document.getElementById("prePrepLockBtn");
  if (lockButton) {
    lockButton.textContent = `Lock edits: ${prePrepEditsLocked ? "On" : "Off"}`;
    lockButton.setAttribute("aria-pressed", prePrepEditsLocked ? "true" : "false");
  }
  document.querySelectorAll("#prePrepRows input").forEach(input => {
    input.readOnly = prePrepEditsLocked;
  });
  const bulkButton = document.getElementById("bulkAddGipodBtn");
  if (bulkButton) bulkButton.disabled = prePrepEditsLocked || !prePrepRows.length;
  document.querySelectorAll(".device-row-remove").forEach(button => {
    button.disabled = prePrepEditsLocked;
  });
}

function updatePrePrepEmptyState() {
  const emptyState = document.getElementById("prePrepEmptyState");
  if (emptyState) {
    emptyState.style.display = prePrepRows.length ? "none" : "block";
  }
}

function buildPrePrepCopyCell(row, field, label) {
  const wrapper = document.createElement("div");
  wrapper.className = "pre-prep-copy-cell";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "copy-field";
  input.value = row[field] || "";
  input.readOnly = prePrepEditsLocked;
  input.setAttribute("aria-label", label);
  input.addEventListener("input", () => {
    row[field] = input.value;
    void saveDeviceDraft();
  });

  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "copy-btn";
  copyButton.textContent = "Copy";
  copyButton.addEventListener("click", async () => {
    const value = input.value.trim();
    if (!value) return;
    await navigator.clipboard.writeText(value);
    const original = copyButton.textContent;
    copyButton.textContent = "Copied!";
    setTimeout(() => { copyButton.textContent = original; }, 1200);
  });

  wrapper.append(input, copyButton);
  return wrapper;
}

function renderPrePrepRows() {
  const rowsEl = document.getElementById("prePrepRows");
  if (!rowsEl) return;
  const modeInput = document.getElementById("deviceSidekickMode");
  if (modeInput) modeInput.value = deviceSidekickMode;
  const table = document.getElementById("deviceSidekickTable");
  if (table) table.dataset.mode = deviceSidekickMode;
  document.querySelectorAll("[data-device-prep-only]").forEach(element => {
    element.hidden = deviceSidekickMode !== "prep";
  });
  rowsEl.innerHTML = "";
  prePrepRows.forEach(row => {
    const rowEl = document.createElement("div");
    rowEl.className = "pre-prep-table__row";
    rowEl.dataset.rowId = row.id;
    rowEl.append(
      buildPrePrepCopyCell(row, "deviceSerial", "Scanned device number"),
      buildPrePrepCopyCell(row, "internalSerial", "Internal serial number")
    );
    if (deviceSidekickMode === "prep") {
      rowEl.append(
        buildPrePrepCopyCell(row, "crmId", "CRM ID"),
        buildPrePrepCopyCell(row, "gipodCode", "GIPOD code")
      );
    }
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "toggle-btn queue-small-btn device-row-remove";
    remove.textContent = "Remove";
    remove.disabled = prePrepEditsLocked;
    remove.setAttribute("aria-label", `Remove device ${row.deviceSerial}`);
    remove.addEventListener("click", async () => {
      if (prePrepEditsLocked) return;
      prePrepRows = prePrepRows.filter(item => item.id !== row.id);
      renderPrePrepRows();
      await saveDeviceDraft();
      deviceToolSetText("prePrepStatus", `Removed ${row.deviceSerial}.`);
    });
    rowEl.append(remove);
    rowsEl.append(rowEl);
  });
  updatePrePrepLockState();
  updatePrePrepEmptyState();
}

function addPrePrepScan(rawInput) {
  const corrected = extractValidSerial(rawInput);
  deviceToolSetText("prePrepRawScan", rawInput || "—");
  deviceToolSetText("prePrepCorrectedScan", corrected ? `✅ ${corrected}` : "❌ Invalid serial scanned");

  if (!corrected) {
    deviceToolSetText("prePrepStatus", "Invalid serial number detected. Please enter it manually and try again.");
    return false;
  }

  prePrepRows.push({
    id: makePrePrepRowId(),
    deviceSerial: corrected,
    internalSerial: "",
    crmId: "",
    gipodCode: ""
  });
  renderPrePrepRows();
  void saveDeviceDraft();
  deviceToolSetText("prePrepStatus", `Added ${corrected}.`);
  return true;
}

function clearPrePrepRows() {
  prePrepRows = [];
  void saveDeviceDraft();
  renderPrePrepRows();
  deviceToolSetText("prePrepRawScan", "—");
  deviceToolSetText("prePrepCorrectedScan", "—");
  deviceToolSetText("prePrepStatus", "Device list cleared.");
}


const DEVICE_DRAFT_KEY = "sidekickDeviceDraft";
const deviceDraftOrigin = crypto.randomUUID();
function deviceToolSetText(id, value) { const element = document.getElementById(id); if (element) element.textContent = value; }
async function saveDeviceDraft() {
  await chrome.storage.session.set({ [DEVICE_DRAFT_KEY]: { rows: prePrepRows, locked: prePrepEditsLocked, mode: deviceSidekickMode, origin: deviceDraftOrigin } });
}
async function loadDeviceDraft() {
  const stored = await chrome.storage.session.get(DEVICE_DRAFT_KEY);
  const draft = stored[DEVICE_DRAFT_KEY];
  if (draft) { prePrepRows = draft.rows || []; prePrepEditsLocked = Boolean(draft.locked); deviceSidekickMode = draft.mode === "prep" ? "prep" : "wipe"; }
  renderPrePrepRows();
}
chrome.storage.onChanged.addListener((changes, area) => {
  const draft = changes[DEVICE_DRAFT_KEY]?.newValue;
  if (area !== "session" || !draft || draft.origin === deviceDraftOrigin) return;
  prePrepRows = draft.rows || [];
  prePrepEditsLocked = Boolean(draft.locked);
  deviceSidekickMode = draft.mode === "prep" ? "prep" : "wipe";
  renderPrePrepRows();
});
  document.getElementById("prePrepScanForm")?.addEventListener("submit", event => {
    event.preventDefault();
    const input = document.getElementById("prePrepScanInput");
    const raw = (input?.value || "").trim();
    if (!raw) {
      alert("Enter a device serial number to continue.");
      return;
    }
    if (addPrePrepScan(raw) && input) {
      input.value = "";
      input.focus();
    }
  });

  document.getElementById("prePrepLockBtn")?.addEventListener("click", () => {
    prePrepEditsLocked = !prePrepEditsLocked;
    updatePrePrepLockState();
    void saveDeviceDraft();
  });

  document.getElementById("prePrepClearBtn")?.addEventListener("click", () => {
    if (!prePrepRows.length || confirm("Clear the device list?")) {
      clearPrePrepRows();
    }
  });


document.getElementById("popOutDeviceSidekickBtn")?.addEventListener("click", async () => {
  try {
    await saveDeviceDraft();
    const result = await chrome.runtime.sendMessage({ type: "sidekick-open-device" });
    if (!result?.ok) throw new Error(result?.error);
  } catch { deviceToolSetText("prePrepStatus", "Could not open Device Sidekick. Please try again."); }
});
void loadDeviceDraft();

document.getElementById("deviceSidekickMode")?.addEventListener("change", async event => {
  deviceSidekickMode = event.target.value === "prep" ? "prep" : "wipe";
  renderPrePrepRows();
  await saveDeviceDraft();
});
document.getElementById("bulkAddGipodBtn")?.addEventListener("click", () => {
  if (prePrepEditsLocked || !prePrepRows.length || deviceSidekickMode !== "prep") return;
  bulkGipodRows = prePrepRows.map(row => row.id);
  document.getElementById("bulkGipodInput").value = "";
  deviceToolSetText("bulkGipodStatus", "");
  deviceToolSetText("bulkGipodCount", `Paste exactly ${prePrepRows.length} codes for ${prePrepRows.length} devices.`);
  document.getElementById("bulkGipodDialog").showModal();
  document.getElementById("bulkGipodInput").focus();
});
document.getElementById("bulkGipodCancel")?.addEventListener("click", () => document.getElementById("bulkGipodDialog").close());
document.getElementById("bulkGipodForm")?.addEventListener("submit", async event => {
  event.preventDefault();
  if (prePrepEditsLocked || deviceSidekickMode !== "prep") {
    deviceToolSetText("bulkGipodStatus", "Select Prep mode and unlock edits before applying codes.");
    return;
  }
  if (JSON.stringify(bulkGipodRows) !== JSON.stringify(prePrepRows.map(row => row.id))) {
    deviceToolSetText("bulkGipodStatus", "The device list changed. Close this window and select Bulk add again.");
    return;
  }
  const lines = document.getElementById("bulkGipodInput").value.replace(/\r\n?/g, "\n").split("\n");
  while (lines.length && !lines.at(-1).trim()) lines.pop();
  if (lines.some(line => line.includes("\t") || !line.trim())) {
    deviceToolSetText("bulkGipodStatus", "Paste a single Excel column with no blank rows or header.");
    return;
  }
  if (lines.length !== prePrepRows.length) {
    deviceToolSetText("bulkGipodStatus", `You pasted ${lines.length} codes. Exactly ${prePrepRows.length} are needed, one per device.`);
    return;
  }
  prePrepRows.forEach((row, index) => { row.gipodCode = lines[index].trim(); });
  renderPrePrepRows();
  await saveDeviceDraft();
  document.getElementById("bulkGipodDialog").close();
  deviceToolSetText("prePrepStatus", `Applied ${lines.length} GIPOD codes in device list order.`);
});
