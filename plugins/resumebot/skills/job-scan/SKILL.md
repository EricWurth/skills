---
name: job-scan
description: Scan job boards (LinkedIn, Indeed, Dice) and/or direct employer career pages for roles matching the user's profile, score them, and append new finds to the tracker. Use when the user says "scan for jobs", "find new roles", "run the job scan", or when invoked by a scheduled task. Never applies to anything.
---

# Job Scan

Reads `Profile/match-profile.md`, searches, scores, appends to the tracker. Load the
**tracker** skill before writing. **This skill never applies to a job, ever** — it
only finds and scores.

## Modes

- **Board scan** (default, good nightly): keyword searches on LinkedIn / Indeed /
  Dice using the profile's broad function terms, newest-first, plus each board's
  "recommended for you" feed when the user is logged in. Uses the browser; if the
  user keeps a logged-in Chrome session, recommended-jobs feeds are high-yield.
- **Employer scan** (good weekly): walk a user-maintained list of direct-employer
  and recruiting-firm career pages (`Profile/employer-list.md`, optional). No login
  needed.

## Per-posting pipeline

1. **Dedupe first, cheaply.** Compute `matchKey` (lowercased `company|title`) and
   check it against the full tracker before any deep read. Same job on a different
   board = same job; skip it.
2. **Hard gates** from the profile, in cost order: excluded employer → location →
   staleness → comp floor → fit minimum. One failure = drop (log nothing, or a
   one-line reject row if the user prefers auditability — their preferences.md says).
   - **Staleness mechanics:** board "posted" dates are unreliable. Follow the "apply
     on company website" link (strip the board's redirect wrapper), and read the ATS
     page's own date. Workday shows a true "Posted X Days Ago"; Greenhouse/Ashby
     usually don't — record "date unverified" rather than presenting the board's
     number as truth.
3. **Score survivors** per the Scoring section below, map to a resume variant,
   and write a one-line `fitEvidence`.
4. **Capture the apply path:** direct `applyUrl` on the employer's ATS (never the
   aggregator's intake) and the `ats` type — this predicts apply-day friction.
5. **Aggregator postings** (Ladders, hackajob, any "apply through X"): identify the
   real employer, note the aggregator in `notes`, never treat the aggregator
   submission as an application path.
6. **Same-company dedupe:** multiple live postings from one employer → keep the best
   fit, mark the rest rejected citing dedupe (they can reopen if the winner dies).

## Scoring

Three separate axes. Keeping them separate is the system — a great remote role and
a great relocation role can have the SAME fit and different priorities, and
neither fact changes how much prep the role earns.

### Fit (1–5): can they do it, and how well

Judged from the posting against the master resume and variants. Changed only by
new evidence about the role or a profile edit — never by location, timing, or mood.
The profile's fit-scale section can override these defaults:

- **5** — evidence covers essentially every stated requirement; the role reads
  like it was written for this person
- **4** — strong match with 1–2 named gaps, all tailorable
- **3** — doable with a meaningful stretch; generic-variant territory
- **2** — stretch on the core mandate; wide-net long shot
- **1** — barely clears the fit gate

`fitEvidence` is one line: what carries the score plus the biggest gap. **Fit
analysis is information, never a verdict** — present gaps as the tailoring work
needed and rank by effort-to-apply. "Pass on this" is only ever justified by a
hard gate; a wide net means partial fits get applied to, not talked out of.

### Priority (queueRank): what to work first

Sequencing, not quality. Order: location-priority tier from the profile first
(no-move roles before relocation-tier roles — same quality, slower path), then
fit descending, then the staleness clock (older good postings first; they are
dying). Profile bonuses (comp thresholds, industry, level) break ties upward.
The `deferred` status parks an entire tier ("good, revisit later") without
rejecting anything — parking is a priority act, never a fit judgment.

### Effort tier: how much prep the role earns

Mapped from fit per the profile (defaults: 5 = High, 4 = Med, ≤3 = Low).
Location and priority never change effort tier — a relocation-tier fit-5 still
earns High-effort prep when its turn comes.

## Rescoring

When the match profile changes (a gate moved, bonuses retuned, a new variant),
rescore the ACTIVE rows — `new`, `ready`, `deferred` — in batches, updating
`fit`, `fitEvidence`, and `queueRank` with a `[rescore <date>]` breadcrumb in
notes. Never rescore `applied`/`interviewing` rows (the decision is already
made) and never let a rescore touch `status` or built packets by itself.

## Writing results

Per the tracker skill: backup → read fresh → dedupe against full sheet → append →
verify the write landed. On write failure after one retry, save findings to a dated
`Tracker/<date>-not-in-tracker.md` and flag for manual merge — never drop findings.

New rows enter as `status=new`, `packetComplete=FALSE`, regardless of fit. The
build-packets skill flips them toward ready.

## Report

End with counts only, not a row dump: N postings reviewed, N new rows added, N
duplicates skipped, N gate-rejected (by gate), plus the top 3 new finds by fit with
one line each. If run interactively, offer to run build-packets on the new high-fit
rows.
