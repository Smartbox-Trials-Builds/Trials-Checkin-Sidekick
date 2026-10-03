# Trials Check-in Sidekick

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

## Supabase connection

Sidekick is configured for the **Trials CRM Sidekick** project at
`https://pkdhsegkujujvmnielvh.supabase.co`. Its publishable key is safe for
browser code; privileged secret keys must never be added to this extension.

After updating the files, reload the unpacked extension in `chrome://extensions`
(or `edge://extensions`), reopen the side panel, and select **User settings →
Test connection**. This performs a read-only Auth settings request. It does not upload
check-ins, profiles, or other local data.

Onboarding requires a name, role, and Dashboard Initials. **Save & Continue**
saves those fields to `public.sidekick_user_profiles` before completing setup.
Enable Anonymous Sign-Ins in Supabase Authentication to allow setup without an
email or password. Row Level Security limits each user to their own profile.
The role is descriptive and does not grant privileges. The session is stored in
extension local storage; removing the extension or clearing its storage creates
a new identity on the next setup. Profiles do not yet follow users across devices.

The bundled Supabase browser SDK is `@supabase/supabase-js` 2.117.2 (MIT),
downloaded from its published UMD distribution.

### Device Prep Queue

The live queue appears directly below CRM Navigator. Users with a saved profile
can join or leave; names and Dashboard Initials appear in join order. Joining
twice keeps the original queue position.

Device Systems Coordinators can select a queued user and enter a CRM ID, an optional positive Dashboard
row number, client name, device type (Talkpad, Zuvo, Gridpad, Wego), and priority
(Expedite, Funded rental, Ship request, Daily queue), then select **Assign**.
The centered notification reminds users to look for their initials on the Dashboard and device prep slip,
displays the CRM ID, optional row, client, device, and priority, and offers **Open CRM** in a new tab
using the same URL builder as CRM Navigator. Link tests use only `https://www.example.com/crmid`.
Supabase validates the CRM ID, optional row, device, and priority and checks the assigner's saved profile
role and atomically removes the queue entry and creates a private notification.
Roles currently come from the user's onboarding selection. Two simultaneous
assignments cannot assign the same queue entry twice.

Client names are **not stored in Supabase**. The previous client-name column was
removed from the live database. Names travel through a private client-side
Realtime Broadcast to the recipient and are kept only in `chrome.storage.session`
(browser memory) until dismissal. They are never included in assignment SQL
requests or persistent browser storage. If the recipient is offline or the
browser session ends, the client name cannot be recovered; row, device, and
priority remain available. Database-triggered Broadcast must not be used for
names because it persists message payloads.

Both popup windows follow the user's current Sidekick palette, typography, and
custom background. Open popups update when the Sidekick theme changes, including
the palette currently displayed by rotating themes.

Assignments open in a separate window centered on the active monitor. The alert
stays open until the user selects **Close** or closes its window. Closing the
window dismisses the displayed assignments; if the connection is interrupted,
Sidekick saves the dismissal locally and retries. The background worker listens
for assignments while the panel is closed, with a 30-second alarm as a fallback.
The browser must remain running for alerts to arrive.

The small **Hide** and **Pop out** controls sit on opposite sides of the queue.
**Hide** collapses the full queue and its title, leaving only **Show Queue**.
**Pop out** opens
the live queue in its own browser window, which can be moved using its title bar
and resized using its edges. The landing queue is replaced with window controls
while detached. **Return to Sidekick** or closing the queue window restores and
expands it on the landing page. Queue membership remains until the user leaves
or is assigned, including when they close Sidekick. Realtime updates are backed
by a 15-second refresh to recover from interrupted connections.

Reload the extension after updating it. This version requires Chrome/Edge 120+
and adds display information and alarms permissions to center windows and check
for assignments in the background.

The deployed queue schema is recorded in `supabase/queue-schema.sql`, with the
assignment detail update in `supabase/assignment-details-schema.sql`.
The current privacy update is recorded in `supabase/assignment-privacy-schema.sql`.
The optional row and CRM ID update is recorded in `supabase/assignment-crm-schema.sql`.
`node supabase/test-queue.cjs` runs a live integration test with temporary users
and prints their IDs for administrator cleanup.
`node workers/test-queue-windows.cjs` and `node supabase/test-queue-ui.cjs`
verify popup lifecycle and queue controls without creating Supabase users.
`node test-window-theme.cjs` checks popup theme synchronization.

## Notes

This README intentionally avoids internal system links and implementation-specific URLs.

Device Systems Tools includes Device Sidekick (formerly Pre-prep Sidekick). Its page has a small Pop out button that opens one movable, resizable window using the selected Sidekick theme. The panel and popup share scanned serials, internal serial edits, and edit-lock state in browser session memory, so the popup stays usable with the panel closed and closing either view does not discard the list during that browser session. Verify with node test-device-sidekick.cjs.

Device Sidekick starts in Wipe mode with its two original serial columns. Prep mode adds editable CRM ID and GIPOD Codes columns with individual Copy buttons. Bulk add opens a themed dialog for a single Excel column without a header: paste exactly one code per listed device. Applying replaces the codes in list order; blank rows, multiple columns, count mismatches, locked edits, and a changed device list are rejected. The mode and values stay synchronized between panel and popup; switching to Wipe hides the Prep columns without clearing their values.

Device Prep Queue is open daily from 7 AM until 8 PM America/Chicago time, including daylight saving. Supabase rejects joins outside those hours. A private database Cron job checks every minute and removes entries from before the latest 8 PM cutoff; queue visibility and assignments enforce the cutoff immediately even if cleanup is delayed. Cleanup runs with all browsers closed and catches up after interruptions. Existing assignment notifications remain available. The schedule is recorded in supabase/queue-hours-schema.sql.
