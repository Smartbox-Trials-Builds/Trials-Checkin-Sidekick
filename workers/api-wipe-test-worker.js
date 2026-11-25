// Microsoft tokens stay in extension session storage and are never sent to the panel.
(() => {
  const CLIENT = "c3568020-d287-44a2-91f0-0435507fab91";
  const TENANT = "7870fa94-0832-4bfd-b39b-44927dfd207b";
  const AUTH = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0`;
  const REQUIRED = ["DeviceManagementApps.Read.All", "DeviceManagementManagedDevices.Read.All", "DeviceManagementManagedDevices.PrivilegedOperations.All", "Device.Read.All", "Directory.AccessAsUser.All"];
  const PROFILE_REQUIRED = [...REQUIRED, "DeviceManagementManagedDevices.ReadWrite.All"];
  const GROUP_REQUIRED = [...PROFILE_REQUIRED, "Group.Read.All", "GroupMember.ReadWrite.All"];
  const TOKEN_KEY = "sidekickApiWipeTestAuth";
  const DELETE_TOKEN_KEY = TOKEN_KEY;
  const DELETE_REQUIRED = REQUIRED;
  const LEGACY_DELETE_TOKEN_KEY = "sidekickApiWipeTestDeleteAuth";
  const scopeFor = required => required.map(scope => `https://graph.microsoft.com/${scope}`).join(" ") + " offline_access";
  let operation = null;
  const encode = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const random = () => encode(crypto.getRandomValues(new Uint8Array(32)));
  const redirect = () => chrome.identity.getRedirectURL("microsoft");
  const access = async () => (await chrome.storage.local.get("ttmtSidekickUserProfile")).ttmtSidekickUserProfile?.role === "Device Systems Coordinator";

  async function request(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal, cache: "no-store", credentials: "omit" });
      let data;
      try { data = await response.json(); }
      catch { throw new Error("Microsoft returned an unreadable response. Try again."); }
      return { response, data };
    } finally { clearTimeout(timeout); }
  }

  function tokenError(data) {
    if (/AADSTS50011|redirect/i.test(data.error_description || "")) return "Check the existing Microsoft redirect URI in your Entra app, then reconnect.";
    if (["invalid_grant", "interaction_required", "login_required"].includes(data.error)) return "Your Microsoft sign-in has expired. Click Connect Microsoft account.";
    return "Microsoft sign-in could not be completed. Check the app registration and try connecting again.";
  }

  async function redeem(parameters, required = REQUIRED, tokenKey = TOKEN_KEY) {
    const body = new URLSearchParams({ client_id: CLIENT, scope: scopeFor(required), ...parameters });
    const { response, data } = await request(`${AUTH}/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() });
    if (!response.ok || !data.access_token) throw new Error(tokenError(data));
    const scopes = String(data.scope || "").split(/\s+/).map(scope => scope.split("/").pop().toLowerCase());
    if (!required.every(scope => scopes.includes(scope.toLowerCase()))) throw new Error(`Microsoft permissions are missing. Grant admin consent for ${required.join(", ")}, then connect again.`);
    const stored = { accessToken: data.access_token, refreshToken: data.refresh_token || parameters.refresh_token, expiresAt: Date.now() + Number(data.expires_in || 0) * 1000, scopes };
    await chrome.storage.session.set({ [tokenKey]: stored });
    return stored;
  }

  async function connect(required = GROUP_REQUIRED, tokenKey = TOKEN_KEY) {
    const verifier = random();
    const state = random();
    const challenge = encode(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
    const url = new URL(`${AUTH}/authorize`);
    url.search = new URLSearchParams({ client_id: CLIENT, response_type: "code", response_mode: "query", redirect_uri: redirect(), scope: scopeFor(required), state, code_challenge: challenge, code_challenge_method: "S256", prompt: "select_account" }).toString();
    const result = await chrome.identity.launchWebAuthFlow({ url: url.href, interactive: true });
    if (!result) throw new Error("Microsoft sign-in was cancelled.");
    const callback = new URL(result);
    const expected = new URL(redirect());
    if (callback.origin !== expected.origin || callback.pathname !== expected.pathname || callback.searchParams.get("state") !== state) throw new Error("The Microsoft sign-in response could not be verified. Connect again.");
    if (callback.searchParams.has("error")) throw new Error("Microsoft sign-in was declined or cancelled. Check the app permission and reconnect.");
    const code = callback.searchParams.get("code");
    if (!code) throw new Error("Microsoft did not return a sign-in code.");
    if (!(await access())) throw new Error("Your Sidekick role changed. Sign-in cancelled.");
    await redeem({ grant_type: "authorization_code", code, redirect_uri: redirect(), code_verifier: verifier }, required, tokenKey);
    return { connected: true };
  }

  async function token(required = REQUIRED, tokenKey = TOKEN_KEY) {
    const stored = (await chrome.storage.session.get(tokenKey))[tokenKey];
    if (stored?.accessToken && stored.expiresAt > Date.now() + 60000 && required.every(scope => stored.scopes?.includes(scope.toLowerCase()))) return stored.accessToken;
    if (!stored?.refreshToken) throw new Error("Click Connect Microsoft account to enable wiping and Entra deletion with one sign-in.");
    try { return (await redeem({ grant_type: "refresh_token", refresh_token: stored.refreshToken }, required, tokenKey)).accessToken; }
    catch (error) { await chrome.storage.session.remove(tokenKey); throw error; }
  }

  const JOB_KEY = "sidekickApiWipeTestJob";
  const BATCH_KEY = "sidekickApiWipeTestBatch";
  const PROFILE_KEY = "sidekickApiProfileTestBatch";
  const GROUP_KEY = "sidekickApiGroupTestBatch";
  const SYNC_KEY = "sidekickApiSyncTestBatch";
  const loadSyncs = async () => (await chrome.storage.session.get(SYNC_KEY))[SYNC_KEY] || null;
  const saveSyncs = async syncs => { await chrome.storage.session.set({ [SYNC_KEY]: syncs }); return syncs; };
  const GROUP_CATALOG_KEY = "sidekickApiGroupCatalog";
  const loadGroups = async () => (await chrome.storage.session.get(GROUP_KEY))[GROUP_KEY] || null;
  const saveGroups = async groups => { await chrome.storage.session.set({ [GROUP_KEY]: groups }); return groups; };
  const missingDeviceError = serial => Object.assign(new Error("No Intune device has this exact internal serial number. Verify whether a manual wipe is needed."), { missingSerial: serial });
  async function assertNoGroups() {
    const groups = await loadGroups();
    if (groups && !["complete", "stopped"].includes(groups.stage)) throw new Error("Finish or stop the group operation first.");
  }
  const PROFILE_CATEGORIES = Object.freeze({ "Talkpad 10": "Wego TalkPad 10", "Talkpad 8": "Wego TalkPad 8", "Wego 13": "Wego 13a", "Wego 5": "Wego 5a" });
  const loadProfiles = async () => (await chrome.storage.session.get(PROFILE_KEY))[PROFILE_KEY] || null;
  const saveProfiles = async profiles => { await chrome.storage.session.set({ [PROFILE_KEY]: profiles }); return profiles; };
  async function assertNoProfiles() {
    const profiles = await loadProfiles();
    if (profiles && !["complete", "stopped"].includes(profiles.stage)) throw new Error("Finish or stop the profile operation first.");
  }
  let batchContext = null;
  const family = /^(?:lamp words for life|proloquo2go aac|touchchat hd|dialogue|grid for ipad)\b/i;
  const normalize = value => String(value || "").replace(/\s+/g, " ").trim().toUpperCase();
  const serialValue = value => {
    const serial = normalize(value);
    if (!/^[A-Z0-9-]{5,40}$/.test(serial)) throw new Error("Enter a valid internal serial number.");
    return serial;
  };
  const loadBatch = async () => (await chrome.storage.session.get(BATCH_KEY))[BATCH_KEY] || null;
  const saveBatch = async batch => { await chrome.storage.session.set({ [BATCH_KEY]: batch }); return batch; };
  const loadJob = async () => batchContext ? batchContext.item.job : (await chrome.storage.session.get(JOB_KEY))[JOB_KEY] || null;
  const saveJob = async job => {
    if (batchContext) { batchContext.item.job = job; await saveBatch(batchContext.batch); }
    else await chrome.storage.session.set({ [JOB_KEY]: job });
    return job;
  };
  const devicePath = job => `/deviceManagement/managedDevices/${encodeURIComponent(job.device.id)}`;

  async function graph(path, options = {}, deletion = false, profile = false, groups = false) {
    if (!(await access())) throw new Error("Device Sidekick (new) is available to Device Systems Coordinators.");
    const bearer = groups ? await token(GROUP_REQUIRED) : profile ? await token(PROFILE_REQUIRED) : deletion ? await token(DELETE_REQUIRED, DELETE_TOKEN_KEY) : await token();
    if (!(await access())) throw new Error("Your Sidekick role changed. Action stopped.");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(`https://graph.microsoft.com${path}`, {
        ...options, signal: controller.signal, cache: "no-store", credentials: "omit",
        headers: { Authorization: `Bearer ${bearer}`, Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}) }
      });
      if (response.status === 204 && response.ok) return null;
      let data;
      try { data = await response.json(); } catch { throw new Error(`Microsoft returned HTTP ${response.status} with an unreadable response.`); }
      if (!response.ok) {
        if (response.status === 401) await chrome.storage.session.remove(deletion ? DELETE_TOKEN_KEY : TOKEN_KEY);
        const code = String(data.error?.code || "").replace(/[^a-z0-9_.-]/gi, "").slice(0, 100);
        const error = new Error(`Microsoft Graph returned HTTP ${response.status}${code ? ` (${code})` : ""}.${response.status === 403 ? groups ? " Check Group.Read.All and GroupMember.ReadWrite.All admin consent and your Entra group-management role." : deletion ? " Check Device.Read.All and Directory.AccessAsUser.All admin consent and a supported Entra role, such as Cloud Device Administrator or Intune Administrator." : " Check the new delegated permissions, admin consent, and your Intune role." : ""}`);
        error.status = response.status;
        throw error;
      }
      return data;
    } finally { clearTimeout(timeout); }
  }

  async function list(path, groups = false) {
    const allowedPath = new URL(`https://graph.microsoft.com${path}`).pathname;
    const visited = new Set();
    const values = [];
    while (path) {
      const url = new URL(path, "https://graph.microsoft.com");
      if (url.origin !== "https://graph.microsoft.com" || url.pathname !== allowedPath || url.hash || url.username || url.password || visited.has(url.href) || visited.size >= 100) throw new Error("Microsoft returned an invalid results page.");
      visited.add(url.href);
      const data = await graph(url.pathname + url.search, {}, false, false, groups);
      if (!Array.isArray(data?.value)) throw new Error("Microsoft returned an unexpected results list.");
      values.push(...data.value);
      path = data["@odata.nextLink"] || null;
    }
    return values;
  }

  async function verify(job) {
    const device = await graph(`/v1.0${devicePath(job)}?$select=id,deviceName,serialNumber,operatingSystem,managementState,lastSyncDateTime,deviceActionResults,azureADDeviceId`);
    if (device?.id !== job.device.id || normalize(device.serialNumber) !== job.serial || !/^(ios|ipados)$/i.test(device.operatingSystem || "")) throw new Error("Device identity or platform changed. Action stopped; check Intune manually.");
    return device;
  }

  async function preview(serial, resources = null) {
    serial = serialValue(serial);
    const existing = await loadJob();
    if (existing && existing.stage !== "preview") throw new Error("Finish or stop the current test before starting another device.");
    const devices = resources?.devices || await list("/v1.0/deviceManagement/managedDevices?$select=id,deviceName,serialNumber,operatingSystem,managementState,lastSyncDateTime,azureADDeviceId");
    const matches = devices.filter(device => normalize(device.serialNumber) === serial);
    if (matches.length !== 1) throw matches.length ? new Error("Multiple Intune records match this serial. Resolve them in Intune before testing.") : missingDeviceError(serial);
    const device = matches[0];
    if (!/^[a-z0-9-]{1,100}$/i.test(device.id || "") || !/^(ios|ipados)$/i.test(device.operatingSystem || "")) throw new Error("Device Sidekick (new) currently supports Intune-managed iPads and iPhones only.");
    if (device.managementState !== "managed") throw new Error(`Device state is ${device.managementState || "unknown"}. Check existing device actions in Intune before testing.`);
    const catalog = resources?.catalog || await list("/v1.0/deviceAppManagement/mobileApps");
    let installed = [], inventoryError = "";
    try { if (!resources) installed = await list(`/v1.0/deviceManagement/managedDevices/${encodeURIComponent(device.id)}/detectedApps`); }
    catch (error) { inventoryError = error.message; }
    const names = new Set(installed.map(app => normalize(app.displayName)));
    const apps = catalog.filter(app => ["#microsoft.graph.iosVppApp", "#microsoft.graph.iosStoreApp"].includes(app["@odata.type"]) && family.test(String(app.displayName || "")))
      .filter(app => /^[a-z0-9-]{1,40}$/i.test(app.id || ""))
      .map(app => ({ id: app.id, name: String(app.displayName), detected: names.has(normalize(app.displayName)), token: String(app.vppTokenDisplayName || "") }));
    // The same title can exist under multiple VPP tokens; inventory cannot identify which one applies.
    for (const app of apps) {
      app.ambiguous = apps.filter(other => normalize(other.name) === normalize(app.name)).length > 1;
    }
    if (!(await access())) throw new Error("Your Sidekick role changed. Preview cancelled.");
    return await saveJob({ nonce: random(), serial, device, apps, inventoryError, stage: "preview", createdAt: Date.now(), selected: [], log: [] });
  }

  async function mutation(job, action, body, nextStage) {
    // Persist uncertainty before sending: a dropped response must never trigger an automatic retry.
    const device = await verify(job);
    if (normalize(device.azureADDeviceId) !== normalize(job.device.azureADDeviceId)) throw new Error("The linked Entra device changed. Action stopped.");
    if (device.managementState !== "managed") throw new Error(`Device is ${device.managementState || "in an unknown state"}. No new action was sent.`);
    job.stage = "uncertain";
    job.lastAction = action;
    await saveJob(job);
    try {
      await graph(`${action === "wipe" ? "/v1.0" : "/beta"}${devicePath(job)}/${action}`, { method: "POST", ...(body ? { body: JSON.stringify(body) } : {}) });
    } catch (error) {
      job.error = `${error.name === "AbortError" ? "Microsoft took too long to respond." : error.message} Check Intune manually; this action will not be repeated automatically.`;
      await saveJob(job);
      throw new Error(job.error);
    }
    job.stage = nextStage;
    job.log.push({ action, requestedAt: Date.now() });
    job.error = "";
    return await saveJob(job);
  }

  async function ensureDeletionConnection() {
    try { await token(DELETE_REQUIRED, DELETE_TOKEN_KEY); }
    catch { await connect(DELETE_REQUIRED, DELETE_TOKEN_KEY); }
  }

  async function deletionStatus(job) {
    try {
      const target = await graph(`/v1.0/devices/${job.entraTarget.id}?$select=id,deviceId,displayName`, {}, true);
      if (target?.id !== job.entraTarget.id || normalize(target.deviceId) !== normalize(job.device.azureADDeviceId)) throw new Error("The Entra status response did not match the verified device.");
      job.deletionStatus = ["entraDeletePending", "entraDeleted"].includes(job.stage) ? "Microsoft accepted the deletion request, but the Entra record is still visible. Check status again before retrying any deletion." : "The Entra record is still present. Deletion has not been confirmed. Check the reported error before trying again.";
    } catch (error) {
      if (error.status !== 404) throw error;
      job.stage = "entraDeleted";
      job.deletionStatus = "Verified: the device record is no longer in Entra. Refresh Entra's All devices list.";
      job.error = "";
    }
    return await saveJob(job);
  }

  async function deleteEntra(job) {
    const linkedId = job.device.azureADDeviceId;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(linkedId || "") || /^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(linkedId)) throw new Error("No verified Entra device link is available. Delete this device manually in Entra.");
    let target;
    try { target = await graph(`/v1.0/devices(deviceId='${linkedId}')?$select=id,deviceId,displayName`, {}, true); }
    catch (error) {
      if (error.status !== 404) throw error;
      job.stage = "entraDeleted"; job.deletionStatus = "The linked Entra record is already absent. No deletion was needed.";
      return await saveJob(job);
    }
    if (normalize(target?.deviceId) !== normalize(linkedId) || !/^[0-9a-f-]{36}$/i.test(target?.id || "")) throw new Error("The linked Entra record could not be verified. No deletion was sent.");
    job.entraTarget = { id: target.id, deviceId: target.deviceId, name: String(target.displayName || "") };
    job.stage = "uncertain"; job.lastAction = "deleteEntra";
    await saveJob(job);
    try { await graph(`/v1.0/devices/${target.id}`, { method: "DELETE" }, true); }
    catch (error) {
      if (error.status === 404) { job.stage = "entraDeleted"; job.deletionStatus = "The Entra record is already absent."; return await saveJob(job); }
      // An explicit rejection did not execute the deletion; allow reconnection and a user-approved retry.
      if ([400, 401, 403, 429].includes(error.status)) job.stage = "wipeConfirmed";
      job.error = `${error.name === "AbortError" ? "Microsoft took too long to respond." : error.message} ${job.stage === "uncertain" ? "Check Entra status; deletion will not be repeated automatically." : "Deletion was rejected. Correct the connection or role, then continue the workflow."}`;
      await saveJob(job); throw new Error(job.error);
    }
    job.stage = "entraDeletePending"; job.error = "";
    job.log.push({ action: "deleteEntra", requestedAt: Date.now() });
    await saveJob(job);
    try { return await deletionStatus(job); }
    catch (error) {
      job.deletionStatus = `Deletion was accepted, but verification is unavailable: ${error.message}`;
      return await saveJob(job);
    }
  }

  async function execute(message) {
    if (!(await access())) throw new Error("Device Sidekick (new) is available to Device Systems Coordinators.");
    const action = message.action;
    let job = await loadJob();
    if (action === "state") return { job, batch: await loadBatch(), profiles: await loadProfiles(), groups: await loadGroups(), syncs: await loadSyncs(), groupCatalog: (await chrome.storage.session.get(GROUP_CATALOG_KEY))[GROUP_CATALOG_KEY] || [] };
    if (action.startsWith("lockdown-")) return await lockdownExecute(message);
    if (action.startsWith("sync-")) return await syncExecute(message);
    if (action.startsWith("groups-")) return await groupsExecute(message);
    if (action.startsWith("profiles-")) return await profilesExecute(message);
    if (action.startsWith("bulk-")) return await bulkExecute(message);
    if (["connect-delete", "ensure-delete"].includes(action)) {
      if (action === "ensure-delete") await ensureDeletionConnection();
      else await connect(DELETE_REQUIRED, DELETE_TOKEN_KEY);
      return { job, deletionConnected: true };
    }
    if (action === "connect") {
      await connect();
      await chrome.storage.session.remove(LEGACY_DELETE_TOKEN_KEY);
      return { job, connected: true };
    }
    if (!batchContext && ["preview", "disconnect"].includes(action)) {
      await assertNoProfiles();
      await assertNoGroups();
      const activeBatch = await loadBatch();
      if (activeBatch && !["complete", "stopped"].includes(activeBatch.stage)) throw new Error("Finish or stop the current bulk operation first.");
    }
    if (action === "disconnect") {
      if (job && job.stage !== "preview") throw new Error("Finish or stop the current device test before changing its Microsoft connection.");
      await chrome.storage.session.remove(JOB_KEY);
      await chrome.storage.session.remove(TOKEN_KEY);
      await chrome.storage.session.remove(DELETE_TOKEN_KEY);
      await chrome.storage.session.remove(LEGACY_DELETE_TOKEN_KEY);
      return { job: null, connected: false };
    }
    if (action === "preview") return { job: await preview(message.serial) };
    if (!job || message.nonce !== job.nonce || serialValue(message.serial) !== job.serial) throw new Error("The test device changed. Reopen the current device preview.");
    if (action === "stop") { await chrome.storage.session.remove(JOB_KEY); return { job: null }; }
    if (action === "status") {
      if (job.entraTarget && job.lastAction === "deleteEntra") return { job: await deletionStatus(job), entraStatus: job.deletionStatus || job.error };
      return { job, deviceStatus: await verify(job) };
    }
    if (message.confirmed !== true) throw new Error("Confirm this device action before continuing.");
    if (action === "remove" && job.stage === "preview") {
      if (Date.now() - job.createdAt > 15 * 60000) throw new Error("The device preview expired. Stop and preview it again.");
      if (!Array.isArray(message.appIds) || message.appIds.some(id => !job.apps.some(app => app.id === id))) throw new Error("The app selection changed. Preview the device again.");
      job.selected = [...new Set(message.appIds)];
      if (!job.selected.length) { await verify(job); job.stage = "removalSkipped"; return { job: await saveJob(job) }; }
      return { job: await mutation(job, "changeAssignments", { deviceAssignmentItems: job.selected.map(id => ({ "@odata.type": "#microsoft.graph.deviceAssignmentItem", itemId: id, itemType: "application", assignmentItemActionIntent: "remove" })) }, "removalRequested") };
    }
    if (action === "revoke" && ["removalRequested", "removalSkipped"].includes(job.stage)) {
      return { job: await mutation(job, "revokeAppleVppLicenses", null, "licensesRequested") };
    }
    if (action === "wipe" && job.stage === "licensesRequested") {
      return { job: await mutation(job, "wipe", { keepEnrollmentData: false, keepUserData: false, persistEsimDataPlan: false }, "wipeRequested") };
    }
    if (action === "finish" && job.stage === "wipeRequested") {
      job.stage = "wipeConfirmed";
      return { job: await saveJob(job), completedSerial: job.serial };
    }
    if (action === "delete-entra" && job.stage === "wipeConfirmed") {
      return { job: await deleteEntra(job) };
    }
    if (action === "close" && ["wipeConfirmed", "entraDeleted"].includes(job.stage)) {
      await chrome.storage.session.remove(JOB_KEY); return { job: null };
    }
    throw new Error("This action is not available at the current step. No request was sent.");
  }

  async function bulkExecute(message) {
    const action = message.action;
    let batch = await loadBatch();
    if (action === "bulk-start") {
      await assertNoProfiles();
      await assertNoGroups();
      if (await loadJob()) throw new Error("Finish or stop the current single-device test first.");
      if (batch && !["complete", "stopped"].includes(batch.stage)) throw new Error("A bulk operation is already active. Continue that operation.");
      if (!Array.isArray(message.serials) || !message.serials.length || message.serials.length > 100) throw new Error("Choose between 1 and 100 unfinished devices for this batch.");
      const serials = message.serials.map(serialValue);
      if (new Set(serials).size !== serials.length) throw new Error("Duplicate internal serials were found. Fix the list before starting the batch.");
      const resources = {
        devices: await list("/v1.0/deviceManagement/managedDevices?$select=id,deviceName,serialNumber,operatingSystem,managementState,lastSyncDateTime,azureADDeviceId"),
        catalog: await list("/v1.0/deviceAppManagement/mobileApps")
      };
      batch = { nonce: random(), stage: "removing", createdAt: Date.now(), items: serials.map(serial => ({ serial, status: "queued", job: null, error: "" })) };
      await saveBatch(batch);
      for (const item of batch.items) {
        batchContext = { batch, item };
        try { item.job = await preview(item.serial, resources); item.status = "ready"; }
        catch (error) { item.status = "failed"; item.error = error.message; item.missingDevice = Boolean(error.missingSerial); }
        finally { batchContext = null; }
      }
      // Two serials must never resolve to the same managed-device record.
      for (const item of batch.items) {
        if (item.job && batch.items.some(other => other !== item && other.job?.device.id === item.job.device.id)) {
          item.status = "failed"; item.error = "Another batch entry resolved to the same device ID. Complete this device manually.";
        }
      }
      if (!batch.items.some(item => item.status === "ready")) batch.stage = "complete";
      return { job: null, batch: await saveBatch(batch) };
    }
    if (!batch || message.batchNonce !== batch.nonce) throw new Error("The bulk device list changed. Reopen the current operation.");
    if (action === "bulk-stop") {
      batch.stage = "stopped";
      return { job: null, batch: await saveBatch(batch) };
    }
    if (action === "bulk-status") {
      const item = batch.items.find(entry => entry.serial === message.itemSerial);
      if (!item?.job?.entraTarget || !["deletePending", "failed", "deleted"].includes(item.status)) throw new Error("No Entra deletion is available to check for this device.");
      batchContext = { batch, item };
      try {
        item.job = await deletionStatus(item.job);
        if (item.job.stage === "entraDeleted") { item.status = "deleted"; item.error = ""; }
      } catch (error) { item.error = error.message; }
      finally { batchContext = null; }
      return { job: null, batch: await saveBatch(batch) };
    }
    if (action === "bulk-step") {
      const phases = {
        removing: { from: "ready", action: "remove", to: "awaitApps", next: "awaitApps" },
        revoking: { from: "appsConfirmed", action: "revoke", to: "readyWipe", next: "awaitWipe" },
        wiping: { from: "wipeApproved", action: "wipe", to: "wipeSent", next: "awaitOutcome" },
        deleting: { from: "deleteApproved", action: "delete-entra", to: "deleted", next: "complete" }
      };
      const phase = phases[batch.stage];
      if (!phase) throw new Error("This batch is waiting for a group confirmation.");
      for (const queued of batch.items.filter(entry => entry.status === "queued")) {
        queued.status = queued.job?.stage === "preview" ? "ready" : "failed";
        if (queued.status === "failed") queued.error = "Device verification was interrupted. No action was sent; complete this entry separately.";
      }
      const item = batch.items.find(entry => entry.status === phase.from);
      if (item) {
        batchContext = { batch, item };
        try {
          const completedStages = { remove: ["removalRequested", "removalSkipped"], revoke: ["licensesRequested"], wipe: ["wipeRequested"], "delete-entra": ["entraDeleted", "entraDeletePending"] };
          if (!completedStages[phase.action].includes(item.job.stage)) {
            const result = await execute({ action: phase.action, nonce: item.job.nonce, serial: item.serial, confirmed: true, appIds: item.job.apps.map(app => app.id) });
            item.job = result.job;
          }
          item.status = phase.action === "delete-entra" && item.job.stage !== "entraDeleted" ? "deletePending" : phase.to;
          item.error = "";
        } catch (error) { item.status = "failed"; item.error = error.message; }
        finally { batchContext = null; }
      }
      if (!batch.items.some(entry => entry.status === phase.from)) {
        batch.stage = batch.items.some(entry => entry.status === phase.to) ? phase.next : "complete";
        if (phase.next === "complete") batch.stage = "complete";
      }
      return { job: null, batch: await saveBatch(batch) };
    }
    const decisions = {
      "bulk-apps": { stage: "awaitApps", from: "awaitApps", to: "appsConfirmed", next: "revoking" },
      "bulk-wipe": { stage: "awaitWipe", from: "readyWipe", to: "wipeApproved", next: "wiping" },
      "bulk-outcome": { stage: "awaitOutcome", from: "wipeSent", to: "wiped", next: "awaitDelete" },
      "bulk-delete": { stage: "awaitDelete", from: "wiped", to: "deleteApproved", next: "deleting" }
    };
    const decision = decisions[action];
    if (!decision || batch.stage !== decision.stage || message.confirmed !== true) throw new Error("Confirm the devices at the current bulk step before continuing.");
    const eligible = batch.items.filter(item => item.status === decision.from);
    if (!Array.isArray(message.selectedSerials) || message.selectedSerials.some(serial => !eligible.some(item => item.serial === serial))) throw new Error("The confirmed devices do not match this batch step.");
    const selected = new Set(message.selectedSerials);
    if (action === "bulk-delete") {
      for (const item of eligible.filter(entry => selected.has(entry.serial))) {
        if (eligible.some(other => other !== item && normalize(other.job.device.azureADDeviceId) === normalize(item.job.device.azureADDeviceId))) throw new Error("Multiple batch devices share an Entra link. Delete those records manually.");
      }
    }
    for (const item of eligible) {
      if (!selected.has(item.serial)) { item.status = action === "bulk-delete" ? "manualDelete" : "manual"; continue; }
      if (action === "bulk-outcome") {
        item.job.stage = "wipeConfirmed";
        item.wiped = true;
      }
      item.status = decision.to;
    }
    batch.stage = selected.size ? decision.next : "complete";
    return { job: null, batch: await saveBatch(batch) };
  }

  async function profileDevice(item) {
    const device = await graph(`/v1.0/deviceManagement/managedDevices/${item.device.id}?$select=id,serialNumber,deviceName,managementState`, {}, false, true);
    if (device?.id !== item.device.id || normalize(device.serialNumber) !== item.serial || device.managementState !== "managed") throw new Error("The device identity or management state changed. No category update was sent.");
    return device;
  }
  async function currentProfile(item) {
    try { return await graph(`/v1.0/deviceManagement/managedDevices/${item.device.id}/deviceCategory`, {}, false, true); }
    catch (error) { if (error.status === 404) return { id: null, displayName: "" }; throw error; }
  }
  async function verifyProfile(item) {
    await profileDevice(item);
    const current = await currentProfile(item);
    if (current?.id === item.categoryId && current.displayName === item.targetName) {
      item.status = "added"; item.error = "";
    } else {
      item.status = item.updateSent ? "pending" : "failed";
      item.error = "The selected category is not yet verified. Check the profile status or complete manually; no update will be repeated automatically.";
    }
  }
  async function profilesExecute(message) {
    let profiles = await loadProfiles();
    const action = message.action;
    if (action === "profiles-start") {
      await assertNoProfiles();
      await assertNoGroups();
      if (await loadJob()) throw new Error("Finish or stop the single-device wipe first.");
      const wipeBatch = await loadBatch();
      if (wipeBatch && !["complete", "stopped"].includes(wipeBatch.stage)) throw new Error("Finish or stop the bulk wipe first.");
      if (!Array.isArray(message.devices) || !message.devices.length || message.devices.length > 100) throw new Error("Choose between 1 and 100 devices for bulk profiles.");
      const requested = message.devices.map(entry => {
        if (!Object.hasOwn(PROFILE_CATEGORIES, entry.category)) throw new Error("Choose a device category for every unfinished profile.");
        return { serial: serialValue(entry.serial), category: entry.category };
      });
      if (new Set(requested.map(item => item.serial)).size !== requested.length) throw new Error("Duplicate internal serials were found. Fix the list before adding profiles.");
      await token(PROFILE_REQUIRED);
      const devices = await list("/v1.0/deviceManagement/managedDevices?$select=id,deviceName,serialNumber,managementState,deviceCategoryDisplayName");
      const categories = await list("/v1.0/deviceManagement/deviceCategories");
      const items = requested.map(entry => {
        const item = { ...entry, targetName: PROFILE_CATEGORIES[entry.category], status: "ready", error: "" };
        const matches = devices.filter(device => normalize(device.serialNumber) === entry.serial);
        const categoryMatches = categories.filter(category => category.displayName === item.targetName);
        if (matches.length !== 1) { item.status = "failed"; item.missingDevice = !matches.length; item.error = matches.length ? "Multiple Intune records match this serial." : missingDeviceError(entry.serial).message; }
        else if (!/^[a-z0-9-]{1,100}$/i.test(matches[0].id || "") || matches[0].managementState !== "managed") { item.status = "failed"; item.error = "The device is not ready for category changes."; }
        else if (categoryMatches.length !== 1 || !/^[a-z0-9-]{1,100}$/i.test(categoryMatches[0]?.id || "")) { item.status = "failed"; item.error = `No unique Intune category named ${item.targetName} was found.`; }
        else { item.device = matches[0]; item.categoryId = categoryMatches[0].id; }
        return item;
      });
      for (const item of items) {
        if (item.device && items.some(other => other !== item && other.device?.id === item.device.id)) { item.status = "failed"; item.error = "Another entry resolved to the same device ID."; }
      }
      // Snapshot the relationship itself. The list's category label is only a summary
      // and must not be compared with a later relationship response.
      for (const item of items.filter(entry => entry.status === "ready")) {
        try {
          await profileDevice(item);
          const current = await currentProfile(item);
          item.previousCategoryId = current?.id || null;
        } catch (error) { item.status = "failed"; item.error = error.message; }
      }
      profiles = { nonce: random(), createdAt: Date.now(), stage: items.some(item => item.status === "ready") ? "review" : "complete", items };
      return { job: null, profiles: await saveProfiles(profiles) };
    }
    if (!profiles || message.profileNonce !== profiles.nonce) throw new Error("The profile list changed. Reopen the current profile operation.");
    if (action === "profiles-stop") { profiles.stage = "stopped"; return { job: null, profiles: await saveProfiles(profiles) }; }
    if (action === "profiles-approve") {
      if (profiles.stage !== "review" || message.confirmed !== true) throw new Error("Confirm the bulk profile assignments before continuing.");
      if (Date.now() - profiles.createdAt > 15 * 60000) throw new Error("The profile preview expired. Stop and preview the list again.");
      if (!Array.isArray(message.selectedSerials) || message.selectedSerials.some(serial => !profiles.items.some(item => item.serial === serial && item.status === "ready"))) throw new Error("The confirmed devices do not match this profile preview.");
      for (const item of profiles.items.filter(entry => entry.status === "ready")) item.status = message.selectedSerials.includes(item.serial) ? "queued" : "skipped";
      profiles.stage = profiles.items.some(item => item.status === "queued") ? "running" : "complete";
      return { job: null, profiles: await saveProfiles(profiles) };
    }
    if (action === "profiles-check") {
      const item = profiles.items.find(entry => entry.serial === message.itemSerial && entry.device && ["pending", "uncertain"].includes(entry.status));
      if (!item) throw new Error("No pending profile update is available to check for this device.");
      try { await verifyProfile(item); } catch (error) { item.error = error.message; }
      return { job: null, profiles: await saveProfiles(profiles) };
    }
    if (action !== "profiles-step" || profiles.stage !== "running") throw new Error("This profile operation is waiting for confirmation or has finished.");
    const item = profiles.items.find(entry => entry.status === "queued") || profiles.items.find(entry => entry.status === "uncertain");
    if (item) {
      try {
        if (item.status === "uncertain") await verifyProfile(item);
        else {
          await profileDevice(item);
          const category = await graph(`/v1.0/deviceManagement/deviceCategories/${item.categoryId}`, {}, false, true);
          if (category?.id !== item.categoryId || category.displayName !== item.targetName) throw new Error("The selected Intune category changed. No update was sent.");
          const current = await currentProfile(item);
          if (current?.id === item.categoryId && current.displayName === item.targetName) item.status = "added";
          else {
            if (!Object.hasOwn(item, "previousCategoryId")) throw new Error("This profile preview needs refreshing. Stop and preview the devices again.");
            if (normalize(current?.id) !== normalize(item.previousCategoryId)) throw new Error("The device category changed after the preview. Preview this device again before replacing it.");
            item.status = "uncertain"; item.updateSent = true;
            await saveProfiles(profiles);
            await graph(`/v1.0/deviceManagement/managedDevices/${item.device.id}/deviceCategory/$ref`, { method: "PUT", body: JSON.stringify({ "@odata.id": `https://graph.microsoft.com/v1.0/deviceManagement/deviceCategories/${item.categoryId}` }) }, false, true);
            item.status = "pending";
            await saveProfiles(profiles);
            await verifyProfile(item);
          }
        }
      } catch (error) {
        if (item.status !== "uncertain" && item.status !== "pending") item.status = "failed";
        if ([400, 401, 403, 429].includes(error.status)) { item.status = "failed"; item.updateSent = false; }
        item.error = `${error.message}${item.updateSent ? " Check profile status before retrying; this update will not be repeated automatically." : ""}`;
      }
    }
    if (!profiles.items.some(entry => entry.status === "queued")) profiles.stage = "complete";
    return { job: null, profiles: await saveProfiles(profiles) };
  }

  const groupFields = "id,displayName,securityEnabled,mailEnabled,groupTypes,onPremisesSyncEnabled,isAssignableToRole";
  const validGuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value || "");
  function groupUnavailable(group) {
    if (group.groupTypes?.includes("DynamicMembership")) return "Dynamic membership — assigned automatically";
    if (!group.securityEnabled || group.groupTypes?.includes("Unified")) return "This group does not accept device members";
    if (group.mailEnabled) return "Mail-enabled group — manage outside Sidekick";
    if (group.onPremisesSyncEnabled) return "Synced group — manage in Active Directory";
    if (group.isAssignableToRole) return "Role-assignable group — manage separately";
    return "";
  }
  async function groupCatalog() {
    const catalog = (await list(`/v1.0/groups?$select=${groupFields}`, true)).filter(group => validGuid(group.id)).map(group => ({ ...group, unavailable: groupUnavailable(group) })).sort((a, b) => String(a.displayName || "").localeCompare(String(b.displayName || "")));
    await chrome.storage.session.set({ [GROUP_CATALOG_KEY]: catalog });
    return catalog;
  }
  async function groupMembership(item) {
    const members = await list(`/v1.0/groups/${item.groupId}/members?$select=id`, true);
    return members.some(member => normalize(member.id) === normalize(item.objectId));
  }
  async function verifyGroup(item) {
    if (await groupMembership(item)) { item.status = "added"; item.error = ""; }
    else { item.status = "pending"; item.error = "Group membership is not yet verified. Check group status; no addition will be repeated automatically."; }
  }
  async function groupsExecute(message) {
    const action = message.action;
    if (action === "groups-list") return { job: await loadJob(), groupCatalog: await groupCatalog() };
    let groups = await loadGroups();
    if (action === "groups-start") {
      await assertNoGroups(); await assertNoProfiles();
      if (await loadJob()) throw new Error("Finish or stop the single-device wipe first.");
      const wipeBatch = await loadBatch();
      if (wipeBatch && !["complete", "stopped"].includes(wipeBatch.stage)) throw new Error("Finish or stop the bulk wipe first.");
      if (!Array.isArray(message.devices) || !message.devices.length || message.devices.length > 100) throw new Error("Choose between 1 and 100 devices for group assignment.");
      const requested = message.devices.map(entry => {
        if (!validGuid(entry.groupId)) throw new Error("Choose a group for each device being added.");
        return { serial: serialValue(entry.serial), groupId: entry.groupId };
      });
      if (new Set(requested.map(item => item.serial)).size !== requested.length) throw new Error("Duplicate internal serials were found. Fix the list before adding groups.");
      const catalog = await groupCatalog();
      const devices = await list("/v1.0/deviceManagement/managedDevices?$select=id,deviceName,serialNumber,managementState,azureADDeviceId");
      const items = requested.map(entry => {
        const item = { ...entry, status: "ready", error: "" };
        const group = catalog.find(value => value.id === entry.groupId);
        const matches = devices.filter(device => normalize(device.serialNumber) === entry.serial);
        item.targetName = String(group?.displayName || entry.groupId);
        if (!matches.length) { item.status = "failed"; item.missingDevice = true; item.error = missingDeviceError(entry.serial).message; }
        else if (matches.length !== 1) { item.status = "failed"; item.error = "Multiple Intune devices match this internal serial."; }
        else if (!validGuid(matches[0].id) || !validGuid(matches[0].azureADDeviceId) || matches[0].managementState !== "managed") { item.status = "failed"; item.error = "No managed device with a verified Entra link is available."; }
        else if (!group || group.unavailable) { item.status = "failed"; item.error = group?.unavailable || "The selected group no longer exists."; }
        else item.device = matches[0];
        return item;
      });
      for (const item of items) {
        if (item.device && items.some(other => other !== item && other.device && normalize(other.device.azureADDeviceId) === normalize(item.device.azureADDeviceId))) { item.status = "failed"; item.error = "Another entry resolves to the same Entra device. Check this device manually."; }
      }
      groups = { nonce: random(), createdAt: Date.now(), stage: items.some(item => item.status === "ready") ? "review" : "complete", items };
      return { job: null, groups: await saveGroups(groups), groupCatalog: catalog };
    }
    if (!groups || message.groupNonce !== groups.nonce) throw new Error("The group assignment list changed. Reopen the current operation.");
    if (action === "groups-stop") { groups.stage = "stopped"; return { job: null, groups: await saveGroups(groups) }; }
    if (action === "groups-approve") {
      if (groups.stage !== "review" || message.confirmed !== true) throw new Error("Confirm the device/group pairs before continuing.");
      if (Date.now() - groups.createdAt > 15 * 60000) throw new Error("The group preview expired. Stop and preview the devices again.");
      if (!Array.isArray(message.selectedSerials) || message.selectedSerials.some(serial => !groups.items.some(item => item.serial === serial && item.status === "ready"))) throw new Error("The confirmed devices do not match this group operation.");
      for (const item of groups.items.filter(entry => entry.status === "ready")) item.status = message.selectedSerials.includes(item.serial) ? "queued" : "skipped";
      groups.stage = groups.items.some(item => item.status === "queued") ? "running" : "complete";
      return { job: null, groups: await saveGroups(groups) };
    }
    if (action === "groups-check") {
      const item = groups.items.find(entry => entry.serial === message.itemSerial && entry.objectId && ["pending", "uncertain"].includes(entry.status));
      if (!item) throw new Error("No pending group membership is available to check.");
      try { await verifyGroup(item); } catch (error) { item.error = error.message; }
      return { job: null, groups: await saveGroups(groups) };
    }
    if (action !== "groups-step" || groups.stage !== "running") throw new Error("This group operation is waiting for confirmation or has finished.");
    const item = groups.items.find(entry => entry.status === "queued") || groups.items.find(entry => entry.status === "uncertain");
    if (item) {
      try {
        if (item.status === "uncertain") await verifyGroup(item);
        else {
          const device = await graph(`/v1.0/deviceManagement/managedDevices/${item.device.id}?$select=id,serialNumber,managementState,azureADDeviceId`, {}, false, false, true);
          if (device?.id !== item.device.id || normalize(device.serialNumber) !== item.serial || device.managementState !== "managed" || normalize(device.azureADDeviceId) !== normalize(item.device.azureADDeviceId)) throw new Error("The device identity or Entra link changed. No group addition was sent.");
          const group = await graph(`/v1.0/groups/${item.groupId}?$select=${groupFields}`, {}, false, false, true);
          if (group?.id !== item.groupId || groupUnavailable(group) || group.displayName !== item.targetName) throw new Error("The selected group changed or no longer accepts manual device additions. Preview it again.");
          const target = await graph(`/v1.0/devices(deviceId='${item.device.azureADDeviceId}')?$select=id,deviceId,displayName`, {}, false, false, true);
          if (!validGuid(target?.id) || normalize(target.deviceId) !== normalize(item.device.azureADDeviceId)) throw new Error("The linked Entra device could not be verified. No group addition was sent.");
          item.objectId = target.id;
          if (await groupMembership(item)) item.status = "added";
          else {
            item.status = "uncertain"; item.updateSent = true; await saveGroups(groups);
            try { await graph(`/v1.0/groups/${item.groupId}/members/$ref`, { method: "POST", body: JSON.stringify({ "@odata.id": `https://graph.microsoft.com/v1.0/directoryObjects/${item.objectId}` }) }, false, false, true); }
            catch (error) {
              if (error.status !== 400 || !(await groupMembership(item))) throw error;
            }
            item.status = "pending"; await saveGroups(groups); await verifyGroup(item);
          }
        }
      } catch (error) {
        if (!["uncertain", "pending"].includes(item.status)) item.status = "failed";
        if ([400, 401, 403, 429].includes(error.status)) { item.status = "failed"; item.updateSent = false; }
        item.error = `${error.message}${item.updateSent ? " Check membership before retrying; this addition will not be repeated automatically." : ""}`;
      }
    }
    if (!groups.items.some(entry => entry.status === "queued")) groups.stage = "complete";
    return { job: null, groups: await saveGroups(groups) };
  }

  async function syncExecute(message) {
    const action = message.action;
    let syncs = await loadSyncs();
    const result = async () => ({ job: await loadJob(), syncs: await saveSyncs(syncs) });
    if (action === "sync-start") {
      if (syncs && !["complete", "stopped"].includes(syncs.stage)) throw new Error("Finish or stop the current sync operation first.");
      if (!Array.isArray(message.serials) || !message.serials.length || message.serials.length > 100) throw new Error("Choose between 1 and 100 devices to sync.");
      const serials = message.serials.map(serialValue);
      if (new Set(serials).size !== serials.length) throw new Error("Duplicate internal serials were found. Fix the list before syncing.");
      const devices = await list("/v1.0/deviceManagement/managedDevices?$select=id,deviceName,serialNumber,managementState,lastSyncDateTime");
      const items = serials.map(serial => {
        const item = { serial, status: "ready", error: "" };
        const matches = devices.filter(device => normalize(device.serialNumber) === serial);
        if (!matches.length) { item.status = "failed"; item.missingDevice = true; item.error = missingDeviceError(serial).message; }
        else if (matches.length !== 1) { item.status = "failed"; item.error = "Multiple Intune records match this serial. Select the correct device manually in Intune."; }
        else if (!validGuid(matches[0].id) || matches[0].managementState !== "managed") { item.status = "failed"; item.error = "The device is not in a managed state. No sync request was sent."; }
        else item.device = matches[0];
        return item;
      });
      for (const item of items) {
        if (item.device && items.some(other => other !== item && other.device?.id === item.device.id)) { item.status = "failed"; item.error = "Another entry resolved to the same device ID."; }
      }
      syncs = { nonce: random(), createdAt: Date.now(), stage: items.some(item => item.status === "ready") ? "review" : "complete", items };
      return await result();
    }
    if (!syncs || message.syncNonce !== syncs.nonce) throw new Error("The sync list changed. Reopen the current sync operation.");
    if (action === "sync-stop") { syncs.stage = "stopped"; return await result(); }
    if (action === "sync-approve") {
      if (syncs.stage !== "review" || message.confirmed !== true) throw new Error("Confirm the devices before syncing.");
      if (Date.now() - syncs.createdAt > 15 * 60000) throw new Error("The sync preview expired. Start a new sync operation.");
      if (!Array.isArray(message.selectedSerials) || message.selectedSerials.some(serial => !syncs.items.some(item => item.serial === serial && item.status === "ready"))) throw new Error("The confirmed devices do not match this sync list.");
      for (const item of syncs.items.filter(entry => entry.status === "ready")) item.status = message.selectedSerials.includes(item.serial) ? "queued" : "skipped";
      syncs.stage = syncs.items.some(item => item.status === "queued") ? "running" : "complete";
      return await result();
    }
    if (action !== "sync-step" || syncs.stage !== "running") throw new Error("This sync operation is waiting for confirmation or has finished.");
    const item = syncs.items.find(entry => entry.status === "queued");
    if (item) {
      try {
        const current = await graph(`/v1.0/deviceManagement/managedDevices/${item.device.id}?$select=id,serialNumber,managementState,lastSyncDateTime`);
        if (current?.id !== item.device.id || normalize(current.serialNumber) !== item.serial || current.managementState !== "managed") throw new Error("The device identity or management state changed. No sync request was sent.");
        item.status = "uncertain"; item.requestedAt = Date.now(); await saveSyncs(syncs);
        await graph(`/v1.0/deviceManagement/managedDevices/${item.device.id}/syncDevice`, { method: "POST" });
        item.status = "requested"; item.error = "Intune accepted the sync request. This does not confirm the device has completed syncing.";
      } catch (error) {
        if (item.status !== "uncertain" || [400, 401, 403, 404, 429].includes(error.status)) item.status = "failed";
        item.error = `${error.name === "AbortError" ? "Microsoft took too long to respond." : error.message}${item.status === "uncertain" ? " The request may have been sent. Check Intune before retrying; it will not be repeated automatically." : ""}`;
      }
    }
    if (!syncs.items.some(entry => entry.status === "queued")) syncs.stage = "complete";
    return await result();
  }


  const LOCKDOWN_KEY = "sidekickApiLockDownBatch";
  const LOCKDOWN_MESSAGE = "This device is durable medical equipment, property of Smartbox. If found, please contact 877-392-2299 ext.6 or trials.us@smartboxaac.com";
  const LOCKDOWN_PHONE = "877-392-2299 ext.6";
  const lockdownFields = "id,deviceName,serialNumber,operatingSystem,isSupervised,managementState,lostModeState";
  function lockdownEligible(device, serial, id) {
    if (!device || !validGuid(device.id) || (id && device.id !== id) || normalize(device.serialNumber) !== serial) throw new Error("The exact device identity could not be verified. No lockdown was sent.");
    if (!/^(ios|ipados)$/i.test(device.operatingSystem) || device.isSupervised !== true || device.managementState !== "managed") throw new Error("Lost Mode requires a managed, supervised iOS/iPadOS device.");
  }
  async function lockdownExecute(message) {
    let batch = (await chrome.storage.session.get(LOCKDOWN_KEY))[LOCKDOWN_KEY] || null;
    const result = async () => { await chrome.storage.session.set({ [LOCKDOWN_KEY]: batch }); return { job: await loadJob(), lockdowns: batch }; };
    const action = message.action;
    if (action === "lockdown-state") return await result();
    if (action === "lockdown-start") {
      if (batch && !["complete", "stopped"].includes(batch.stage)) throw new Error("Finish or stop the current lockdown first.");
      if (!Array.isArray(message.serials) || !message.serials.length || message.serials.length > 100) throw new Error("Choose 1 to 100 devices.");
      const mode = message.mode || "enable";
      if (!["enable", "disable"].includes(mode)) throw new Error("Choose enable or disable Lost Mode.");
      const target = mode === "disable" ? "disabled" : "enabled";
      const serials = message.serials.map(serialValue);
      if (new Set(serials).size !== serials.length) throw new Error("Duplicate internal serials found. Remove duplicate cards first.");
      const devices = await list("/beta/deviceManagement/managedDevices?$select=" + lockdownFields);
      const items = serials.map(serial => {
        const item = { serial, status: "ready", error: "" };
        try {
          const matches = devices.filter(device => normalize(device.serialNumber) === serial);
          if (matches.length !== 1) throw new Error(matches.length ? "Multiple Intune devices match this serial." : "No Intune device has this exact internal serial number.");
          lockdownEligible(matches[0], serial);
          item.device = matches[0];
          if (mode === "enable" && matches[0].lostModeState === target) { item.status = target; item.error = "Lost Mode is already " + target + "; no change was sent."; }
        } catch (error) { item.status = "failed"; item.error = error.message; }
        return item;
      });
      batch = { mode, nonce: random(), createdAt: Date.now(), stage: items.some(item => item.status === "ready") ? "review" : "complete", items };
      return await result();
    }
    if (!batch || message.lockdownNonce !== batch.nonce) throw new Error("The lockdown list changed. Reload its status.");
    const disabling = batch.mode === "disable";
    const target = disabling ? "disabled" : "enabled";
    const pending = disabling ? "disableRequested" : "enableRequested";
    if (action === "lockdown-stop") { batch.stage = "stopped"; return await result(); }
    if (action === "lockdown-approve") {
      if (batch.stage !== "review" || message.confirmed !== true || Date.now() - batch.createdAt > 900000) throw new Error("Preview and confirm the current lockdown list again.");
      batch.items.filter(item => item.status === "ready").forEach(item => { item.status = "queued"; });
      batch.stage = "running"; return await result();
    }
    if (action === "lockdown-check") {
      for (const item of batch.items.filter(item => ["requested", "uncertain", "reported disabled"].includes(item.status))) {
        try {
          const current = await graph("/beta/deviceManagement/managedDevices/" + item.device.id + "?$select=" + lockdownFields);
          lockdownEligible(current, item.serial, item.device.id);
          if (current.lostModeState === target) {
            item.status = disabling ? "reported disabled" : target;
            item.error = disabling ? "Intune reports Lost Mode disabled. Verify the Lost Mode screen has cleared on the device; this status alone does not confirm it. Keep the device online to receive the command." : "Intune reports Lost Mode enabled.";
          }
          else item.error = "Intune reports " + (current.lostModeState || "unknown") + ". The request will not be repeated automatically.";
        } catch (error) { item.error = error.message; }
      }
      return await result();
    }
    if (action !== "lockdown-step" || batch.stage !== "running") throw new Error("No confirmed lockdown is waiting to run.");
    const item = batch.items.find(item => item.status === "queued");
    if (item) {
      try {
        const current = await graph("/beta/deviceManagement/managedDevices/" + item.device.id + "?$select=" + lockdownFields);
        lockdownEligible(current, item.serial, item.device.id);
        if (!disabling && current.lostModeState === target) { item.status = target; item.error = "Lost Mode is already " + target + "; no change was sent."; }
        else if (current.lostModeState === pending) { item.status = "requested"; item.error = "Intune already has a pending Lost Mode request. No duplicate was sent."; }
        else if (!disabling && current.lostModeState && current.lostModeState !== "disabled") throw new Error("Lost Mode is transitioning or unavailable. Check Intune before trying again.");
        else {
          item.status = "uncertain"; item.requestedAt = Date.now(); await result();
          if (disabling) await graph("/v1.0/deviceManagement/managedDevices/" + item.device.id + "/disableLostMode", { method: "POST" });
          else await graph("/beta/deviceManagement/managedDevices/" + item.device.id + "/enableLostMode", { method: "POST", body: JSON.stringify({ message: LOCKDOWN_MESSAGE, phoneNumber: LOCKDOWN_PHONE, footer: "" }) });
          item.status = "requested"; item.error = disabling ? "Disable Lost Mode command accepted by Intune. Keep the device online and verify the Lost Mode screen clears; acceptance does not confirm the device completed it." : "Intune accepted the request to enable Lost Mode. Check status to confirm the device completed it.";
        }
      } catch (error) {
        if (item.status !== "uncertain" || [400, 401, 403, 404, 429].includes(error.status)) item.status = "failed";
        item.error = error.message + (item.status === "uncertain" ? " The request may have been sent. Check status before retrying; it will not be repeated automatically." : "");
      }
    }
    if (!batch.items.some(item => item.status === "queued")) batch.stage = "complete";
    return await result();
  }

  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (message?.type !== "sidekick-api-wipe-test" || sender.id !== chrome.runtime.id || !["panel.html", "panel.html?tool=lockdown", "device-new-window.html"].some(page => sender.url === chrome.runtime.getURL(page))) return;
    if (operation) { respond({ ok: false, error: "A test action is already running. Wait for it to finish." }); return; }
    operation = execute(message);
    operation.then(result => respond({ ok: true, ...result })).catch(error => respond({ ok: false, error: error.name === "AbortError" ? "Microsoft took too long to respond. Try the read-only preview again." : error.message, ...(error.missingSerial ? { missingSerial: error.missingSerial } : {}) })).finally(() => { operation = null; });
    return true;
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.ttmtSidekickUserProfile) {
      void chrome.storage.session.remove(TOKEN_KEY);
      void chrome.storage.session.remove(DELETE_TOKEN_KEY);
      void chrome.storage.session.remove(LEGACY_DELETE_TOKEN_KEY);
    }
  });
})();
