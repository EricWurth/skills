# Intent Spec: rule-compiler

Spec version: 1.0
Current phenotype: SKILL.md (as packaged in the rulegate plugin)
Owner: the skill's user (Eric)
Replayable: yes -- given the same request and the same RULES.md, the same
plan structure should result.

## Purpose [INVARIANT]

Compile work requests into rule-compliant step plans in `.rulegate/plan.md`.
The executor never carries the rules; the plan carries them -- rule and
recency become the same tokens. Compilation makes violating a SEQUENCING
rule structurally impossible rather than discouraged.

## Inputs [INVARIANT]

- The user's request, taken as-is: compile execution order only. Never
  reinterpret intent, drop a requirement, or add unrequested work -- a
  plan that satisfies the rules but changes the request is a miscompile.
- `.rulegate/RULES.md` (the classified rule set) and, when advancing or
  revising, the existing `.rulegate/plan.md`.

## Success criteria [INVARIANT]

1. Plan format holds: exactly one `## CURRENT` marker; steps advance by
   moving the marker; completed steps are never deleted (they get
   `[done <timestamp>]` appended).
2. Every SEQUENCING rule is structurally satisfied by step order.
3. Every step declares `files:` honestly; `files: *` requires a stated
   reason in the step body.
4. Every `done-when` is checkable from the ledger or the filesystem,
   never a feeling.
5. Every step carries an `estimate:` sized to allow for normal failure;
   revising an estimate is a change request with a reason, not a quiet
   edit -- the estimate is stuck-detection's baseline.
6. Discovered work is reported back through the front gate as its own
   request, never folded into the current step.
7. On a scope-gate block: report-and-continue is preferred; widening a
   step's `files:` requires a one-line justification appended to the step
   body. The gate is never worked around via a different tool.
8. On "review the plan": re-derive from the original request and RULES.md
   from scratch and diff -- never patch. Constraint changes void plans.

## Behavioral invariants [INVARIANT]

- The plan is the single point where enforcement can be wrong; treat it
  as auditable output, not scratch notes.
- Never route a blocked change through another tool to dodge the gate.

## Free choices [IMPLEMENTATION MAY VARY]

- Step granularity and how work is decomposed.
- Estimate sizing judgment (as long as failure allowance is real).
- Wording of goals, justifications, and done-when conditions.

## Golden examples [MIGRATION TEST SET]

G-1: Test-before-fix sequencing.
  Input: RULES.md contains "a failing test that reproduces the bug must
  exist before source edits"; the request is a bug fix.
  Expected: the failing-test step precedes the source-edit step in the
  plan; a plan where the fix step could run first fails this example.

G-2: Discovered second bug.
  Input: mid-step execution reveals an unrelated bug.
  Expected: reported in the reply for the front gate; not folded into the
  current step's scope. Widening `files:` to absorb it fails this
  example.

G-3: Plan review request.
  Input: "review the plan" on an existing plan.
  Expected: a from-scratch re-derivation diffed against the existing
  plan, with differences named -- not an in-place patch.

## Eval notes

- Mechanically checkable: exactly one CURRENT marker; every step has
  files/estimate/done-when; completed steps retained; `files: *` always
  accompanied by a reason line.
- Human-judged: whether the compiled plan preserves the user's intent
  verbatim; whether estimates genuinely allow for failure.
- No failure history yet -- this genome is the baseline.
