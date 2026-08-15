---
name: rulegate-setup
description: >
  This skill should be used when the user says "set up rulegate", "init rulegate",
  "initialize rule enforcement", "migrate my CLAUDE.md rules", or asks to make their
  project rules enforceable. It scaffolds the .rulegate directory and converts existing
  prose rules into the classified RULES.md format the gates read.
metadata:
  version: "0.1.0"
spec: genome/intent.md
---

# Rulegate Setup

Scaffold rulegate for a project and classify its rules by shape, because each shape binds at a different moment and the gates need to know which one owns each rule.

## Steps

1. Create `.rulegate/` in the project root. Add `.rulegate/ledger.jsonl` (empty) and ensure `.rulegate/` is gitignored unless the user wants plans versioned.
2. Read the project's existing CLAUDE.md and any project-level instruction files. Extract every behavioral rule.
3. Run the `rules-audit` skill on the extracted rules first. This step is mandatory: classification of an unaudited rule set propagates vague rules into gates that cannot hold them. Only rules the audit marks enforceable, approved-rewritten, or knowingly-judgment proceed to classification.
4. Classify each rule into exactly one shape and present the classification table to the user for correction before writing anything. This human gate is load-bearing: misclassified rules bind at the wrong moment or not at all.

| Shape | Test | Bound by |
|---|---|---|
| SEQUENCING | Does it order work? ("test before fix") | Front-gate planner, compiled into plan steps |
| SCOPE | Does it limit what may be touched? | PreToolUse scope gate |
| CLAIMS | Does it govern completion/verification language? | Stop-hook ledger check |
| STYLE | Is it detectable by a regex on the reply? | Stop-hook lint |
| JUDGMENT | Requires taste to evaluate? ("prefer thin subsystems") | Advisory judge only; annotates, never blocks |

5. Write `.rulegate/RULES.md` in this exact format:

```markdown
# Rulegate rules — classified by binding moment

## SEQUENCING
- When fixing a bug, a failing test that reproduces it must exist before source edits.

## SCOPE
- Never modify files under vendor/ or generated/.

## CLAIMS
- Completion or verification claims require a fresh passing check in the ledger.

## STYLE
lint: \u2014 :: em dashes are banned; use commas, colons, or restructure
lint: (leverage|utilize) :: banned words; use plain verbs

## JUDGMENT
- Prefer thin subsystems over hardcoded lookup tables.
```

STYLE entries use `lint: <extended-regex> :: <message>`; everything else is prose. Keep patterns simple; a false block is worse than a miss.

6. Tell the user plainly which of their original rules landed in JUDGMENT, because those are advisory in v0.1: the judge annotates violations but cannot block. Do not let a JUDGMENT classification masquerade as enforcement.
7. Confirm the plan directory behavior: the front gate writes `.rulegate/plan.md` per work request, and the scope gate reads its `## CURRENT` step. Suggest the user run one small work request as a smoke test and check that a plan file appears.

## What not to do

- Do not invent rules the user's files do not contain.
- Do not classify a rule into two shapes; pick the moment that actually stops the bad outcome.
- Do not write regex STYLE rules for things that need judgment; a tone rule is JUDGMENT even if a keyword approximates it.
