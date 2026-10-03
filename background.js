// background.js
importScripts("libs/supabase.min.js", "supabase/connection.js", "workers/queue-window-worker.js");

chrome.runtime.onInstalled.addListener(() => {
  // This makes the side panel open automatically when the user clicks the extension icon.
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch(console.error);
});

// Optional: ensure the correct panel page is set for the current tab when clicked
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;

  await chrome.sidePanel.setOptions({
    tabId: tab.id,
    path: "panel.html",
    enabled: true
  }).catch(console.error);

  // IMPORTANT: do NOT call chrome.sidePanel.open() here
});
