---
name: skill-evolution-sweep
description: Run the weekly skill-evolution sweep across every installed skill.
disable-model-invocation: true
version: 2.0.0
changelog: >
  2.0.0: promotion during scheduled runs is now allowed, gated on the same
  automated eval gate (regression + discrimination, executed in CI) as an
  interactive run -- the human-sign-off restriction this skill used to
  enforce moved to skill-evolution's genome, where it was replaced by that
  gate, so it no longer applies here either.
  1.0.0: first version. Scheduled sweep that stopped short of promotion,
  pending an explicit synchronous human decision.
---

Run the `skill-evolution` skill as a recurring maintenance pass.

1. Scan installed skills for a `genome/intent.md` file. Each one found is an
   eligible target for this sweep; a skill without one is out of scope, not
   an error.
2. For each target, run the full `skill-evolution` process: refresh the
   technique library, identify candidates against that skill's free
   choices and failure history, evaluate for fitness, prioritize (allowing
   layering), and sandbox-test exactly one candidate against regression and
   discrimination.
3. Promote exactly as an interactive run would: on a clean pass through the
   automated eval gate (regression + discrimination actually executed in
   CI, not asserted), promote -- regenerate the phenotype from the updated
   genome, version-bump, changelog, commit, tag. A scheduled run is not a
   lighter-weight gate than an interactive one; it's the same gate, just
   unattended. A candidate that fails the gate is shelved, exactly as it
   would be interactively -- not escalated to wait on a human.
4. At the end, report: which skills were swept, what candidates were found
   (if any), what was tested, what was promoted (with its new version and
   commit/tag), and what was shelved and why. A sweep that finds nothing
   worth promoting is a normal, healthy result; say so plainly rather than
   padding the report.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "Nobody's watching, so a lighter pass through the steps is fine" | Unattended changes nothing about rigor. Every per-target step -- refresh, identify, evaluate, prioritize, sandbox-test, and the eval gate itself -- still runs in full, exactly as an interactive run would. |
| "The sandbox looked clean, that's basically the gate" | The gate is CI actually executing regression and discrimination against the candidate, not a narrative judgment that it would probably pass. Promoting on an asserted-not-executed result is the exact shortcut the automated gate exists to remove. |
| "This skill has no genome/intent.md, that's a problem I should flag" | A skill without a genome is simply out of scope for this sweep, not an error condition -- it should be silently excluded, not logged as a failure. |
| "Nothing passed the gates this sweep, I should find something to report" | An all-clear sweep is a normal, healthy result. Padding the report to look like more happened is worse than plainly stating nothing was found worth promoting. |

## Red Flags

- Promoting on an asserted-clean sandbox result instead of one CI actually executed
- Treating "this is an unattended run" as a reason to skip or shortcut refresh, identify, evaluate, prioritize, sandbox-test, or the eval gate for any target
- Logging a genome-less skill as an error or failure instead of simply excluding it from the sweep
- An end-of-sweep report that omits, for any target, what was found, what was tested, or what was promoted vs. shelved
- Manufacturing a marginal candidate to make an all-clear sweep look more productive than it was
- Promoting without the version bump / changelog / commit / tag trail that makes a later rollback a revert instead of a scramble

## Setting this up

This file follows the same shape your scheduling tool expects for a
recurring prompt: a short `name` and `description`, then the instructions
the agent runs on each firing. Wire it to a weekly cadence (this is a
maintenance sweep, not something that needs daily runs) using whichever
scheduling mechanism your environment provides -- a native scheduled-task
feature, a cron entry that invokes your agent CLI, or an equivalent. The
cadence itself is a free choice (see `genome/intent.md` in the parent
skill) -- weekly is a reasonable default, not a requirement.

See `references/example.md` for a real, filled-in scheduled-sweep prompt
with notes on why it's shaped that way.
