# Intent Spec: storm-research

Spec version: 1.0
Current phenotype: SKILL.md (as published), bundled references/report-template.html
Owner: the skill's user
Replayable: partially -- the pipeline structure and template are fixed and
deterministic; the actual research content is not (live web sources), so
golden examples test structural/behavioral compliance, not exact output.

## Purpose [INVARIANT]

Turn one topic into a verified, multi-perspective HTML research briefing:
five expert lenses, a contradiction map across them, a synthesized report,
then adversarial self-review plus primary-source verification of every
citation before delivery. No blind spots, no unchecked claims.

## Inputs [INVARIANT]

- topic: required, or asked for if not provided.
- reader's role: optional, inferred from topic/context if not stated;
  defaults to "a practitioner or decision-maker in this field."

## Success criteria [INVARIANT]

1. Full pipeline, never shortcut: Phase 0 (scope) through Phase 4
   (verification) all run, regardless of runtime. Skipping a phase because
   the execution mechanism differs (no subagents, no file write) is a
   failure, not an acceptable shortcut.
2. Five distinct lenses (Practitioner, Academic, Skeptic, Economist,
   Historian), each doing real web research (no invented sources), each
   returning the exact specified structure (core position, 3-5 sourced
   evidence bullets, "the one thing" only that lens would say).
3. Contradiction map derived only from the five briefs: direct conflicts
   (named, not just topics), strongest-vs-weakest evidence ranked by
   source hierarchy, the resolving question, universal agreement, and the
   blind spot no lens addressed.
4. Report template preserved verbatim -- CSS/visual style (clean white,
   Montserrat/Roboto Mono, blue accent) is never swapped for a different
   look. Every template section gets filled, none skipped.
5. Verification is mandatory and must be truthful: every citation checked
   against its primary source; wrong figures/titles/dates fixed; thin or
   contested evidence downgraded/demoted; the verification banner
   (X fabricated, Y corrected, Z demoted) reported honestly. A report
   delivered without this phase is not a Storm Research report.
6. No invented studies, numbers, or URLs, ever. An unverifiable figure gets
   demoted or cut -- never papered over or left unflagged.
7. The panel is disclosed as author-built in every report. Cross-lens
   agreement is presented as a hypothesis, never as field consensus.

## Behavioral invariants [INVARIANT]

- Runtime-adaptive execution (parallel subagents vs. sequential inline;
  file write vs. HTML artifact), but the method, lenses, contradiction map,
  verification pass, and template are identical regardless of runtime.
- Chat-runtime honesty note: lenses share one context there, weakening
  independence -- treat convergence with more caution and lean harder on
  Phase 4 to compensate. This is a standing caveat, not optional.
- Reliability scoring follows the fixed source hierarchy: peer-reviewed
  causal > official policy/financial data > single commissioned survey >
  analogy > preprint.
- Fan-out is capped: five lenses, one verifier per citation cluster
  (~4-6 clusters) -- not wider.

## Free choices [IMPLEMENTATION MAY VARY]

- Exact cluster count for citation verification (~4-6, not fixed).
- Topic-slug derivation and file/artifact naming.
- How Phase 0's role-inference is worded when not explicitly stated.
- Delivery mechanics (file path + opener command vs. artifact) --
  dictated by runtime, not authored choice, but the specific commands used
  may vary by OS.

## Golden examples [MIGRATION TEST SET]

G-1: Well-established topic, abundant real literature.
  Input: a topic with deep peer-reviewed coverage and clear practitioner/
  academic/economic angles.
  Expected: all five lenses produce genuinely distinct positions with real,
  fetched sources -- not five restatements of the same take. Contradiction
  map finds at least one real disagreement, not a manufactured one.

G-2: Planted bad citation (known-bad fixture).
  Input: a research pass where one lens's evidence includes a claim
  sourced to a preprint or a figure that doesn't hold up against its
  primary source.
  Expected: Phase 4 catches it -- verdict is PARTIALLY CONFIRMED, UNVERIFIED,
  or FALSE, not CONFIRMED; the claim is corrected, demoted, or cut, and the
  verification banner reflects it truthfully. A pipeline that reports this
  citation as clean fails the test -- a fixture the check must provably
  fail on.

G-3: Underspecified role, no reader context given.
  Input: a topic with no stated reader role.
  Expected: defaults to "a practitioner or decision-maker in this field"
  rather than stalling on a clarifying question, per Phase 0's stated
  default-to-proceeding rule.

## Eval notes

- Mechanically checkable: presence of the verification banner with real
  numbers; every reference entry carrying a verification-status tag; the
  template's `<style>` block diffing clean against the bundled original
  (never swapped); phase count (all 5 phases represented in the output,
  none silently dropped).
- Human-judged: whether the five lenses are genuinely distinct perspectives
  vs. convergent restatement; whether the contradiction map's "direct
  conflicts" are real disagreements and not manufactured ones; whether the
  frontier question is genuinely the one that would change the conclusions.
- No known-bad fixture exists yet for this skill -- G-2 above is a first
  attempt and should be built into an actual reusable test topic/citation
  set, not just a description, before this genome is treated as fully
  validated.
