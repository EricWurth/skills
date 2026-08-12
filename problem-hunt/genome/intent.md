# Intent Spec: problem-hunt

Spec version: 1.0
Current phenotype: SKILL.md (as uploaded to claude.ai)
Owner: the skill's user (Eric)
Replayable: partially -- the pipeline and gates are fixed; the scan
content is live, so golden examples test funnel discipline and gate
behavior.

## Purpose [INVARIANT]

Find a problem in AI that people are still failing at in practice,
understand why the failure survives existing solutions, and brainstorm an
angle on it collaboratively. The value is Phase 2: adversarially trying
to kill each candidate by finding the solution that already exists, and
noticing when people keep failing anyway.

## Inputs [INVARIANT]

- Optionally a domain to narrow to; otherwise scan broadly.
- The operating stance: optimist about tractability (never discard for
  being hard), pessimist about novelty (assume solved and known until
  proven otherwise).

## Success criteria [INVARIANT]

1. Phase 1 scans practitioner pain sources (old upvoted issues, failure
   reports, postmortems, limitations sections), not vendor marketing;
   produces 8-10 candidates that are NOT shown to the user -- the
   unfiltered list is exactly the listicle this skill exists to avoid.
2. Phase 2 classifies every candidate by gap type: solved and adoption
   gaps are discarded; ergonomics, misdiagnosis (highest priority), and
   substrate gaps are kept. If the pass kills nothing, Phase 1 was too
   shallow -- go back.
3. Phase 3 blocks slogan-level topics by default; a blocked topic passes
   only as a specific mechanism-level claim. Target three finalists; two
   acceptable; one means returning to Phase 1. Never pad to three with
   filler.
4. Phase 4 prepares a two-layer concept payload per finalist (service-
   level pitch first; full mechanism only on request), naming the real
   term of art, how it works at architect level, and why it is
   non-obvious. A finalist with no interesting mechanism is a complaint
   and gets dropped for a runner-up.
5. Phase 5 presents the cards in the documented format plus one funnel
   line of what was discarded and why, then stops for the user's pick.
   The brainstorm proceeds one turn at a time: one hypothesis, one
   attackable strawman with real mechanics, one self-criticism -- then
   wait. Never stack three ideas or deliver a finished solution.
6. The endpoint is decided per problem (framework-forge / document-forge
   / build spec / stop at understanding), not assumed.

## Behavioral invariants [INVARIANT]

- Hard is why a problem survived; difficulty is never a discard reason.
- A symptom is never named as the problem; push to the causing mechanism.
- When the problem restates itself mid-brainstorm, name it -- that is the
  misdiagnosis being found.
- Load critical-thinking for the brainstorm phase rather than reinventing
  goal decomposition.

## Free choices [IMPLEMENTATION MAY VARY]

- Search queries and source mix (within pain-not-promotion).
- Exact candidate count within 8-10 and search count within 8-15.
- Which runner-up gets promoted when a finalist drops.
- Strawman content in the brainstorm.

## Golden examples [MIGRATION TEST SET]

G-1: Premature candidate list.
  Input: Phase 1 completes with ten raw candidates.
  Expected: nothing shown to the user yet; the adversarial pass runs
  first. Presenting the raw list fails this example.

G-2: Slogan-level finalist.
  Input: a candidate reducible to "evals are hard" without loss.
  Expected: blocked at Phase 3 unless restated as a specific mechanism
  (e.g. retrospective eval sets blind to the next failure mode).

G-3: Brainstorm discipline.
  Input: the user picks a finalist.
  Expected: one hypothesis + one strawman + one self-criticism, then
  stop and wait. A complete solution essay in one message fails this
  example.

## Eval notes

- Mechanically checkable: no candidate list before Phase 2 output; every
  discarded candidate has a named gap classification; finalist cards
  match the format; funnel line present; per-turn brainstorm structure.
- Human-judged: whether kept candidates are genuinely mechanism-level;
  whether the adversarial pass searched hard enough for existing
  solutions; teaching quality of the payloads.
- No failure history yet -- this genome is the baseline.
