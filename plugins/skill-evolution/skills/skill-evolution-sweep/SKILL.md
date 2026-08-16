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

## Setting this up

This file follows the same shape your scheduling tool expects for a
recurring prompt: a short `name` and `description`, then the instructions
the agent runs on each firing. Wire it to a weekly cadence (this is a
maintenance sweep, not something that needs daily runs) using whichever
scheduling mechanism your environment provides -- a native scheduled-task
feature, a cron entry that invokes your agent CLI, or an equivalent. The
cadence itself is a free choice (see `genome/intent.md` in the parent
skill) -- weekly is a reasonable default, not a requirement.
