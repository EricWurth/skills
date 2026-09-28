# Intent Spec: apply-tabs

Spec version: 1.0
Current phenotype: SKILL.md (as published)
Owner: the skill's user
Replayable: mostly mechanical -- building the queue (filter, sort, cap) is
deterministic script/logic work; reconciling what happened after the session
(interpreting user answers or email-sync evidence into status/notes updates)
is judgment-heavy.

## Purpose [INVARIANT]

Bridge "packet ready" to "actually applied": open each ready role's direct
apply page in a browser tab so the user works a pre-ranked queue with zero
hunting, instead of hand-hunting through the tracker for what to apply to
next.

## Inputs [INVARIANT]

- The tracker (loaded via the **tracker** skill, which must be loaded
  first), specifically rows where `status=ready AND packetComplete=TRUE`.
- The actual packet files in `Applications/`, to verify each row's packet
  really exists.
- The user's per-session batch limit from `Profile/preferences.md`
  (default 5).
- `Profile/form-answers.md`, for per-role notes such as known form quirks
  and comp-answer strategy.

## Success criteria [INVARIANT]

1. The queue is built from `status=ready AND packetComplete=TRUE` rows,
   sorted by fit descending with freshness as the tiebreaker: same fit,
   newer wins; adjacent fit (gap of 1), a fresh role (<=14 days) can
   outrank a stale (>14 days) role one point higher; a fit gap of 2 or
   more always wins outright regardless of age. `queueRank` is the final
   tiebreak, not the primary sort. Age is days since the original posting
   date (the ATS's date when known, else `found`).
2. Each row's packet is verified to actually exist in `Applications/`
   before it's treated as openable; a row whose packet is missing is
   flagged, not opened.
2a. Every candidate's apply page is verified before sorting, cheapest tier
   first: the ATS's JSON endpoint where one is known, then headless
   Chrome, then the built-in browser for anything still `unknown`. Only a
   row that fails all three goes to "check by hand." Age for the sort
   comes from the ATS's own posted date whenever any tier returns one,
   not the tracker's `found` date.
3. The batch is capped at the user's per-session limit (default 5) rather
   than opening everything that qualifies.
4. Every opened tab uses `applyUrl` (the direct ATS page), never the board
   listing, one tab per role in queue order.
5. A compact checklist is printed alongside the tabs: company, role, which
   resume file to upload (full path), whether a cover letter exists, and
   any per-role notes (form quirks, comp-answer strategy).
6. After the session, outcomes are reconciled per role: submitted roles get
   `status=applied` with the date in notes; roles the user hit a wall on
   get the reason captured in notes, with dead postings moved to
   `status=dead` and aggregator walls flagged to find the direct path
   before the next session.
7. Freshness only ever closes a one-point fit gap, never two: a fresh role
   can outrank a stale role exactly one fit point higher, but a fresh
   low-fit role never beats a stale role two or more points higher. Stale
   low-fit rows that never surface are flagged in the checklist as
   candidates for the user to defer or reject, not queued for a future
   session.

## Behavioral invariants [INVARIANT]

- Never fills or submits forms -- the user submits every application. This
  is stated directly in the skill as a hard boundary: "This skill opens
  tabs; it never fills or submits forms."
- Load the tracker skill before touching tracker state.
- Always use `applyUrl`, never the board listing URL, when opening a tab.
- A row whose packet doesn't actually exist in `Applications/` gets
  flagged instead of opened -- fit/rank alone never earns a tab.
- Never exceed the user's per-session batch cap -- a wall of tabs "kills
  momentum," so the cap is enforced even when more roles qualify.
- Status changes after the session are driven by what the user reports (or
  later confirms via email-sync), not assumed from having opened the tab --
  the skill asks which ones were submitted rather than marking every opened
  role as applied.

## Free choices [IMPLEMENTATION MAY VARY]

- Exact wording/layout of the printed checklist, as long as it carries
  company, role, resume path, cover-letter status, and notes.
- How per-role notes are pulled and phrased from `Profile/form-answers.md`.
- Whether post-session outcomes are gathered by asking the user directly or
  by waiting on email-sync evidence -- the skill allows either.
- Mechanics of opening tabs in "the user's browser" (which browser, how
  tabs are created) -- unspecified beyond "one tab per role."
- How the aggregator-wall case is resolved into a direct-apply path before
  the next session -- the skill names the goal, not the method.

## Golden examples [MIGRATION TEST SET]

G-1: Missing packet file.
  Input: a tracker row has `status=ready`, `packetComplete=TRUE`, and a
  high `queueRank`, but no corresponding file actually exists in
  `Applications/`.
  Expected: the role is flagged, not opened as a tab -- `packetComplete`
  being TRUE in the sheet is not sufficient on its own.

G-2: Batch cap enforcement.
  Input: 12 rows qualify as ready with complete packets; the user's
  per-session limit in `Profile/preferences.md` is the default of 5.
  Expected: only 5 tabs are opened, the highest-priority ones by the
  fit-primary/freshness-tiebreak sort, with the rest left queued for a
  later session rather than dumped all at once.

G-3: Adjacent-fit freshness override (gap of 1).
  Input: a fit-5 role has sat in `status=ready` for 25 days; a fit-4 role
  was found 2 days ago. One batch slot remains.
  Expected: the fresh fit-4 takes the slot over the stale fit-5 -- a
  one-point fit gap is close enough for freshness to decide it.

G-3b: Freshness cannot close a two-point fit gap.
  Input: a fit-4 role has sat in `status=ready` for 15 days (still
  verified `live`); a fit-2 role was found today. One batch slot remains.
  Expected: the stale fit-4 takes the slot. The fresh fit-2 does not
  outrank it -- the gap is 2, so fit wins outright regardless of age.

G-3c: Tracker date disagrees with the ATS.
  Input: a fit-2 row's `found` date is yesterday, but the Workday endpoint
  returns a posted date four months ago.
  Expected: the row is sorted as four months old (stale), and the
  checklist notes the tracker date was wrong. It does not ride a false
  "fresh" label into the batch.

G-3d: Bot-walled page that is actually live.
  Input: headless Chrome gets a 403 for a fit-5 role's apply page.
  Expected: the page is loaded in the built-in browser before any verdict;
  if it renders with an apply control it is treated as live and sorted
  normally, not dropped to "check by hand."

G-4: Post-session outcome reconciliation.
  Input: after working the tab queue, the user reports one role was
  submitted, one hit a login wall on an aggregator, and one posting turned
  out to be dead.
  Expected: submitted role -> `status=applied` with date in notes;
  aggregator-wall role -> reason captured in notes and flagged to find the
  direct apply path before the next session; dead-posting role ->
  `status=dead`. No status is inferred or changed without one of these
  outcomes being reported.

## Eval notes

- Mechanical to check for the queue-building half: the row set, sort order,
  and batch cap can be diffed against the tracker's own filter/sort rules
  (`scripts/tracker_io.py filter --where status=ready packetComplete=TRUE`).
- More judgment-based for the after-session half: whether notes correctly
  capture *why* a role stalled, and whether the dead/aggregator-wall
  distinction was applied sensibly, needs human review.
- Known failure signatures to watch for: a stale, low-fit role taking a
  slot a fresh, higher-or-equal-fit role could have filled; a fresh role
  beating a stale role 2+ fit points higher (freshness only closes a
  one-point gap); opening the board `url` instead
  of `applyUrl`; opening more tabs than the per-session cap; opening a tab
  for a row whose packet file doesn't actually exist; the skill filling in
  or submitting a form itself; marking a role `applied` without the user
  (or email-sync) actually confirming submission.
- No known-bad fixture yet -- G-1 through G-4 are the first migration
  tests for this skill and should be re-run against any future phenotype
  rewrite of SKILL.md.
