---
name: skill-evolution-sweep
description: Run the weekly skill-evolution sweep across every installed skill.
disable-model-invocation: true
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
3. Do **not** promote anything to a skill's live files during this
   scheduled run. Promotion always requires an explicit, synchronous
   human decision -- a scheduled task is the wrong place for that gate.
4. At the end, report: which skills were swept, what candidates were found
   (if any), what was tested, and what -- if anything -- is waiting on a
   human decision before it can be promoted. A sweep that finds nothing
   worth promoting is a normal, healthy result; say so plainly rather than
   padding the report.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "Nobody's watching, and the sandbox result is clean -- just ship it" | This is the exact failure this skill exists to prevent. Step 3 and the genome are explicit: promotion always requires an explicit, synchronous human decision, and "a scheduled task is the wrong place for that gate" -- an unattended context is not implicit approval. |
| "It's a scheduled run, so a lighter pass through the steps is fine" | Unattended changes what happens at the gate, not what happens before it. Every per-target step -- refresh, identify, evaluate, prioritize, sandbox-test -- still runs in full. |
| "This skill has no genome/intent.md, that's a problem I should flag" | A skill without a genome is simply out of scope for this sweep, not an error condition -- it should be silently excluded, not logged as a failure. |
| "Nothing passed the gates this sweep, I should find something to report" | An all-clear sweep is a normal, healthy result. Padding the report to look like more happened is worse than plainly stating nothing was found worth promoting. |

## Red Flags

- Writing to any target skill's live/production files during a scheduled sweep run, regardless of how clean the sandbox result looks
- Treating "this is an unattended run" as a reason to skip or shortcut refresh, identify, evaluate, prioritize, or sandbox-test for any target
- Logging a genome-less skill as an error or failure instead of simply excluding it from the sweep
- An end-of-sweep report that omits, for any target, what was found, what was tested, or what's waiting on human sign-off
- Manufacturing a marginal candidate to make an all-clear sweep look more productive than it was

## Setting this up

This file follows the same shape your scheduling tool expects for a
recurring prompt: a short `name` and `description`, then the instructions
the agent runs on each firing. Wire it to a weekly cadence (this is a
maintenance sweep, not something that needs daily runs) using whichever
scheduling mechanism your environment provides -- a native scheduled-task
feature, a cron entry that invokes your agent CLI, or an equivalent. The
cadence itself is a free choice (see `genome/intent.md` in the parent
skill) -- weekly is a reasonable default, not a requirement.
