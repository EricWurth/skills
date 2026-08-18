# critical-thinking

A Claude Code / Claude skill that replaces default forward-guessing with a
disciplined method: define the end state, chain backward to the plan, and
handle assumptions with three explicit rules instead of by gut feel.

## Why this exists

Most "think it through" prompting either gets a plausible-sounding forward
guess, or a wall of caveats that never commits to a plan. This skill forces
two things every time it's genuinely warranted:

- **Backward chaining.** Define what "solved" looks like first. Only then
  work backward to what has to be true immediately before that, and the
  step before that, until you reach the current starting point. The
  reversed chain *is* the plan.
- **Disciplined assumptions.** Every assumption must trace to something
  real (a stated constraint, a known fact, an explicit tradeoff) to enter
  the chain at all; every assumption needs a stated reason to survive
  scrutiny, every time it's re-examined; and a changed core constraint
  voids the plan for a full re-run instead of getting patched around.

It also includes a **motive check** (catching the specific failure mode
where a justification gets invented after a decision is already made, just
to defend it) and an optimism default that leads with "here's how"
instead of "here's why not."

## Install

Drop the `critical-thinking/` folder into your `.claude/skills/` directory
(project-level or `~/.claude/skills/` for global). There are no
dependencies, external tools, or configuration to set up.

## Use

It's designed to trigger proactively: whenever you're solving a problem,
designing a system, evaluating a decision, or making a recommendation, not
just when explicitly asked to "think it through." Trigger phrases like
"think this through" or "challenge assumptions" invoke it directly, but the
better test of whether it's working is whether the reasoning underneath a
recommendation holds up to the assumption rules, not whether you had to ask.

## Design notes

- `SKILL.md` is the phenotype: the instructions Claude actually reads and
  follows.
- `genome/intent.md` is the intent spec: purpose, success criteria,
  behavioral invariants, free choices, and four scenario-based golden
  examples, kept separate from the phenotype on purpose. If this skill's
  format ever needs to migrate (new SKILL.md conventions, a different
  packaging shape), the genome is what you regenerate the phenotype from,
  not something you reverse-engineer from the old file. See the
  `skill-evolution` skill in this repo for more on why that split exists.
