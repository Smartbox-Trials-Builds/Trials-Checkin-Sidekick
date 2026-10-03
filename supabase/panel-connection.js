(() => {
  const button = document.getElementById("supabaseTestConnectionBtn");
  const status = document.getElementById("supabaseConnectionStatus");
  if (!button || !status) return;

  button.addEventListener("click", async () => {
    button.disabled = true;
    status.textContent = "Connecting to Supabase…";
    try {
      await globalThis.sidekickSupabase.testConnection();
      status.textContent = "Connected to Trials CRM Sidekick. Cloud features are ready to be set up.";
    } catch (error) {
      status.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
})();
