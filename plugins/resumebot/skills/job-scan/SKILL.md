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
   - **Comp-floor mechanics — COL-adjusted path:** only relevant when
     `Profile/ColCribSheet.md` exists (COL-adjustment is on). A flat-floor failure
     isn't automatically a drop for a relocation-eligible posting — check this path
     before rejecting.
     1. **Local or remote-in-home-market role:** flat floor only, unchanged. No
        lookup, no adjustment — COL-adjustment never touches these.
     2. **Relocation-eligible role:** look up the target metro on
        `Profile/ColCribSheet.md`. Missing, or last-checked more than 180 days ago?
        Fetch fresh: **BEA Regional Price Parities** — metro-level (covers 387 US
        metro areas) when the target is covered, state-level RPP otherwise.
        **BEA's raw index is relative to the US national average, not to the user's
        home market** — fetch the home market's own raw index too (or reuse it from
        the crib sheet's home row) and compute
        `relative_index = target_raw ÷ home_raw × 100` before using it for anything.
        Treating a raw BEA figure as already home-relative silently corrupts every
        comparison downstream from it.
        Non-US and non-MSA rural locations aren't covered by BEA RPP — skip the COL
        path entirely for these, apply the flat floor only, and note "COL adjustment
        unsupported for this location" rather than guessing with a different source.
        Append or refresh the metro's crib-sheet row: `relative_index`, the floor
        translated into that metro's terms (`home_floor × relative_index ÷ 100`),
        source, today's date. If the posting states or estimates comp, fold it into
        that metro's observed salary range for the target function too (min/max,
        posting count) — empirical, not a separate lookup.
     3. Compute `adjusted_equivalent = posted_comp × 100 ÷ relative_index` — the
        posting's pay restated in home-market purchasing power.
     4. **Posted comp already clears the flat floor:** normal pass, `colAdjusted=FALSE`
        (the adjustment wasn't load-bearing, so it isn't recorded as if it were).
        **Posted comp fails the flat floor but `adjusted_equivalent` clears it:** not
        dropped — proceed to scoring with `colAdjusted=TRUE` and `colAdjustedComp`
        recording both figures and the metro's relative index, e.g. `"$135K nominal
        -> $158K home-equivalent (Denver, index 85.4) vs $150K floor"`. **Fails
        both:** dropped as an ordinary comp-floor gate failure, same as today.
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
build-packets skill flips them toward ready. `colAdjusted`/`colAdjustedComp`
default to `FALSE`/blank and are only set when the COL-adjusted path was
actually what got the row past the comp-floor gate (see above).

## Report

End with counts only, not a row dump: N postings reviewed, N new rows added, N
duplicates skipped, N gate-rejected (by gate), plus the top 3 new finds by fit with
one line each. If run interactively, offer to run build-packets on the new high-fit
rows.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "This deferred role is stale weight, I'll just reject it to tidy the tracker" | `deferred` parks a priority tier — it is never a fit judgment. Turning a park into a rejection destroys information the user asked to keep for later. |
| "The board says posted 3 days ago, that's probably close enough" | Board dates are unreliable by design of this pipeline. Follow the ATS link and read its own date, or record "date unverified" — never present the board's number as fact. |
| "This is a real stretch, I'll just tell the user to skip it" | Fit is information, not a verdict. Only a hard gate justifies passing on a role — a wide net means partial fits get applied to, not talked out of. |
| "While I'm rescoring this row, I'll also fix its status to match" | Rescore touches only `fit`, `fitEvidence`, and `queueRank`. Status is a separate decision the user already made (or hasn't) — rescoring never reaches into it. |
| "I've already scored this one highly, I might as well submit it" | This skill never applies to anything, ever. Finding and scoring is the entire job; application is a different skill's decision. |
| "This relocation role missed the flat comp floor, that's a clean reject" | Check the COL-adjusted path first whenever `Profile/ColCribSheet.md` exists — it exists precisely so a relocation role isn't dropped on a nominal-only comparison. Only drop it if it fails both. |
| "The metro's BEA index number looks usable as-is, I'll plug it straight into the comp math" | BEA Regional Price Parities are relative to the US national average, not to the user's home market. Always divide by the home market's own raw index first — using the raw figure directly silently corrupts every comparison downstream. |

## Red Flags

- A `deferred` row flipped to `rejected` (or the reverse) without a fit-based reason
- Any apply/submit action taken directly by this skill
- A posting scored before a `matchKey` dedupe check against the full tracker
- `applyUrl` pointing at an aggregator's intake instead of the employer's own ATS
- A board "posted" date reported as fact without following through to the ATS page
- A rescore that touches `status`, `applied`/`interviewing` rows, or built packets
- A raw BEA Regional Price Parities figure used in comp math without first being rebased against the home market's own index
- COL-adjustment applied to a non-US or non-MSA location instead of being skipped with a note
- `colAdjusted=TRUE` written on a row whose nominal comp already cleared the flat floor unassisted
- A relocation posting dropped on the flat comp floor alone when `Profile/ColCribSheet.md` exists and the adjusted path was never checked
