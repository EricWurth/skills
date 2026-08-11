---
name: rules-audit
description: >
  This skill should be used when the user says "audit my rules", "audit CLAUDE.md",
  "check my project instructions", "are my rules enforceable", or as the mandatory
  first step of rulegate setup before any rule is classified. It evaluates project
  rules against a requirements-level quality bar and proposes rewrites for rules
  that fail it.
metadata:
  version: "0.1.0"
spec: genome/intent.md
---

# Rules Audit

Evaluate project rules for enforceability before classification. The governing standard: a rule should read like a requirement, an acceptance criterion, or a process instruction. If it reads like advice, philosophy, or a mood, it cannot bind and will silently become dead weight in context.

## The bar

A well-formed rule sits at one of three levels, and the level predicts its rulegate shape:

| Level | Form | Typical shape |
|---|---|---|
| Requirement | "The system shall X" / "X must Y" | SCOPE, CLAIMS |
| Acceptance criterion | "Done means X is observable" | CLAIMS, sequencing done-when |
| Process instruction | "Before X, do Y" / "When X happens, do Z" | SEQUENCING |

A rule that fits none of these levels is either JUDGMENT (legitimately requires taste) or malformed (an enforceable intention phrased vaguely). The audit's job is telling those two apart, because the first is a real category and the second is fixable.

## Audit checks, per rule

1. **Atomicity.** One rule, one binding moment. A compound rule ("write tests first and keep coverage above 80% and never touch vendor/") splits into its atoms before anything else; each atom is audited separately.
2. **Observability.** Ask: what event, file state, or reply text would show this rule was broken? No answer means the rule is not at requirement level. "Be careful with migrations" fails; "migrations require a rollback script in the same commit" passes.
3. **Vague quantifiers.** "Generally", "when appropriate", "prefer X unless it makes sense", "try to". These force JUDGMENT tier by phrasing, not by nature. Flag each and draft the unhedged version; the author decides whether the hedge was meaningful or habitual.
4. **Resolvable references.** A rule pointing at something the repo cannot resolve ("follow the team's standards", "per the style guide") binds to nothing. Either inline the referenced content, point at a file that exists, or drop it.
5. **Dead weight.** Rules duplicating what a linter, formatter, pre-commit hook, or CI already enforces deterministically. Recommend deletion from the rules file entirely: prose duplication of hard enforcement is pure attention cost with zero added binding.
6. **Contradiction.** Rules that cannot both bind ("always ask before editing" vs "work autonomously"). Surface the pair; never silently pick a winner.

## Output format

One table, every rule, no exceptions:

| # | Rule (as written) | Verdict | Proposed action |
|---|---|---|---|
| 1 | ... | enforceable | classify as SEQUENCING |
| 2 | ... | rewritable | rewrite: "<requirement-level version>" |
| 3 | ... | judgment | classify as JUDGMENT (advisory); confirm the author accepts advisory-only |
| 4 | ... | dead | delete; already enforced by <mechanism> |
| 5 | ... | contradiction | conflicts with #N; author picks |

The **rewritable** category is where the audit earns its place. Most "unenforceable" rules are enforceable intentions phrased vaguely; the rewrite converts advice-level to requirement-level while preserving intent. Example: "be careful with database changes" becomes "schema changes require a migration file and a rollback script in the same commit".

## Human gate

Present the table and wait. Every rewrite requires explicit approval, because a rewrite that changes meaning is a miscompile at the rules layer, the one place a miscompile propagates into everything downstream. Apply approved rewrites to RULES.md; leave the original CLAUDE.md untouched unless the user asks for it to be updated to match.

## Standalone use

Runnable any time as a drift check ("audit my rules"). Rules files grow by accretion; rules added mid-project skip the audit unless it reruns. On rerun, audit only rules not present at the last audit if the user wants the fast version, or everything if structure may have rotted.

## What not to do

- Do not reject a rule for being strict. Strict and vague are different defects; only vague is a defect here.
- Do not rewrite JUDGMENT rules into fake requirements. "Prefer thin subsystems" losing its "prefer" becomes a lie about what is checkable. Taste rules stay taste rules, honestly advisory.
- Do not delete anything without approval, including dead weight.
