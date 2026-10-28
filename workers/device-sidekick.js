let prePrepRows = [];
let prePrepEditsLocked = false;
let deviceSidekickMode = "wipe";
let internalSerialOnly = false;
let deviceSystemsWipeAccess = false;
const ENTRA_DEVICE_OVERVIEW_URL = "https://entra.microsoft.com/#view/Microsoft_AAD_Devices/DevicesMenuBlade/~/Devices/menuId/Overview";
const ENTRA_DEVICE_SEARCH_XPATH = "/html/body/div[3]/div/div/div[2]/div/div/div[1]/div/div[1]/input";
const INTUNE_ALL_DEVICES_URL = "https://intune.microsoft.com/#view/Microsoft_Intune_DeviceSettings/DevicesMenu/~/allDevices";
function nextUnprofiledDevice() {
  return prePrepRows.find(row => !row.profileAdded && String(row.internalSerial || "").trim());
}

async function runPendingProfiles(tabId) {
  while (nextUnprofiledDevice()) {
    const row = nextUnprofiledDevice();
    const serial = String(row.internalSerial).trim();
    const category = row.category;
    if (!DEVICE_PROFILE_CATEGORIES[category]) throw new Error(`Select a device category for ${serial}, then click Begin Adding Profiles to continue.`);
    const completed = await searchIntuneForProfiles(tabId, serial, category);
    if (completed !== true) return;
    if (!(await refreshBeginWipeAccess()) || nextUnprofiledDevice() !== row || String(row.internalSerial).trim() !== serial || row.category !== category) {
      throw new Error("The device list, category or role changed. Check the last saved device before continuing.");
    }
    row.profileAdded = true;
    await saveDeviceDraft();
    renderPrePrepRows();
  }
  deviceToolSetText("prePrepStatus", "Profiles added for all listed devices. Returned to All devices with the search cleared.");
}

const DEVICE_PROFILE_CATEGORIES = Object.freeze({
  "Talkpad 10": "Wego TalkPad 10",
  "Talkpad 8": "Wego TalkPad 8",
  "Wego 13": "Wego 13a",
  "Wego 5": "Wego 5a"
});

function selectIntuneDeviceCategory(category, act = false) {
  const allowed = ["Wego TalkPad 10", "Wego TalkPad 8", "Wego 13a", "Wego 5a"];
  if (!allowed.includes(category)) return { found: false, status: "invalid-category" };
  const visible = element => {
    const style = getComputedStyle(element);
    return element.isConnected && element.getClientRects().length && style.display !== "none" && style.visibility === "visible";
  };
  const control = document.getElementById("device-category-dropdown");
  if (!control || !visible(control) || control.disabled || control.getAttribute("aria-disabled") === "true") return { found: false };
  if (!act) return { found: true };
  const value = () => String(control.value || control.textContent || "").trim();
  if (value() === category) return { status: "selected" };
  return new Promise(resolve => {
    let observer, timeout, finished = false, clicked = false;
    const finish = status => {
      if (finished) return;
      finished = true;
      observer?.disconnect(); clearTimeout(timeout);
      resolve({ status });
    };
    const check = () => {
      if (finished) return;
      if (!control.isConnected) { finish("form-changed"); return; }
      if (value() === category) { finish("selected"); return; }
      if (clicked) return;
      const controlled = (control.getAttribute("aria-controls") || "").split(/\s+/).filter(Boolean).map(id => document.getElementById(id)).filter(element => element && visible(element));
      const lists = controlled.length ? controlled : [...document.querySelectorAll('[role="listbox"]')].filter(visible);
      if (lists.length !== 1) return;
      const options = [...lists[0].querySelectorAll('[role="option"]')].filter(option => visible(option)
        && option.getAttribute("aria-disabled") !== "true" && String(option.textContent || "").trim() === category);
      if (options.length !== 1) return;
      clicked = true;
      options[0].click();
      queueMicrotask(check);
    };
    observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
    timeout = setTimeout(() => finish("not-found"), 10000);
    if (control.getAttribute("aria-expanded") !== "true") {
      const open = [...document.querySelectorAll('button[aria-label="Open Device category"]')].filter(visible);
      if (open.length === 1) open[0].click();
      else control.click();
    }
    check();
  });
}

function clickIntuneProfileNext(category) {
  return new Promise(resolve => {
    let observer, timeout, clicked = false, finished = false;
    const visible = element => {
      const style = getComputedStyle(element);
      return element.isConnected && element.getClientRects().length && style.display !== "none" && style.visibility === "visible";
    };
    const name = element => String(element.getAttribute("aria-label") || element.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
    const finish = status => {
      if (finished) return;
      finished = true;
      observer?.disconnect(); clearTimeout(timeout);
      resolve({ status });
    };
    const check = () => {
      if (finished) return;
      const buttons = [...document.querySelectorAll('button, [role="button"]')].filter(visible);
      if (clicked) {
        const review = [...document.querySelectorAll('a, [role="link"]')].some(link => visible(link) && name(link).startsWith("review + save"));
        if (review && buttons.some(button => name(button) === "save")) finish("review");
        return;
      }
      const control = document.getElementById("device-category-dropdown");
      if (!control || String(control.value || control.textContent || "").trim() !== category) { finish("category-changed"); return; }
      const next = buttons.filter(button => name(button) === "next" && !button.disabled && button.getAttribute("aria-disabled") !== "true");
      if (next.length !== 1) return;
      clicked = true;
      next[0].click();
      queueMicrotask(check);
    };
    observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
    timeout = setTimeout(() => finish("not-found"), 15000);
    check();
  });
}

function clearIntuneProfileSearch(serial, act = false) {
  if (!location.hostname.endsWith(".reactblade.portal.azure.net")) return { found: false };
  const visible = element => {
    const style = getComputedStyle(element);
    return element.isConnected && element.getClientRects().length && style.display !== "none" && style.visibility === "visible";
  };
  if (![...document.querySelectorAll('[role="grid"][aria-label="Managed Devices"], [role="table"][aria-label="Managed Devices"], table[aria-label="Managed Devices"]')].some(visible)) return { found: false };
  const inputs = [...document.querySelectorAll('input[aria-label="Search"], input[placeholder="Search"], input[type="search"]')].filter(visible);
  if (inputs.length !== 1) return { found: false, ambiguous: inputs.length > 1 };
  const input = inputs[0];
  if (!act) return { found: true };
  if (!input.value) return { status: "cleared" };
  if (input.value.trim().toLowerCase() !== serial.trim().toLowerCase()) return { status: "search-changed" };
  const search = input.closest('[role="search"], .ms-SearchBox');
  if (!search) return { status: "not-found" };
  const buttons = [...search.querySelectorAll('button, [role="button"]')].filter(button => visible(button) && !button.disabled
    && button.getAttribute("aria-disabled") !== "true"
    && String(button.getAttribute("aria-label") || button.textContent || "").trim().toLowerCase() === "clear text");
  if (buttons.length !== 1) return { status: "not-found" };
  return new Promise(resolve => {
    let observer, timeout, finished = false;
    const finish = status => {
      if (finished) return;
      finished = true;
      observer?.disconnect(); clearTimeout(timeout);
      resolve({ status });
    };
    const check = () => {
      const current = [...document.querySelectorAll('input[aria-label="Search"], input[placeholder="Search"], input[type="search"]')].filter(visible);
      if (current.length === 1 && !current[0].value) finish("cleared");
    };
    observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    timeout = setTimeout(() => finish("not-cleared"), 5000);
    buttons[0].click();
    queueMicrotask(check);
  });
}

async function clearIntuneSearchAfterProfiles(tabId, serial) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    const tab = await chrome.tabs.get(tabId);
    if (new URL(tab.url).origin !== "https://intune.microsoft.com") throw new Error("The Intune tab changed. Search was not cleared.");
    if (isIntuneAllDevices(tab.url)) {
      const frames = await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, world: "MAIN", func: clearIntuneProfileSearch, args: [serial] });
      const matches = frames.filter(frame => frame.result?.found);
      if (matches.length > 1 || frames.some(frame => frame.result?.ambiguous)) throw new Error("Multiple device search fields are open. Clear the Intune search manually.");
      if (matches.length === 1) {
        const cleared = await chrome.scripting.executeScript({ target: { tabId, frameIds: [matches[0].frameId] }, world: "MAIN", func: clearIntuneProfileSearch, args: [serial, true] });
        if (cleared?.[0]?.result?.status !== "cleared") throw new Error("Could not safely clear the device search. Use its X button manually.");
        return;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error("The All devices search was not ready. Clear it manually with the X button.");
}

function returnToIntuneAllDevices() {
  return new Promise(resolve => {
    let observer, timeout, finished = false;
    const finish = status => {
      if (finished) return;
      finished = true;
      observer?.disconnect(); clearTimeout(timeout);
      window.removeEventListener("hashchange", check);
      resolve({ status });
    };
    const check = () => {
      if (finished) return;
      // Wait for Save to leave the wizard before navigating away.
      if (location.origin !== "https://intune.microsoft.com") { finish("page-changed"); return; }
      if (!location.hash.includes('/Microsoft_Intune_ManagedDevices/ManagedDeviceMenu.MenuView/')) return;
      const links = [...document.querySelectorAll('a, [role="link"]')].filter(link => {
        const style = getComputedStyle(link);
        return link.isConnected && link.getClientRects().length && style.display !== "none" && style.visibility === "visible"
          && String(link.textContent || "").replace(/\s+/g, " ").trim().toLowerCase() === "devices | all devices";
      });
      if (links.length !== 1) return;
      const url = new URL(links[0].getAttribute("href"), location.href);
      if (url.origin !== "https://intune.microsoft.com" || !url.hash.startsWith('#view/Microsoft_Intune_DeviceSettings/DevicesMenu/')) { finish("wrong-link"); return; }
      links[0].click();
      finish("clicked");
    };
    observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
    window.addEventListener("hashchange", check);
    timeout = setTimeout(() => finish("not-found"), 20000);
    check();
  });
}

function saveIntuneProfileCategory(serial, category) {
  const visible = element => {
    const style = getComputedStyle(element);
    return element.isConnected && element.getClientRects().length && style.display !== "none" && style.visibility === "visible";
  };
  const name = element => String(element.getAttribute("aria-label") || element.textContent || "").replace(/\s+/g, " ").trim();
  const root = document.getElementById("root-container");
  if (!root || !visible(root) || document.getElementById("device-category-dropdown")) return { status: "not-review" };
  const review = [...root.querySelectorAll('a, [role="link"]')].filter(link => visible(link) && name(link).toLowerCase().startsWith("review + save"));
  if (review.length !== 1) return { status: "not-review" };
  const values = [...root.querySelectorAll('span, div, p, dt, dd')].filter(visible).map(element => String(element.textContent || "").replace(/\s+/g, " ").trim());
  if (!values.includes("Device category") || !values.includes(category) || !values.includes("Management name")
    || !values.some(value => value.toLowerCase().startsWith(`${serial.toLowerCase()}_`))) return { status: "review-mismatch" };
  const save = [...root.querySelectorAll('button, [role="button"]')].filter(button => visible(button) && name(button).toLowerCase() === "save"
    && !button.disabled && button.getAttribute("aria-disabled") !== "true");
  if (save.length !== 1) return { status: "not-ready" };
  save[0].click();
  return { status: "clicked" };
}

async function applyIntuneProfileCategory(tabId, serial, category) {
  const targetName = DEVICE_PROFILE_CATEGORIES[category];
  if (!targetName) throw new Error("Select a device category in Sidekick before beginning.");
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    const row = nextUnprofiledDevice();
    if (!(await refreshBeginWipeAccess()) || String(row?.internalSerial || "").trim() !== serial || row?.category !== category) throw new Error("The device list, category or role changed. No category was selected.");
    const url = new URL((await chrome.tabs.get(tabId)).url);
    if (url.origin !== "https://intune.microsoft.com" || !url.hash.includes('/Microsoft_Intune_ManagedDevices/PropertiesWizard.ReactView/')) throw new Error("The Edit properties page changed. No category was selected.");
    const initial = url.hash.split('/initialValues~/')[1]?.split('/formConfig~/')[0];
    let values;
    try { values = JSON.parse(decodeURIComponent(initial)); } catch { throw new Error("Could not verify the device in Edit properties. Select the category manually."); }
    if (!String(values.deviceIntuneName || "").toLowerCase().startsWith(`${serial.toLowerCase()}_`)
      && !String(values.deviceName || "").toLowerCase().includes(serial.toLowerCase())) throw new Error("The Edit properties device does not match the internal serial. No category was selected.");
    const frames = await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, world: "MAIN", func: selectIntuneDeviceCategory, args: [targetName] });
    const matches = frames.filter(frame => frame.result?.found);
    if (matches.length > 1) throw new Error("Multiple category forms are open. Select the category manually.");
    if (matches.length === 1) {
      const result = await chrome.scripting.executeScript({ target: { tabId, frameIds: [matches[0].frameId] }, world: "MAIN", func: selectIntuneDeviceCategory, args: [targetName, true] });
      if (result?.[0]?.result?.status !== "selected") throw new Error("Could not select the exact device category. No changes were saved.");
      if (!(await refreshBeginWipeAccess()) || String(nextUnprofiledDevice()?.internalSerial || "").trim() !== serial || nextUnprofiledDevice()?.category !== category
        || (await chrome.tabs.get(tabId)).url !== url.href) throw new Error("The device, category or page changed. Next was not clicked.");
      const next = await chrome.scripting.executeScript({ target: { tabId, frameIds: [matches[0].frameId] }, world: "MAIN", func: clickIntuneProfileNext, args: [targetName] });
      if (next?.[0]?.result?.status !== "review") throw new Error("Could not reach Review + save with the selected category. No changes were saved.");
      if (!(await refreshBeginWipeAccess()) || String(nextUnprofiledDevice()?.internalSerial || "").trim() !== serial || nextUnprofiledDevice()?.category !== category
        || (await chrome.tabs.get(tabId)).url !== url.href) throw new Error("The device, category or page changed. Save was not clicked.");
      const saved = await chrome.scripting.executeScript({ target: { tabId, frameIds: [matches[0].frameId] }, world: "MAIN", func: saveIntuneProfileCategory, args: [serial, targetName] });
      if (saved?.[0]?.result?.status !== "clicked") throw new Error("Could not verify the device, category and Save button on Review + save. No Save click was sent.");
      deviceToolSetText("prePrepStatus", `Save submitted for ${serial}. Waiting to return to Devices | All devices…`);
      const returned = await chrome.scripting.executeScript({ target: { tabId, frameIds: [0] }, world: "MAIN", func: returnToIntuneAllDevices });
      if (returned?.[0]?.result?.status !== "clicked") throw new Error("Save was submitted, but Sidekick could not return to Devices | All devices. Check Intune's save result before continuing.");
      await clearIntuneSearchAfterProfiles(tabId, serial);
      deviceToolSetText("prePrepStatus", `Category save submitted for ${serial}: ${targetName}. Returned to All devices and cleared the search.`);
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error("Device category was not ready. No changes were saved.");
}

// The observed device-list Search lives in the React blade, separate from menu search.
function fillIntuneProfileSearch(serial = null) {
  if (!location.hostname.endsWith(".reactblade.portal.azure.net")) return { found: false };
  const visible = element => {
    const style = getComputedStyle(element);
    return element.isConnected && element.getClientRects().length && style.display !== "none" && style.visibility === "visible" && style.opacity !== "0";
  };
  if (![...document.querySelectorAll('[role="grid"][aria-label="Managed Devices"], [role="table"][aria-label="Managed Devices"], table[aria-label="Managed Devices"]')].some(visible)) return { found: false };
  const findInputs = () => [...document.querySelectorAll('input[aria-label="Search"], input[placeholder="Search"], input[type="search"]')]
    .filter(input => input instanceof HTMLInputElement && visible(input) && !input.disabled && !input.readOnly);
  const inputs = findInputs();
  if (inputs.length !== 1) return { found: false, ambiguous: inputs.length > 1 };
  if (serial === null) return { found: true };
  const input = inputs[0];
  input.focus();
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, serial);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  const current = findInputs();
  if (current.length !== 1 || current[0].value !== serial) return { found: true, entered: false };
  for (const type of ["keydown", "keypress", "keyup"]) {
    current[0].dispatchEvent(new KeyboardEvent(type, { key: "Enter", code: "Enter", keyCode: 13, which: 13, charCode: type === "keypress" ? 13 : 0, bubbles: true, cancelable: true }));
  }
  return { found: true, entered: true };
}

function isIntuneAllDevices(url) {
  try {
    const candidate = new URL(url);
    const target = new URL(INTUNE_ALL_DEVICES_URL);
    return candidate.origin === target.origin && candidate.pathname === target.pathname
      && decodeURIComponent(candidate.hash).replace(/\/$/, "") === target.hash;
  } catch { return false; }
}

function openIntuneProfileDevice(serial) {
  return new Promise(resolve => {
    let observer, timeout, settledTimer;
    let finished = false, candidateHref = "";
    const normalize = value => String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
    const visible = element => {
      const style = getComputedStyle(element);
      return element.isConnected && element.getClientRects().length && style.display !== "none" && style.visibility === "visible";
    };
    const finish = status => {
      if (finished) return;
      finished = true;
      observer?.disconnect();
      clearTimeout(timeout);
      clearTimeout(settledTimer);
      resolve({ status });
    };
    const check = (settled = false) => {
      if (finished) return;
      const inputs = [...document.querySelectorAll('input[aria-label="Search"], input[placeholder="Search"], input[type="search"]')].filter(visible);
      if (inputs.length !== 1 || normalize(inputs[0].value) !== normalize(serial)) { finish("search-changed"); return; }
      const tables = [...document.querySelectorAll('[role="grid"][aria-label="Managed Devices"], [role="table"][aria-label="Managed Devices"], table[aria-label="Managed Devices"]')].filter(visible);
      const table = tables.length === 1 ? tables[0] : null;
      if (!table || table.getAttribute("aria-busy") === "true" || [...document.querySelectorAll('[role="progressbar"]')].some(visible)) {
        clearTimeout(settledTimer); settledTimer = null; candidateHref = ""; return;
      }
      const links = [...table.querySelectorAll('a[href]')].filter(link => {
        if (!visible(link)) return false;
        try {
          const url = new URL(link.getAttribute("href"), "https://intune.microsoft.com");
          return url.origin === "https://intune.microsoft.com" && url.hash.startsWith("#blade/Microsoft_Intune_ManagedDevices/ManagedDeviceMenu.MenuView/managedDeviceId/");
        } catch { return false; }
      });
      const named = links.filter(link => normalize(link.textContent).includes(normalize(serial)));
      // Intune also searches device serials when the displayed name is simply "iPad".
      const matches = named.length ? named : links.length === 1 ? links : [];
      if (named.length > 1 || (!named.length && links.length > 1)) {
        clearTimeout(settledTimer); settledTimer = null; candidateHref = "";
        return; // The old unfiltered rows may still be visible while search runs.
      }
      const link = matches[0];
      if (!link) { clearTimeout(settledTimer); settledTimer = null; candidateHref = ""; return; }
      const href = link.getAttribute("href");
      if (settled && href === candidateHref) {
        link.click();
        finish("opened");
      } else if (href !== candidateHref || !settledTimer) {
        candidateHref = href;
        clearTimeout(settledTimer);
        settledTimer = setTimeout(() => check(true), 800);
      }
    };
    observer = new MutationObserver(() => check());
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
    timeout = setTimeout(() => finish("not-found"), 20000);
    check();
  });
}

function clickIntunePropertiesEdit(serial, act = false) {
  const normalize = value => String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
  const visible = element => {
    const style = getComputedStyle(element);
    return element.isConnected && element.getClientRects().length && style.display !== "none" && style.visibility === "visible";
  };
  const enabled = element => visible(element) && !element.disabled && element.getAttribute("aria-disabled") !== "true";
  const tabs = document.getElementById("managed-device-resource-view-tab-view");
  if (!tabs || !visible(tabs)) return { found: false };
  const serialMatches = [...document.querySelectorAll('span, div, p, dd, td, [role="cell"]')]
    .some(element => visible(element) && normalize(element.textContent) === normalize(serial));
  if (!serialMatches) return { found: false };
  const properties = [...tabs.querySelectorAll('[role="tab"]')].filter(tab => enabled(tab)
    && ["properties", "properties tab"].includes(normalize(tab.getAttribute("aria-label") || tab.textContent)));
  if (properties.length !== 1) return { found: false };
  if (!act) return { found: true };
  return new Promise(resolve => {
    let observer, timeout, finished = false;
    const finish = status => {
      if (finished) return;
      finished = true;
      observer?.disconnect(); clearTimeout(timeout);
      resolve({ status });
    };
    const check = () => {
      if (finished) return;
      if (!tabs.isConnected || !properties[0].isConnected) { finish("device-changed"); return; }
      if (properties[0].getAttribute("aria-selected") !== "true") return;
      const basics = [...tabs.querySelectorAll('h1, h2, h3, h4, [role="heading"]')].filter(heading => visible(heading) && normalize(heading.textContent) === "basics");
      const edits = [...tabs.querySelectorAll('button, [role="button"]')].filter(button => enabled(button) && normalize(button.getAttribute("aria-label") || button.textContent) === "edit");
      if (basics.length !== 1 || edits.length !== 1) return;
      edits[0].click();
      finish("clicked");
    };
    observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
    timeout = setTimeout(() => finish("not-found"), 20000);
    if (properties[0].getAttribute("aria-selected") !== "true") properties[0].click();
    check();
  });
}

async function openIntunePropertiesForProfiles(tabId, serial) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    if (!(await refreshBeginWipeAccess()) || String(nextUnprofiledDevice()?.internalSerial || "").trim() !== serial) throw new Error("The device list or role changed. Properties was not edited.");
    const tab = await chrome.tabs.get(tabId);
    const url = new URL(tab.url);
    if (url.origin !== "https://intune.microsoft.com") throw new Error("The Intune tab changed. Properties was not edited.");
    if (url.hash.includes('/Microsoft_Intune_ManagedDevices/ManagedDeviceMenu.MenuView/')) {
      const frames = await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, world: "MAIN", func: clickIntunePropertiesEdit, args: [serial] });
      const matches = frames.filter(frame => frame.result?.found);
      if (matches.length > 1) throw new Error("Multiple matching device views are open. Open Properties manually.");
      if (matches.length === 1) {
        const result = await chrome.scripting.executeScript({ target: { tabId, frameIds: [matches[0].frameId] }, world: "MAIN", func: clickIntunePropertiesEdit, args: [serial, true] });
        if (result?.[0]?.result?.status !== "clicked") throw new Error("Could not open Properties and its Basics Edit button. No property changes were saved.");
        while (Date.now() < deadline) {
          const current = new URL((await chrome.tabs.get(tabId)).url);
          if (current.origin === "https://intune.microsoft.com" && current.hash.includes('/Microsoft_Intune_ManagedDevices/PropertiesWizard.ReactView/')) {
            deviceToolSetText("prePrepStatus", `Opened Properties → Edit for ${serial}. Profile test finished; no changes saved.`);
            return;
          }
          await new Promise(resolve => setTimeout(resolve, 250));
        }
        throw new Error("Edit was clicked, but the Edit properties form did not open. Check Intune.");
      }
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error("Could not verify the device serial and Properties tab. Open the matching device manually.");
}

async function searchIntuneForProfiles(tabId, serial, category = nextUnprofiledDevice()?.category) {
  if (!DEVICE_PROFILE_CATEGORIES[category]) throw new Error("Select a device category for the next unfinished device in Sidekick before beginning.");
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    if (!(await refreshBeginWipeAccess()) || String(nextUnprofiledDevice()?.internalSerial || "").trim() !== serial) {
      throw new Error("The device list or role changed. No profile search was submitted.");
    }
    const tab = await chrome.tabs.get(tabId);
    if (!isIntuneAllDevices(tab.url) && !isIntuneAllDevices(tab.pendingUrl)) throw new Error("The Intune tab changed. Open All devices and try again.");
    let frames;
    try {
      frames = await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, world: "MAIN", func: fillIntuneProfileSearch });
    } catch (error) {
      if (/permission|cannot access|not allowed/i.test(error.message || "")) throw new Error("Reload Sidekick and allow access to Intune and its embedded device pages, then try again.");
      await new Promise(resolve => setTimeout(resolve, 250));
      continue;
    }
    const matches = frames.filter(frame => frame.result?.found);
    if (matches.length > 1 || frames.some(frame => frame.result?.ambiguous)) throw new Error("Multiple Intune device search fields are open. Close the extra views and try again.");
    if (matches.length === 1) {
      const result = await chrome.scripting.executeScript({ target: { tabId, frameIds: [matches[0].frameId] }, world: "MAIN", func: fillIntuneProfileSearch, args: [serial] });
      if (!result?.[0]?.result?.entered) throw new Error("Could not enter the internal serial in Intune's device search. Please try again.");
      if (!(await refreshBeginWipeAccess()) || String(nextUnprofiledDevice()?.internalSerial || "").trim() !== serial
        || !isIntuneAllDevices((await chrome.tabs.get(tabId)).url)) throw new Error("The device list, role or Intune page changed. No device was opened.");
      deviceToolSetText("prePrepStatus", `Opening the Intune result for ${serial}…`);
      const opened = await chrome.scripting.executeScript({ target: { tabId, frameIds: [matches[0].frameId] }, world: "MAIN", func: openIntuneProfileDevice, args: [serial] });
      const status = opened?.[0]?.result?.status;
      if (status === "multiple") throw new Error("Multiple devices match the Intune search. Select the correct device manually.");
      if (status === "search-changed") throw new Error("The Intune search changed. No device was opened.");
      if (status !== "opened") throw new Error("No unique Intune device result was ready. Check the results and try again.");
      deviceToolSetText("prePrepStatus", `Opening Properties and Edit for ${serial}…`);
      await openIntunePropertiesForProfiles(tabId, serial);
      await applyIntuneProfileCategory(tabId, serial, category);
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error("Intune's Managed Devices search is not ready. Open All devices and click Begin Adding Profiles again.");
}

document.getElementById("beginAddingProfilesBtn")?.addEventListener("click", async event => {
  const button = event.currentTarget;
  const wipeButton = document.getElementById("beginWipeBtn");
  if (button.disabled || wipeButton?.disabled) return;
  button.disabled = true;
  if (wipeButton) wipeButton.disabled = true;
  try {
    if (!(await refreshBeginWipeAccess())) return;
    const serial = String(nextUnprofiledDevice()?.internalSerial || "").trim();
    if (!serial) { deviceToolSetText("prePrepStatus", "No devices with an internal serial number are waiting for a profile."); return; }
    const category = nextUnprofiledDevice()?.category;
    if (!DEVICE_PROFILE_CATEGORIES[category]) { deviceToolSetText("prePrepStatus", "Select a device category for the first device before beginning."); return; }
    deviceToolSetText("prePrepStatus", "Opening Intune and searching the next unfinished internal serial…");
    const tabs = await chrome.tabs.query({});
    const existing = tabs.find(tab => isIntuneAllDevices(tab.url) || isIntuneAllDevices(tab.pendingUrl));
    const target = existing ? await chrome.tabs.update(existing.id, { active: true }) : await chrome.tabs.create({ url: INTUNE_ALL_DEVICES_URL });
    if (existing) await chrome.windows.update(existing.windowId, { focused: true });
    await runPendingProfiles(target.id);
  } catch (error) {
    deviceToolSetText("prePrepStatus", error.message || "Could not search Intune. Please try again.");
  } finally {
    button.disabled = false;
    if (wipeButton) wipeButton.disabled = false;
  }
});

// Runs in Entra's page context so its input handlers receive the native value change.
function fillEntraDeviceSearch(xpath, serial = null) {
  const label = "Search by name or device ID or object ID";
  const findInput = () => {
    const labelled = document.querySelector(`input[aria-label="${label}"], input[placeholder="${label}"]`);
    if (labelled) return labelled;
    // The supplied XPath belongs to the embedded device blade, not the portal shell.
    if (!location.hostname.endsWith(".reactblade.portal.azure.net")) return null;
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  };
  const input = findInput();
  if (!(input instanceof HTMLInputElement) || !input.isConnected || input.disabled || input.readOnly) return { found: false };
  const style = getComputedStyle(input);
  if (!input.getClientRects().length || style.display === "none" || style.visibility !== "visible" || style.opacity === "0") return { found: false };
  if (serial === null) return { found: true };
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  input.focus();
  setter.call(input, serial);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  const searchInput = findInput();
  if (!(searchInput instanceof HTMLInputElement) || searchInput.value !== serial) return { found: true, entered: false };
  for (const type of ["keydown", "keypress", "keyup"]) {
    searchInput.dispatchEvent(new KeyboardEvent(type, { key: "Enter", code: "Enter", keyCode: 13, charCode: type === "keypress" ? 13 : 0, which: 13, bubbles: true, cancelable: true }));
  }
  return { found: true, entered: true };
}

function openMatchingEntraDevice(xpath, serial) {
  return new Promise(resolve => {
    let observer;
    let timeout;
    let finished = false;
    const finish = status => {
      if (finished) return;
      finished = true;
      observer?.disconnect();
      clearTimeout(timeout);
      resolve({ status });
    };
    const check = () => {
      const label = "Search by name or device ID or object ID";
      const search = document.querySelector(`input[aria-label="${label}"], input[placeholder="${label}"]`)
        || document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (!search || search.value.trim().toLowerCase() !== serial.trim().toLowerCase()) {
        finish("search-changed");
        return true;
      }
      const links = [...document.querySelectorAll('[role="grid"] [role="row"] a, [role="grid"] [role="row"] [role="link"]')];
      const matches = [...new Set(links)].filter(link => {
        const name = (link.textContent || "").trim().toLowerCase();
        const style = getComputedStyle(link);
        return name.includes(serial.trim().toLowerCase()) && link.isConnected
          && link.getClientRects().length && style.visibility === "visible"
          && style.display !== "none" && link.getAttribute("aria-disabled") !== "true";
      });
      if (matches.length > 1) { finish("multiple"); return true; }
      if (matches.length === 1) {
        matches[0].click();
        finish("opened");
        return true;
      }
      return false;
    };
    if (check()) return;
    // Search results arrive asynchronously; the search itself still starts immediately.
    observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
    timeout = setTimeout(() => finish("not-found"), 20000);
  });
}

function clickEntraDeviceManage(serial) {
  return new Promise(resolve => {
    let observer;
    let timeout;
    let finished = false;
    const finish = status => {
      if (finished) return;
      finished = true;
      observer?.disconnect();
      clearTimeout(timeout);
      resolve({ status });
    };
    const check = () => {
      if (!location.hash.includes("/DeviceDetailsMenuBlade/")) return false;
      const visible = element => {
        const style = getComputedStyle(element);
        return element.isConnected && element.getClientRects().length
          && style.visibility === "visible" && style.display !== "none";
      };
      const headings = [...document.querySelectorAll('h1, h2, [role="heading"]')];
      const heading = headings.find(element => visible(element)
        && (element.textContent || "").toLowerCase().includes(serial.trim().toLowerCase()));
      if (!heading) return false;
      const region = heading.closest('[role="region"], section') || document;
      const buttons = [...region.querySelectorAll('[role="toolbar"] button, [role="toolbar"] [role="button"]')];
      const matches = buttons.filter(button => visible(button) && !button.disabled
        && button.getAttribute("aria-disabled") !== "true"
        && (button.getAttribute("aria-label") || button.textContent || "").trim().toLowerCase() === "manage");
      if (matches.length > 1) { finish("multiple"); return true; }
      if (matches.length === 1) {
        matches[0].click();
        finish("clicked");
        return true;
      }
      return false;
    };
    if (check()) return;
    observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
    timeout = setTimeout(() => finish("not-found"), 20000);
  });
}

function openEntraRemoveAppsConfiguration(serial) {
  return new Promise(resolve => {
    let observer;
    let timeout;
    let finished = false;
    let menuOpened = false;
    const finish = status => {
      if (finished) return;
      finished = true;
      observer?.disconnect();
      clearTimeout(timeout);
      resolve({ status });
    };
    const visible = element => {
      const style = getComputedStyle(element);
      return element.isConnected && element.getClientRects().length
        && style.visibility === "visible" && style.display !== "none";
    };
    const enabled = element => visible(element) && !element.disabled && element.getAttribute("aria-disabled") !== "true";
    const name = element => (element.getAttribute("aria-label") || element.getAttribute("title") || element.textContent || "").trim().toLowerCase();
    const check = () => {
      if (finished) return true;
      if (!location.hash.includes("/Microsoft_Intune_Devices/DeviceSettingsMenuBlade/")) return false;
      const heading = [...document.querySelectorAll('h1, h2, [role="heading"]')].find(element => visible(element)
        && (element.textContent || "").toLowerCase().includes(serial.trim().toLowerCase()));
      if (!heading) return false;
      const items = [...document.querySelectorAll('[role="menuitem"]')].filter(element => enabled(element)
        && name(element) === "remove apps and configuration");
      if (items.length > 1) { finish("multiple"); return true; }
      if (items.length === 1) {
        items[0].click();
        finish("opened");
        return true;
      }
      if (!menuOpened) {
        const region = heading.closest('[role="region"], section') || document;
        const buttons = [...region.querySelectorAll('[role="toolbar"] button, [role="toolbar"] [role="button"]')]
          .filter(element => enabled(element) && name(element) === "show more options");
        if (buttons.length > 1) { finish("multiple"); return true; }
        if (buttons.length === 1) {
          menuOpened = true;
          buttons[0].click();
          return check();
        }
      }
      return false;
    };
    if (check()) return;
    observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
    timeout = setTimeout(() => finish("not-found"), 20000);
  });
}

function selectEntraAppOption(select = false) {
  const name = element => (element.getAttribute("aria-label") || element.textContent || "").trim().toLowerCase();
  const enabled = element => {
    const style = getComputedStyle(element);
    return element.isConnected && element.getClientRects().length && !element.disabled
      && element.getAttribute("aria-disabled") !== "true" && style.visibility === "visible" && style.display !== "none";
  };
  const inWizard = [...document.querySelectorAll('[role="tab"]')]
    .some(element => name(element) === "apps and configuration to remove");
  const adds = [...document.querySelectorAll('[role="menubar"] [role="menuitem"]')]
    .filter(element => enabled(element) && name(element) === "add");
  if (!inWizard || adds.length !== 1) return { found: false };
  if (!select) return { found: true };
  return new Promise(resolve => {
    let observer;
    let timeout;
    let finished = false;
    const finish = status => {
      if (finished) return;
      finished = true;
      observer?.disconnect();
      clearTimeout(timeout);
      resolve({ status });
    };
    const check = () => {
      if (finished) return true;
      const apps = [...document.querySelectorAll('[role="menuitem"]')]
        .filter(element => enabled(element) && name(element) === "app");
      if (apps.length > 1) { finish("multiple"); return true; }
      if (apps.length === 1) { apps[0].click(); finish("selected"); return true; }
      return false;
    };
    // Install the observer before opening Add so asynchronous menu rendering is caught.
    observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    timeout = setTimeout(() => finish("not-found"), 20000);
    if (!check()) { adds[0].click(); check(); }
  });
}

async function openAppPickerForWipeDevice(tabId, serial) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    if (deviceSidekickMode !== "wipe" || !(await refreshBeginWipeAccess())) return;
    const tab = await chrome.tabs.get(tabId);
    const url = new URL(tab.url);
    const deviceName = url.hash.match(/\/deviceName\/([^/]+)/)?.[1];
    if (url.origin === "https://entra.microsoft.com" && url.hash.includes("/SyncPayloadsWizard.ReactView/")
      && deviceName && decodeURIComponent(deviceName).toLowerCase().includes(serial.trim().toLowerCase())) {
      const frames = await chrome.scripting.executeScript({
        target: { tabId, allFrames: true }, world: "MAIN", func: selectEntraAppOption
      });
      const matches = frames.filter(frame => frame.result?.found);
      if (matches.length > 1) throw new Error("Multiple removal setup pages are open. Close the extra pages and try again.");
      if (matches.length === 1) {
        const result = await chrome.scripting.executeScript({
          target: { tabId, frameIds: [matches[0].frameId] }, world: "MAIN", func: selectEntraAppOption, args: [true]
        });
        if (result?.[0]?.result?.status !== "selected") throw new Error("Could not select App from the Add menu. Check the removal setup page.");
        return matches[0].frameId;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error("The Add menu for the matching device did not become available. Check the removal setup page.");
}

function clickEntraRemovalNext() {
  return new Promise(resolve => {
    let observer;
    let timeout;
    let finished = false;
    const finish = status => {
      if (finished) return;
      finished = true;
      observer?.disconnect();
      clearTimeout(timeout);
      resolve({ status });
    };
    const check = () => {
      if (finished) return;
      const tabs = [...document.querySelectorAll('[role="tab"]')];
      if (!tabs.some(tab => (tab.textContent || "").trim().toLowerCase() === "apps and configuration to remove")) return;
      const buttons = [...document.querySelectorAll('button, [role="button"]')].filter(button => {
        const style = getComputedStyle(button);
        return (button.getAttribute("aria-label") || button.textContent || "").trim().toLowerCase() === "next"
          && button.isConnected && button.getClientRects().length && !button.disabled
          && button.getAttribute("aria-disabled") !== "true" && style.visibility === "visible" && style.display !== "none";
      });
      if (buttons.length > 1) { finish("multiple"); return; }
      if (buttons.length === 1) { buttons[0].click(); finish("clicked"); }
    };
    observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
    timeout = setTimeout(() => finish("not-found"), 20000);
    check();
  });
}

function clickEntraRemovalConfirm(expectedApps) {
  return new Promise(resolve => {
    let observer;
    let timeout;
    let finished = false;
    const normalize = value => (value || "").replace(/\s+/g, " ").trim().toLowerCase();
    const expected = (expectedApps || []).map(normalize).sort();
    const finish = status => {
      if (finished) return;
      finished = true;
      observer?.disconnect();
      clearTimeout(timeout);
      resolve({ status });
    };
    if (!expected.length) { finish("missing-apps"); return; }
    const visible = element => {
      const style = getComputedStyle(element);
      return element.isConnected && element.getClientRects().length && style.visibility === "visible" && style.display !== "none";
    };
    const check = () => {
      if (finished) return;
      const reviews = [...document.querySelectorAll('[role="tabpanel"]')].filter(panel => {
        const label = panel.getAttribute("aria-label") || (panel.getAttribute("aria-labelledby") || "").split(/\s+/)
          .map(id => document.getElementById(id)?.textContent || "").join(" ");
        return visible(panel) && normalize(label) === "review + remove";
      });
      if (reviews.length !== 1) return;
      const rows = [...reviews[0].querySelectorAll('[role="grid"] [role="row"]')]
        .map(row => [...row.querySelectorAll('[role="gridcell"]')]).filter(cells => cells.length);
      if (!rows.length) return;
      const actual = rows.map(cells => normalize(cells[0].textContent)).sort();
      if (rows.some(cells => normalize(cells[1]?.textContent) !== "application")
        || actual.length !== expected.length || actual.some((name, index) => name !== expected[index])) {
        finish("selection-changed"); return;
      }
      const buttons = [...document.querySelectorAll('button, [role="button"]')].filter(button => visible(button)
        && !button.disabled && button.getAttribute("aria-disabled") !== "true"
        && normalize(button.getAttribute("aria-label") || button.textContent) === "remove");
      if (buttons.length > 1) { finish("multiple"); return; }
      if (buttons.length === 1) { buttons[0].click(); finish("clicked"); }
    };
    observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
    timeout = setTimeout(() => finish("not-found"), 20000);
    check();
  });
}

function revokeEntraDeviceLicenses(serial) {
  return new Promise(resolve => {
    let observer;
    let timeout;
    let finished = false;
    let revokeClicked = false;
    let overflowClicked = false;
    const normalize = value => (value || "").replace(/\s+/g, " ").trim().toLowerCase();
    const finish = status => {
      if (finished) return;
      finished = true;
      observer?.disconnect();
      clearTimeout(timeout);
      resolve({ status });
    };
    const visible = element => {
      const style = getComputedStyle(element);
      return element.isConnected && element.getClientRects().length && style.visibility === "visible" && style.display !== "none";
    };
    const enabled = element => visible(element) && !element.disabled && element.getAttribute("aria-disabled") !== "true";
    const name = element => normalize(element.getAttribute("aria-label") || element.textContent);
    const check = () => {
      if (finished) return;
      if (location.origin !== "https://entra.microsoft.com"
        || !location.hash.includes("/Microsoft_Intune_Devices/DeviceSettingsMenuBlade/")) return;
      const heading = [...document.querySelectorAll('h1, h2, [role="heading"]')]
        .find(element => visible(element) && normalize(element.textContent).includes(normalize(serial)));
      if (!heading) return;
      const dialogs = [...document.querySelectorAll('[role="dialog"], [role="alertdialog"], dialog')].filter(visible);
      if (dialogs.length) {
        if (!revokeClicked || dialogs.length !== 1) { finish("unexpected-dialog"); return; }
        const dialog = dialogs[0];
        const title = normalize(dialog.getAttribute("aria-label") || (dialog.getAttribute("aria-labelledby") || "").split(/\s+/)
          .map(id => document.getElementById(id)?.textContent || "").join(" ")
          || dialog.querySelector('h1, h2, [role="heading"]')?.textContent);
        if (!title.startsWith("revoke all licensed apps") || !title.includes(normalize(serial))) {
          finish("unexpected-dialog"); return;
        }
        const yes = [...dialog.querySelectorAll('button, [role="button"]')].filter(element => enabled(element) && name(element) === "yes");
        if (yes.length > 1) { finish("multiple"); return; }
        if (yes.length === 1) { yes[0].click(); finish("confirmed"); }
        return;
      }
      if (revokeClicked) return;
      const region = heading.closest('section.fxs-blade, [role="region"], section') || document;
      const buttons = [...region.querySelectorAll('[role="toolbar"] button, [role="toolbar"] [role="button"]')];
      const revoke = [...buttons, ...document.querySelectorAll('[role="menu"] [role="menuitem"]')]
        .filter(element => enabled(element) && name(element) === "revoke licenses");
      if (revoke.length > 1) { finish("multiple"); return; }
      if (revoke.length === 1) {
        revokeClicked = true;
        revoke[0].click();
        queueMicrotask(check);
        return;
      }
      if (!overflowClicked) {
        const more = buttons.filter(element => enabled(element) && name(element) === "show more options");
        if (more.length === 1) {
          overflowClicked = true;
          more[0].click();
          queueMicrotask(check);
        }
      }
    };
    observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
    timeout = setTimeout(() => finish("not-found"), 30000);
    check();
  });
}

async function requestDeviceDecision(serial, titleText, descriptionText, dialogId) {
  const currentWindow = await chrome.windows.getCurrent();
  await chrome.windows.update(currentWindow.id, { focused: true });
  return new Promise(resolve => {
    const dialog = document.createElement("dialog");
    dialog.id = dialogId;
    dialog.className = "prep-assignment-dialog";
    dialog.setAttribute("aria-labelledby", `${dialogId}Title`);
    const title = document.createElement("h2");
    title.id = `${dialogId}Title`;
    title.textContent = titleText;
    const description = document.createElement("p");
    description.textContent = `Internal serial: ${serial}. ${descriptionText}`;
    const actions = document.createElement("div");
    actions.className = "queue-actions";
    const no = document.createElement("button");
    no.type = "button";
    no.textContent = "No";
    const yes = document.createElement("button");
    yes.type = "button";
    yes.textContent = "Yes";
    let finished = false;
    const finish = approved => {
      if (finished) return;
      finished = true;
      dialog.close();
      dialog.remove();
      resolve(approved);
    };
    no.addEventListener("click", () => finish(false));
    yes.addEventListener("click", () => finish(true));
    dialog.addEventListener("cancel", event => { event.preventDefault(); finish(false); });
    dialog.addEventListener("close", () => finish(false));
    actions.append(no, yes);
    dialog.append(title, description, actions);
    document.body.append(dialog);
    dialog.showModal();
    no.focus();
  });
}

async function requestContinueDeviceWipe(serial) {
  return await requestDeviceDecision(serial, "Continue to wipe?",
    "This will erase the device's data and remove it from Intune management.", "sidekickContinueWipeDialog");
}

async function requestWipeOutcome(serial) {
  return await requestDeviceDecision(serial, "Did the wipe go through?",
    "Choose Yes if the wipe went through. Choose No to stop and complete the wipe manually.", "sidekickWipeOutcomeDialog");
}

function nextUnwipedDevice() {
  return prePrepRows.find(row => !row.wiped && String(row.internalSerial || "").trim());
}

async function finishWipeDevice(serial) {
  const row = nextUnwipedDevice();
  if (!row || String(row.internalSerial).trim() !== serial) throw new Error("The device list changed. Check the completed device manually.");
  row.wiped = true;
  await saveDeviceDraft();
  renderPrePrepRows();
  const next = nextUnwipedDevice();
  const currentWindow = await chrome.windows.getCurrent();
  await chrome.windows.update(currentWindow.id, { focused: true });
  return new Promise(resolve => {
    const dialog = document.createElement("dialog");
    dialog.className = "prep-assignment-dialog";
    dialog.setAttribute("aria-label", "Delete the wiped device");
    const title = document.createElement("h2");
    title.textContent = "Delete the device from the list";
    const message = document.createElement("p");
    message.textContent = `Internal serial: ${serial}. Delete this device from Entra's device list manually.${next ? " Once deleted and back at the main All devices page, click Next device to begin the next listed device." : " There are no more devices to wipe."}`;
    const actions = document.createElement("div");
    actions.className = "queue-actions";
    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "Close";
    let finished = false;
    const finish = value => {
      if (finished) return;
      finished = true;
      dialog.close();
      dialog.remove();
      resolve(value);
    };
    close.addEventListener("click", () => finish(null));
    actions.append(close);
    if (next) {
      const advance = document.createElement("button");
      advance.type = "button";
      advance.textContent = "Next device";
      advance.addEventListener("click", () => finish({ id: next.id, serial: String(next.internalSerial).trim() }));
      actions.append(advance);
    }
    dialog.addEventListener("cancel", event => { event.preventDefault(); finish(null); });
    dialog.addEventListener("close", () => finish(null));
    dialog.append(title, message, actions);
    document.body.append(dialog);
    dialog.showModal();
    close.focus();
  });
}

function clickEntraAllDevicesBreadcrumb() {
  const visible = element => {
    const style = getComputedStyle(element);
    return element.isConnected && element.getClientRects().length && style.visibility === "visible" && style.display !== "none";
  };
  const links = [...document.querySelectorAll('a, [role="link"]')].filter(link => visible(link)
    && (link.textContent || "").replace(/\s+/g, " ").trim().toLowerCase() === "devices | all devices");
  if (links.length !== 1) return { status: "not-found" };
  const url = new URL(links[0].getAttribute("href"), location.href);
  if (url.origin !== "https://entra.microsoft.com" || !url.hash.includes("/Microsoft_AAD_Devices/DevicesMenuBlade/")) return { status: "wrong-link" };
  links[0].click();
  return { status: "clicked" };
}

function selectEntraDeviceCheckbox(xpath, serial) {
  return new Promise(resolve => {
    let observer;
    let timeout;
    let finished = false;
    let clicked = false;
    const normalize = value => (value || "").replace(/\s+/g, " ").trim().toLowerCase();
    const visible = element => {
      const style = getComputedStyle(element);
      return element.isConnected && element.getClientRects().length && style.visibility === "visible" && style.display !== "none";
    };
    const finish = status => {
      if (finished) return;
      finished = true;
      observer?.disconnect();
      clearTimeout(timeout);
      resolve({ status });
    };
    const check = () => {
      if (finished) return;
      const search = document.querySelector('input[aria-label="Search by name or device ID or object ID"], input[placeholder="Search by name or device ID or object ID"]')
        || document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (!search || normalize(search.value) !== normalize(serial)) { finish("search-changed"); return; }
      const grids = [...document.querySelectorAll('[role="grid"]')].filter(grid => visible(grid) && normalize(grid.getAttribute("aria-label")) === "all devices");
      if (grids.length !== 1 || grids[0].getAttribute("aria-busy") === "true") return;
      const grid = grids[0];
      const nameIndex = [...grid.querySelectorAll('[role="columnheader"]')].findIndex(header => normalize(header.textContent) === "name");
      if (nameIndex < 0) return;
      const rows = [...grid.querySelectorAll('[role="row"]')].filter(row => visible(row) && row.querySelector('[role="gridcell"]'));
      const matches = rows.filter(row => {
        const cell = [...row.querySelectorAll('[role="gridcell"]')][nameIndex];
        const link = cell?.querySelector('a, [role="link"]');
        return link && normalize(link.textContent).includes(normalize(serial));
      });
      if (matches.length > 1) { finish("multiple"); return; }
      if (!matches.length) return;
      const checked = checkbox => checkbox?.checked === true || checkbox?.getAttribute("aria-checked") === "true";
      if (rows.some(row => row !== matches[0] && checked(row.querySelector('[role="checkbox"], input[type="checkbox"]')))) {
        finish("other-selected"); return;
      }
      const checkbox = matches[0].querySelector('[role="checkbox"], input[type="checkbox"]');
      if (!checkbox || !visible(checkbox) || checkbox.disabled || checkbox.getAttribute("aria-disabled") === "true") return;
      if (checked(checkbox)) { finish("selected"); return; }
      if (!clicked) {
        clicked = true;
        checkbox.click();
        queueMicrotask(check);
      }
    };
    observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
    timeout = setTimeout(() => finish("not-found"), 20000);
    check();
  });
}

async function selectDeviceAfterWipe(tabId, serial) {
  if (!(await requestWipeOutcome(serial))) {
    deviceToolSetText("prePrepStatus", "Wipe not confirmed. Automation stopped. Please complete the wipe manually in Entra.");
    alert("Automation stopped. Please complete the wipe manually in Entra.");
    return;
  }
  if (deviceSidekickMode !== "wipe" || !(await refreshBeginWipeAccess())
    || String(nextUnwipedDevice()?.internalSerial || "").trim() !== serial) throw new Error("The device list, role, or mode changed. Automation stopped.");
  const tab = await chrome.tabs.get(tabId);
  if (new URL(tab.url).origin !== "https://entra.microsoft.com") throw new Error("The Entra tab changed. Automation stopped.");
  await chrome.tabs.update(tabId, { active: true });
  await chrome.windows.update(tab.windowId, { focused: true });
  const breadcrumb = await chrome.scripting.executeScript({
    target: { tabId, frameIds: [0] }, world: "MAIN", func: clickEntraAllDevicesBreadcrumb
  });
  if (breadcrumb?.[0]?.result?.status !== "clicked") throw new Error("Could not find the Devices | All devices breadcrumb. Select the matching device manually.");
  deviceToolSetText("prePrepStatus", `Wipe confirmed by user. Opened All devices for internal serial ${serial}.`);
  return await finishWipeDevice(serial);
}

function wipeEntraApprovedDevice(serial, approvedHash) {
  return new Promise(resolve => {
    let observer;
    let timeout;
    let finished = false;
    let wipeClicked = false;
    const normalize = value => (value || "").replace(/\s+/g, " ").trim().toLowerCase();
    const finish = status => {
      if (finished) return;
      finished = true;
      observer?.disconnect();
      clearTimeout(timeout);
      resolve({ status });
    };
    const visible = element => {
      const style = getComputedStyle(element);
      return element.isConnected && element.getClientRects().length && style.visibility === "visible" && style.display !== "none";
    };
    const enabled = element => visible(element) && !element.disabled && element.getAttribute("aria-disabled") !== "true";
    const name = element => normalize(element.getAttribute("aria-label") || element.textContent);
    const check = () => {
      if (finished) return;
      if (location.origin !== "https://entra.microsoft.com" || location.hash !== approvedHash) { finish("device-changed"); return; }
      const heading = [...document.querySelectorAll('h1, h2, [role="heading"]')]
        .find(element => visible(element) && normalize(element.textContent).includes(normalize(serial)));
      if (!heading) { finish("device-changed"); return; }
      const dialogs = [...document.querySelectorAll('[role="dialog"], [role="alertdialog"], dialog')].filter(visible);
      if (dialogs.length) {
        if (!wipeClicked || dialogs.length !== 1) { finish("unexpected-dialog"); return; }
        const dialog = dialogs[0];
        const title = normalize(dialog.getAttribute("aria-label") || (dialog.getAttribute("aria-labelledby") || "").split(/\s+/)
          .map(id => document.getElementById(id)?.textContent || "").join(" ")
          || dialog.querySelector('h1, h2, [role="heading"]')?.textContent);
        if (!title.startsWith("are you sure you want to wipe ") || !title.includes(normalize(serial))) {
          finish("unexpected-dialog"); return;
        }
        const wipe = [...dialog.querySelectorAll('button, [role="button"]')].filter(element => enabled(element) && name(element) === "wipe");
        if (wipe.length > 1) { finish("multiple"); return; }
        if (wipe.length === 1) { wipe[0].click(); finish("confirmed"); }
        return;
      }
      if (wipeClicked) return;
      const region = heading.closest('section.fxs-blade, [role="region"], section') || document;
      const buttons = [...region.querySelectorAll('[role="toolbar"] button, [role="toolbar"] [role="button"]')]
        .filter(element => enabled(element) && name(element) === "wipe");
      if (buttons.length > 1) { finish("multiple"); return; }
      if (buttons.length === 1) {
        wipeClicked = true;
        buttons[0].click();
        queueMicrotask(check);
      }
    };
    observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
    timeout = setTimeout(() => finish("not-found"), 20000);
    check();
  });
}

function selectManagedAacApps(serial) {
  return new Promise(resolve => {
    let observer;
    let timeout;
    let finished = false;
    let clickedName = null;
    const appFamily = /^(?:lamp words for life|proloquo2go aac|touchchat hd|dialogue|grid for ipad)\b/i;
    const normalize = value => (value || "").replace(/\s+/g, " ").trim();
    const visible = element => {
      const style = getComputedStyle(element);
      return element.isConnected && element.getClientRects().length && style.visibility === "visible" && style.display !== "none";
    };
    const finish = (status, count = 0, appNames = []) => {
      if (finished) return;
      finished = true;
      observer?.disconnect();
      clearTimeout(timeout);
      resolve({ status, count, appNames });
    };
    const check = () => {
      if (finished) return;
      const deviceName = location.hash.match(/\/deviceName\/([^/]+)/)?.[1];
      if (!location.hash.includes("/SyncPayloadsWizard.ReactView/") || !deviceName
        || !decodeURIComponent(deviceName).toLowerCase().includes(serial.trim().toLowerCase())) {
        finish("wrong-device"); return;
      }
      const heading = [...document.querySelectorAll('h1, h2, [role="heading"]')]
        .find(element => visible(element) && normalize(element.textContent).toLowerCase() === "select managed apps");
      if (!heading) return;
      const panel = heading.closest('section.fxs-blade, [role="region"], [role="dialog"], section, aside');
      if (!panel || panel.querySelector('[aria-busy="true"]')) return;
      const grids = [...panel.querySelectorAll('[role="grid"]')];
      const appGrid = grids.find(grid => grid.getAttribute("aria-label") !== "Selected apps" && [...grid.querySelectorAll('[role="columnheader"]')]
        .some(header => normalize(header.textContent).toLowerCase() === "app name"));
      if (!appGrid) return;
      const selectedGrids = grids.filter(grid => grid !== appGrid);
      if (selectedGrids.length !== 1) { finish("ambiguous-list"); return; }
      const selectedNames = [...selectedGrids[0].querySelectorAll('[role="row"]')]
        .map(row => normalize(row.querySelector('[role="gridcell"]')?.textContent))
        .filter(name => name && name.toLowerCase() !== "no apps selected");
      if (selectedNames.some(name => !appFamily.test(name))) { finish("unrelated-selection"); return; }
      const selected = new Set(selectedNames.map(name => name.toLowerCase()));
      if (clickedName && !selected.has(clickedName.toLowerCase())) return;
      clickedName = null;
      const headers = [...appGrid.querySelectorAll('[role="columnheader"]')];
      const nameColumn = headers.findIndex(header => normalize(header.textContent).toLowerCase() === "app name");
      const candidates = [...appGrid.querySelectorAll('[role="row"]')].map(row => {
        const cells = [...row.querySelectorAll('[role="gridcell"]')];
        return { row, name: normalize(cells[nameColumn]?.textContent) };
      }).filter(item => item.name && appFamily.test(item.name) && visible(item.row));
      const next = candidates.find(item => !selected.has(item.name.toLowerCase()));
      if (next) {
        if (next.row.getAttribute("aria-disabled") === "true") { finish("disabled-app"); return; }
        clickedName = next.name;
        next.row.click();
        queueMicrotask(check);
        return;
      }
      if (!selectedNames.length) return;
      const buttons = [...panel.querySelectorAll('button, [role="button"]')].filter(button => visible(button)
        && !button.disabled && button.getAttribute("aria-disabled") !== "true"
        && normalize(button.getAttribute("aria-label") || button.textContent).toLowerCase() === "select");
      if (buttons.length > 1) { finish("ambiguous-select"); return; }
      if (buttons.length === 1) {
        buttons[0].click();
        finish("selected", selectedNames.length, selectedNames);
      }
    };
    observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
    timeout = setTimeout(() => finish("not-found"), 20000);
    check();
  });
}

async function searchFirstWipeDevice(tabId, serial) {
  if (deviceSidekickMode !== "wipe" || !(await refreshBeginWipeAccess())) return;
  const tab = await chrome.tabs.get(tabId);
  if (!isEntraDeviceOverview(tab.url)) throw new Error("Open the Entra device overview, then click Begin Wipe again.");
  try {
    // Discover the target without editing any field, then enter the serial once.
    const frames = await chrome.scripting.executeScript({
      target: { tabId, allFrames: true }, world: "MAIN", func: fillEntraDeviceSearch,
      args: [ENTRA_DEVICE_SEARCH_XPATH]
    });
    const matches = frames.filter(frame => frame.result?.found);
    if (!matches.length) {
      throw new Error("The device search field was not found in Entra's embedded page. Reload Sidekick and allow access to the Entra embedded pages, then click Begin Wipe again.");
    }
    if (matches.length !== 1) throw new Error("More than one device search field is open in Entra. Close the extra device views and try again.");
    const results = await chrome.scripting.executeScript({
      target: { tabId, frameIds: [matches[0].frameId] }, world: "MAIN", func: fillEntraDeviceSearch,
      args: [ENTRA_DEVICE_SEARCH_XPATH, serial]
    });
    if (!results?.[0]?.result?.entered) throw new Error("Entra did not keep the internal serial in the search field. Click Begin Wipe to try again.");
    deviceToolSetText("prePrepStatus", "Searching Entra for a device name containing the internal serial…");
    const opened = await chrome.scripting.executeScript({
      target: { tabId, frameIds: [matches[0].frameId] }, world: "MAIN", func: openMatchingEntraDevice,
      args: [ENTRA_DEVICE_SEARCH_XPATH, serial]
    });
    const status = opened?.[0]?.result?.status;
    if (status === "multiple") throw new Error("Multiple device names contain this internal serial. Select the correct result in Entra.");
    if (status === "search-changed") throw new Error("The Entra search changed. Click Begin Wipe to search again.");
    if (status !== "opened") throw new Error("No matching device name appeared within 20 seconds. Check the results in Entra.");
    deviceToolSetText("prePrepStatus", "Opening Manage for the matching Entra device…");
    const managed = await chrome.scripting.executeScript({
      target: { tabId, frameIds: [0] }, world: "MAIN", func: clickEntraDeviceManage,
      args: [serial]
    });
    if (managed?.[0]?.result?.status !== "clicked") {
      throw new Error("The matching device's Manage button was not available. Open Manage on the device Properties page.");
    }
    deviceToolSetText("prePrepStatus", "Opening Remove apps and configuration for the matching device…");
    const removal = await chrome.scripting.executeScript({
      target: { tabId, frameIds: [0] }, world: "MAIN", func: openEntraRemoveAppsConfiguration,
      args: [serial]
    });
    if (removal?.[0]?.result?.status !== "opened") {
      throw new Error("Could not find a unique Remove apps and configuration option for the matching device. Check the device's more-options menu.");
    }
    deviceToolSetText("prePrepStatus", "Choosing Add → App for the matching device…");
    const wizardFrameId = await openAppPickerForWipeDevice(tabId, serial);
    if (!Number.isInteger(wizardFrameId)) return;
    deviceToolSetText("prePrepStatus", "Selecting matching AAC apps…");
    const apps = await chrome.scripting.executeScript({
      target: { tabId, frameIds: [0] }, world: "MAIN", func: selectManagedAacApps,
      args: [serial]
    });
    const appResult = apps?.[0]?.result;
    if (appResult?.status === "unrelated-selection") throw new Error("An app outside the requested AAC list is already selected. Review the app selection before continuing.");
    if (appResult?.status !== "selected") throw new Error("Could not finish selecting the matching AAC apps. Check the Select managed apps list; no removal was submitted.");
    deviceToolSetText("prePrepStatus", `Selected ${appResult.count} matching AAC app(s). Opening the review step…`);
    const next = await chrome.scripting.executeScript({
      target: { tabId, frameIds: [wizardFrameId] }, world: "MAIN", func: clickEntraRemovalNext
    });
    if (next?.[0]?.result?.status !== "clicked") throw new Error("The Next button was not available after selecting apps. Check the removal setup page.");
    if (deviceSidekickMode !== "wipe" || !(await refreshBeginWipeAccess())) return;
    const current = new URL((await chrome.tabs.get(tabId)).url);
    const currentDevice = current.hash.match(/\/deviceName\/([^/]+)/)?.[1];
    if (current.origin !== "https://entra.microsoft.com" || !current.hash.includes("/SyncPayloadsWizard.ReactView/")
      || !currentDevice || !decodeURIComponent(currentDevice).toLowerCase().includes(serial.trim().toLowerCase())) {
      throw new Error("The device page changed before removal. No Remove click was sent.");
    }
    deviceToolSetText("prePrepStatus", "Verifying the review list and clicking Remove…");
    const removed = await chrome.scripting.executeScript({
      target: { tabId, frameIds: [wizardFrameId] }, world: "MAIN", func: clickEntraRemovalConfirm,
      args: [appResult.appNames]
    });
    if (removed?.[0]?.result?.status === "selection-changed") throw new Error("The review list differs from the selected AAC apps. No Remove click was sent.");
    if (removed?.[0]?.result?.status !== "clicked") throw new Error("Could not verify the review list and Remove button. Check Entra before continuing.");
    if (deviceSidekickMode !== "wipe" || !(await refreshBeginWipeAccess())) return;
    deviceToolSetText("prePrepStatus", "Opening Revoke Licenses and confirming for the matching device…");
    const revoked = await chrome.scripting.executeScript({
      target: { tabId, frameIds: [0] }, world: "MAIN", func: revokeEntraDeviceLicenses,
      args: [serial]
    });
    if (revoked?.[0]?.result?.status !== "confirmed") {
      throw new Error("App removal was submitted, but Revoke Licenses could not be confirmed for the matching device. Check Entra before retrying any action.");
    }
    const wipeTarget = new URL((await chrome.tabs.get(tabId)).url);
    if (wipeTarget.origin !== "https://entra.microsoft.com" || !wipeTarget.hash.includes("/Microsoft_Intune_Devices/DeviceSettingsMenuBlade/")) {
      throw new Error("The device overview changed before wipe confirmation. No Wipe click was sent.");
    }
    deviceToolSetText("prePrepStatus", "App removal and license revocation requested. Waiting for your wipe decision…");
    if (!(await requestContinueDeviceWipe(serial))) {
      deviceToolSetText("prePrepStatus", "Wipe cancelled. App removal and license revocation were already requested.");
      return;
    }
    if (deviceSidekickMode !== "wipe" || !(await refreshBeginWipeAccess())
      || String(nextUnwipedDevice()?.internalSerial || "").trim() !== serial) {
      throw new Error("The device list, role, or mode changed. No Wipe click was sent.");
    }
    await chrome.tabs.update(tabId, { active: true });
    await chrome.windows.update((await chrome.tabs.get(tabId)).windowId, { focused: true });
    deviceToolSetText("prePrepStatus", "Sending the approved wipe request…");
    const wiped = await chrome.scripting.executeScript({
      target: { tabId, frameIds: [0] }, world: "MAIN", func: wipeEntraApprovedDevice,
      args: [serial, wipeTarget.hash]
    });
    if (wiped?.[0]?.result?.status !== "confirmed") throw new Error("Could not confirm Wipe for the approved device. Check Entra before retrying.");


    deviceToolSetText("prePrepStatus", "Wipe request sent. Waiting for you to confirm whether it went through…");
    return await selectDeviceAfterWipe(tabId, serial);
  } catch (error) {
    if (/permission|cannot access|not allowed/i.test(error.message || "")) {
      throw new Error("Sidekick needs access to Entra and its embedded pages. Reload the updated extension and allow site access, then try again.");
    }
    throw error;
  }
}

function updateBeginWipeVisibility() {
  const button = document.getElementById("beginWipeBtn");
  if (button) button.hidden = !deviceSystemsWipeAccess || deviceSidekickMode !== "wipe";
  const profilesButton = document.getElementById("beginAddingProfilesBtn");
  if (profilesButton) profilesButton.hidden = !deviceSystemsWipeAccess;
}

async function refreshBeginWipeAccess() {
  const stored = await chrome.storage.local.get("ttmtSidekickUserProfile");
  deviceSystemsWipeAccess = stored.ttmtSidekickUserProfile?.role === "Device Systems Coordinator";
  updateBeginWipeVisibility();
  return deviceSystemsWipeAccess;
}

function isEntraDeviceOverview(url) {
  try {
    const candidate = new URL(url);
    const target = new URL(ENTRA_DEVICE_OVERVIEW_URL);
    return candidate.origin === target.origin && candidate.pathname === target.pathname
      && decodeURIComponent(candidate.hash).replace(/\/$/, "") === target.hash;
  } catch { return false; }
}

document.getElementById("beginWipeBtn")?.addEventListener("click", async event => {
  const button = event.currentTarget;
  const profilesButton = document.getElementById("beginAddingProfilesBtn");
  if (button.disabled || profilesButton?.disabled) return;
  button.disabled = true;
  if (profilesButton) profilesButton.disabled = true;
  try {
    if (!(await refreshBeginWipeAccess()) || deviceSidekickMode !== "wipe") return;
    const serial = String(nextUnwipedDevice()?.internalSerial || "").trim();
    if (!serial) {
      deviceToolSetText("prePrepStatus", "No pending devices with an internal serial number remain.");
      return;
    }
    deviceToolSetText("prePrepStatus", "Entering the first internal serial in Entra…");
    const tabs = await chrome.tabs.query({});
    const existing = tabs.find(tab => isEntraDeviceOverview(tab.url) || isEntraDeviceOverview(tab.pendingUrl));
    let targetTab;
    if (existing) {
      targetTab = await chrome.tabs.update(existing.id, { active: true });
      await chrome.windows.update(existing.windowId, { focused: true });
    } else {
      targetTab = await chrome.tabs.create({ url: ENTRA_DEVICE_OVERVIEW_URL });
    }
    let currentSerial = serial;
    while (currentSerial) {
      const next = await searchFirstWipeDevice(targetTab.id, currentSerial);
      if (!next) break;
      const pending = nextUnwipedDevice();
      if (deviceSidekickMode !== "wipe" || !(await refreshBeginWipeAccess())
        || pending?.id !== next.id || String(pending.internalSerial).trim() !== next.serial) {
        throw new Error("The device list, role, or mode changed. Click Begin Wipe to continue.");
      }
      if (!isEntraDeviceOverview((await chrome.tabs.get(targetTab.id)).url)) {
        throw new Error("Return to the main Entra All devices page, then click Begin Wipe for the next device.");
      }
      await chrome.tabs.update(targetTab.id, { active: true });
      await chrome.windows.update((await chrome.tabs.get(targetTab.id)).windowId, { focused: true });
      currentSerial = next.serial;
    }
  } catch (error) {
    deviceToolSetText("prePrepStatus", error.message || "Could not open the Entra device overview. Please try again.");
  } finally { button.disabled = false; if (profilesButton) profilesButton.disabled = false; }
});
void refreshBeginWipeAccess().catch(console.warn);

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
  document.querySelectorAll("#prePrepRows select").forEach(select => { select.disabled = prePrepEditsLocked; });
  for (const id of ["prePrepScanInput", "prePrepAddBtn", "internalSerialInput", "addInternalSerialBtn"]) {
    const input = document.getElementById(id);
    if (input) input.disabled = prePrepEditsLocked;
  }
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
    if (field === "internalSerial") {
      row.wiped = false;
      row.profileAdded = false;
      const status = input.closest(".pre-prep-table__row")?.querySelector('.device-wiped-status input');
      if (status) status.checked = false;
      const profileStatus = input.closest(".pre-prep-table__row")?.querySelector('.device-profile-status input');
      if (profileStatus) profileStatus.checked = false;
    }
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
  updateBeginWipeVisibility();
  const rowsEl = document.getElementById("prePrepRows");
  if (!rowsEl) return;
  const toggle = document.getElementById("internalSerialOnlyBtn");
  if (toggle) {
    toggle.textContent = `Internal serial only: ${internalSerialOnly ? "On" : "Off"}`;
    toggle.setAttribute("aria-pressed", String(internalSerialOnly));
  }
  for (const [id, hidden] of [["prePrepScanForm", internalSerialOnly], ["internalSerialForm", !internalSerialOnly], ["deviceSerialHeading", internalSerialOnly]]) {
    const element = document.getElementById(id);
    if (element) element.hidden = hidden;
  }
  const table = document.getElementById("deviceSidekickTable");
  if (table) table.dataset.internalOnly = String(internalSerialOnly);
  rowsEl.innerHTML = "";
  prePrepRows.forEach(row => {
    const rowEl = document.createElement("div");
    rowEl.className = "pre-prep-table__row";
    rowEl.dataset.rowId = row.id;
    if (!internalSerialOnly) rowEl.append(buildPrePrepCopyCell(row, "deviceSerial", "Scanned device number"));
    rowEl.append(buildPrePrepCopyCell(row, "internalSerial", "Internal serial number"));
    const category = document.createElement("select");
    category.className = "device-category-select";
    category.setAttribute("aria-label", `Device category for ${row.internalSerial || row.deviceSerial}`);
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select category";
    category.append(placeholder);
    for (const name of Object.keys(DEVICE_PROFILE_CATEGORIES)) {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      category.append(option);
    }
    category.value = Object.hasOwn(DEVICE_PROFILE_CATEGORIES, row.category) ? row.category : "";
    category.disabled = prePrepEditsLocked;
    category.addEventListener("change", async () => {
      if (prePrepEditsLocked) { category.value = row.category || ""; return; }
      row.category = category.value;
      row.profileAdded = false;
      const profileStatus = rowEl.querySelector('.device-profile-status input');
      if (profileStatus) profileStatus.checked = false;
      await saveDeviceDraft();
    });
    rowEl.append(category);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "toggle-btn queue-small-btn device-row-remove";
    remove.textContent = "Remove";
    remove.disabled = prePrepEditsLocked;
    remove.setAttribute("aria-label", `Remove device ${row.internalSerial || row.deviceSerial}`);
    remove.addEventListener("click", async () => {
      if (prePrepEditsLocked) return;
      prePrepRows = prePrepRows.filter(item => item.id !== row.id);
      renderPrePrepRows();
      await saveDeviceDraft();
      deviceToolSetText("prePrepStatus", `Removed ${row.internalSerial || row.deviceSerial}.`);
    });
    if (deviceSidekickMode === "wipe") {
      const actions = document.createElement("div");
      actions.className = "device-wipe-row-actions";
      const label = document.createElement("label");
      label.className = "device-wiped-status";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = Boolean(row.wiped);
      checkbox.setAttribute("aria-label", `Wiped ${row.internalSerial || row.deviceSerial}`);
      checkbox.addEventListener("change", async () => {
        row.wiped = checkbox.checked;
        await saveDeviceDraft();
        deviceToolSetText("prePrepStatus", `${row.internalSerial || row.deviceSerial} ${row.wiped ? "marked wiped" : "marked not wiped"}. Begin Wipe will start with the next unfinished device.`);
      });
      label.append(checkbox, document.createTextNode("Wiped"));
      const profileLabel = document.createElement("label");
      profileLabel.className = "device-wiped-status device-profile-status";
      const profileCheckbox = document.createElement("input");
      profileCheckbox.type = "checkbox";
      profileCheckbox.checked = Boolean(row.profileAdded);
      profileCheckbox.setAttribute("aria-label", `Profile added ${row.internalSerial || row.deviceSerial}`);
      profileCheckbox.addEventListener("change", async () => {
        row.profileAdded = profileCheckbox.checked;
        await saveDeviceDraft();
        deviceToolSetText("prePrepStatus", `${row.internalSerial || row.deviceSerial} ${row.profileAdded ? "marked profile added" : "marked profile not added"}. Begin Adding Profiles will start with the next unfinished device.`);
      });
      profileLabel.append(profileCheckbox, document.createTextNode("Profile added"));
      actions.append(label, profileLabel, remove);
      rowEl.append(actions);
    } else rowEl.append(remove);
    rowsEl.append(rowEl);
  });
  updatePrePrepLockState();
  updatePrePrepEmptyState();
}

function addPrePrepScan(rawInput) {
  if (internalSerialOnly || prePrepEditsLocked) return false;
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
    wiped: false, profileAdded: false
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
  await chrome.storage.session.set({ [DEVICE_DRAFT_KEY]: { rows: prePrepRows, locked: prePrepEditsLocked, mode: "wipe", internalSerialOnly, origin: deviceDraftOrigin } });
}
async function loadDeviceDraft() {
  const stored = await chrome.storage.session.get(DEVICE_DRAFT_KEY);
  const draft = stored[DEVICE_DRAFT_KEY];
  if (draft) { prePrepRows = draft.rows || []; prePrepEditsLocked = Boolean(draft.locked); deviceSidekickMode = "wipe"; internalSerialOnly = Boolean(draft.internalSerialOnly); }
  renderPrePrepRows();
}
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.ttmtSidekickUserProfile) {
    void refreshBeginWipeAccess().catch(console.warn);
  }
  const draft = changes[DEVICE_DRAFT_KEY]?.newValue;
  if (area !== "session" || !draft || draft.origin === deviceDraftOrigin) return;
  prePrepRows = draft.rows || [];
  prePrepEditsLocked = Boolean(draft.locked);
  deviceSidekickMode = "wipe"; internalSerialOnly = Boolean(draft.internalSerialOnly);
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

document.getElementById("internalSerialOnlyBtn")?.addEventListener("click", async () => {
  internalSerialOnly = !internalSerialOnly;
  renderPrePrepRows();
  await saveDeviceDraft();
});

function addInternalSerial(raw) {
  if (!internalSerialOnly || prePrepEditsLocked) return false;
  const serial = String(raw || "").trim();
  if (!serial) return false;
  if (prePrepRows.some(row => String(row.internalSerial || "").trim().toLowerCase() === serial.toLowerCase())) {
    deviceToolSetText("prePrepStatus", "That internal serial number is already in the list.");
    return false;
  }
  prePrepRows.push({ id: makePrePrepRowId(), deviceSerial: "", internalSerial: serial, wiped: false, profileAdded: false });
  renderPrePrepRows();
  void saveDeviceDraft();
  deviceToolSetText("prePrepStatus", `Added ${serial}.`);
  return true;
}

document.getElementById("internalSerialForm")?.addEventListener("submit", event => {
  event.preventDefault();
  const input = document.getElementById("internalSerialInput");
  if (addInternalSerial(input?.value) && input) {
    input.value = "";
    input.focus();
  }
});
