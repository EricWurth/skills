# Intent Spec: skill-evolution

Spec version: 1.0
Current phenotype: SKILL.md (as packaged)
Owner: the skill's user
Replayable: partially -- the process is deterministic in structure (refresh,
identify, evaluate, prioritize, test, gate); the research and technique
content it finds is not (live web sources), so golden examples test process
compliance, not exact output.

## Purpose [INVARIANT]

Evolve a target skill by finding a real technique gap specific to that
skill, proving fitness and measurable gain, testing regression +
discrimination in a sandbox, and gating -- never adopting the first
plausible technique found, and never promoting without an explicit human
decision.

## Inputs [INVARIANT]

- references/technique-library.md: a persistent, self-refreshing catalog
  this skill reads and appends to every run.
- Target skills: auto-discovered by scanning installed skills for a
  `genome/intent.md` file. No user-specified target is required or
  expected -- a skill without a genome file is out of scope for this
  sweep, not an error.

## Success criteria [INVARIANT]

1. Refresh happens before identify -- the library is checked against
   current research and updated before any candidate technique is
   considered for a target.
2. A technique only qualifies as a candidate if it maps to a target
   skill's declared free-choices. A technique that would touch an
   invariant is a spec-change proposal to the user, never something this
   skill applies on its own.
3. Fitness requires a concrete, skill-specific problem -- traced to that
   skill's own genome/eval-notes, not the technique's general reputation
   -- plus a measurable test case that fails today without the technique.
   No documented problem or no constructible test case means the
   candidate is marked speculative and is not sandboxed this round.
4. Layering is checked before ranking candidates as mutually exclusive --
   a verification-layer technique and a generation-layer technique are
   not automatically rivals just because both surfaced in the same sweep.
5. Exactly one new candidate is sandbox-tested per pass per target skill,
   so a pass/fail result is attributable to a single change.
6. Both regression (the target's existing golden examples still pass) and
   discrimination (a new adversarial fixture proves the specific gap the
   candidate claims to close) are required before any gate decision.
7. Promotion into a target skill's live/production files requires explicit
   human sign-off, every time. Every other step -- refresh, identify,
   evaluate, prioritize, test -- runs autonomously with no pause for
   confirmation in between.
8. Rejecting or shelving a candidate is a valid, logged outcome, not a
   failure requiring escalation -- most sweeps should find nothing worth
   promoting.

## Behavioral invariants [INVARIANT]

- Never skip from "a technique I already know" straight to sandboxing it --
  cross-reference the whole library against the target's free-choices and
  failure history first. This is the specific failure this skill exists to
  prevent (an early run of this pattern did this and had to be corrected).
- Never bundle multiple untested candidates into one promotion.
- Never rewrite an existing references/technique-library.md entry's
  substance in place -- append dated notes to existing entries, or add new
  dated entries; history stays visible.

## Free choices [IMPLEMENTATION MAY VARY]

- Exact web-search queries used for the refresh step.
- How many candidates get fully evaluated per sweep before the first
  fitness-passing one is found, vs. how many get shelved early.
- Cadence of runs -- manual invocation vs. a scheduled sweep.
- Report format/verbosity for the end-of-sweep summary.

## Golden examples [MIGRATION TEST SET]

These examples use a hypothetical target skill -- call it a
diagram-generation skill that turns a text brief into a self-contained
HTML/SVG diagram -- to keep the pattern reusable without tying it to any
one real skill.

G-1: Executable-check upgrade.
  Input: the target skill's layout-overflow check was a keyword heuristic
  that had twice self-certified incorrectly in the skill's own history.
  Expected: identified as high-fitness (documented failure history +
  constructible test), sandboxed, regression held (existing goldens still
  passed), discrimination improved (a new sneaky-overflow fixture the old
  heuristic passed incorrectly was correctly caught by the new technique).
  All criteria pass.

G-2: Independent-judge fitness test.
  Input: several of the target skill's semantic criteria (tone, whether
  color use is genuinely meaningful vs. decorative) were self-judged, with
  the same documented failure shape as G-1 (self-certification blind
  spots).
  Expected: maker-checker identified as fit (real documented problem +
  constructible test); an independent subagent, given only the spec and a
  flawed file, caught a decorative-color violation that a same-context
  self-check plausibly would not. All criteria pass.

G-3: Refuse-to-sandbox ungrounded candidates.
  Input: few-shot bundling and templated generation were both plausible,
  well-regarded techniques in the library, but neither had a documented
  problem specific to the target skill.
  Expected: both marked speculative/not-fit and NOT sandboxed, despite
  being reasonable techniques in general. Sandboxing an ungrounded
  candidate anyway is the failure this example tests -- mirrors the
  refuse-to-invent discipline the target skill itself should apply to
  underspecified input.

## Eval notes

- Mechanically checkable: whether a candidate had both a named,
  skill-specific problem and a constructed test case before any sandbox
  work began; whether references/technique-library.md entries were
  appended rather than edited in place; whether more than one untested
  candidate was bundled into a single promotion; whether any promotion
  happened without an explicit human sign-off logged.
- Human-judged: whether a cited "documented problem" genuinely traces to
  the target skill's own eval notes, versus being stretched to justify a
  technique someone wanted to try anyway.
- Known open gap, not yet resolved: this skill scopes itself to whichever
  installed skills happen to carry a genome/intent.md, rather than either
  (a) a user-named single target or (b) a full walk of every installed
  skill for every technique (the original technique-first design). This
  compromise hasn't been stress-tested against a sweep with several
  genome-bearing skills competing for attention at once -- prioritization
  across *skills*, not just across candidates within one skill, is
  untested.
