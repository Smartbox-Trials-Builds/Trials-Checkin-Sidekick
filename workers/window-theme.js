// Mirrors the palette actually rendered in Sidekick, including custom and rotating themes.
(() => {
  const keys = ["sidekickPopupTheme", "ttmtSidekickTheme", "ttmtCrmCustomCssThemeVars", "ttmtSidekickCustomThemes"];
  const applied = new Set();
  async function load() {
    const values = await chrome.storage.local.get(keys);
    const snapshot = values.sidekickPopupTheme;
    const preference = values.ttmtSidekickTheme || "ocean";
    const custom = values.ttmtSidekickCustomThemes?.find(theme => theme.id === preference);
    const fallback = values.ttmtCrmCustomCssThemeVars;
    const themeId = snapshot?.themeId || preference;
    const vars = snapshot?.vars || custom?.vars || (fallback?.themeId === preference ? fallback.vars : {});
    for (const name of applied) document.body.style.removeProperty(`--${name}`);
    applied.clear();
    document.body.dataset.theme = themeId;
    for (const [name, value] of Object.entries(vars)) {
      if (typeof value !== "string" || !value) continue;
      document.body.style.setProperty(`--${name}`, value);
      applied.add(name);
    }
    if (!snapshot && custom?.containerImage) {
      document.body.style.setProperty("--custom-container-bg-image", `url("${custom.containerImage}")`);
      applied.add("custom-container-bg-image");
    }
  }
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && keys.some(key => changes[key])) void load();
  });
  void load();
})();
