# Intent Spec: job-scan

Spec version: 1.0
Current phenotype: SKILL.md (as published)
Owner: the skill's user
Replayable: partially -- dedupe, gating, and scoring math are mechanical and
diffable, but fit judgment against a resume and posting text is model
judgment, not a deterministic function. Golden examples below are
scenario-based, evaluated by whether the invariant held, not by diffing an
artifact.

## Purpose [INVARIANT]

Scan job boards (LinkedIn, Indeed, Dice) and/or direct employer career pages
for roles matching the user's profile, score them, and append new finds to
the tracker. This skill never applies to a job -- it only finds and scores.

## Inputs [INVARIANT]

- `Profile/match-profile.md`: the user's profile, gates, fit-scale overrides,
  and scoring bonuses.
- `Profile/employer-list.md` (optional): a user-maintained list of direct
  employer and recruiting-firm career pages, used for the employer scan mode.
- `Profile/ColCribSheet.md` (optional, present only when COL-adjustment is
  enabled in the profile): per-metro COL index, translated comp floor,
  observed salary range, source, and last-checked date -- read before and
  appended/refreshed during the comp-floor gate for relocation-eligible
  postings.
- The existing tracker (full sheet), read fresh before dedupe and write.
- Implicit: a logged-in browser session, used for board keyword searches and
  each board's "recommended for you" feed when the user is logged in.

## Success criteria [INVARIANT]

1. Every posting is deduped against the full tracker by `matchKey`
   (lowercased `company|title`) before any deep read -- same job on a
   different board is treated as the same job and skipped.
2. Every posting passes hard gates in cost order -- excluded employer,
   location, staleness, comp floor, fit minimum -- before scoring; one gate
   failure drops the posting. When `Profile/ColCribSheet.md` exists and a
   relocation-eligible posting fails the flat comp floor, the COL-adjusted
   path is checked before the posting is dropped -- a flat-floor failure
   alone is not sufficient to drop a relocation-eligible posting when
   COL-adjustment is enabled.
3. Staleness is verified, not trusted: the "apply on company website" link is
   followed (board redirect stripped) and the ATS page's own date is read;
   when the ATS doesn't expose a reliable date, the posting is recorded
   "date unverified" rather than presented with the board's number as fact.
4. Every surviving posting gets a Fit score (1-5) with a one-line
   `fitEvidence`, a `queueRank` reflecting priority (not quality), and an
   effort tier mapped from fit.
5. The direct employer-ATS `applyUrl` is captured, never the aggregator's
   intake page; aggregator-sourced postings identify the real employer and
   note the aggregator separately.
6. Multiple live postings from the same employer are deduped down to the
   best fit, with the rest marked rejected citing dedupe.
7. New rows are written as `status=new`, `packetComplete=FALSE`, regardless
   of fit -- the build-packets skill is what moves them toward ready.
8. Writes follow the tracker skill's protocol: backup, read fresh, dedupe
   against the full sheet, append, verify the write landed. On failure after
   one retry, findings go to a dated `Tracker/<date>-not-in-tracker.md`
   instead of being dropped.
9. The report ends with counts only (reviewed, new, duplicates, gate-rejected
   by gate) plus the top 3 new finds by fit -- not a full row dump.

## Behavioral invariants [INVARIANT]

- Never marks a posting as applied, and never treats the skill's own scan as
  an application action.
- Fit is changed only by new evidence about the role or a profile edit --
  never by location, timing, or mood. Fit analysis is information, not a
  verdict: gaps are framed as tailoring work, never as a reason to skip
  applying. Only a hard gate justifies passing on a role.
- The `deferred` status parks a tier ("good, revisit later") without
  rejecting it -- parking is a priority act, never a fit judgment, and must
  not be conflated with a rejection.
- Priority ordering never changes fit or effort tier: a relocation-tier
  fit-5 still earns High-effort prep, even though it queues behind a
  no-move fit-5.
- Rescoring touches only `new`, `ready`, and `deferred` rows, and only
  updates `fit`, `fitEvidence`, and `queueRank` (with a `[rescore <date>]`
  breadcrumb). `applied`/`interviewing` rows are never rescored, and a
  rescore never touches `status` or built packets by itself.
- Findings are never silently dropped on a write failure -- they are logged
  to the dated not-in-tracker file instead.
- COL-adjustment never loosens the comp floor for a local or
  remote-in-home-market role -- it only opens a second path through the gate
  for relocation-eligible roles specifically, and only rescues a role that
  would otherwise be dropped, never disqualifies one that already passed.
- BEA Regional Price Parities are relative to the US national average, not
  to the user's home market -- the home market's own raw index is always
  divided out before a target metro's index is used in any comp comparison.
  A raw BEA figure is never used as if it were already home-relative.
- Non-US and non-MSA rural locations are outside BEA RPP's coverage -- the
  COL-adjusted path is skipped for these (flat floor only, noted as
  unsupported), never estimated from an undocumented substitute source.
- `colAdjusted` is set `TRUE` only when the adjustment was load-bearing (the
  nominal comp failed the flat floor and the home-equivalent figure is what
  passed it) -- never on a row that cleared the flat floor on nominal comp
  alone.

## Free choices [IMPLEMENTATION MAY VARY]

- Which of the two modes (board scan vs. employer scan) runs on a given
  invocation, and how often each runs (nightly vs. weekly is a suggestion,
  not a rule).
- Whether a hard-gate rejection is logged at all, or logged as a one-line
  reject row -- deferred to the user's `preferences.md`.
- Exact search terms and ordering used against each board, beyond "the
  profile's broad function terms, newest-first."
- Presentation/wording of `fitEvidence` and gate-rejection notes.
- Whether an interactive run offers to chain into build-packets afterward.

## Golden examples [MIGRATION TEST SET]

G-1: Same job seen on two boards.
  Input: a posting from Company X, title Y, appears in both the LinkedIn
  keyword search and the Indeed "recommended for you" feed in the same run.
  Expected: `matchKey` dedupe catches it before a deep read; it is counted
  once, not scored twice.

G-2: Unreliable posted date.
  Input: a Greenhouse-hosted posting where the board claims "posted 3 days
  ago" but the ATS page shows no date.
  Expected: the posting is recorded "date unverified," not presented with
  the board's 3-day figure as fact.

G-3: Aggregator posting.
  Input: a Ladders listing that says "apply through [aggregator]."
  Expected: the real employer is identified, the aggregator is noted, and
  the aggregator's own submission flow is never captured as `applyUrl`.

G-4: Fit-3, relocation-tier posting during rescoring.
  Input: the match profile's comp floor changes; a batch rescore runs over
  active rows including a `deferred`, relocation-tier, fit-3 posting.
  Expected: `fit`, `fitEvidence`, and `queueRank` may update with a
  `[rescore <date>]` note; `status` stays `deferred` and no packet is
  touched.

G-5: Write failure.
  Input: the tracker write fails once and the retry also fails.
  Expected: findings are saved to `Tracker/<date>-not-in-tracker.md` and
  flagged for manual merge -- nothing is silently discarded.

G-6: Relocation role rescued by COL adjustment.
  Input: COL-adjustment is on, a relocation-eligible posting's nominal comp
  fails the flat floor, but the home-market-equivalent figure (posted comp
  translated using the target metro's BEA-RPP-derived relative index) clears
  it.
  Expected: the posting is not dropped -- it proceeds to scoring with
  `colAdjusted=TRUE` and `colAdjustedComp` recording the nominal figure, the
  home-equivalent figure, and the metro's relative index.

G-7: Relocation role still rejected despite COL adjustment.
  Input: COL-adjustment is on, a relocation-eligible posting fails the flat
  floor, and the home-market-equivalent figure also fails it.
  Expected: dropped as an ordinary comp-floor gate failure -- the COL path
  was checked but didn't change the outcome, and `colAdjusted` is never set
  `TRUE` on a dropped posting.

G-8: Non-US or non-MSA location.
  Input: a relocation-eligible posting is in a location BEA RPP doesn't
  cover (outside the US, or not part of a metropolitan statistical area).
  Expected: the COL-adjusted path is skipped entirely -- flat floor only,
  noted as "COL adjustment unsupported for this location" -- never estimated
  from an undocumented substitute source.

## Eval notes

- Mechanically checkable: dedupe correctness (no matchKey collision scored
  twice), gate ordering, `applyUrl` never pointing at an aggregator domain,
  `status=new`/`packetComplete=FALSE` on all new rows, rescore never
  touching `applied`/`interviewing` rows or `status`.
- Human-judged: fit scores and `fitEvidence` quality against the resume and
  profile -- no mechanical pass/fail for these.
- Detectable failure signatures to watch for retrospectively: a rejected-not
  role silently reappearing as a duplicate scored fresh; a board's posted
  date presented as verified fact without following the ATS link; an
  aggregator URL captured as `applyUrl`; a `deferred` row treated as
  rejected (or vice versa) in a later run; dropped findings after a write
  failure with no not-in-tracker file; a raw BEA RPP figure used in comp
  math without being rebased against the home market's own index; a
  relocation posting dropped on the flat floor alone with
  `Profile/ColCribSheet.md` present and the adjusted path never checked;
  `colAdjusted=TRUE` on a row that didn't need the adjustment to pass.
- No known-bad fixture yet -- G-1 through G-8 above are the first attempt at
  migration tests; they should be run against any future phenotype change to
  confirm behavior didn't regress.
