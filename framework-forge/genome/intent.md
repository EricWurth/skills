# Intent Spec: framework-forge

Spec version: 1.0
Current phenotype: SKILL.md (as uploaded to claude.ai)
Owner: the skill's user (Eric)
Replayable: partially -- the pipeline, gates, and persona prompts are
fixed; research content and the author's answers are live, so golden
examples test structural and behavioral compliance.

## Purpose [INVARIANT]

Take a framework thesis the author earned through practice and harden it
into a document that survives three readings at once -- a peer who might
run it, a credentialed reader who knows the standards, and a stranger
with no goodwill -- via contract, claim verification, territory mapping,
draft, five-persona adversarial review, remediation loops, and
subtraction.

## Inputs [INVARIANT]

- A framework thesis or draft, plus the Phase 0 contract: thesis,
  position, experience base, pinned audiences, strongest attack, open
  questions, style constraints. No proceeding until audience and
  experience base are pinned.

## Success criteria [INVARIANT]

1. The two gates govern everything, in order: earned judgment (fails on
   genericness) then deployability (fails on inoperability). When
   findings conflict, judgment wins.
2. Phase 1 (verify the author's load-bearing claims, including claims
   about what the field currently does) always precedes drafting; every
   non-CONFIRMED verdict is reported to the author, never quietly routed
   around. UNFINDABLE claims are grounded explicitly in the author's own
   practice, labeled as experience -- never given a manufactured citation.
3. Phase 2 produces both sweeps (standards ownership, adjacent-framework
   layers) and the three-sentence positioning statement; overlap with
   existing practice is treated as grounding to cite, never a defect.
4. The draft keeps the author's structure (changes proposed, not made
   silently) and obeys the five rules: failure-mode anchoring, show the
   call, position test, ground generously, concede early. The worked
   example, objection answers, and self-critical section are mandatory.
5. Phase 4 runs all five personas with contamination control -- each sees
   only the current draft, the pinned audience, and its own prompt; fresh
   instances every round. In chat runtime, convergence is discounted and
   an extra remediation loop compensates.
6. Remediation classifies every finding (repair / needs research /
   design call); design calls go to the author with a recommendation.
   Remediation that sands off opinion is a failed remediation --
   generic-making fixes escalate as design calls.
7. Stopping rule: cosmetic-only round or three rounds, whichever first,
   with the reason reported. Reappearing findings are flagged as more
   serious than new ones.
8. Phase 6 subtracts (with the three named smells checked explicitly),
   states an adoption path split by required authority, answers the
   signal check in one line, and reports verified claims, positioning,
   findings by round, cuts, and the signal answer.

## Behavioral invariants [INVARIANT]

- Never drop a phase because the runtime lacks agents -- run the same
  prompts sequentially inline.
- Contradict the author when the research does, plainly.
- The worked example must not be rigged.
- Fan-out cap: five personas per round, one verifier per claim cluster.

## Free choices [IMPLEMENTATION MAY VARY]

- Claim clustering granularity in Phase 1.
- Search strategy within verifiers and territory sweeps.
- Prose style within the author's stated constraints.
- Which runner-up ideas from personas get woven into remediation.

## Golden examples [MIGRATION TEST SET]

G-1: Contradicted load-bearing claim.
  Input: Phase 1 returns CONTRADICTED on a claim characterizing standard
  practice.
  Expected: reported to the author before drafting; the contradiction is
  mined as a potential sharpest section -- not softened, not silently
  routed around.

G-2: Deployability fix that would genericize.
  Input: the Practitioner persona flags a mechanism as requiring
  authority most readers lack; the easy fix is hedging language.
  Expected: escalated as a design call with a recommendation -- not
  hedged. "Depending on your context" appearing as the fix fails this
  example.

G-3: Persona contamination.
  Input: round two of Phase 4.
  Expected: fresh persona instances seeing only the revised draft --
  never told what round one found.

## Eval notes

- Mechanically checkable: phase order (verification artifacts precede
  draft); five personas per round; stopping reason stated; report
  contains positioning statement, per-round findings, cuts, signal-check
  line.
- Human-judged: whether Gate 1 was truly enforced (specificity vs
  competent survey); whether remediation preserved opinion; whether the
  worked example is unrigged.
- No failure history yet -- this genome is the baseline.
