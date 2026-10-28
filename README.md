# Trials Check-in Sidekick

## Audit serial and category lookup (3.0.8)

For Device Systems Coordinators, scanning a device now looks up its internal serial and category in **Audit.xlsm**, using the saved **query** worksheet values in columns A (TTMT Serial Number), B (Title/internal serial), and D (Device Type). Sidekick downloads the shared SharePoint workbook with a read-only GET, caches the lookup locally, and fills blank internal serial and category fields after a unique match. Column D mappings include Talk Pad 10 / Wego 10 / Wego 10s → Talkpad 10, Talk Pad 8 / Wego 7 → Talkpad 8, Wego 13 / Wego 13a → Wego 13, and Wego 5 / Wego 5a → Wego 5. It does not edit the workbook, refresh Excel queries, or run its macros. Existing manual entries and completed or locked rows are preserved. Unknown or conflicting categories stay blank for manual selection. An older serial-only cache is refreshed automatically to load column D.

The lookup refreshes every Wednesday at **5:00 AM America/Chicago time**, including daylight saving changes. If the browser is closed or asleep, it catches up when available or on the next lookup. Failed downloads keep the last successful cache with a visible warning and retry after 15 minutes. **Refresh serial lookup** fetches on demand. Sign in to SharePoint using the workbook link if necessary. **Use Audit file** lets a user read their own synced Audit.xlsm if SharePoint access is unavailable; the selected file is never written. This uses the shared workbook URL rather than a path containing a particular Windows username.

## Device Sidekick profile categories and progress (3.0.7)

Device Systems Coordinators can choose a **Device category** for each internal serial, then click **Begin Adding Profiles**. Sidekick searches Intune, opens the matching device, verifies the displayed serial, opens **Properties → Edit**, selects the exact category, and clicks **Next → Save**. It then returns through **Devices | All devices**, clears the device search with its X button, marks **Profile added**, and continues to the next unmarked device. A missing category or an unsuccessful step stops the sequence; correct the row or complete the category manually before restarting.

| Sidekick choice | Intune device category |
| --- | --- |
| Talkpad 10 | Wego TalkPad 10 |
| Talkpad 8 | Wego TalkPad 8 |
| Wego 13 | Wego 13a |
| Wego 5 | Wego 5a |

**Wiped** and **Profile added** can each be checked or unchecked manually and are saved independently with the current device draft. **Begin Wipe** skips devices marked Wiped; **Begin Adding Profiles** skips devices marked Profile added. Changing an internal serial clears both markers; changing its category clears Profile added. Category selection respects Lock edits, while completion checkboxes remain editable.

Reload the updated extension and allow access to **intune.microsoft.com** as well as Entra and the embedded device pages. The category workflow submits changes to Intune; check Intune if a save fails or the sequence stops. Desktop Zipper is unchanged.

## Device Sidekick wipe workflow (3.0.6)

Device Sidekick now focuses on wiping devices. Device Systems Coordinators can use **Begin Wipe** to find a listed internal serial in Entra, open the matching device, remove the supported AAC apps, and revoke licenses. Sidekick asks **Continue to wipe?** before sending the wipe request, then asks whether the wipe went through. Choosing No stops automation with manual completion instructions.

After confirmation, Sidekick opens **Devices | All devices** and reminds the user to delete the device manually. **Next device** starts the next unfinished internal serial after the user deletes the device and returns to the main device page. Completed rows show **Wiped**; the last device offers only **Close**. Sidekick does not perform the final device deletion.

Enable **Internal serial only** to hide scanning and device serial fields and add internal serials directly with **Add device** or Enter. Turning it off restores scanned-device entry without clearing existing rows. The setting and completion markers stay with the current device draft. Prep mode and its CRM/GIPOD fields have been removed from Device Sidekick.

Reload the extension after updating, and allow access to Entra and its embedded device pages. No Desktop Zipper update is required.

Trials Check-in Sidekick is a lightweight browser extension that streamlines participant check-ins and session tracking. It focuses on fast, reliable workflows for coordinators without exposing internal URLs or system links.

## Key Features

- **Fast check-in workflow**: Capture attendance quickly with a clear, focused interface.
- **Session awareness**: Keep track of active sessions and participant status at a glance.
- **Validation safeguards**: Prevent incomplete submissions with basic input checks and prompts.
- **In-context panel**: Operate from a dedicated side panel while staying on the current page.
- **Lightweight and responsive**: Minimal footprint for smooth performance.

## Core Functions

- **Open side panel** to manage check-ins without navigating away.
- **Record participant status** with a consistent, repeatable flow.
- **Review session details** to confirm timing and status before submitting.
- **Update entries** when participant information changes.

## Who It’s For

- Trial coordinators and staff who need a streamlined, reliable check-in tool.
- Teams that want a simple workflow with minimal distractions.

## Shared daily check-in count

Device Systems Coordinators see a combined total of check-ins completed by Device Coordinators on their landing page. A check-in is counted when its Outlook email tab closes, matching the existing email completion event; opening the draft alone does not count it. Sidekick cannot verify whether an email was sent. LTL updates and manual personal-counter adjustments do not affect this total.

The total uses midnight-to-midnight America/Chicago days and refreshes every 30 seconds while the landing page is visible. Connection failures are retried from a durable background outbox. Each check-in has a unique ID so retries cannot count it twice. Only completion IDs, user IDs, and timestamps are stored; no client or email content is included. Tracking starts with this version; previous check-ins are not backfilled. All coordinators need the updated extension loaded for their completions to contribute.

Database setup for a new deployment: run `supabase/checkin-count-schema.sql` after the existing profile and Device Systems authorization schemas. The shared-counter schema has been applied to the configured project.

## Optional daily weighted counter

Device Coordinators can enable **Show today's weighted task total** in **User settings → Edit user profile**. It is off by default and can appear alongside the custom daily counter. Both use the existing counter tile styling and share the available grid space.

The total uses the weekly task weights (check-ins 0.7058, preps 1.6012, QA 0.693, custom 1). It tracks new task activity from this update onward, including manual counter adjustments, even while hidden. A separate dated ledger resets the displayed total at local midnight without changing existing daily or weekly counters. Earlier undated counts are not backfilled. Clearing daily counters also clears today's weighted total.
