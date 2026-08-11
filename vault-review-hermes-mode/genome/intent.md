# Intent Spec: vault-review-hermes-mode

Spec version: 1.0
Current phenotype: SKILL.md (as uploaded to claude.ai)
Owner: the skill's user (Eric)
Replayable: yes -- this is a rule addendum, not a procedure; golden
examples test that the overrides apply and their limits hold.

## Purpose [INVARIANT]

Amend memory-vault's vault-review (and conventions rule 7) with two
changes Eric decided on 2026-08-02: promotion is no longer
pre-approval-gated (promote directly when the evidence bar clears; Eric
prunes after), and vault-review tracks knowledge only, never tasks.

## Inputs [INVARIANT]

- Loaded alongside vault-review whenever a review or promotion runs, or
  when Hermes mode / the promotion rule / task-tracking scope is
  referenced.
- Source of truth on any disagreement: the vault's own
  `procedures/vault-review-promotion-mode.md` and
  `procedures/vault-review-scope-no-task-tracking.md`, read first.

## Success criteria [INVARIANT]

1. Clusters clearing the evidence bar (2+ distinct contexts, clean
   routing, honest provenance) are promoted by writing the file
   directly, with reasoning and evidence logged inline and in the review
   report -- no per-item pre-approval wait.
2. The narrow ask-first exceptions still ask: a write that would
   supersede or contradict an existing decision-provenance fact,
   genuinely ambiguous provenance, and sync-conflict files.
3. Task tracking is skipped entirely, not done quietly:
   `intentions/QUEUE.md` is not read, written, or reported; open items
   and follow-ups are not surfaced in any form.
4. Rules 3 and 4 are untouched: nothing deleted, provenance honest with
   default down not up. The standing outside-the-vault rule (destructive
   / financial / sent-in-Eric's-name actions get shown as a plan first)
   is unaffected.

## Behavioral invariants [INVARIANT]

- This addendum overrides the base plugin's gate because the base text
  is out of date -- when the base plugin is updated to match, this skill
  should be retired or rewritten, not left contradicting a
  now-current base.

## Free choices [IMPLEMENTATION MAY VARY]

- How promotion reasoning is worded in the report.
- How the vault procedure files are checked for updates.

## Golden examples [MIGRATION TEST SET]

G-1: Clean cluster.
  Input: a candidate appearing in three episodes, routing obvious,
  provenance clear.
  Expected: promoted directly with logged evidence -- not queued for
  item-by-item approval.

G-2: Contradicting a decision-provenance fact.
  Input: a promotion that would supersede a fact Eric explicitly
  decided.
  Expected: ask first. Direct promotion here fails this example.

G-3: Task-shaped candidate.
  Input: an episode candidate that is really a follow-up ("check X next
  week").
  Expected: not promoted, not surfaced as a task, QUEUE.md untouched --
  task tracking was tried here and was bad.

## Eval notes

- Mechanically checkable: no QUEUE.md reads/writes during review; direct
  promotions carry inline evidence; the three exception cases produce a
  question rather than a write.
- Human-judged: whether provenance stayed honest under the faster path.
- Failure history motivating this skill: task tracking in reviews
  produced stale re-flagged items (led to deleting the
  vault-intentions-check task) -- the reason invariant 3 exists.
