---
name: apply-tabs
description: Open browser tabs for tracker roles that are ready to apply, in priority order, so the user can walk the queue and submit. Use when the user says "open my apply queue", "set up my application tabs", "what should I apply to today", or when invoked by a scheduled task.
---

# Apply Tabs

Bridges "packet ready" to "actually applied": opens each ready role's direct apply
page in a browser tab so the user works a pre-ranked queue with zero hunting. Load
the **tracker** skill first.

**The user submits every application. This skill opens tabs; it never fills or
submits forms.**

## Build the queue

1. Query the tracker for `status=ready AND packetComplete=TRUE`, ordered by
   `queueRank` (fallback: fit desc, then found date asc — oldest good roles first,
   they're dying of staleness).
2. Verify each role's packet file actually exists in `Applications/`; a row whose
   packet is missing gets flagged, not opened.
3. Cap the batch at the user's per-session limit (`Profile/preferences.md`, default
   5) — a wall of 20 tabs kills momentum.

## Open the tabs

- Use `applyUrl` (the direct ATS page), never the board listing.
- One tab per role, in queue order, in the user's browser.
- Then print a compact checklist the user works alongside the tabs: company, role,
  which resume file to upload (full path), whether a cover letter exists for it, and
  any per-role notes (known form quirks, comp answer strategy from
  `Profile/form-answers.md`).

## After the session

Ask which ones were submitted (or learn it later from email-sync). For each
submitted role: `status=applied`, date in `notes`. For any the user hit a wall on
(login required, posting dead, portal broken): capture the reason in `notes` and
adjust — dead posting → `status=dead`; aggregator wall → find the direct path before
the next session.

## Cadence note

Postings die on a clock. If a role has sat in `ready` for more than ~10 days, bump
it to the top of the next session and say why.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "The tab probably opened fine, I'll just mark it applied" | Opening a tab is not submitting a form. Status only moves to `applied` when the user reports it (or email-sync confirms it) — never inferred from having opened the tab. |
| "`packetComplete` is TRUE in the tracker, no need to check the folder" | The sheet cell can be stale or wrong. The row only gets opened as a tab after the packet file is confirmed to actually exist in `Applications/`; otherwise it's flagged, not opened. |
| "The board listing link is right there, I'll just use that" | The board URL and the direct apply URL are not interchangeable — one is the aggregator page, the other is the real ATS form. Always `applyUrl`, never `url`. |
| "The user's clearly on a roll today, I'll open all 12 instead of stopping at 5" | The per-session cap exists because a wall of tabs kills momentum, not because 5 is a hard technical limit. Qualifying for more doesn't override the cap. |
| "This form looks quick, I'll just fill it in for them" | The skill's one hard boundary is that it opens tabs and never fills or submits forms — quickness doesn't create an exception. |

## Red Flags

- Setting `status=applied` without the user reporting it or email-sync confirming it
- Opening the board `url` instead of `applyUrl` for any tab
- Opening more tabs than the user's per-session batch cap
- Opening a tab for a row whose packet file doesn't actually exist in `Applications/`
- Filling in or submitting any part of an application form
- Leaving a role stale in `ready` for 10+ days without bumping it and stating why
