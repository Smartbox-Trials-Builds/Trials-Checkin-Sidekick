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

## Shared daily check-in count

Device Systems Coordinators see a combined total of check-ins completed by Device Coordinators on their landing page. A check-in is counted when its Outlook email tab closes, matching the existing email completion event; opening the draft alone does not count it. Sidekick cannot verify whether an email was sent. LTL updates and manual personal-counter adjustments do not affect this total.

The total uses midnight-to-midnight America/Chicago days and refreshes every 30 seconds while the landing page is visible. Connection failures are retried from a durable background outbox. Each check-in has a unique ID so retries cannot count it twice. Only completion IDs, user IDs, and timestamps are stored; no client or email content is included. Tracking starts with this version; previous check-ins are not backfilled. All coordinators need the updated extension loaded for their completions to contribute.

Database setup for a new deployment: run `supabase/checkin-count-schema.sql` after the existing profile and Device Systems authorization schemas. The shared-counter schema has been applied to the configured project.

## Optional daily weighted counter

Device Coordinators can enable **Show today's weighted task total** in **User settings → Edit user profile**. It is off by default and can appear alongside the custom daily counter. Both use the existing counter tile styling and share the available grid space.

The total uses the weekly task weights (check-ins 0.7058, preps 1.6012, QA 0.693, custom 1). It tracks new task activity from this update onward, including manual counter adjustments, even while hidden. A separate dated ledger resets the displayed total at local midnight without changing existing daily or weekly counters. Earlier undated counts are not backfilled. Clearing daily counters also clears today's weighted total.
