# Intent Spec: email-sync

Spec version: 1.0
Current phenotype: SKILL.md (as published)
Owner: the skill's user
Replayable: partially -- the scan and classification steps are driven by a
fixed table and are close to mechanical, but company-name matching under
uncertainty and the "ambiguous" bucket both call for judgment. Golden
examples below are scenario-based, evaluated against the classify table and
the invariants, not by diffing an artifact.

## Purpose [INVARIANT]

Scan the user's email for application-related messages (confirmations,
rejections, interview requests, recruiter outreach) and update the job
tracker to match, so the user does not have to hand-log every status
change.

## Inputs [INVARIANT]

- A connected email tool (e.g. the Gmail connector). Without one, there is
  no valid input to run on.
- The job tracker, read and written only through `scripts/tracker_io.py`
  (never direct file edits).
- A lookback window in days: default 3, 14 on first run.
- Tracker rows in active statuses (`applied`, `interviewing`, `ready`), used
  to match company names from mail against tracker entries.

## Success criteria [INVARIANT]

1. Mail is searched over the correct lookback window (3 days, or 14 on
   first run) for application-related signals: known ATS senders (workday,
   greenhouse, lever, icims, myworkday, ashbyhq, jobvite, smartrecruiters,
   etc.), application/interview/offer subject patterns, and company names
   drawn from active tracker rows.
2. Each hit is classified per the table and produces the corresponding
   tracker action:
   - Application received/confirmation -> confirm `status=applied`,
     confirmation date added to notes.
   - Rejection -> `status=rejected`, date + one-line reason in notes.
   - Interview request/scheduling link -> `status=interviewing`, stage +
     date in notes, surfaced to the user prominently.
   - Recruiter outreach about a new role -> new `status=new` row (deduped
     by matchKey first), `board=recruiter outreach`.
   - Offer -> surfaced to the user immediately; no automated status change.
   - Ambiguous -> listed for the user; no change made.
3. Company-name matching against tracker rows is tolerant of subsidiaries
   and brand names; when the match is uncertain, the skill asks rather than
   mis-filing.
4. Every automated status change appends a `[email-sync <date>]` breadcrumb
   to notes, so the user can see why a status moved.
5. The report leads with what needs the user (interview requests and
   offers first, with dates), then states counts: statuses updated (with
   list), new recruiter roles added, ambiguous items awaiting a call. If
   nothing changed, a single line says so.

## Behavioral invariants [INVARIANT]

- If no email tool is connected, say so and stop -- do not guess at
  statuses.
- Read-only on the mailbox: never send, reply, archive, delete, or label
  without an explicit user request.
- Never click links in emails.
- All tracker writes go through `scripts/tracker_io.py`, which enforces
  backup-before-write, a fresh read taken after the backup, matchKey
  dedupe on append, and append-only history -- this skill does not bypass
  those rules for its own writes.
- Offers and ambiguous hits never get an automated status change, even
  though other categories do -- offers are surfaced instead, ambiguous
  items are listed instead.

## Free choices [IMPLEMENTATION MAY VARY]

- The exact set of ATS sender domains/names and subject-pattern heuristics
  used to find candidate hits.
- Phrasing and layout of the report, beyond the required lead-with-the-user
  ordering and the four required counts.
- How the "ask rather than mis-file" clarification is presented to the
  user (inline question, batched list, etc.).
- Exact wording of the `[email-sync <date>]` breadcrumb and of rejection
  one-line reasons.

## Golden examples [MIGRATION TEST SET]

G-1: No email tool connected.
  Input: skill is invoked but no email connector is available.
  Expected: the skill says so and stops -- no tracker reads, no writes, no
  guessed statuses. This is the graceful-degradation behavior the skill
  exists to guarantee.

G-2: Interview request email.
  Input: an email matching an interview/scheduling pattern for a company
  with an active tracker row.
  Expected: tracker row moves to `status=interviewing` with stage + date in
  notes, a `[email-sync <date>]` breadcrumb is appended, and the interview
  is surfaced prominently in the report's lead section.

G-3: Offer email.
  Input: an email indicating an offer.
  Expected: no automated status change is made; the offer is surfaced to
  the user immediately as part of the report's lead section.

G-4: Ambiguous hit.
  Input: a mail hit that does not clearly match any row of the classify
  table.
  Expected: no tracker change is made; the item is listed for the user in
  the report rather than silently dropped or force-classified.

G-5: Uncertain company match.
  Input: a mail hit whose sender/company name only loosely resembles a
  tracker row (e.g. a subsidiary or brand-name variant) and the match is
  not confident.
  Expected: the skill asks the user rather than filing the update against
  the uncertain row.

G-6: Recruiter outreach for a role not yet tracked.
  Input: recruiter email about a new role at a company with no existing
  tracker row.
  Expected: a new `status=new` row is added (via `tracker_io.py append`,
  after a matchKey dedupe check), tagged `board=recruiter outreach`.

## Eval notes

- The classify table (Scan/Classify section of SKILL.md) is the mechanical
  core and is the easiest part to check for regression: each of the six
  row types should map to its documented action with no drift.
- Detectable failure signatures to watch for retrospectively: a status
  changed on an offer or ambiguous hit; a write that bypasses
  `tracker_io.py`; a run that proceeds without a connected email tool
  instead of stopping; a status change with no `[email-sync <date>]`
  breadcrumb; a link in an email getting clicked.
- No known-bad fixture yet -- G-1 through G-6 above are the first attempt
  at migration tests; they should be run against any future phenotype
  change to confirm behavior didn't regress.
