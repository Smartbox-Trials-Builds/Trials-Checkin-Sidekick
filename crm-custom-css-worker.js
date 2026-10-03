// crm-custom-css-worker.js

(() => {
  const CRM_CUSTOM_CSS_ENABLED_STORAGE_KEY = "ttmtCrmSmartboxBlueThemeEnabled";
  const CRM_CUSTOM_CSS_THEME_VARS_STORAGE_KEY = "ttmtCrmCustomCssThemeVars";
  const SIDEKICK_THEME_STORAGE_KEY = "ttmtSidekickTheme";
  const CRM_CUSTOM_CSS_LINK_ID = "ttmt-crm-custom-theme-stylesheet";
  const CRM_CUSTOM_CSS_VARIABLE_STYLE_ID = "ttmt-crm-custom-theme-vars";
  const CRM_CUSTOM_CSS_PATH = "crm-css-themes/custom-crm-theme.css";
  const SIDEKICK_THEMES_CSS_PATH = "themes.css";
  const DEFAULT_SIDEKICK_THEME_VARS = {
    "text-color": "#e0e0e0",
    "container-bg": "#1e1e2f",
    "container-border": "#81cfff",
    "accent": "#81cfff",
    "input-bg": "#2a2a3a",
    "input-border": "#555555"
  };
  let sidekickThemeCssTextPromise = null;

  function getStoredValue(key) {
    return new Promise(resolve => {
      if (chrome?.storage?.local) {
        chrome.storage.local.get(key, res => resolve(res?.[key] ?? null));
        return;
      }
      const raw = localStorage.getItem(key);
      if (!raw) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(raw);
      }
    });
  }


  function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  async function getSidekickThemeCssText() {
    if (!sidekickThemeCssTextPromise) {
      sidekickThemeCssTextPromise = fetch(chrome.runtime.getURL(SIDEKICK_THEMES_CSS_PATH)).then(response => {
        if (!response.ok) throw new Error(`Unable to load ${SIDEKICK_THEMES_CSS_PATH}`);
        return response.text();
      }).catch(() => "");
    }
    return sidekickThemeCssTextPromise;
  }

  function parseThemeVarsFromCss(themeId, cssText) {
    if (!themeId || !cssText) return null;
    const pattern = new RegExp(`body\\[data-theme="${escapeRegex(themeId)}"\\]\\s*\\{([\\s\\S]*?)\\}`, "m");
    const match = cssText.match(pattern);
    if (!match) return null;
    const vars = {};
    match[1].replace(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi, (_, key, value) => {
      vars[key] = value.trim();
      return "";
    });
    return Object.keys(vars).length ? vars : null;
  }

  async function getStoredSidekickThemeVars() {
    const themePayload = await getStoredValue(CRM_CUSTOM_CSS_THEME_VARS_STORAGE_KEY);
    if (themePayload?.vars && typeof themePayload.vars === "object") return themePayload.vars;

    const themeId = await getStoredValue(SIDEKICK_THEME_STORAGE_KEY) || "ocean";
    const cssText = await getSidekickThemeCssText();
    return parseThemeVarsFromCss(themeId, cssText) || DEFAULT_SIDEKICK_THEME_VARS;
  }

  function cssVar(name, value) {
    return `  ${name}: ${value};`;
  }

  function buildCrmCustomCssVariableText(themeVars) {
    const vars = { ...DEFAULT_SIDEKICK_THEME_VARS, ...(themeVars || {}) };
    const bg = vars["container-bg"] || DEFAULT_SIDEKICK_THEME_VARS["container-bg"];
    const text = vars["text-color"] || DEFAULT_SIDEKICK_THEME_VARS["text-color"];
    const accent = vars["container-border"] || vars.accent || DEFAULT_SIDEKICK_THEME_VARS.accent;
    const inputBg = vars["input-bg"] || bg;
    const inputBorder = vars["input-border"] || accent;
    const link = vars.accent || accent;

    return [
      ":root{",
      cssVar("--ttmt-crm-bg", bg),
      cssVar("--ttmt-crm-text", text),
      cssVar("--ttmt-crm-accent", accent),
      cssVar("--ttmt-crm-heading", vars.accent || accent),
      cssVar("--ttmt-crm-link", link),
      cssVar("--ttmt-crm-input-bg", inputBg),
      cssVar("--ttmt-crm-muted-border", inputBorder),
      cssVar("--ttmt-crm-row-highlight", "rgba(0, 0, 0, 0.21)"),
      "}"
    ].join("\n");
  }

  function ensureCrmCustomCssVariables(themeVars) {
    let style = document.getElementById(CRM_CUSTOM_CSS_VARIABLE_STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = CRM_CUSTOM_CSS_VARIABLE_STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = buildCrmCustomCssVariableText(themeVars);
  }

  function ensureCrmCustomCssLink() {
    if (document.getElementById(CRM_CUSTOM_CSS_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = CRM_CUSTOM_CSS_LINK_ID;
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL(CRM_CUSTOM_CSS_PATH);
    document.head.appendChild(link);
  }

  async function setCrmCustomCssEnabled(enabled) {
    if (!enabled) {
      document.getElementById(CRM_CUSTOM_CSS_LINK_ID)?.remove();
      document.getElementById(CRM_CUSTOM_CSS_VARIABLE_STYLE_ID)?.remove();
      return;
    }

    const themeVars = await getStoredSidekickThemeVars();
    ensureCrmCustomCssVariables(themeVars);
    ensureCrmCustomCssLink();
  }

  async function updateCrmCustomCssThemeVars(themePayload) {
    if (!document.getElementById(CRM_CUSTOM_CSS_LINK_ID)) return;
    if (themePayload?.vars && typeof themePayload.vars === "object") {
      ensureCrmCustomCssVariables(themePayload.vars);
      return;
    }
    ensureCrmCustomCssVariables(await getStoredSidekickThemeVars());
  }

  function initCrmCustomCssWorker() {
    getStoredValue(CRM_CUSTOM_CSS_ENABLED_STORAGE_KEY).then(value => {
      setCrmCustomCssEnabled(Boolean(value));
    });
    if (chrome?.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "local") return;
        if (changes[CRM_CUSTOM_CSS_ENABLED_STORAGE_KEY]) {
          setCrmCustomCssEnabled(Boolean(changes[CRM_CUSTOM_CSS_ENABLED_STORAGE_KEY].newValue));
        }
        if (changes[CRM_CUSTOM_CSS_THEME_VARS_STORAGE_KEY]) {
          updateCrmCustomCssThemeVars(changes[CRM_CUSTOM_CSS_THEME_VARS_STORAGE_KEY].newValue);
        }
        if (changes[SIDEKICK_THEME_STORAGE_KEY] && !changes[CRM_CUSTOM_CSS_THEME_VARS_STORAGE_KEY]) {
          updateCrmCustomCssThemeVars(null);
        }
      });
    }
  }

  initCrmCustomCssWorker();
})();
