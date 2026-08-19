# Intent Spec: survey-feedback-report

Spec version: 1.0
Current phenotype: SKILL.md (as published), bundled references/qa-checklist.md
Owner: the skill's user
Replayable: partially -- the pipeline sequence, counting rules, and QA
checklist are fixed and deterministic; the actual grouping of free-text
ideas is judgment, so golden examples test counting/structural compliance,
not exact theme boundaries.

## Purpose [INVARIANT]

Turn open-ended survey columns into a branded HTML report a decision-maker
can act on without asking clarifying questions: per-column extraction with
explicit skip rules, respondent-level counting, cross-column theme
detection, then a mandatory adversarial self-QA against the source data
before anything is shown. Data-driven, never cherry-picked.

## Inputs [INVARIANT]

- source data: required -- a Google Sheet, CSV/XLSX upload, or equivalent
  tabular export containing at least one free-text column.
- target columns: required, asked for once if not stated.
- brand/site to match: optional; only fetched if the user names one.
- audience: optional; a leadership/priority panel is added when the reader
  is a decision-maker, asked about if unclear.

## Success criteria [INVARIANT]

1. The source is read in full, never sampled, and columns are cited by
   their exact headers.
2. Skip rules are applied consistently across every target column, with a
   running count of what was skipped and why. The three-bucket distinction
   holds: blank, explicit non-answer, and meaningful-but-no-ask are never
   collapsed, and (meaningful + skipped) reconciles to the column total.
3. Multi-idea responses are split before grouping; grouping errs toward
   granularity (near-duplicates merge, related-but-distinct ideas do not).
4. Every count chip means distinct respondents, not mentions, and the copy
   says so wherever one respondent bundled several asks.
5. Cross-column themes are detected before the report is written and lead
   it, with distinct-respondent counts that do not double-count one person
   echoing themselves across columns.
6. Numbers back every claim. No sensational quote stands in for a
   frequency count; no precise-looking percentage appears without having
   been actually counted.
7. The self-QA pass (references/qa-checklist.md) runs against the source
   data before the user sees the report, and what it caught is surfaced
   rather than silently fixed.
8. The persona red-team pass reads the report as a named decision-maker in
   the domain, and steps 6-7 iterate until that reader could act without
   follow-up questions.
9. If asked to have a specific named model red-team the report and no such
   tool exists, that is said plainly and the simulation is disclosed --
   never silently substituted.

## Behavioral invariants [INVARIANT]

- Clarifying questions are asked at most once, and not at all when the
  request already answers them -- assumptions are then stated inline.
- Brand matching derives a compact token system (4-6 named hex colors, a
  deliberate type pairing, one signature layout element) from what was
  actually fetched, and records the derivation somewhere checkable.
- The deliverable is a single self-contained HTML file (inline CSS, no
  external JS beyond an optional Google Fonts link), delivered however the
  runtime delivers files. Sharing/emailing it is a separate step, never
  bundled into the build.
- Runtime-adaptive execution (file write vs. artifact vs. outputs
  directory; whichever web-fetch tool exists), but the pipeline, counting
  discipline, QA pass, and red-team pass are identical regardless of
  runtime.

## Free choices [IMPLEMENTATION MAY VARY]

- Exact theme boundaries and group names -- judgment, bounded by the
  granularity rules.
- Report visual design when no brand is given.
- Which persona the red-team pass adopts, as long as it is specific and
  domain-appropriate.
- How the long-tail single-mention list is formatted.
- File naming and delivery mechanics, dictated by runtime.

## Golden examples [MIGRATION TEST SET]

G-1: Multi-idea respondent (counting fixture).
  Input: a column where one respondent's answer contains three distinct
  asks that all fall under one theme, and no other respondent raised it.
  Expected: the theme's chip reads 1, the three asks appear as list items,
  and the copy states one respondent bundled them. A chip of 3 fails.

G-2: Reconciliation fixture.
  Input: a column of 40 responses -- 12 blank, 5 explicit non-answers,
  4 meaningful-but-no-ask, 19 with real asks.
  Expected: stats distinguish blank from answered-but-non-meaningful, the
  no-ask bucket appears as general sentiment rather than vanishing, and
  19 + (12 + 5) + 4 reconciles to 40. Any unaccounted respondent fails.

G-3: Cross-column echo.
  Input: one respondent makes the same point in two different columns;
  two other respondents each make it once.
  Expected: the cross-column theme reports 3 distinct respondents and
  explicitly notes the echo, not 4.

## Eval notes

- Mechanically checkable: per-column totals reconcile; every chip labeled
  as distinct respondents; the QA pass's "what I checked and fixed" note
  present before delivery; HTML is self-contained (no external JS/CSS
  beyond Google Fonts).
- Human-judged: whether theme granularity matches the merge rules; whether
  the leadership panel's urgency/cost ordering is sensible; whether the
  red-team persona was specific rather than generic.
- No reusable known-bad fixture dataset exists yet -- G-1..G-3 should be
  built into an actual test CSV before this genome is treated as fully
  validated.
