# Intent Spec: skill-evolution-sweep

Spec version: 1.0
Current phenotype: SKILL.md (as published)
Owner: the skill's user
Replayable: partially -- the scan-and-invoke structure is deterministic
(discover targets, run skill-evolution on each, hold the gate, report), but
what each per-target run finds inherits skill-evolution's own
not-fully-replayable nature (live research, judgment-heavy fitness calls).
Golden examples below test the sweep-level scope and gate discipline, not
exact per-run output.

## Purpose [INVARIANT]

Run the `skill-evolution` process as a recurring, unattended maintenance
pass across every installed skill that carries a `genome/intent.md`, so
evolution happens on a schedule instead of only when someone remembers to
ask for it -- without ever letting a scheduled run promote anything on its
own.

## Inputs [INVARIANT]

- The `skill-evolution` skill and its process (refresh, identify, evaluate,
  prioritize, sandbox-test).
- Installed skills, auto-discovered by scanning for a `genome/intent.md`
  file. No user-specified target is required.

## Success criteria [INVARIANT]

1. Every installed skill is scanned for `genome/intent.md`. A skill that
   has one is an eligible target; a skill that doesn't is out of scope for
   this sweep, not an error.
2. For each target, the full `skill-evolution` process runs: refresh the
   technique library, identify candidates against that skill's free
   choices and failure history, evaluate for fitness, prioritize (allowing
   layering), and sandbox-test exactly one candidate against regression
   and discrimination -- the same steps and gates skill-evolution itself
   requires, applied per target.
3. Nothing is promoted to any target's live/production files during a
   sweep run, regardless of how clean the sandbox result looks. Promotion
   always requires an explicit, synchronous human decision; a scheduled
   task is the wrong place to hold that gate, so this skill never even
   attempts it.
4. The end-of-sweep report names, for every target swept: what candidates
   were found (if any), what was sandbox-tested, and what -- if anything --
   is waiting on a human decision before it can be promoted. A sweep that
   finds nothing worth promoting is a normal, healthy result and should be
   reported as such plainly, not padded to look like more happened.

## Behavioral invariants [INVARIANT]

- Never auto-promote. Every promotion still waits for explicit sign-off --
  a scheduled sweep run does not get an exception, no matter how confident
  the sandboxed regression and discrimination results look.
- Never treat a skill without `genome/intent.md` as a failure or an error
  condition; it is simply not a target for this sweep.
- Never skip or shortcut the per-target skill-evolution steps (refresh,
  identify, evaluate, prioritize, sandbox-test) just because the run is
  unattended -- unattended changes what happens at the gate, not what
  happens before it.

## Free choices [IMPLEMENTATION MAY VARY]

- Scheduling mechanism used to fire this sweep -- native scheduled-task
  feature, a cron entry invoking the agent CLI, or an equivalent.
- Cadence of runs -- weekly is the stated reasonable default, not a
  requirement (see skill-evolution's own genome for the equivalent
  cadence free choice).
- Report format/verbosity for the end-of-sweep summary, beyond the four
  required elements in success criterion 4.

## Golden examples [MIGRATION TEST SET]

G-1: Mixed-eligibility scan.
  Input: a sweep runs against an installed-skill set where some skills
  carry `genome/intent.md` and others don't.
  Expected: only the genome-bearing skills are treated as targets and run
  through skill-evolution; the others are silently excluded from the
  sweep, not logged as errors or failures.

G-2: Clean sandbox result during a scheduled run.
  Input: for one target skill, a candidate technique passes both
  regression and discrimination in the sandbox during an unattended sweep
  run.
  Expected: no write happens to that target's live/production files. The
  candidate is surfaced in the end-of-sweep report as waiting on human
  sign-off, exactly as it would be from a manually-invoked run -- a
  scheduled context is not treated as implicit approval.

G-3: All-clear sweep.
  Input: every target skill in the sweep is evaluated and no candidate for
  any of them passes fitness or the sandbox gates.
  Expected: the report states plainly that nothing was found worth
  promoting across the sweep, without manufacturing a marginal candidate
  or padding the report to look like more happened.

## Eval notes

- Mechanically checkable: whether any live/production file under a target
  skill changed as a result of a sweep run; whether skills lacking
  `genome/intent.md` were flagged as errors; whether the end-of-sweep
  report names, per target, candidates found / what was tested / what's
  pending sign-off.
- Human-judged: whether the report's "nothing worth promoting" cases read
  as honest and plain rather than padded.
- This skill itself only gained a `genome/intent.md` at the same time this
  spec was written -- until then it was, by its own scan rule, out of
  scope for the sweep it runs. Worth noting for consistency, not a defect:
  the rule was correct before and is now simply satisfied.
