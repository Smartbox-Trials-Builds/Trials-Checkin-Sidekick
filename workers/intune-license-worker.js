// Microsoft tokens stay in extension session storage and are never sent to the panel.
(() => {
  const CLIENT = "c3568020-d287-44a2-91f0-0435507fab91";
  const TENANT = "7870fa94-0832-4bfd-b39b-44927dfd207b";
  const AUTH = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0`;
  const SCOPE = "https://graph.microsoft.com/DeviceManagementApps.Read.All offline_access";
  const TOKEN_KEY = "sidekickIntuneLicenseAuth";
  const monitoredApps = new Set([
    "Avaz AAC - Lifetime Edition", "CoughDrop", "Dialogue AAC", "GoTalk® NOW PLUS",
    "Grid for iPad - AAC", "Grid for iPad - VPP", "LAMP Words For Life",
    "Proloquo2Go AAC", "Proloquo4Text AAC", "Smartbox Link", "Speak for Yourself",
    "TouchChat HD- AAC w/ WordPower"
  ]);
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
    if (/AADSTS50011|redirect/i.test(data.error_description || "")) return "Add the redirect URI shown in Microsoft connection setup to your Entra app as a Single-page application, then reconnect.";
    if (["invalid_grant", "interaction_required", "login_required"].includes(data.error)) return "Your Microsoft sign-in has expired. Click Connect Microsoft account.";
    return "Microsoft sign-in could not be completed. Check the app registration and try connecting again.";
  }

  async function redeem(parameters) {
    const body = new URLSearchParams({ client_id: CLIENT, scope: SCOPE, ...parameters });
    const { response, data } = await request(`${AUTH}/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() });
    if (!response.ok || !data.access_token) throw new Error(tokenError(data));
    const granted = String(data.scope || "").split(/\s+/).some(scope => /(?:^|\/)DeviceManagementApps\.Read\.All$/i.test(scope));
    if (!granted) throw new Error("The Microsoft account did not grant permission to read Intune apps.");
    const stored = { accessToken: data.access_token, refreshToken: data.refresh_token || parameters.refresh_token, expiresAt: Date.now() + Number(data.expires_in || 0) * 1000 };
    await chrome.storage.session.set({ [TOKEN_KEY]: stored });
    return stored;
  }

  async function connect() {
    const verifier = random();
    const state = random();
    const challenge = encode(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
    const url = new URL(`${AUTH}/authorize`);
    url.search = new URLSearchParams({ client_id: CLIENT, response_type: "code", response_mode: "query", redirect_uri: redirect(), scope: SCOPE, state, code_challenge: challenge, code_challenge_method: "S256", prompt: "select_account" }).toString();
    const result = await chrome.identity.launchWebAuthFlow({ url: url.href, interactive: true });
    if (!result) throw new Error("Microsoft sign-in was cancelled.");
    const callback = new URL(result);
    const expected = new URL(redirect());
    if (callback.origin !== expected.origin || callback.pathname !== expected.pathname || callback.searchParams.get("state") !== state) throw new Error("The Microsoft sign-in response could not be verified. Connect again.");
    if (callback.searchParams.has("error")) throw new Error("Microsoft sign-in was declined or cancelled. Check the app permission and reconnect.");
    const code = callback.searchParams.get("code");
    if (!code) throw new Error("Microsoft did not return a sign-in code.");
    if (!(await access())) throw new Error("Your Sidekick role changed. Sign-in cancelled.");
    await redeem({ grant_type: "authorization_code", code, redirect_uri: redirect(), code_verifier: verifier });
    return { connected: true };
  }

  async function token() {
    const stored = (await chrome.storage.session.get(TOKEN_KEY))[TOKEN_KEY];
    if (stored?.accessToken && stored.expiresAt > Date.now() + 60000) return stored.accessToken;
    if (!stored?.refreshToken) throw new Error("Click Connect Microsoft account to load Intune license counts.");
    try { return (await redeem({ grant_type: "refresh_token", refresh_token: stored.refreshToken })).accessToken; }
    catch (error) { await chrome.storage.session.remove(TOKEN_KEY); throw error; }
  }

  async function licenses() {
    const bearer = await token();
    let url = "https://graph.microsoft.com/v1.0/deviceAppManagement/mobileApps";
    const rows = [];
    const visited = new Set();
    while (url) {
      const page = new URL(url);
      if (page.origin !== "https://graph.microsoft.com" || page.pathname !== "/v1.0/deviceAppManagement/mobileApps" || visited.has(url)) throw new Error("Microsoft returned an invalid license results page.");
      visited.add(url);
      if (visited.size > 100) throw new Error("Too many license result pages. Try refreshing again.");
      const { response, data } = await request(url, { headers: { Authorization: `Bearer ${bearer}`, Accept: "application/json" } });
      if (response.status === 401) { await chrome.storage.session.remove(TOKEN_KEY); throw new Error("Your Microsoft sign-in has expired. Reconnect your account."); }
      if (response.status === 403) throw new Error("Microsoft denied access. Check DeviceManagementApps.Read.All consent and your Intune account permissions.");
      if (response.status === 429) throw new Error("Microsoft has temporarily limited requests. Wait a minute, then refresh.");
      if (!response.ok) {
        const code = String(data.error?.code || "").replace(/[^a-z0-9_.-]/gi, "").slice(0, 100);
        throw new Error(`Microsoft Graph returned HTTP ${response.status}${code ? ` (${code})` : ""} while reading Intune apps. Try refreshing again.`);
      }
      if (!Array.isArray(data.value)) throw new Error("Microsoft returned an unexpected Intune app list. Try refreshing again.");
      for (const app of data.value) {
        if (app["@odata.type"] !== "#microsoft.graph.iosVppApp") continue;
        if (!monitoredApps.has(app.displayName)) continue;
        const total = Number.isInteger(app.totalLicenseCount) && app.totalLicenseCount >= 0 ? app.totalLicenseCount : null;
        const used = Number.isInteger(app.usedLicenseCount) && app.usedLicenseCount >= 0 ? app.usedLicenseCount : null;
        rows.push({ id: String(app.id), name: String(app.displayName), total, used, available: total === 2147483647 ? total : total !== null && used !== null && used <= total ? total - used : null });
      }
      url = data["@odata.nextLink"] || null;
    }
    return { connected: true, rows: rows.sort((a, b) => a.name.localeCompare(b.name)), updatedAt: Date.now() };
  }

  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (!message?.type?.startsWith("sidekick-intune-license-") || sender.id !== chrome.runtime.id) return;
    (async () => {
      if (!(await access())) throw new Error("App License Monitor is available to Device Systems Coordinators.");
      if (message.type === "sidekick-intune-license-config") return { redirectUri: redirect() };
      if (operation) throw new Error("A Microsoft connection or refresh is already running. Try again when it finishes.");
      operation = (async () => {
        if (message.type === "sidekick-intune-license-connect") return await connect();
        if (message.type === "sidekick-intune-license-refresh") return await licenses();
        if (message.type === "sidekick-intune-license-disconnect") { await chrome.storage.session.remove(TOKEN_KEY); return { connected: false }; }
        throw new Error("Unknown Intune license request.");
      })();
      try {
        const result = await operation;
        if (!(await access())) { await chrome.storage.session.remove(TOKEN_KEY); throw new Error("Your Sidekick role changed. Reconnect when using Device Systems tools."); }
        return result;
      } finally { operation = null; }
    })().then(result => respond({ ok: true, ...result })).catch(error => respond({ ok: false, error: error.name === "AbortError" ? "Microsoft took too long to respond. Try again." : error.message }));
    return true;
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.ttmtSidekickUserProfile) void chrome.storage.session.remove(TOKEN_KEY);
  });
})();
