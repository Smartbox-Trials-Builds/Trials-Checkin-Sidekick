// Browser-safe project configuration. Never put a Supabase secret key here.
(() => {
  const url = "https://pkdhsegkujujvmnielvh.supabase.co";
  const publishableKey = "sb_publishable_cshWlLHDDsuUK3o3VwUUGA_W4pNBeZh";

  async function testConnection() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      // Public Auth settings validate the key without signing in or reading user data.
      const response = await fetch(`${url}/auth/v1/settings`, {
        headers: { apikey: publishableKey, Accept: "application/json" },
        signal: controller.signal,
        cache: "no-store"
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Supabase rejected the connection. Check the project publishable key.");
        }
        throw new Error(`Supabase returned HTTP ${response.status}. Try again shortly.`);
      }
      const settings = await response.json();
      if (!settings.external || typeof settings.disable_signup !== "boolean") {
        throw new Error("Supabase returned an unexpected response.");
      }
      return { connected: true, url };
    } catch (error) {
      if (error.name === "AbortError") throw new Error("Connection timed out. Check your internet connection and try again.");
      if (error instanceof TypeError) throw new Error("Could not reach Supabase. Check your internet connection and reload the extension after updating it.");
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  let client;
  function getClient() {
    if (!client) {
      client = globalThis.supabase.createClient(url, publishableKey, {
        auth: {
          storageKey: "sidekick-supabase-session",
          storage: {
            async getItem(key) { return (await chrome.storage.local.get(key))[key] ?? null; },
            async setItem(key, value) { await chrome.storage.local.set({ [key]: value }); },
            async removeItem(key) { await chrome.storage.local.remove(key); }
          },
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false
        }
      });
    }
    return client;
  }

  async function saveProfile({ name, dashboardInitials, role }) {
    name = name.trim();
    dashboardInitials = dashboardInitials.trim();
    if (!name || name.length > 100 || !dashboardInitials || dashboardInitials.length > 20 ||
        !["Device Coordinator", "Device Systems Coordinator"].includes(role)) {
      throw new Error("Enter your name, Dashboard Initials, and one of the available roles.");
    }
    const supabase = getClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error("Your session could not be restored. Please try again.");
    let session = sessionData.session;
    if (!session) {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        if (error.code === "anonymous_provider_disabled") {
          throw new Error("Anonymous sign-ins must be enabled in Supabase Authentication settings.");
        }
        throw new Error("Could not connect your profile to Supabase. Please try again.");
      }
      session = data.session;
    }
    if (!session?.user?.id) throw new Error("Supabase did not create a user session. Please try again.");
    const { data, error } = await supabase.from("sidekick_user_profiles").upsert({
      user_id: session.user.id, name, dashboard_initials: dashboardInitials, role
    }, { onConflict: "user_id" }).select().single();
    if (error) throw new Error("Supabase could not save the profile. Check your connection and try again.");
    if (typeof globalThis.dispatchEvent === "function") {
      globalThis.dispatchEvent(new Event("sidekick-profile-saved"));
    }
    return data;
  }

  async function sendLiveClientName({ recipientId, notificationId, name, senderId }) {
    // Client Broadcast is transient. Never send this name to SQL or realtime.send().
    const client = getClient();
    const { data, error } = await client.auth.getSession();
    if (error || !data.session) throw new Error("Could not send the live client name.");
    await client.realtime.setAuth(data.session.access_token);
    const channel = client.channel(`sidekick-clients:${recipientId}`, { config: { private: true, broadcast: { ack: true } } });
    try {
      // Send directly without subscribing: the assigner can write to this private
      // inbox but must not be allowed to read another user's live client names.
      await channel.httpSend("client-name", { notificationId, name, senderId }, { timeout: 6000 });
    } finally { await client.removeChannel(channel); }
  }

  globalThis.sidekickSupabase = Object.freeze({ url, testConnection, saveProfile, getClient, sendLiveClientName });
})();
