const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const styles = new Map();
const values = { ttmtSidekickTheme: "forest" };
let change;
const body = { dataset: {}, style: { setProperty: (key, value) => styles.set(key, value), removeProperty: key => styles.delete(key) } };
vm.runInNewContext(fs.readFileSync(`${__dirname}/window-theme.js`, "utf8"), {
  document: { body },
  chrome: { storage: { local: { get: async () => values }, onChanged: { addListener: fn => { change = fn; } } } }
});
const settle = async () => { for (let i = 0; i < 10; i++) await new Promise(resolve => setImmediate(resolve)); };
(async () => {
  await settle();
  assert.equal(body.dataset.theme, "forest", "Saved built-in theme is used before a snapshot exists");
  values.sidekickPopupTheme = { themeId: "customTheme-test", vars: { "bg-color": "#123456", "text-color": "#abcdef", "custom-container-bg-image": "url(\"data:image/png;base64,test\")", "base-font-family": "Quicksand" } };
  change({ sidekickPopupTheme: {} }, "local"); await settle();
  assert.equal(body.dataset.theme, "customTheme-test");
  assert.equal(styles.get("--bg-color"), "#123456");
  assert.equal(styles.get("--base-font-family"), "Quicksand");
  assert.match(styles.get("--custom-container-bg-image"), /data:image/);
  values.sidekickPopupTheme = { themeId: "sunset", vars: { "bg-color": "#141010", "button-text-color": "#ff9f68" } };
  change({ sidekickPopupTheme: {} }, "local"); await settle();
  assert.equal(body.dataset.theme, "sunset");
  assert.equal(styles.has("--custom-container-bg-image"), false, "Previous custom backgrounds must be cleared");
  assert.equal(styles.get("--button-text-color"), "#ff9f68");
  // Verify the panel publisher includes derived colors, fonts and custom images.
  const source = fs.readFileSync(`${__dirname}/panel.js`, "utf8");
  const start = source.indexOf("function publishPopupTheme()");
  const end = source.indexOf("function clearInlineThemeVars()", start);
  let saved;
  const publisher = {
    document: { body: { dataset: { theme: "nflTest" } } },
    CUSTOM_THEME_DEFAULT_VARS: { "bg-color": "" },
    getComputedStyle: () => ({ getPropertyValue: key => ` ${key}-resolved ` }),
    setStoredValue: async (_, value) => { saved = value; }
  };
  vm.runInNewContext(source.slice(start, end) + "publishPopupTheme();", publisher);
  assert.equal(saved.themeId, "nflTest");
  assert.equal(saved.vars["button-text-color"], "--button-text-color-resolved");
  assert.equal(saved.vars["custom-container-bg-image"], "--custom-container-bg-image-resolved");
  console.log("PASS: initial saved theme, live theme changes, custom palette and images, stale-style cleanup, fonts, and rendered palette publishing.");
})().catch(error => { console.error(error); process.exitCode = 1; });
