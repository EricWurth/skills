# skill-evolution

Evolves your other skills on a schedule: finds a real technique gap, proves the gain, then gates promotion on your sign-off.

## What's in it

| Skill | Invocation | What it does |
|---|---|---|
| `skill-evolution` | automatic | The sweep itself. Runs against one or more skills that carry a `genome/intent.md`. |
| `/skill-evolution-sweep` | you type | The scheduled entry point. Runs the above across every installed skill it finds a genome for. |

The sweep stays model-invoked deliberately: `/skill-evolution-sweep` calls
it, and a user-invoked skill cannot be called by another skill.

## Requirements

- **Target skills must carry `genome/intent.md`.** That file is how eligible
  targets are discovered, and anything marked `[INVARIANT]` in it is
  off-limits to autonomous change. A skill without a genome is out of scope,
  not an error.
- **Web research**, to refresh the technique library.
- Nothing else. No scripts, no subagents.

## Setup

```
/plugin marketplace add EricWurth/skills
/plugin install skill-evolution@ericwurth
```

A Claude Code / Claude skill that evolves *other* skills on a disciplined
schedule: refresh a technique catalog against current research, find a real
technique gap for a specific target skill, prove the gain with a
constructed test, sandbox it, and gate promotion behind explicit human
approval.

## Why this exists

The obvious way to "improve a skill" is to notice a technique you like and
apply it. That's also how you end up bolting on fashionable patterns that
solve a problem the skill never actually had. This skill exists to prevent
exactly that shortcut, by forcing four things in order:

1. **Refresh before reaching.** Check the technique library against current
   research before considering anything.
2. **Ground fitness in the target skill's own history.** A technique only
   qualifies if it maps to a free choice the target skill has declared, and
   only counts as "fit" if that skill has a *documented, concrete* problem
   the technique addresses -- not because the technique is well-regarded in
   general.
3. **Prove it, don't assert it.** Every candidate needs a constructed test
   case that fails today and measurably improves with the change.
4. **Sandbox, then gate.** Test in scratch space against two bars --
   regression (existing behavior still holds) and discrimination (a new
   adversarial fixture proves the specific gap closed) -- and promote to
   the live skill only on explicit human sign-off.

Most sweeps should find nothing worth promoting. That's treated as a valid,
expected outcome, not a failure to search harder.

## The genome/phenotype split

Every skill this system manages carries two files:

- **`SKILL.md`** (the phenotype) -- what the model actually reads and
  executes at runtime.
- **`genome/intent.md`** (the spec) -- purpose, success criteria, behavioral
  invariants, free choices, and golden examples, written and changed by
  hand only.

The phenotype is meant to *regenerate* from the genome when the skill's
packaging format changes, rather than being hand-patched out of sync with
its own spec. `skill-evolution` uses this split directly: it auto-discovers
target skills by scanning for a `genome/intent.md`, reads that skill's free
choices and invariants to know what it's allowed to touch, and never
proposes a change to anything marked `[INVARIANT]` -- that's a spec
conversation with a human, not something this skill decides on its own.

## Install

Drop the `skill-evolution/` folder into your `.claude/skills/` directory.
It reads and appends to its own `references/technique-library.md` over
time -- treat that file as a living catalog, not a static reference.

To make a skill eligible as an evolution *target*, give it a
`genome/intent.md` alongside its `SKILL.md`, following the shape in
`genome/intent.md` in this folder (or in `critical-thinking/` and
`storm-research/` elsewhere in this repo, which both use the same
convention).

## Use

Say "run evolution," "evolve this skill," or "check for new techniques."
Steps 1-5 (refresh, identify, evaluate, prioritize, sandbox-test) run
autonomously with no pause for confirmation -- they're reversible work in
scratch space. Step 6 (gate) always stops for an explicit decision before
anything touches a skill's live files. `references/review-checklist.md`
has the condensed end-of-sweep report format.

## Running it on a schedule

Cadence -- manual invocation vs. a recurring sweep -- is a free choice, not
a requirement. `skill-evolution-sweep/SKILL.md` is a ready-to-adapt
definition for running this as a weekly maintenance pass on whichever
scheduling mechanism your environment provides. It never auto-promotes: a
scheduled run still stops at the gate and reports what needs a human
decision, exactly like an interactive run would.
`skill-evolution-sweep/references/example.md` is a real, filled-in
instance of that template, included so the pattern isn't just
theoretical.

## Contents

- `skill-evolution/SKILL.md` -- the phenotype: what the model reads and
  executes.
- `skill-evolution/genome/intent.md` -- the intent spec.
- `skill-evolution/references/technique-library.md` -- the living
  technique catalog, refreshed and appended to on every run.
- `skill-evolution/references/review-checklist.md` -- the condensed
  end-of-sweep report format.
- `skill-evolution-sweep/SKILL.md` -- the sibling, user-invoked skill: an
  adaptable definition for running this as a recurring weekly sweep
  instead of only on demand.
- `skill-evolution-sweep/references/example.md` -- a real, filled-in
  instance of that template.
