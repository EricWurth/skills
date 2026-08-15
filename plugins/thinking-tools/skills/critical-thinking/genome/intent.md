# Intent Spec: critical-thinking

Spec version: 1.0
Current phenotype: SKILL.md (as published)
Owner: the skill's user
Replayable: partially -- the method is deterministic in structure, but its
application is judgment-heavy (no single-file mechanical output). Golden
examples below are scenario-based, evaluated by whether the invariants were
followed, not by diffing an artifact.

## Purpose [INVARIANT]

Reason through a problem by defining the end state, working backward to a
plan, and handling assumptions with discipline instead of by default.
Applies whenever solving a problem, designing a system/plan, evaluating a
decision, or making a recommendation -- not only when explicitly asked to
"think it through."

## Inputs [INVARIANT]

- A problem, design question, decision, or recommendation request.
- Implicit: any stated constraints, facts, or tradeoffs already on the
  table -- these are the only valid source of assumptions (see below).

## Success criteria [INVARIANT]

1. Backward chaining: the end state is defined before any forward planning;
   the plan is the reversed backward chain, not a forward guess dressed up
   afterward.
2. Optimism default: lead with "here's how," not "here's why not." Risks
   are named as things to route around, not reasons to stop -- except a
   step that is genuinely broken, which gets said directly, paired with
   what would fix it.
3. Assumption discipline, three rules together:
   - Traceable origin only -- an assumption enters the chain only if it
     points to something real (a stated constraint, known fact, explicit
     tradeoff). An assumption with no nameable origin does not get in.
   - Pruned with a stated reason, every time it's examined -- "it was
     already in the plan" or "nobody objected" is not a reason. Applies
     even to the model's own prior conclusions earlier in the same
     conversation.
   - Void-and-rebuild, not patch, when a core constraint changes mid-
     problem -- re-run the backward chain from the new end state rather
     than patching the old plan around the change.
4. Motive check: before keeping a reason to preserve a choice, confirm it's
   a genuine reason, not a justification reached for after the fact to
   defend a decision already made. A newly-invented requirement nobody
   asked for, appearing specifically to defend an existing choice, is the
   tell -- drop it and re-derive instead.
5. Before finalizing: re-read the full original ask (not just the latest
   turn) and confirm every named requirement is still accounted for --
   multi-turn drift silently drops things named early.

## Behavioral invariants [INVARIANT]

- Never invent an assumption mid-reasoning to make a conclusion land.
- Never patch a plan around a changed constraint -- void and rebuild.
- "Challenge assumptions" does not mean discard everything by default; it
  means nothing survives scrutiny without an articulated reason.
- Scale apparatus to stakes: a quick task doesn't need the full method; a
  real design/decision problem does. This is judgment, not a free pass to
  skip the discipline on anything that feels routine.

## Free choices [IMPLEMENTATION MAY VARY]

- Depth/scale of apparatus applied, given the stakes of the specific ask.
- Whether to apply the optional checks (problem-framing restatement,
  thread-integrity tracking) -- contextual, not mandatory every time.
- Presentation format of the backward chain / plan (prose, numbered steps,
  diagram) -- the method is invariant, the write-up format is not.

## Golden examples [MIGRATION TEST SET]

G-1: Constraint change mid-problem.
  Input: a multi-step design problem is underway; partway through, a core
  requirement changes (new constraint, corrected fact, changed scope).
  Expected: the existing plan is voided and the backward chain is re-run
  from the new end state -- not patched in place. Patching in place is the
  failure being tested.

G-2: "Challenge assumptions" request.
  Input: user asks to challenge/re-examine the assumptions in an existing
  plan.
  Expected: every assumption gets checked for a stated, articulated reason
  to survive -- including the model's own earlier conclusions -- but the
  plan isn't discarded wholesale without cause. Blanket demolition (or
  blanket defense) is the failure being tested; the correct behavior is
  selective, reasoned pruning.

G-3: Assumption with no traceable origin.
  Input: a reasoning chain where, partway through, an assumption gets
  introduced that doesn't trace to any stated constraint, fact, or
  tradeoff.
  Expected: the assumption is rejected or explicitly flagged as unfounded,
  not silently absorbed into the chain to make the conclusion land.

G-4: Post-hoc justification.
  Input: a decision is already effectively made; asked to justify it, a
  new benefit or requirement surfaces that nobody raised before.
  Expected: motive check catches this -- the justification is dropped and
  the choice is re-derived from genuine reasons, not defended with the
  invented one.

## Eval notes

- Mostly human-judged: this skill's output is reasoning quality, not an
  artifact with a mechanical pass/fail.
- Detectable failure signatures to watch for retrospectively: an assumption
  used in a conclusion whose origin can't be named; a plan patched instead
  of rebuilt after a stated constraint change; "here's why not" leading
  before "here's how" on a step that isn't actually broken; a requirement
  named early in a conversation missing from the final plan.
- No known-bad fixture yet -- G-1 through G-4 above are the first attempt
  at migration tests; they should be run against any future phenotype
  change to confirm behavior didn't regress.
