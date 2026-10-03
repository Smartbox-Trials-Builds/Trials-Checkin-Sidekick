// content.js

/* ---------------- Utilities ---------------- */

function getElementByXPath(xpath) {
  try {
    return document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;
  } catch {
    return null;
  }
}

function isVisible(el) {
  if (!el) return false;
  const style = window.getComputedStyle(el);
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    (el.offsetParent !== null || style.position === "fixed")
  );
}

function waitForElementByXPath(
  xpath,
  { timeoutMs = 7000, pollMs = 150, visibleOnly = false } = {}
) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const el = getElementByXPath(xpath);
      if (el && (!visibleOnly || isVisible(el))) {
        resolve(el);
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        reject(new Error("Timed out waiting for element: " + xpath));
        return;
      }
      setTimeout(check, pollMs);
    };
    check();
  });
}

function dispatchChangeEvents(el, value = "") {
  if (typeof InputEvent === "function") {
    el.dispatchEvent(new InputEvent("input", { bubbles: true, data: value, inputType: "insertText" }));
  } else {
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.dispatchEvent(new Event("focusout", { bubbles: true }));
}

function setNativeValue(el, value) {
  if (!el) return;
  const prototype = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
  const previousValue = el.value;
  if (descriptor?.set) {
    descriptor.set.call(el, value);
  } else {
    el.value = value;
  }
  if (el._valueTracker) {
    el._valueTracker.setValue(previousValue);
  }
}

function resolveInputTarget(el) {
  if (!el) return null;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return el;
  return el.querySelector("input, textarea");
}
const UNSAFE_NAME_REGEX = /\s?(\*\d{5}|\*.*?\*|\(.*?\)|\b\d{5}\b|"[^"]*")/g;
const DAF_DATA_STORAGE_KEY = "ttmtLastCheckinForDaf";
const DAILY_COUNTER_STORAGE_KEY = "ttmtDailyTaskCounters";
const DAILY_COUNTER_ENABLED_STORAGE_KEY = "ttmtDailyTaskCounterEnabled";
const DAF_CONSULTANT_LISTBOX_XPATHS = [
  '//*[@id="CommonEditorCalloutId"]/div',
  '//*[@id="CommonEditorCalloutId"]/div/div',
  '//*[@id="CommonEditorCalloutId"]'
];
const DAF_AAC_FIELD_XPATH = "/html/body/div[1]/div/div/form/div/div/div/div[5]/div/span/div/div/div/input";

function sanitizeName(name) {
  return (name || "").replace(UNSAFE_NAME_REGEX, "").trim();
}

function normalizeText(str) {
  return (str || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function levenshteinDistance(a, b) {
  const first = a || "";
  const second = b || "";
  if (!first.length) return second.length;
  if (!second.length) return first.length;

  const matrix = Array.from({ length: first.length + 1 }, () => []);
  for (let i = 0; i <= first.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= second.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= first.length; i += 1) {
    for (let j = 1; j <= second.length; j += 1) {
      const cost = first[i - 1] === second[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[first.length][second.length];
}

function scoreNameSimilarity(target, candidate) {
  const normalizedTarget = normalizeText(target);
  const normalizedCandidate = normalizeText(candidate);
  if (!normalizedTarget || !normalizedCandidate) return 0;
  if (normalizedTarget === normalizedCandidate) return 1;
  if (normalizedCandidate.includes(normalizedTarget) || normalizedTarget.includes(normalizedCandidate)) {
    return 0.9;
  }
  const distance = levenshteinDistance(normalizedTarget, normalizedCandidate);
  const maxLen = Math.max(normalizedTarget.length, normalizedCandidate.length);
  return maxLen ? 1 - distance / maxLen : 0;
}

function selectClosestConsultantFromListBox(listBox, targetName) {
  if (!listBox || !targetName) return false;

  const candidates = Array.from(
    listBox.querySelectorAll("[role='option'], li, div, span, button")
  ).filter(el => isVisible(el) && normalizeText(el.textContent));

  const seen = new Map();
  candidates.forEach(el => {
    const text = normalizeText(el.textContent);
    if (!seen.has(text)) seen.set(text, el);
  });

  const uniqueCandidates = Array.from(seen.entries()).map(([text, el]) => ({
    text,
    el
  }));

  if (!uniqueCandidates.length) return false;

  uniqueCandidates.sort((a, b) => {
    const aRole = a.el.getAttribute("role") === "option" ? 1 : 0;
    const bRole = b.el.getAttribute("role") === "option" ? 1 : 0;
    return bRole - aRole;
  });

  let best = null;
  let bestScore = 0;
  uniqueCandidates.forEach(candidate => {
    const score = scoreNameSimilarity(targetName, candidate.text);
    if (score > bestScore) {
      bestScore = score;
      best = candidate.el;
    }
  });

  if (!best || bestScore <= 0) return false;

  best.click();
  dispatchChangeEvents(best);
  return true;
}

/* ---------------- Existing CRM Data Grab ---------------- */

function getSearchParamValue(url, names) {
  const targets = new Set((Array.isArray(names) ? names : [names]).map(name => String(name).toLowerCase()));
  for (const [key, value] of url.searchParams.entries()) {
    if (targets.has(key.toLowerCase()) && value.trim()) return value.trim();
  }
  return "";
}

function getCrmIdFromUrl() {
  try {
    const url = new URL(window.location.href);
    const fromQuery = getSearchParamValue(url, ["ID", "ClientID", "ClientId", "Client"]);
    if (fromQuery) return fromQuery;

    const pathMatch = url.pathname.match(/(?:EditClient|Client)[^\d]*(\d+)/i);
    return pathMatch?.[1] || "";
  } catch {
    return "";
  }
}

function getInputValueById(id) {
  const el = document.getElementById(id);
  return getFieldValue(el);
}

function getFieldValue(el) {
  if (!el) return "";
  if (el.tagName === "SELECT") {
    return el.options?.[el.selectedIndex]?.textContent?.trim() || el.value?.trim() || "";
  }
  return (el.value || el.textContent || "").trim();
}

function getFieldValueBySuffix(suffixes) {
  for (const suffix of suffixes) {
    const escapedSuffix = CSS.escape(suffix);
    const selector = [
      `input[id$="${escapedSuffix}" i]`,
      `textarea[id$="${escapedSuffix}" i]`,
      `select[id$="${escapedSuffix}" i]`,
      `input[name$="${escapedSuffix}" i]`,
      `textarea[name$="${escapedSuffix}" i]`,
      `select[name$="${escapedSuffix}" i]`
    ].join(",");
    const value = getFieldValue(document.querySelector(selector));
    if (value) return value;
  }
  return "";
}

function normalizeLabelText(value) {
  return (value || "").replace(/\s+/g, " ").replace(/[\*:]+$/g, "").trim().toLowerCase();
}

function findFieldNearLabel(labelPatterns) {
  const patterns = Array.isArray(labelPatterns) ? labelPatterns : [labelPatterns];
  const labels = Array.from(document.querySelectorAll("label, td, th, span, div"));

  for (const label of labels) {
    const labelText = normalizeLabelText(label.textContent);
    if (!labelText || !patterns.some(pattern => pattern.test(labelText))) continue;

    if (label.htmlFor) {
      const linked = document.getElementById(label.htmlFor);
      if (linked && ["INPUT", "TEXTAREA", "SELECT"].includes(linked.tagName)) return linked;
    }

    const nested = label.querySelector("input, textarea, select");
    if (nested) return nested;

    const row = label.closest("tr");
    const rowField = row?.querySelector("input, textarea, select");
    if (rowField && !label.contains(rowField)) return rowField;

    let sibling = label.nextElementSibling;
    for (let i = 0; sibling && i < 4; i += 1, sibling = sibling.nextElementSibling) {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(sibling.tagName)) return sibling;
      const siblingField = sibling.querySelector?.("input, textarea, select");
      if (siblingField) return siblingField;
    }
  }

  return null;
}

function getFieldValueByLabel(labelPatterns) {
  return getFieldValue(findFieldNearLabel(labelPatterns));
}

function getClientFirstName() {
  return getInputValueById("ctl00_MainContent_Tabs_tpClient_ClientTabs_tpClientInfo_txtClientFirstName")
    || getFieldValueBySuffix(["txtClientFirstName", "ClientFirstName", "FirstName", "txtFirstName"])
    || getFieldValueByLabel([/^(client )?first name$/, /^first$/]);
}

function getClientLastName() {
  return getInputValueById("ctl00_MainContent_Tabs_tpClient_ClientTabs_tpClientInfo_txtClientLastName")
    || getFieldValueBySuffix(["txtClientLastName", "ClientLastName", "LastName", "txtLastName"])
    || getFieldValueByLabel([/^(client )?last name$/, /^last$/]);
}

function getAacSelectedText() {
  const el = document.getElementById(
    "ctl00_MainContent_Tabs_tpClient_ClientTabs_tpClientInfo_ddlSalesperson"
  );
  return getFieldValue(el)
    || getFieldValueBySuffix(["ddlSalesperson", "Salesperson", "AAC", "Consultant"])
    || getFieldValueByLabel([/^(aac|aac consultant|consultant|salesperson|sales person)$/]);
}

function collectClientData() {
  return {
    crmId: getCrmIdFromUrl(),
    firstName: sanitizeName(getClientFirstName()),
    lastName: sanitizeName(getClientLastName()),
    aac: getAacSelectedText()
  };
}

/* ---------------- DOM Actions ---------------- */

function setValueByXPath(xpath, value) {
  const el = getElementByXPath(xpath);
  if (!el) return false;

  const input = resolveInputTarget(el);
  if (input) {
    setNativeValue(input, value);
    dispatchChangeEvents(input, value);
    return true;
  }

  el.textContent = value;
  dispatchChangeEvents(el, value);
  return true;
}

function setDropdownByVisibleText(xpath, text) {
  const el = getElementByXPath(xpath);
  if (!el || el.tagName !== "SELECT") return false;

  const option = [...el.options].find(o => o.textContent.trim() === text);
  if (!option) return false;

  el.value = option.value;
  dispatchChangeEvents(el);
  return true;
}

function selectOptionByXPath(xpath) {
  const option = getElementByXPath(xpath);
  const select = option?.parentElement;
  if (!option || option.tagName !== "OPTION" || !select || select.tagName !== "SELECT") return false;

  select.value = option.value;
  dispatchChangeEvents(select);
  return select.value === option.value;
}

function clickByXPath(xpath) {
  const el = getElementByXPath(xpath);
  if (!el) return false;
  el.click();
  return true;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function waitForCondition(check, { timeoutMs = 7000, pollMs = 150 } = {}) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      try {
        const result = check();
        if (result) {
          resolve(result);
          return;
        }
      } catch (err) {
        reject(err);
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        reject(new Error("Timed out waiting for condition."));
        return;
      }
      setTimeout(tick, pollMs);
    };
    tick();
  });
}

async function waitForEnabledElementByXPath(xpath, options = {}) {
  const el = await waitForElementByXPath(xpath, options);
  await waitForCondition(() => !el.disabled, options);
  return el;
}

async function setFileInputByXPath(xpath, file) {
  const input = await waitForElementByXPath(xpath);
  if (!input || !(input instanceof HTMLInputElement)) {
    throw new Error("File upload input not found.");
  }
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  input.files = dataTransfer.files;
  dispatchChangeEvents(input, file.name);
  return input;
}

async function uploadDocumentViaCrmUi({ zipArrayBuffer, zipName, documentTitle, xpaths }) {
  const file = new File([zipArrayBuffer], zipName, { type: "application/zip" });
  await setFileInputByXPath(xpaths.fileInput, file);
  await waitForEnabledElementByXPath(xpaths.uploadButton, { visibleOnly: true });
  clickByXPath(xpaths.uploadButton);
  if (xpaths.uploadSuccessMessage) {
    await waitForElementByXPath(xpaths.uploadSuccessMessage, { visibleOnly: true });
  }

  const titleValue = documentTitle || zipName;
  await waitForEnabledElementByXPath(xpaths.documentTitle, { visibleOnly: true });
  const setTitleOk = setValueByXPath(xpaths.documentTitle, titleValue);
  if (!setTitleOk) throw new Error("Could not set document title.");
  await waitForEnabledElementByXPath(xpaths.addButton, { visibleOnly: true });
  clickByXPath(xpaths.addButton);
  await waitForCondition(() => {
    const el = getElementByXPath(xpaths.documentTitle);
    const input = el ? resolveInputTarget(el) : null;
    return input !== null && input.value === "";
  }, { timeoutMs: 3000, pollMs: 100 }).catch(() => delay(400));
  return true;
}

function findUploadTarget() {
  const fileInputs = Array.from(document.querySelectorAll('input[type="file"]'));
  if (!fileInputs.length) return null;

  const candidate = fileInputs.find(isVisible) || fileInputs[0];
  if (!candidate) return null;

  const form = candidate.form || candidate.closest("form");
  if (!form) return null;

  return { fileInput: candidate, form };
}

async function uploadZipDirectlyToPage(zipArrayBuffer, zipName) {
  const target = findUploadTarget();
  if (!target) throw new Error("Could not find a file upload form on this CRM page.");

  const { fileInput, form } = target;
  const action = form.getAttribute("action") || window.location.href;
  const method = (form.getAttribute("method") || "POST").toUpperCase();
  const resolvedAction = new URL(action, window.location.href).toString();

  const formData = new FormData(form);
  const zipFile = new File([zipArrayBuffer], zipName, { type: "application/zip" });
  formData.set(fileInput.name || "file", zipFile);

  const res = await fetch(resolvedAction, {
    method,
    body: formData,
    credentials: "include"
  });

  if (!res.ok) {
    throw new Error(`Upload failed with status ${res.status}.`);
  }

  return true;
}

async function uploadDocumentsSequentially(uploads, xpaths) {
  const tasks = Array.isArray(uploads) ? uploads : [];
  if (!tasks.length) return true;
  for (const upload of tasks) {
    await uploadDocumentViaCrmUi({ ...upload, xpaths });
  }
  return true;
}

/* ---------------- Message Listener ---------------- */

function pickInventorySearchValue({ deviceNumber = "", cameraNumber = "", luminNumber = "" } = {}) {
  const camera = cameraNumber.trim();
  const lumin = luminNumber.trim();
  const device = deviceNumber.trim();
  return camera || lumin || device || "";
}

function splitInventoryIdentifiers(value = "") {
  return value
    .split(/[,;\n]+/)
    .map(part => part.trim())
    .filter(Boolean);
}

const INVENTORY_SEARCH_INPUT_XPATH = "/html/body/form/div[3]/table/tbody/tr[2]/td[2]/div/div[2]/div[2]/table/tbody/tr/td[1]/input";
const INVENTORY_SEARCH_BUTTON_XPATH = "/html/body/form/div[3]/table/tbody/tr[2]/td[2]/div/div[2]/div[2]/table/tbody/tr/td[2]/input";

function waitForXPath(xpath, timeoutMs = 12000, pollMs = 200) {
  return new Promise(resolve => {
    const start = Date.now();
    const timer = setInterval(() => {
      const node = getElementByXPath(xpath);
      if (node) {
        clearInterval(timer);
        resolve(node);
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        clearInterval(timer);
        resolve(null);
      }
    }, pollMs);
  });
}

async function runInventoryManageFlow(searchValue) {
  const searchInput = await waitForXPath(INVENTORY_SEARCH_INPUT_XPATH);
  if (!searchInput) return { ok: false, message: "Inventory search textbox not found." };

  searchInput.focus();
  searchInput.value = searchValue;
  searchInput.dispatchEvent(new Event("input", { bubbles: true }));
  searchInput.dispatchEvent(new Event("change", { bubbles: true }));

  const searchButton = await waitForXPath(INVENTORY_SEARCH_BUTTON_XPATH);
  if (!searchButton) return { ok: false, message: "Inventory search button not found." };

  await delay(1000);
  searchButton.click();
  return { ok: true, searchValue };
}

const runtime = typeof chrome !== "undefined" ? chrome.runtime : undefined;

if (runtime?.onMessage?.addListener) {
  runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "GET_CLIENT_DATA") {
      sendResponse({ ok: true, data: collectClientData() });
      return true;
    }

  if (msg.type === "SET_CRM_NOTE") {
    const ok = setValueByXPath(msg.xpath, msg.noteText);
    sendResponse({ ok });
    return true;
  }

  if (msg.type === "SET_VALUE_BY_XPATH") {
    const ok = setValueByXPath(msg.xpath, msg.value);
    sendResponse({ ok });
    return true;
  }

  if (msg.type === "SET_DROPDOWN_BY_TEXT") {
    const ok = setDropdownByVisibleText(msg.xpath, msg.text);
    sendResponse({ ok });
    return true;
  }

  if (msg.type === "SELECT_OPTION_BY_XPATH") {
    const ok = selectOptionByXPath(msg.xpath);
    sendResponse({ ok });
    return true;
  }

  if (msg.type === "CLICK_BY_XPATH") {
    const ok = clickByXPath(msg.xpath);
    sendResponse({ ok });
    return true;
  }

  if (msg.type === "UPLOAD_ZIP_TO_CRM") {
    uploadZipDirectlyToPage(msg.zipArrayBuffer, msg.zipName)
      .then(() => sendResponse({ ok: true }))
      .catch(err => {
        console.error(err);
        sendResponse({ ok: false, message: err?.message || "Upload failed." });
      });
    return true;
  }

  if (msg.type === "UPLOAD_CRM_DOCUMENTS") {
    uploadDocumentsSequentially(msg.uploads, msg.xpaths)
      .then(() => sendResponse({ ok: true }))
      .catch(err => {
        console.error(err);
        sendResponse({ ok: false, message: err?.message || "Upload failed." });
      });
    return true;
  }

    if (msg.type === "RUN_INVENTORY_SCRIPT") {
      const identifiers = msg.identifiers || {};
      const cameraNumbers = splitInventoryIdentifiers(identifiers.cameraNumber || "");
      const fallbackSearchValue = pickInventorySearchValue({
        deviceNumber: identifiers.deviceNumber,
        cameraNumber: cameraNumbers.length > 1 ? "" : identifiers.cameraNumber || "",
        luminNumber: identifiers.luminNumber
      });

      if (!cameraNumbers.length && !fallbackSearchValue) {
        sendResponse({ ok: false, message: "No device, camera, or Lumin-I number provided." });
        return true;
      }

      const searchValue = cameraNumbers[0] || fallbackSearchValue;
      runInventoryManageFlow(searchValue)
        .then(result => sendResponse(result))
        .catch(err => {
          console.error(err);
          sendResponse({ ok: false, message: err?.message || "Failed to run inventory script." });
        });
      return true;
    }

    if (msg.type === "PASTE_LTL_COMPLETED_ROW") {
      pasteLtlCompletedRow(msg.rowValues || [])
        .then(ok => sendResponse({ ok }))
        .catch(err => {
          console.error(err);
          sendResponse({ ok: false, message: err?.message || "Failed to paste LTL update row." });
        });
      return true;
    }

    if (msg.type === "RUN_DAF_AUTOFILL") {
      fillDafFormFromStorage()
        .then(ok => sendResponse({ ok }))
        .catch(err => {
          console.error(err);
          sendResponse({ ok: false, message: err?.message || "DAF autofill failed." });
        });
      return true;
    }

  });
} else {
  console.warn("Chrome runtime not available; skipping message listener setup.");
}

/* ---------------- Excel workbook helpers ---------------- */

const LTL_COMPLETED_SHEET_NAME = "Completed LTL Update List";

function findSheetTabByName(sheetName) {
  const normalizedTarget = normalizeText(sheetName);
  const candidates = Array.from(document.querySelectorAll('[role="tab"], button, li, span'));
  return candidates.find(el => normalizeText(el.textContent).includes(normalizedTarget)) || null;
}

function findExcelGrid() {
  return document.querySelector('[role="grid"]')
    || document.querySelector('div[aria-label*="Sheet"]')
    || document.querySelector('div[aria-label*="Worksheet"]');
}

function sendKey(target, key, options = {}) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...options
  });
  target.dispatchEvent(event);
}

async function pasteLtlCompletedRow(rowValues) {
  if (!Array.isArray(rowValues) || rowValues.length === 0) return false;
  const rowText = rowValues.map(value => String(value ?? "")).join("\t");
  await navigator.clipboard.writeText(rowText);

  const sheetTab = findSheetTabByName(LTL_COMPLETED_SHEET_NAME);
  if (sheetTab) {
    sheetTab.click();
    await delay(600);
  }

  const grid = findExcelGrid();
  if (!grid) {
    alert("LTL row copied to clipboard. Paste into the Completed LTL Update List.");
    return false;
  }

  grid.focus();
  grid.click();
  sendKey(grid, "End", { ctrlKey: true });
  await delay(100);
  sendKey(grid, "ArrowDown");
  await delay(100);

  alert("LTL row copied to clipboard. Paste into the Completed LTL Update List.");
  return false;
}

/* ---------------- DAF form autofill ---------------- */

function isDafFormPage() {
  return typeof window?.location?.href === "string"
    && window.location.href.includes("smartboxassistivetnam.sharepoint.com/")
    && window.location.href.includes("listforms.aspx");
}

function getLastCheckinDataForDaf() {
  if (!chrome?.storage?.local) return Promise.resolve(null);
  return new Promise(resolve => {
    chrome.storage.local.get(DAF_DATA_STORAGE_KEY, res => {
      resolve(res?.[DAF_DATA_STORAGE_KEY] || null);
    });
  });
}

function findInputMatchingLabels(labelVariants) {
  const targets = labelVariants.map(normalizeText);
  const inputs = Array.from(document.querySelectorAll("input[type='text'], input:not([type]), textarea"));

  const matches = (input) => {
    if (!isVisible(input)) return false;

    const textParts = [
      input.getAttribute("aria-label"),
      input.getAttribute("placeholder"),
      input.getAttribute("name"),
      input.id
    ];

    if (input.id) {
      const forLabel = document.querySelector(`label[for="${input.id}"]`);
      if (forLabel) textParts.push(forLabel.textContent);
    }

    const labeledAncestor = input.closest("label");
    if (labeledAncestor) textParts.push(labeledAncestor.textContent);

    const context = input.closest("div, span, p");
    if (context) textParts.push(context.textContent);

    const normalized = textParts.map(normalizeText);
    return targets.some(t => normalized.some(n => n.includes(t)));
  };

  return inputs.find(matches) || null;
}

function waitForInputByLabels(labelVariants, { timeoutMs = 10000, pollMs = 200 } = {}) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const input = findInputMatchingLabels(labelVariants);
      if (input) {
        resolve(input);
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        reject(new Error("Timed out waiting for DAF field: " + labelVariants.join("/")));
        return;
      }
      setTimeout(check, pollMs);
    };
    check();
  });
}

function findCheckboxMatchingLabels(labelVariants) {
  const targets = labelVariants.map(normalizeText);
  const checkboxes = Array.from(document.querySelectorAll("input[type='checkbox']"));

  const matches = (input) => {
    if (!isVisible(input)) return false;

    const textParts = [
      input.getAttribute("aria-label"),
      input.getAttribute("name"),
      input.id
    ];

    if (input.id) {
      const forLabel = document.querySelector(`label[for="${input.id}"]`);
      if (forLabel) textParts.push(forLabel.textContent);
    }

    const labeledAncestor = input.closest("label");
    if (labeledAncestor) textParts.push(labeledAncestor.textContent);

    const context = input.closest("div, span, p");
    if (context) textParts.push(context.textContent);

    const normalized = textParts.map(normalizeText);
    return targets.some(t => normalized.some(n => n.includes(t)));
  };

  return checkboxes.find(matches) || null;
}

async function fillDafFieldByXPath(xpath, value, options = {}) {
  if (!value) return false;
  try {
    const el = await waitForElementByXPath(xpath, { timeoutMs: 10000, ...options });
    const input = resolveInputTarget(el);
    if (input) {
      setNativeValue(input, value);
      dispatchChangeEvents(input, value);
    } else {
      el.textContent = value;
      dispatchChangeEvents(el, value);
    }
    return true;
  } catch (err) {
    console.warn("Failed to fill DAF field for", xpath, err);
    return false;
  }
}

async function fillDafFieldWithFallback({ value, xpath, xpaths, labels }) {
  const safeVal = (value || "").trim();
  if (!safeVal) return false;

  const candidateXPaths = xpaths || (xpath ? [xpath] : []);
  for (const candidate of candidateXPaths) {
    const ok = await fillDafFieldByXPath(candidate, safeVal, { timeoutMs: 4000 }).catch(() => false);
    if (ok) return true;
  }

  try {
    const input = await waitForInputByLabels(labels);
    setNativeValue(input, safeVal);
    dispatchChangeEvents(input, safeVal);
    return true;
  } catch (err) {
    console.warn("Fallback fill failed for", labels, err);
    return false;
  }
}

async function openDafAacPicker() {
  try {
    const aacContainer = await waitForElementByXPath(DAF_AAC_FIELD_XPATH, {
      timeoutMs: 7000,
      visibleOnly: true
    });
    const clickable = aacContainer.querySelector(
      "input, textarea, button, [role='combobox'], [role='textbox'], [contenteditable='true']"
    ) || aacContainer;
    clickable.click();
    if (typeof clickable.focus === "function") clickable.focus();
    return true;
  } catch (err) {
    console.warn("Failed to open DAF AAC picker", err);
    return false;
  }
}

function setTextEditorValue(target, value) {
  if (!target) return false;
  const safeValue = String(value ?? "");

  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    setNativeValue(target, safeValue);
    dispatchChangeEvents(target, safeValue);
    return true;
  }

  if (target.isContentEditable) {
    target.focus();
    target.textContent = safeValue;
    target.dispatchEvent(new InputEvent("input", { bubbles: true, data: safeValue, inputType: "insertText" }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", bubbles: true }));
    return true;
  }

  return false;
}

function findVisibleConsultantListBox() {
  const candidates = Array.from(document.querySelectorAll(
    "[role='listbox'], #CommonEditorCalloutId, [id*='Callout'], [class*='callout']"
  ));
  return candidates.find(isVisible) || null;
}

async function selectDafConsultantByAac(aacName) {
  const safeName = (aacName || "").trim();
  if (!safeName) return false;

  try {
    await openDafAacPicker();

    const aacContainer = await waitForElementByXPath(DAF_AAC_FIELD_XPATH, {
      timeoutMs: 4000,
      visibleOnly: true
    });
    const editorTarget = aacContainer.querySelector(
      "input, textarea, [role='combobox'], [role='textbox'], [contenteditable='true']"
    ) || aacContainer;
    setTextEditorValue(editorTarget, safeName);

    let listBox = null;
    for (const xpath of DAF_CONSULTANT_LISTBOX_XPATHS) {
      try {
        listBox = await waitForElementByXPath(xpath, {
          timeoutMs: 8000,
          visibleOnly: true
        });
        if (listBox) break;
      } catch {
        listBox = null;
      }
    }
    if (!listBox) {
      listBox = findVisibleConsultantListBox();
    }
    if (!listBox) {
      throw new Error("No consultant list box found for known XPaths.");
    }
    const selected = selectClosestConsultantFromListBox(listBox, safeName);
    if (!selected) {
      console.warn("DAF consultant list box loaded but no match found for AAC:", safeName);
    }
    return selected;
  } catch (err) {
    console.warn("Failed to select DAF consultant by AAC", err);
    return false;
  }
}

async function ensureDafCheckboxChecked(xpath, labelVariants = []) {
  try {
    const target = await waitForElementByXPath(xpath, { timeoutMs: 10000 });
    const checkbox = target.querySelector("input[type='checkbox']") ||
      (target.tagName === "INPUT" && target.type === "checkbox" ? target : null) ||
      (target.previousElementSibling?.tagName === "INPUT" && target.previousElementSibling.type === "checkbox"
        ? target.previousElementSibling
        : null);

    if (checkbox) {
      if (!checkbox.checked) {
        checkbox.checked = true;
        dispatchChangeEvents(checkbox);
      }
      return true;
    }

    target.click();
    return true;
  } catch (err) {
    console.warn("Failed to check DAF checkbox by XPath", err);
  }

  const fallbackCheckbox = labelVariants.length ? findCheckboxMatchingLabels(labelVariants) : null;
  if (fallbackCheckbox) {
    if (!fallbackCheckbox.checked) {
      fallbackCheckbox.checked = true;
      dispatchChangeEvents(fallbackCheckbox);
    }
    return true;
  }

  return false;
}

async function fillDafFormFromStorage() {
  if (!isDafFormPage()) return false;

  const data = await getLastCheckinDataForDaf();
  if (!data) return false;

  const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ").trim();

  const fields = [
    {
      value: data.deviceNumber,
      xpaths: [
        '/html/body/div[1]/div/div/form/div/div/div/div[1]/div/span/div/div/div/input'
      ],
      labels: ["device serial", "device number", "device serial number", "device serial #"]
    },
    {
      value: data.cameraNumber,
      xpath: '/html/body/div[1]/div/div/form/div/div/div/div[2]/div/span/div/div/div/input',
      labels: ["camera", "camera number", "camera serial"]
    },
    {
      value: data.luminNumber,
      xpath: '/html/body/div[1]/div/div/form/div/div/div/div[3]/div/span/div/div/div/input',
      labels: ["lumin-i", "lumin", "lumin i number"]
    },
    {
      value: data.crmId,
      xpath: '/html/body/div[1]/div/div/form/div/div/div/div[4]/div/span/div/div/div/input',
      labels: ["crm id", "crm number"]
    },
    {
      value: fullName,
      xpath: '/html/body/div[1]/div/div/form/div/div/div/div[6]/div/span/div/div/div/input',
      labels: ["client name", "full name", "name of client"]
    },
    {
      value: data.clampMount,
      xpath: '/html/body/div[1]/div/div/form/div/div/div/div[7]/div/span/div/div/div/input',
      labels: ["clamp mount"]
    },
    {
      value: data.tableMount,
      xpath: '/html/body/div[1]/div/div/form/div/div/div/div[8]/div/span/div/div/div/input',
      labels: ["table mount"]
    },
    {
      value: data.rollingMount,
      xpath: '/html/body/div[1]/div/div/form/div/div/div/div[9]/div/span/div/div/div/input',
      labels: ["rolling mount"]
    }
  ];

  await Promise.all(fields.map(f => fillDafFieldWithFallback(f)));
  await fillDafFieldWithFallback({
    value: data.aac,
    xpath: DAF_AAC_FIELD_XPATH,
    labels: ["aac", "consultant", "aac consultant"]
  });

  await ensureDafCheckboxChecked(
    '/html/body/div[1]/div/div/form/div/div/div/div[10]/div/span/div/div/div/div[2]/div/label',
    ["device returned", "daf", "device received back", "ttmt device confirmation"]
  );

  return true;
}

if (isDafFormPage()) {
  fillDafFormFromStorage().catch(err => console.error("DAF autofill failed", err));
}
