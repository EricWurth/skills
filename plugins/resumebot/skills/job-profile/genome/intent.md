# Intent Spec: job-profile

Spec version: 1.0
Current phenotype: SKILL.md (as published)
Owner: the skill's user
Replayable: partially -- the deliverables are three fixed files
(`Profile/match-profile.md`, `Profile/preferences.md`, `Profile/form-answers.md`),
but their content comes out of a judgment-heavy coaching conversation via the
career-coach agent, not a mechanical transform. Golden examples below are
scenario-based, evaluated by whether the invariants were followed, not by
diffing an artifact.

## Purpose [INVARIANT]

Build the user's match profile -- target roles, hard gates, comp floor,
location rules, exclusions -- through a career-coaching conversation, so that
every later scan, score, and scheduled task has a single source of truth to
read against. Triggered when the user asks what jobs to target, wants to set
up or revise job-search preferences, or when job-scan has no
`Profile/match-profile.md` to score against.

## Inputs [INVARIANT]

- The user's master resume (or its summary), read before the conversation
  starts.
- 2-3 real job postings the user would love to land (links or pasted text),
  gathered before anything abstract is settled.
- `Profile/_example-match-profile.md` as the structural reference for shape.
- The career-coach agent conducting the conversation -- this is run as a
  coaching conversation, not a form.

## Success criteria [INVARIANT]

The conversation must settle, in order (gates before wish-list items):

1. **Function keywords** -- broad functions the user can do, including
   adjacent ones they weren't considering, never title+level combos.
2. **The four hard gates** -- staleness ladder, fit minimum (only a
   quantified years-of-specific-experience requirement that IS the role's
   core mandate auto-rejects), location, comp floor (the real walk-away
   number).
3. **Bonuses** -- preferred level band, comp-bonus/comp-win thresholds,
   preferred industries, location expediency tiers.
4. **Exclusions** -- employers with reasons, aggregator handling (never
   auto-apply through an aggregator; always find the real employer),
   same-company dedupe preference.
5. **Effort-tier mapping** -- which fit scores get custom resume + letter,
   tailored variant, or generic variant; cover letters ad-hoc by default.
6. **Work authorization facts**, recorded so scans never wrongly skip or
   flag roles.

Example postings are read against the master resume before anything else:
shared vocabulary becomes search terms, and requirements the resume doesn't
evidence are named as gaps -- dug into before being conceded, since users
routinely have relevant experience that never made it onto the page.

## Behavioral invariants [INVARIANT]

- Run as a coaching conversation via the career-coach agent, not a form; the
  agent's job is to surface options the user hasn't considered and force real
  decisions on the gates.
- Order matters: gates before wish-list items.
- Search terms are FUNCTIONS, never title+level combos -- broad search plus
  scoring beats pre-filtering.
- A resume does NOT have to match 100% of a job description to be valid;
  posted requirements are a wish list. A gap is tailoring information and
  interview prep, never a reason to drop the role, and never a license to
  stuff the resume with unsupported claims.
- Anything elicited by probing a gap flows back into the master resume via
  the master-resume skill.
- Every filter added is jobs never seen: challenge overfiltering by pushing
  wish-list items from gates into bonuses; challenge underselling when resume
  evidence supports a level the user isn't targeting.
- While between roles, only hard gates justify dropping a role; everything
  else is ranking.
- Cover letters are AD-HOC by default -- built only when the portal has the
  field or the user asks.
- Judgment form answers (comp numbers, essays, legal attestations) are ALWAYS
  drafted for user approval, never auto-submitted. Only standing facts
  (work authorization, notice period, relocation willingness) may be filled
  silently by automation.
- Maintenance: when the user reports a scan miss or noise, trace it to the
  specific gate/bonus line, propose the edit, and update the file in the same
  session -- the profile is living config, not a one-time artifact.

## Free choices [IMPLEMENTATION MAY VARY]

- The specific staleness ladder day-cutoffs (defaults: under 42 normal, 42-89
  watch tier, 90+ presumed dead) -- stated as defaults, so tunable per user.
- The specific effort-tier score-to-treatment defaults (fit 5 = custom +
  letter, fit 4 = tailored, fit <=3 = generic) -- stated as defaults.
- Exact wording used to reflect decisions back to the user, and the order of
  sub-topics within a settled item beyond the gates-before-wish-list rule.
- How many example postings are gathered beyond the 2-3 minimum, and how the
  gap-probing conversation is paced.

## Golden examples [MIGRATION TEST SET]

G-1: Title used as a search term.
  Input: user proposes a search term like "Senior Director of Operations."
  Expected: redirected to the underlying function ("operations") as the
  search term; title+level is never encoded into search terms.

G-2: Preference framed as a gate.
  Input: user states a soft preference ("I'd rather not do hybrid") as if it
  were a hard location gate.
  Expected: pushed from a gate into a bonus/priority tier unless it traces to
  a real disqualifier (e.g., actual inability to relocate, a real comp
  walk-away number). Gates are expensive; they hide jobs forever.

G-3: Job posting names a requirement the resume doesn't show.
  Input: one of the 2-3 example postings lists a requirement with no
  supporting evidence in the master resume.
  Expected: the gap is named honestly, then probed before being conceded
  (the user may hold relevant unlisted experience); if real, it's recorded
  as tailoring/interview-prep info and flows to the master-resume skill --
  never treated as a reason to drop the role or as license to inflate the
  resume, unless it is a quantified years-of-specific-experience requirement
  that IS the role's core mandate.

G-4: Scan-miss maintenance report.
  Input: user reports "why did this good role get dropped?" against an
  existing profile.
  Expected: traced to the specific gate/bonus line responsible, an edit
  proposed, and `Profile/match-profile.md` updated in the same session --
  not deferred, not a wholesale profile rewrite.

G-5: Judgment-tier form answer.
  Input: a scan or application flow needs a comp-negotiation essay or legal
  attestation answer for `Profile/form-answers.md`.
  Expected: drafted and surfaced for user approval, never auto-filled or
  auto-submitted, unlike standing facts (authorization, notice period).

## Eval notes

- Mostly human-judged: the deliverable is three files (match-profile.md,
  preferences.md, form-answers.md) whose correctness is about which
  decisions got captured and how, not a mechanically checkable format.
- Detectable failure signatures to watch for retrospectively: a title+level
  string appearing as a search term; a preference recorded as a gate without
  a traceable disqualifying reason; a resume gap treated as an auto-reject
  when it isn't the role's core quantified mandate; a judgment-tier form
  answer submitted without surfacing it for approval; a scan-miss report
  answered without touching the actual gate/bonus line.
- No known-bad fixture yet -- G-1 through G-5 above are the first attempt at
  migration tests; they should be run against any future phenotype change to
  confirm behavior didn't regress.
