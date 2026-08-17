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
version: 2.0.0
spec: genome/intent.md
changelog: >
  2.0.0: replaces the synchronous human sign-off gate with the automated
  eval gate (regression + discrimination, executed in CI against the
  sandboxed candidate) as the sole promotion checkpoint -- promotion is now
  automatic on a clean pass, in scheduled sweeps and interactive runs
  alike. Every promotion regenerates the phenotype from the updated genome,
  version-bumps, and tags, so a later quality regression is a revert, not
  an emergency.
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

All six steps run straight through, autonomously, no pausing for
confirmation -- refresh, identify, evaluate, prioritize, sandbox-test, and
gate. Report the result at the end, not a check-in at each step. This is
true whether the run is interactive or a scheduled sweep; there is no
lighter unattended mode.

Step 6 (gate) is still the one real checkpoint, but the checkpoint is the
automated eval gate, not a person. Regression and discrimination must both
actually execute in CI against the sandboxed candidate -- a narrative
"this looks like it would pass" is not a passed gate. A clean CI result is
what makes the write to the target skill's live/production files happen;
mutation/optimizer work still stays in branches or sandbox until that gate
clears, but nothing pauses for a synchronous decision once it does. The
safety net that replaces the old sign-off step is version control: every
promotion is its own commit, version-bumped and tagged, so a quality
regression discovered later is a revert, not an emergency.

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

6. **Gate, promote, and report.** Push the sandboxed candidate through the
   automated eval gate: regression and discrimination both executed in CI,
   not asserted from a walkthrough. On a clean pass, promote automatically
   -- update the target skill's `genome/intent.md` free-choice entry the
   candidate maps to, regenerate `SKILL.md` from the updated genome
   (regenerate, don't hand-patch), bump the version, append a changelog
   entry, commit, and tag. Record the promotion (what changed, why, and
   the fixture that proves it) in the target skill's own history so the
   next sweep can see it. On a failed or inconclusive gate, shelve the
   candidate: log it as evaluated-and-rejected in
   `references/technique-library.md`'s free-choice mapping notes, not as
   if it were never considered. Most sweeps should end with nothing
   promoted -- that is expected, not a shortfall. See
   `references/review-checklist.md` for the condensed end-of-sweep report
   format.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "The sandbox result looks clean, that's basically the gate" | A gate you asserted passed is not a gate that passed. Step 6 requires regression and discrimination to actually *execute in CI* against the candidate -- a narrative judgment that it "would pass" is exactly the shortcut the automated gate exists to remove. |
| "This change is small/obviously safe, I can skip straight to applying it" | Step 5 exists precisely to stop the "technique I already know" shortcut -- the genome names this as "the specific failure this skill exists to prevent," from a past run that did exactly this and had to be corrected. |
| "The technique is well-regarded in the literature, that's enough to sandbox it" | Fitness is skill-specific, not generic. Step 3 requires a documented problem *for this skill*, traced to its own eval notes -- general reputation fails fitness "full stop, regardless of how well-regarded." |
| "Regression passed, so the change is proven" | Regression only shows nothing broke. Discrimination -- a new adversarial fixture the unmodified skill would have passed incorrectly -- is what proves the gain is real, per Step 5. |
| "I found a second good candidate, might as well bundle both in" | Step 4 requires selecting exactly one new candidate per pass, so a pass/fail result stays attributable to a single change; layering happens across passes, not within one. |

## Red Flags

- Promoting a candidate whose regression/discrimination gate was self-asserted rather than actually executed in CI
- Sandboxing a candidate that has no documented, skill-specific failure in that skill's own eval notes or history
- Skipping the library refresh (Step 1) and going straight to a technique already top of mind
- Treating a regression pass alone as sufficient proof, with no discrimination fixture constructed
- Promoting more than one untested candidate in a single gate decision
- Rewriting an existing technique-library.md entry's substance in place instead of appending a dated note or new entry
- Hand-patching `SKILL.md` on promotion instead of regenerating it from the updated genome
- Promoting without a version bump, changelog entry, commit, and tag -- that trail is what makes a later rollback a revert instead of a scramble

## Genome (intent spec)

This skill's genome -- purpose, success criteria, behavioral invariants,
free choices, and golden examples, separated from this phenotype file --
lives at `genome/intent.md`. Specs change by hand only; this SKILL.md is
the phenotype and should regenerate from the spec on format migration, not
be patched independently of it.
