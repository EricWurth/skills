---
name: skill-evolution
description: >
  Run a disciplined evolution sweep against one or more of your installed
  skills: refresh the technique library with current research, identify
  real candidate techniques against each skill's free-choices and failure
  history, evaluate each for actual gain, prioritize, then sandbox-test the
  top candidate through a regression + discrimination gate before
  promoting. Use when you say "run evolution", "evolve this skill", "check
  for new techniques", or ask what's changed in agent/skill design since
  the last sweep. Distinct from maintenance (content tuning within the
  current format) -- evolution is specifically about adopting a new
  technique.
version: 1.0.0
spec: genome/intent.md
changelog: >
  1.0.0: first version. Adds the mandatory identify -> evaluate ->
  prioritize -> test discipline and the self-refreshing research step, in
  place of an earlier ad hoc pattern that reached for a known technique
  first instead of walking the catalog.
---

# skill-evolution

Evolve a target skill by finding a real technique gap, proving the gain,
and testing it -- not by reaching for whatever technique is already top of
mind.

## Run mode

Steps 1-5 run straight through, autonomously, no pausing for confirmation
between them -- refresh, identify, evaluate, prioritize, and sandbox-test
are all reversible work happening in scratch/sandbox space. Report the
result at the end, not a check-in at each step.

Step 6 (gate) is the one checkpoint that stays: writing into a skill's
live/production directory. That's not caution for its own sake -- it's a
specific boundary worth holding deliberately: mutation/optimizer agents
write to branches or sandbox only; promotion into production is a human
decision. Everything up to that point needs no sign-off. Only the actual
write to the live path does.

## Steps

1. **Refresh the library.** Before anything else, read
   `references/technique-library.md`. Then run a scoped web search for
   agent/skill-design techniques published or updated since the library's
   last research-pass date (see the date at the top of the file). Look
   specifically for: new pattern names, new benchmarked techniques, and
   material updates to techniques already in the library (a new measured
   benefit or a newly-documented failure mode counts as material; a blog
   restating an existing pattern does not).

   - Genuinely new technique -> append a new dated entry (same fields as
     existing entries: what it is / signal to use / benefit / cost / risk /
     free-choice mapping / sources).
   - Material update to an existing technique -> add a dated note under
     that entry. Never rewrite an existing entry's substance in place.
   - Nothing new found -> say so and move on. A refresh that finds nothing
     is a valid, expected outcome, not a failure to search harder.

2. **Identify candidates.** For the target skill: read its spec, its
   free-choices section, and its own failure history (eval notes, past
   promotions/rejections). Cross every technique in the (now-refreshed)
   library against that skill's free-choice slots. A technique only
   qualifies as a candidate if it maps to a declared free choice -- a
   technique that would touch an invariant is a spec-change proposal to
   the user, not an evolution candidate, per the adoption rule.

3. **Evaluate each candidate for fitness against THIS skill.** A technique's
   general benefits (from the library) are not evidence it belongs here --
   fitness is skill-specific, not generic. For every candidate that maps to
   a free choice, require:
   - **A real problem, for this skill, named concretely.** Not "this
     technique generally reduces variance" -- does *this skill* have a
     documented instance of the failure the technique addresses? Check the
     skill's own eval notes/history first. A technique with no problem to
     solve for this skill fails fitness here, full stop, regardless of how
     well-regarded the technique is in general.
   - **A measurable improvement.** A test case that demonstrably fails
     *today* without the technique, and passes (or measurably improves)
     with it. "Seems like it would help" is not measurable; a constructed
     fixture with a before/after result is. If you can't construct one, the
     candidate isn't ready -- mark it "speculative," not fit, and do not
     sandbox it this round.
   - A cost/risk read: implementation cost, regression risk, Goodhart risk
     (does it reward gaming the metric over the actual intent), and
     whether it's reversible if wrong.

   A candidate with a real, documented, current problem and a measurable
   test beats a candidate that is merely well-regarded in the literature
   but has never actually bitten this particular skill.

4. **Prioritize, allowing layering.** Rank candidates by fitness (above),
   but before ranking as if only one can win, check whether candidates
   compose instead of compete -- a verification-layer technique (maker-
   checker, LLM-as-judge) and a generation-layer technique (templated
   generation, few-shot examples) usually stack cleanly rather than
   substitute for each other. Only treat two candidates as genuine rivals
   when they'd actually conflict if both were adopted (e.g. two different
   verification mechanisms for the same criterion). Select exactly one new
   candidate to carry into sandboxing this pass, so a pass/fail result
   stays attributable to a single change -- layering happens across passes,
   not within one.

5. **Sandbox-test the candidate.** Apply the chosen technique to a copy of
   the target skill in scratch/sandbox space; the live skill directory is
   untouched during this step. Two gates must both pass before the
   candidate is eligible for promotion:
   - **Regression** -- the target skill's existing golden examples still
     pass under the modified phenotype. A technique that fixes the new
     problem but breaks a previously-passing golden is not a net win; it's
     a trade that needs to be named as a trade, not shipped silently.
   - **Discrimination** -- construct a new adversarial fixture that
     specifically targets the gap the candidate claims to close, and
     confirm it now fails correctly (catches the problem) where the
     unmodified skill would have passed it incorrectly. A regression pass
     alone proves nothing new; discrimination is what proves the gain is
     real, not assumed.

   Log the sandbox result either way. A candidate that fails regression or
   discrimination is rejected and logged as rejected -- that is a valid,
   useful outcome, not a failed run.

6. **Gate and report.** Present the sandboxed diff, the regression result,
   and the discrimination result to the user, with a clear recommendation.
   Promotion into the target skill's live/production files happens only on
   explicit human sign-off -- every time, no exceptions for how confident
   the sandbox result looks. If approved, apply the same change to the
   live skill directory and record the promotion (what changed, why, and
   the fixture that proves it) in the target skill's own history so the
   next sweep can see it. If the user declines, shelve the candidate:
   log it as evaluated-and-rejected in `references/technique-library.md`'s
   free-choice mapping notes, not as if it were never considered. Most
   sweeps should end with nothing promoted -- that is expected, not a
   shortfall. See `references/review-checklist.md` for the condensed
   end-of-sweep report format.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "It passed regression and discrimination cleanly, that's basically sign-off" | A clean sandbox result is what makes promotion *eligible*, not what makes it *approved*. Step 6 requires explicit human sign-off "every time, no exceptions for how confident the sandbox result looks." |
| "This change is small/obviously safe, I can skip straight to applying it" | Step 5 exists precisely to stop the "technique I already know" shortcut -- the genome names this as "the specific failure this skill exists to prevent," from a past run that did exactly this and had to be corrected. |
| "The technique is well-regarded in the literature, that's enough to sandbox it" | Fitness is skill-specific, not generic. Step 3 requires a documented problem *for this skill*, traced to its own eval notes -- general reputation fails fitness "full stop, regardless of how well-regarded." |
| "Regression passed, so the change is proven" | Regression only shows nothing broke. Discrimination -- a new adversarial fixture the unmodified skill would have passed incorrectly -- is what proves the gain is real, per Step 5. |
| "I found a second good candidate, might as well bundle both in" | Step 4 requires selecting exactly one new candidate per pass, so a pass/fail result stays attributable to a single change; layering happens across passes, not within one. |

## Red Flags

- Applying a technique to the live/production skill directory before the user has explicitly signed off, no matter how clean the sandbox looked
- Sandboxing a candidate that has no documented, skill-specific failure in that skill's own eval notes or history
- Skipping the library refresh (Step 1) and going straight to a technique already top of mind
- Treating a regression pass alone as sufficient proof, with no discrimination fixture constructed
- Promoting more than one untested candidate in a single gate decision
- Rewriting an existing technique-library.md entry's substance in place instead of appending a dated note or new entry

## Genome (intent spec)

This skill's genome -- purpose, success criteria, behavioral invariants,
free choices, and golden examples, separated from this phenotype file --
lives at `genome/intent.md`. Specs change by hand only; this SKILL.md is
the phenotype and should regenerate from the spec on format migration, not
be patched independently of it.
