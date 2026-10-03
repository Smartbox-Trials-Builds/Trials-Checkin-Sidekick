// panel.js

/* ---------------- CONFIG / XPATHS ---------------- */

// Notes (still used)
const NOTE_BOX_XPATH = '//*[@id="ctl00_MainContent_Tabs_tpNotes_txtNote"]';
const NOTE_CATEGORY_XPATH = '//*[@id="ctl00_MainContent_Tabs_tpNotes_ddlEditNoteCategory"]';
const NOTE_SUBMIT_XPATH = '//*[@id="ctl00_MainContent_Tabs_tpNotes_btnAddNote"]';
const NOTES_TAB_XPATH = '//*[@id="__tab_ctl00_MainContent_Tabs_tpNotes"]/span';
const LOCK_DOWN_NOTE_CATEGORY_OPTION_XPATH = '//*[@id="ctl00_MainContent_Tabs_tpNotes_ddlEditNoteCategory"]/option[60]';
const DOCUMENTS_TAB_XPATH = '//*[@id="__tab_ctl00_MainContent_Tabs_tpDocuments"]/span';
const DOCUMENT_UPLOAD_INPUT_XPATH = '//*[@id="ctl00_MainContent_Tabs_tpDocuments_filUpload"]';
const DOCUMENT_UPLOAD_BUTTON_XPATH = '//*[@id="ctl00_MainContent_Tabs_tpDocuments_btnUpload"]';
const DOCUMENT_UPLOAD_SUCCESS_XPATH = '//*[@id="ctl00_MainContent_Tabs_tpDocuments_lblFileUploadSuccess"]';
const DOCUMENT_TITLE_INPUT_XPATH = '//*[@id="ctl00_MainContent_Tabs_tpDocuments_txtDocumentTitle"]';
const DOCUMENT_ADD_BUTTON_XPATH = '//*[@id="ctl00_MainContent_Tabs_tpDocuments_btnAddDocument"]';
const IDENTIFIER_STORAGE_KEY = "ttmtLastInventoryIdentifiers";
const INVENTORY_NEXT_STEP_URL = "https://smartboxassistivetnam.sharepoint.com/sites/TTM-TrialsSharePointDonotemail/_layouts/15/listforms.aspx?cid=ZjIxMDkwNDQtYmE0My00ZmRmLWI1OGItMTA3YjI1NjRkODQ5&nav=NjZiMzJiNDktYTI3NS00YjI1LTk3OWMtYmVkNjExNmQ3Y2U5&xsdata=MDV8MDJ8fDE1ZTBmMWYwY2VhMTQ0YWQxNTc1MDhkZTkxOGVjY2I3fGI2OWMxN2I3MTg4MTQ5ZWE4YzQ2Y2VmYWEwMDZhY2I4fDB8MHw2MzkxMDgyMzk2MzkxMjMzMTd8VW5rbm93bnxWR1ZoYlhOVFpXTjFjbWwwZVZObGNuWnBZMlY4ZXlKRFFTSTZJbFJsWVcxelgwRlVVRk5sY25acFkyVmZVMUJQVEU5R0lpd2lWaUk2SWpBdU1DNHdNREF3SWl3aVVDSTZJbGRwYmpNeUlpd2lRVTRpT2lKUGRHaGxjaUlzSWxkVUlqb3hNWDA9fDF8TDJOb1lYUnpMekU1T2pGalpqQTVZVEk0TFdGaFlXUXRORFl6TkMwNU5tTTNMVGxpTUdGalpUTmpaV0l4WTE4NFpERmpaakkyT1MwNE1UWXpMVFJpWkdNdFlUa3pNQzAxTkRGbE5UazJPV1F5T1RsQWRXNXhMbWRpYkM1emNHRmpaWE12YldWemMyRm5aWE12TVRjM05USXlOekUyTXpJNU1BPT18MGQ3MWM2MDRhYjQzNGM3ZTE1NzUwOGRlOTE4ZWNjYjd8YjgyMmI2MjJiNTM3NDMzNzk5ZDNmMjdiNTllNDBjM2Y%3D&sdata=dWVyMUk3M2dMWXpZS3NKaEkxOWRMNVNNMmhoMkVaUThKNFhFRmNuK3htRT0%3D&ovuser=b69c17b7-1881-49ea-8c46-cefaa006acb8%2Cjordan.wasem%40smartboxaac.com&OR=Teams-HL&CT=1775229748146&clickparams=eyJBcHBOYW1lIjoiVGVhbXMtRGVza3RvcCIsIkFwcFZlcnNpb24iOiI0OS8yNjAyMjcwNDIxNSIsIkhhc0ZlZGVyYXRlZFVzZXIiOmZhbHNlfQ%3D%3D";
const SMARTBOX_REPAIR_TRACKER_URL = "https://forms.office.com/Pages/ResponsePage.aspx?id=txectoEY6kmMRs76oAasuMauVYrkfDhDmQiSzP-xq45UOEFWM0RKODk4RFdKTzFPQ1pNRFRSOVo4MC4u";
const QA_FORM_URL = "https://forms.office.com/pages/responsepage.aspx?id=txectoEY6kmMRs76oAasuDheUnq1C8VLkGCxjAvlKlpUNERSVTdMR0ZIWThFRU83MFhXSTRJM1cyMCQlQCN0PWcu&route=shorturl";
const KG_REQUESTS_URL = "https://smartboxassistivetnam.sharepoint.com/sites/TTM-TrialsSharePointDonotemail/Lists/Keyguard%20Requests%20%20CF%20Test/AllItems.aspx?sortField=DateFinished&isAscending=false&viewid=26746a42%2Db61a%2D4461%2D9dae%2D989709a73549";
const OUTLOOK_COMPOSE_BASE_URL = "https://outlook.office.com/mail/deeplink/compose";
const OUTLOOK_SETUP_URL = "https://outlook.office365.com/mail/";
const GRID_LICENSE_REGISTRATION_URL = "https://grids.thinksmartbox.com/en/log-in";
const ADP_SIGNIN_URL = "https://online.adp.com/signin/v1/?APPID=WFNPortal&productId=80e309c3-7085-bae1-e053-3505430b5495&returnURL=https://workforcenow.adp.com/&callingAppId=WFN&TARGET=-SM-https%3a%2f%2fworkforcenow%2eadp%2ecom%2ftheme%2findex%2ehtml%23/home";
const DAF_DATA_STORAGE_KEY = "ttmtLastCheckinForDaf";
const THEME_STORAGE_KEY = "ttmtSidekickTheme";
const CUSTOM_THEME_STORAGE_KEY = "ttmtSidekickCustomTheme";
const CUSTOM_THEMES_STORAGE_KEY = "ttmtSidekickCustomThemes";
const CUSTOM_THEME_ACTIVE_ID_STORAGE_KEY = "ttmtSidekickCustomThemeActiveId";
const CHAOS_ROTATION_STORAGE_KEY = "ttmtSidekickChaosRotationSeconds";
const CHECKIN_CLEANUP_FOLDER_NAME_STORAGE_KEY = "ttmtCheckinCleanupFolderName";
const CHECKIN_CLEANUP_HANDLE_DB = "ttmtSidekickHandles";
const CHECKIN_CLEANUP_HANDLE_STORE = "handles";
const CHECKIN_CLEANUP_HANDLE_KEY = "checkinCleanupFolder";
const TRIAL_FILES_FOLDER_NAME_STORAGE_KEY = "ttmtTrialFilesFolderName";
const TRIAL_FILES_HANDLE_KEY = "trialFilesFolder";
const LOGS_FOLDER_NAME_STORAGE_KEY = "ttmtLogsFolderName";
const LOGS_HANDLE_KEY = "logsFolder";
const LOGS_SHAREPOINT_FOLDER_URL = "https://talktometechnologies2com.sharepoint.com/sites/TrialsSharePoint2/Shared%20Documents/Forms/AllItems.aspx?id=%2Fsites%2FTrialsSharePoint2%2FShared%20Documents%2FTrials%20Operations%2FCRM%20Sidekick%20%2D%20Browser%20Ext%2FLogs&viewid=c09dd3c3%2Dbe9b%2D48f7%2D9635%2D46c9f9037922";
const DAILY_COUNTER_STORAGE_KEY = "ttmtDailyTaskCounters";
const DAILY_COUNTER_ENABLED_STORAGE_KEY = "ttmtDailyTaskCounterEnabled";
const DAILY_CUSTOM_COUNTER_LABEL_STORAGE_KEY = "ttmtDailyCustomCounterLabel";
const DAILY_CUSTOM_COUNTER_ENABLED_STORAGE_KEY = "ttmtDailyCustomCounterEnabled";
const WEEKLY_COUNTER_STORAGE_KEY = "ttmtWeeklyTaskCounterTotal";
const WEEKLY_AVERAGE_ENABLED_STORAGE_KEY = "ttmtWeeklyTaskAverageEnabled";
const WEEKLY_AVERAGE_DAYS_STORAGE_KEY = "ttmtWeeklyTaskAverageDaysWorked";
const TIMECARD_STORAGE_KEY = "ttmtTimecardSidekickWeek";
const WEEKLY_COUNTER_ENABLED_STORAGE_KEY = "ttmtWeeklyTaskCounterEnabled";
const DAILY_COUNTER_COLLAPSED_STORAGE_KEY = "ttmtDailyTaskCounterCollapsed";
const WEEKLY_COUNTER_COLLAPSED_STORAGE_KEY = "ttmtWeeklyTaskCounterCollapsed";
const LANDING_TOOLTIPS_ENABLED_STORAGE_KEY = "ttmtLandingTooltipsEnabled";
const CRM_CUSTOM_CSS_ENABLED_STORAGE_KEY = "ttmtCrmSmartboxBlueThemeEnabled";
const CRM_CUSTOM_CSS_THEME_VARS_STORAGE_KEY = "ttmtCrmCustomCssThemeVars";
const CORNER_SYMOJI_STORAGE_KEY = "ttmtSidekickCornerSymoji";
const LANDING_LAYOUT_STORAGE_KEY = "ttmtLandingLayoutOrder";
const LANDING_LAYOUT_POSITIONS_STORAGE_KEY = "ttmtLandingLayoutPositions";
const PREP_CHECKLIST_ORDER_STORAGE_KEY = "ttmtPrepChecklistCategoryOrder";
const GRIDPAD_CHECKLIST_ORDER_STORAGE_KEY = "ttmtGridPadChecklistCategoryOrder";
const LANDING_MASCOT_VISIBLE_STORAGE_KEY = "ttmtLandingMascotVisible";
const LANDING_SYMOJI_VISIBLE_STORAGE_KEY = "ttmtLandingSymojiVisible";
const DEFAULT_CHAOS_ROTATION_SECONDS = 30;
const CUSTOM_THEME_ID_PREFIX = "customTheme-";
const DEFAULT_CUSTOM_THEME_NAME = "Custom Theme";
const DEFAULT_CUSTOM_COUNTER_LABEL = "Custom";
const DEVICE_LOOKUP_EXCEL_WEB_URL = "https://smartboxassistivetnam.sharepoint.com/:x:/r/sites/TTM-TrialsSharePointDonotemail/_layouts/15/Doc.aspx?sourcedoc=%7B26B9A3EE-E208-45EA-802D-1537F50DB403%7D&file=RWL%20and%20LTL%20Update.xlsx&action=default&mobileredirect=true";
const DEVICE_LOOKUP_SHEET_LINKS = {
  "LTL Update List": DEVICE_LOOKUP_EXCEL_WEB_URL,
  "Return Watchlist": DEVICE_LOOKUP_EXCEL_WEB_URL
};
const MOUNT_LOG_EXCEL_WEB_URL = "https://smartboxassistivetnam.sharepoint.com/:x:/r/sites/TrialsSharePoint.us/_layouts/15/Doc.aspx?sourcedoc=%7BA4CCC729-C4AC-4A69-83C1-2F0EB73A39B5%7D&file=MountLog.xlsx&action=default&mobileredirect=true";
const LOAN_LIBRARY_CRM_CHECK_EXCEL_WEB_URL = "https://smartboxassistivetnam.sharepoint.com/:x:/r/sites/TTM-TrialsSharePointDonotemail/_layouts/15/Doc.aspx?sourcedoc=%7B1C8B4B2D-D0A2-4D7F-98BB-48E88633474B%7D&file=Loan%20Library%20CRM%20Check%20V3.xlsm&action=default&mobileredirect=true";
const DEVICE_LOOKUP_WORKBOOK_WEB_URLS = {
  ltl: DEVICE_LOOKUP_EXCEL_WEB_URL,
  mount: MOUNT_LOG_EXCEL_WEB_URL,
  crm: LOAN_LIBRARY_CRM_CHECK_EXCEL_WEB_URL
};
const DEVICE_LOOKUP_WORKBOOK_DOWNLOAD_URLS = {
  ltl: "https://smartboxassistivetnam.sharepoint.com/sites/TTM-TrialsSharePointDonotemail/_layouts/15/download.aspx?UniqueId=%7B26B9A3EE-E208-45EA-802D-1537F50DB403%7D",
  mount: "https://smartboxassistivetnam.sharepoint.com/sites/TrialsSharePoint.us/_layouts/15/download.aspx?UniqueId=%7BA4CCC729-C4AC-4A69-83C1-2F0EB73A39B5%7D",
  crm: "https://smartboxassistivetnam.sharepoint.com/sites/TTM-TrialsSharePointDonotemail/_layouts/15/download.aspx?UniqueId=%7B1C8B4B2D-D0A2-4D7F-98BB-48E88633474B%7D"
};
const DEVICE_LOOKUP_WORKBOOK_DISPLAY_NAMES = {
  ltl: "RWL and LTL Update.xlsx",
  mount: "MountLog.xlsx",
  crm: "Loan Library CRM Check V3.xlsm"
};
const DEVICE_LOOKUP_WORKBOOKS_STORAGE_KEY = "ttmtDeviceLookupWorkbooks";
const DEVICE_LOOKUP_WORKBOOK_META_STORAGE_KEY = "ttmtDeviceLookupWorkbookMeta";
const DEVICE_LOOKUP_HANDLE_KEY_PREFIX = "ttmtDeviceLookupWorkbook";
const GRID_LOCK_CHANGES_STORAGE_KEY = "ttmtGridLockChanges";
const PRE_PREP_SIDEKICK_ENABLED_STORAGE_KEY = "ttmtPrePrepSidekickEnabled";
const PRE_PREP_SIDEKICK_PASSCODE = "@ppl3";
const CRM_ORIGINS = [
  "https://portal.talktometechnologies.com",
  "https://crm.talktometechnologies.com"
];
const CRM_TAB_URL_PATTERNS = CRM_ORIGINS.map(origin => `${origin}/*`);
const CRM_PRIMARY_ORIGIN = CRM_ORIGINS[0];
let qaFormTabId = null;
let smartboxRepairTabId = null;
const DEFAULT_LANDING_LAYOUT_POSITIONS = {};

/* ---------------- Helpers ---------------- */
const VIEW_IDS = ["welcomeView", "onboardingView", "outlookSetupView", "landingView", "settingsView", "themeBuilderView", "prePrepView", "lockDownView", "timecardView", "deviceLookupView", "gridView", "prepTypeView", "prepSlCrmView", "prepView", "prepChecklistOrderView", "gridPadPrepView", "gridPadChecklistOrderView", "ageCalculatorView", "formView", "completeView", "ltlCompletionView", "smartboxRepairView", "inventoryView", "dafRecapView", "emailView", "appOverridesView", "qaCompleteView"];
const MULTI_THEME_IDS = new Set([
  "coral",
  "lagoon",
  "prism",
  "neon",
  "tropic",
  "auroraBurst",
  "retroWave",
  "peacock",
  "emberSky",
  "electricMeadow",
  "solarBloom",
  "galaxyTrail",
  "cobaltSunset",
  "frostfire",
  "berryBlitz",
  "canyonLights",
  "holoWave",
  "jadeFlare",
  "lavaPool",
  "moonlitSurf",
  "novaPunch",
  "orchidIce",
  "pulseRift",
  "rainbowRoad",
  "saffronTide",
  "skylineGlow",
  "spectrumNoir",
  "vividHarbor",
  "zenithMix"
]);
const NFL_THEME_IDS = new Set([
  "nflCardinals",
  "nflFalcons",
  "nflRavens",
  "nflBills",
  "nflPanthers",
  "nflBears",
  "nflBengals",
  "nflBrowns",
  "nflCowboys",
  "nflBroncos",
  "nflLions",
  "nflPackers",
  "nflTexans",
  "nflColts",
  "nflJaguars",
  "nflChiefs",
  "nflRaiders",
  "nflChargers",
  "nflRams",
  "nflDolphins",
  "nflVikings",
  "nflPatriots",
  "nflSaints",
  "nflGiants",
  "nflJets",
  "nflEagles",
  "nflSteelers",
  "nfl49ers",
  "nflSeahawks",
  "nflBuccaneers",
  "nflTitans",
  "nflCommanders"
]);
const SPECIAL_THEME_IDS = new Set(["chaos", "surpriseParty", "rainbowParty", "sciFiCommand"]);
const ANIME_THEME_IDS = new Set([
  "animeNaruto",
  "animeOnePiece",
  "animeDragonBall",
  "animeAttackOnTitan",
  "animeDemonSlayer",
  "animeJujutsuKaisen",
  "animeMyHero",
  "animeSailorMoon",
  "animeDeathNote",
  "animeFullmetal"
]);
const THEME_CATEGORY_LABELS = {
  single: "Single Color Themes",
  multi: "Multi Color Themes",
  anime: "Anime Themes",
  nfl: "NFL Themes",
  custom: "Custom Themes",
  special: "Special Themes"
};
const THEME_CATEGORY_ORDER = ["single", "multi", "anime", "nfl", "custom", "special"];
const CUSTOM_THEME_FIELDS = [
  { key: "bg-color", label: "Background" },
  { key: "text-color", label: "Text" },
  { key: "muted-text", label: "Muted text" },
  { key: "container-bg", label: "Container background" },
  { key: "container-border", label: "Container border" },
  { key: "accent", label: "Accent" },
  { key: "accent-strong", label: "Accent strong" },
  { key: "accent-strong-hover", label: "Accent hover" },
  { key: "input-bg", label: "Input background" },
  { key: "input-border", label: "Input border" },
  { key: "note-bg", label: "Note background" },
  { key: "note-border", label: "Note border" },
  { key: "error-color", label: "Error color" }
];
const LANDING_LAYOUT_ITEMS = [
  { id: "dailyCounter", label: "Daily task counter" },
  { id: "weeklyCounter", label: "Weekly task counter" },
  { id: "crmNavigator", label: "CRM navigator" },
  { id: "checkinTools", label: "Check-in tools button" },
  { id: "prepTools", label: "Prep tools button" },
  { id: "prePrepTools", label: "Pre-Prep tools button" },
  { id: "qaForm", label: "QA form button" },
  { id: "trialsLinks", label: "Trials links button" },
  { id: "userSettings", label: "User settings button" }
];
const PREP_CHECKLIST_CATEGORIES = [
  {
    id: "binPreparation",
    title: "Bin Preparation",
    items: [
      { id: "prepChargers", label: "Gather Correct Chargers" },
      { id: "prepStrapClips", label: "Shoulder strap has Correct clips" },
      {
        id: "prepFolderMaterials",
        label: "Folder is prepared with all necessary materials (Include Spanish AND English materials if device has any Spanish requested vocab or Spanish Interpreter Needed  Shipping reminder is present for all non-LTL devices)"
      }
    ]
  },
  {
    id: "deviceCondition",
    title: "Device and Case Condition",
    items: [
      { id: "prepDeviceCondition", label: "Ensure Device is in good condition" },
      { id: "prepScreenProtector", label: "Check Screen protector for scratches/Bubbles" },
      { id: "prepScreenScratches", label: "Check screen for any scratches" },
      { id: "prepDevicePerformance", label: "Device is performing well" },
      { id: "prepCaseCondition", label: "Case is in Good Condition" }
    ]
  },
  {
    id: "requestedAccessories",
    title: "Requested Accessories",
    items: [
      { id: "prepAccessories", label: "Accessories listed on the Device Tab are with the Device" },
      {
        id: "prepKeyguards",
        label: "Make sure requested keyguard(s) and keyguard frame are present, fit properly, and do not have sharp edges"
      }
    ]
  },
  {
    id: "iosSettings",
    title: "iOS Settings",
    items: [
      { id: "prepBackboxBluetooth", label: "Backbox connected via Bluetooth" },
      {
        id: "prepCameraAccess",
        label: "Camera and Photo Access Allowed (Only needed for requested Main 4 apps)"
      }
    ]
  },
  {
    id: "iosSettings1",
    title: "iOS Settings 1",
    items: [
      { id: "prepAutoLock", label: "Display and Brightness - Auto-Lock set to 10 minutes" },
      { id: "prepDockSliders", label: "Home Screen & App Library - Dock sliders are turned off" },
      { id: "prepGestures", label: "Multitasking & Gestures - All sliders turned off" }
    ]
  },
  {
    id: "iosSettings2",
    title: "iOS Settings 2",
    items: [
      { id: "prepSiriSuggestions", label: "Notifications - Siri Suggestions - All Off" },
      { id: "prepNotificationStyle", label: "Notifications - Notification Style - All Off" },
      { id: "prepItunesPurchases", label: "Screen Time - iTunes & App Store purchases turned off" },
      { id: "prepSiriDictation", label: "Screen Time - Siri & Dictation - Off" },
      { id: "prepScreenTimePasscode", label: "Screen Time passcode set to 9357" }
    ]
  },
  {
    id: "crm",
    title: "CRM",
    items: [
      { id: "prepVocabSet", label: "Vocab Set filled out as necessary" },
      { id: "prepGridAccounts", label: "Grid accounts are added to device tab" }
    ]
  }
];

const GRIDPAD_CHECKLIST_CATEGORIES = [
  {
    id: "dashboardAccessories",
    title: "Dashboard and Accessories",
    items: [
      { id: "gridPadDashboardInitial", label: "Initial in Trials Dashboard (Column I next to X in Column H)." },
      { id: "gridPadOpenCrm", label: "Open CRM and check Device Tab and PG." },
      { id: "gridPadConfirmAccessories", label: "Confirm required accessories (switches, mounts, KGs, etc.)." },
      { id: "gridPadAccessoryInventory", label: "Verify accessories are in-house before prepping." }
    ]
  },
  {
    id: "deviceInspection",
    title: "Device Inspection",
    items: [
      { id: "gridPadMatchDashboard", label: "Match device to dashboard entry." },
      { id: "gridPadInspectCase", label: "Inspect case and backbox for cracks or damage." },
      { id: "gridPadButtons", label: "Check power and volume buttons." },
      { id: "gridPadStickers", label: "Verify TTMT sticker and QR/serial code." },
      { id: "gridPadUsbPorts", label: "Check USB ports (2 right, 1 left, 1 top)." },
      { id: "gridPadFlipStand", label: "Flip stand stops." }
    ]
  },
  {
    id: "remote",
    title: "Remote (LTL or request only)",
    items: [
      { id: "gridPadRemoteBlue", label: "Press two outside smart buttons for 7 seconds until flashing blue." },
      { id: "gridPadRemoteGreen", label: "Press pairing button inside remote until green confirmation." },
      { id: "gridPadRemotePower", label: "In Grid: Settings → Devices → Remote Power Button → Set all to ON (5 second default)." }
    ]
  },
  {
    id: "windowsSetup",
    title: "Windows Setup",
    items: [
      { id: "gridPadWindowsPauseUpdates", label: "Pause Windows Updates for 5 weeks (do NOT run updates)." },
      { id: "gridPadDesktopGrid3", label: "Desktop layout left side top to bottom: Grid 3." },
      { id: "gridPadDesktopLookLab", label: "Desktop layout: Look Lab." },
      { id: "gridPadDesktopLookToRead", label: "Desktop layout: Look to Read." },
      { id: "gridPadDesktopLookToLearn", label: "Desktop layout: Look to Learn." },
      { id: "gridPadDesktopSmartboxHub", label: "Desktop layout: Smartbox Hub." },
      { id: "gridPadDesktopIntelliGaze", label: "Desktop layout: IntelliGaze." },
      { id: "gridPadRecycleBin", label: "Move Recycle Bin to top right." },
      { id: "gridPadTaskbarUnpin", label: "Unpin Edge, Microsoft Store, and File Explorer from taskbar." },
      { id: "gridPadPrivacyAccount", label: "Privacy and Security: Turn OFF Account Info." },
      { id: "gridPadPrivacyDevices", label: "Privacy and Security: Turn OFF Other Devices." },
      { id: "gridPadPrivacyDiagnostics", label: "Privacy and Security: Turn OFF App Diagnostics." }
    ]
  },
  {
    id: "edgeSetup",
    title: "Microsoft Edge Setup",
    items: [
      { id: "gridPadEdgeShowContent", label: "All loan types: Open new tab → Page Settings → Turn OFF Show Content." },
      { id: "gridPadEdgeLtlPages", label: "LTL only: Settings → Start, Home, New Tabs → Open these pages → Add www.talktometechnologies.com." },
      { id: "gridPadEdgeHomeButton", label: "LTL only: Turn ON Home Button → same URL." },
      { id: "gridPadEdgeConfirm", label: "Close and reopen Edge to confirm." }
    ]
  },
  {
    id: "backboxSetup",
    title: "Backbox Setup (Grid Pad Go only)",
    items: [
      { id: "gridPadBackboxPair", label: "Pair Bluetooth Backbox." },
      { id: "gridPadBackboxConnect", label: "Open Smartbox Link → Connect Backbox." },
      { id: "gridPadBackboxSkipUpdates", label: "Skip updates." },
      { id: "gridPadBackboxPowerCycle", label: "Power cycle Backbox." },
      { id: "gridPadBackboxSwitchPorts", label: "In Grid → Settings → Access → Switches → Connection → Select Switch Ports." }
    ]
  },
  {
    id: "cameraSetup",
    title: "Camera Setup",
    items: [
      { id: "gridPadVidaUpdate", label: "VIDA (if applicable): Update camera." },
      { id: "gridPadVidaAutoUpdate", label: "VIDA (if applicable): Turn off automatic updates." },
      { id: "gridPadVidaCalibrate", label: "VIDA (if applicable): Calibrate." },
      { id: "gridPadLuminiPlug", label: "Lumin-i (if applicable): Plug in (auto-detected in Grid)." }
    ]
  },
  {
    id: "gridAccountSetup",
    title: "Grid Account Setup",
    items: [
      { id: "gridPadGetStarted", label: "Open Grid → New → Get Started." },
      { id: "gridPadNameFormat", label: "Enter First Name + Last Initial (Clinic name for LTL)." },
      { id: "gridPadLogoWallpaper", label: "Set TTMT Logo wallpaper." },
      { id: "gridPadCreateAccounts", label: "Create Grid and Dropbox account." },
      { id: "gridPadEmailFormat", label: "Email format: firstname + lastinitial + CRM# @wegotalk.com." },
      { id: "gridPadPasswordFormat", label: "Password: Xqxq77##." },
      { id: "gridPadDocumentCredentials", label: "Document email and password in CRM Device Tab." }
    ]
  },
  {
    id: "addVocabulary",
    title: "Add Vocabulary",
    items: [
      { id: "gridPadExistingUser", label: "Sign into existing user if applicable." },
      { id: "gridPadImportProfile", label: "OR import GridPad Resources Profile." },
      { id: "gridPadCopyVocab", label: "Copy vocab (less than 4 folders at a time)." },
      { id: "gridPadPodd", label: "Add PODD sets." },
      { id: "gridPadLookSuite", label: "Add Look Suite (eyegaze only)." }
    ]
  },
  {
    id: "customizeSettings",
    title: "Customize Grid Settings",
    items: [
      { id: "gridPadAccessMethod", label: "Access method matches PG (Eyegaze or Switch)." },
      { id: "gridPadCalibration", label: "Calibration complete." },
      { id: "gridPadVoice", label: "Voice matches PG." }
    ]
  },
  {
    id: "camerasAudio",
    title: "Cameras and Audio (Grid Pad Go)",
    items: [
      { id: "gridPadCameraFront", label: "Cameras: Front = Surface Camera Front." },
      { id: "gridPadCameraRear", label: "Cameras: Rear = Surface Camera Back." },
      { id: "gridPadCameraTest", label: "Test cameras in Fast Talker." },
      { id: "gridPadAudioSpeech", label: "Audio: F10 → Speech → Speaking → Smartbox AAC (Backbox SN)." },
      { id: "gridPadAudioFeedback", label: "Audio: F10 → Speech → Audio Feedback → Smartbox AAC (Backbox SN)." },
      { id: "gridPadAudioTest", label: "Test left and right speakers." },
      { id: "gridPadUnlockLookLab", label: "Unlock Look Lab." }
    ]
  },
  {
    id: "folderContents",
    title: "Folder Contents",
    items: [
      { id: "gridPadFolderSchoolBoard", label: "Left side (bottom to top): School Board (if pediatric/LTL/STL)." },
      { id: "gridPadFolderStickers", label: "Left side: Stickers." },
      { id: "gridPadFolderAacScript", label: "Left side: AAC Script." },
      { id: "gridPadFolderFaq", label: "Left side: FAQ." },
      { id: "gridPadFolderNextSteps", label: "Left side: Next Steps." },
      { id: "gridPadFolderExamples", label: "Right side (bottom to top): Examples of Use." },
      { id: "gridPadFolderDisinfection", label: "Right side: Disinfection Sheet." },
      { id: "gridPadFolderQuickReference", label: "Right side: Zuvo and Grid Pad Quick Reference Sheet." },
      { id: "gridPadFolderGuide", label: "Right side: User Guide (based on eyegaze)." },
      { id: "gridPadFolderWelcome", label: "Right side: Welcome Card." },
      { id: "gridPadFolderMagnet", label: "Right side: Magnet Warning." },
      { id: "gridPadFolderChoking", label: "Right side: Choking Hazard." }
    ]
  },
  {
    id: "bagBin",
    title: "Bag and Bin",
    items: [
      { id: "gridPadBagCharger", label: "Include charger." },
      { id: "gridPadBagRemote", label: "Include remote if applicable." },
      { id: "gridPadBagFolder", label: "Include folder." },
      { id: "gridPadBagAllItems", label: "Place all items in bin." }
    ]
  }
];

const PREP_CHECKLIST_SL_CATEGORY_OVERRIDES = {
  binPreparation: {
    title: "Bin Preparation",
    items: [
      { id: "prepChargers", label: "Gather Correct Chargers" },
      { id: "prepStrapClips", label: "Shoulder strap has Correct clips" },
      { id: "prepShippingReminder", label: "Added Shipping reminder" }
    ]
  }
};

function clampNumber(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function showView(targetId) {
  VIEW_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = id === targetId ? "block" : "none";
  });
}

function showWelcomeView() { showView("welcomeView"); }
function showOnboardingView() { showView("onboardingView"); }
function showOutlookSetupView() { showView("outlookSetupView"); }
function showLandingView() {
  showView("landingView");
  void refreshLandingView();
}
function showSettingsView() { showView("settingsView"); }
function showThemeBuilderView() {
  showView("themeBuilderView");
  refreshThemeBuilderFromActiveTheme();
}
function showPrePrepView() { showView("prePrepView"); }
function showLockDownView() { showView("lockDownView"); }
function showTimecardView() {
  showView("timecardView");
  void renderTimecardWeek();
}
function showDeviceLookupView() { showView("deviceLookupView"); }
function showGridView() {
  showView("gridView");
  void refreshGridClientData();
}
function showPrepTypeView() { showView("prepTypeView"); }
function showPrepSlCrmView() { showView("prepSlCrmView"); }
function showPrepView(options = {}) {
  const { variant = "standard" } = options;
  prepChecklistVariant = variant;
  showView("prepView");
  void refreshPrepChecklist();
}

function clearPrepChecklist() {
  const prepView = document.getElementById("prepView");
  if (!prepView) return;
  prepView.querySelectorAll('input[type="checkbox"]').forEach(input => {
    input.checked = false;
  });
  prepView.querySelectorAll(".prep-checklist__category").forEach(wrapper => {
    updatePrepChecklistCategoryState(wrapper);
  });
}

let prepChecklistOrderDraft = [];
let prepChecklistVariant = "standard";
let gridPadChecklistOrderDraft = [];

function getGridPadChecklistCategoryIds() {
  return GRIDPAD_CHECKLIST_CATEGORIES.map(category => category.id);
}

async function getGridPadChecklistCategoryOrder() {
  const stored = await getStoredValue(GRIDPAD_CHECKLIST_ORDER_STORAGE_KEY);
  const defaultOrder = getGridPadChecklistCategoryIds();
  if (!Array.isArray(stored)) return defaultOrder;
  const validIds = new Set(defaultOrder);
  const filtered = stored.filter(id => validIds.has(id));
  const missing = defaultOrder.filter(id => !filtered.includes(id));
  const combined = [...filtered, ...missing];
  return combined.length ? combined : defaultOrder;
}

function getGridPadChecklistCategoriesByOrder(order) {
  const categoryMap = new Map(GRIDPAD_CHECKLIST_CATEGORIES.map(category => [category.id, category]));
  const orderedCategories = [];
  order.forEach(id => {
    const category = categoryMap.get(id);
    if (category) {
      orderedCategories.push({
        ...category,
        items: category.items.map(item => ({ ...item }))
      });
      categoryMap.delete(id);
    }
  });
  categoryMap.forEach(category => orderedCategories.push({
    ...category,
    items: category.items.map(item => ({ ...item }))
  }));
  return orderedCategories;
}

function getPrepChecklistCategoriesForVariant(variant) {
  const categories = PREP_CHECKLIST_CATEGORIES.map(category => ({
    ...category,
    items: category.items.map(item => ({ ...item }))
  }));
  if (variant !== "serviceLoan") return categories;

  Object.entries(PREP_CHECKLIST_SL_CATEGORY_OVERRIDES).forEach(([categoryId, override]) => {
    const index = categories.findIndex(category => category.id === categoryId);
    if (index === -1) return;
    categories[index] = {
      ...categories[index],
      ...override,
      items: (override.items || []).map(item => ({ ...item }))
    };
  });

  return categories;
}

function getPrepChecklistCategoryIds() {
  return PREP_CHECKLIST_CATEGORIES.map(category => category.id);
}

function getPrepChecklistCategoriesByOrder(order) {
  const categoryMap = new Map(getPrepChecklistCategoriesForVariant(prepChecklistVariant).map(category => [category.id, category]));
  const orderedCategories = [];
  order.forEach(id => {
    const category = categoryMap.get(id);
    if (category) {
      orderedCategories.push(category);
      categoryMap.delete(id);
    }
  });
  categoryMap.forEach(category => orderedCategories.push(category));
  return orderedCategories;
}

async function getPrepChecklistCategoryOrder() {
  const stored = await getStoredValue(PREP_CHECKLIST_ORDER_STORAGE_KEY);
  const defaultOrder = getPrepChecklistCategoryIds();
  if (!Array.isArray(stored)) return defaultOrder;
  const validIds = new Set(defaultOrder);
  const filtered = stored.filter(id => validIds.has(id));
  const missing = defaultOrder.filter(id => !filtered.includes(id));
  const combined = [...filtered, ...missing];
  return combined.length ? combined : defaultOrder;
}

function buildPrepChecklistItem(item) {
  const label = document.createElement("label");
  label.className = "prep-checklist__item";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.id = item.id;
  label.appendChild(input);
  label.appendChild(document.createTextNode(` ${item.label}`));
  return label;
}

function setPrepChecklistCategoryCollapsed(wrapper, collapsed) {
  wrapper.classList.toggle("is-collapsed", collapsed);
  const header = wrapper.querySelector(".prep-checklist__category-header");
  if (header) {
    header.setAttribute("aria-expanded", String(!collapsed));
  }
}

function updatePrepChecklistCategoryState(wrapper) {
  const checkboxes = Array.from(wrapper.querySelectorAll('input[type="checkbox"]'));
  const allChecked = checkboxes.length > 0 && checkboxes.every(input => input.checked);
  wrapper.classList.toggle("is-complete", allChecked);

  if (allChecked) {
    if (wrapper.dataset.autoCollapsed !== "true") {
      wrapper.dataset.autoCollapsed = "true";
      setPrepChecklistCategoryCollapsed(wrapper, true);
    }
  } else if (wrapper.dataset.autoCollapsed === "true") {
    delete wrapper.dataset.autoCollapsed;
    setPrepChecklistCategoryCollapsed(wrapper, false);
  }
}

function renderPrepChecklist(container, categories) {
  container.innerHTML = "";
  categories.forEach(category => {
    const wrapper = document.createElement("div");
    wrapper.className = "prep-checklist__category";
    wrapper.dataset.categoryId = category.id;

    const header = document.createElement("button");
    header.type = "button";
    header.className = "prep-checklist__category-header";
    header.setAttribute("aria-expanded", "true");

    const title = document.createElement("span");
    title.className = "prep-checklist__category-title";
    title.textContent = category.title;
    header.appendChild(title);

    const status = document.createElement("span");
    status.className = "prep-checklist__category-status";
    status.setAttribute("aria-hidden", "true");
    status.textContent = "✓";
    header.appendChild(status);

    const toggle = document.createElement("span");
    toggle.className = "prep-checklist__category-toggle";
    toggle.setAttribute("aria-hidden", "true");
    toggle.textContent = "▾";
    header.appendChild(toggle);

    header.addEventListener("click", () => {
      const isCollapsed = wrapper.classList.contains("is-collapsed");
      delete wrapper.dataset.autoCollapsed;
      setPrepChecklistCategoryCollapsed(wrapper, !isCollapsed);
    });

    wrapper.appendChild(header);

    const items = document.createElement("div");
    items.className = "prep-checklist__category-items";
    items.id = `prepChecklistItems-${category.id}`;
    header.setAttribute("aria-controls", items.id);
    items.addEventListener("change", event => {
      if (event.target instanceof HTMLInputElement && event.target.type === "checkbox") {
        updatePrepChecklistCategoryState(wrapper);
      }
    });
    category.items.forEach(item => {
      items.appendChild(buildPrepChecklistItem(item));
    });
    wrapper.appendChild(items);
    container.appendChild(wrapper);
    updatePrepChecklistCategoryState(wrapper);
  });
}

async function refreshPrepChecklist() {
  const container = document.getElementById("prepChecklistContainer");
  if (!container) return;
  const order = await getPrepChecklistCategoryOrder();
  renderPrepChecklist(container, getPrepChecklistCategoriesByOrder(order));
}

function renderPrepChecklistOrderList() {
  const container = document.getElementById("prepChecklistOrderList");
  if (!container) return;
  container.innerHTML = "";
  const orderedCategories = getPrepChecklistCategoriesByOrder(prepChecklistOrderDraft);
  orderedCategories.forEach((category, index) => {
    const row = document.createElement("div");
    row.className = "prep-checklist__order-item";

    const title = document.createElement("div");
    title.textContent = category.title;
    row.appendChild(title);

    const actions = document.createElement("div");
    actions.className = "prep-checklist__order-actions";

    const upButton = document.createElement("button");
    upButton.type = "button";
    upButton.className = "toggle-btn";
    upButton.textContent = "Up";
    upButton.disabled = index === 0;
    upButton.addEventListener("click", () => {
      movePrepChecklistCategory(index, -1);
    });

    const downButton = document.createElement("button");
    downButton.type = "button";
    downButton.className = "toggle-btn";
    downButton.textContent = "Down";
    downButton.disabled = index === orderedCategories.length - 1;
    downButton.addEventListener("click", () => {
      movePrepChecklistCategory(index, 1);
    });

    actions.appendChild(upButton);
    actions.appendChild(downButton);
    row.appendChild(actions);
    container.appendChild(row);
  });
}

function movePrepChecklistCategory(index, delta) {
  const nextIndex = index + delta;
  if (nextIndex < 0 || nextIndex >= prepChecklistOrderDraft.length) return;
  const updated = [...prepChecklistOrderDraft];
  [updated[index], updated[nextIndex]] = [updated[nextIndex], updated[index]];
  prepChecklistOrderDraft = updated;
  renderPrepChecklistOrderList();
}

async function refreshPrepChecklistOrderList() {
  prepChecklistOrderDraft = await getPrepChecklistCategoryOrder();
  renderPrepChecklistOrderList();
}
function showPrepChecklistOrderView() {
  showView("prepChecklistOrderView");
  void refreshPrepChecklistOrderList();
}
function showGridPadPrepView() {
  showView("gridPadPrepView");
  void refreshGridPadChecklist();
}
function showGridPadChecklistOrderView() {
  showView("gridPadChecklistOrderView");
  void refreshGridPadChecklistOrderList();
}

function showAgeCalculatorView() {
  showView("ageCalculatorView");
}

function calculateAgeYearsFromInput(rawBirthdate) {
  if (!rawBirthdate) {
    return { error: "Please select a birthdate." };
  }
  const parts = rawBirthdate.split("-").map(part => Number.parseInt(part, 10));
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return { error: "Please enter a valid birthdate." };
  }
  const [year, month, day] = parts;
  const today = new Date();
  const birthdate = new Date(year, month - 1, day);
  if (
    birthdate.getFullYear() !== year ||
    birthdate.getMonth() !== month - 1 ||
    birthdate.getDate() !== day
  ) {
    return { error: "Please enter a valid birthdate." };
  }
  const todayAtMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (birthdate > todayAtMidnight) {
    return { error: "Birthdate cannot be in the future." };
  }
  let ageYears = today.getFullYear() - year;
  const birthdayHasOccurred =
    today.getMonth() > month - 1 ||
    (today.getMonth() === month - 1 && today.getDate() >= day);
  if (!birthdayHasOccurred) {
    ageYears -= 1;
  }
  return { ageYears };
}

function clearGridPadChecklist() {
  const gridPadPrepView = document.getElementById("gridPadPrepView");
  if (!gridPadPrepView) return;
  gridPadPrepView.querySelectorAll('input[type="checkbox"]').forEach(input => {
    input.checked = false;
  });
  gridPadPrepView.querySelectorAll(".prep-checklist__category").forEach(wrapper => {
    updatePrepChecklistCategoryState(wrapper);
  });
}

async function refreshGridPadChecklist() {
  const container = document.getElementById("gridPadChecklistContainer");
  if (!container) return;
  const order = await getGridPadChecklistCategoryOrder();
  renderPrepChecklist(container, getGridPadChecklistCategoriesByOrder(order));
}

function moveGridPadChecklistCategory(index, delta) {
  const nextIndex = index + delta;
  if (nextIndex < 0 || nextIndex >= gridPadChecklistOrderDraft.length) return;
  const updated = [...gridPadChecklistOrderDraft];
  [updated[index], updated[nextIndex]] = [updated[nextIndex], updated[index]];
  gridPadChecklistOrderDraft = updated;
  renderGridPadChecklistOrderList();
}

function renderGridPadChecklistOrderList() {
  const container = document.getElementById("gridPadChecklistOrderList");
  if (!container) return;
  container.innerHTML = "";
  const orderedCategories = getGridPadChecklistCategoriesByOrder(gridPadChecklistOrderDraft);
  orderedCategories.forEach((category, index) => {
    const row = document.createElement("div");
    row.className = "prep-checklist__order-item";

    const title = document.createElement("div");
    title.textContent = category.title;
    row.appendChild(title);

    const actions = document.createElement("div");
    actions.className = "prep-checklist__order-actions";

    const upButton = document.createElement("button");
    upButton.type = "button";
    upButton.className = "toggle-btn";
    upButton.textContent = "Up";
    upButton.disabled = index === 0;
    upButton.addEventListener("click", () => {
      moveGridPadChecklistCategory(index, -1);
    });

    const downButton = document.createElement("button");
    downButton.type = "button";
    downButton.className = "toggle-btn";
    downButton.textContent = "Down";
    downButton.disabled = index === orderedCategories.length - 1;
    downButton.addEventListener("click", () => {
      moveGridPadChecklistCategory(index, 1);
    });

    actions.appendChild(upButton);
    actions.appendChild(downButton);
    row.appendChild(actions);
    container.appendChild(row);
  });
}

async function refreshGridPadChecklistOrderList() {
  gridPadChecklistOrderDraft = await getGridPadChecklistCategoryOrder();
  renderGridPadChecklistOrderList();
}

function showCompleteView() { showView("completeView"); }
function showLtlCompletionView() { showView("ltlCompletionView"); }
function showFormView() { showView("formView"); }
function showSmartboxRepairView() { showView("smartboxRepairView"); }
function showInventoryView() { showView("inventoryView"); }
function showDafView() { showView("dafRecapView"); }
function showEmailView() { showView("emailView"); }
function showAppOverridesView() { showView("appOverridesView"); }
function showQaCompleteView() { showView("qaCompleteView"); }

const checkinFormTitle = document.getElementById("checkinFormTitle");
const deviceNumberLabel = document.getElementById("deviceNumberLabel");
const cameraToggleBtn = document.getElementById("cameraToggle");
const mountToggleBtn = document.getElementById("mountToggle");
const finishCheckinBtn = document.getElementById("finishCheckinBtn");
const ltlUpdatesSection = document.getElementById("ltlUpdatesSection");
const ltlUpdateOtherToggle = document.getElementById("ltlUpdateOther");
const ltlUpdateOtherField = document.getElementById("ltlUpdateOtherField");
const ltlUpdateOtherText = document.getElementById("ltlUpdateOtherText");
const ltlUpdateNewSerialField = document.getElementById("ltlUpdateNewSerialField");
const ltlUpdateNewSerialNumber = document.getElementById("ltlUpdateNewSerialNumber");
const ltlUpdateRowSection = document.getElementById("ltlUpdateRowSection");
const ltlUpdateRowResult = document.getElementById("ltlUpdateRowResult");
const ltlCompletionRowDetails = document.getElementById("ltlCompletionRowDetails");
const ltlCompletionRunBtn = document.getElementById("ltlCompletionRunBtn");
const ltlCompletionReturnBtn = document.getElementById("ltlCompletionReturnBtn");
const ltlCompletionStatus = document.getElementById("ltlCompletionStatus");

let ltlCompletionRowPayload = null;

function isCheckinFlowActive() {
  return Boolean(activeCheckinFlow);
}

function isLtlUpdateFlow() {
  return activeCheckinFlow === CHECKIN_FLOW.LTL_UPDATE;
}

function clearCameraAndMountFields() {
  document.querySelectorAll(
    'input[name="cameraNumber"], input[name="luminNumber"], input[name="clampMount"], input[name="tableMount"], input[name="rollingMount"]'
  ).forEach(el => el.value = "");
}

function clearLtlUpdates() {
  document.querySelectorAll('input[name="ltlUpdates"]').forEach(input => {
    input.checked = false;
  });
  if (ltlUpdateOtherText) ltlUpdateOtherText.value = "";
  if (ltlUpdateOtherField) ltlUpdateOtherField.style.display = "none";
  if (ltlUpdateNewSerialNumber) ltlUpdateNewSerialNumber.value = "";
  if (ltlUpdateNewSerialField) ltlUpdateNewSerialField.style.display = "none";
}

function updateLtlUpdateOtherFieldVisibility() {
  if (!ltlUpdateOtherToggle || !ltlUpdateOtherField) return;
  const show = ltlUpdateOtherToggle.checked && isLtlUpdateFlow();
  ltlUpdateOtherField.style.display = show ? "block" : "none";
  if (!show && ltlUpdateOtherText) ltlUpdateOtherText.value = "";
}

function updateLtlUpdateNewSerialFieldVisibility() {
  if (!ltlUpdateNewSerialField) return;
  const requiresNewSerial = Array.from(document.querySelectorAll('input[name="ltlUpdates"]:checked'))
    .some(input => ["Replaced Device", "Replaced Case"].includes(input.value));
  const show = requiresNewSerial && isLtlUpdateFlow();
  ltlUpdateNewSerialField.style.display = show ? "block" : "none";
  if (!show && ltlUpdateNewSerialNumber) ltlUpdateNewSerialNumber.value = "";
}

function updateLtlUpdateRowSection() {
  if (!ltlUpdateRowSection || !ltlUpdateRowResult) return;
  const rowText = deviceLookupLastLtlRow?.rowText || "";
  const rowNumber = deviceLookupLastLtlRow?.rowNumber;
  const show = isLtlUpdateFlow() && Boolean(rowText);
  ltlUpdateRowSection.classList.toggle("hidden-section", !show);
  if (show) {
    ltlUpdateRowResult.textContent = rowNumber ? `Row ${rowNumber}\n${rowText}` : rowText;
  } else {
    ltlUpdateRowResult.textContent = "";
  }
}

function updateLtlCompletionDetails() {
  if (!ltlCompletionRowDetails) return;
  const rowText = ltlCompletionRowPayload?.rowText || "";
  const rowNumber = ltlCompletionRowPayload?.rowNumber;
  if (rowText) {
    ltlCompletionRowDetails.textContent = rowNumber ? `Row ${rowNumber}\n${rowText}` : rowText;
  } else {
    ltlCompletionRowDetails.textContent = "No LTL row captured yet.";
  }
  if (ltlCompletionStatus) ltlCompletionStatus.textContent = "";
  if (ltlCompletionRunBtn) {
    ltlCompletionRunBtn.disabled = !ltlCompletionRowPayload?.rowValues?.length;
  }
}

async function openLtlWorkbookForCompletion(rowValues = []) {
  const tab = await chrome.tabs.create({ url: DEVICE_LOOKUP_EXCEL_WEB_URL });
  if (!tab?.id) {
    return { ok: false, message: "Unable to open the LTL update workbook." };
  }
  if (!rowValues?.length) {
    return { ok: false, message: "No LTL update row values available to paste." };
  }
  const ready = await waitForTabComplete(tab.id, 20000);
  if (!ready) {
    return { ok: false, message: "LTL update workbook did not finish loading." };
  }
  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: "PASTE_LTL_COMPLETED_ROW",
      rowValues
    });
  } catch (error) {
    console.warn("Unable to send LTL completion row.", error);
    return { ok: false, message: "Unable to paste the LTL update row." };
  }
  return { ok: true };
}

function applyCheckinModeUI() {
  const isLtlUpdate = isLtlUpdateFlow();
  if (checkinFormTitle) {
    checkinFormTitle.textContent = isLtlUpdate ? "LTL Update Sidekick" : "Trials Automated Check-in SideKick";
  }
  if (deviceNumberLabel) {
    deviceNumberLabel.textContent = isLtlUpdate
      ? "Device Number *"
      : "Device Number (Put an X if only Checking in Mount) *";
  }
  const showMountAndCamera = !isLtlUpdate;
  if (cameraToggleBtn) cameraToggleBtn.style.display = showMountAndCamera ? "" : "none";
  if (mountToggleBtn) mountToggleBtn.style.display = showMountAndCamera ? "" : "none";
  if (!showMountAndCamera) {
    if (cameraLuminSection) cameraLuminSection.style.display = "none";
    if (mountSection) mountSection.style.display = "none";
    clearCameraAndMountFields();
  }
  if (ltlUpdatesSection) {
    ltlUpdatesSection.style.display = isLtlUpdate ? "block" : "none";
  }
  if (!isLtlUpdate) {
    clearLtlUpdates();
  }
  updateLtlUpdateOtherFieldVisibility();
  updateLtlUpdateNewSerialFieldVisibility();
  updateLtlUpdateRowSection();
  if (finishCheckinBtn) {
    finishCheckinBtn.textContent = isLtlUpdate ? "Next Step" : "Final Step";
  }
}

function setActiveCheckinFlow(flow) {
  activeCheckinFlow = flow;
  applyCheckinModeUI();
}

function clearActiveCheckinFlow() {
  activeCheckinFlow = null;
  applyCheckinModeUI();
}

function setCollapsibleState(key, expanded) {
  const toggle = document.querySelector(`[data-collapsible="${key}"]`);
  const content = document.querySelector(`[data-collapsible-content="${key}"]`);
  if (!toggle || !content) return;
  toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
  content.hidden = !expanded;
}

const CHECKIN_FLOW = {
  CHECKIN: "checkin",
  LTL_UPDATE: "ltlUpdate"
};
let activeCheckinFlow = null;
let smartboxRepairRequired = false;
let hasStartedGrid = false;
let outlookEmailTabId = null;
let outlookSetupTabId = null;
let hasFinalizedCheckin = false;
let outlookComposeNavigationLogged = false;
const USER_PROFILE_STORAGE_KEY = "ttmtSidekickUserProfile";
const USER_MASCOT_STORAGE_KEY = "ttmtSidekickUserMascot";
const USER_MASCOT_SIZE_STORAGE_KEY = "ttmtSidekickUserMascotSize";
const DEFAULT_MASCOT_SRC = "assets/SB logo.png";
const DEFAULT_MASCOT_SIZE = 96;
const MIN_MASCOT_SIZE = 64;
const MAX_MASCOT_SIZE = 160;
const DEFAULT_CORNER_SYMOJI_SRC = "assets/symoji.png";
const SYMOJI_ASSET_ROOT = "assets/Symojis";
const SYMOJI_FILES = [
  "Accessories.png",
  "Angry.png",
  "Awesome.png",
  "Awkward.png",
  "Birthday.png",
  "Blow-Rasberry.png",
  "Boogie.png",
  "Bored.png",
  "Care.png",
  "Celebrate.png",
  "Cheers.png",
  "Coffee.png",
  "Cold.png",
  "Confused.png",
  "Cool.png",
  "Crazy.png",
  "Eye-Gaze.png",
  "Face-Palm.png",
  "Fingers-Crossed.png",
  "Flirt.png",
  "Giggle.png",
  "Go-Away.png",
  "Hand-Switch.png",
  "Handshake.png",
  "Head-Switch.png",
  "High five couple.png",
  "High five.png",
  "High-Five.png",
  "Hooray.png",
  "Hot.png",
  "Hug.png",
  "Hungry.png",
  "Idea.png",
  "Kisses.png",
  "Laugh.png",
  "Mic-Drop.png",
  "MicrosoftTeams-image (1).png",
  "Middle-Finger.png",
  "Mind-Blown.png",
  "Mischievous.png",
  "No.png",
  "Not-Listening.png",
  "Party.png",
  "Poo.png",
  "Pumpkin.png",
  "Quiet.png",
  "Relieved.png",
  "Sad.png",
  "Salute.png",
  "Shock.png",
  "Shrug.png",
  "Shy.png",
  "Sleepy.png",
  "Stressed.png",
  "Strong.png",
  "Suspicious.png",
  "Swear.png",
  "Symoji Kiss.png",
  "Symoji_FingerHeart 2.png",
  "Symoji_FingerHeart2 2.png",
  "Symoji_Reveal_blue.png",
  "Talk-To-Hand.png",
  "Thinking.png",
  "Thumbs up.png",
  "Thumbs-Down.png",
  "Thumbs-Up.png",
  "Unwell.png",
  "Upset.png",
  "Vomit.png",
  "Wave.png",
  "Wow.png",
  "Yummy.png"
];

const ANIME_QUOTE_COUNT_PER_THEME = 100;

function createAnimeQuoteSeries(sourceQuotes) {
  const quotes = [];
  for (let i = 0; i < ANIME_QUOTE_COUNT_PER_THEME; i += 1) {
    const sourceQuote = sourceQuotes[i % sourceQuotes.length];
    const season = Math.floor(i / 25) + 1;
    const episode = (i % 25) + 1;
    quotes.push(`${sourceQuote} (Season ${season}, Episode ${episode})`);
  }
  return quotes;
}

const ANIME_THEME_QUOTES = {
  animeNaruto: createAnimeQuoteSeries([
    "Hard work is worthless for those that don't believe in themselves. — Naruto Uzumaki",
    "A place where someone still thinks about you is a place you can call home. — Jiraiya",
    "It's not the face that makes someone a monster; it's the choices they make with their lives. — Naruto Uzumaki",
    "People's lives don't end when they die, it ends when they lose faith. — Itachi Uchiha",
    "When people are protecting something truly special to them, they truly can become as strong as they need to be. — Haku"
  ]),
  animeOnePiece: createAnimeQuoteSeries([
    "If you don't take risks, you can't create a future. — Monkey D. Luffy",
    "No matter how deep the night, it always turns to day, eventually. — Brook",
    "When do you think people die? It's when they are forgotten. — Dr. Hiluluk",
    "I'm gonna be king of the pirates! — Monkey D. Luffy",
    "A man dies when he is forgotten. — Dr. Hiluluk"
  ]),
  animeDragonBall: createAnimeQuoteSeries([
    "Power comes in response to a need, not a desire. — Goku",
    "Push through the pain. Giving up hurts more. — Vegeta",
    "Sometimes, we have to look beyond what we want and do what's best. — Piccolo",
    "A warrior's strength is fueled by the battles they survive. — Goku",
    "There is no such thing as fair or unfair in battle. There is only victory or defeat. — Vegeta"
  ]),
  animeAttackOnTitan: createAnimeQuoteSeries([
    "People who can't throw something important away can never hope to change anything. — Armin Arlert",
    "Move forward, and prove your worth through your actions. — Erwin Smith",
    "Humans are weak, but we can still fight. — Mikasa Ackerman",
    "A human's strength is limitless as long as they have a cause to fight for. — Levi Ackerman",
    "If you win, you live. If you lose, you die. If you don't fight, you can't win. — Eren Yeager"
  ]),
  animeDemonSlayer: createAnimeQuoteSeries([
    "Set your heart ablaze. — Kyojuro Rengoku",
    "A lesson learned the hard way is remembered for life. — Tanjiro Kamado",
    "No matter how many people you may lose, you have no choice but to go on living. — Tanjiro Kamado",
    "Feel the rage, the powerful pure rage of not being able to forgive. — Giyu Tomioka",
    "Life is a series of decisions. You never have any guarantee that your choice will be right. — Kyojuro Rengoku"
  ]),
  animeJujutsuKaisen: createAnimeQuoteSeries([
    "The accumulation of those little despairs is what makes a person an adult. — Kento Nanami",
    "Love is the most twisted curse of all. — Satoru Gojo",
    "It's okay to be selfish. — Megumi Fushiguro",
    "If I fall behind, if I hesitate, those people will die. — Yuji Itadori",
    "Dying to win and risking death to win are completely different. — Satoru Gojo"
  ]),
  animeMyHero: createAnimeQuoteSeries([
    "The strong should aid and protect the weak. Then, the weak will become strong and they in turn will aid and protect those weaker than them. — All Might",
    "If all you ever do is look down on people, you won't be able to recognize your own weaknesses. — Katsuki Bakugo",
    "A true hero always finds a way for justice to be served. — All Might",
    "Even if I'm worthless and weak, I can still stand up and fight. — Izuku Midoriya",
    "Whether you win or lose, looking back and learning from your experience is a part of life. — All Might"
  ]),
  animeSailorMoon: createAnimeQuoteSeries([
    "The world can be one if there's love. — Usagi Tsukino",
    "Believe in yourself and nothing can stop you. — Usagi Tsukino",
    "In the name of the moon, I'll punish you! — Sailor Moon",
    "No matter how hard things get, we can always face them together. — Usagi Tsukino",
    "The future is something you build by yourself. — Sailor Pluto"
  ]),
  animeDeathNote: createAnimeQuoteSeries([
    "There is no heaven or hell. No matter what you do while you're alive, everybody goes to the same place once you die. Death is equal. — L",
    "Sometimes, the questions are complicated and the answers are simple. — L",
    "Humans are so interesting. — Ryuk",
    "In this world, there are very few people who actually trust each other. — Light Yagami",
    "All according to plan. — Light Yagami"
  ]),
  animeFullmetal: createAnimeQuoteSeries([
    "A lesson without pain is meaningless. — Edward Elric",
    "The world isn't perfect, but it's there for us trying the best it can. — Roy Mustang",
    "Stand up and walk. Keep moving forward. — Edward Elric",
    "Nothing's perfect, the world's not perfect, but it's there for us, doing the best it can. — Roy Mustang",
    "Human kind cannot gain anything without first giving something in return. — Alphonse Elric"
  ])
};

const CUSTOM_THEME_DEFAULT_VARS = {
  "bg-color": "#121212",
  "text-color": "#e0e0e0",
  "muted-text": "#d5e9ff",
  "container-bg": "#1e1e2f",
  "container-border": "#81cfff",
  "container-shadow": "0 0 20px rgba(0, 128, 255, 0.25)",
  "accent": "#81cfff",
  "accent-strong": "#003366",
  "accent-strong-hover": "#005599",
  "input-bg": "#2a2a3a",
  "input-border": "#555555",
  "note-bg": "#0f1b2b",
  "note-border": "#2f4b6f",
  "error-color": "#ff7b7b"
};

const THEMES = {
  ocean: {
    label: "Smartbox Blue",
    vars: {
      "bg-color": "#121212",
      "text-color": "#e0e0e0",
      "muted-text": "#d5e9ff",
      "container-bg": "#1e1e2f",
      "container-border": "#81cfff",
      "container-shadow": "0 0 20px rgba(0, 128, 255, 0.25)",
      "accent": "#81cfff",
      "accent-strong": "#003366",
      "accent-strong-hover": "#005599",
      "input-bg": "#2a2a3a",
      "input-border": "#555",
      "note-bg": "#0f1b2b",
      "note-border": "#2f4b6f",
      "error-color": "#ff7b7b"
    }
  },
  sunset: {
    label: "Sunset Ember",
    vars: {
      "bg-color": "#141010",
      "text-color": "#f3e9e4",
      "muted-text": "#f8c9b4",
      "container-bg": "#2a1917",
      "container-border": "#ff9f68",
      "container-shadow": "0 0 20px rgba(255, 159, 104, 0.28)",
      "accent": "#ff9f68",
      "accent-strong": "#6b2b1f",
      "accent-strong-hover": "#8b3a2b",
      "input-bg": "#33201d",
      "input-border": "#6b3b30",
      "note-bg": "#201312",
      "note-border": "#5f3a33",
      "error-color": "#ff8f8f"
    }
  },
  forest: {
    label: "Forest Glow",
    vars: {
      "bg-color": "#0d1512",
      "text-color": "#e7f8f1",
      "muted-text": "#b8f3dc",
      "container-bg": "#14211c",
      "container-border": "#6ee7b7",
      "container-shadow": "0 0 20px rgba(110, 231, 183, 0.25)",
      "accent": "#6ee7b7",
      "accent-strong": "#0f4d37",
      "accent-strong-hover": "#14614a",
      "input-bg": "#1e2d26",
      "input-border": "#3b5c4e",
      "note-bg": "#0f1a15",
      "note-border": "#2b4a3d",
      "error-color": "#ff9f9f"
    }
  },
  plum: {
    label: "Plum Night",
    vars: {
      "bg-color": "#120f18",
      "text-color": "#f2e9ff",
      "muted-text": "#dbc7ff",
      "container-bg": "#1f1930",
      "container-border": "#c084fc",
      "container-shadow": "0 0 20px rgba(192, 132, 252, 0.3)",
      "accent": "#c084fc",
      "accent-strong": "#4b1e6b",
      "accent-strong-hover": "#5e2a87",
      "input-bg": "#2a2140",
      "input-border": "#5b4b73",
      "note-bg": "#151021",
      "note-border": "#3b2f52",
      "error-color": "#ff9ccf"
    }
  },
  slate: {
    label: "Slate Storm",
    vars: {
      "bg-color": "#101317",
      "text-color": "#e6ecf2",
      "muted-text": "#c0cad8",
      "container-bg": "#18202a",
      "container-border": "#94a3b8",
      "container-shadow": "0 0 20px rgba(148, 163, 184, 0.25)",
      "accent": "#94a3b8",
      "accent-strong": "#273449",
      "accent-strong-hover": "#33445e",
      "input-bg": "#222b36",
      "input-border": "#4b5a6b",
      "note-bg": "#111821",
      "note-border": "#2a3646",
      "error-color": "#ff9f9f"
    }
  },
  aurora: {
    label: "Aurora Mint",
    vars: {
      "bg-color": "#0b1413",
      "text-color": "#e7fffb",
      "muted-text": "#b6f7ea",
      "container-bg": "#12201e",
      "container-border": "#5eead4",
      "container-shadow": "0 0 20px rgba(94, 234, 212, 0.25)",
      "accent": "#5eead4",
      "accent-strong": "#0f4b45",
      "accent-strong-hover": "#146056",
      "input-bg": "#1a2b29",
      "input-border": "#355a55",
      "note-bg": "#0c1716",
      "note-border": "#284946",
      "error-color": "#ff9fb0"
    }
  },
  citrus: {
    label: "Citrus Pop",
    vars: {
      "bg-color": "#14130a",
      "text-color": "#fff5d7",
      "muted-text": "#fde68a",
      "container-bg": "#2a250e",
      "container-border": "#facc15",
      "container-shadow": "0 0 20px rgba(250, 204, 21, 0.28)",
      "accent": "#facc15",
      "accent-strong": "#7a5a00",
      "accent-strong-hover": "#946b00",
      "input-bg": "#332c11",
      "input-border": "#6d5a14",
      "note-bg": "#1b1708",
      "note-border": "#574a13",
      "error-color": "#ff9f9f"
    }
  },
  sand: {
    label: "Desert Sand",
    vars: {
      "bg-color": "#14100d",
      "text-color": "#fdf4e7",
      "muted-text": "#f7d8b4",
      "container-bg": "#2a2019",
      "container-border": "#f5d0a9",
      "container-shadow": "0 0 20px rgba(245, 208, 169, 0.25)",
      "accent": "#f5d0a9",
      "accent-strong": "#7a4a2c",
      "accent-strong-hover": "#955935",
      "input-bg": "#332720",
      "input-border": "#6d5443",
      "note-bg": "#1b140f",
      "note-border": "#584234",
      "error-color": "#ff9aa2"
    }
  },
  midnight: {
    label: "Midnight Violet",
    vars: {
      "bg-color": "#0c0b16",
      "text-color": "#f2edff",
      "muted-text": "#cfc9ff",
      "container-bg": "#1a1830",
      "container-border": "#8b5cf6",
      "container-shadow": "0 0 20px rgba(139, 92, 246, 0.28)",
      "accent": "#8b5cf6",
      "accent-strong": "#3b2470",
      "accent-strong-hover": "#4b2f8f",
      "input-bg": "#241f3f",
      "input-border": "#514177",
      "note-bg": "#120f22",
      "note-border": "#3a2f5c",
      "error-color": "#ff9ccf"
    }
  },
  rose: {
    label: "Rose Quartz",
    vars: {
      "bg-color": "#150f14",
      "text-color": "#ffeaf4",
      "muted-text": "#f9c4db",
      "container-bg": "#2a1822",
      "container-border": "#f472b6",
      "container-shadow": "0 0 20px rgba(244, 114, 182, 0.28)",
      "accent": "#f472b6",
      "accent-strong": "#7a2a4d",
      "accent-strong-hover": "#95325f",
      "input-bg": "#33202c",
      "input-border": "#6d4054",
      "note-bg": "#1c0f17",
      "note-border": "#573245",
      "error-color": "#ff8fab"
    }
  },
  snow: {
    label: "Snow Day",
    vars: {
      "bg-color": "#f8fafc",
      "text-color": "#0f172a",
      "muted-text": "#475569",
      "container-bg": "#ffffff",
      "container-border": "#cbd5f5",
      "container-shadow": "0 0 24px rgba(148, 163, 184, 0.35)",
      "accent": "#4f46e5",
      "accent-strong": "#1e1b4b",
      "accent-strong-hover": "#312e81",
      "input-bg": "#f1f5f9",
      "input-border": "#cbd5e1",
      "note-bg": "#eef2ff",
      "note-border": "#c7d2fe",
      "error-color": "#dc2626"
    }
  },
  blackIce: {
    label: "Black Ice",
    vars: {
      "bg-color": "#05070a",
      "text-color": "#f8fafc",
      "muted-text": "#d6dbe1",
      "container-bg": "#0d1117",
      "container-border": "#f8fafc",
      "container-shadow": "0 0 24px rgba(248, 250, 252, 0.2)",
      "accent": "#ffffff",
      "accent-strong": "#1f2937",
      "accent-strong-hover": "#111827",
      "input-bg": "#0f172a",
      "input-border": "#e2e8f0",
      "note-bg": "#111827",
      "note-border": "#cbd5f5",
      "error-color": "#f87171"
    }
  },
  coral: {
    label: "Coral Reef",
    vars: {
      "bg-color": "#0b1416",
      "text-color": "#e6fffb",
      "muted-text": "#b4f3ef",
      "container-bg": "#102126",
      "container-border": "#ff8fa3",
      "container-shadow": "0 0 20px rgba(255, 143, 163, 0.25)",
      "accent": "#ff8fa3",
      "accent-strong": "#5e2a3a",
      "accent-strong-hover": "#7a3547",
      "input-bg": "#1b2c31",
      "input-border": "#3d5a63",
      "note-bg": "#0f1d20",
      "note-border": "#2f4b52",
      "error-color": "#ff7b7b"
    }
  },
  lagoon: {
    label: "Lagoon Glow",
    vars: {
      "bg-color": "#0a1412",
      "text-color": "#eafff5",
      "muted-text": "#b8f5e0",
      "container-bg": "#13241f",
      "container-border": "#34d399",
      "container-shadow": "0 0 20px rgba(52, 211, 153, 0.24)",
      "accent": "#22d3ee",
      "accent-strong": "#0f4c5c",
      "accent-strong-hover": "#126277",
      "input-bg": "#1c2f2a",
      "input-border": "#3f5f55",
      "note-bg": "#0f1d1a",
      "note-border": "#2e4c43",
      "error-color": "#ff9aa2"
    }
  },
  prism: {
    label: "Prism Party",
    vars: {
      "bg-color": "#12111a",
      "text-color": "#f5f0ff",
      "muted-text": "#d7c7ff",
      "container-bg": "#1d1b2f",
      "container-border": "#f472b6",
      "container-shadow": "0 0 20px rgba(59, 130, 246, 0.25)",
      "accent": "#38bdf8",
      "accent-strong": "#1e3a8a",
      "accent-strong-hover": "#1d4ed8",
      "input-bg": "#2a2640",
      "input-border": "#514773",
      "note-bg": "#181427",
      "note-border": "#3a3456",
      "error-color": "#f97316"
    }
  },
  neon: {
    label: "Neon Circuit",
    vars: {
      "bg-color": "#0a0d14",
      "text-color": "#eaf6ff",
      "muted-text": "#9dd6ff",
      "container-bg": "#121a26",
      "container-border": "#22d3ee",
      "container-shadow": "0 0 20px rgba(14, 165, 233, 0.28)",
      "accent": "#f472b6",
      "accent-strong": "#5b1e3d",
      "accent-strong-hover": "#7c2552",
      "input-bg": "#1c2634",
      "input-border": "#36485c",
      "note-bg": "#0e1620",
      "note-border": "#2a3b4d",
      "error-color": "#fb7185"
    }
  },
  tropic: {
    label: "Tropical Punch",
    vars: {
      "bg-color": "#111109",
      "text-color": "#fff7e6",
      "muted-text": "#ffd7a0",
      "container-bg": "#241f10",
      "container-border": "#f97316",
      "container-shadow": "0 0 20px rgba(249, 115, 22, 0.25)",
      "accent": "#22c55e",
      "accent-strong": "#14532d",
      "accent-strong-hover": "#166534",
      "input-bg": "#2f2815",
      "input-border": "#65522d",
      "note-bg": "#191407",
      "note-border": "#4f3b17",
      "error-color": "#f43f5e"
    }
  },
  auroraBurst: {
    label: "Aurora Burst",
    vars: {
      "bg-color": "#0b0f18",
      "text-color": "#f1f5ff",
      "muted-text": "#b9c6ff",
      "container-bg": "#141a2b",
      "container-border": "#a78bfa",
      "container-shadow": "0 0 20px rgba(167, 139, 250, 0.26)",
      "accent": "#34d399",
      "accent-strong": "#0f4d3d",
      "accent-strong-hover": "#14664f",
      "input-bg": "#1f273a",
      "input-border": "#42526d",
      "note-bg": "#111624",
      "note-border": "#303b54",
      "error-color": "#f87171"
    }
  },
  retroWave: {
    label: "Retro Wave",
    vars: {
      "bg-color": "#140b1a",
      "text-color": "#ffe9fb",
      "muted-text": "#f5b7e5",
      "container-bg": "#24112f",
      "container-border": "#f472b6",
      "container-shadow": "0 0 20px rgba(244, 114, 182, 0.28)",
      "accent": "#22d3ee",
      "accent-strong": "#0e4f5e",
      "accent-strong-hover": "#136378",
      "input-bg": "#2f193b",
      "input-border": "#5a2f6a",
      "note-bg": "#1b1023",
      "note-border": "#4a2b59",
      "error-color": "#fb7185"
    }
  },
  peacock: {
    label: "Peacock Parade",
    vars: {
      "bg-color": "#0a1316",
      "text-color": "#e9faff",
      "muted-text": "#b7efff",
      "container-bg": "#102126",
      "container-border": "#60a5fa",
      "container-shadow": "0 0 20px rgba(96, 165, 250, 0.24)",
      "accent": "#f59e0b",
      "accent-strong": "#7a3f00",
      "accent-strong-hover": "#955100",
      "input-bg": "#1b2d33",
      "input-border": "#3f5b63",
      "note-bg": "#0e1b20",
      "note-border": "#2d4b52",
      "error-color": "#f97316"
    }
  },
  emberSky: {
    label: "Ember Sky",
    vars: {
      "bg-color": "#0c1017",
      "text-color": "#f1f7ff",
      "muted-text": "#b7c9e6",
      "container-bg": "#161f2b",
      "container-border": "#f97316",
      "container-shadow": "0 0 20px rgba(248, 113, 113, 0.25)",
      "accent": "#38bdf8",
      "accent-strong": "#0f3b57",
      "accent-strong-hover": "#125170",
      "input-bg": "#1f2b39",
      "input-border": "#425466",
      "note-bg": "#111822",
      "note-border": "#2d3b4a",
      "error-color": "#fb7185"
    }
  },
  electricMeadow: {
    label: "Electric Meadow",
    vars: {
      "bg-color": "#0b120d",
      "text-color": "#effff3",
      "muted-text": "#b6f7cb",
      "container-bg": "#142117",
      "container-border": "#34d399",
      "container-shadow": "0 0 20px rgba(59, 130, 246, 0.24)",
      "accent": "#60a5fa",
      "accent-strong": "#0f3b57",
      "accent-strong-hover": "#125170",
      "input-bg": "#1d2b20",
      "input-border": "#3d5a46",
      "note-bg": "#0f1a14",
      "note-border": "#2e4a37",
      "error-color": "#fb7185"
    }
  },
  solarBloom: {
    label: "Solar Bloom",
    vars: {
      "bg-color": "#141009",
      "text-color": "#fff7e1",
      "muted-text": "#fdd9a4",
      "container-bg": "#241c10",
      "container-border": "#f97316",
      "container-shadow": "0 0 20px rgba(234, 179, 8, 0.25)",
      "accent": "#eab308",
      "accent-strong": "#7a4a0b",
      "accent-strong-hover": "#935a10",
      "input-bg": "#2e2412",
      "input-border": "#6b5321",
      "note-bg": "#191306",
      "note-border": "#4b3a18",
      "error-color": "#f43f5e"
    }
  },
  galaxyTrail: {
    label: "Galaxy Trail",
    vars: {
      "bg-color": "#0b0c16",
      "text-color": "#f4f3ff",
      "muted-text": "#c5c0ff",
      "container-bg": "#141528",
      "container-border": "#8b5cf6",
      "container-shadow": "0 0 20px rgba(56, 189, 248, 0.25)",
      "accent": "#38bdf8",
      "accent-strong": "#1e3a8a",
      "accent-strong-hover": "#1d4ed8",
      "input-bg": "#1f1f38",
      "input-border": "#46406b",
      "note-bg": "#111126",
      "note-border": "#342e56",
      "error-color": "#fb7185"
    }
  },
  cobaltSunset: {
    label: "Cobalt Sunset",
    vars: {
      "bg-color": "#0b1118",
      "text-color": "#eef6ff",
      "muted-text": "#b8cceb",
      "container-bg": "#152030",
      "container-border": "#f97316",
      "container-shadow": "0 0 20px rgba(14, 116, 144, 0.25)",
      "accent": "#0ea5e9",
      "accent-strong": "#0f3b57",
      "accent-strong-hover": "#125170",
      "input-bg": "#1f2b3d",
      "input-border": "#3e546b",
      "note-bg": "#101723",
      "note-border": "#2b3b4d",
      "error-color": "#fb7185"
    }
  },
  frostfire: {
    label: "Frostfire",
    vars: {
      "bg-color": "#0c1013",
      "text-color": "#f5fbff",
      "muted-text": "#bdddf8",
      "container-bg": "#141d22",
      "container-border": "#f97316",
      "container-shadow": "0 0 20px rgba(14, 165, 233, 0.25)",
      "accent": "#38bdf8",
      "accent-strong": "#0e4f5e",
      "accent-strong-hover": "#136378",
      "input-bg": "#1c2730",
      "input-border": "#3a4e5e",
      "note-bg": "#0f171d",
      "note-border": "#2b3e4a",
      "error-color": "#f97316"
    }
  },
  berryBlitz: {
    label: "Berry Blitz",
    vars: {
      "bg-color": "#140c14",
      "text-color": "#ffeefc",
      "muted-text": "#f6b5ea",
      "container-bg": "#251326",
      "container-border": "#f472b6",
      "container-shadow": "0 0 20px rgba(99, 102, 241, 0.24)",
      "accent": "#6366f1",
      "accent-strong": "#312e81",
      "accent-strong-hover": "#3730a3",
      "input-bg": "#311a34",
      "input-border": "#5e3a63",
      "note-bg": "#1c101f",
      "note-border": "#47304f",
      "error-color": "#fb7185"
    }
  },
  canyonLights: {
    label: "Canyon Lights",
    vars: {
      "bg-color": "#14110c",
      "text-color": "#fff3e3",
      "muted-text": "#f7c9a1",
      "container-bg": "#261a12",
      "container-border": "#fb7185",
      "container-shadow": "0 0 20px rgba(245, 158, 11, 0.24)",
      "accent": "#f59e0b",
      "accent-strong": "#7a4a0b",
      "accent-strong-hover": "#935a10",
      "input-bg": "#2f2215",
      "input-border": "#6d4a29",
      "note-bg": "#1a130a",
      "note-border": "#4f3920",
      "error-color": "#f87171"
    }
  },
  holoWave: {
    label: "Holo Wave",
    vars: {
      "bg-color": "#0b1016",
      "text-color": "#eef9ff",
      "muted-text": "#b6e6ff",
      "container-bg": "#13202b",
      "container-border": "#22d3ee",
      "container-shadow": "0 0 20px rgba(168, 85, 247, 0.24)",
      "accent": "#a855f7",
      "accent-strong": "#4c1d95",
      "accent-strong-hover": "#5b21b6",
      "input-bg": "#1c2b39",
      "input-border": "#3f5a6f",
      "note-bg": "#0f1821",
      "note-border": "#2f4456",
      "error-color": "#fb7185"
    }
  },
  jadeFlare: {
    label: "Jade Flare",
    vars: {
      "bg-color": "#0b1211",
      "text-color": "#e9fff8",
      "muted-text": "#b7f5e4",
      "container-bg": "#14211f",
      "container-border": "#f97316",
      "container-shadow": "0 0 20px rgba(34, 197, 94, 0.24)",
      "accent": "#22c55e",
      "accent-strong": "#14532d",
      "accent-strong-hover": "#166534",
      "input-bg": "#1c2b28",
      "input-border": "#3c5a52",
      "note-bg": "#0f1a17",
      "note-border": "#2d4b43",
      "error-color": "#f97316"
    }
  },
  lavaPool: {
    label: "Lava Pool",
    vars: {
      "bg-color": "#120c0a",
      "text-color": "#fff1e6",
      "muted-text": "#f7c4a4",
      "container-bg": "#251410",
      "container-border": "#22d3ee",
      "container-shadow": "0 0 20px rgba(248, 113, 113, 0.25)",
      "accent": "#f97316",
      "accent-strong": "#7a2f0b",
      "accent-strong-hover": "#93370f",
      "input-bg": "#2f1a15",
      "input-border": "#6b3a2a",
      "note-bg": "#1a0f0c",
      "note-border": "#4a2a20",
      "error-color": "#38bdf8"
    }
  },
  moonlitSurf: {
    label: "Moonlit Surf",
    vars: {
      "bg-color": "#0a1115",
      "text-color": "#e9faff",
      "muted-text": "#b7dff2",
      "container-bg": "#132028",
      "container-border": "#a3e635",
      "container-shadow": "0 0 20px rgba(56, 189, 248, 0.24)",
      "accent": "#38bdf8",
      "accent-strong": "#0f3b57",
      "accent-strong-hover": "#125170",
      "input-bg": "#1c2b35",
      "input-border": "#3b5668",
      "note-bg": "#0f1820",
      "note-border": "#2d4454",
      "error-color": "#f97316"
    }
  },
  novaPunch: {
    label: "Nova Punch",
    vars: {
      "bg-color": "#120f16",
      "text-color": "#f8f3ff",
      "muted-text": "#d4c4ff",
      "container-bg": "#1f1b2e",
      "container-border": "#f472b6",
      "container-shadow": "0 0 20px rgba(34, 211, 238, 0.24)",
      "accent": "#22d3ee",
      "accent-strong": "#0e4f5e",
      "accent-strong-hover": "#136378",
      "input-bg": "#2a2540",
      "input-border": "#524a73",
      "note-bg": "#181427",
      "note-border": "#3a3456",
      "error-color": "#f97316"
    }
  },
  orchidIce: {
    label: "Orchid Ice",
    vars: {
      "bg-color": "#0f111a",
      "text-color": "#f4f0ff",
      "muted-text": "#c7c1ff",
      "container-bg": "#1b1e30",
      "container-border": "#f9a8d4",
      "container-shadow": "0 0 20px rgba(129, 140, 248, 0.25)",
      "accent": "#818cf8",
      "accent-strong": "#3730a3",
      "accent-strong-hover": "#4338ca",
      "input-bg": "#27263f",
      "input-border": "#4d4a73",
      "note-bg": "#151626",
      "note-border": "#34324f",
      "error-color": "#f472b6"
    }
  },
  pulseRift: {
    label: "Pulse Rift",
    vars: {
      "bg-color": "#0b0f14",
      "text-color": "#eaf6ff",
      "muted-text": "#a9d6ff",
      "container-bg": "#121a26",
      "container-border": "#f472b6",
      "container-shadow": "0 0 20px rgba(14, 165, 233, 0.24)",
      "accent": "#0ea5e9",
      "accent-strong": "#0f3b57",
      "accent-strong-hover": "#125170",
      "input-bg": "#1c2634",
      "input-border": "#36485c",
      "note-bg": "#0e1620",
      "note-border": "#2a3b4d",
      "error-color": "#f472b6"
    }
  },
  rainbowRoad: {
    label: "Rainbow Road",
    vars: {
      "bg-color": "#0c0f18",
      "text-color": "#f2f7ff",
      "muted-text": "#c1d4ff",
      "container-bg": "#151c2e",
      "container-border": "#22c55e",
      "container-shadow": "0 0 20px rgba(236, 72, 153, 0.24)",
      "accent": "#ec4899",
      "accent-strong": "#831843",
      "accent-strong-hover": "#9d174d",
      "input-bg": "#1f273b",
      "input-border": "#42506b",
      "note-bg": "#111624",
      "note-border": "#303b54",
      "error-color": "#f59e0b"
    }
  },
  saffronTide: {
    label: "Saffron Tide",
    vars: {
      "bg-color": "#0f120d",
      "text-color": "#f9ffe9",
      "muted-text": "#d6f5b7",
      "container-bg": "#1b2416",
      "container-border": "#38bdf8",
      "container-shadow": "0 0 20px rgba(250, 204, 21, 0.24)",
      "accent": "#facc15",
      "accent-strong": "#7a5a00",
      "accent-strong-hover": "#946b00",
      "input-bg": "#263020",
      "input-border": "#4f5f3b",
      "note-bg": "#151d12",
      "note-border": "#3a4a2b",
      "error-color": "#38bdf8"
    }
  },
  skylineGlow: {
    label: "Skyline Glow",
    vars: {
      "bg-color": "#0b1016",
      "text-color": "#eef6ff",
      "muted-text": "#b7cbe8",
      "container-bg": "#141d2b",
      "container-border": "#facc15",
      "container-shadow": "0 0 20px rgba(99, 102, 241, 0.24)",
      "accent": "#6366f1",
      "accent-strong": "#312e81",
      "accent-strong-hover": "#3730a3",
      "input-bg": "#1f2b3c",
      "input-border": "#3e5166",
      "note-bg": "#111825",
      "note-border": "#2d3b4a",
      "error-color": "#facc15"
    }
  },
  spectrumNoir: {
    label: "Spectrum Noir",
    vars: {
      "bg-color": "#080a12",
      "text-color": "#f1f5ff",
      "muted-text": "#c3c9ff",
      "container-bg": "#12182b",
      "container-border": "#60a5fa",
      "container-shadow": "0 0 20px rgba(244, 114, 182, 0.24)",
      "accent": "#f472b6",
      "accent-strong": "#7a2a4d",
      "accent-strong-hover": "#95325f",
      "input-bg": "#1a223a",
      "input-border": "#3b4666",
      "note-bg": "#0f1525",
      "note-border": "#2b3352",
      "error-color": "#f59e0b"
    }
  },
  vividHarbor: {
    label: "Vivid Harbor",
    vars: {
      "bg-color": "#0a1216",
      "text-color": "#e9fbff",
      "muted-text": "#b7e8f2",
      "container-bg": "#14222a",
      "container-border": "#f59e0b",
      "container-shadow": "0 0 20px rgba(34, 211, 238, 0.24)",
      "accent": "#22d3ee",
      "accent-strong": "#0e4f5e",
      "accent-strong-hover": "#136378",
      "input-bg": "#1c2c36",
      "input-border": "#3e5a6b",
      "note-bg": "#0f1a20",
      "note-border": "#2d4552",
      "error-color": "#f59e0b"
    }
  },
  zenithMix: {
    label: "Zenith Mix",
    vars: {
      "bg-color": "#0f1116",
      "text-color": "#f6f3ff",
      "muted-text": "#d2c9ff",
      "container-bg": "#1a1e2d",
      "container-border": "#34d399",
      "container-shadow": "0 0 20px rgba(168, 85, 247, 0.24)",
      "accent": "#a855f7",
      "accent-strong": "#4c1d95",
      "accent-strong-hover": "#5b21b6",
      "input-bg": "#26263f",
      "input-border": "#4b4a6b",
      "note-bg": "#151525",
      "note-border": "#34324f",
      "error-color": "#34d399"
    }
  },
  animeNaruto: {
    label: "Naruto Orange Leaf",
    vars: {
      "bg-color": "#14100b",
      "text-color": "#fff4e6",
      "muted-text": "#ffd7a6",
      "container-bg": "#25190f",
      "container-border": "#f97316",
      "container-shadow": "0 0 20px rgba(249, 115, 22, 0.28)",
      "accent": "#f97316",
      "accent-strong": "#7c2d12",
      "accent-strong-hover": "#9a3412",
      "input-bg": "#2f2014",
      "input-border": "#7c4a2a",
      "note-bg": "#1f140d",
      "note-border": "#6b3b1a",
      "error-color": "#fb7185"
    }
  },
  animeOnePiece: {
    label: "One Piece Grand Line",
    vars: {
      "bg-color": "#091521",
      "text-color": "#ecf7ff",
      "muted-text": "#b8dcf6",
      "container-bg": "#122235",
      "container-border": "#38bdf8",
      "container-shadow": "0 0 20px rgba(56, 189, 248, 0.3)",
      "accent": "#facc15",
      "accent-strong": "#1e3a8a",
      "accent-strong-hover": "#1d4ed8",
      "input-bg": "#1a3044",
      "input-border": "#3f6178",
      "note-bg": "#102031",
      "note-border": "#2f5168",
      "error-color": "#fb7185"
    }
  },
  animeDragonBall: {
    label: "Dragon Ball Saiyan",
    vars: {
      "bg-color": "#0a1220",
      "text-color": "#f4f8ff",
      "muted-text": "#c7d7f7",
      "container-bg": "#13233b",
      "container-border": "#f59e0b",
      "container-shadow": "0 0 20px rgba(245, 158, 11, 0.28)",
      "accent": "#f97316",
      "accent-strong": "#1e3a8a",
      "accent-strong-hover": "#1d4ed8",
      "input-bg": "#1b2d47",
      "input-border": "#4b6285",
      "note-bg": "#101d31",
      "note-border": "#31486b",
      "error-color": "#ef4444"
    }
  },
  animeAttackOnTitan: {
    label: "Attack on Titan Scout",
    vars: {
      "bg-color": "#0f1214",
      "text-color": "#f3f4f6",
      "muted-text": "#d0d2d6",
      "container-bg": "#1a2128",
      "container-border": "#84cc16",
      "container-shadow": "0 0 20px rgba(132, 204, 22, 0.24)",
      "accent": "#84cc16",
      "accent-strong": "#365314",
      "accent-strong-hover": "#4d7c0f",
      "input-bg": "#242d35",
      "input-border": "#56626d",
      "note-bg": "#151b21",
      "note-border": "#3a444f",
      "error-color": "#f87171"
    }
  },
  animeDemonSlayer: {
    label: "Demon Slayer Hinokami",
    vars: {
      "bg-color": "#120e10",
      "text-color": "#fff1f2",
      "muted-text": "#fecdd3",
      "container-bg": "#21171b",
      "container-border": "#fb7185",
      "container-shadow": "0 0 20px rgba(251, 113, 133, 0.3)",
      "accent": "#ef4444",
      "accent-strong": "#7f1d1d",
      "accent-strong-hover": "#991b1b",
      "input-bg": "#2b1e23",
      "input-border": "#74414d",
      "note-bg": "#1b1317",
      "note-border": "#5f343f",
      "error-color": "#fda4af"
    }
  },
  animeJujutsuKaisen: {
    label: "Jujutsu Kaisen Cursed",
    vars: {
      "bg-color": "#0d0b14",
      "text-color": "#f6f1ff",
      "muted-text": "#d9ccff",
      "container-bg": "#18142a",
      "container-border": "#a78bfa",
      "container-shadow": "0 0 20px rgba(167, 139, 250, 0.28)",
      "accent": "#8b5cf6",
      "accent-strong": "#4c1d95",
      "accent-strong-hover": "#5b21b6",
      "input-bg": "#221c36",
      "input-border": "#584b7e",
      "note-bg": "#161127",
      "note-border": "#43355f",
      "error-color": "#f472b6"
    }
  },
  animeMyHero: {
    label: "My Hero Plus Ultra",
    vars: {
      "bg-color": "#08130f",
      "text-color": "#ebfff7",
      "muted-text": "#b7f2db",
      "container-bg": "#11231b",
      "container-border": "#22c55e",
      "container-shadow": "0 0 20px rgba(34, 197, 94, 0.26)",
      "accent": "#eab308",
      "accent-strong": "#166534",
      "accent-strong-hover": "#15803d",
      "input-bg": "#1a3126",
      "input-border": "#3f6a56",
      "note-bg": "#0f1d17",
      "note-border": "#315344",
      "error-color": "#f97316"
    }
  },
  animeSailorMoon: {
    label: "Sailor Moon Prism",
    vars: {
      "bg-color": "#130f1a",
      "text-color": "#fff2fd",
      "muted-text": "#f9c8ec",
      "container-bg": "#241831",
      "container-border": "#f9a8d4",
      "container-shadow": "0 0 20px rgba(249, 168, 212, 0.28)",
      "accent": "#f472b6",
      "accent-strong": "#7e1f5c",
      "accent-strong-hover": "#9d2f71",
      "input-bg": "#301f3e",
      "input-border": "#7a4f86",
      "note-bg": "#1c1226",
      "note-border": "#633a70",
      "error-color": "#facc15"
    }
  },
  animeDeathNote: {
    label: "Death Note Shinigami",
    vars: {
      "bg-color": "#0a0a0d",
      "text-color": "#f4f4f5",
      "muted-text": "#d4d4d8",
      "container-bg": "#14141a",
      "container-border": "#a1a1aa",
      "container-shadow": "0 0 20px rgba(161, 161, 170, 0.24)",
      "accent": "#e4e4e7",
      "accent-strong": "#27272a",
      "accent-strong-hover": "#3f3f46",
      "input-bg": "#1c1c24",
      "input-border": "#52525b",
      "note-bg": "#12121a",
      "note-border": "#3f3f4d",
      "error-color": "#fb7185"
    }
  },
  animeFullmetal: {
    label: "Fullmetal Alchemist",
    vars: {
      "bg-color": "#151010",
      "text-color": "#fff3ef",
      "muted-text": "#f8d0c5",
      "container-bg": "#261817",
      "container-border": "#f87171",
      "container-shadow": "0 0 20px rgba(248, 113, 113, 0.26)",
      "accent": "#f97316",
      "accent-strong": "#7f1d1d",
      "accent-strong-hover": "#991b1b",
      "input-bg": "#31201f",
      "input-border": "#7b4a47",
      "note-bg": "#1f1414",
      "note-border": "#603735",
      "error-color": "#fca5a5"
    }
  },
  nflCardinals: {
    label: "Arizona Cardinals",
    vars: {
      "bg-color": "#160c10",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#22121a",
      "container-border": "#ffb612",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#97233f",
      "accent-strong": "#5b1426",
      "accent-strong-hover": "#6f1b2f",
      "input-bg": "#1d131a",
      "input-border": "#ffb612",
      "note-bg": "#120a0e",
      "note-border": "#ffb612",
      "error-color": "#ffb612"
    }
  },
  nflFalcons: {
    label: "Atlanta Falcons",
    vars: {
      "bg-color": "#160b0f",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#221015",
      "container-border": "#a5acaf",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#a71930",
      "accent-strong": "#5c0d1a",
      "accent-strong-hover": "#731022",
      "input-bg": "#1d1217",
      "input-border": "#a5acaf",
      "note-bg": "#120a0d",
      "note-border": "#a5acaf",
      "error-color": "#a5acaf"
    }
  },
  nflRavens: {
    label: "Baltimore Ravens",
    vars: {
      "bg-color": "#100d1c",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#1a1428",
      "container-border": "#9e7c0c",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#241773",
      "accent-strong": "#120c3a",
      "accent-strong-hover": "#1a1153",
      "input-bg": "#181126",
      "input-border": "#9e7c0c",
      "note-bg": "#0d0a18",
      "note-border": "#9e7c0c",
      "error-color": "#9e7c0c"
    }
  },
  nflBills: {
    label: "Buffalo Bills",
    vars: {
      "bg-color": "#0b111f",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#141d31",
      "container-border": "#c60c30",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#00338d",
      "accent-strong": "#001c50",
      "accent-strong-hover": "#00286b",
      "input-bg": "#1a2438",
      "input-border": "#c60c30",
      "note-bg": "#0d1523",
      "note-border": "#c60c30",
      "error-color": "#c60c30"
    }
  },
  nflPanthers: {
    label: "Carolina Panthers",
    vars: {
      "bg-color": "#0b1218",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#141f28",
      "container-border": "#bfc0bf",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#0085ca",
      "accent-strong": "#004c74",
      "accent-strong-hover": "#006096",
      "input-bg": "#1a2732",
      "input-border": "#bfc0bf",
      "note-bg": "#0d161d",
      "note-border": "#bfc0bf",
      "error-color": "#bfc0bf"
    }
  },
  nflBears: {
    label: "Chicago Bears",
    vars: {
      "bg-color": "#0b1018",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#141b26",
      "container-border": "#c83803",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#0b162a",
      "accent-strong": "#060c18",
      "accent-strong-hover": "#0a1222",
      "input-bg": "#1a2230",
      "input-border": "#c83803",
      "note-bg": "#0d121b",
      "note-border": "#c83803",
      "error-color": "#c83803"
    }
  },
  nflBengals: {
    label: "Cincinnati Bengals",
    vars: {
      "bg-color": "#180d09",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#241311",
      "container-border": "#fb4f14",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#fb4f14",
      "accent-strong": "#a4320c",
      "accent-strong-hover": "#c33c0f",
      "input-bg": "#1f140f",
      "input-border": "#fb4f14",
      "note-bg": "#120b08",
      "note-border": "#fb4f14",
      "error-color": "#fb4f14"
    }
  },
  nflBrowns: {
    label: "Cleveland Browns",
    vars: {
      "bg-color": "#140f0a",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#1f160f",
      "container-border": "#ff3c00",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#311d00",
      "accent-strong": "#1b1000",
      "accent-strong-hover": "#241500",
      "input-bg": "#1b140c",
      "input-border": "#ff3c00",
      "note-bg": "#120d08",
      "note-border": "#ff3c00",
      "error-color": "#ff3c00"
    }
  },
  nflCowboys: {
    label: "Dallas Cowboys",
    vars: {
      "bg-color": "#0b111f",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#141d31",
      "container-border": "#869397",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#003594",
      "accent-strong": "#001f56",
      "accent-strong-hover": "#002c73",
      "input-bg": "#1a2438",
      "input-border": "#869397",
      "note-bg": "#0d1523",
      "note-border": "#869397",
      "error-color": "#869397"
    }
  },
  nflBroncos: {
    label: "Denver Broncos",
    vars: {
      "bg-color": "#180d09",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#241311",
      "container-border": "#c33c0f",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#fb4f14",
      "accent-strong": "#a4320c",
      "accent-strong-hover": "#c33c0f",
      "input-bg": "#1f140f",
      "input-border": "#c33c0f",
      "note-bg": "#120b08",
      "note-border": "#c33c0f",
      "error-color": "#c33c0f"
    }
  },
  nflLions: {
    label: "Detroit Lions",
    vars: {
      "bg-color": "#0b1118",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#141f2b",
      "container-border": "#b0b7bc",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#0076b6",
      "accent-strong": "#00456b",
      "accent-strong-hover": "#005b88",
      "input-bg": "#1a2634",
      "input-border": "#b0b7bc",
      "note-bg": "#0d151d",
      "note-border": "#b0b7bc",
      "error-color": "#b0b7bc"
    }
  },
  nflPackers: {
    label: "Green Bay Packers",
    vars: {
      "bg-color": "#0d1312",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#17201d",
      "container-border": "#ffb612",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#203731",
      "accent-strong": "#12201c",
      "accent-strong-hover": "#182a26",
      "input-bg": "#1b2622",
      "input-border": "#ffb612",
      "note-bg": "#0f1513",
      "note-border": "#ffb612",
      "error-color": "#ffb612"
    }
  },
  nflTexans: {
    label: "Houston Texans",
    vars: {
      "bg-color": "#0b1116",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#141d26",
      "container-border": "#a71930",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#03202f",
      "accent-strong": "#011018",
      "accent-strong-hover": "#021824",
      "input-bg": "#1a242f",
      "input-border": "#a71930",
      "note-bg": "#0d151d",
      "note-border": "#a71930",
      "error-color": "#a71930"
    }
  },
  nflColts: {
    label: "Indianapolis Colts",
    vars: {
      "bg-color": "#0b111f",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#141d31",
      "container-border": "#a5acaf",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#002c5f",
      "accent-strong": "#001936",
      "accent-strong-hover": "#002447",
      "input-bg": "#1a2438",
      "input-border": "#a5acaf",
      "note-bg": "#0d1523",
      "note-border": "#a5acaf",
      "error-color": "#a5acaf"
    }
  },
  nflJaguars: {
    label: "Jacksonville Jaguars",
    vars: {
      "bg-color": "#0b1416",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#142126",
      "container-border": "#9f792c",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#006778",
      "accent-strong": "#003c45",
      "accent-strong-hover": "#00505d",
      "input-bg": "#1a2730",
      "input-border": "#9f792c",
      "note-bg": "#0d171b",
      "note-border": "#9f792c",
      "error-color": "#9f792c"
    }
  },
  nflChiefs: {
    label: "Kansas City Chiefs",
    vars: {
      "bg-color": "#160b10",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#221218",
      "container-border": "#ffb81c",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#e31837",
      "accent-strong": "#8c0e21",
      "accent-strong-hover": "#b0122b",
      "input-bg": "#1c1317",
      "input-border": "#ffb81c",
      "note-bg": "#120a0d",
      "note-border": "#ffb81c",
      "error-color": "#ffb81c"
    }
  },
  nflRaiders: {
    label: "Las Vegas Raiders",
    vars: {
      "bg-color": "#0c0c0e",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#16161a",
      "container-border": "#a5acaf",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#000000",
      "accent-strong": "#1a1a1a",
      "accent-strong-hover": "#2a2a2a",
      "input-bg": "#1e1e24",
      "input-border": "#a5acaf",
      "note-bg": "#111114",
      "note-border": "#a5acaf",
      "error-color": "#a5acaf"
    }
  },
  nflChargers: {
    label: "Los Angeles Chargers",
    vars: {
      "bg-color": "#0b1118",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#141f2b",
      "container-border": "#ffc20e",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#0080c6",
      "accent-strong": "#004a74",
      "accent-strong-hover": "#006091",
      "input-bg": "#1a2634",
      "input-border": "#ffc20e",
      "note-bg": "#0d151d",
      "note-border": "#ffc20e",
      "error-color": "#ffc20e"
    }
  },
  nflRams: {
    label: "Los Angeles Rams",
    vars: {
      "bg-color": "#0b111f",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#141d31",
      "container-border": "#ffa300",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#003594",
      "accent-strong": "#001f56",
      "accent-strong-hover": "#002c73",
      "input-bg": "#1a2438",
      "input-border": "#ffa300",
      "note-bg": "#0d1523",
      "note-border": "#ffa300",
      "error-color": "#ffa300"
    }
  },
  nflDolphins: {
    label: "Miami Dolphins",
    vars: {
      "bg-color": "#0b1416",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#142126",
      "container-border": "#fc4c02",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#008e97",
      "accent-strong": "#00535a",
      "accent-strong-hover": "#006b73",
      "input-bg": "#1a2730",
      "input-border": "#fc4c02",
      "note-bg": "#0d171b",
      "note-border": "#fc4c02",
      "error-color": "#fc4c02"
    }
  },
  nflVikings: {
    label: "Minnesota Vikings",
    vars: {
      "bg-color": "#120b1b",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#1c1428",
      "container-border": "#ffc62f",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#4f2683",
      "accent-strong": "#2d154a",
      "accent-strong-hover": "#3b1c62",
      "input-bg": "#1e1629",
      "input-border": "#ffc62f",
      "note-bg": "#120b19",
      "note-border": "#ffc62f",
      "error-color": "#ffc62f"
    }
  },
  nflPatriots: {
    label: "New England Patriots",
    vars: {
      "bg-color": "#0b1118",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#141f2b",
      "container-border": "#c60c30",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#002244",
      "accent-strong": "#001327",
      "accent-strong-hover": "#001b36",
      "input-bg": "#1a2634",
      "input-border": "#c60c30",
      "note-bg": "#0d151d",
      "note-border": "#c60c30",
      "error-color": "#c60c30"
    }
  },
  nflSaints: {
    label: "New Orleans Saints",
    vars: {
      "bg-color": "#0b0f12",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#161a20",
      "container-border": "#d3bc8d",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#101820",
      "accent-strong": "#0a0f14",
      "accent-strong-hover": "#0d131a",
      "input-bg": "#1c2027",
      "input-border": "#d3bc8d",
      "note-bg": "#11151b",
      "note-border": "#d3bc8d",
      "error-color": "#d3bc8d"
    }
  },
  nflGiants: {
    label: "New York Giants",
    vars: {
      "bg-color": "#0b111d",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#141a2b",
      "container-border": "#a71930",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#0b2265",
      "accent-strong": "#06143a",
      "accent-strong-hover": "#081b4c",
      "input-bg": "#1a2234",
      "input-border": "#a71930",
      "note-bg": "#0d121e",
      "note-border": "#a71930",
      "error-color": "#a71930"
    }
  },
  nflJets: {
    label: "New York Jets",
    vars: {
      "bg-color": "#0b1411",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#14201c",
      "container-border": "#ffffff",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#125740",
      "accent-strong": "#0a3225",
      "accent-strong-hover": "#0f4331",
      "input-bg": "#1a2622",
      "input-border": "#0f4331",
      "note-bg": "#0d1714",
      "note-border": "#0f4331",
      "error-color": "#0f4331"
    }
  },
  nflEagles: {
    label: "Philadelphia Eagles",
    vars: {
      "bg-color": "#0b1315",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#142023",
      "container-border": "#a5acaf",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#004c54",
      "accent-strong": "#002c31",
      "accent-strong-hover": "#003d44",
      "input-bg": "#1a262a",
      "input-border": "#a5acaf",
      "note-bg": "#0d1619",
      "note-border": "#a5acaf",
      "error-color": "#a5acaf"
    }
  },
  nflSteelers: {
    label: "Pittsburgh Steelers",
    vars: {
      "bg-color": "#14100a",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#1f1a10",
      "container-border": "#c28a00",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#ffb612",
      "accent-strong": "#9a6d00",
      "accent-strong-hover": "#c28a00",
      "input-bg": "#1b1710",
      "input-border": "#c28a00",
      "note-bg": "#120f0a",
      "note-border": "#c28a00",
      "error-color": "#c28a00"
    }
  },
  nfl49ers: {
    label: "San Francisco 49ers",
    vars: {
      "bg-color": "#160b0b",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#221212",
      "container-border": "#b3995d",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#aa0000",
      "accent-strong": "#660000",
      "accent-strong-hover": "#840000",
      "input-bg": "#1c1313",
      "input-border": "#b3995d",
      "note-bg": "#120a0a",
      "note-border": "#b3995d",
      "error-color": "#b3995d"
    }
  },
  nflSeahawks: {
    label: "Seattle Seahawks",
    vars: {
      "bg-color": "#0b1118",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#141f2b",
      "container-border": "#69be28",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#002244",
      "accent-strong": "#001327",
      "accent-strong-hover": "#001b36",
      "input-bg": "#1a2634",
      "input-border": "#69be28",
      "note-bg": "#0d151d",
      "note-border": "#69be28",
      "error-color": "#69be28"
    }
  },
  nflBuccaneers: {
    label: "Tampa Bay Buccaneers",
    vars: {
      "bg-color": "#160a0a",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#221111",
      "container-border": "#ff7900",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#d50a0a",
      "accent-strong": "#7f0606",
      "accent-strong-hover": "#a00808",
      "input-bg": "#1d1212",
      "input-border": "#34302b",
      "note-bg": "#120909",
      "note-border": "#ff7900",
      "error-color": "#ff7900"
    }
  },
  nflTitans: {
    label: "Tennessee Titans",
    vars: {
      "bg-color": "#0b1118",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#141f2b",
      "container-border": "#c8102e",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#4b92db",
      "accent-strong": "#2a5d94",
      "accent-strong-hover": "#3575b8",
      "input-bg": "#1a2634",
      "input-border": "#c8102e",
      "note-bg": "#0d151d",
      "note-border": "#c8102e",
      "error-color": "#c8102e"
    }
  },
  nflCommanders: {
    label: "Washington Commanders",
    vars: {
      "bg-color": "#150b0b",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#201212",
      "container-border": "#ffb612",
      "container-shadow": "0 0 20px rgba(0, 0, 0, 0.25)",
      "accent": "#5a1414",
      "accent-strong": "#330b0b",
      "accent-strong-hover": "#461010",
      "input-bg": "#1c1313",
      "input-border": "#ffb612",
      "note-bg": "#120a0a",
      "note-border": "#ffb612",
      "error-color": "#ffb612"
    }
  },
  chaos: {
    label: "Chaos Goblin",
    vars: {
      "bg-color": "#121212",
      "text-color": "#e0e0e0",
      "muted-text": "#d5e9ff",
      "container-bg": "#1e1e2f",
      "container-border": "#f9a8d4",
      "container-shadow": "0 0 20px rgba(249, 168, 212, 0.28)",
      "accent": "#f9a8d4",
      "accent-strong": "#7a2a4d",
      "accent-strong-hover": "#95325f",
      "input-bg": "#2a2a3a",
      "input-border": "#555",
      "note-bg": "#0f1b2b",
      "note-border": "#2f4b6f",
      "error-color": "#ff8fab"
    }
  },
  surpriseParty: {
    label: "Surprise Party",
    vars: {
      "bg-color": "#160b24",
      "text-color": "#f9f0ff",
      "muted-text": "#e7c6ff",
      "container-bg": "#241338",
      "container-border": "#ffb8f0",
      "container-shadow": "0 0 22px rgba(255, 184, 240, 0.32)",
      "accent": "#ffd166",
      "accent-strong": "#9333ea",
      "accent-strong-hover": "#a855f7",
      "input-bg": "#2d1c44",
      "input-border": "#704c91",
      "note-bg": "#1c102c",
      "note-border": "#5b3a7d",
      "error-color": "#ff9ad5"
    }
  },
  rainbowParty: {
    label: "Rainbow Party",
    vars: {
      "bg-color": "#0b0b16",
      "text-color": "#ffffff",
      "muted-text": "#ffffff",
      "container-bg": "#151527",
      "container-border": "#ffffff",
      "container-shadow": "0 0 18px rgba(255, 255, 255, 0.18)",
      "accent": "#ffffff",
      "accent-strong": "#1a1a2a",
      "accent-strong-hover": "#24243a",
      "input-bg": "#1a1a2e",
      "input-border": "#4c4c6a",
      "note-bg": "#121226",
      "note-border": "#3a3a54",
      "error-color": "#ffffff"
    }
  },
  sciFiCommand: {
    label: "Starship Command",
    vars: {
      "bg-color": "#020b12",
      "text-color": "#c8f0ff",
      "muted-text": "#5fb8d8",
      "container-bg": "#061220",
      "container-border": "#00c8ff",
      "container-shadow": "0 0 30px rgba(0, 200, 255, 0.35)",
      "accent": "#00c8ff",
      "accent-strong": "#003d5c",
      "accent-strong-hover": "#005278",
      "input-bg": "#071828",
      "input-border": "#1a5070",
      "note-bg": "#050f18",
      "note-border": "#164060",
      "error-color": "#ff4060"
    }
  }
};

let chaosIntervalId = null;
let chaosRotationSeconds = DEFAULT_CHAOS_ROTATION_SECONDS;
let activeThemeId = "ocean";
let currentChaosThemeId = null;
let currentSurpriseThemeId = null;
let chaosTransitionTimeoutId = null;
let customThemes = [];
let activeCustomThemeId = null;
let customThemeConfig = null;
let customThemeDraft = null;
let animeQuoteCycleIntervalId = null;
let currentAnimeQuote = "";

function getAnimeQuotesForTheme(themeId) {
  if (!ANIME_THEME_IDS.has(themeId)) return [];
  return ANIME_THEME_QUOTES[themeId] || [];
}

function ensureThemeTransitionLayer() {
  let layer = document.getElementById("themeTransitionLayer");
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "themeTransitionLayer";
    document.body.appendChild(layer);
  }
  return layer;
}

function setThemeVars(vars) {
  Object.entries(vars).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--${key}`, value);
  });
}

function clearInlineThemeVars() {
  [
    "--bg-color", "--text-color", "--muted-text",
    "--container-bg", "--container-border", "--container-shadow",
    "--accent", "--accent-strong", "--accent-strong-hover",
    "--button-text-color",
    "--input-bg", "--input-border",
    "--note-bg", "--note-border",
    "--error-color"
  ].forEach(name => document.documentElement.style.removeProperty(name));
}

function normalizeHexColor(value) {
  if (!value) return "#000000";
  if (value.startsWith("#") && (value.length === 7 || value.length === 4)) {
    if (value.length === 4) {
      return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`.toLowerCase();
    }
    return value.toLowerCase();
  }
  return "#000000";
}

function hexToRgb(value) {
  const hex = normalizeHexColor(value).replace("#", "");
  const full = hex.length === 3
    ? hex.split("").map(ch => ch + ch).join("")
    : hex.padStart(6, "0");
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return { r, g, b };
}

function rgbToHex({ r, g, b }) {
  const toHex = channel => Math.max(0, Math.min(255, Number(channel) || 0)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function deriveContainerShadow(hexColor) {
  const { r, g, b } = hexToRgb(hexColor);
  return `0 0 20px rgba(${r}, ${g}, ${b}, 0.25)`;
}

function isCustomThemeId(themeId) {
  return typeof themeId === "string" && themeId.startsWith(CUSTOM_THEME_ID_PREFIX);
}

function generateCustomThemeId() {
  return `${CUSTOM_THEME_ID_PREFIX}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeCustomThemeConfig(config = {}) {
  const name = config?.name?.trim() || DEFAULT_CUSTOM_THEME_NAME;
  const vars = {
    ...CUSTOM_THEME_DEFAULT_VARS,
    ...(config?.vars || {})
  };
  vars["container-shadow"] = deriveContainerShadow(vars["container-border"]);
  return {
    id: typeof config?.id === "string" && config.id ? config.id : generateCustomThemeId(),
    name,
    vars,
    containerImage: config?.containerImage || ""
  };
}

function getCustomThemeById(themeId) {
  return customThemes.find(theme => theme.id === themeId) || null;
}

function refreshCustomThemesInThemeMap() {
  Object.keys(THEMES).forEach(id => {
    if (isCustomThemeId(id)) {
      delete THEMES[id];
    }
  });
  customThemes.forEach(theme => {
    THEMES[theme.id] = {
      label: theme.name,
      vars: { ...theme.vars },
      containerImage: theme.containerImage
    };
  });
}

async function setCustomThemes(themes, { persist = true } = {}) {
  customThemes = themes;
  refreshCustomThemesInThemeMap();
  if (persist) {
    await setStoredValue(CUSTOM_THEMES_STORAGE_KEY, customThemes);
  }
}

async function setActiveCustomThemeId(themeId, { persist = true } = {}) {
  activeCustomThemeId = themeId || null;
  if (!persist) return;
  if (activeCustomThemeId) {
    await setStoredValue(CUSTOM_THEME_ACTIVE_ID_STORAGE_KEY, activeCustomThemeId);
    return;
  }
  await removeStoredValue(CUSTOM_THEME_ACTIVE_ID_STORAGE_KEY);
}

async function upsertCustomTheme(config) {
  const normalized = normalizeCustomThemeConfig(config);
  const index = customThemes.findIndex(theme => theme.id === normalized.id);
  if (index >= 0) {
    customThemes[index] = normalized;
  } else {
    customThemes.push(normalized);
  }
  await setCustomThemes([...customThemes]);
  await setActiveCustomThemeId(normalized.id);
  customThemeConfig = { ...normalized };
  return normalized;
}

async function removeCustomTheme(themeId) {
  const nextThemes = customThemes.filter(theme => theme.id !== themeId);
  await setCustomThemes(nextThemes);
  if (activeCustomThemeId === themeId) {
    await setActiveCustomThemeId(nextThemes[0]?.id || null);
  }
}

function encodeBase64(value) {
  return btoa(encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  }));
}

function decodeBase64(value) {
  const decoded = atob(value);
  const percentEncoded = Array.from(decoded).map(char => {
    return `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`;
  }).join("");
  return decodeURIComponent(percentEncoded);
}

function buildThemeKey(config) {
  const payload = {
    v: 1,
    name: config?.name || DEFAULT_CUSTOM_THEME_NAME,
    vars: config?.vars || {}
  };
  return encodeBase64(JSON.stringify(payload));
}

function parseThemeKey(key) {
  if (!key) return null;
  try {
    const decoded = decodeBase64(key.trim());
    const payload = JSON.parse(decoded);
    if (!payload || payload.v !== 1) return null;
    const name = typeof payload.name === "string" ? payload.name : DEFAULT_CUSTOM_THEME_NAME;
    const vars = payload.vars && typeof payload.vars === "object" ? payload.vars : {};
    const containerImage = typeof payload.containerImage === "string" ? payload.containerImage : "";
    return { name, vars, containerImage };
  } catch {
    return null;
  }
}

function setCustomContainerImage(image) {
  const value = image ? `url("${image}")` : "none";
  document.documentElement.style.setProperty("--custom-container-bg-image", value);
}

function setBodyThemeAttribute(themeId) {
  if (!document.body) return;
  document.body.dataset.theme = themeId;
}

function setButtonTextColor(themeId, theme) {
  const fallbackTextColor = theme?.vars?.["text-color"] || "#ffffff";
  const defaultButtonColor = theme?.vars?.["accent"] || "";
  const buttonTextColor = NFL_THEME_IDS.has(themeId) ? fallbackTextColor : defaultButtonColor;
  document.documentElement.style.setProperty("--button-text-color", buttonTextColor);
}

function getThemeCategory(themeId) {
  if (isCustomThemeId(themeId)) return "custom";
  if (SPECIAL_THEME_IDS.has(themeId)) return "special";
  if (NFL_THEME_IDS.has(themeId)) return "nfl";
  if (ANIME_THEME_IDS.has(themeId)) return "anime";
  if (MULTI_THEME_IDS.has(themeId)) return "multi";
  return "single";
}

async function loadCustomThemesFromStorage() {
  const stored = await getStoredValue(CUSTOM_THEMES_STORAGE_KEY);
  let loadedThemes = Array.isArray(stored) ? stored.map(theme => normalizeCustomThemeConfig(theme)) : [];
  if (!loadedThemes.length) {
    const legacy = await getStoredValue(CUSTOM_THEME_STORAGE_KEY);
    if (legacy) {
      loadedThemes = [normalizeCustomThemeConfig(legacy)];
      await removeStoredValue(CUSTOM_THEME_STORAGE_KEY);
    }
  }
  await setCustomThemes(loadedThemes, { persist: false });
  const storedActiveId = await getStoredValue(CUSTOM_THEME_ACTIVE_ID_STORAGE_KEY);
  activeCustomThemeId = loadedThemes.find(theme => theme.id === storedActiveId)?.id || loadedThemes[0]?.id || null;
  if (activeCustomThemeId) {
    await setActiveCustomThemeId(activeCustomThemeId, { persist: false });
    customThemeConfig = { ...getCustomThemeById(activeCustomThemeId) };
  } else {
    customThemeConfig = normalizeCustomThemeConfig({});
  }
}

function getThemesByCategory() {
  const grouped = {};
  Object.entries(THEMES).forEach(([id, theme]) => {
    const category = getThemeCategory(id);
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push({ id, theme });
  });
  Object.values(grouped).forEach(list => list.sort((a, b) => a.theme.label.localeCompare(b.theme.label)));
  return grouped;
}

function getRandomThemeId({ exclude = [], previous = null } = {}) {
  const excludedIds = new Set(exclude);
  const availableThemes = Object.keys(THEMES).filter(id => !excludedIds.has(id));
  if (!availableThemes.length) return "ocean";
  let next = availableThemes[Math.floor(Math.random() * availableThemes.length)];
  if (availableThemes.length > 1 && next === previous) {
    const currentIndex = availableThemes.indexOf(next);
    next = availableThemes[(currentIndex + 1) % availableThemes.length];
  }
  return next;
}

function stopChaosRotation() {
  if (chaosIntervalId) {
    clearInterval(chaosIntervalId);
    chaosIntervalId = null;
  }
}

function normalizeChaosSeconds(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_CHAOS_ROTATION_SECONDS;
  }
  return Math.round(parsed);
}

function applyRandomChaosTheme() {
  const nextThemeId = getRandomThemeId({
    exclude: ["chaos", "surpriseParty"],
    previous: currentChaosThemeId
  });
  currentChaosThemeId = nextThemeId;
  const theme = THEMES[nextThemeId];
  if (theme) {
    applyChaosThemeTransition(nextThemeId, theme);
  }
}

function triggerSurprisePartyThemeChange() {
  if (activeThemeId !== "surpriseParty") return;
  const nextThemeId = getRandomThemeId({
    exclude: ["chaos", "surpriseParty"],
    previous: currentSurpriseThemeId
  });
  currentSurpriseThemeId = nextThemeId;
  const theme = THEMES[nextThemeId];
  if (theme) {
    applyChaosThemeTransition(nextThemeId, theme);
    updateThemeSelection(activeThemeId);
  }
}

function startChaosRotation() {
  stopChaosRotation();
  applyRandomChaosTheme();
  chaosIntervalId = setInterval(() => {
    applyRandomChaosTheme();
  }, chaosRotationSeconds * 1000);
}

function clearChaosTransition() {
  if (chaosTransitionTimeoutId) {
    clearTimeout(chaosTransitionTimeoutId);
    chaosTransitionTimeoutId = null;
  }
  document.body?.classList.remove("chaos-transitioning");
  if (document.body) {
    document.body.style.backgroundColor = "";
  }
}

function applyChaosThemeTransition(themeId, theme) {
  if (!theme) return;
  const layer = ensureThemeTransitionLayer();
  const currentBg = getComputedStyle(document.documentElement).getPropertyValue("--bg-color").trim();
  if (currentBg) {
    document.body.style.backgroundColor = currentBg;
  }
  setThemeVars(theme.vars);
  setBodyThemeAttribute(themeId);
  setButtonTextColor(themeId, theme);
  saveCrmCustomCssThemeVars(themeId, theme);
  layer.style.backgroundColor = theme.vars["bg-color"] || "";
  document.body.classList.remove("chaos-transitioning");
  void layer.offsetHeight;
  document.body.classList.add("chaos-transitioning");
  if (chaosTransitionTimeoutId) {
    clearTimeout(chaosTransitionTimeoutId);
  }
  chaosTransitionTimeoutId = window.setTimeout(() => {
    document.body.classList.remove("chaos-transitioning");
    document.body.style.backgroundColor = "";
    chaosTransitionTimeoutId = null;
  }, 900);
}

function updateChaosControlsVisibility(themeId) {
  const controls = document.getElementById("chaosControls");
  if (controls) {
    controls.style.display = themeId === "chaos" ? "grid" : "none";
  }
}

function updateSurpriseControlsVisibility(themeId) {
  const controls = document.getElementById("surprisePartyControls");
  if (controls) {
    controls.style.display = themeId === "surpriseParty" ? "grid" : "none";
  }
}

function updateThemeSelection(themeId) {
  const current = THEMES[themeId] || THEMES.ocean;
  const label = document.getElementById("themeCurrentLabel");
  if (label) {
    if (themeId === "surpriseParty" && currentSurpriseThemeId && THEMES[currentSurpriseThemeId]) {
      label.textContent = `Current theme: ${current.label} (${THEMES[currentSurpriseThemeId].label})`;
    } else {
      label.textContent = `Current theme: ${current.label}`;
    }
  }

  document.querySelectorAll(".theme-option").forEach(btn => {
    const isActive = btn.dataset.theme === themeId;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  updateChaosControlsVisibility(themeId);
  updateSurpriseControlsVisibility(themeId);
}

function saveCrmCustomCssThemeVars(themeId, theme) {
  if (!theme?.vars) return;
  void setStoredValue(CRM_CUSTOM_CSS_THEME_VARS_STORAGE_KEY, {
    themeId,
    label: theme.label || themeId,
    vars: { ...theme.vars }
  });
}

function saveThemePreference(themeId) {
  if (chrome?.storage?.local) {
    chrome.storage.local.set({ [THEME_STORAGE_KEY]: themeId });
    return;
  }
  localStorage.setItem(THEME_STORAGE_KEY, themeId);
}

function saveChaosRotationSeconds(seconds) {
  if (chrome?.storage?.local) {
    chrome.storage.local.set({ [CHAOS_ROTATION_STORAGE_KEY]: seconds });
    return;
  }
  localStorage.setItem(CHAOS_ROTATION_STORAGE_KEY, String(seconds));
}

function applyTheme(themeId, { persist = true } = {}) {
  const requestedTheme = themeId === "customTheme" && activeCustomThemeId ? activeCustomThemeId : themeId;
  const resolvedTheme = THEMES[requestedTheme] ? requestedTheme : "ocean";
  activeThemeId = resolvedTheme;
  if (resolvedTheme === "chaos") {
    saveCrmCustomCssThemeVars("ocean", THEMES.ocean);
    clearInlineThemeVars();
    setBodyThemeAttribute(resolvedTheme);
    updateThemeSelection(resolvedTheme);
    updateLandingAnimeQuoteVisibility(resolvedTheme);
    startChaosRotation();
    if (persist) saveThemePreference(resolvedTheme);
    return;
  }
  stopChaosRotation();
  clearChaosTransition();
  if (resolvedTheme === "surpriseParty") {
    currentSurpriseThemeId = null;
  }
  const theme = THEMES[resolvedTheme];
  saveCrmCustomCssThemeVars(resolvedTheme, theme);
  if (isCustomThemeId(resolvedTheme)) {
    setThemeVars(theme.vars);
    setButtonTextColor(resolvedTheme, theme);
    setCustomContainerImage(theme.containerImage || "");
    void setActiveCustomThemeId(resolvedTheme);
  } else {
    clearInlineThemeVars();
    setCustomContainerImage("");
  }
  setBodyThemeAttribute(resolvedTheme);
  updateThemeSelection(resolvedTheme);
  updateLandingAnimeQuoteVisibility(resolvedTheme);
  const themeSelect = document.getElementById("onboardingThemeSelect");
  if (themeSelect) {
    themeSelect.value = resolvedTheme;
  }
  if (persist) saveThemePreference(resolvedTheme);
}

function loadThemePreference() {
  if (chrome?.storage?.local) {
    chrome.storage.local.get(THEME_STORAGE_KEY, res => {
      applyTheme(res?.[THEME_STORAGE_KEY] || "ocean", { persist: false });
    });
    return;
  }
  applyTheme(localStorage.getItem(THEME_STORAGE_KEY) || "ocean", { persist: false });
}

async function initChaosControls() {
  const chaosInput = document.getElementById("chaosRotationInput");
  if (!chaosInput) return;
  const storedSeconds = await getStoredValue(CHAOS_ROTATION_STORAGE_KEY);
  chaosRotationSeconds = normalizeChaosSeconds(storedSeconds ?? DEFAULT_CHAOS_ROTATION_SECONDS);
  chaosInput.value = String(chaosRotationSeconds);
  chaosInput.addEventListener("change", () => {
    chaosRotationSeconds = normalizeChaosSeconds(chaosInput.value);
    chaosInput.value = String(chaosRotationSeconds);
    saveChaosRotationSeconds(chaosRotationSeconds);
    if (activeThemeId === "chaos") {
      startChaosRotation();
    }
  });
}

function populateThemeSelect(selectEl) {
  if (!selectEl) return;
  selectEl.innerHTML = "";
  const groupedThemes = getThemesByCategory();
  THEME_CATEGORY_ORDER.forEach(category => {
    const themes = groupedThemes[category];
    if (!themes || !themes.length) return;
    const group = document.createElement("optgroup");
    group.label = THEME_CATEGORY_LABELS[category] || category;
    themes.forEach(({ id, theme }) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = theme.label;
      group.appendChild(option);
    });
    selectEl.appendChild(group);
  });
}

function refreshThemeSelects() {
  const themeSelect = document.getElementById("onboardingThemeSelect");
  populateThemeSelect(themeSelect);
  if (themeSelect && THEMES[activeThemeId]) {
    themeSelect.value = activeThemeId;
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      resolve(typeof result === "string" ? result : "");
    };
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}

function applyThemeBuilderPreview() {
  const preview = document.getElementById("themeBuilderPreview");
  if (!preview || !customThemeDraft) return;
  Object.entries(customThemeDraft.vars).forEach(([key, value]) => {
    preview.style.setProperty(`--${key}`, value);
  });
  preview.style.setProperty("--button-border", customThemeDraft.vars["container-border"]);
  preview.style.setProperty("--button-text-color", customThemeDraft.vars["accent"]);
  preview.style.setProperty(
    "--custom-container-bg-image",
    customThemeDraft.containerImage ? `url("${customThemeDraft.containerImage}")` : "none"
  );
}


function buildThemeBuilderControls() {
  const controls = document.getElementById("themeBuilderControls");
  if (!controls || !customThemeDraft) return;
  controls.innerHTML = "";
  CUSTOM_THEME_FIELDS.forEach(field => {
    const row = document.createElement("div");
    row.className = "theme-builder-control";
    const label = document.createElement("label");
    label.textContent = field.label;
    label.setAttribute("for", `theme-builder-${field.key}`);

    const inputs = document.createElement("div");
    inputs.className = "theme-builder-control__inputs";

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.id = `theme-builder-${field.key}`;
    colorInput.value = normalizeHexColor(customThemeDraft.vars[field.key]);

    const rgbInputs = document.createElement("div");
    rgbInputs.className = "theme-builder-control__rgb";
    const channels = ["R", "G", "B"];
    const rgbValues = hexToRgb(colorInput.value);
    const rgbFields = channels.map((labelText, index) => {
      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.max = "255";
      input.step = "1";
      input.value = String([rgbValues.r, rgbValues.g, rgbValues.b][index]);
      input.setAttribute("aria-label", `${field.label} ${labelText}`);
      return input;
    });

    let isSyncing = false;
    const syncInputs = hex => {
      const normalized = normalizeHexColor(hex);
      const rgb = hexToRgb(normalized);
      isSyncing = true;
      colorInput.value = normalized;
      rgbFields[0].value = String(rgb.r);
      rgbFields[1].value = String(rgb.g);
      rgbFields[2].value = String(rgb.b);
      isSyncing = false;
      customThemeDraft.vars[field.key] = normalized;
      if (field.key === "container-border") {
        customThemeDraft.vars["container-shadow"] = deriveContainerShadow(normalized);
      }
      applyThemeBuilderPreview();
    };

    colorInput.addEventListener("input", () => {
      if (isSyncing) return;
      syncInputs(colorInput.value);
    });

    rgbFields.forEach(input => {
      input.addEventListener("input", () => {
        if (isSyncing) return;
        const hex = rgbToHex({
          r: rgbFields[0].value,
          g: rgbFields[1].value,
          b: rgbFields[2].value
        });
        syncInputs(hex);
      });
    });

    rgbFields.forEach(input => rgbInputs.appendChild(input));
    inputs.appendChild(colorInput);
    inputs.appendChild(rgbInputs);
    row.appendChild(label);
    row.appendChild(inputs);
    controls.appendChild(row);
  });
}

function buildThemeConfigFromDraft({ id, name, vars, containerImage } = {}) {
  return normalizeCustomThemeConfig({
    id,
    name,
    vars,
    containerImage
  });
}

function updateThemeBuilderImageStatus() {
  const imageStatus = document.getElementById("themeBuilderImageStatus");
  if (!imageStatus || !customThemeDraft) return;
  imageStatus.textContent = customThemeDraft.containerImage ? "Custom image selected." : "No image uploaded.";
}

function updateThemeBuilderKeyOutput(value = "") {
  const keyOutput = document.getElementById("themeBuilderKeyOutput");
  if (!keyOutput) return;
  keyOutput.value = value;
}

function updateThemeBuilderKeyStatus(message = "") {
  const keyStatus = document.getElementById("themeBuilderKeyStatus");
  if (!keyStatus) return;
  keyStatus.textContent = message;
}

function updateThemeBuilderDeleteStatus(message = "") {
  const deleteStatus = document.getElementById("themeBuilderDeleteStatus");
  if (!deleteStatus) return;
  deleteStatus.textContent = message;
}

function refreshThemeBuilderFromActiveTheme() {
  const preferredId = isCustomThemeId(activeThemeId) ? activeThemeId : activeCustomThemeId;
  const theme = preferredId ? getCustomThemeById(preferredId) : null;
  if (theme) {
    void setActiveCustomThemeId(theme.id, { persist: false });
  }
  customThemeConfig = theme ? { ...theme } : normalizeCustomThemeConfig({});
  customThemeDraft = {
    name: customThemeConfig.name,
    vars: { ...customThemeConfig.vars },
    containerImage: customThemeConfig.containerImage
  };
  const nameInput = document.getElementById("themeBuilderNameInput");
  if (nameInput) {
    nameInput.value = customThemeDraft.name;
  }
  buildThemeBuilderControls();
  applyThemeBuilderPreview();
  updateThemeBuilderImageStatus();
  updateThemeBuilderKeyOutput("");
  updateThemeBuilderKeyStatus("");
  updateThemeBuilderDeleteStatus("");
}

async function initThemeBuilder() {
  const nameInput = document.getElementById("themeBuilderNameInput");
  const imageInput = document.getElementById("themeBuilderImageInput");
  const clearImageBtn = document.getElementById("themeBuilderClearImageBtn");
  const saveBtn = document.getElementById("themeBuilderSaveBtn");
  const saveStatus = document.getElementById("themeBuilderSaveStatus");
  const returnBtn = document.getElementById("themeBuilderReturnBtn");
  const keyOutput = document.getElementById("themeBuilderKeyOutput");
  const keyGenerateBtn = document.getElementById("themeBuilderKeyGenerateBtn");
  const keyCopyBtn = document.getElementById("themeBuilderKeyCopyBtn");
  const keyInput = document.getElementById("themeBuilderKeyInput");
  const keyApplyBtn = document.getElementById("themeBuilderKeyApplyBtn");
  const deleteBtn = document.getElementById("themeBuilderDeleteBtn");
  const mascotToggle = document.getElementById("themeBuilderMascotToggle");
  const symojiToggle = document.getElementById("themeBuilderSymojiToggle");
  const previewLayout = document.getElementById("themeBuilderLayout");

  const syncThemeBuilderDraft = config => {
    customThemeConfig = { ...config };
    customThemeDraft = {
      name: customThemeConfig.name,
      vars: { ...customThemeConfig.vars },
      containerImage: customThemeConfig.containerImage
    };
    if (nameInput) {
      nameInput.value = customThemeDraft.name;
    }
    buildThemeBuilderControls();
    applyThemeBuilderPreview();
    updateThemeBuilderImageStatus();
    updateThemeBuilderKeyOutput("");
  };

  refreshThemeBuilderFromActiveTheme();

  const initialLayoutOrder = getDefaultLandingLayoutOrder();
  applyThemeBuilderLayoutOrder(initialLayoutOrder);
  applyLandingLayoutPositions(previewLayout, DEFAULT_LANDING_LAYOUT_POSITIONS);

  if (mascotToggle) {
    mascotToggle.checked = await getLandingMascotVisible();
    applyThemeBuilderMascotVisibility(mascotToggle.checked);
    mascotToggle.addEventListener("change", async () => {
      const visible = Boolean(mascotToggle.checked);
      await setLandingMascotVisible(visible);
      applyLandingMascotVisibility(visible);
      applyThemeBuilderMascotVisibility(visible);
    });
  }

  if (symojiToggle) {
    symojiToggle.checked = await getLandingSymojiVisible();
    applyThemeBuilderSymojiVisibility(symojiToggle.checked);
    symojiToggle.addEventListener("change", async () => {
      const visible = Boolean(symojiToggle.checked);
      await setLandingSymojiVisible(visible);
      applyLandingSymojiVisibility(visible);
      applyThemeBuilderSymojiVisibility(visible);
    });
  }

  imageInput?.addEventListener("change", async () => {
    const file = imageInput.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      imageInput.value = "";
      return;
    }
    try {
      customThemeDraft.containerImage = await readFileAsDataUrl(file);
      applyThemeBuilderPreview();
      updateThemeBuilderImageStatus();
    } catch {
      alert("Unable to read that image file.");
    }
  });

  clearImageBtn?.addEventListener("click", () => {
    customThemeDraft.containerImage = "";
    if (imageInput) imageInput.value = "";
    applyThemeBuilderPreview();
    updateThemeBuilderImageStatus();
  });

  saveBtn?.addEventListener("click", async () => {
    const name = (nameInput?.value || "").trim() || DEFAULT_CUSTOM_THEME_NAME;
    const savedVars = { ...customThemeDraft.vars };
    savedVars["container-shadow"] = deriveContainerShadow(savedVars["container-border"]);
    const savedConfig = buildThemeConfigFromDraft({
      id: customThemeConfig?.id,
      name,
      vars: savedVars,
      containerImage: customThemeDraft.containerImage || ""
    });
    await upsertCustomTheme(savedConfig);
    setCustomContainerImage(savedConfig.containerImage);
    renderThemeOptions();
    refreshThemeSelects();
    applyTheme(savedConfig.id);
    if (saveStatus) {
      saveStatus.textContent = `Saved "${name}" and applied it as your active theme.`;
    }
    updateThemeBuilderKeyOutput("");
    updateThemeBuilderKeyStatus("Generate a key when you're ready to share.");
  });

  keyGenerateBtn?.addEventListener("click", () => {
    if (!customThemeDraft) return;
    const name = (nameInput?.value || "").trim() || DEFAULT_CUSTOM_THEME_NAME;
    const draftConfig = buildThemeConfigFromDraft({
      id: customThemeConfig?.id,
      name,
      vars: { ...customThemeDraft.vars },
      containerImage: customThemeDraft.containerImage || ""
    });
    const key = buildThemeKey(draftConfig);
    updateThemeBuilderKeyOutput(key);
    if (draftConfig.containerImage) {
      updateThemeBuilderKeyStatus(
        "Theme key generated. This theme uses a custom image—send that image to anyone you share the key with."
      );
    } else {
      updateThemeBuilderKeyStatus("Theme key generated.");
    }
  });

  keyCopyBtn?.addEventListener("click", async () => {
    if (!keyOutput?.value) {
      updateThemeBuilderKeyStatus("Generate a key before copying.");
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(keyOutput.value);
      } else {
        keyOutput.select();
        document.execCommand("copy");
      }
      updateThemeBuilderKeyStatus("Theme key copied to clipboard.");
    } catch {
      updateThemeBuilderKeyStatus("Unable to copy the theme key.");
    }
  });

  keyApplyBtn?.addEventListener("click", async () => {
    const candidate = (keyInput?.value || "").trim();
    if (!candidate) {
      updateThemeBuilderKeyStatus("Paste a theme key to import.");
      return;
    }
    const parsed = parseThemeKey(candidate);
    if (!parsed) {
      updateThemeBuilderKeyStatus("That key doesn't look valid.");
      return;
    }
    const imported = await upsertCustomTheme(parsed);
    setCustomContainerImage(imported.containerImage);
    renderThemeOptions();
    refreshThemeSelects();
    applyTheme(imported.id);
    syncThemeBuilderDraft(imported);
    updateThemeBuilderKeyStatus(`Loaded "${imported.name}".`);
  });

  deleteBtn?.addEventListener("click", async () => {
    if (!customThemeConfig?.id || !isCustomThemeId(customThemeConfig.id)) return;
    const confirmed = confirm(`Delete "${customThemeConfig.name}"?`);
    if (!confirmed) return;
    const deletedId = customThemeConfig.id;
    await removeCustomTheme(deletedId);
    setCustomContainerImage("");
    renderThemeOptions();
    refreshThemeSelects();
    if (activeThemeId === deletedId) {
      applyTheme("ocean");
    }
    refreshThemeBuilderFromActiveTheme();
    updateThemeBuilderDeleteStatus("Custom theme deleted.");
  });

  returnBtn?.addEventListener("click", () => {
    showSettingsView();
  });
}

let symojiPickerOnSelect = null;

function getSymojiSrc(filename) {
  return encodeURI(`${SYMOJI_ASSET_ROOT}/${filename}`);
}

function openSymojiPicker({ title, hint, onSelect }) {
  const picker = document.getElementById("symojiPicker");
  if (!picker) return;
  symojiPickerOnSelect = onSelect;
  const titleEl = document.getElementById("symojiPickerTitle");
  const hintEl = document.getElementById("symojiPickerHint");
  if (titleEl) titleEl.textContent = title || "Choose a Symoji";
  if (hintEl) hintEl.textContent = hint || "Pick a Symoji from the built-in set.";
  picker.classList.add("is-open");
  picker.setAttribute("aria-hidden", "false");
}

function closeSymojiPicker() {
  const picker = document.getElementById("symojiPicker");
  if (!picker) return;
  picker.classList.remove("is-open");
  picker.setAttribute("aria-hidden", "true");
  symojiPickerOnSelect = null;
}

function initSymojiPicker() {
  const grid = document.getElementById("symojiPickerGrid");
  if (grid) {
    grid.innerHTML = "";
    SYMOJI_FILES.forEach(filename => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "symoji-grid__item";
      const src = getSymojiSrc(filename);
      const image = document.createElement("img");
      image.src = src;
      image.alt = filename.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
      const label = document.createElement("span");
      label.className = "symoji-grid__label";
      label.textContent = filename.replace(/\.[^.]+$/, "");

      button.appendChild(image);
      button.appendChild(label);
      button.addEventListener("click", () => {
        symojiPickerOnSelect?.(src);
        closeSymojiPicker();
      });
      grid.appendChild(button);
    });
  }

  document.getElementById("symojiPickerCloseBtn")?.addEventListener("click", () => {
    closeSymojiPicker();
  });

  const picker = document.getElementById("symojiPicker");
  picker?.addEventListener("click", event => {
    if (event.target === picker) {
      closeSymojiPicker();
    }
  });
}

async function initOnboardingForm() {
  const form = document.getElementById("onboardingForm");
  const firstNameInput = document.getElementById("userFirstName");
  const mascotInput = document.getElementById("userMascotInput");
  const symojiPickerBtn = document.getElementById("symojiPickerMascotBtn");
  const mascotSizeInput = document.getElementById("onboardingMascotSize");
  const themeSelect = document.getElementById("onboardingThemeSelect");
  const dailyCounterToggle = document.getElementById("onboardingDailyCounterToggle");
  const customDailyCounterToggle = document.getElementById("onboardingCustomDailyCounterToggle");
  const customDailyCounterNameInput = document.getElementById("onboardingCustomDailyCounterName");
  const weeklyCounterToggle = document.getElementById("onboardingWeeklyCounterToggle");
  const tooltipToggle = document.getElementById("onboardingTooltipToggle");
  let pendingMascot = null;

  populateThemeSelect(themeSelect);
  const storedTheme = await getStoredValue(THEME_STORAGE_KEY);
  if (storedTheme && themeSelect) {
    themeSelect.value = storedTheme;
  }

  const existingProfile = await getUserProfile();
  if (existingProfile && firstNameInput) {
    firstNameInput.value = existingProfile.firstName || "";
  }
  if (mascotInput) {
    const storedMascot = await getUserMascot();
    updateMascotPreview(storedMascot);
    mascotInput.addEventListener("change", async () => {
      const file = mascotInput.files?.[0];
      if (!file) {
        pendingMascot = null;
        return;
      }
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file for your mascot.");
        mascotInput.value = "";
        pendingMascot = null;
        return;
      }
      try {
        const dataUrl = await readFileAsDataUrl(file);
        pendingMascot = dataUrl;
        updateMascotPreview(dataUrl);
      } catch {
        alert("Unable to read that image file.");
      }
    });
  }
  if (mascotSizeInput) {
    const storedMascotSize = await getUserMascotSize();
    applyMascotPreviewSize(storedMascotSize ?? DEFAULT_MASCOT_SIZE);
    mascotSizeInput.addEventListener("input", () => {
      applyMascotPreviewSize(mascotSizeInput.value);
    });
  }
  if (symojiPickerBtn) {
    symojiPickerBtn.addEventListener("click", () => {
      openSymojiPicker({
        title: "Choose a profile Symoji",
        hint: "Select a Symoji from the built-in set for your profile mascot.",
        onSelect: src => {
          pendingMascot = src;
          updateMascotPreview(src);
          if (mascotInput) mascotInput.value = "";
        }
      });
    });
  }
  if (dailyCounterToggle) {
    dailyCounterToggle.checked = await getDailyCounterEnabled();
  }
  if (customDailyCounterToggle) {
    customDailyCounterToggle.checked = await getDailyCustomCounterEnabled();
  }
  if (customDailyCounterNameInput) {
    customDailyCounterNameInput.value = await getDailyCustomCounterLabel();
    customDailyCounterNameInput.disabled = !customDailyCounterToggle?.checked;
  }
  if (weeklyCounterToggle) {
    weeklyCounterToggle.checked = await getWeeklyCounterEnabled();
  }
  if (tooltipToggle) {
    tooltipToggle.checked = await getLandingTooltipsEnabled();
  }

  if (customDailyCounterToggle && customDailyCounterNameInput) {
    customDailyCounterToggle.addEventListener("change", () => {
      customDailyCounterNameInput.disabled = !customDailyCounterToggle.checked;
    });
  }

  if (!form) return;
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const firstName = (firstNameInput?.value || "").trim();
    const lastName = existingProfile?.lastName || "";
    const themeId = themeSelect?.value || "ocean";
    const dailyCounterEnabled = dailyCounterToggle?.checked ?? true;
    const customDailyCounterEnabled = customDailyCounterToggle?.checked ?? false;
    const customDailyCounterLabel = customDailyCounterNameInput?.value || "";
    const weeklyCounterEnabled = weeklyCounterToggle?.checked ?? true;
    const tooltipsEnabled = tooltipToggle?.checked ?? true;
    const mascotSize = mascotSizeInput?.value ?? DEFAULT_MASCOT_SIZE;

    if (!firstName) {
      alert("Please enter your username.");
      return;
    }

    await saveUserProfile({ firstName, lastName });
    if (pendingMascot) {
      await saveUserMascot(pendingMascot);
      updateLandingMascot(pendingMascot);
    }
    await saveUserMascotSize(mascotSize);
    applyLandingMascotSize(mascotSize);
    await setDailyCounterEnabled(dailyCounterEnabled);
    await setDailyCustomCounterEnabled(customDailyCounterEnabled);
    await setDailyCustomCounterLabel(customDailyCounterLabel);
    await setWeeklyCounterEnabled(weeklyCounterEnabled);
    await setLandingTooltipsEnabled(tooltipsEnabled);
    applyLandingTooltipsEnabled(tooltipsEnabled);
    await updateDailyCustomCounterSettings();
    applyTheme(themeId);
    showLandingView();
  });
}

async function openOutlookSetupTab() {
  if (chrome?.tabs?.create) {
    const tab = await chrome.tabs.create({ url: OUTLOOK_SETUP_URL });
    outlookSetupTabId = tab?.id ?? null;
    return;
  }
  window.open(OUTLOOK_SETUP_URL, "_blank", "noopener,noreferrer");
}

function initOutlookSetupFlow() {
  const beginBtn = document.getElementById("beginOutlookSetupBtn");
  const finishBtn = document.getElementById("finishOutlookSetupBtn");

  beginBtn?.addEventListener("click", async () => {
    await openOutlookSetupTab();
    showOutlookSetupView();
  });

  finishBtn?.addEventListener("click", async () => {
    if (chrome?.tabs?.remove && outlookSetupTabId) {
      await chrome.tabs.remove(outlookSetupTabId);
    }
    outlookSetupTabId = null;
    showOnboardingView();
  });
}

async function initDailyCounterSetting() {
  const toggle = document.getElementById("dailyCounterToggle");
  if (!toggle) return;
  toggle.checked = await getDailyCounterEnabled();
  toggle.addEventListener("change", async () => {
    await setDailyCounterEnabled(toggle.checked);
    await updateDailyCounterVisibility();
  });
}

function renderThemeOptions() {
  const themeOptions = document.getElementById("themeOptions");
  if (!themeOptions) return;
  themeOptions.innerHTML = "";
  const groupedThemes = getThemesByCategory();
  THEME_CATEGORY_ORDER.forEach(category => {
    const themes = groupedThemes[category];
    if (!themes || !themes.length) return;
    const section = document.createElement("div");
    section.className = "theme-options__section";
    const sectionKey = `theme-${category}`;
    const heading = document.createElement("button");
    heading.type = "button";
    heading.className = "toggle-btn theme-options__toggle";
    heading.dataset.collapsible = sectionKey;
    heading.setAttribute("aria-expanded", "false");
    heading.innerHTML = `
        <span>${THEME_CATEGORY_LABELS[category] || category}</span>
        <span class="theme-options__chevron" aria-hidden="true">▾</span>
      `;
    const grid = document.createElement("div");
    grid.className = "theme-options__grid";
    themes.forEach(({ id, theme }) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "theme-option";
      button.dataset.theme = id;
      button.setAttribute("aria-pressed", "false");

      const swatch = document.createElement("span");
      swatch.className = "theme-swatch";
      swatch.style.setProperty("--theme-swatch", theme.vars["accent"] || "");

      const label = document.createElement("span");
      label.className = "theme-option__label";
      label.textContent = theme.label;

      button.appendChild(swatch);
      button.appendChild(label);
      grid.appendChild(button);
    });
    const content = document.createElement("div");
    content.className = "theme-options__content";
    content.dataset.collapsibleContent = sectionKey;
    content.hidden = true;
    content.appendChild(grid);
    section.appendChild(heading);
    section.appendChild(content);
    themeOptions.appendChild(section);
  });

  themeOptions.querySelectorAll(".theme-option").forEach(btn => {
    btn.addEventListener("click", () => {
      applyTheme(btn.dataset.theme);
    });
  });

}

function initThemeControls() {
  const menuBtn = document.getElementById("themeMenuBtn");
  menuBtn?.addEventListener("click", () => {
    showSettingsView();
  });

  renderThemeOptions();

  const themeMenuKeyInput = document.getElementById("themeMenuKeyInput");
  const themeMenuKeyApplyBtn = document.getElementById("themeMenuKeyApplyBtn");
  const themeMenuKeyStatus = document.getElementById("themeMenuKeyStatus");
  const setThemeMenuKeyStatus = message => {
    if (!themeMenuKeyStatus) return;
    themeMenuKeyStatus.textContent = message;
  };

  themeMenuKeyApplyBtn?.addEventListener("click", async () => {
    const candidate = (themeMenuKeyInput?.value || "").trim();
    if (!candidate) {
      setThemeMenuKeyStatus("Paste a theme key to import.");
      return;
    }
    const parsed = parseThemeKey(candidate);
    if (!parsed) {
      setThemeMenuKeyStatus("That key doesn't look valid.");
      return;
    }
    const imported = await upsertCustomTheme(parsed);
    renderThemeOptions();
    refreshThemeSelects();
    applyTheme(imported.id);
    if (themeMenuKeyInput) themeMenuKeyInput.value = "";
    setThemeMenuKeyStatus(`Imported "${imported.name}".`);
  });

  const openThemeBuilderBtn = document.getElementById("openThemeBuilderBtn");
  openThemeBuilderBtn?.addEventListener("click", () => {
    showThemeBuilderView();
  });

  const surprisePartyBtn = document.getElementById("surprisePartyBtn");
  surprisePartyBtn?.addEventListener("click", () => {
    triggerSurprisePartyThemeChange();
  });
}

const cleanupFolderPickBtn = document.getElementById("cleanupFolderPickBtn");
const cleanupFolderStatus = document.getElementById("cleanupFolderStatus");
const trialFilesFolderPickBtn = document.getElementById("trialFilesFolderPickBtn");
const trialFilesFolderRefreshBtn = document.getElementById("trialFilesFolderRefreshBtn");
const trialFilesFolderStatus = document.getElementById("trialFilesFolderStatus");
const trialFilesStatus = document.getElementById("trialFilesStatus");
const renameWorkflowStatusBar = document.getElementById("renameWorkflowStatusBar");
const renameWorkflowStatusFill = document.getElementById("renameWorkflowStatusFill");
const renameWorkflowStatusText = document.getElementById("renameWorkflowStatusText");
const logFolderPickButtons = document.querySelectorAll("[data-log-folder-pick]");
const logFolderStatusEls = document.querySelectorAll("[data-log-folder-status]");

function openCleanupHandleDb() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB not available."));
      return;
    }
    const request = indexedDB.open(CHECKIN_CLEANUP_HANDLE_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CHECKIN_CLEANUP_HANDLE_STORE)) {
        db.createObjectStore(CHECKIN_CLEANUP_HANDLE_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveCleanupFolderHandle(handle) {
  const db = await openCleanupHandleDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CHECKIN_CLEANUP_HANDLE_STORE, "readwrite");
    tx.objectStore(CHECKIN_CLEANUP_HANDLE_STORE).put(handle, CHECKIN_CLEANUP_HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadCleanupFolderHandle() {
  const db = await openCleanupHandleDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CHECKIN_CLEANUP_HANDLE_STORE, "readonly");
    const req = tx.objectStore(CHECKIN_CLEANUP_HANDLE_STORE).get(CHECKIN_CLEANUP_HANDLE_KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

function getDeviceLookupHandleKey(targetKey) {
  return `${DEVICE_LOOKUP_HANDLE_KEY_PREFIX}:${targetKey}`;
}

async function saveDeviceLookupWorkbookHandle(targetKey, handle) {
  const db = await openCleanupHandleDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CHECKIN_CLEANUP_HANDLE_STORE, "readwrite");
    tx.objectStore(CHECKIN_CLEANUP_HANDLE_STORE).put(handle, getDeviceLookupHandleKey(targetKey));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadDeviceLookupWorkbookHandle(targetKey) {
  const db = await openCleanupHandleDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CHECKIN_CLEANUP_HANDLE_STORE, "readonly");
    const req = tx.objectStore(CHECKIN_CLEANUP_HANDLE_STORE).get(getDeviceLookupHandleKey(targetKey));
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

function updateCleanupFolderStatus(name) {
  if (!cleanupFolderStatus) return;
  if (name) {
    cleanupFolderStatus.textContent = `Clearing "${name}" when starting another check-in.`;
    return;
  }
  cleanupFolderStatus.textContent = "No cleanup folder selected yet.";
}

async function setCleanupFolderName(name) {
  await setStoredValue(CHECKIN_CLEANUP_FOLDER_NAME_STORAGE_KEY, name || "");
  updateCleanupFolderStatus(name);
}

async function getCleanupFolderName() {
  return await getStoredValue(CHECKIN_CLEANUP_FOLDER_NAME_STORAGE_KEY);
}

async function verifyFolderPermission(handle, mode = "read") {
  if (!handle) return false;
  if (typeof handle.queryPermission !== "function") return true;
  const options = { mode };
  let permission = await handle.queryPermission(options);
  if (permission === "granted") return true;
  permission = await handle.requestPermission(options);
  return permission === "granted";
}

async function verifyFilePermission(handle, mode = "read") {
  if (!handle) return false;
  if (typeof handle.queryPermission !== "function") return true;
  const options = { mode };
  let permission = await handle.queryPermission(options);
  if (permission === "granted") return true;
  permission = await handle.requestPermission(options);
  return permission === "granted";
}

async function pickCleanupFolder() {
  if (typeof window.showDirectoryPicker !== "function") {
    alert("Folder picking isn't supported in this browser.");
    return null;
  }
  let handle;
  try {
    handle = await window.showDirectoryPicker({ mode: "readwrite" });
  } catch {
    return null;
  }
  if (!handle) return null;
  await saveCleanupFolderHandle(handle);
  await setCleanupFolderName(handle.name || "Selected folder");
  return handle;
}

async function clearCleanupFolderContents(handle) {
  if (!handle) return false;
  for await (const [name, entry] of handle.entries()) {
    if (entry.kind === "directory") {
      await handle.removeEntry(name, { recursive: true });
    } else {
      await handle.removeEntry(name);
    }
  }
  return true;
}

async function runCleanupFolderFlow({ promptIfMissing = false } = {}) {
  let handle = await loadCleanupFolderHandle().catch(() => null);
  if (!handle && promptIfMissing) {
    handle = await pickCleanupFolder();
  }
  if (!handle) return false;
  const permitted = await verifyFolderPermission(handle, "readwrite");
  if (!permitted) return false;
  await clearCleanupFolderContents(handle);
  return true;
}

async function initCleanupFolderSetting() {
  if (!cleanupFolderPickBtn) return;
  const storedName = await getCleanupFolderName();
  updateCleanupFolderStatus(storedName);
  cleanupFolderPickBtn.addEventListener("click", async () => {
    await pickCleanupFolder();
  });
}

function updateLogFolderStatus(name, messageOverride = null) {
  if (!logFolderStatusEls.length) return;
  const message = messageOverride
    || (name ? `Saving logs to "${name}".` : "No log folder selected yet.");
  logFolderStatusEls.forEach(el => {
    el.textContent = message;
  });
}

async function setLogFolderName(name) {
  await setStoredValue(LOGS_FOLDER_NAME_STORAGE_KEY, name || "");
  updateLogFolderStatus(name);
}

async function getLogFolderName() {
  return await getStoredValue(LOGS_FOLDER_NAME_STORAGE_KEY);
}

async function saveLogFolderHandle(handle) {
  const db = await openCleanupHandleDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CHECKIN_CLEANUP_HANDLE_STORE, "readwrite");
    tx.objectStore(CHECKIN_CLEANUP_HANDLE_STORE).put(handle, LOGS_HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadLogFolderHandle() {
  const db = await openCleanupHandleDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CHECKIN_CLEANUP_HANDLE_STORE, "readonly");
    const req = tx.objectStore(CHECKIN_CLEANUP_HANDLE_STORE).get(LOGS_HANDLE_KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function pickLogFolder() {
  if (typeof window.showDirectoryPicker !== "function") {
    alert("Folder picking isn't supported in this browser.");
    return null;
  }
  try {
    await chrome.tabs.create({ url: LOGS_SHAREPOINT_FOLDER_URL, active: false });
  } catch {
    // Non-blocking convenience only.
  }
  let handle;
  try {
    handle = await window.showDirectoryPicker({ mode: "readwrite" });
  } catch {
    return null;
  }
  if (!handle) return null;
  await saveLogFolderHandle(handle);
  await setLogFolderName(handle.name || "Selected folder");
  return handle;
}

async function initLogFolderSetting() {
  if (!logFolderPickButtons.length) return;
  const storedName = await getLogFolderName();
  updateLogFolderStatus(
    storedName,
    storedName
      ? null
      : "No log folder selected yet. Sidekick will open the SharePoint Logs folder before you choose it."
  );
  logFolderPickButtons.forEach(button => {
    button.addEventListener("click", async () => {
      await pickLogFolder();
    });
  });
}

function updateTrialFilesFolderStatus(name, messageOverride = null) {
  if (!trialFilesFolderStatus) return;
  if (messageOverride) {
    trialFilesFolderStatus.textContent = messageOverride;
    return;
  }
  if (name) {
    trialFilesFolderStatus.textContent = `Using "${name}" for saved zips.`;
    return;
  }
  trialFilesFolderStatus.textContent = "No saved zips folder selected yet.";
}

async function setTrialFilesFolderName(name) {
  await setStoredValue(TRIAL_FILES_FOLDER_NAME_STORAGE_KEY, name || "");
  updateTrialFilesFolderStatus(name);
}

async function getTrialFilesFolderName() {
  return await getStoredValue(TRIAL_FILES_FOLDER_NAME_STORAGE_KEY);
}

async function saveTrialFilesFolderHandle(handle) {
  const db = await openCleanupHandleDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CHECKIN_CLEANUP_HANDLE_STORE, "readwrite");
    tx.objectStore(CHECKIN_CLEANUP_HANDLE_STORE).put(handle, TRIAL_FILES_HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadTrialFilesFolderHandle() {
  const db = await openCleanupHandleDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CHECKIN_CLEANUP_HANDLE_STORE, "readonly");
    const req = tx.objectStore(CHECKIN_CLEANUP_HANDLE_STORE).get(TRIAL_FILES_HANDLE_KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function getTrialFilesFromFolder(handle) {
  const files = [];
  for await (const entry of handle.values()) {
    if (entry.kind !== "file") continue;
    const file = await entry.getFile();
    files.push(file);
  }
  return files.sort((a, b) => a.name.localeCompare(b.name));
}

async function refreshTrialFilesFromFolder({ promptIfMissing = false, handleOverride = null } = {}) {
  let handle = handleOverride ?? await loadTrialFilesFolderHandle().catch(() => null);
  if (!handle && promptIfMissing) {
    handle = await pickTrialFilesFolder();
  }
  if (!handle) return false;
  const permitted = await verifyFolderPermission(handle, "read");
  const storedName = await getTrialFilesFolderName();
  if (!permitted) {
    updateTrialFilesFolderStatus(storedName, "Folder access blocked. Click Refresh to re-authorize.");
    return false;
  }
  const files = await getTrialFilesFromFolder(handle);
  updateTrialFilesStatus(storedName
    ? `Using "${storedName}" (${files.length} file(s)) as the saved zips folder.`
    : `${files.length} file(s) found in saved zips folder.`);
  return true;
}

async function pickTrialFilesFolder() {
  if (typeof window.showDirectoryPicker !== "function") {
    alert("Folder picking isn't supported in this browser.");
    return null;
  }
  let handle;
  try {
    handle = await window.showDirectoryPicker({ mode: "readwrite" });
  } catch {
    return null;
  }
  if (!handle) return null;
  await saveTrialFilesFolderHandle(handle);
  await setTrialFilesFolderName(handle.name || "Selected folder");
  await refreshTrialFilesFromFolder({ handleOverride: handle });
  return handle;
}

async function initTrialFilesFolderSetting() {
  const storedName = await getTrialFilesFolderName();
  updateTrialFilesFolderStatus(storedName);
  trialFilesFolderPickBtn?.addEventListener("click", async () => {
    await pickTrialFilesFolder();
  });
  trialFilesFolderRefreshBtn?.addEventListener("click", async () => {
    await refreshTrialFilesFromFolder({ promptIfMissing: true });
  });
}

async function initThemeSystem() {
  await loadCustomThemesFromStorage();
  initThemeControls();
  initChaosControls();
  loadThemePreference();
  initOnboardingForm();
  await resetLandingLayoutOverrides();
  await initThemeBuilder();
}

void initThemeSystem();
initOutlookSetupFlow();
initDailyCounterSetting();
initLandingTooltipsSetting();
initCrmCustomCssThemeSetting();
initWeeklyAverageSetting();
initPrePrepSidekickSetting();
initCleanupFolderSetting();
initLogFolderSetting();
initTrialFilesFolderSetting();

function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || "";
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text || "";
}

function formatDateForFilename(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${month}.${day}.${year}`;
}

function formatLogDate(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${month}/${day}/${year}`;
}

function formatLogTime(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function formatLogTimestampForFilename(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${formatDateForFilename(date)} ${hours}-${minutes}-${seconds}`;
}

function sanitizeLogLabel(name) {
  return (name || "").replace(/[\\/:*?"<>|]/g, "").trim();
}

function formatActionLogLabel(action) {
  const cleaned = sanitizeLogLabel(action || "");
  if (cleaned.toLowerCase() === "checkin") return "Check-in";
  return cleaned || "Log";
}

function buildLogUserName(profile) {
  const first = (profile?.firstName || "").trim();
  const last = (profile?.lastName || "").trim();
  const combined = `${first} ${last}`.trim();
  return sanitizeLogLabel(combined || first || "User");
}

async function getLogBaseHandle({ promptIfMissing = false } = {}) {
  let handle = await loadLogFolderHandle().catch(() => null);
  if (!handle && promptIfMissing) {
    handle = await pickLogFolder();
  }
  if (!handle) return null;
  const permitted = await verifyFolderPermission(handle, "readwrite");
  if (!permitted) {
    const storedName = await getLogFolderName();
    updateLogFolderStatus(storedName, "Folder access blocked. Click Choose log folder to re-authorize.");
    return null;
  }
  return handle;
}

async function writeLogEntry({ action, outcome }) {
  const baseHandle = await getLogBaseHandle({ promptIfMissing: true });
  if (!baseHandle) return false;
  const profile = await getUserProfile();
  const username = buildLogUserName(profile);
  const userFolder = await baseHandle.getDirectoryHandle(`${username} Logs`, { create: true });
  const now = new Date();
  const actionLabel = formatActionLogLabel(action);
  const filename = `${username} ${actionLabel} logs.txt`;
  const fileHandle = await userFolder.getFileHandle(filename, { create: true });
  const outcomeText = outcome && outcome.trim() ? outcome : "Completed successfully";
  const line = `${username}--${formatLogDate(now)}--${formatLogTime(now)}--${outcomeText}`;
  const existingFile = await fileHandle.getFile();
  const writable = await fileHandle.createWritable({ keepExistingData: true });
  await writable.seek(existingFile.size);
  await writable.write(`${line}\n`);
  await writable.close();
  return true;
}

async function logTaskOutcome(action, outcome) {
  try {
    await writeLogEntry({ action, outcome });
  } catch {
    // Logging should never block the user flow.
  }
}

async function writeLtlUpdateLogEntry(outcome) {
  const baseHandle = await getLogBaseHandle({ promptIfMissing: true });
  if (!baseHandle) return false;
  const profile = await getUserProfile();
  const username = buildLogUserName(profile);
  const userFolder = await baseHandle.getDirectoryHandle(`${username} Logs`, { create: true });
  const filename = "LTL Update Logs.txt";
  const fileHandle = await userFolder.getFileHandle(filename, { create: true });
  const outcomeText = outcome && outcome.trim() ? outcome : "LTL Update Completed successfully";
  const now = new Date();
  const line = `${username}--${formatLogDate(now)}--${outcomeText}`;
  const existingFile = await fileHandle.getFile();
  const writable = await fileHandle.createWritable({ keepExistingData: true });
  await writable.seek(existingFile.size);
  await writable.write(`${line}\n`);
  await writable.close();
  return true;
}

async function logLtlUpdateOutcome(outcome) {
  try {
    await writeLtlUpdateLogEntry(outcome);
  } catch {
    // Logging should never block the user flow.
  }
}

const UNSAFE_NAME_REGEX = /\s?(\*\d{5}|\*.*?\*|\(.*?\)|\b\d{5}\b|"[^"]*")/g;

function sanitizeName(name) {
  return (name || "").replace(UNSAFE_NAME_REGEX, "").trim();
}

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

function setStoredValue(key, value) {
  return new Promise(resolve => {
    if (chrome?.storage?.local) {
      chrome.storage.local.set({ [key]: value }, () => resolve());
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
    resolve();
  });
}

function removeStoredValue(key) {
  return new Promise(resolve => {
    if (chrome?.storage?.local) {
      chrome.storage.local.remove(key, () => resolve());
      return;
    }
    localStorage.removeItem(key);
    resolve();
  });
}

async function getUserProfile() {
  return await getStoredValue(USER_PROFILE_STORAGE_KEY);
}

async function saveUserProfile(profile) {
  await setStoredValue(USER_PROFILE_STORAGE_KEY, profile);
}

async function getUserMascot() {
  return await getStoredValue(USER_MASCOT_STORAGE_KEY);
}

async function saveUserMascot(mascotSrc) {
  await setStoredValue(USER_MASCOT_STORAGE_KEY, mascotSrc);
}

function normalizeMascotSize(size, fallback = DEFAULT_MASCOT_SIZE) {
  const value = Number(size);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(MAX_MASCOT_SIZE, Math.max(MIN_MASCOT_SIZE, Math.round(value)));
}

async function getUserMascotSize() {
  return await getStoredValue(USER_MASCOT_SIZE_STORAGE_KEY);
}

async function saveUserMascotSize(size) {
  await setStoredValue(USER_MASCOT_SIZE_STORAGE_KEY, normalizeMascotSize(size));
}

async function getCornerSymoji() {
  return await getStoredValue(CORNER_SYMOJI_STORAGE_KEY);
}

async function saveCornerSymoji(symojiSrc) {
  await setStoredValue(CORNER_SYMOJI_STORAGE_KEY, symojiSrc);
}

function normalizeLandingLayoutOrder(order) {
  const validIds = new Set(LANDING_LAYOUT_ITEMS.map(item => item.id));
  const normalized = [];
  if (Array.isArray(order)) {
    order.forEach(id => {
      if (!validIds.has(id) || normalized.includes(id)) return;
      normalized.push(id);
    });
  }
  LANDING_LAYOUT_ITEMS.forEach(item => {
    if (!normalized.includes(item.id)) {
      normalized.push(item.id);
    }
  });
  return normalized;
}

function getDefaultLandingLayoutOrder() {
  return normalizeLandingLayoutOrder();
}

async function getLandingLayoutOrder() {
  const stored = await getStoredValue(LANDING_LAYOUT_STORAGE_KEY);
  return normalizeLandingLayoutOrder(stored);
}

async function setLandingLayoutOrder(order) {
  await setStoredValue(LANDING_LAYOUT_STORAGE_KEY, normalizeLandingLayoutOrder(order));
}

function normalizeLandingLayoutPositions(positions) {
  if (!positions || typeof positions !== "object") return {};
  return LANDING_LAYOUT_ITEMS.reduce((acc, item) => {
    const pos = positions[item.id];
    if (!pos || typeof pos !== "object") return acc;
    const x = Number(pos.x);
    const y = Number(pos.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return acc;
    acc[item.id] = {
      x: clampNumber(x, 0, 100),
      y: clampNumber(y, 0, 100)
    };
    return acc;
  }, {});
}

async function getLandingLayoutPositions() {
  const stored = await getStoredValue(LANDING_LAYOUT_POSITIONS_STORAGE_KEY);
  return normalizeLandingLayoutPositions(stored);
}

async function setLandingLayoutPositions(positions) {
  await setStoredValue(LANDING_LAYOUT_POSITIONS_STORAGE_KEY, normalizeLandingLayoutPositions(positions));
}

function captureLandingLayoutPositions(container) {
  if (!container) return {};
  const rect = container.getBoundingClientRect();
  if (!rect.width || !rect.height) return {};
  const positions = {};
  container.querySelectorAll("[data-layout-item]").forEach(item => {
    const id = item.dataset.layoutItem;
    if (!id) return;
    const itemRect = item.getBoundingClientRect();
    positions[id] = {
      x: ((itemRect.left - rect.left) / rect.width) * 100,
      y: ((itemRect.top - rect.top) / rect.height) * 100
    };
  });
  return normalizeLandingLayoutPositions(positions);
}

async function getLandingMascotVisible() {
  const stored = await getStoredValue(LANDING_MASCOT_VISIBLE_STORAGE_KEY);
  if (stored === null || typeof stored === "undefined") return true;
  return Boolean(stored);
}

async function setLandingMascotVisible(visible) {
  await setStoredValue(LANDING_MASCOT_VISIBLE_STORAGE_KEY, Boolean(visible));
}

async function getLandingSymojiVisible() {
  const stored = await getStoredValue(LANDING_SYMOJI_VISIBLE_STORAGE_KEY);
  if (stored === null || typeof stored === "undefined") return true;
  return Boolean(stored);
}

async function setLandingSymojiVisible(visible) {
  await setStoredValue(LANDING_SYMOJI_VISIBLE_STORAGE_KEY, Boolean(visible));
}

function applyLandingLayoutToContainer(container, order) {
  if (!container) return;
  const items = new Map();
  container.querySelectorAll("[data-layout-item]").forEach(item => {
    if (item.dataset.layoutItem) {
      items.set(item.dataset.layoutItem, item);
    }
  });
  order.forEach(id => {
    const element = items.get(id);
    if (element) {
      container.appendChild(element);
    }
  });
}

function applyLandingLayoutOrder(order) {
  applyLandingLayoutToContainer(document.getElementById("landingLayout"), order);
}

function applyThemeBuilderLayoutOrder(order) {
  applyLandingLayoutToContainer(document.getElementById("themeBuilderLayout"), order);
}

function applyLandingLayoutPositions(container, positions) {
  if (!container) return;
  const normalized = normalizeLandingLayoutPositions(positions);
  const hasPositions = Object.keys(normalized).length > 0;
  container.classList.toggle("landing-layout--freeform", hasPositions);
  container.querySelectorAll("[data-layout-item]").forEach(item => {
    const id = item.dataset.layoutItem;
    const pos = id ? normalized[id] : null;
    if (pos) {
      item.style.position = "absolute";
      item.style.left = `${pos.x}%`;
      item.style.top = `${pos.y}%`;
    } else {
      item.style.position = "";
      item.style.left = "";
      item.style.top = "";
    }
  });
}

async function resetLandingLayoutOverrides() {
  await Promise.all([
    removeStoredValue(LANDING_LAYOUT_STORAGE_KEY),
    removeStoredValue(LANDING_LAYOUT_POSITIONS_STORAGE_KEY)
  ]);
  const defaultOrder = getDefaultLandingLayoutOrder();
  applyLandingLayoutOrder(defaultOrder);
  applyThemeBuilderLayoutOrder(defaultOrder);
  applyLandingLayoutPositions(document.getElementById("landingLayout"), DEFAULT_LANDING_LAYOUT_POSITIONS);
  applyLandingLayoutPositions(document.getElementById("themeBuilderLayout"), DEFAULT_LANDING_LAYOUT_POSITIONS);
}

async function nudgeLandingLayoutForCollapsible(container, anchorRect, deltaHeight) {
  if (!container || !anchorRect || !deltaHeight) return;
  if (!container.classList.contains("landing-layout--freeform")) return;
  const positions = await getLandingLayoutPositions();
  if (!Object.keys(positions).length) return;
  const containerRect = container.getBoundingClientRect();
  if (!containerRect.height) return;
  const nextPositions = { ...positions };
  container.querySelectorAll("[data-layout-item]").forEach(item => {
    const id = item.dataset.layoutItem;
    const pos = id ? positions[id] : null;
    if (!pos || item.getBoundingClientRect().top < anchorRect.bottom - 1) return;
    const currentYpx = (pos.y / 100) * containerRect.height;
    const nextYpx = currentYpx + deltaHeight;
    nextPositions[id] = {
      x: pos.x,
      y: clampNumber((nextYpx / containerRect.height) * 100, 0, 100)
    };
  });
  await setLandingLayoutPositions(nextPositions);
  applyLandingLayoutPositions(container, nextPositions);
}

function applyElementVisibility(element, visible) {
  if (!element) return;
  element.style.display = visible ? "" : "none";
}

function applyLandingMascotVisibility(visible) {
  applyElementVisibility(document.getElementById("landingMascot"), visible);
}

function applyLandingSymojiVisibility(visible) {
  applyElementVisibility(document.getElementById("landingCornerSymojiBtn"), visible);
}

function applyThemeBuilderMascotVisibility(visible) {
  const preview = document.getElementById("themeBuilderPreview");
  applyElementVisibility(preview?.querySelector('[data-preview-element="mascot"]'), visible);
}

function applyThemeBuilderSymojiVisibility(visible) {
  const preview = document.getElementById("themeBuilderPreview");
  applyElementVisibility(preview?.querySelector('[data-preview-element="symoji"]'), visible);
}

function getRandomAnimeQuote(themeId = activeThemeId) {
  const quotes = getAnimeQuotesForTheme(themeId);
  if (!quotes.length) {
    currentAnimeQuote = "";
    return "";
  }
  const options = quotes.filter(quote => quote !== currentAnimeQuote);
  const pool = options.length ? options : quotes;
  const nextQuote = pool[Math.floor(Math.random() * pool.length)] || "";
  currentAnimeQuote = nextQuote;
  return nextQuote;
}

function renderLandingAnimeQuote(themeId = activeThemeId) {
  const quoteEl = document.getElementById("landingAnimeQuoteText");
  if (!quoteEl) return;
  quoteEl.textContent = getRandomAnimeQuote(themeId);
}

function stopLandingAnimeQuoteCycle() {
  if (!animeQuoteCycleIntervalId) return;
  window.clearInterval(animeQuoteCycleIntervalId);
  animeQuoteCycleIntervalId = null;
}

function updateLandingAnimeQuoteVisibility(themeId = activeThemeId) {
  const section = document.getElementById("landingAnimeQuoteSection");
  const isAnimeTheme = ANIME_THEME_IDS.has(themeId);
  if (section) {
    section.style.display = isAnimeTheme ? "" : "none";
  }

  if (!isAnimeTheme) {
    stopLandingAnimeQuoteCycle();
    currentAnimeQuote = "";
    const quoteEl = document.getElementById("landingAnimeQuoteText");
    if (quoteEl) quoteEl.textContent = "";
    return;
  }

  stopLandingAnimeQuoteCycle();
  renderLandingAnimeQuote(themeId);
  animeQuoteCycleIntervalId = window.setInterval(() => {
    renderLandingAnimeQuote(themeId);
  }, 60000);
}

function updateLandingGreeting(profile) {
  const firstName = (profile?.firstName || "").trim();
  const greeting = firstName ? `Welcome back, ${firstName}!` : "Welcome back!";
  setText("landingGreeting", greeting);
}

function updateLandingMascot(mascotSrc) {
  const image = document.getElementById("landingMascot");
  if (image) {
    image.src = mascotSrc || DEFAULT_MASCOT_SRC;
  }
}

function applyLandingMascotSize(size) {
  const image = document.getElementById("landingMascot");
  if (!image) return;
  if (size === null || size === undefined) {
    image.style.width = "";
    return;
  }
  const normalized = normalizeMascotSize(size);
  image.style.width = `${normalized}px`;
}

function updateMascotPreview(mascotSrc) {
  const image = document.getElementById("userMascotPreview");
  if (image) {
    image.src = mascotSrc || DEFAULT_MASCOT_SRC;
  }
}

function applyMascotPreviewSize(size) {
  const image = document.getElementById("userMascotPreview");
  if (image) {
    const normalized = normalizeMascotSize(size);
    image.style.width = `${normalized}px`;
    image.style.height = `${normalized}px`;
  }
  const output = document.getElementById("onboardingMascotSizeValue");
  if (output) {
    const normalized = normalizeMascotSize(size);
    output.textContent = `${normalized}px`;
  }
  const slider = document.getElementById("onboardingMascotSize");
  if (slider) {
    const normalized = normalizeMascotSize(size);
    slider.value = String(normalized);
  }
}

function updateCornerSymoji(symojiSrc) {
  const image = document.getElementById("landingCornerSymoji");
  if (image) {
    image.src = symojiSrc || DEFAULT_CORNER_SYMOJI_SRC;
  }
}

function updateLandingVersion() {
  const manifest = chrome?.runtime?.getManifest?.();
  const version = manifest?.version;
  setText("landingVersion", version ? `Version ${version}` : "");
}

const DAILY_COUNTER_WEIGHTS = {
  checkins: 0.7058,
  preps: 1.6012,
  qas: 0.6930,
  custom: 1
};

function getDefaultDailyCounters() {
  return {
    checkins: 0,
    qas: 0,
    preps: 0,
    custom: 0
  };
}

function getDailyCounterWeight(key) {
  return DAILY_COUNTER_WEIGHTS[key] ?? 1;
}

function getDailyCountersTotal(counters) {
  return Object.entries(counters || {}).reduce((total, [key, value]) => {
    return total + ((Number(value) || 0) * getDailyCounterWeight(key));
  }, 0);
}

function normalizeCounterTotal(total) {
  const rounded = Number((Number(total) || 0).toFixed(4));
  return Object.is(rounded, -0) ? 0 : rounded;
}

function formatCounterTotal(total) {
  return String(normalizeCounterTotal(total));
}

function normalizeCustomCounterLabel(label) {
  const trimmed = (label || "").trim();
  return trimmed || DEFAULT_CUSTOM_COUNTER_LABEL;
}

async function getDailyCounterEnabled() {
  const stored = await getStoredValue(DAILY_COUNTER_ENABLED_STORAGE_KEY);
  if (stored === null || typeof stored === "undefined") return true;
  return Boolean(stored);
}

async function setDailyCounterEnabled(enabled) {
  await setStoredValue(DAILY_COUNTER_ENABLED_STORAGE_KEY, Boolean(enabled));
}

async function getDailyCustomCounterEnabled() {
  const stored = await getStoredValue(DAILY_CUSTOM_COUNTER_ENABLED_STORAGE_KEY);
  if (stored === null || typeof stored === "undefined") return false;
  return Boolean(stored);
}

async function setDailyCustomCounterEnabled(enabled) {
  await setStoredValue(DAILY_CUSTOM_COUNTER_ENABLED_STORAGE_KEY, Boolean(enabled));
}

async function getDailyCustomCounterLabel() {
  const stored = await getStoredValue(DAILY_CUSTOM_COUNTER_LABEL_STORAGE_KEY);
  return normalizeCustomCounterLabel(stored);
}

async function setDailyCustomCounterLabel(label) {
  await setStoredValue(DAILY_CUSTOM_COUNTER_LABEL_STORAGE_KEY, normalizeCustomCounterLabel(label));
}

async function getWeeklyCounterEnabled() {
  const stored = await getStoredValue(WEEKLY_COUNTER_ENABLED_STORAGE_KEY);
  if (stored === null || typeof stored === "undefined") return true;
  return Boolean(stored);
}

async function setWeeklyCounterEnabled(enabled) {
  await setStoredValue(WEEKLY_COUNTER_ENABLED_STORAGE_KEY, Boolean(enabled));
}

async function getWeeklyAverageEnabled() {
  const stored = await getStoredValue(WEEKLY_AVERAGE_ENABLED_STORAGE_KEY);
  if (stored === null || typeof stored === "undefined") return false;
  return Boolean(stored);
}

async function setWeeklyAverageEnabled(enabled) {
  await setStoredValue(WEEKLY_AVERAGE_ENABLED_STORAGE_KEY, Boolean(enabled));
}

function normalizeWeeklyAverageDays(days) {
  const parsed = Number.parseInt(days, 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.min(7, Math.max(0, parsed));
}

async function getWeeklyAverageDaysWorked() {
  const stored = await getStoredValue(WEEKLY_AVERAGE_DAYS_STORAGE_KEY);
  return normalizeWeeklyAverageDays(stored);
}

async function setWeeklyAverageDaysWorked(days) {
  await setStoredValue(WEEKLY_AVERAGE_DAYS_STORAGE_KEY, normalizeWeeklyAverageDays(days));
}

async function getLandingTooltipsEnabled() {
  const stored = await getStoredValue(LANDING_TOOLTIPS_ENABLED_STORAGE_KEY);
  if (stored === null || typeof stored === "undefined") return true;
  return Boolean(stored);
}

async function setLandingTooltipsEnabled(enabled) {
  await setStoredValue(LANDING_TOOLTIPS_ENABLED_STORAGE_KEY, Boolean(enabled));
}

async function getCrmCustomCssThemeEnabled() {
  const stored = await getStoredValue(CRM_CUSTOM_CSS_ENABLED_STORAGE_KEY);
  if (stored === null || typeof stored === "undefined") return false;
  return Boolean(stored);
}

async function setCrmCustomCssThemeEnabled(enabled) {
  await setStoredValue(CRM_CUSTOM_CSS_ENABLED_STORAGE_KEY, Boolean(enabled));
}

function applyLandingTooltipsEnabled(enabled) {
  const landingView = document.getElementById("landingView");
  if (landingView) {
    landingView.classList.toggle("tooltips-enabled", Boolean(enabled));
  }
}

function updateLandingTooltipsToggleState(enabled) {
  ["onboardingTooltipToggle", "settingsTooltipToggle"].forEach(id => {
    const toggle = document.getElementById(id);
    if (toggle) {
      toggle.checked = Boolean(enabled);
    }
  });
}

async function updateLandingTooltipsEnabled() {
  const enabled = await getLandingTooltipsEnabled();
  applyLandingTooltipsEnabled(enabled);
  updateLandingTooltipsToggleState(enabled);
}

async function initLandingTooltipsSetting() {
  const toggle = document.getElementById("settingsTooltipToggle");
  if (!toggle) return;
  toggle.checked = await getLandingTooltipsEnabled();
  toggle.addEventListener("change", async () => {
    const enabled = Boolean(toggle.checked);
    await setLandingTooltipsEnabled(enabled);
    applyLandingTooltipsEnabled(enabled);
    updateLandingTooltipsToggleState(enabled);
  });
}

async function initCrmCustomCssThemeSetting() {
  const toggle = document.getElementById("settingsCrmCustomCssToggle");
  if (!toggle) return;
  toggle.checked = await getCrmCustomCssThemeEnabled();
  toggle.addEventListener("change", async () => {
    await setCrmCustomCssThemeEnabled(Boolean(toggle.checked));
  });
}

async function initWeeklyAverageSetting() {
  const toggle = document.getElementById("settingsWeeklyAverageToggle");
  if (!toggle) return;
  toggle.checked = await getWeeklyAverageEnabled();
  toggle.addEventListener("change", async () => {
    await setWeeklyAverageEnabled(Boolean(toggle.checked));
    await updateWeeklyAverageVisibility();
  });
}

async function getPrePrepSidekickEnabled() {
  const stored = await getStoredValue(PRE_PREP_SIDEKICK_ENABLED_STORAGE_KEY);
  if (stored === null || typeof stored === "undefined") return false;
  return Boolean(stored);
}

async function setPrePrepSidekickEnabled(enabled) {
  await setStoredValue(PRE_PREP_SIDEKICK_ENABLED_STORAGE_KEY, Boolean(enabled));
}

function applyPrePrepSidekickEnabled(enabled) {
  const section = document.getElementById("prePrepToolsSection");
  if (section) {
    section.style.display = enabled ? "block" : "none";
  }
}

function updatePrePrepSettingsState(enabled, message = "") {
  const toggle = document.getElementById("settingsPrePrepToggle");
  const passcode = document.getElementById("settingsPrePrepPasscode");
  const status = document.getElementById("settingsPrePrepStatus");
  if (toggle) toggle.checked = Boolean(enabled);
  if (passcode) {
    passcode.value = "";
    passcode.disabled = Boolean(enabled);
    passcode.placeholder = enabled ? "Enabled" : "Enter passcode";
  }
  if (status) {
    status.textContent = message || (enabled ? "Pre-prep Sidekick is enabled." : "Enter the passcode to enable Pre-prep Sidekick.");
  }
}

async function refreshPrePrepSidekickEnabled() {
  const enabled = await getPrePrepSidekickEnabled();
  applyPrePrepSidekickEnabled(enabled);
  updatePrePrepSettingsState(enabled);
}

async function initPrePrepSidekickSetting() {
  const toggle = document.getElementById("settingsPrePrepToggle");
  const passcode = document.getElementById("settingsPrePrepPasscode");
  if (!toggle) return;

  const enabled = await getPrePrepSidekickEnabled();
  applyPrePrepSidekickEnabled(enabled);
  updatePrePrepSettingsState(enabled);

  toggle.addEventListener("change", async () => {
    if (!toggle.checked) {
      await setPrePrepSidekickEnabled(false);
      applyPrePrepSidekickEnabled(false);
      updatePrePrepSettingsState(false, "Pre-prep Sidekick is disabled.");
      return;
    }

    if ((passcode?.value || "") !== PRE_PREP_SIDEKICK_PASSCODE) {
      await setPrePrepSidekickEnabled(false);
      applyPrePrepSidekickEnabled(false);
      updatePrePrepSettingsState(false, "Incorrect passcode. Pre-prep Sidekick was not enabled.");
      passcode?.focus();
      return;
    }

    await setPrePrepSidekickEnabled(true);
    applyPrePrepSidekickEnabled(true);
    updatePrePrepSettingsState(true, "Pre-prep Sidekick is enabled and will stay enabled on this browser.");
  });

  passcode?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      toggle.checked = true;
      toggle.dispatchEvent(new Event("change"));
    }
  });
}

async function getDailyCounterCollapsed() {
  const stored = await getStoredValue(DAILY_COUNTER_COLLAPSED_STORAGE_KEY);
  return Boolean(stored);
}

async function setDailyCounterCollapsed(collapsed) {
  await setStoredValue(DAILY_COUNTER_COLLAPSED_STORAGE_KEY, Boolean(collapsed));
}

async function getWeeklyCounterCollapsed() {
  const stored = await getStoredValue(WEEKLY_COUNTER_COLLAPSED_STORAGE_KEY);
  return Boolean(stored);
}

async function setWeeklyCounterCollapsed(collapsed) {
  await setStoredValue(WEEKLY_COUNTER_COLLAPSED_STORAGE_KEY, Boolean(collapsed));
}

async function getWeeklyCounterTotal() {
  const stored = await getStoredValue(WEEKLY_COUNTER_STORAGE_KEY);
  return Number(stored) || 0;
}

async function setWeeklyCounterTotal(total) {
  await setStoredValue(WEEKLY_COUNTER_STORAGE_KEY, normalizeCounterTotal(Math.max(0, Number(total) || 0)));
}

async function getDailyCounters() {
  const stored = await getStoredValue(DAILY_COUNTER_STORAGE_KEY);
  return {
    ...getDefaultDailyCounters(),
    ...(stored || {})
  };
}

async function setDailyCounters(counters) {
  await setStoredValue(DAILY_COUNTER_STORAGE_KEY, counters);
}

function updateDailyCounterDisplay(counters) {
  setText("dailyCheckinsCount", String(counters.checkins ?? 0));
  setText("dailyQasCount", String(counters.qas ?? 0));
  setText("dailyPrepsCount", String(counters.preps ?? 0));
  setText("dailyCustomCount", String(counters.custom ?? 0));
}

async function updateWeeklyAverageDisplay(total) {
  const days = await getWeeklyAverageDaysWorked();
  const input = document.getElementById("weeklyDaysWorkedInput");
  if (input && document.activeElement !== input) {
    input.value = days ? String(days) : "";
  }
  const average = days > 0 ? normalizeCounterTotal((Number(total) || 0) / days) : 0;
  setText("weeklyAverageCount", formatCounterTotal(average));
}

function updateWeeklyCounterDisplay(total) {
  setText("weeklyTotalCount", formatCounterTotal(total ?? 0));
  void updateWeeklyAverageDisplay(total ?? 0);
}

function applyCounterCollapseState({ toggleId, contentId }, collapsed) {
  const toggle = document.getElementById(toggleId);
  const content = document.getElementById(contentId);
  if (!toggle || !content) return;
  toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
  const label = toggle.querySelector(".daily-counter__toggle-text");
  if (label) {
    label.textContent = collapsed ? "Show" : "Hide";
  }
  content.hidden = collapsed;
}

async function updateDailyCounterCollapseState() {
  const collapsed = await getDailyCounterCollapsed();
  applyCounterCollapseState(
    { toggleId: "toggleDailyCounterBtn", contentId: "dailyCounterContent" },
    collapsed
  );
  return collapsed;
}

async function updateWeeklyCounterCollapseState() {
  const collapsed = await getWeeklyCounterCollapsed();
  applyCounterCollapseState(
    { toggleId: "toggleWeeklyCounterBtn", contentId: "weeklyCounterContent" },
    collapsed
  );
  return collapsed;
}

async function refreshDailyCounters() {
  const counters = await getDailyCounters();
  updateDailyCounterDisplay(counters);
  return counters;
}

async function refreshWeeklyCounters() {
  const total = await getWeeklyCounterTotal();
  updateWeeklyCounterDisplay(total);
  return total;
}

async function updateDailyCounterVisibility() {
  const enabled = await getDailyCounterEnabled();
  const section = document.getElementById("dailyCounterSection");
  if (section) section.style.display = enabled ? "" : "none";
  if (enabled) {
    await refreshDailyCounters();
  }
  return enabled;
}

function updateDailyCustomLabel(label) {
  setText("dailyCustomLabel", normalizeCustomCounterLabel(label));
}

async function updateDailyCustomCounterSettings() {
  const [enabled, label] = await Promise.all([
    getDailyCustomCounterEnabled(),
    getDailyCustomCounterLabel()
  ]);
  const item = document.getElementById("dailyCustomCounterItem");
  if (item) item.style.display = enabled ? "" : "none";
  updateDailyCustomLabel(label);
  return enabled;
}

async function updateWeeklyAverageVisibility() {
  const enabled = await getWeeklyAverageEnabled();
  const item = document.getElementById("weeklyAverageItem");
  if (item) item.style.display = enabled ? "" : "none";
  if (enabled) {
    await updateWeeklyAverageDisplay(await getWeeklyCounterTotal());
  }
  const toggle = document.getElementById("settingsWeeklyAverageToggle");
  if (toggle) toggle.checked = enabled;
  return enabled;
}

async function updateWeeklyCounterVisibility() {
  const enabled = await getWeeklyCounterEnabled();
  const section = document.getElementById("weeklyCounterSection");
  if (section) section.style.display = enabled ? "" : "none";
  if (enabled) {
    await refreshWeeklyCounters();
    await updateWeeklyAverageVisibility();
  }
  return enabled;
}

async function adjustWeeklyCounterByDelta(delta) {
  if (!delta) {
    return await refreshWeeklyCounters();
  }
  const current = await getWeeklyCounterTotal();
  const nextTotal = normalizeCounterTotal(Math.max(0, current + delta));
  await setWeeklyCounterTotal(nextTotal);
  updateWeeklyCounterDisplay(nextTotal);
  return nextTotal;
}

async function incrementDailyCounter(key) {
  const counters = await getDailyCounters();
  const previousTotal = getDailyCountersTotal(counters);
  const nextValue = (counters[key] ?? 0) + 1;
  const updated = { ...counters, [key]: nextValue };
  await setDailyCounters(updated);
  updateDailyCounterDisplay(updated);
  const nextTotal = getDailyCountersTotal(updated);
  await adjustWeeklyCounterByDelta(normalizeCounterTotal(nextTotal - previousTotal));
  return updated;
}

async function adjustDailyCounter(key, delta) {
  const counters = await getDailyCounters();
  const previousTotal = getDailyCountersTotal(counters);
  const current = counters[key] ?? 0;
  const nextValue = Math.max(0, current + delta);
  const updated = { ...counters, [key]: nextValue };
  await setDailyCounters(updated);
  updateDailyCounterDisplay(updated);
  const nextTotal = getDailyCountersTotal(updated);
  await adjustWeeklyCounterByDelta(normalizeCounterTotal(nextTotal - previousTotal));
  return updated;
}

async function clearDailyCounters() {
  const reset = getDefaultDailyCounters();
  await setDailyCounters(reset);
  updateDailyCounterDisplay(reset);
}

async function clearWeeklyCounters() {
  await setWeeklyCounterTotal(0);
  updateWeeklyCounterDisplay(0);
}

async function refreshLandingView() {
  const profile = await getUserProfile();
  updateLandingGreeting(profile);
  const mascot = await getUserMascot();
  updateLandingMascot(mascot);
  const mascotSize = await getUserMascotSize();
  applyLandingMascotSize(mascotSize);
  const cornerSymoji = await getCornerSymoji();
  updateCornerSymoji(cornerSymoji);
  const [mascotVisible, symojiVisible] = await Promise.all([
    getLandingMascotVisible(),
    getLandingSymojiVisible()
  ]);
  applyLandingLayoutOrder(getDefaultLandingLayoutOrder());
  applyLandingLayoutPositions(document.getElementById("landingLayout"), DEFAULT_LANDING_LAYOUT_POSITIONS);
  applyLandingMascotVisibility(mascotVisible);
  applyLandingSymojiVisibility(symojiVisible);
  updateLandingVersion();
  updateLandingAnimeQuoteVisibility(activeThemeId);
  await updateDailyCounterVisibility();
  await updateDailyCustomCounterSettings();
  await updateWeeklyCounterVisibility();
  await updateDailyCounterCollapseState();
  await updateWeeklyCounterCollapseState();
  await updateLandingTooltipsEnabled();
  await refreshPrePrepSidekickEnabled();
}

/* ---------------- Tab + CRM data fetch ---------------- */

async function getActiveCrmTab() {
  const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
  return active || null;
}

function isCrmUrl(url) {
  if (typeof url !== "string") return false;
  return CRM_ORIGINS.some(origin => url === origin || url.startsWith(`${origin}/`));
}

async function getActiveCrmTabId() {
  const tab = await getActiveCrmTab();
  if (tab?.id && isCrmUrl(tab.url)) return tab.id;

  const tabs = await chrome.tabs.query({
    url: CRM_TAB_URL_PATTERNS
  });
  return tabs?.[0]?.id || null;
}

function countClientDataFields(data) {
  if (!data) return 0;
  return [data.crmId, data.firstName, data.lastName, data.aac].filter(value => `${value || ""}`.trim()).length;
}

function mergeClientData(primary = {}, fallback = {}) {
  return {
    crmId: `${primary.crmId || fallback.crmId || ""}`.trim(),
    firstName: `${primary.firstName || fallback.firstName || ""}`.trim(),
    lastName: `${primary.lastName || fallback.lastName || ""}`.trim(),
    aac: `${primary.aac || fallback.aac || ""}`.trim()
  };
}

function scrapeClientDataFromCrmPage() {
  const unsafeNameRegex = /\s?(\*.*$|\*.*?\*|\(.*?\)|\b\d{5}\b|"[^"]*")/g;
  const sanitize = value => (value || "").replace(unsafeNameRegex, "").trim();
  const getFieldValue = el => {
    if (!el) return "";
    if (el.tagName === "SELECT") {
      return el.options?.[el.selectedIndex]?.textContent?.trim() || el.value?.trim() || "";
    }
    return (el.value || el.textContent || "").trim();
  };
  const getById = id => getFieldValue(document.getElementById(id));
  const getSearchParamValue = (url, names) => {
    const targets = new Set(names.map(name => String(name).toLowerCase()));
    for (const [key, value] of url.searchParams.entries()) {
      if (targets.has(key.toLowerCase()) && value.trim()) return value.trim();
    }
    return "";
  };
  const getCrmId = () => {
    try {
      const url = new URL(window.location.href);
      const fromQuery = getSearchParamValue(url, ["ID", "ClientID", "ClientId", "Client"]);
      if (fromQuery) return fromQuery;
      return url.pathname.match(/(?:EditClient|Client)[^\d]*(\d+)/i)?.[1] || "";
    } catch {
      return "";
    }
  };
  const getBySuffix = suffixes => {
    const fields = Array.from(document.querySelectorAll("input, textarea, select"));
    for (const suffix of suffixes.map(value => String(value).toLowerCase())) {
      const field = fields.find(el =>
        (el.id || "").toLowerCase().endsWith(suffix) ||
        (el.name || "").toLowerCase().endsWith(suffix)
      );
      const value = getFieldValue(field);
      if (value) return value;
    }
    return "";
  };
  const normalizeLabel = value => (value || "").replace(/\s+/g, " ").replace(/[\*:]+$/g, "").trim().toLowerCase();
  const findNearLabel = patterns => {
    for (const label of Array.from(document.querySelectorAll("label, td, th, span, div"))) {
      const text = normalizeLabel(label.textContent);
      if (!text || !patterns.some(pattern => pattern.test(text))) continue;
      if (label.htmlFor) {
        const linked = document.getElementById(label.htmlFor);
        if (linked && ["INPUT", "TEXTAREA", "SELECT"].includes(linked.tagName)) return linked;
      }
      const nested = label.querySelector("input, textarea, select");
      if (nested) return nested;
      const rowField = label.closest("tr")?.querySelector("input, textarea, select");
      if (rowField && !label.contains(rowField)) return rowField;
      let sibling = label.nextElementSibling;
      for (let i = 0; sibling && i < 4; i += 1, sibling = sibling.nextElementSibling) {
        if (["INPUT", "TEXTAREA", "SELECT"].includes(sibling.tagName)) return sibling;
        const siblingField = sibling.querySelector?.("input, textarea, select");
        if (siblingField) return siblingField;
      }
    }
    return null;
  };
  const getByLabel = patterns => getFieldValue(findNearLabel(patterns));

  return {
    crmId: getCrmId(),
    firstName: sanitize(
      getById("ctl00_MainContent_Tabs_tpClient_ClientTabs_tpClientInfo_txtClientFirstName") ||
      getBySuffix(["txtClientFirstName", "ClientFirstName", "FirstName", "txtFirstName"]) ||
      getByLabel([/^(client )?first name$/, /^first$/])
    ),
    lastName: sanitize(
      getById("ctl00_MainContent_Tabs_tpClient_ClientTabs_tpClientInfo_txtClientLastName") ||
      getBySuffix(["txtClientLastName", "ClientLastName", "LastName", "txtLastName"]) ||
      getByLabel([/^(client )?last name$/, /^last$/])
    ),
    aac: getById("ctl00_MainContent_Tabs_tpClient_ClientTabs_tpClientInfo_ddlSalesperson") ||
      getBySuffix(["ddlSalesperson", "Salesperson", "AAC", "Consultant"]) ||
      getByLabel([/^(aac|aac consultant|consultant|salesperson|sales person)$/])
  };
}

async function scrapeClientDataFromTab(tabId) {
  if (!tabId || !chrome?.scripting?.executeScript) return null;

  const runScrape = (target) => chrome.scripting.executeScript({
    target,
    func: scrapeClientDataFromCrmPage
  }).catch(() => null);

  const results = await runScrape({ tabId, allFrames: true }) || await runScrape({ tabId });
  if (!Array.isArray(results)) return null;

  const dataResults = results
    .map(result => result?.result)
    .filter(Boolean)
    .sort((a, b) => countClientDataFields(b) - countClientDataFields(a));

  return dataResults.reduce((merged, data) => mergeClientData(merged, data), {});
}

async function getActiveDafTabId() {
  const tab = await getActiveCrmTab();
  if (tab?.id && isDafFormUrl(tab.url)) return tab.id;

  const tabs = await chrome.tabs.query({
    url: "*://smartboxassistivetnam.sharepoint.com/*listforms.aspx*"
  });
  return tabs?.[0]?.id || null;
}

async function closeCheckinTabs() {
  const [crmTabId, dafTabId] = await Promise.all([
    getActiveCrmTabId(),
    getActiveDafTabId()
  ]);
  const tabIds = Array.from(new Set([crmTabId, dafTabId].filter(Boolean)));
  if (!tabIds.length) return;
  await chrome.tabs.remove(tabIds);
}

async function fetchClientData(tabIdOverride = null) {
  const tabId = tabIdOverride ?? (await getActiveCrmTabId());
  if (!tabId) return null;

  const res = await chrome.tabs.sendMessage(tabId, { type: "GET_CLIENT_DATA" }).catch(() => null);
  const messageData = res?.ok ? res.data : null;
  if (countClientDataFields(messageData) >= 4) return { tabId, data: messageData };

  const scrapedData = await scrapeClientDataFromTab(tabId);
  const data = mergeClientData(messageData, scrapedData);
  if (!countClientDataFields(data)) return null;

  return { tabId, data };
}

function setValueIfPresent(id, value) {
  const safeValue = `${value || ""}`.trim();
  if (safeValue) setValue(id, safeValue);
}

function applyClientData(data) {
  if (!data) return;
  setValueIfPresent("firstName", data.firstName);
  setValueIfPresent("lastName", data.lastName);
  setValueIfPresent("aac", data.aac);
  setValueIfPresent("crmId", data.crmId);
}

function applyGridClientData(data) {
  if (!data) return;
  setValue("gridFirstName", sanitizeName(data.firstName));
  setValue("gridLastName", sanitizeName(data.lastName));
  setValue("gridCrmId", data.crmId);
}

const QA_CLIENT_NAME_DEFAULT_PLACEHOLDER = "Client name will appear here";
const QA_CRM_ID_DEFAULT_PLACEHOLDER = "CRM ID will appear here";

function buildClientFullName(data) {
  return [data?.firstName, data?.lastName].filter(Boolean).join(" ").trim();
}

function updateQaClientName({ name = "", placeholder = QA_CLIENT_NAME_DEFAULT_PLACEHOLDER } = {}) {
  const field = document.getElementById("qaClientNameField");
  const button = document.getElementById("qaClientNameCopyBtn");
  if (field) {
    field.value = name || "";
    field.placeholder = name ? "" : placeholder;
  }
  if (button) {
    button.disabled = !name;
    button.textContent = name ? "Copy name" : "No name";
  }
}

function updateQaCrmIdCopy({ crmId = "", placeholder = QA_CRM_ID_DEFAULT_PLACEHOLDER } = {}) {
  const field = document.getElementById("qaCrmIdField");
  const button = document.getElementById("qaCrmIdCopyBtn");
  if (field) {
    field.value = crmId || "";
    field.placeholder = crmId ? "" : placeholder;
  }
  if (button) {
    button.disabled = !crmId;
    button.textContent = crmId ? "Copy CRM ID" : "No CRM ID";
  }
}

function resetQaCompleteFields() {
  updateQaClientName({ name: "", placeholder: QA_CLIENT_NAME_DEFAULT_PLACEHOLDER });
  updateQaCrmIdCopy({ crmId: "", placeholder: QA_CRM_ID_DEFAULT_PLACEHOLDER });
}

function closeQaFormTab() {
  if (qaFormTabId) {
    chrome.tabs.remove(qaFormTabId, () => {
      qaFormTabId = null;
    });
  }
}

async function waitForTabComplete(tabId, timeoutMs = 15000) {
  if (!tabId) return false;
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab?.status === "complete") return true;
  } catch (error) {
    console.warn("Unable to read tab status.", error);
  }

  return new Promise(resolve => {
    let timeoutId;
    const listener = (updatedTabId, info) => {
      if (updatedTabId !== tabId || info.status !== "complete") return;
      cleanup(true);
    };
    const cleanup = (result) => {
      clearTimeout(timeoutId);
      chrome.tabs.onUpdated.removeListener(listener);
      resolve(result);
    };
    timeoutId = setTimeout(() => cleanup(false), timeoutMs);
    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function loadQaClientNameFromTab(tabId) {
  if (!tabId) {
    updateQaClientName({ name: "", placeholder: "No CRM tab found" });
    return;
  }
  updateQaClientName({ name: "", placeholder: "Fetching client name..." });
  await waitForTabComplete(tabId);
  const res = await fetchClientData(tabId);
  const fullName = buildClientFullName(res?.data);
  updateQaClientName({ name: fullName, placeholder: "No name found" });
}

/* ---------------- UI helpers ---------------- */

function toggleSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  section.style.display = (section.style.display === "block") ? "none" : "block";
}

function getFormValue(selector) {
  const el = document.querySelector(selector);
  return (el?.value || "").trim();
}

/* ---------------- Device lookup sidekick ---------------- */

const DEVICE_LOOKUP_SPECIAL_SERIALS = new Set([
  "DTP10.009",
  "DTP10.010",
  "DTP10.011",
  "TP10.012",
  "DTP10.012",
  "TP10.013",
  "DTP10.013",
  "TP10.014",
  "DTP10.014",
  "TP10.015",
  "DTP10.015",
  "DTP10.016"
]);

const deviceLookupWorkbooks = {
  ltl: null,
  mount: null,
  crm: null
};
let deviceLookupWorkbookMeta = {
  ltl: null,
  mount: null,
  crm: null
};
let deviceLookupLastSheetLink = DEVICE_LOOKUP_EXCEL_WEB_URL;
let deviceLookupLastSerial = "";
let deviceLookupLastCrmId = "";
let deviceLookupLastLtlRow = null;
const MOUNT_NOT_FOUND_NOTE_TITLE = "Mount not found with device return:";
let deviceLookupLastAutofill = {
  cameraSerials: [],
  evoSerials: [],
  luminSerials: [],
  clampMounts: [],
  tableMounts: [],
  rollingMounts: []
};
let deviceLookupMountReturnReview = {
  hasFoundMounts: false,
  selectedCount: 0,
  notReturnedMounts: []
};
const lookupCopyButtons = [
  { id: "copyDeviceSnBtn", label: "Copy device SN" },
  { id: "copyCameraSnBtn", label: "Copy camera SNs" },
  { id: "copyLuminSnBtn", label: "Copy Lumin-I SNs" },
  { id: "copyEvoSnBtn", label: "Copy Evo SNs" },
  { id: "copyCrmBtn", label: "Copy CRM #" },
  { id: "copyClampBtn", label: "Copy clamp mount" },
  { id: "copyTableBtn", label: "Copy table mount" },
  { id: "copyRollingBtn", label: "Copy rolling mount" }
];
const DEVICE_LOOKUP_WORKBOOK_KEYS = ["ltl", "mount", "crm"];

function getWorkbookStatusElements(targetKey) {
  return Array.from(document.querySelectorAll(`[data-workbook-status="${targetKey}"]`));
}

function setWorkbookStatusMessage(targetKey, message) {
  const statuses = getWorkbookStatusElements(targetKey);
  if (!statuses.length) return;
  statuses.forEach(status => {
    status.textContent = message;
  });
}

function updateWorkbookStatus(targetKey, { name, saved } = {}) {
  if (!name) {
    setWorkbookStatusMessage(targetKey, "Workbook unavailable.");
    return;
  }
  setWorkbookStatusMessage(targetKey, `Connected: ${name}${saved ? " (saved)" : ""}`);
}

async function persistDeviceLookupWorkbooks() {
  await chrome.storage.local.set({
    [DEVICE_LOOKUP_WORKBOOK_META_STORAGE_KEY]: deviceLookupWorkbookMeta
  });
  await chrome.storage.local.remove(DEVICE_LOOKUP_WORKBOOKS_STORAGE_KEY);
}

async function loadDeviceLookupWorkbooksFromStorage() {
  const res = await chrome.storage.local.get([DEVICE_LOOKUP_WORKBOOK_META_STORAGE_KEY]);
  const storedMeta = res?.[DEVICE_LOOKUP_WORKBOOK_META_STORAGE_KEY];
  if (storedMeta) {
    deviceLookupWorkbookMeta = {
      ...deviceLookupWorkbookMeta,
      ...storedMeta
    };
  }
  await chrome.storage.local.remove(DEVICE_LOOKUP_WORKBOOKS_STORAGE_KEY);
  DEVICE_LOOKUP_WORKBOOK_KEYS.forEach(key => {
    updateWorkbookStatus(key, {
      name: DEVICE_LOOKUP_WORKBOOK_DISPLAY_NAMES[key] || "SharePoint workbook",
      saved: true
    });
  });
}

function columnLettersToIndex(letters) {
  return letters
    .toUpperCase()
    .split("")
    .reduce((acc, char) => acc * 26 + (char.charCodeAt(0) - 64), 0) - 1;
}

function parseSharedStrings(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  return Array.from(doc.getElementsByTagName("si")).map(item => {
    const textNodes = Array.from(item.getElementsByTagName("t"));
    return textNodes.map(node => node.textContent).join("");
  });
}

function parseSheet(xmlText, sharedStrings) {
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  const rows = [];
  const rowNodes = Array.from(doc.getElementsByTagName("row"));
  rowNodes.forEach(rowNode => {
    const rowIndex = parseInt(rowNode.getAttribute("r"), 10);
    if (!rowIndex) return;
    const row = rows[rowIndex - 1] || [];
    const cells = Array.from(rowNode.getElementsByTagName("c"));
    cells.forEach(cell => {
      const cellRef = cell.getAttribute("r") || "";
      const match = cellRef.match(/([A-Z]+)/i);
      if (!match) return;
      const colIndex = columnLettersToIndex(match[1]);
      const cellType = cell.getAttribute("t");
      let value = "";
      if (cellType === "s") {
        const v = cell.getElementsByTagName("v")[0];
        const idx = v ? parseInt(v.textContent, 10) : null;
        value = idx !== null && sharedStrings[idx] !== undefined ? sharedStrings[idx] : "";
      } else if (cellType === "inlineStr") {
        const tNode = cell.getElementsByTagName("t")[0];
        value = tNode ? tNode.textContent : "";
      } else {
        const v = cell.getElementsByTagName("v")[0];
        value = v ? v.textContent : "";
      }
      row[colIndex] = value;
    });
    rows[rowIndex - 1] = row;
  });
  return rows;
}

async function loadWorkbookFromFile(file) {
  const data = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(data);
  const workbookXml = await zip.file("xl/workbook.xml").async("text");
  const workbookDoc = new DOMParser().parseFromString(workbookXml, "application/xml");
  const relsXml = await zip.file("xl/_rels/workbook.xml.rels").async("text");
  const relsDoc = new DOMParser().parseFromString(relsXml, "application/xml");
  const rels = new Map(
    Array.from(relsDoc.getElementsByTagName("Relationship")).map(rel => [
      rel.getAttribute("Id"),
      rel.getAttribute("Target")
    ])
  );
  const sharedStrings = zip.file("xl/sharedStrings.xml")
    ? parseSharedStrings(await zip.file("xl/sharedStrings.xml").async("text"))
    : [];
  const sheets = {};
  const sheetNodes = Array.from(workbookDoc.getElementsByTagName("sheet"));
  for (const sheet of sheetNodes) {
    const name = sheet.getAttribute("name");
    const rId = sheet.getAttribute("r:id");
    if (!name || !rId) continue;
    const target = rels.get(rId);
    if (!target) continue;
    const path = target.startsWith("xl/") ? target : `xl/${target}`;
    if (!zip.file(path)) continue;
    const xmlText = await zip.file(path).async("text");
    sheets[name] = parseSheet(xmlText, sharedStrings);
  }
  return { sheets };
}

async function pickDeviceLookupWorkbook(targetKey) {
  if (typeof window.showOpenFilePicker !== "function") {
    alert("File picking isn't supported in this browser.");
    return null;
  }
  let handles;
  try {
    handles = await window.showOpenFilePicker({
      multiple: false,
      types: [{
        description: "Excel workbook",
        accept: {
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
          "application/vnd.ms-excel.sheet.macroEnabled.12": [".xlsm"]
        }
      }]
    });
  } catch {
    return null;
  }
  const handle = handles?.[0];
  if (!handle) return null;
  await saveDeviceLookupWorkbookHandle(targetKey, handle);
  return handle;
}

async function refreshDeviceLookupWorkbookFromHandle(targetKey, { handleOverride = null, force = false } = {}) {
  const handle = handleOverride ?? await loadDeviceLookupWorkbookHandle(targetKey).catch(() => null);
  if (!handle) {
    updateWorkbookStatus(targetKey, { name: "", saved: false });
    return false;
  }
  const permitted = await verifyFilePermission(handle, "read");
  const meta = deviceLookupWorkbookMeta[targetKey];
  if (!permitted) {
    setWorkbookStatusMessage(targetKey, "Workbook access blocked. Click Connect to re-authorize.");
    updateWorkbookStatus(targetKey, { name: meta?.name || "", saved: true });
    return false;
  }
  let file;
  try {
    file = await handle.getFile();
  } catch (error) {
    console.error(error);
    setWorkbookStatusMessage(targetKey, "Unable to open workbook. Click Connect to re-authorize.");
    return false;
  }
  const hasCache = Boolean(deviceLookupWorkbooks[targetKey]);
  const hasMeta = Boolean(meta);
  const changed = force
    || !hasCache
    || !hasMeta
    || meta.lastModified !== file.lastModified
    || meta.size !== file.size
    || meta.name !== file.name;

  if (!changed) {
    updateWorkbookStatus(targetKey, { name: meta?.name || file.name, saved: true });
    return true;
  }

  setWorkbookStatusMessage(targetKey, "Refreshing workbook...");
  try {
    const workbook = await loadWorkbookFromFile(file);
    deviceLookupWorkbooks[targetKey] = workbook;
    deviceLookupWorkbookMeta[targetKey] = {
      name: file.name,
      savedAt: new Date().toISOString(),
      lastModified: file.lastModified,
      size: file.size
    };
    await persistDeviceLookupWorkbooks();
    updateWorkbookStatus(targetKey, { name: file.name, saved: true });
    return true;
  } catch (error) {
    console.error(error);
    setWorkbookStatusMessage(targetKey, "Unable to read workbook. Click Connect to re-authorize.");
    return false;
  }
}

async function connectDeviceLookupWorkbook(targetKey) {
  setWorkbookStatusMessage(targetKey, "Refreshing workbook from SharePoint...");
  await refreshDeviceLookupWorkbookFromSharePoint(targetKey, { force: true });
}

async function refreshDeviceLookupWorkbookFromSharePoint(targetKey, { force = false } = {}) {
  const downloadUrl = DEVICE_LOOKUP_WORKBOOK_DOWNLOAD_URLS[targetKey];
  const displayName = DEVICE_LOOKUP_WORKBOOK_DISPLAY_NAMES[targetKey] || "SharePoint workbook";
  if (!downloadUrl) {
    setWorkbookStatusMessage(targetKey, "Workbook download link is missing.");
    return false;
  }
  setWorkbookStatusMessage(targetKey, "Loading workbook from SharePoint...");
  try {
    const response = await fetch(downloadUrl, {
      method: "GET",
      cache: "no-store",
      credentials: "include"
    });
    if (!response.ok) {
      throw new Error(`Download failed (${response.status})`);
    }
    const blob = await response.blob();
    const workbookFile = new File([blob], displayName, {
      type: blob.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      lastModified: Date.now()
    });
    const workbook = await loadWorkbookFromFile(workbookFile);
    deviceLookupWorkbooks[targetKey] = workbook;
    deviceLookupWorkbookMeta[targetKey] = {
      name: displayName,
      savedAt: new Date().toISOString(),
      lastModified: workbookFile.lastModified,
      size: workbookFile.size,
      source: "sharepoint"
    };
    await persistDeviceLookupWorkbooks();
    updateWorkbookStatus(targetKey, { name: displayName, saved: true });
    return true;
  } catch (error) {
    console.error(error);
    const previousName = deviceLookupWorkbookMeta[targetKey]?.name || displayName;
    updateWorkbookStatus(targetKey, { name: previousName, saved: true });
    setWorkbookStatusMessage(targetKey, "Unable to refresh from SharePoint. Open workbook to verify access.");
    return force ? false : Boolean(deviceLookupWorkbooks[targetKey]);
  }
}

async function refreshDeviceLookupWorkbooksFromHandles({ force = false } = {}) {
  const results = await Promise.all(
    DEVICE_LOOKUP_WORKBOOK_KEYS.map(key => refreshDeviceLookupWorkbookFromSharePoint(key, { force }))
  );
  return results.every(Boolean);
}

function normalizeLookupValue(value) {
  return String(value || "").trim().replace(/[()[\]"']/g, "").toLowerCase();
}

function extractValidSerial(scanInput) {
  if (!scanInput) return null;
  let cleaned = scanInput.replace(/\(01\)\d+/g, "");
  cleaned = cleaned.replace(/\(21\)/g, "").trim().toUpperCase();

  if (DEVICE_LOOKUP_SPECIAL_SERIALS.has(cleaned)) return cleaned;

  const fourDigitDotPrefixes = ["DTP10", "DTP8"];
  const sixDigitDotPrefixes = ["DW13", "DW5", "DWM", "DW"];
  const noDotPrefixes6or7 = ["DGPG", "DTT", "DTZ"];
  const noDotPrefixes4 = ["Z10D", "Z12D", "Z16D"];

  for (const prefix of fourDigitDotPrefixes) {
    if (cleaned.startsWith(prefix)) {
      const digits = cleaned.slice(prefix.length).replace(/\D/g, "");
      if (/^\d{4}$/.test(digits)) return `${prefix}.${digits}`;
    }
  }

  for (const prefix of sixDigitDotPrefixes) {
    if (cleaned.startsWith(prefix)) {
      const digits = cleaned.slice(prefix.length).replace(/\D/g, "");
      if (/^\d{6}$/.test(digits)) return `${prefix}.${digits}`;
    }
  }

  for (const prefix of noDotPrefixes6or7) {
    if (cleaned.startsWith(prefix)) {
      const digits = cleaned.slice(prefix.length);
      if (/^\d{6,7}$/.test(digits)) return `${prefix}${digits}`;
    }
  }

  const last7 = cleaned.match(/(\d{7})$/);
  if (last7) {
    const suffix = last7[1];
    if (cleaned.includes("5060446901465")) return `DTZ${suffix}`;
    if (cleaned.includes("5060446901373")) return `DTT${suffix}`;
  }

  for (const prefix of noDotPrefixes4) {
    if (cleaned.startsWith(prefix)) {
      const digits = cleaned.slice(prefix.length);
      if (/^\d{4}$/.test(digits)) return `${prefix}${digits}`;
    }
  }

  return null;
}

let prePrepRows = [];
let prePrepEditsLocked = false;

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
  const rowsEl = document.getElementById("prePrepRows");
  if (!rowsEl) return;
  rowsEl.innerHTML = "";
  prePrepRows.forEach(row => {
    const rowEl = document.createElement("div");
    rowEl.className = "pre-prep-table__row";
    rowEl.dataset.rowId = row.id;
    rowEl.append(
      buildPrePrepCopyCell(row, "deviceSerial", "Scanned device number"),
      buildPrePrepCopyCell(row, "internalSerial", "Internal serial number")
    );
    rowsEl.append(rowEl);
  });
  updatePrePrepLockState();
  updatePrePrepEmptyState();
}

function addPrePrepScan(rawInput) {
  const corrected = extractValidSerial(rawInput);
  setText("prePrepRawScan", rawInput || "—");
  setText("prePrepCorrectedScan", corrected ? `✅ ${corrected}` : "❌ Invalid serial scanned");

  if (!corrected) {
    setText("prePrepStatus", "Invalid serial number detected. Please enter it manually and try again.");
    return false;
  }

  prePrepRows.push({
    id: makePrePrepRowId(),
    deviceSerial: corrected,
    internalSerial: ""
  });
  renderPrePrepRows();
  setText("prePrepStatus", `Added ${corrected}.`);
  return true;
}

function clearPrePrepRows() {
  prePrepRows = [];
  renderPrePrepRows();
  setText("prePrepRawScan", "—");
  setText("prePrepCorrectedScan", "—");
  setText("prePrepStatus", "Pre-prep list cleared.");
}

function getSheetRows(workbook, sheetName) {
  if (!workbook?.sheets?.[sheetName]) return [];
  return workbook.sheets[sheetName];
}

function buildHeaderMap(rows) {
  const headers = rows[0] || [];
  const map = {};
  headers.forEach((header, idx) => {
    if (!header) return;
    map[String(header).trim()] = idx;
  });
  return map;
}

function trimTrailingEmptyCells(row) {
  const trimmed = [...row];
  while (trimmed.length) {
    const value = trimmed[trimmed.length - 1];
    if (value === null || value === undefined || String(value).trim() === "") {
      trimmed.pop();
      continue;
    }
    break;
  }
  return trimmed;
}

function formatWorksheetRow(rows, rowNumber) {
  const headerRow = rows[0] || [];
  const dataRow = rows[rowNumber - 1] || [];
  const lines = [];
  headerRow.forEach((header, idx) => {
    const headerText = String(header || "").trim();
    const valueText = String(dataRow[idx] ?? "").trim();
    if (!headerText || !valueText) return;
    lines.push(`${headerText}: ${valueText}`);
  });
  if (!lines.length) {
    dataRow.forEach((value, idx) => {
      const valueText = String(value ?? "").trim();
      if (!valueText) return;
      lines.push(`Column ${idx + 1}: ${valueText}`);
    });
  }
  return lines.join("\n");
}

function buildLtlSearchIndex(workbook) {
  const exactMap = new Map();
  const partMap = new Map();
  ["LTL Update List", "Return Watchlist"].forEach(sheetName => {
    const rows = workbook.sheets?.[sheetName];
    if (!rows) return;
    rows.forEach((row, rowIndex) => {
      row.forEach(cellValue => {
        if (!cellValue) return;
        const cellText = String(cellValue);
        const wholeNorm = normalizeLookupValue(cellText);
        if (wholeNorm) {
          if (!exactMap.has(wholeNorm)) exactMap.set(wholeNorm, []);
          exactMap.get(wholeNorm).push({ sheet: sheetName, rowIndex });
        }
        cellText.split(/[,\n;/]+/).forEach(part => {
          const partNorm = normalizeLookupValue(part);
          if (!partNorm) return;
          if (!partMap.has(partNorm)) partMap.set(partNorm, []);
          partMap.get(partNorm).push({ sheet: sheetName, rowIndex });
        });
      });
    });
  });
  return { exactMap, partMap };
}

function getLtlSearchIndex(workbook) {
  if (!workbook._ltlSearchIndex) {
    workbook._ltlSearchIndex = buildLtlSearchIndex(workbook);
  }
  return workbook._ltlSearchIndex;
}

function searchSerialNumber(serialNumber, workbook) {
  const serialNorm = normalizeLookupValue(serialNumber);
  const isSpecial = DEVICE_LOOKUP_SPECIAL_SERIALS.has(serialNumber);
  const { exactMap, partMap } = getLtlSearchIndex(workbook);
  const hits = isSpecial ? (exactMap.get(serialNorm) || []) : (partMap.get(serialNorm) || []);

  const matches = [];
  const sheetsFound = new Set();
  const seen = new Set();
  let ltlRowMatch = null;

  hits.forEach(({ sheet, rowIndex }) => {
    const key = `${sheet}:${rowIndex}`;
    if (seen.has(key)) return;
    seen.add(key);
    matches.push({ sheet, row: rowIndex + 1 });
    sheetsFound.add(sheet);
    if (sheet === "LTL Update List" && !ltlRowMatch) {
      const rows = workbook.sheets[sheet];
      const headerRow = rows[0] || [];
      const rowValues = rows[rowIndex] ? rows[rowIndex].slice(0, headerRow.length) : [];
      ltlRowMatch = {
        sheet,
        rowNumber: rowIndex + 1,
        rowText: formatWorksheetRow(rows, rowIndex + 1),
        rowValues: trimTrailingEmptyCells(rowValues)
      };
    }
  });

  if (matches.length) {
    const msg = `✅ Found in:\n${matches.map(match => `- Sheet: ${match.sheet}, Row: ${match.row}`).join("\n")}`;
    return { message: msg, status: "green", sheetsFound: Array.from(sheetsFound), ltlRow: ltlRowMatch };
  }
  return { message: "❌ Serial number not found in Workbook.", status: "red", sheetsFound: [], ltlRow: null };
}

function findCrmIdFromSerial(serialNumber, workbook) {
  try {
    const serialNorm = normalizeLookupValue(serialNumber);
    const devRows = getSheetRows(workbook, "DeviceLog");
    const devMap = buildHeaderMap(devRows);
    const devSerialCol = devMap["TTMTSerialNumber"];
    const devCrmCol = devMap["5 Digit CRM #"];
    for (let i = devRows.length - 1; i >= 1; i -= 1) {
      const row = devRows[i];
      if (!row) continue;
      if (normalizeLookupValue(row[devSerialCol]) === serialNorm) {
        const crm = String(row[devCrmCol] || "").trim();
        if (/^\d{5}$/.test(crm)) return { crmId: crm, error: null };
      }
    }

    const oldRows = getSheetRows(workbook, "OldDeviceLog");
    const oldMap = buildHeaderMap(oldRows);
    const oldSerialCol = oldMap["TTMT Serial Number"];
    const oldCrmCol = oldMap["5 Digit CRM #"];
    for (let i = oldRows.length - 1; i >= 1; i -= 1) {
      const row = oldRows[i];
      if (!row) continue;
      if (normalizeLookupValue(row[oldSerialCol]) === serialNorm) {
        const crm = String(row[oldCrmCol] || "").trim();
        if (/^\d{5}$/.test(crm)) return { crmId: crm, error: null };
      }
    }
    return { crmId: "", error: "❌ CRM ID not found" };
  } catch (error) {
    return { crmId: null, error: `❌ Error in find_crm_id_from_serial: ${error}` };
  }
}

function searchMountInventory(serialNumber, workbook, crmId) {
  try {
    const serialNorm = normalizeLookupValue(serialNumber);
    const mountSheets = [
      { sheetName: "CLAMP MOUNT", mountType: "Clamp Mount", target: "clamp" },
      { sheetName: "TABLE MOUNT", mountType: "Table Mount", target: "table" },
      { sheetName: "ROLLING MOUNT", mountType: "Rolling Mount", target: "rolling" }
    ];
    const clamp = [];
    const table = [];
    const rolling = [];
    let mismatched = false;

    mountSheets.forEach(({ sheetName, mountType, target }) => {
      const rows = getSheetRows(workbook, sheetName);
      rows.slice(1).forEach(row => {
        if (!row) return;
        if (normalizeLookupValue(row[1]) === serialNorm) {
          const mountSn = String(row[0] || "").trim();
          const mountCrm = String(row[4] || "").trim();
          const match = !mountCrm || !crmId || mountCrm === crmId;
          if (!match) mismatched = true;
          const mountInfo = { serial: mountSn, type: mountType, match };
          if (target === "clamp") clamp.push(mountInfo);
          if (target === "table") table.push(mountInfo);
          if (target === "rolling") rolling.push(mountInfo);
        }
      });
    });

    const allMounts = [...clamp, ...table, ...rolling];
    if (!allMounts.length) {
      return {
        lines: ["❌ Serial number not found in Mount Inventory."],
        clamp,
        table,
        rolling,
        mismatched,
        status: "red"
      };
    }

    return {
      lines: allMounts.map(item => `${item.match ? "✅" : "⚠️"} ${item.type}: ${item.serial}`),
      clamp,
      table,
      rolling,
      mismatched,
      status: mismatched ? "yellow" : "green"
    };
  } catch (error) {
    return {
      lines: [`❌ Error: ${error}`],
      clamp: [],
      table: [],
      rolling: [],
      mismatched: false,
      status: "red"
    };
  }
}

function findAttachedCameras(serialNumber, workbook) {
  try {
    const serialNorm = normalizeLookupValue(serialNumber);
    const devRows = getSheetRows(workbook, "DeviceLog");
    const oldRows = getSheetRows(workbook, "OldDeviceLog");
    const devMap = buildHeaderMap(devRows);
    const oldMap = buildHeaderMap(oldRows);

    const devSerialCol = devMap["TTMTSerialNumber"];
    const devCamCol = devMap["CameraSerialNumber"];
    const devLuminCol = devMap["Lumin-ISerialNumber"];
    const devCrmCol = devMap["5 Digit CRM #"];
    const devIdCol = devMap["ID"];

    const oldSerialCol = oldMap["TTMT Serial Number"];
    const oldCamCol = oldMap["Camera Serial Number"];
    const oldLuminCol = oldMap["Lumin-i Serial Number"];
    const oldCrmCol = oldMap["5 Digit CRM #"];
    const oldIdCol = oldMap["ID"];

    let crm = null;
    for (let i = devRows.length - 1; i >= 1; i -= 1) {
      const row = devRows[i];
      if (!row) continue;
      if (normalizeLookupValue(row[devSerialCol]) === serialNorm) {
        crm = String(row[devCrmCol] || "").trim();
        break;
      }
    }
    if (!crm) {
      for (let i = oldRows.length - 1; i >= 1; i -= 1) {
        const row = oldRows[i];
        if (!row) continue;
        if (normalizeLookupValue(row[oldSerialCol]) === serialNorm) {
          crm = String(row[oldCrmCol] || "").trim();
          break;
        }
      }
    }
    if (!crm) return { cameras: [], lumin: [], evo: [], error: null };

    const prefixOf = sn => {
      if (!sn) return "";
      const value = String(sn).trim();
      if (value.includes(".")) return `${value.split(".", 1)[0].toUpperCase()}.`;
      const match = value.match(/^[A-Za-z]+/);
      return match ? `${match[0].toUpperCase()}.` : "";
    };

    let newestCamera = null;
    let newestLumin = null;
    let newestEvo = null;

    function ingest(rows, idCol, camCol, luminCol, crmCol, src) {
      for (let i = rows.length - 1; i >= 1; i -= 1) {
        const row = rows[i];
        if (!row || String(row[crmCol] || "").trim() !== crm) continue;
        const rowId = String(row[idCol] || "").trim();

        const cam = String(row[camCol] || "").trim();
        if (cam) {
          const prefix = prefixOf(cam);
          if (prefix === "GPE." && !newestEvo) {
            newestEvo = { sn: cam, id: rowId, src, col: "CAM" };
          } else if (!newestCamera) {
            newestCamera = { sn: cam, id: rowId, src, col: "CAM" };
          }
        }

        const lumin = String(row[luminCol] || "").trim();
        if (lumin) {
          const prefix = prefixOf(lumin);
          if (prefix === "GPE." && !newestEvo) {
            newestEvo = { sn: lumin, id: rowId, src, col: "LUM" };
          } else if (prefix === "GPL." && !newestLumin) {
            newestLumin = { sn: lumin, id: rowId, src, col: "LUM" };
          }
        }
      }
    }

    ingest(devRows, devIdCol, devCamCol, devLuminCol, devCrmCol, "dev");
    ingest(oldRows, oldIdCol, oldCamCol, oldLuminCol, oldCrmCol, "old");

    const devRowsForward = devRows.slice(1);
    const oldRowsForward = oldRows.slice(1);

    const toInt = value => {
      const parsed = parseInt(value, 10);
      return Number.isNaN(parsed) ? -1 : parsed;
    };

    function fwdScanGpv(sn, startId, src) {
      const sid = toInt(startId);
      if (src === "dev") {
        return devRowsForward.some(row => toInt(row[devIdCol]) > sid && String(row[devCamCol] || "") === sn && String(row[devCrmCol] || "") !== crm);
      }
      if (oldRowsForward.some(row => toInt(row[oldIdCol]) > sid && String(row[oldCamCol] || "") === sn && String(row[oldCrmCol] || "") !== crm)) return true;
      return devRowsForward.some(row => String(row[devCamCol] || "") === sn && String(row[devCrmCol] || "") !== crm);
    }

    function fwdScanLumin(sn, startId, src) {
      const sid = toInt(startId);
      if (src === "dev") {
        return devRowsForward.some(row => toInt(row[devIdCol]) > sid && String(row[devLuminCol] || "") === sn && String(row[devCrmCol] || "") !== crm);
      }
      if (oldRowsForward.some(row => toInt(row[oldIdCol]) > sid && String(row[oldLuminCol] || "") === sn && String(row[oldCrmCol] || "") !== crm)) return true;
      return devRowsForward.some(row => String(row[devLuminCol] || "") === sn && String(row[devCrmCol] || "") !== crm);
    }

    function fwdScanEvo(sn, startId, src) {
      const sid = toInt(startId);
      if (src === "dev") {
        return devRowsForward.some(row => toInt(row[devIdCol]) > sid && (String(row[devCamCol] || "") === sn || String(row[devLuminCol] || "") === sn) && String(row[devCrmCol] || "") !== crm);
      }
      if (oldRowsForward.some(row => toInt(row[oldIdCol]) > sid && (String(row[oldCamCol] || "") === sn || String(row[oldLuminCol] || "") === sn) && String(row[oldCrmCol] || "") !== crm)) return true;
      return devRowsForward.some(row => (String(row[devCamCol] || "") === sn || String(row[devLuminCol] || "") === sn) && String(row[devCrmCol] || "") !== crm);
    }

    const cameras = [];
    const lumin = [];
    const evo = [];

    if (newestCamera) {
      const { sn, id, src } = newestCamera;
      if (sn.toUpperCase().startsWith("GPV.")) {
        if (!fwdScanGpv(sn, id, src)) cameras.push(sn);
      } else {
        cameras.push(sn);
      }
    }

    if (newestLumin) {
      const { sn, id, src } = newestLumin;
      if (!fwdScanLumin(sn, id, src)) lumin.push(sn);
    }

    if (newestEvo) {
      const { sn, id, src } = newestEvo;
      if (!fwdScanEvo(sn, id, src)) evo.push(sn);
    }

    return { cameras, lumin, evo, error: null };
  } catch (error) {
    return { cameras: [], lumin: [], evo: [], error: `❌ Error in find_attached_cameras: ${error}` };
  }
}

function updateLookupResultCard(cardId, contentId, message, status) {
  const card = document.getElementById(cardId);
  const content = document.getElementById(contentId);
  if (content) content.textContent = message || "";
  if (card) card.setAttribute("data-status", status || "");
}

function updateCopyButton(buttonId, value, label) {
  const button = document.getElementById(buttonId);
  if (!button) return;
  const hasValue = Boolean(value);
  button.dataset.copyValue = value || "";
  button.disabled = !hasValue;
  button.style.display = hasValue ? "inline-flex" : "none";
  button.textContent = hasValue ? `${label}: ${value}` : label;
}

function updateLookupBeginLtlUpdateButton(show) {
  const button = document.getElementById("lookupBeginLtlUpdateBtn");
  if (!button) return;
  button.classList.toggle("hidden-section", !show);
}

function clearLookupLtlRow() {
  deviceLookupLastLtlRow = null;
  updateLtlUpdateRowSection();
}

function resetLookupCopyButtons() {
  lookupCopyButtons.forEach(({ id, label }) => updateCopyButton(id, "", label));
}

function resetMountReturnReview() {
  deviceLookupMountReturnReview = {
    hasFoundMounts: false,
    selectedCount: 0,
    notReturnedMounts: []
  };
}

function getAllMountReturnItems(mountResult) {
  return [
    ...mountResult.clamp.map(item => ({ ...item, target: "clampMounts" })),
    ...mountResult.table.map(item => ({ ...item, target: "tableMounts" })),
    ...mountResult.rolling.map(item => ({ ...item, target: "rollingMounts" }))
  ];
}

function closeMountReturnModal() {
  const modal = document.getElementById("mountReturnModal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

function showMountReturnModal(mountItems) {
  const modal = document.getElementById("mountReturnModal");
  const checklist = document.getElementById("mountReturnChecklist");
  if (!modal || !checklist || !mountItems.length) return;

  checklist.innerHTML = "";
  mountItems.forEach((item, index) => {
    const checkboxId = `mountReturnItem${index}`;
    const label = document.createElement("label");
    label.className = "mount-return-modal__item";
    label.setAttribute("for", checkboxId);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = checkboxId;
    checkbox.dataset.mountTarget = item.target;
    checkbox.dataset.mountSerial = item.serial;
    checkbox.dataset.mountType = item.type;

    const textWrap = document.createElement("span");
    textWrap.className = "mount-return-modal__item-text";

    const type = document.createElement("span");
    type.className = "mount-return-modal__item-type";
    type.textContent = item.type;

    const serial = document.createElement("span");
    serial.className = "mount-return-modal__item-serial";
    serial.textContent = item.serial;

    textWrap.append(type, serial);
    label.append(checkbox, textWrap);
    checklist.append(label);
  });

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

function confirmMountReturnSelection() {
  const selected = {
    clampMounts: [],
    tableMounts: [],
    rollingMounts: []
  };
  const notReturnedMounts = [];

  document.querySelectorAll('#mountReturnChecklist input[type="checkbox"]').forEach(input => {
    const target = input.dataset.mountTarget;
    const serial = input.dataset.mountSerial;
    const mountType = input.dataset.mountType || "Mount";
    if (!target || !serial) return;
    if (input.checked && selected[target]) {
      selected[target].push(serial);
      return;
    }
    notReturnedMounts.push({ type: mountType, serial });
  });

  deviceLookupLastAutofill = {
    ...deviceLookupLastAutofill,
    ...selected
  };
  deviceLookupMountReturnReview = {
    hasFoundMounts: true,
    selectedCount: selected.clampMounts.length + selected.tableMounts.length + selected.rollingMounts.length,
    notReturnedMounts
  };

  applyLookupAutofillToCheckin();
  closeMountReturnModal();
}

function buildMountNotFoundNote() {
  if (!deviceLookupMountReturnReview.hasFoundMounts || !deviceLookupMountReturnReview.notReturnedMounts.length) return "";
  return [
    MOUNT_NOT_FOUND_NOTE_TITLE,
    ...deviceLookupMountReturnReview.notReturnedMounts.map(item => `${item.type} (${item.serial})`)
  ].join("\n");
}

function applyLookupAutofillToCheckin() {
  const cameraInput = document.querySelector('input[name="cameraNumber"]');
  const luminInput = document.querySelector('input[name="luminNumber"]');
  const clampInput = document.querySelector('input[name="clampMount"]');
  const tableInput = document.querySelector('input[name="tableMount"]');
  const rollingInput = document.querySelector('input[name="rollingMount"]');

  const cameraValue = [...deviceLookupLastAutofill.cameraSerials, ...deviceLookupLastAutofill.evoSerials].join(", ");
  const luminValue = deviceLookupLastAutofill.luminSerials.join(", ");
  const clampValue = deviceLookupLastAutofill.clampMounts.join(", ");
  const tableValue = deviceLookupLastAutofill.tableMounts.join(", ");
  const rollingValue = deviceLookupLastAutofill.rollingMounts.join(", ");

  if (cameraInput && cameraValue && !cameraInput.value.trim()) cameraInput.value = cameraValue;
  if (luminInput && luminValue && !luminInput.value.trim()) luminInput.value = luminValue;
  if (clampInput && clampValue && !clampInput.value.trim()) clampInput.value = clampValue;
  if (tableInput && tableValue && !tableInput.value.trim()) tableInput.value = tableValue;
  if (rollingInput && rollingValue && !rollingInput.value.trim()) rollingInput.value = rollingValue;

  const cameraLuminSection = document.getElementById("cameraLuminSection");
  if (cameraLuminSection && (cameraValue || luminValue)) {
    cameraLuminSection.style.display = "block";
  }
  if (mountSection && (clampValue || tableValue || rollingValue)) {
    mountSection.style.display = "block";
  }
}

async function runDeviceLookupSearch(rawInput) {
  const lookupCopyStatus = document.getElementById("lookupCopyStatus");
  if (lookupCopyStatus) lookupCopyStatus.textContent = "";

  await refreshDeviceLookupWorkbooksFromHandles();

  const extracted = extractValidSerial(rawInput);
  setText("deviceLookupRaw", rawInput || "—");
  setText("deviceLookupExtracted", extracted ? `✅ ${extracted}` : "❌ Invalid serial scanned");
  deviceLookupLastSerial = extracted || "";
  deviceLookupLastCrmId = "";
  deviceLookupLastLtlRow = null;
  deviceLookupLastAutofill = {
    cameraSerials: [],
    evoSerials: [],
    luminSerials: [],
    clampMounts: [],
    tableMounts: [],
    rollingMounts: []
  };
  resetMountReturnReview();
  closeMountReturnModal();

  if (!extracted) {
    updateLookupResultCard("lookupSerialCard", "lookupSerialResult", "Invalid serial number detected. Please enter it manually and try again.", "red");
    updateLookupResultCard("lookupMountCard", "lookupMountResult", "", "");
    updateLookupResultCard("lookupActionCard", "lookupActionResult", "Report the invalid scan to pre-prep.", "red");
    resetLookupCopyButtons();
    updateLookupBeginLtlUpdateButton(false);
    updateLtlUpdateRowSection();
    await logTaskOutcome("Device Lookup", `Search attempted with invalid scan input: ${rawInput || "(blank)"}`);
    return;
  }

  try {
    await navigator.clipboard.writeText(extracted);
  } catch (error) {
    console.warn("Unable to copy serial to clipboard.", error);
  }

  const ltlWorkbook = deviceLookupWorkbooks.ltl;
  const mountWorkbook = deviceLookupWorkbooks.mount;
  const crmWorkbook = deviceLookupWorkbooks.crm;

  if (!ltlWorkbook || !mountWorkbook || !crmWorkbook) {
    updateLookupResultCard("lookupSerialCard", "lookupSerialResult", "Unable to load all three SharePoint workbooks before searching.", "red");
    updateLookupResultCard("lookupMountCard", "lookupMountResult", "", "");
    updateLookupResultCard("lookupActionCard", "lookupActionResult", "Use the Open workbook buttons to verify SharePoint access, then try again.", "red");
    resetLookupCopyButtons();
    updateLookupBeginLtlUpdateButton(false);
    updateLtlUpdateRowSection();
    await logTaskOutcome("Device Lookup", `Search attempted for ${extracted} but one or more workbooks were not connected`);
    return;
  }

  const serialResult = searchSerialNumber(extracted, ltlWorkbook);
  updateLookupResultCard("lookupSerialCard", "lookupSerialResult", serialResult.message, serialResult.status);
  deviceLookupLastLtlRow = serialResult.ltlRow;
  updateLtlUpdateRowSection();
  deviceLookupLastSheetLink = DEVICE_LOOKUP_EXCEL_WEB_URL;
  if (serialResult.sheetsFound.includes("LTL Update List")) {
    deviceLookupLastSheetLink = DEVICE_LOOKUP_SHEET_LINKS["LTL Update List"] || DEVICE_LOOKUP_EXCEL_WEB_URL;
  } else if (serialResult.sheetsFound.includes("Return Watchlist")) {
    deviceLookupLastSheetLink = DEVICE_LOOKUP_SHEET_LINKS["Return Watchlist"] || DEVICE_LOOKUP_EXCEL_WEB_URL;
  }

  const { crmId, error: crmError } = findCrmIdFromSerial(extracted, crmWorkbook);
  deviceLookupLastCrmId = crmId || "";
  const mountResult = searchMountInventory(extracted, mountWorkbook, crmId || "");
  updateLookupResultCard("lookupMountCard", "lookupMountResult", mountResult.lines.join("\n"), mountResult.status);

  const cameraResult = findAttachedCameras(extracted, crmWorkbook);
  if (cameraResult.error) {
    updateLookupResultCard("lookupActionCard", "lookupActionResult", cameraResult.error, "red");
    return;
  }

  const cameraSerials = [...cameraResult.cameras];
  const luminSerials = [...cameraResult.lumin];
  const evoSerials = [...cameraResult.evo];

  const hasMounts = mountResult.clamp.length || mountResult.table.length || mountResult.rolling.length;
  const foundInLtl = serialResult.sheetsFound.includes("LTL Update List");
  const foundInRwl = serialResult.sheetsFound.includes("Return Watchlist");
  const crmFullUrl = crmId ? `${CRM_PRIMARY_ORIGIN}/Admin/EditClient.aspx?ID=${encodeURIComponent(crmId)}` : "";

  updateLookupBeginLtlUpdateButton(foundInLtl);

  if (foundInRwl) {
    const rwlUrl = DEVICE_LOOKUP_SHEET_LINKS["Return Watchlist"] || DEVICE_LOOKUP_EXCEL_WEB_URL;
    chrome.tabs.create({ url: rwlUrl });
  }

  const deviceInfoParts = [];
  if (cameraSerials.length) deviceInfoParts.push(`Camera: ${cameraSerials.join(", ")}`);
  if (luminSerials.length) deviceInfoParts.push(`Lumin-i: ${luminSerials.join(", ")}`);
  if (evoSerials.length) deviceInfoParts.push(`Evo: ${evoSerials.join(", ")}`);
  const deviceInfo = deviceInfoParts.length
    ? `${extracted} with ${deviceInfoParts.join(", ")}. CRM #: ${crmId || "N/A"}`
    : `${extracted}. CRM #: ${crmId || "N/A"}`;

  const msgStart = `-You have completed a search for: ${deviceInfo}`;
  const msgLtl = "-Your device was found on the LTL Update worksheet.\n-Please place your device on the top shelf of the rack next to Dave's desk.";
  const msgRw = "-Please check the Return Watchlist worksheet for your device.\n-When Action Needed is completed delete the row. If unsure reach out to the author of the entry.";
  const msgBoth = "-Please check the LTL Update worksheet and Return Watchlist worksheet for your device.";
  const msgNone = "-No action required.";
  const msgCopied = "-Click the Checkin Device button to continue your check-in.\n-Serial number is copied to your clipboard.";

  const mountNotes = [];
  const mismatchedMounts = [];
  [...mountResult.clamp, ...mountResult.table, ...mountResult.rolling].forEach(item => {
    if (!item.match) mismatchedMounts.push(`${item.type}: ${item.serial}`);
  });
  if (mismatchedMounts.length) {
    mountNotes.push("-⚠️ Some mounts were found, but their CRM number may not match the device. Please confirm that these mounts belong with this device before completing check-in.");
  }
  if (mountResult.clamp.length || mountResult.table.length) {
    mountNotes.push("-Check the notes in the CRM to see if a table mount and/or clamp mount has been returned. If not, then go find the mount(s) in the unchecked mount container. If still not found, check the disinfection log or message a lead to help look into it further.");
  }
  if (mountResult.rolling.length) {
    mountNotes.push("-Find the rolling mount and move to the checked-in location.");
  }

  let actionColor = "green";
  let combinedMsg = msgNone;
  const mountMessage = mountNotes.length ? `\n\n${mountNotes.join("\n")}` : "";

  if (foundInLtl && foundInRwl) {
    actionColor = "blue";
    combinedMsg = `${msgStart}\n\n${msgBoth}${mountMessage}\n\n${msgLtl}`;
  } else if (foundInLtl) {
    actionColor = "blue";
    combinedMsg = `${msgStart}${mountMessage}\n\n${msgLtl}`;
  } else if (foundInRwl) {
    actionColor = "yellow";
    combinedMsg = `${msgStart}\n\n${msgRw}${mountMessage}\n\n${msgCopied}`;
  } else if (hasMounts) {
    actionColor = "yellow";
    combinedMsg = `${msgStart}${mountMessage}\n\n${msgCopied}`;
  } else {
    actionColor = "green";
    combinedMsg = `${msgStart}\n\n${msgNone}\n\n${msgCopied}`;
  }

  if (crmError) {
    combinedMsg = `${combinedMsg}\n\n${crmError}`;
    actionColor = "red";
  }

  updateLookupResultCard("lookupActionCard", "lookupActionResult", combinedMsg, actionColor);
  if (crmFullUrl) {
    updateLookupResultCard("lookupActionCard", "lookupActionResult", `${combinedMsg}\n\n${crmFullUrl}`, actionColor);
  }

  updateCopyButton("copyDeviceSnBtn", extracted, "Copy device SN");
  updateCopyButton("copyCameraSnBtn", cameraSerials.join(", "), "Copy camera SNs");
  updateCopyButton("copyLuminSnBtn", luminSerials.join(", "), "Copy Lumin-I SNs");
  updateCopyButton("copyEvoSnBtn", evoSerials.join(", "), "Copy Evo SNs");
  updateCopyButton("copyCrmBtn", crmId || "", "Copy CRM #");
  updateCopyButton("copyClampBtn", mountResult.clamp.map(item => item.serial).join(", "), "Copy clamp mount");
  updateCopyButton("copyTableBtn", mountResult.table.map(item => item.serial).join(", "), "Copy table mount");
  updateCopyButton("copyRollingBtn", mountResult.rolling.map(item => item.serial).join(", "), "Copy rolling mount");
  const mountReturnItems = getAllMountReturnItems(mountResult);
  deviceLookupLastAutofill = {
    cameraSerials,
    evoSerials,
    luminSerials,
    clampMounts: [],
    tableMounts: [],
    rollingMounts: []
  };
  deviceLookupMountReturnReview = {
    hasFoundMounts: mountReturnItems.length > 0,
    selectedCount: 0,
    notReturnedMounts: []
  };
  if (mountReturnItems.length) {
    showMountReturnModal(mountReturnItems);
  }

}

/* ---------------- Grid sidekick ---------------- */

const GRID_EMAIL_DOMAIN = "wegotalk.com";
const GRID_PASSWORD = "Xqxq77##";
let isGridChangesLocked = false;

function getGridSanitizedNames() {
  return {
    firstName: sanitizeName(getFormValue("#gridFirstName")),
    lastName: sanitizeName(getFormValue("#gridLastName"))
  };
}

function getGridFullName() {
  const { firstName, lastName } = getGridSanitizedNames();
  return [firstName, lastName].filter(Boolean).join(" ");
}

function splitNameParts(name) {
  return sanitizeName(name)
    .split(/[\s-]+/)
    .map(part => part.trim())
    .filter(Boolean);
}

function buildGridEmail() {
  const { firstName, lastName } = getGridSanitizedNames();
  const crmId = getFormValue("#gridCrmId");
  const type = document.querySelector("input[name='gridType']:checked")?.value || "CL";

  if (!crmId) return "";

  if (type === "CL") {
    const firstParts = splitNameParts(firstName);
    const lastParts = splitNameParts(lastName);
    if (!firstParts.length || !lastParts.length) return "";
    const first = firstParts.join("");
    const lastInitial = lastParts[0]?.[0] || "";
    if (!first || !lastInitial) return "";
    return `${first}${lastInitial}${crmId}@${GRID_EMAIL_DOMAIN}`.toLowerCase();
  }

  const initials = [...splitNameParts(firstName), ...splitNameParts(lastName)]
    .map(part => part[0])
    .join("");
  if (!initials) return "";
  return `${initials}${crmId}@${GRID_EMAIL_DOMAIN}`.toLowerCase();
}

function updateGridLockButtonLabel() {
  const lockBtn = document.getElementById("gridLockChangesBtn");
  if (lockBtn) {
    lockBtn.textContent = `Lock Changes: ${isGridChangesLocked ? "On" : "Off"}`;
  }
}

function updateGridOutput({ preserveTypedEmail = false } = {}) {
  const fullName = getGridFullName();
  const generatedEmail = buildGridEmail();
  const typedEmail = getFormValue("#gridEmailField").trim();
  const email = preserveTypedEmail ? (typedEmail || generatedEmail) : generatedEmail;
  const crmInfo = email ? `Grid: ${email} | ${GRID_PASSWORD}` : "";

  setValue("gridFullNameField", fullName);
  setValue("gridEmailField", email);
  setValue("gridPasswordField", GRID_PASSWORD);
  setValue("gridCrmInfoField", crmInfo);

  const fullNameCopyBtn = document.getElementById("gridFullNameCopyBtn");
  if (fullNameCopyBtn) {
    fullNameCopyBtn.disabled = !fullName;
    fullNameCopyBtn.textContent = fullName ? "Copy" : "No value";
  }

  const emailCopyBtn = document.getElementById("gridEmailCopyBtn");
  if (emailCopyBtn) {
    emailCopyBtn.disabled = !email;
    emailCopyBtn.textContent = email ? "Copy" : "No value";
  }

  const passwordCopyBtn = document.getElementById("gridPasswordCopyBtn");
  if (passwordCopyBtn) {
    passwordCopyBtn.textContent = "Copy";
  }

  const crmInfoCopyBtn = document.getElementById("gridCrmInfoCopyBtn");
  if (crmInfoCopyBtn) {
    crmInfoCopyBtn.disabled = !crmInfo;
    crmInfoCopyBtn.textContent = crmInfo ? "Copy" : "No value";
  }

  const status = document.getElementById("gridStatus");
  if (status) {
    status.textContent = email
      ? isGridChangesLocked
        ? "Grid credentials ready. Changes are locked."
        : "Grid credentials ready."
      : "Enter client details and CRM ID to generate the Grid email.";
  }

}

async function refreshGridClientData(tabIdOverride = null) {
  const status = document.getElementById("gridStatus");
  if (isGridChangesLocked) {
    if (status) status.textContent = "Changes are locked. Unlock changes to refresh from CRM.";
    updateGridOutput({ preserveTypedEmail: true });
    return;
  }

  const res = await fetchClientData(tabIdOverride);
  if (!res?.data) {
    if (status) status.textContent = "Open a CRM client record to auto-fill these fields.";
    updateGridOutput();
    return;
  }
  applyGridClientData(res.data);
  updateGridOutput();
}

/* ---------------- Repairs logic ---------------- */

const repairsBox = document.getElementById("repairsTextBox");
const otherInput = document.getElementById("otherRepairInput");
const repairButtons = Array.from(document.querySelectorAll(".repair-btn"));

function updateRepairsBox() {
  const items = [];
  repairButtons
    .filter(btn => btn.classList.contains("active") && btn.id !== "otherRepairBtn")
    .forEach(btn => items.push(btn.textContent.trim()));

  const otherText = otherInput?.value?.trim() || "";
  if (otherText) items.push("Other: " + otherText);

  if (repairsBox) repairsBox.value = items.join(", ");
}

repairButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.id === "otherRepairBtn") {
      btn.classList.toggle("active");
      if (otherInput) {
        otherInput.style.display = btn.classList.contains("active") ? "block" : "none";
        if (!btn.classList.contains("active")) otherInput.value = "";
      }
      updateRepairsBox();
      return;
    }
    btn.classList.toggle("active");
    updateRepairsBox();
  });
});

otherInput?.addEventListener("input", updateRepairsBox);

/* ---------------- LTL updates ---------------- */

function getSelectedLtlUpdates() {
  return Array.from(document.querySelectorAll('input[name="ltlUpdates"]:checked'))
    .map(input => input.value)
    .filter(Boolean);
}

function buildLtlUpdatesLine() {
  if (!isLtlUpdateFlow()) return "";
  const updates = getSelectedLtlUpdates();
  if (!updates.length) return "";

  const formatted = updates.map(value => {
    if (value !== "Other") return value;
    const otherText = ltlUpdateOtherText?.value?.trim();
    return otherText ? `Other: ${otherText}` : "Other";
  });

  return `Updates made: ${formatted.join(", ")}.`;
}

ltlUpdateOtherToggle?.addEventListener("change", updateLtlUpdateOtherFieldVisibility);
document.querySelectorAll('input[name="ltlUpdates"]').forEach(input => {
  input.addEventListener("change", updateLtlUpdateNewSerialFieldVisibility);
});
updateLtlUpdateNewSerialFieldVisibility();

/* ---------------- Device Condition + X rules ---------------- */

const deviceInput = document.getElementById("deviceNumberInput");
const cameraLuminSection = document.getElementById("cameraLuminSection");
const mountSection = document.getElementById("mountSection");
const conditionSelect = document.getElementById("conditionSelect");
const conditionContainer = document.getElementById("conditionContainer");
const repairSection = document.getElementById("repairSection");

function clearRepairsUI() {
  if (repairsBox) repairsBox.value = "";
  if (otherInput) {
    otherInput.value = "";
    otherInput.style.display = "none";
  }
  repairButtons.forEach(b => b.classList.remove("active"));
  if (repairSection) repairSection.style.display = "none";
}

function updateDeviceRules() {
  const isMountOnly = (deviceInput?.value || "").trim().toLowerCase() === "x";

  if (isMountOnly && !isLtlUpdateFlow()) {
    if (mountSection) mountSection.style.display = "block";
    if (conditionSelect) {
      conditionSelect.required = false;
      conditionSelect.value = "";
    }
    if (conditionContainer) conditionContainer.style.display = "none";
    clearRepairsUI();
  } else {
    if (isLtlUpdateFlow() && mountSection) mountSection.style.display = "none";
    if (conditionContainer) conditionContainer.style.display = "block";
    if (conditionSelect) conditionSelect.required = true;
  }
}

deviceInput?.addEventListener("input", updateDeviceRules);
updateDeviceRules();

conditionSelect?.addEventListener("change", () => {
  const show = conditionSelect.value === "Needs Repair";
  if (repairSection) repairSection.style.display = show ? "block" : "none";
  if (!show) clearRepairsUI();
});

/* ---------------- Expand toggles ---------------- */

document.getElementById("cameraToggle")?.addEventListener("click", () => toggleSection("cameraLuminSection"));
document.getElementById("mountToggle")?.addEventListener("click", () => toggleSection("mountSection"));
document.getElementById("accessoryToggle")?.addEventListener("click", () => toggleSection("accessorySection"));

const vocabNotReturnedToggle = document.getElementById("vocabNotReturned");
const vocabTypeInputs = Array.from(document.querySelectorAll('input[name="vocabTypes"]'));

function updateVocabSelectionAvailability() {
  const disabled = vocabNotReturnedToggle?.checked === true;
  vocabTypeInputs.forEach(input => {
    input.disabled = disabled;
    if (disabled) input.checked = false;
  });
}

vocabNotReturnedToggle?.addEventListener("change", updateVocabSelectionAvailability);
updateVocabSelectionAvailability();

/* ---------------- Device model detection ---------------- */

function detectDeviceModel(deviceNumberRaw) {
  const s = (deviceNumberRaw || "").trim().toUpperCase();
  if (s === "X") return "Mount Only";

  const rules = [
    { prefix: "DTP10", model: "Talk Pad 10" },
    { prefix: "DTP8", model: "Talk Pad 8" },
    { prefix: "Z16", model: "Zuvo 16" },
    { prefix: "Z12", model: "Zuvo 12" },
    { prefix: "Z10", model: "Zuvo 10" },
    { prefix: "DW5", model: "Wego 5A" },
    { prefix: "DWM", model: "Wego 7A" },
    { prefix: "DW13", model: "Wego 13A" },
    { prefix: "DW", model: "Wego 10A" },
    { prefix: "DGPG", model: "Grid Pad Go" },
    { prefix: "DTT", model: "Grid Pad 13" },
    { prefix: "DTZ", model: "Grid Pad 16" }
  ];

  for (const r of rules) {
    if (s.startsWith(r.prefix)) return r.model;
  }
  return "Device";
}

function isSmartboxRepairModel(deviceNumberRaw) {
  const modelName = detectDeviceModel(deviceNumberRaw);
  return modelName.includes("Talk Pad") || modelName.includes("Grid Pad");
}

/* ---------------- NOTE helpers ---------------- */

function getSelectedVocabTypes() {
  return Array.from(document.querySelectorAll('input[name="vocabTypes"]:checked'))
    .map(input => input.value)
    .filter(Boolean);
}

function buildVocabLine() {
  const vocabNotReturned = document.getElementById("vocabNotReturned")?.checked === true;
  if (vocabNotReturned) return "No vocab returned.";
  const selected = getSelectedVocabTypes();
  const vocabLabel = selected.length ? selected.join(", ") : "selected";
  return `I saved ${vocabLabel} vocabs to the CRM.`;
}

function hasValidVocabSelection() {
  const vocabNotReturned = document.getElementById("vocabNotReturned")?.checked === true;
  return vocabNotReturned || getSelectedVocabTypes().length > 0;
}

function buildAccessoriesLineIfAny() {
  const accessories = getFormValue('input[name="accessories"]');
  if (!accessories) return "";
  return ` Also returned with the device: ${accessories}.`;
}

function buildDeviceIdentifier(deviceNum) {
  const parts = [];
  const lumin = getFormValue('input[name="luminNumber"]');
  const camera = getFormValue('input[name="cameraNumber"]');
  if (lumin) parts.push(lumin);
  if (camera) parts.push(camera);

  if (parts.length === 0) return `(${deviceNum})`;
  return `(${deviceNum} | ${parts.join(", ")})`;
}

function buildMountsBlockIfAny() {
  const clamp = getFormValue('input[name="clampMount"]');
  const rolling = getFormValue('input[name="rollingMount"]');
  const table = getFormValue('input[name="tableMount"]');
  const mountNotFoundNote = buildMountNotFoundNote();
  if (!(clamp || rolling || table)) {
    return mountNotFoundNote ? `\n\n${mountNotFoundNote}` : "";
  }

  const lines = ["", "", "Mount(s) Returned with the device:"];
  if (clamp) lines.push(`Clamp Mount (${clamp})`);
  if (rolling) lines.push(`Rolling Mount (${rolling})`);
  if (table) lines.push(`Table Mount (${table})`);
  if (mountNotFoundNote) lines.push("", mountNotFoundNote);
  return lines.join("\n");
}

function buildMountsReturnedOnlyNote() {
  const clamp = getFormValue('input[name="clampMount"]');
  const rolling = getFormValue('input[name="rollingMount"]');
  const table = getFormValue('input[name="tableMount"]');

  const lines = ["Mounts Returned:"];
  if (clamp) lines.push(`Clamp Mount (${clamp})`);
  if (rolling) lines.push(`Rolling Mount (${rolling})`);
  if (table) lines.push(`Table Mount (${table})`);
  if (lines.length === 1) lines.push("No mount numbers entered.");
  return lines.join("\n");
}

function getFormattedLtlUpdates() {
  const updates = getSelectedLtlUpdates();
  if (!updates.length) return "No updates selected";

  const formatted = updates.map(value => {
    if (value !== "Other") return value;
    const otherText = ltlUpdateOtherText?.value?.trim();
    return otherText ? `Other: ${otherText}` : "Other";
  });

  return formatted.join(", ");
}

function buildLtlUpdateNote({ fullName, modelName, deviceNum }) {
  const vocabNotReturned = document.getElementById("vocabNotReturned")?.checked === true;
  const selectedVocabs = getSelectedVocabTypes();
  const vocabLabel = vocabNotReturned
    ? "no"
    : (selectedVocabs.length ? selectedVocabs.join(", ") : "selected");
  const updatesText = getFormattedLtlUpdates();

  let note = `${fullName} ${modelName} (${deviceNum}) was returned for a yearly update. I was able to save/transfer ${vocabLabel} Vocab(s) to the CRM. Device was wiped and unsupported apps were removed. I also performed the following updates: ${updatesText}. Returning updated device to clinic.`;

  const needsNewSerial = Array.from(document.querySelectorAll('input[name="ltlUpdates"]:checked'))
    .some(input => ["Replaced Device", "Replaced Case"].includes(input.value));
  if (needsNewSerial) {
    const newSerial = ltlUpdateNewSerialNumber?.value?.trim() || "Serial number not provided";
    note += `\n\nNew Device: ${newSerial}`;
  }

  return note;
}

/* ---------------- NOTE GENERATION ---------------- */

function buildCannedNote() {
  const first = sanitizeName(getFormValue("#firstName"));
  const last = sanitizeName(getFormValue("#lastName"));
  const deviceNum = getFormValue("#deviceNumberInput");
  const clampMount = getFormValue('input[name="clampMount"]');
  const rollingMount = getFormValue('input[name="rollingMount"]');
  const tableMount = getFormValue('input[name="tableMount"]');

  const fullName = [first, last].filter(Boolean).join(" ") || "Client";
  const isMountOnly = deviceNum.toLowerCase() === "x";
  const modelName = detectDeviceModel(deviceNum);

  if (isLtlUpdateFlow()) {
    return buildLtlUpdateNote({ fullName, modelName, deviceNum });
  }

  if (isMountOnly && !isLtlUpdateFlow()) {
    const vocabNotReturned = document.getElementById("vocabNotReturned")?.checked === true;
    const cameraNumber = getFormValue('input[name="cameraNumber"]');
    const luminNumber = getFormValue('input[name="luminNumber"]');
    const hasMounts = Boolean(clampMount || rollingMount || tableMount);
    const cameraIdentifiers = [cameraNumber, luminNumber].filter(Boolean);

    if (vocabNotReturned && !hasMounts && cameraIdentifiers.length) {
      return `Camera returned.\n\nCamera number: ${cameraIdentifiers.join(", ")}`;
    }

    return buildMountsReturnedOnlyNote();
  }

  const condition = getFormValue("#conditionSelect");
  const repairs = getFormValue("#repairsTextBox");

  const vocabLine = buildVocabLine();
  const accessoriesLine = buildAccessoriesLineIfAny();
  const updatesLine = buildLtlUpdatesLine();
  const updatesSuffix = updatesLine ? ` ${updatesLine}` : "";
  const mountsBlock = buildMountsBlockIfAny();
  const deviceId = buildDeviceIdentifier(deviceNum);

  if (condition === "Needs Repair") {
    return `${fullName}'s ${modelName} ${deviceId} was returned and needs repair (${repairs || "repairs needed not specified"}). ${vocabLine}${accessoriesLine}${updatesSuffix}${mountsBlock}`;
  }

  const conditionPhrase =
    condition === "Working" ? "working condition" :
      condition || "an unspecified condition";

  return `${fullName}'s ${modelName} ${deviceId} was returned in ${conditionPhrase}. ${vocabLine}${accessoriesLine}${updatesSuffix}${mountsBlock}`;
}

/* ---------------- CRM messaging helpers ---------------- */

async function sendToCrm(type, payload = {}) {
  const tabId = await getActiveCrmTabId();
  if (!tabId) return { ok: false };
  const res = await chrome.tabs.sendMessage(tabId, { type, ...payload }).catch(() => null);
  return res || { ok: false };
}

function buildLockDownNote(deviceNumber, date = new Date()) {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "2-digit", day: "2-digit", year: "2-digit"
  }).format(date);
  return `Pre Prep submitted the action to put the device (${deviceNumber}) into "Lost Mode" on *${formattedDate}*. We (Pre-Prep) will continue to check in on the device and update Director and Leads when it has gone from pending to complete this will happen as soon as said device is connected to WIFI. I have entered the following note to be displayed when Lost Mode has successfully gone through.\n\n"This device is durable medical equipment, property of Smartbox. If found, please contact 877-392-2299 ext.6 or trials.us@smartboxaac.com "`;
}

let lockDownEntrySequence = 0;

function renumberLockDownEntries() {
  document.querySelectorAll("#lockDownList .lock-down-entry").forEach((entry, index) => {
    const heading = entry.querySelector(".lock-down-entry__heading");
    if (heading) heading.textContent = `Lock down ${index + 1}`;
  });
}

function addLockDownEntry(values = {}) {
  const list = document.getElementById("lockDownList");
  if (!list) return null;

  lockDownEntrySequence += 1;
  const entryId = `lockDownEntry${lockDownEntrySequence}`;
  const crmInputId = `${entryId}CrmLink`;
  const deviceInputId = `${entryId}DeviceNumber`;
  const entry = document.createElement("section");
  entry.className = "lock-down-entry";
  entry.dataset.state = "ready";
  entry.innerHTML = `
    <h2 class="lock-down-entry__heading"></h2>
    <button type="button" class="toggle-btn lock-down-entry__remove" data-lock-down-remove>Remove</button>
    <label for="${crmInputId}">CRM link</label>
    <input type="url" id="${crmInputId}" data-lock-down-crm-link placeholder="https://portal.talktometechnologies.com/…" autocomplete="off" />
    <label for="${deviceInputId}">Device number</label>
    <input type="text" id="${deviceInputId}" data-lock-down-device-number placeholder="Enter device number" autocomplete="off" />
    <div class="status-line" data-lock-down-entry-status role="status" aria-live="polite"></div>
  `;
  entry.querySelector("[data-lock-down-crm-link]").value = values.crmLink || "";
  entry.querySelector("[data-lock-down-device-number]").value = values.deviceNumber || "";
  list.appendChild(entry);
  renumberLockDownEntries();
  return entry;
}

function setLockDownEntryStatus(entry, message, state) {
  entry.dataset.state = state;
  const status = entry.querySelector("[data-lock-down-entry-status]");
  if (status) status.textContent = message;
}

async function submitLockDownEntry(entry, request) {
  setLockDownEntryStatus(entry, `Opening CRM for device ${request.deviceNumber}…`, "running");
  try {
    const tab = await chrome.tabs.create({ url: request.crmLink, active: false });
    if (!tab?.id || !(await waitForTabToLoad(tab.id))) {
      throw new Error("The CRM page did not finish loading.");
    }

    const note = buildLockDownNote(request.deviceNumber);
    await sendToCrmTab(tab.id, "CLICK_BY_XPATH", { xpath: NOTES_TAB_XPATH });
    await new Promise(resolve => setTimeout(resolve, 400));
    const setNote = await sendToCrmTab(tab.id, "SET_CRM_NOTE", { xpath: NOTE_BOX_XPATH, noteText: note });
    if (!setNote.ok) throw new Error("The CRM note box could not be found.");
    const setCategory = await sendToCrmTab(tab.id, "SELECT_OPTION_BY_XPATH", {
      xpath: LOCK_DOWN_NOTE_CATEGORY_OPTION_XPATH
    });
    if (!setCategory.ok) throw new Error('The "Trials Operations" note category could not be selected.');
    const submitted = await sendToCrmTab(tab.id, "CLICK_BY_XPATH", { xpath: NOTE_SUBMIT_XPATH });
    if (!submitted.ok) throw new Error("The CRM note could not be submitted.");

    entry.querySelectorAll("input").forEach(input => { input.disabled = true; });
    setLockDownEntryStatus(entry, `Complete: Lost Mode note submitted for device ${request.deviceNumber}.`, "success");
    return true;
  } catch (error) {
    setLockDownEntryStatus(
      entry,
      error instanceof Error ? error.message : "Unable to submit the Lost Mode note.",
      "error"
    );
    return false;
  }
}

function normalizeCrmLink(value) {
  try {
    const url = new URL(`${value || ""}`.trim());
    return isCrmUrl(url.href) ? url.href : "";
  } catch {
    return "";
  }
}

function waitForTabToLoad(tabId, timeoutMs = 15000) {
  return new Promise(resolve => {
    let settled = false;
    const finish = success => {
      if (settled) return;
      settled = true;
      chrome.tabs.onUpdated.removeListener(listener);
      clearTimeout(timeout);
      resolve(success);
    };
    const listener = (updatedTabId, changeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === "complete") finish(true);
    };
    const timeout = setTimeout(() => finish(false), timeoutMs);
    chrome.tabs.onUpdated.addListener(listener);
    chrome.tabs.get(tabId).then(tab => {
      if (tab?.status === "complete") finish(true);
    }).catch(() => finish(false));
  });
}

async function sendToCrmTab(tabId, type, payload = {}) {
  const response = await chrome.tabs.sendMessage(tabId, { type, ...payload }).catch(() => null);
  return response || { ok: false };
}

async function uploadDocumentsToCrm(uploads) {
  if (!uploads?.length) return { ok: true };
  return sendToCrm("UPLOAD_CRM_DOCUMENTS", {
    uploads,
    xpaths: {
      fileInput: DOCUMENT_UPLOAD_INPUT_XPATH,
      uploadButton: DOCUMENT_UPLOAD_BUTTON_XPATH,
      uploadSuccessMessage: DOCUMENT_UPLOAD_SUCCESS_XPATH,
      documentTitle: DOCUMENT_TITLE_INPUT_XPATH,
      addButton: DOCUMENT_ADD_BUTTON_XPATH
    }
  });
}

/* ---------------- Inventory identifiers storage ---------------- */

function getCurrentIdentifiers() {
  return {
    deviceNumber: getFormValue("#deviceNumberInput"),
    cameraNumber: getFormValue('input[name="cameraNumber"]'),
    luminNumber: getFormValue('input[name="luminNumber"]')
  };
}

function saveLastIdentifiers(identifiers) {
  if (!chrome?.storage?.local) return Promise.resolve();
  return new Promise(resolve => {
    chrome.storage.local.set({ [IDENTIFIER_STORAGE_KEY]: identifiers }, resolve);
  });
}

function getLastIdentifiers() {
  if (!chrome?.storage?.local) return Promise.resolve({});
  return new Promise(resolve => {
    chrome.storage.local.get(IDENTIFIER_STORAGE_KEY, res => {
      resolve(res?.[IDENTIFIER_STORAGE_KEY] || {});
    });
  });
}

function collectCheckinFormDataForDaf() {
  const firstName = sanitizeName(getFormValue("#firstName"));
  const lastName = sanitizeName(getFormValue("#lastName"));

  return {
    deviceNumber: getFormValue("#deviceNumberInput"),
    cameraNumber: getFormValue('input[name="cameraNumber"]'),
    luminNumber: getFormValue('input[name="luminNumber"]'),
    crmId: getFormValue("#crmId"),
    firstName,
    lastName,
    aac: getFormValue("#aac"),
    clampMount: getFormValue('input[name="clampMount"]'),
    tableMount: getFormValue('input[name="tableMount"]'),
    rollingMount: getFormValue('input[name="rollingMount"]'),
    mountNotFoundNote: buildMountNotFoundNote(),
    isLtlUpdate: isLtlUpdateFlow()
  };
}

function saveLastCheckinDataForDaf(data) {
  if (!chrome?.storage?.local) return Promise.resolve();
  return new Promise(resolve => {
    chrome.storage.local.set({ [DAF_DATA_STORAGE_KEY]: data }, resolve);
  });
}

function getLastCheckinDataForDaf() {
  if (!chrome?.storage?.local) return Promise.resolve(null);
  return new Promise(resolve => {
    chrome.storage.local.get(DAF_DATA_STORAGE_KEY, res => {
      resolve(res?.[DAF_DATA_STORAGE_KEY] || null);
    });
  });
}

function clearStoredCheckinData() {
  if (!chrome?.storage?.local) return Promise.resolve();
  return new Promise(resolve => {
    chrome.storage.local.remove([IDENTIFIER_STORAGE_KEY, DAF_DATA_STORAGE_KEY], resolve);
  });
}

function buildInventorySearchValue({ deviceNumber = "", cameraNumber = "", luminNumber = "" } = {}) {
  return (cameraNumber || "").trim() || (luminNumber || "").trim() || (deviceNumber || "").trim() || "";
}

function buildDafRecapEntries(data) {
  if (!data) return [];

  const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ");
  const rawEntries = [
    { key: "deviceNumber", label: "Device", value: data.deviceNumber },
    { key: "cameraNumber", label: "Camera", value: data.cameraNumber },
    { key: "luminNumber", label: "Lumin-I", value: data.luminNumber },
    { key: "crmId", label: "CRM ID", value: data.crmId },
    { key: "clientName", label: "Client", value: fullName },
    { key: "aac", label: "AAC (copy only)", value: data.aac },
    { key: "clampMount", label: "Clamp Mount", value: data.clampMount },
    { key: "tableMount", label: "Table Mount", value: data.tableMount },
    { key: "rollingMount", label: "Rolling Mount", value: data.rollingMount }
  ];

  return rawEntries
    .map(entry => ({ ...entry, value: `${entry.value ?? ""}`.trim() }))
    .filter(entry => Boolean(entry.value));
}

const CRM_LINK_BASE = `${CRM_PRIMARY_ORIGIN}/admin/EditClient.aspx?ID=`;

function buildCrmLink(data) {
  const crmId = `${data?.crmId ?? ""}`.trim();
  if (!crmId) return "";
  return `${CRM_LINK_BASE}${crmId}`;
}

async function openCrmRecordTab(crmId) {
  const trimmedId = `${crmId || ""}`.trim();
  if (!trimmedId) return null;
  return chrome.tabs.create({
    url: `${CRM_LINK_BASE}${encodeURIComponent(trimmedId)}`
  });
}

function buildOutlookEmailPayload(data, { crmLink = "" } = {}) {
  const fullName = [data?.firstName, data?.lastName].filter(Boolean).join(" ").trim() || "Client";
  const subject = `${data?.aac || "AAC"} | ${fullName} Device Returned.`;
  const lines = [];
  lines.push(`${fullName} Device was returned.`);

  if (data?.deviceNumber) {
    lines.push(`Device: ${data.deviceNumber}`);
  }

  const hasExtraDetails = Boolean(
    data?.cameraNumber ||
    data?.luminNumber ||
    data?.clampMount ||
    data?.tableMount ||
    data?.rollingMount
  );

  if (hasExtraDetails) {
    lines.push("");
  }

  if (data?.cameraNumber) {
    lines.push(`Camera Number: ${data.cameraNumber}`);
  }

  if (data?.luminNumber) {
    lines.push(`Lumini: ${data.luminNumber}`);
  }

  if (data?.clampMount) {
    lines.push(`Clamp Mount: ${data.clampMount}`);
  }
  if (data?.tableMount) {
    lines.push(`Table Mount: ${data.tableMount}`);
  }
  if (data?.rollingMount) {
    lines.push(`Rolling Mount: ${data.rollingMount}`);
  }

  if (data?.mountNotFoundNote) {
    lines.push("", data.mountNotFoundNote);
  }

  if (crmLink) {
    lines.push("", crmLink);
  }

  const to = data?.mountNotFoundNote
    ? "trials.us@smartboxaac.com,trialsoperations.us@smartboxaac.com"
    : "trials.us@smartboxaac.com";
  const from = "trialsoperations.us@smartboxaac.com";
  return { subject, body: lines.join("\n"), to, from };
}

function buildOutlookComposeUrl(payload) {
  const params = {};
  if (payload?.to) params.to = payload.to;
  if (payload?.subject) params.subject = payload.subject;
  if (payload?.body) params.body = payload.body;
  const query = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
  return `${OUTLOOK_COMPOSE_BASE_URL}?${query}`;
}

function isOutlookComposeUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.pathname.includes("/mail/deeplink/compose");
  } catch {
    return false;
  }
}

async function handleOutlookComposeNavigationIssue(url) {
  if (outlookComposeNavigationLogged) return;
  outlookComposeNavigationLogged = true;
  const message = `Outlook compose deeplink failed to load. Opened: ${url || "(unknown URL)"}`;
  setText("emailStatus", "Outlook opened inbox instead of the drafted email. Use the copy/paste fallback below.");
  await logTaskOutcome("Checkin", message);
}

async function renderOutlookEmailPreview() {
  const data = await getLastCheckinDataForDaf();
  const crmLink = buildCrmLink(data);
  const payload = buildOutlookEmailPayload(data, { crmLink });
  setValue("emailSubjectField", payload.subject);
  setValue("emailBodyField", payload.body);
  setText("emailStatus", "");
  return payload;
}

async function openOutlookComposeEmail() {
  const data = await getLastCheckinDataForDaf();
  const crmLink = buildCrmLink(data);
  const payload = buildOutlookEmailPayload(data, { crmLink });
  const url = buildOutlookComposeUrl(payload);
  outlookComposeNavigationLogged = false;
  const tab = await chrome.tabs.create({ url });
  outlookEmailTabId = tab?.id ?? null;
}

async function finalizeCheckinCleanupAndCounters() {
  if (hasFinalizedCheckin) return;
  await incrementDailyCounter("checkins");
  hasFinalizedCheckin = true;
}

async function handleOutlookEmailTabClosed() {
  if (activeCheckinFlow !== CHECKIN_FLOW.CHECKIN) return;
  await finalizeCheckinCleanupAndCounters();
  await finishCheckinAndReset({ returnToLanding: true });
}

async function renderDafRecap() {
  const recapEl = document.getElementById("dafRecapFields");
  const emptyEl = document.getElementById("dafRecapEmpty");
  const statusEl = document.getElementById("dafRecapStatus");
  const data = await getLastCheckinDataForDaf();
  const entries = buildDafRecapEntries(data);

  if (recapEl) {
    recapEl.innerHTML = "";
    if (entries.length) {
      entries.forEach(entry => {
        const wrapper = document.createElement("div");
        wrapper.className = "daf-field";

        const labelEl = document.createElement("div");
        labelEl.className = "daf-field__label";
        labelEl.textContent = entry.label;

        const row = document.createElement("div");
        row.className = "copy-row";

        const valInput = document.createElement("input");
        valInput.type = "text";
        valInput.className = "copy-field";
        valInput.readOnly = true;
        valInput.value = entry.value || "";
        valInput.placeholder = "—";

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "copy-btn";
        btn.textContent = entry.value ? "Copy" : "No value";
        btn.dataset.copyValue = entry.value || "";
        btn.disabled = !entry.value;

        row.appendChild(valInput);
        row.appendChild(btn);

        wrapper.appendChild(labelEl);
        wrapper.appendChild(row);

        recapEl.appendChild(wrapper);
      });
    }
  }

  if (emptyEl) {
    emptyEl.style.display = entries.length ? "none" : "block";
    emptyEl.textContent = entries.length
      ? ""
      : "No check-in details saved. Submit a check-in to populate this page.";
  }

  if (statusEl) {
    statusEl.textContent = entries.length
      ? "Showing only fields that have values. Use Copy for anything you need to paste manually."
      : "No saved check-in found. Fill out the check-in form first.";
  }

  return data;
}

async function updateInventorySearchDisplay() {
  const identifiers = await getLastIdentifiers();
  const searchValue = buildInventorySearchValue(identifiers);
  const display = document.getElementById("inventorySearchValue");
  const status = document.getElementById("inventoryStatus");

  if (display) {
    display.textContent = searchValue ? `(${searchValue})` : "No stored identifiers. Fill out the first page first.";
  }
  if (status) {
    status.textContent = searchValue
      ? "Mark device as returned and Click Next step to continue your check- in"
      : "No stored identifiers. Fill out the first page first.";
  }

  return identifiers;
}

function watchIdentifierInputs() {
  const selectors = ["#deviceNumberInput", "input[name='cameraNumber']", "input[name='luminNumber']"];
  const handler = () => saveLastIdentifiers(getCurrentIdentifiers());
  selectors.forEach(sel => {
    document.querySelector(sel)?.addEventListener("input", handler);
  });
}

function isManageInventoryUrl(url) {
  return typeof url === "string" && url.includes("ManageInventory.aspx");
}

function isDafFormUrl(url) {
  return typeof url === "string"
    && (url.includes("smartboxassistivetnam.sharepoint.com/")
      || url.includes("talktometechnologies2com.sharepoint.com/"))
    && url.includes("listforms.aspx");
}

async function closeManageInventoryTabs(excludeTabId = null) {
  const tabs = await chrome.tabs.query({
    url: CRM_ORIGINS.map(origin => `${origin}/*ManageInventory.aspx*`)
  });
  const tabIds = tabs
    .map(tab => tab.id)
    .filter(tabId => typeof tabId === "number" && tabId !== excludeTabId);
  if (tabIds.length) {
    await chrome.tabs.remove(tabIds);
  }
}

async function syncViewForTab(tab) {
  if (!tab) return;
  const gridVisible = document.getElementById("gridView")?.style.display === "block";
  if (!isCheckinFlowActive() && !gridVisible) return;

  if (isDafFormUrl(tab.url)) {
    if (!isCheckinFlowActive()) return;
    await renderDafRecap();
    await closeManageInventoryTabs(tab.id);
    showDafView();
    return;
  }

  if (!isCrmUrl(tab.url)) return;

  if (isManageInventoryUrl(tab.url)) {
    if (!isCheckinFlowActive() || isLtlUpdateFlow()) return;
    showInventoryView();
    const identifiers = await updateInventorySearchDisplay();
    const status = document.getElementById("inventoryStatus");
    if (tab.id && inventoryAutomationLastRunTabId !== tab.id) {
      inventoryAutomationLastRunTabId = tab.id;
      if (status) status.textContent = "Running inventory automation...";
      const runRes = await chrome.tabs.sendMessage(tab.id, {
        type: "RUN_INVENTORY_SCRIPT",
        identifiers
      }).catch(() => ({ ok: false, message: "Unable to connect to the Manage Inventory tab." }));
      if (status) {
        status.textContent = runRes?.ok
          ? "Mark device as returned and Click Next step to continue your check- in"
          : `Inventory automation failed: ${runRes?.message || "Unknown error."}`;
      }
    }
    return;
  }

  const inventoryVisible = document.getElementById("inventoryView")?.style.display === "block";
  if (inventoryVisible) {
    showFormView();
  }

  const res = await fetchClientData(tab.id);
  if (res?.data) {
    if (isCheckinFlowActive()) {
      applyClientData(res.data);
    }
    if (gridVisible) {
      if (!isGridChangesLocked) {
        applyGridClientData(res.data);
        updateGridOutput();
      } else {
        updateGridOutput({ preserveTypedEmail: true });
      }
    }
  }
}

/* ---------------- Saved zip rename helpers ---------------- */

const WORKERS_BASE_PATH = "workers";
const CHECKIN_WORKER_PATH = `${WORKERS_BASE_PATH}/checkin-workflow-worker.js`;
let checkinWorkflowWorkerPromise = null;
let inventoryAutomationLastRunTabId = null;

function updateTrialFilesStatus(message, isError = false) {
  if (!trialFilesStatus) return;
  trialFilesStatus.textContent = message;
  trialFilesStatus.classList.toggle("error-text", isError);
}

function setRenameWorkflowProgress({ percent = 0, message = "", visible = false } = {}) {
  if (!renameWorkflowStatusBar || !renameWorkflowStatusFill || !renameWorkflowStatusText) return;
  const clampedPercent = Math.max(0, Math.min(100, Number(percent) || 0));
  renameWorkflowStatusFill.style.width = `${clampedPercent}%`;
  renameWorkflowStatusText.textContent = message || "";
  renameWorkflowStatusBar.style.display = visible ? "" : "none";
  renameWorkflowStatusText.style.display = visible ? "" : "none";
}

function createWorkerFromPath(path) {
  if (chrome?.runtime?.getURL) {
    return new Worker(chrome.runtime.getURL(path));
  }
  return new Worker(path);
}

function getCheckinWorkflowWorker() {
  if (!checkinWorkflowWorkerPromise) {
    checkinWorkflowWorkerPromise = Promise.resolve(createWorkerFromPath(CHECKIN_WORKER_PATH));
  }
  return checkinWorkflowWorkerPromise;
}

function runCheckinWorkflowTask(type, payload = {}) {
  return new Promise(async (resolve, reject) => {
    const worker = await getCheckinWorkflowWorker();
    const requestId = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const cleanup = () => {
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
    };

    const onMessage = event => {
      const data = event?.data || {};
      if (data.requestId !== requestId) return;
      cleanup();
      if (data.type === "WORKFLOW_ERROR") {
        reject(new Error(data.error || "Workflow worker failed."));
        return;
      }
      resolve(data.payload || {});
    };

    const onError = event => {
      cleanup();
      reject(new Error(event?.message || "Workflow worker crashed."));
    };

    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);
    worker.postMessage({ type, payload, requestId });
  });
}

async function runPrepFlowAction(action, payload = {}) {
  return runCheckinWorkflowTask("RUN_PREP_FLOW", { action, ...payload });
}

async function runQaFlowAction(action, payload = {}) {
  return runCheckinWorkflowTask("RUN_QA_FLOW", { action, ...payload });
}

function buildZipFilenameFromVocabTypes(vocabTypes = []) {
  const first = sanitizeName(getFormValue("#firstName"));
  const last = sanitizeName(getFormValue("#lastName"));
  const fullName = [first, last].filter(Boolean).join(" ") || "Client";
  const types = Array.isArray(vocabTypes) ? vocabTypes.filter(Boolean) : [];
  const saltilloTypes = new Set(["TC", "LAMP", "Dialogue"]);
  const normalizedTypes = [];
  let hasSaltillo = false;

  for (const type of types) {
    if (saltilloTypes.has(type)) {
      hasSaltillo = true;
      continue;
    }
    normalizedTypes.push(type);
  }

  if (hasSaltillo) {
    normalizedTypes.push("Saltillo");
  }
  const typeLabel = normalizedTypes.length ? normalizedTypes.join(", ") : "Vocab";
  return `${fullName} ${typeLabel} Vocab from Trial ${formatDateForFilename()}.zip`;
}

function stripZipExtension(filename = "") {
  return String(filename || "").replace(/\.zip$/i, "");
}

function findEntryNameIgnoreCase(entries, expectedName) {
  const target = (expectedName || "").toLowerCase();
  return entries.find(name => name.toLowerCase() === target) || null;
}

async function renameFileInFolder(folderHandle, entries, fromName, toName) {
  const sourceName = findEntryNameIgnoreCase(entries, fromName);
  if (!sourceName || !toName || sourceName === toName) {
    return false;
  }

  const sourceHandle = await folderHandle.getFileHandle(sourceName);
  const sourceFile = await sourceHandle.getFile();

  const existingTarget = findEntryNameIgnoreCase(entries, toName);
  if (existingTarget) {
    await folderHandle.removeEntry(existingTarget);
  }

  const targetHandle = await folderHandle.getFileHandle(toName, { create: true });
  const writable = await targetHandle.createWritable({ keepExistingData: false });
  await writable.write(sourceFile);
  await writable.close();
  await folderHandle.removeEntry(sourceName);
  return true;
}

async function renameSavedZipFilesForCheckin() {
  let checkinName = "";
  let gridName = "";
  const folderHandle = await loadTrialFilesFolderHandle().catch(() => null);
  if (!folderHandle) {
    updateTrialFilesStatus("No saved zips folder selected. Skipping zip rename.", true);
    return { renamed: [], skipped: ["folder-missing"], checkinName, gridName };
  }

  const permitted = await verifyFolderPermission(folderHandle, "readwrite");
  if (!permitted) {
    updateTrialFilesStatus("Saved zips folder access blocked. Re-authorize in settings.", true);
    return { renamed: [], skipped: ["permission-blocked"], checkinName, gridName };
  }

  const vocabNotReturned = document.getElementById("vocabNotReturned")?.checked === true;
  if (vocabNotReturned) {
    updateTrialFilesStatus("Vocab not returned selected. No zip rename needed.");
    return { renamed: [], skipped: ["vocab-not-returned"], checkinName, gridName };
  }

  const selectedVocabs = getSelectedVocabTypes();
  const nonGridVocabs = selectedVocabs.filter(type => type !== "Grid");
  const shouldRenameGridZip = selectedVocabs.includes("Grid");
  const entries = [];
  for await (const [name] of folderHandle.entries()) {
    entries.push(name);
  }

  const renamed = [];
  const skipped = [];

  if (nonGridVocabs.length) {
    checkinName = buildZipFilenameFromVocabTypes(nonGridVocabs);
    const didRename = await renameFileInFolder(folderHandle, entries, "Current Checkin.zip", checkinName);
    if (didRename) renamed.push(checkinName);
    else skipped.push("Current Checkin.zip");
  }

  if (shouldRenameGridZip) {
    gridName = buildZipFilenameFromVocabTypes(["Grid"]);
    const didRenameGrid = await renameFileInFolder(folderHandle, entries, "Current Grid user.zip", gridName);
    if (didRenameGrid) renamed.push(gridName);
    else skipped.push("Current Grid user.zip");
  }

  if (renamed.length) {
    updateTrialFilesStatus(`Renamed ${renamed.length} saved zip file(s).`);
  } else {
    updateTrialFilesStatus("No matching saved zip files found to rename.", true);
  }
  return { renamed, skipped, checkinName, gridName };
}

function renderRenamedFileCopyFields({ checkinName = "", gridName = "" } = {}) {
  const section = document.getElementById("renamedFilesCopySection");
  const rows = document.getElementById("renamedFilesCopyRows");
  if (!section || !rows) return;

  rows.innerHTML = "";
  const entries = [
    { label: "File 1", value: stripZipExtension((checkinName || "").trim()) },
    { label: "Grid file Name", value: stripZipExtension((gridName || "").trim()) }
  ].filter(entry => Boolean(entry.value));
  if (!entries.length) {
    section.style.display = "none";
    return;
  }

  entries.forEach((entry, index) => {
    const label = document.createElement("label");
    label.className = "copy-label";
    label.setAttribute("for", `renamedFileCopyField${index}`);
    label.textContent = entry.label;

    const row = document.createElement("div");
    row.className = "copy-row";

    const input = document.createElement("input");
    input.type = "text";
    input.id = `renamedFileCopyField${index}`;
    input.className = "copy-field";
    input.readOnly = true;
    input.value = entry.value;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "copy-btn";
    button.textContent = "Copy name";
    button.dataset.copyValue = entry.value;

    row.appendChild(input);
    row.appendChild(button);
    rows.appendChild(label);
    rows.appendChild(row);
  });

  section.style.display = "";
}

/* ---------------- Reset everything after success ---------------- */

function resetAllFieldsAndUI() {
  setValue("deviceNumberInput", "");
  setValue("firstName", "");
  setValue("lastName", "");
  setValue("aac", "");
  setValue("crmId", "");

  if (conditionSelect) {
    conditionSelect.value = "";
    conditionSelect.required = true;
  }

  const vocabNotReturned = document.getElementById("vocabNotReturned");
  if (vocabNotReturned) vocabNotReturned.checked = false;
  document.querySelectorAll('input[name="vocabTypes"]').forEach(input => {
    input.checked = false;
    input.disabled = false;
  });

  clearRepairsUI();
  clearLtlUpdates();

  const cameraLuminSection = document.getElementById("cameraLuminSection");
  const accessorySection = document.getElementById("accessorySection");
  if (cameraLuminSection) cameraLuminSection.style.display = "none";
  if (mountSection) mountSection.style.display = "none";
  if (accessorySection) accessorySection.style.display = "none";

  document.querySelectorAll(
    'input[name="cameraNumber"], input[name="luminNumber"], input[name="clampMount"], input[name="tableMount"], input[name="rollingMount"], input[name="accessories"]'
  ).forEach(el => el.value = "");

  if (conditionContainer) conditionContainer.style.display = "block";
  updateDeviceRules();

  const msg = document.getElementById("thankYouMessage");
  if (msg) msg.style.display = "none";

  setText("notePreviewText", "");
  setText("completeIntro", "");
  renderRenamedFileCopyFields({});
  updateTrialFilesStatus("Waiting to rename saved zip files.");
  setRenameWorkflowProgress();
  setText("inventoryStatus", "");
}

async function finishCheckinAndReset({ returnToLanding = false } = {}) {
  resetAllFieldsAndUI();
  hasFinalizedCheckin = false;
  smartboxRepairRequired = false;
  await clearStoredCheckinData();
  await updateInventorySearchDisplay();
  await renderDafRecap();
  if (returnToLanding) {
    clearActiveCheckinFlow();
  }
  if (returnToLanding) {
    showLandingView();
  } else {
    showFormView();
  }
}

/* ---------------- Submit: Check-in Device ---------------- */

document.getElementById("checkinForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) submitBtn.disabled = true;

  try {
    if (!hasValidVocabSelection()) {
      const message = "Select at least one vocab or check \"Vocab NOT returned\" before continuing.";
      alert(message);
      return;
    }

    const deviceNumber = getFormValue("#deviceNumberInput");
    const isMountOnly = deviceNumber.toLowerCase() === "x";
    setRenameWorkflowProgress({
      percent: 10,
      message: "Working: preparing saved zip rename…",
      visible: true
    });

    // 1) Rename the saved zip files generated outside Sidekick
    await refreshTrialFilesFromFolder();
    setRenameWorkflowProgress({
      percent: 35,
      message: "Working: renaming saved zip files…",
      visible: true
    });
    const renamedZipResult = await renameSavedZipFilesForCheckin();
    setRenameWorkflowProgress({
      percent: 65,
      message: "Working: updating CRM note and opening Documents tab…",
      visible: true
    });

    // 2) Build note + clipboard backup
    const note = buildCannedNote();
    await navigator.clipboard.writeText(note);

    const condition = getFormValue("#conditionSelect");
    smartboxRepairRequired = !isMountOnly
      && condition === "Needs Repair"
      && isSmartboxRepairModel(deviceNumber);

    // 2.5) Remember identifiers for the inventory page + DAF recap
    await saveLastIdentifiers(getCurrentIdentifiers());
    await saveLastCheckinDataForDaf(collectCheckinFormDataForDaf());

    // 3) Fill note in CRM
    const setNoteRes = await sendToCrm("SET_CRM_NOTE", { xpath: NOTE_BOX_XPATH, noteText: note });
    if (!setNoteRes.ok) {
      const message = "Failed to fill CRM note box.";
      alert(message);
      return;
    }

    // 4) Select category
    const isDeviceUpdated = isLtlUpdateFlow();
    const noteCategory = isDeviceUpdated ? "Device Updated" : "Device Returned";
    const setCatRes = await sendToCrm("SET_DROPDOWN_BY_TEXT", { xpath: NOTE_CATEGORY_XPATH, text: noteCategory });
    if (!setCatRes.ok) {
      const message = `Failed to select note category "${noteCategory}".`;
      alert(message);
      return;
    }

    // 5) Submit note
    const clickRes = await sendToCrm("CLICK_BY_XPATH", { xpath: NOTE_SUBMIT_XPATH });
    if (!clickRes.ok) {
      const message = "Failed to submit the note.";
      alert(message);
      return;
    }

    // ✅ SUCCESS
    resetAllFieldsAndUI();
    setText("notePreviewText", note);
    if (isMountOnly && !isLtlUpdateFlow()) {
      await renderDafRecap();
      showDafView();
      chrome.tabs.create({ url: INVENTORY_NEXT_STEP_URL });
      return;
    }

    await sendToCrm("CLICK_BY_XPATH", { xpath: DOCUMENTS_TAB_XPATH });
    setRenameWorkflowProgress({
      percent: 100,
      message: "Done: renamed files and opened Documents tab.",
      visible: true
    });
    const renamedSummary = renamedZipResult.renamed.length
      ? ` Renamed: ${renamedZipResult.renamed.join(" | ")}.`
      : " No matching Current Checkin.zip / Current Grid user.zip files were renamed.";
    const uploadMessage = `CRM note submitted. Upload your renamed zip file(s) to the Documents tab.${renamedSummary}`;
    setText("completeIntro", uploadMessage);
    renderRenamedFileCopyFields({
      checkinName: renamedZipResult.checkinName,
      gridName: renamedZipResult.gridName
    });
    showCompleteView();
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});

/* ---------------- Start another Checkin ---------------- */

document.getElementById("startAnotherBtn")?.addEventListener("click", async () => {
  await closeCheckinTabs();
  if (isLtlUpdateFlow()) {
    await renderDafRecap();
    showDafView();
    chrome.tabs.create({ url: INVENTORY_NEXT_STEP_URL });
    return;
  }
  if (smartboxRepairRequired) {
    showSmartboxRepairView();
    const tab = await chrome.tabs.create({ url: SMARTBOX_REPAIR_TRACKER_URL });
    smartboxRepairTabId = tab?.id ?? null;
    return;
  }
  chrome.tabs.create({ url: `${CRM_PRIMARY_ORIGIN}/admin/ManageInventory.aspx` });
});

document.getElementById("openSmartboxRepairBtn")?.addEventListener("click", async () => {
  const tab = await chrome.tabs.create({ url: SMARTBOX_REPAIR_TRACKER_URL });
  smartboxRepairTabId = tab?.id ?? null;
});

document.getElementById("smartboxContinueBtn")?.addEventListener("click", async () => {
  smartboxRepairRequired = false;
  if (smartboxRepairTabId) {
    try {
      await chrome.tabs.remove(smartboxRepairTabId);
    } catch (_) {
      // Tab may already be closed.
    }
    smartboxRepairTabId = null;
  }
  chrome.tabs.create({ url: `${CRM_PRIMARY_ORIGIN}/admin/ManageInventory.aspx` });
});

/* ---------------- Refresh ---------------- */

document.getElementById("refreshBtn")?.addEventListener("click", async () => {
  const res = await fetchClientData();
  if (res?.data) applyClientData(res.data);
});

chrome.runtime.onMessage.addListener(msg => {
  if (msg?.type === "CLIENT_DATA_CHANGED") applyClientData(msg.data);
});

/* ---------------- Inventory page ---------------- */

document.getElementById("inventoryNextStepBtn")?.addEventListener("click", async () => {
  await renderDafRecap();
  showDafView();
  chrome.tabs.create({ url: INVENTORY_NEXT_STEP_URL });
});

document.getElementById("finishCheckinBtn")?.addEventListener("click", async () => {
  if (isLtlUpdateFlow()) {
    await finalizeCheckinCleanupAndCounters();
    const dafTabId = await getActiveDafTabId();
    if (dafTabId) {
      await chrome.tabs.remove(dafTabId);
    }
    if (deviceLookupLastLtlRow) {
      ltlCompletionRowPayload = {
        rowNumber: deviceLookupLastLtlRow.rowNumber,
        rowText: deviceLookupLastLtlRow.rowText,
        rowValues: deviceLookupLastLtlRow.rowValues
      };
    } else {
      ltlCompletionRowPayload = null;
    }
    updateLtlCompletionDetails();
    showLtlCompletionView();
    return;
  }
  showEmailView();
  await finalizeCheckinCleanupAndCounters();
  await renderOutlookEmailPreview();
  const dafTabId = await getActiveDafTabId();
  if (dafTabId) {
    await chrome.tabs.remove(dafTabId);
  }
  try {
    await openOutlookComposeEmail();
  } catch {
    const message = "Unable to open Outlook compose deeplink. Use the copy/paste fallback fields.";
    setText("emailStatus", message);
    await logTaskOutcome("Checkin", message);
  }
});

ltlCompletionRunBtn?.addEventListener("click", async () => {
  if (!ltlCompletionRowPayload?.rowValues?.length) {
    const message = "No LTL row captured yet. Run a device lookup to capture the row before continuing.";
    alert(message);
    await logLtlUpdateOutcome(message);
    return;
  }
  if (ltlCompletionStatus) ltlCompletionStatus.textContent = "Opening workbook and preparing the paste...";
  const result = await openLtlWorkbookForCompletion(ltlCompletionRowPayload.rowValues);
  if (!result.ok) {
    const message = result.message || "Unable to complete the LTL update.";
    alert(message);
    if (ltlCompletionStatus) ltlCompletionStatus.textContent = message;
    await logLtlUpdateOutcome(message);
    return;
  }
  if (ltlCompletionStatus) {
    ltlCompletionStatus.textContent = "Workbook opened. The row is copied to your clipboard.";
  }
  await logLtlUpdateOutcome("LTL Update Completed successfully");
});

ltlCompletionReturnBtn?.addEventListener("click", async () => {
  ltlCompletionRowPayload = null;
  updateLtlCompletionDetails();
  await finishCheckinAndReset({ returnToLanding: true });
});

["gridFirstName", "gridLastName", "gridCrmId"].forEach(id => {
  document.getElementById(id)?.addEventListener("input", updateGridOutput);
});

document.querySelectorAll("input[name='gridType']").forEach(el => {
  el.addEventListener("change", () => updateGridOutput());
});

document.getElementById("gridEmailField")?.addEventListener("input", () => {
  updateGridOutput({ preserveTypedEmail: true });
});

document.getElementById("gridFullNameCopyBtn")?.addEventListener("click", async () => {
  const value = getFormValue("#gridFullNameField");
  if (!value) return;
  await navigator.clipboard.writeText(value);
  const btn = document.getElementById("gridFullNameCopyBtn");
  const status = document.getElementById("gridStatus");
  if (btn) {
    btn.textContent = "Copied!";
    setTimeout(() => {
      btn.textContent = "Copy";
    }, 1200);
  }
  if (status) status.textContent = "Client full name copied to clipboard.";
});

document.getElementById("gridEmailCopyBtn")?.addEventListener("click", async () => {
  const value = getFormValue("#gridEmailField");
  if (!value) return;
  await navigator.clipboard.writeText(value);
  const btn = document.getElementById("gridEmailCopyBtn");
  const status = document.getElementById("gridStatus");
  if (btn) {
    btn.textContent = "Copied!";
    setTimeout(() => {
      btn.textContent = "Copy";
    }, 1200);
  }
  if (status) status.textContent = "Grid email copied to clipboard.";
});

document.getElementById("gridPasswordCopyBtn")?.addEventListener("click", async () => {
  const value = getFormValue("#gridPasswordField");
  if (!value) return;
  await navigator.clipboard.writeText(value);
  const btn = document.getElementById("gridPasswordCopyBtn");
  const status = document.getElementById("gridStatus");
  if (btn) {
    btn.textContent = "Copied!";
    setTimeout(() => {
      btn.textContent = "Copy";
    }, 1200);
  }
  if (status) status.textContent = "Grid password copied to clipboard.";
});

document.getElementById("gridCrmInfoCopyBtn")?.addEventListener("click", async () => {
  const value = getFormValue("#gridCrmInfoField");
  if (!value) return;
  await navigator.clipboard.writeText(value);
  const btn = document.getElementById("gridCrmInfoCopyBtn");
  const status = document.getElementById("gridStatus");
  if (btn) {
    btn.textContent = "Copied!";
    setTimeout(() => {
      btn.textContent = "Copy";
    }, 1200);
  }
  if (status) status.textContent = "CRM Grid info copied to clipboard.";
});

document.getElementById("qaClientNameCopyBtn")?.addEventListener("click", async () => {
  const value = getFormValue("#qaClientNameField");
  if (!value) return;
  await navigator.clipboard.writeText(value);
  const btn = document.getElementById("qaClientNameCopyBtn");
  if (btn) {
    btn.textContent = "Copied!";
    setTimeout(() => {
      btn.textContent = "Copy name";
    }, 1200);
  }
});

document.getElementById("qaClientNameRefreshBtn")?.addEventListener("click", async () => {
  const tabId = await getActiveCrmTabId();
  await loadQaClientNameFromTab(tabId);
});

document.getElementById("qaCrmIdCopyBtn")?.addEventListener("click", async () => {
  const value = getFormValue("#qaCrmIdField");
  if (!value) return;
  await navigator.clipboard.writeText(value);
  const btn = document.getElementById("qaCrmIdCopyBtn");
  if (btn) {
    btn.textContent = "Copied!";
    setTimeout(() => {
      btn.textContent = "Copy CRM ID";
    }, 1200);
  }
});

document.getElementById("dafRecapFields")?.addEventListener("click", async (e) => {
  const btn = e.target.closest("button.copy-btn");
  if (!btn || !btn.dataset.copyValue) return;
  await navigator.clipboard.writeText(btn.dataset.copyValue);
  const original = btn.textContent;
  btn.textContent = "Copied!";
  setTimeout(() => { btn.textContent = original; }, 1200);
});

document.getElementById("renamedFilesCopyRows")?.addEventListener("click", async (e) => {
  const btn = e.target.closest("button.copy-btn");
  if (!btn || !btn.dataset.copyValue) return;
  await navigator.clipboard.writeText(btn.dataset.copyValue);
  const original = btn.textContent;
  btn.textContent = "Copied!";
  setTimeout(() => { btn.textContent = original; }, 1200);
});

document.getElementById("emailView")?.addEventListener("click", async (e) => {
  const btn = e.target.closest("button.copy-btn");
  if (!btn) return;
  const targetId = btn.dataset.copyTarget;
  if (!targetId) return;
  const field = document.getElementById(targetId);
  const value = field?.value || "";
  if (!value) return;
  await navigator.clipboard.writeText(value);
  const original = btn.textContent;
  btn.textContent = "Copied!";
  setTimeout(() => { btn.textContent = original; }, 1200);
});

const TIMECARD_WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function createDefaultTimecardWeek() {
  return TIMECARD_WEEKDAYS.reduce((week, day) => {
    week[day] = { in: "", out: "", notes: "" };
    return week;
  }, {});
}

async function getTimecardWeek() {
  const stored = await getStoredValue(TIMECARD_STORAGE_KEY);
  return { ...createDefaultTimecardWeek(), ...(stored && typeof stored === "object" ? stored : {}) };
}

async function saveTimecardWeek(week) {
  await setStoredValue(TIMECARD_STORAGE_KEY, week);
}

function formatTimecardDisplay(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function getCurrentTimecardDay() {
  const day = new Date().getDay();
  return TIMECARD_WEEKDAYS[day - 1] || "Monday";
}

function parseTimecardMinutes(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const match = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] || "0");
  const period = match[3]?.toUpperCase();
  if (minutes > 59 || hours > 23 || (period && (hours < 1 || hours > 12))) return null;
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return (hours * 60) + minutes;
}

function calculateTimecardHours(entry) {
  const inMinutes = parseTimecardMinutes(entry?.in);
  const outMinutes = parseTimecardMinutes(entry?.out);
  if (inMinutes === null || outMinutes === null) return 0;
  let minutes = outMinutes - inMinutes;
  if (minutes < 0) minutes += 24 * 60;
  return minutes / 60;
}

function escapeTimecardAttribute(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}


async function renderTimecardWeek() {
  const rows = document.getElementById("timecardWeekRows");
  if (!rows) return;
  const week = await getTimecardWeek();
  rows.innerHTML = "";
  let total = 0;
  TIMECARD_WEEKDAYS.forEach(day => {
    const entry = { in: "", out: "", notes: "", ...(week[day] || {}) };
    const hours = calculateTimecardHours(entry);
    total += hours;
    const row = document.createElement("div");
    row.className = "timecard-row";
    row.innerHTML = `
      <div class="timecard-row__day">${day}</div>
      <label>In <input type="text" inputmode="text" data-timecard-day="${day}" data-timecard-field="in" value="${escapeTimecardAttribute(entry.in)}" placeholder="8:00 AM"></label>
      <label>Out <input type="text" inputmode="text" data-timecard-day="${day}" data-timecard-field="out" value="${escapeTimecardAttribute(entry.out)}" placeholder="4:30 PM"></label>
      <label class="timecard-note">Note <input type="text" data-timecard-day="${day}" data-timecard-field="notes" value="${escapeTimecardAttribute(entry.notes)}" placeholder="Optional"></label>
      <div class="timecard-row__hours">${hours.toFixed(2)} hrs</div>
    `;
    rows.appendChild(row);
  });
  const totalEl = document.getElementById("timecardTotalHours");
  if (totalEl) totalEl.textContent = total.toFixed(2);
}

async function updateTimecardEntry(day, field, value) {
  const week = await getTimecardWeek();
  week[day] = { in: "", out: "", notes: "", ...(week[day] || {}), [field]: value };
  await saveTimecardWeek(week);
  await renderTimecardWeek();
}

async function setCurrentTimecardPunch(field) {
  const day = getCurrentTimecardDay();
  await updateTimecardEntry(day, field, formatTimecardDisplay());
  const status = document.getElementById("timecardStatus");
  if (status) status.textContent = `${field === "in" ? "Clocked in" : "Clocked out"} for ${day}.`;
}

/* ---------------- Init ---------------- */

(async function init() {
  watchIdentifierInputs();
  initSymojiPicker();
  await loadDeviceLookupWorkbooksFromStorage();
  isGridChangesLocked = Boolean(await getStoredValue(GRID_LOCK_CHANGES_STORAGE_KEY));
  updateGridLockButtonLabel();
  const profile = await getUserProfile();
  if (profile) {
    showLandingView();
  } else {
    showWelcomeView();
  }

  document.addEventListener("click", event => {
    const btn = event.target?.closest?.("[data-collapsible]");
    if (!btn) return;
    const key = btn.dataset.collapsible;
    if (!key) return;
    const landingLayout = document.getElementById("landingLayout");
    const section = btn.closest(".landing-section");
    const canAdjustLayout = landingLayout &&
      section &&
      landingLayout.contains(section) &&
      landingLayout.classList.contains("landing-layout--freeform");
    const anchorRect = canAdjustLayout ? section.getBoundingClientRect() : null;
    const isExpanded = btn.getAttribute("aria-expanded") === "true";
    setCollapsibleState(key, !isExpanded);
    if (canAdjustLayout && anchorRect) {
      requestAnimationFrame(() => {
        const nextRect = section.getBoundingClientRect();
        const deltaHeight = nextRect.height - anchorRect.height;
        void nudgeLandingLayoutForCollapsible(landingLayout, anchorRect, deltaHeight);
      });
    }
  });

  const landingView = document.getElementById("landingView");
  landingView?.addEventListener("click", event => {
    const button = event.target?.closest?.("button");
    if (!button || !landingView.contains(button)) return;
    triggerSurprisePartyThemeChange();
  });

  document.getElementById("startCheckinBtn")?.addEventListener("click", async () => {
    clearLookupLtlRow();
    resetMountReturnReview();
    closeMountReturnModal();
    setActiveCheckinFlow(CHECKIN_FLOW.CHECKIN);
    updateDeviceRules();
    showFormView();
    await refreshTrialFilesFromFolder();
    const activeTab = await getActiveCrmTab();
    await syncViewForTab(activeTab);
  });

  document.getElementById("startLtlUpdateBtn")?.addEventListener("click", async () => {
    clearLookupLtlRow();
    resetMountReturnReview();
    closeMountReturnModal();
    setActiveCheckinFlow(CHECKIN_FLOW.LTL_UPDATE);
    updateDeviceRules();
    showFormView();
    await refreshTrialFilesFromFolder();
    const activeTab = await getActiveCrmTab();
    await syncViewForTab(activeTab);
  });

  document.getElementById("clearDailyCountersBtn")?.addEventListener("click", async () => {
    await clearDailyCounters();
  });

  document.getElementById("clearWeeklyCountersBtn")?.addEventListener("click", async () => {
    await clearWeeklyCounters();
  });

  document.getElementById("toggleDailyCounterBtn")?.addEventListener("click", async () => {
    const collapsed = await getDailyCounterCollapsed();
    const nextCollapsed = !collapsed;
    await setDailyCounterCollapsed(nextCollapsed);
    applyCounterCollapseState(
      { toggleId: "toggleDailyCounterBtn", contentId: "dailyCounterContent" },
      nextCollapsed
    );
    if (!nextCollapsed) {
      await refreshDailyCounters();
    }
  });

  document.getElementById("toggleWeeklyCounterBtn")?.addEventListener("click", async () => {
    const collapsed = await getWeeklyCounterCollapsed();
    const nextCollapsed = !collapsed;
    await setWeeklyCounterCollapsed(nextCollapsed);
    applyCounterCollapseState(
      { toggleId: "toggleWeeklyCounterBtn", contentId: "weeklyCounterContent" },
      nextCollapsed
    );
    if (!nextCollapsed) {
      await refreshWeeklyCounters();
    }
  });

  document.querySelectorAll("[data-counter][data-delta]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const counterKey = btn.dataset.counter;
      const delta = Number.parseInt(btn.dataset.delta || "0", 10);
      if (!counterKey || Number.isNaN(delta)) return;
      await adjustDailyCounter(counterKey, delta);
    });
  });

  document.querySelectorAll("[data-weekly-delta]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const delta = Number.parseInt(btn.dataset.weeklyDelta || "0", 10);
      if (Number.isNaN(delta)) return;
      await adjustWeeklyCounterByDelta(delta);
    });
  });

  document.getElementById("weeklyDaysWorkedInput")?.addEventListener("input", async event => {
    const days = normalizeWeeklyAverageDays(event.target.value);
    await setWeeklyAverageDaysWorked(days);
    await updateWeeklyAverageDisplay(await getWeeklyCounterTotal());
  });

  document.getElementById("gridSidekickBtn")?.addEventListener("click", async () => {
    const result = await runPrepFlowAction("OPEN_GRID_SIDEKICK");
    if (result?.status === "error") {
      alert(result.message || "Unable to open Grid Sidekick.");
      return;
    }
    hasStartedGrid = true;
    showGridView();
    const activeTab = await getActiveCrmTab();
    await syncViewForTab(activeTab);
  });

  document.getElementById("ageCalculatorBtn")?.addEventListener("click", () => {
    showAgeCalculatorView();
  });

  document.getElementById("talkPadPrepBtn")?.addEventListener("click", async () => {
    const result = await runPrepFlowAction("OPEN_TALKPAD_PREP");
    if (result?.status === "error") {
      alert(result.message || "Unable to open TalkPad prep.");
      return;
    }
    showPrepTypeView();
  });

  document.getElementById("gridPadPrepBtn")?.addEventListener("click", async () => {
    const result = await runPrepFlowAction("OPEN_GRIDPAD_PREP");
    if (result?.status === "error") {
      alert(result.message || "Unable to open GridPad prep.");
      return;
    }
    showGridPadPrepView();
  });

  document.getElementById("prepTypeSlBtn")?.addEventListener("click", async () => {
    const result = await runPrepFlowAction("PREP_TYPE_SERVICE_LOAN");
    if (result?.status === "error") {
      alert(result.message || "Unable to open Service Loan prep.");
      return;
    }
    showPrepSlCrmView();
  });

  document.getElementById("prepTypeClBtn")?.addEventListener("click", async () => {
    const result = await runPrepFlowAction("PREP_TYPE_STANDARD");
    if (result?.status === "error") {
      alert(result.message || "Unable to open prep checklist.");
      return;
    }
    showPrepView({ variant: "standard" });
  });

  document.getElementById("prepTypeReturnBtn")?.addEventListener("click", async () => {
    const result = await runPrepFlowAction("PREP_TYPE_RETURN_TO_LANDING");
    if (result?.status === "error") {
      alert(result.message || "Unable to return to landing.");
      return;
    }
    showLandingView();
  });

  document.getElementById("prepSlCrmReturnBtn")?.addEventListener("click", async () => {
    const result = await runPrepFlowAction("PREP_SL_RETURN_TO_TYPE");
    if (result?.status === "error") {
      alert(result.message || "Unable to return to prep type.");
      return;
    }
    showPrepTypeView();
  });

  document.getElementById("prepSlCrmForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const crmInput = document.getElementById("prepSlCrmInput");
    const result = await runPrepFlowAction("PREP_SL_SUBMIT_CRM", {
      crmId: (crmInput?.value || "").trim()
    });
    if (result?.status === "error") {
      alert(result.message || "Enter a CRM ID to continue.");
      return;
    }
    openCrmRecordTab(result.crmId);
    if (crmInput) crmInput.value = "";
    showPrepView({ variant: "serviceLoan" });
  });

  document.getElementById("settingsReturnBtn")?.addEventListener("click", () => {
    showLandingView();
  });

  document.getElementById("editUserProfileBtn")?.addEventListener("click", () => {
    showOnboardingView();
  });

  document.getElementById("landingCornerSymojiBtn")?.addEventListener("click", () => {
    openSymojiPicker({
      title: "Choose a corner Symoji",
      hint: "Pick a Symoji to show in the landing corner.",
      onSelect: async src => {
        await saveCornerSymoji(src);
        updateCornerSymoji(src);
      }
    });
  });

  document.getElementById("welcomeContinueBtn")?.addEventListener("click", () => {
    showOnboardingView();
  });

  document.getElementById("deviceLookupBtn")?.addEventListener("click", async () => {
    showDeviceLookupView();
    await refreshDeviceLookupWorkbooksFromHandles();
  });

  document.getElementById("prePrepSidekickBtn")?.addEventListener("click", async () => {
    if (!(await getPrePrepSidekickEnabled())) {
      alert("Enable Pre-prep Sidekick in user settings first.");
      await refreshPrePrepSidekickEnabled();
      return;
    }
    showPrePrepView();
    renderPrePrepRows();
  });

  document.getElementById("lockDownSidekickBtn")?.addEventListener("click", async () => {
    if (!(await getPrePrepSidekickEnabled())) {
      alert("Enable Pre-prep Sidekick in user settings first.");
      await refreshPrePrepSidekickEnabled();
      return;
    }
    setText("lockDownStatus", "");
    if (!document.querySelector("#lockDownList .lock-down-entry")) addLockDownEntry();
    showLockDownView();
  });

  document.getElementById("qaFormBtn")?.addEventListener("click", async () => {
    const result = await runQaFlowAction("OPEN_QA_FORM");
    if (result?.status === "error") {
      alert(result.message || "Unable to start QA flow.");
      return;
    }
    if (result.openQaForm) {
      chrome.tabs.create({ url: QA_FORM_URL }, tab => {
        qaFormTabId = tab?.id ?? null;
      });
    }
    showQaCompleteView();
  });

  document.getElementById("qaFinishedBtn")?.addEventListener("click", async () => {
    const result = await runQaFlowAction("QA_FINISH");
    if (result?.status === "error") {
      alert(result.message || "Unable to finish QA flow.");
      return;
    }
    if (result.incrementCounter) {
      await incrementDailyCounter(result.incrementCounter);
    }
    if (result.logTask) {
      await logTaskOutcome(result.logTask, "Completed successfully");
    }
    if (result.closeQaForm) closeQaFormTab();
    if (result.resetQaFields) resetQaCompleteFields();
    showLandingView();
  });

  document.getElementById("qaReturnBtn")?.addEventListener("click", async () => {
    const result = await runQaFlowAction("QA_RETURN");
    if (result?.status === "error") {
      alert(result.message || "Unable to exit QA flow.");
      return;
    }
    if (result.closeQaForm) closeQaFormTab();
    if (result.resetQaFields) resetQaCompleteFields();
    showLandingView();
  });

  document.getElementById("appOverridesBtn")?.addEventListener("click", () => {
    showAppOverridesView();
  });

  function openIpadScannablePopup({ windowName, title, code, appName }) {
    const popup = window.open("", windowName, "width=700,height=500");
    if (!popup) {
      alert(`Unable to open the ${appName} code window. Please allow pop-ups and try again.`);
      return;
    }
    popup.document.title = title;
    popup.document.body.style.margin = "0";
    popup.document.body.style.display = "flex";
    popup.document.body.style.alignItems = "center";
    popup.document.body.style.justifyContent = "center";
    popup.document.body.style.fontFamily = "Arial, sans-serif";
    popup.document.body.style.fontSize = "120px";
    popup.document.body.style.fontWeight = "700";
    popup.document.body.textContent = code;
    popup.focus();
  }

  document.getElementById("touchchatOverrideBtn")?.addEventListener("click", () => {
    openIpadScannablePopup({
      windowName: "touchchatOverrideCode",
      title: "Touchchat iPad Scannable Text",
      code: "72584556",
      appName: "Touchchat"
    });
  });

  document.getElementById("p2gOverrideBtn")?.addEventListener("click", () => {
    openIpadScannablePopup({
      windowName: "p2gOverrideCode",
      title: "P2G iPad Scannable Text",
      code: "vygh-phi-rhy-mo",
      appName: "P2G"
    });
  });

  document.getElementById("kgRequestsBtn")?.addEventListener("click", () => {
    chrome.tabs.create({ url: KG_REQUESTS_URL });
  });

  document.getElementById("timecardSidekickBtn")?.addEventListener("click", () => {
    showTimecardView();
  });

  document.getElementById("timecardClockInBtn")?.addEventListener("click", () => {
    void setCurrentTimecardPunch("in");
  });

  document.getElementById("timecardClockOutBtn")?.addEventListener("click", () => {
    void setCurrentTimecardPunch("out");
  });

  document.getElementById("timecardOpenAdpBtn")?.addEventListener("click", () => {
    chrome.tabs.create({ url: ADP_SIGNIN_URL });
  });

  document.getElementById("timecardClearWeekBtn")?.addEventListener("click", async () => {
    if (!confirm("Clear this week's timecard hours?")) return;
    await saveTimecardWeek(createDefaultTimecardWeek());
    await renderTimecardWeek();
  });

  document.getElementById("timecardReturnBtn")?.addEventListener("click", () => {
    showLandingView();
  });

  document.getElementById("timecardWeekRows")?.addEventListener("change", async event => {
    const input = event.target;
    const day = input?.dataset?.timecardDay;
    const field = input?.dataset?.timecardField;
    if (!day || !field) return;
    await updateTimecardEntry(day, field, input.value || "");
  });


  document.getElementById("landingCrmNavigatorForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const crmInput = document.getElementById("landingCrmNavigatorInput");
    const crmId = (crmInput?.value || "").trim();
    if (!crmId) {
      alert("Enter a CRM ID to continue.");
      return;
    }
    openCrmRecordTab(crmId);
    if (crmInput) crmInput.value = "";
  });

  document.getElementById("qaCrmNavigatorForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const crmInput = document.getElementById("qaCrmNavigatorInput");
    const result = await runQaFlowAction("QA_NAVIGATE_CRM", {
      crmId: (crmInput?.value || "").trim()
    });
    if (result?.status === "error") {
      alert(result.message || "Enter a CRM ID to continue.");
      return;
    }
    updateQaCrmIdCopy({ crmId: result.crmId });
    const tab = await openCrmRecordTab(result.crmId);
    void loadQaClientNameFromTab(tab?.id ?? null);
    if (crmInput) crmInput.value = "";
  });

  document.getElementById("deviceLookupReturnBtn")?.addEventListener("click", () => {
    showLandingView();
  });

  document.getElementById("prePrepReturnBtn")?.addEventListener("click", () => {
    showLandingView();
  });

  document.getElementById("lockDownReturnBtn")?.addEventListener("click", () => {
    showLandingView();
  });

  document.getElementById("lockDownAddBtn")?.addEventListener("click", () => {
    const entry = addLockDownEntry();
    entry?.querySelector("[data-lock-down-crm-link]")?.focus();
  });

  document.getElementById("lockDownList")?.addEventListener("click", event => {
    const removeButton = event.target.closest("[data-lock-down-remove]");
    if (!removeButton) return;
    removeButton.closest(".lock-down-entry")?.remove();
    if (!document.querySelector("#lockDownList .lock-down-entry")) addLockDownEntry();
    renumberLockDownEntries();
  });

  document.getElementById("lockDownForm")?.addEventListener("submit", async event => {
    event.preventDefault();
    const submitButton = document.getElementById("lockDownSubmitBtn");
    const pendingEntries = [...document.querySelectorAll("#lockDownList .lock-down-entry")]
      .filter(entry => entry.dataset.state !== "success");
    const requests = [];

    pendingEntries.forEach(entry => {
      const crmLink = normalizeCrmLink(entry.querySelector("[data-lock-down-crm-link]")?.value);
      const deviceNumber = `${entry.querySelector("[data-lock-down-device-number]")?.value || ""}`.trim();
      if (!crmLink || !deviceNumber) {
        const message = !crmLink
          ? "Enter a valid Talk To Me Technologies CRM link for this device."
          : "Enter a device number for this CRM link.";
        setLockDownEntryStatus(entry, message, "error");
        return;
      }
      requests.push({ entry, crmLink, deviceNumber });
    });

    if (!requests.length) {
      const message = pendingEntries.length
        ? "Fix the highlighted request before submitting."
        : "All listed lock downs have already been submitted. Add another device to continue.";
      setText("lockDownStatus", message);
      return;
    }

    if (submitButton) submitButton.disabled = true;
    setText("lockDownStatus", `Submitting ${requests.length} lock down${requests.length === 1 ? "" : "s"}…`);
    const results = await Promise.all(requests.map(({ entry, ...request }) => submitLockDownEntry(entry, request)));
    const completed = results.filter(Boolean).length;
    const failed = results.length - completed;
    setText(
      "lockDownStatus",
      failed
        ? `${completed} completed; ${failed} failed. Review each request below and submit again to retry failures.`
        : `${completed} lock down${completed === 1 ? "" : "s"} completed successfully.`
    );
    if (submitButton) submitButton.disabled = false;
  });

  document.getElementById("appOverridesReturnBtn")?.addEventListener("click", () => {
    showLandingView();
  });

  document.getElementById("prepReturnBtn")?.addEventListener("click", () => {
    showLandingView();
  });

  document.getElementById("prepReorderBtn")?.addEventListener("click", () => {
    showPrepChecklistOrderView();
  });

  document.getElementById("prepOrderReturnBtn")?.addEventListener("click", () => {
    showPrepView({ variant: prepChecklistVariant });
  });

  document.getElementById("prepOrderSaveBtn")?.addEventListener("click", async () => {
    if (!prepChecklistOrderDraft.length) {
      prepChecklistOrderDraft = getPrepChecklistCategoryIds();
    }
    await setStoredValue(PREP_CHECKLIST_ORDER_STORAGE_KEY, prepChecklistOrderDraft);
    showPrepView({ variant: prepChecklistVariant });
  });

  document.getElementById("prepFinishBtn")?.addEventListener("click", async () => {
    const result = await runPrepFlowAction("PREP_FINISH");
    if (result?.status === "error") {
      alert(result.message || "Unable to finish prep.");
      return;
    }
    if (result.incrementCounter) {
      await incrementDailyCounter(result.incrementCounter);
    }
    if (result.logTask) {
      await logTaskOutcome(result.logTask, "Completed successfully");
    }
    clearPrepChecklist();
    showLandingView();
  });

  document.getElementById("gridPadPrepReturnBtn")?.addEventListener("click", () => {
    showLandingView();
  });

  document.getElementById("gridPadPrepReorderBtn")?.addEventListener("click", () => {
    showGridPadChecklistOrderView();
  });

  document.getElementById("gridPadOrderReturnBtn")?.addEventListener("click", () => {
    showGridPadPrepView();
  });

  document.getElementById("gridPadOrderSaveBtn")?.addEventListener("click", async () => {
    if (!gridPadChecklistOrderDraft.length) {
      gridPadChecklistOrderDraft = getGridPadChecklistCategoryIds();
    }
    await setStoredValue(GRIDPAD_CHECKLIST_ORDER_STORAGE_KEY, gridPadChecklistOrderDraft);
    showGridPadPrepView();
  });

  document.getElementById("gridPadPrepFinishBtn")?.addEventListener("click", async () => {
    const result = await runPrepFlowAction("GRIDPAD_PREP_FINISH");
    if (result?.status === "error") {
      alert(result.message || "Unable to finish GridPad prep.");
      return;
    }
    if (result.incrementCounter) {
      await incrementDailyCounter(result.incrementCounter);
    }
    if (result.logTask) {
      await logTaskOutcome(result.logTask, "Completed successfully");
    }
    clearGridPadChecklist();
    showLandingView();
  });

  document.getElementById("ageCalculatorReturnBtn")?.addEventListener("click", () => {
    showLandingView();
  });

  document.getElementById("ageCalculatorForm")?.addEventListener("submit", event => {
    event.preventDefault();
    const input = document.getElementById("ageBirthdateInput");
    const result = document.getElementById("ageCalculatorResult");
    if (!input || !result) return;
    const calculation = calculateAgeYearsFromInput((input.value || "").trim());
    if (calculation.error) {
      result.textContent = calculation.error;
      return;
    }
    result.textContent = `This person is ${calculation.ageYears} year${calculation.ageYears === 1 ? "" : "s"} old.`;
  });

  document.getElementById("deviceLookupForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = document.getElementById("deviceLookupInput");
    const raw = (input?.value || "").trim();
    if (!raw) {
      alert("Enter a device serial number to continue.");
      return;
    }
    await runDeviceLookupSearch(raw);
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
  });

  document.getElementById("prePrepClearBtn")?.addEventListener("click", () => {
    if (!prePrepRows.length || confirm("Clear the pre-prep list?")) {
      clearPrePrepRows();
    }
  });

  document.getElementById("mountReturnConfirmBtn")?.addEventListener("click", confirmMountReturnSelection);

  document.querySelectorAll("[data-workbook-connect]").forEach(button => {
    button.addEventListener("click", () => {
      const targetKey = button.dataset.workbookConnect;
      if (!targetKey) return;
      void connectDeviceLookupWorkbook(targetKey);
    });
  });

  document.querySelectorAll("[data-workbook-open]").forEach(button => {
    button.addEventListener("click", () => {
      const targetKey = button.dataset.workbookOpen;
      if (!targetKey) return;
      const url = DEVICE_LOOKUP_WORKBOOK_WEB_URLS[targetKey];
      if (!url) return;
      chrome.tabs.create({ url });
    });
  });

  [
    "copyDeviceSnBtn",
    "copyCameraSnBtn",
    "copyLuminSnBtn",
    "copyEvoSnBtn",
    "copyCrmBtn",
    "copyClampBtn",
    "copyTableBtn",
    "copyRollingBtn"
  ].forEach(buttonId => {
    document.getElementById(buttonId)?.addEventListener("click", async event => {
      const value = event.currentTarget?.dataset?.copyValue || "";
      const status = document.getElementById("lookupCopyStatus");
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        if (status) status.textContent = "Copied to clipboard.";
      } catch (error) {
        if (status) status.textContent = "Copy failed. Try again.";
      }
      if (status) {
        setTimeout(() => {
          status.textContent = "";
        }, 1500);
      }
    });
  });

  document.getElementById("lookupOpenCrmBtn")?.addEventListener("click", () => {
    if (!deviceLookupLastSerial) {
      alert("Search for a device to continue.");
      return;
    }
    if (!deviceLookupLastCrmId) {
      alert("No CRM ID found for this device.");
      return;
    }
    chrome.tabs.create({
      url: `${CRM_PRIMARY_ORIGIN}/Admin/EditClient.aspx?ID=${encodeURIComponent(deviceLookupLastCrmId)}`
    });
    setActiveCheckinFlow(CHECKIN_FLOW.CHECKIN);
    showFormView();
    setValue("deviceNumberInput", deviceLookupLastSerial);
    updateDeviceRules();
    applyLookupAutofillToCheckin();
  });

  document.getElementById("lookupBeginLtlUpdateBtn")?.addEventListener("click", async () => {
    if (!deviceLookupLastSerial) {
      alert("Search for a device to continue.");
      return;
    }
    setActiveCheckinFlow(CHECKIN_FLOW.LTL_UPDATE);
    updateDeviceRules();
    showFormView();
    setValue("deviceNumberInput", deviceLookupLastSerial);
    updateLtlUpdateRowSection();
    await refreshTrialFilesFromFolder();
    if (!deviceLookupLastCrmId) {
      alert("No CRM ID found for this device.");
      return;
    }
    await openCrmRecordTab(deviceLookupLastCrmId);
  });

  document.getElementById("lookupOpenWorkbookBtn")?.addEventListener("click", () => {
    chrome.tabs.create({ url: deviceLookupLastSheetLink || DEVICE_LOOKUP_EXCEL_WEB_URL });
  });

  document.getElementById("gridReturnBtn")?.addEventListener("click", () => {
    hasStartedGrid = false;
    showLandingView();
  });

  document.getElementById("gridRefreshBtn")?.addEventListener("click", async () => {
    const activeTab = await getActiveCrmTab();
    await refreshGridClientData(activeTab?.id || null);
  });

  document.getElementById("gridLockChangesBtn")?.addEventListener("click", async () => {
    isGridChangesLocked = !isGridChangesLocked;
    await setStoredValue(GRID_LOCK_CHANGES_STORAGE_KEY, isGridChangesLocked);
    updateGridLockButtonLabel();
    updateGridOutput({ preserveTypedEmail: true });
  });


document.getElementById("gridRegisterLicenseBtn")?.addEventListener("click", () => {
    chrome.tabs.create({ url: GRID_LICENSE_REGISTRATION_URL });
  });

  document.getElementById("returnToLandingBtn")?.addEventListener("click", () => {
    clearActiveCheckinFlow();
    showLandingView();
  });

  const activeTab = await getActiveCrmTab();
  await syncViewForTab(activeTab);
  resetLookupCopyButtons();

  chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    const tab = await chrome.tabs.get(tabId).catch(() => null);
    await syncViewForTab(tab);
  });

  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (tab?.active && changeInfo?.status === "complete") {
      await syncViewForTab(tab);
    }
    if (tabId === outlookEmailTabId && changeInfo?.status === "complete" && !isOutlookComposeUrl(tab?.url || "")) {
      await handleOutlookComposeNavigationIssue(tab?.url || "");
    }
  });

  chrome.tabs.onRemoved.addListener(async (tabId) => {
    if (tabId === smartboxRepairTabId) {
      smartboxRepairTabId = null;
    }
    if (tabId !== outlookEmailTabId) return;
    outlookEmailTabId = null;
    await handleOutlookEmailTabClosed();
  });
})();
