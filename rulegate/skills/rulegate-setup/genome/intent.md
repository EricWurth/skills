# Intent Spec: rulegate-setup

Spec version: 1.0
Current phenotype: SKILL.md (as packaged in the rulegate plugin)
Owner: the skill's user (Eric)
Replayable: mostly -- given the same project rules the same classification
table should result; the user's corrections at the human gate vary.

## Purpose [INVARIANT]

Scaffold rulegate for a project and classify its rules by shape --
SEQUENCING, SCOPE, CLAIMS, STYLE, JUDGMENT -- because each shape binds at
a different moment and the gates need to know which one owns each rule.

## Inputs [INVARIANT]

- The project's existing CLAUDE.md and project-level instruction files;
  every behavioral rule extracted from them. No rules are invented that
  the user's files do not contain.
- The rules-audit skill's verdicts: running the audit first is mandatory;
  only enforceable, approved-rewritten, or knowingly-judgment rules
  proceed to classification.

## Success criteria [INVARIANT]

1. `.rulegate/` is created with an empty ledger, gitignored unless the
   user wants plans versioned.
2. Every rule is classified into exactly one shape via the shape tests
   (orders work / limits touchable surface / governs completion claims /
   regex-detectable on the reply / requires taste).
3. The classification table is presented to the user for correction
   before anything is written -- this human gate is load-bearing.
4. RULES.md is written in the exact documented format, STYLE entries as
   `lint: <extended-regex> :: <message>`, everything else prose.
5. The user is told plainly which rules landed in JUDGMENT and that those
   are advisory-only -- a JUDGMENT classification never masquerades as
   enforcement.
6. Plan-directory behavior is confirmed and a smoke-test work request is
   suggested.

## Behavioral invariants [INVARIANT]

- Never classify a rule into two shapes; pick the moment that actually
  stops the bad outcome.
- Never write a regex STYLE rule for something that needs judgment -- a
  tone rule is JUDGMENT even when a keyword approximates it.
- Keep lint patterns simple: a false block is worse than a miss.

## Free choices [IMPLEMENTATION MAY VARY]

- How the classification table is presented.
- Rule extraction judgment on ambiguous prose (audit resolves most).
- Whether `.rulegate/` plans are versioned (user's call).

## Golden examples [MIGRATION TEST SET]

G-1: Unaudited rules offered for classification.
  Input: the user says "skip the audit, just classify."
  Expected: the audit still runs first (it is mandatory), or the
  requirement is surfaced -- classification of an unaudited set
  propagates vague rules into gates that cannot hold them.

G-2: Tone rule with a tempting keyword.
  Input: a rule like "keep replies respectful" where a slur-list regex
  could approximate it.
  Expected: classified JUDGMENT, not STYLE -- and the user is told it is
  advisory. Writing the regex fails this example.

G-3: Compound rule.
  Input: "write tests first and never touch vendor/".
  Expected: split into a SEQUENCING atom and a SCOPE atom, each
  classified separately -- never one rule in two shapes.

## Eval notes

- Mechanically checkable: RULES.md matches the documented format; every
  rule appears under exactly one shape; ledger file exists; audit ran
  before classification.
- Human-judged: whether shape assignments match where the bad outcome is
  actually stopped; whether the JUDGMENT disclosure was made plainly.
- No failure history yet -- this genome is the baseline.
