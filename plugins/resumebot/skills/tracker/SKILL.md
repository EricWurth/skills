---
name: tracker
description: Conventions for the resumebot job tracker (JobSearchTracker.xlsx) — schema, statuses, dedupe, append-only writes, backups. Load this before ANY read or write to the tracker, and when the user asks about tracker columns, job statuses, or why a role is/isn't "ready".
---

# Tracker Conventions

`Tracker/JobSearchTracker.xlsx` is the ONLY home for job-search state. Never fork
state into a second markdown/JSON "queue," "priority list," or "rescored" copy —
forked state always drifts and eventually clobbers something. Scratch notes mid-scan
are fine but must merge into the xlsx in the same pass.

## Schema (sheet `Tracker`, one row per job)

| column | meaning |
|---|---|
| id | kebab-case slug: `company-short-title` |
| company | real employer (never the aggregator or staffing agency) |
| title | posted title |
| status | `new` / `ready` / `applied` / `interviewing` / `rejected` / `dead` / `deferred` |
| fit | 1–5 score against `Profile/match-profile.md` |
| level | free text: seniority read (judge by years-required, not title words) |
| effort | `High` / `Med` / `Low-Med` / `Low` — application-prep tier |
| variant | which standing resume variant this role maps to |
| comp | disclosed or estimated range |
| compSource | where the comp number came from (posting, levels-site, estimate) |
| location | as posted |
| moveType | `remote` / `local` / `relocation` / plus any user-defined exception tags |
| sector | industry |
| found | date first seen (YYYY-MM-DD) |
| board | where it was found, incl. the search that surfaced it |
| url | posting URL on the board |
| applyUrl | direct career-site / ATS apply URL (always capture; strip board redirect wrappers) |
| ats | ATS type (Workday, Greenhouse, Lever, iCIMS, custom…) — predicts apply-day friction |
| notes | freeform |
| packetComplete | TRUE only when the tailored resume actually exists in `Applications/` |
| queueRank | apply-order priority (1 = first) |
| matchKey | lowercased `company|title` — THE dedupe key |
| fitEvidence | one line: why the fit score |

## Rules

1. **Append-only for automation.** Scans and syncs add rows or update named fields on
   existing rows; they never delete or rewrite the sheet wholesale.
2. **Backup before every automated write:** copy the xlsx to
   `Tracker/backups/JobSearchTracker.<UTC timestamp>_<reason>.xlsx`. Keep the newest
   10 backups; delete older ones in the same pass so the folder never silts up.
3. **Read fresh immediately before writing.** The user edits this file directly in
   Excel between runs; never write from a stale in-memory copy.
4. **Dedupe by `matchKey` against the full sheet** before appending. The same job on
   two boards is one job — board/url are never part of the identity.
5. **Access via script, not context.** Use `scripts/tracker_io.py` (openpyxl) to read
   filtered slices and append rows. Never load the whole sheet into the conversation;
   it does not scale.
6. **"Ready" requires a packet.** Rubric fit is necessary but not sufficient. A role
   flips to `status=ready` only when `packetComplete=TRUE`, verified against the
   actual file in `Applications/`. A role that clears every gate with no packet stays
   `new` with a note ("scored ready, packet pending").
7. **If a write fails, retry once**, then fall back to a dated
   `Tracker/<date>-not-in-tracker.md` file rather than dropping findings — and flag it
   for manual merge.
8. **Status changes flow from the user** (editing Excel directly, or telling Claude)
   or from `email-sync` evidence. Automation never invents a status change.

## Dashboard

The `Dashboard` sheet holds live `COUNTIF` formulas over the Tracker sheet — status
counts and packet-pending counts. It recalculates itself in Excel; automation never
writes to it.
