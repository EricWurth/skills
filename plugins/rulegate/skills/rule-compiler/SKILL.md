---
name: rule-compiler
description: >
  This skill should be used when a rulegate plan needs to be written, revised, or
  advanced: when the front gate has produced .rulegate/plan.md, when the user says
  "advance the plan", "replan", "next step", or reports discovered work mid-task,
  or when a scope-gate block requires restructuring the current plan.
metadata:
  version: "0.1.0"
spec: genome/intent.md
---

# Rule Compiler

Compile work requests into rule-compliant step plans. The executor never carries the rules; the plan carries them. Rule and recency become the same tokens.

## Plan format

`.rulegate/plan.md`:

```markdown
# Plan: <one-line goal, in the user's words>

## CURRENT
### Step 1 — <goal>
files: src/auth/*.py tests/test_auth.py
estimate: <expected effort: turns or wall-clock, allowing for failure>
done-when: <observable condition, not a feeling>

### Step 2 — <goal>
files: src/auth/session.py
estimate: <expected effort>
done-when: <observable condition>
```

Exactly one `## CURRENT` marker. To advance, move the marker; never delete completed steps (append `[done <timestamp>]` to their heading).

## Compilation rules

- Every SEQUENCING rule in RULES.md must be structurally satisfied by step order. "Test before fix" means the failing-test step precedes the source-edit step; the plan makes violation impossible rather than discouraged.
- Every step declares `files:` honestly. Narrow scope is the enforcement; `files: *` is a hole and needs a stated reason in the step body.
- `done-when` must be checkable from the ledger or the filesystem, never "when it seems right".
- `estimate:` is mandatory per step, sized to allow for normal failure. It exists so stuck-detection has a baseline: actuals running an order of magnitude past estimate is a red flag the executor must raise, not a number to quietly revise. Revising an estimate is a change request against the plan, with a reason.
- Compile execution order only. Never reinterpret the user's intent, drop a requirement, or add work they did not ask for. A plan that satisfies the rules but changes the request is a miscompile.

## Discovered work

When execution reveals work outside the current step (a second bug, a missing dependency, an out-of-scope fix), do not fold it into the current step. Report it in the reply so it re-enters through the front gate as its own request. The scope gate enforces this; this skill explains why: the front gate is the only place rules bind, and inline fixes bypass it.

## When the scope gate blocks

Two legitimate responses, in order of preference:

1. Report the discovered work and continue the current step without the blocked change.
2. If the blocked change is genuinely part of the current goal and the plan mis-scoped it, revise the plan: widen the step's `files:` line with a one-line justification appended to the step body, then retry. Widening without justification is the failure mode; the justification line is what the human audits later.

Never work around the gate by routing the change through a different tool.

## Miscompile review

The plan is one short document and it is the single point where enforcement can be wrong. On request ("review the plan"), re-derive the plan from the original request and RULES.md from scratch and diff against the existing plan rather than patching it. Constraint changes void plans; they do not amend them.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "This discovered bug is small, I'll just fix it inside the current step" | Discovered work never folds into the current step. It gets reported in the reply so it re-enters through the front gate — the only place rules bind. |
| "The user obviously meant to include this too, I'll add it while I'm compiling" | Compile execution order only. Reinterpreting intent, dropping a requirement, or adding unrequested work is a miscompile even if the rules are technically satisfied. |
| "files: * is simpler and I'll narrow it later" | Narrow scope is the enforcement. `files: *` is a hole and needs a stated reason in the step body now, not a promise to fix later. |
| "I'll just patch the plan to reflect the change instead of a full re-derive" | On "review the plan", re-derive from the original request and RULES.md from scratch and diff. Constraint changes void plans; they do not get amended in place. |
| "done-when is close enough if it feels finished" | done-when must be checkable from the ledger or the filesystem — never a feeling. |
| "The estimate was off, I'll just quietly bump the number" | Revising an estimate is a change request with a reason, not a quiet edit — it's the baseline stuck-detection measures against. |

## Red Flags

- Folding newly discovered work into the current step's `files:` instead of reporting it back for the front gate.
- Widening `files:` on a scope-gate block without a one-line justification appended to the step body.
- Routing a blocked change through a different tool to work around the scope gate.
- Patching `plan.md` in place after a "review the plan" request instead of re-deriving from scratch and diffing.
- A `done-when` that reads like a judgment call rather than an observable condition.
- Silently changing an `estimate:` value with no stated reason.
