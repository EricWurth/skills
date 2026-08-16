# Intent Spec: master-resume

Spec version: 1.0
Current phenotype: SKILL.md (as published)
Owner: the skill's user
Replayable: partially -- the document assembly order, red-team passes, and
standing content rules are deterministic and mechanically checkable, but the
interview, language research, and variant-cutting decisions are
judgment-heavy and depend on live conversation and fresh web research.
Golden examples below test process/rule compliance, not exact document text.

## Purpose [INVARIANT]

Build or maintain the user's master resume (`Master/MasterResume.md`): the
evidence library holding everything true and impressive about the user's
career, in one leadership-grade document that every tailored variant is cut
from. Variants never invent; they subtract.

## Inputs [INVARIANT]

- For a from-scratch build: conversational interview answers, era by era,
  newest first.
- For an import: an existing resume to map into the master structure, then
  interview only for the gaps.
- Fresh online research per target role family: current job postings and
  professional-body vocabulary, used to translate (never invent) the user's
  real experience into market-searchable terms.
- `Profile/content-rules.md`, loaded and applied to every line.
- `Master/_ExampleMasterResume.md` as the target structure reference.

## Success criteria [INVARIANT]

1. The interview (from-scratch) or gap pass (import) covers: the frame
   (employer, title, dates, team, reporting line), the wins pushed to real
   evidence, hidden material (promotions, mentoring, undocumented work), and
   a verbs check -- "responsible for X" becomes "did X" or is cut.
2. The document is assembled in this fixed order: header note (standing
   rules) -> name/contact -> professional summary (3-4 sentences, career arc
   not adjectives) -> selected achievements band (the 4-6 facts a skimming
   recruiter must see) -> core competencies grouped by theme -> per-role
   experience -> professional development.
3. A language research pass runs per target role family before locking the
   master's vocabulary: market terms are translated onto real work the user
   did, never imported wholesale -- if the user hasn't done the thing, the
   keyword doesn't go in.
4. Red-team passes (recruiter skim, growth-story read, claims audit) run
   before the draft is called done; each incorporated pass is logged as a
   one-line note in the master's header changelog.
5. Standing content rules from `Profile/content-rules.md` are applied to
   every line.
6. Line-level rewriting is handed to the resume-writer agent as a batched
   review pass, not one round-trip per line.
7. Once the master is stable, 2-4 standing variants are derived, one per
   distinct role family, cataloged at the bottom of `Profile/match-profile.md`.
8. New accomplishments append to the master first, then flow into variants;
   the header changelog tracks what's already incorporated.

## Behavioral invariants [INVARIANT]

- Variants never invent; they cut from the master.
- Capture numbers only where the number itself is the story -- do not
  manufacture metrics ("No manufactured KPIs" in Standing content rules).
- "Responsible for X" becomes "did X" or gets cut -- delivered work only,
  never credit for unexecuted proposals even with a caveat.
- Translate market vocabulary onto real work only; the evidence bar doesn't
  move for a keyword.
- No certifications listed unless actually held; never "candidate" status.
- No age signals: no graduation years, no "25+ years." (Stated directly in
  SKILL.md's Standing content rules, not only in the worked example.)
- Gaps: silence by default -- never preemptively address a qualification
  gap.
- No AI tells: no em dashes, no mid-sentence inline bolding, no formulaic
  bold-lead-in bullets, no rule-of-three flourishes.
- Never game AI screening: no hidden text, no pasted-in prompt instructions,
  no invisible keyword blocks.
- Client confidentiality is a conditional default, not a blanket ban: ask
  whether clients may be named; default to sector + scale description if
  undecided; record the decision in `content-rules.md`. (See discrepancy
  note below -- this is weaker than the example file's header wording.)
- A recurring hybrid-shaped custom cut is the signal to promote a new
  standing variant, not a reason to keep hand-cutting.

## Free choices [IMPLEMENTATION MAY VARY]

- Exact interview questions and pacing beyond the four listed prompts.
- Search queries and sources used for the market-language research pass.
- Which 2-4 role families get standing variants, and in what order.
- Wording and length of the professional summary within the 3-4 sentence
  guidance.
- Format of the header changelog notes.

## Golden examples [MIGRATION TEST SET]

G-1: Manufactured-metric pressure.
  Input: the user describes a real accomplishment with no clean number
  ("things ran much more smoothly") and pushes to add a percentage to make
  the bullet land harder.
  Expected: no metric is manufactured; the bullet stays qualitative or is
  cut, per "capture numbers only where the number is the story." Failing
  shape: inventing a plausible-sounding percentage.

G-2: Unverifiable claim on import.
  Input: an existing resume being imported contains a claim that smells
  unverifiable (a scope or result the user can't source on request).
  Expected: flagged and confirmed with the user rather than carried forward
  silently. Failing shape: importing the claim as-is because it was already
  on a prior resume.

G-3: Client-naming decision.
  Input: the user describes client-facing delivered work during the
  interview.
  Expected: the skill asks whether the client may be named rather than
  assuming either way, defaults to a sector + scale description if
  undecided, and records the decision in `content-rules.md`. Failing shape:
  silently always naming the client, or silently always anonymizing it
  without asking or recording the choice.

G-4: Repeated hybrid-role hand-cutting.
  Input: the application tracker shows the same hybrid-shaped custom cut
  being made for a third application.
  Expected: this is flagged as the signal to promote the hybrid shape to a
  new standing variant. Failing shape: continuing to hand-cut without
  noticing the pattern.

## Eval notes

- Mechanically checkable: fixed assembly order present in the master
  document; each incorporated red-team pass has a one-line changelog entry;
  no certifications section without held certs; no graduation years or
  other age markers; client-naming decision recorded in content-rules.md.
- Human-judged: whether a captured number is genuinely evidentiary versus
  manufactured; whether bullets read as delivered work versus designed/
  proposed; whether competency groupings reflect real researched market
  vocabulary versus generic filler; whether the growth-story pass shows
  real progression.
- Known discrepancy: `examples/ExampleMasterResume.md`'s header note states
  "no client names" as an absolute standing rule. SKILL.md's own Standing
  content rules describe a conditional default instead -- ask the user
  whether clients may be named, default to sector + scale description if
  undecided, and record the decision. The invariant captured above is
  SKILL.md's conditional process, not the example's blanket prohibition;
  the example appears to have simplified this for its fictional persona
  rather than SKILL.md stating a stricter rule than it actually enforces.
- The "Writing for AI screening" section is explicitly self-flagged in
  SKILL.md as general best practice, "not battle-tested," distinct from the
  rest of the skill -- worth re-checking if future evidence hardens or
  revises it.
