# Intent Spec: rules-audit

Spec version: 1.0
Current phenotype: SKILL.md (as packaged in the rulegate plugin)
Owner: the skill's user (Eric)
Replayable: yes -- given the same rule set the same verdicts should
result; approvals belong to the author.

## Purpose [INVARIANT]

Evaluate project rules for enforceability before classification, against
a requirements-level bar: a rule should read like a requirement, an
acceptance criterion, or a process instruction. The audit's core job is
telling legitimate JUDGMENT rules apart from malformed rules -- enforceable
intentions phrased vaguely -- and proposing rewrites for the latter.

## Inputs [INVARIANT]

- The project's rules (CLAUDE.md, instruction files), or the extracted
  set handed over by rulegate-setup.

## Success criteria [INVARIANT]

1. Every rule passes through the six checks: atomicity (compound rules
   split before auditing), observability (what event/state/text would
   show a violation), vague quantifiers (flag and draft the unhedged
   version), resolvable references (inline, point at a real file, or
   drop), dead weight (already deterministically enforced elsewhere ->
   recommend deletion), contradiction (surface the pair, never silently
   pick a winner).
2. Output is one table, every rule, no exceptions, with verdicts from:
   enforceable / rewritable / judgment / dead / contradiction.
3. Rewrites convert advice-level to requirement-level while preserving
   intent -- the rewritable category is where the audit earns its place.
4. The table is presented and the audit waits: every rewrite requires
   explicit approval, because a meaning-changing rewrite is a miscompile
   at the rules layer. Nothing is deleted without approval, including
   dead weight.
5. The original CLAUDE.md is left untouched unless the user asks for it
   to be updated to match.

## Behavioral invariants [INVARIANT]

- Never reject a rule for being strict; strict and vague are different
  defects and only vague is a defect here.
- Never rewrite a JUDGMENT rule into a fake requirement -- taste rules
  stay honestly advisory.

## Free choices [IMPLEMENTATION MAY VARY]

- Rewrite phrasing (subject to approval).
- On rerun: fast mode (only rules added since last audit) vs full re-audit.
- How contradictions are presented for the author's pick.

## Golden examples [MIGRATION TEST SET]

G-1: Vague safety rule.
  Input: "be careful with database changes."
  Expected: verdict rewritable, with a requirement-level draft such as
  "schema changes require a migration file and a rollback script in the
  same commit" -- not a judgment classification, and not silent passage.

G-2: Genuine taste rule.
  Input: "prefer thin subsystems over hardcoded lookup tables."
  Expected: verdict judgment, kept advisory. Stripping the "prefer" to
  fabricate checkability fails this example.

G-3: Linter-duplicated rule.
  Input: a prose rule restating something the project's formatter already
  enforces.
  Expected: verdict dead with the enforcing mechanism named, and deletion
  recommended -- but not performed without approval.

## Eval notes

- Mechanically checkable: table covers every input rule; compound rules
  appear as split atoms; no CLAUDE.md modifications without an explicit
  request; no unapproved deletions or rewrites applied.
- Human-judged: whether rewrites preserve intent; whether the
  judgment-vs-malformed line was drawn honestly.
- No failure history yet -- this genome is the baseline.
