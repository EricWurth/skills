# storm-research

A Claude Code / Claude skill that turns one topic into a verified,
multi-perspective HTML research briefing -- five expert lenses, a
contradiction map, a synthesized report, and a mandatory adversarial
verification pass before delivery.

## Why this exists

A single research pass tends to converge on one narrative and one set of
sources. This skill forces genuine disagreement to surface before
synthesis, then refuses to trust its own output until every citation has
been checked against its primary source.

**The pipeline:**

1. **Scope** -- pin down the topic and the reader's role.
2. **Five lenses** -- Practitioner, Academic, Skeptic, Economist,
   Historian. Run in parallel as subagents when an `Agent` tool is
   available, or one at a time in a single context otherwise. Each does
   real web research and returns a distinct position with sourced
   evidence -- not five restatements of the same take.
3. **Contradiction map** -- where the lenses genuinely conflict, which
   evidence is strongest vs. weakest, the one question that would resolve
   the biggest disagreement, what everyone agrees on, and the blind spot no
   lens covered.
4. **Synthesis** -- everything above gets filled into a fixed HTML report
   template (clean, professional, verbatim CSS -- never restyled).
5. **Adversarial verification** -- every citation gets independently
   checked against its primary source. Wrong figures get fixed, thin
   evidence gets demoted, fabricated claims get cut. The report ships with
   an honest verification banner (`X fabricated, Y corrected, Z demoted`).

A report that skips step 5 is not a Storm Research report, full stop.

## Install

Drop the `storm-research/` folder into your `.claude/skills/` directory.
It adapts to whatever tooling is on hand: with an `Agent`/subagent tool
and file `Write` (e.g. Claude Code), it spawns the lenses and verifiers
as parallel agents and writes the report to disk; without those (e.g.
claude.ai chat), it runs the same phases sequentially inline and delivers
the report as an HTML artifact instead. Either path needs only built-in
tooling (web search/fetch) plus the bundled `references/report-template.html`. No
external services, no paid APIs, no other skills required.

## Use

Ask for a "storm research" briefing on any topic where multiple viewpoints
and fact-checked claims matter. It's overkill for a simple factual lookup
-- that's by design; the whole point is doing more work than a quick
lookup would.

## Design notes

- `references/report-template.html` must stay verbatim -- the CSS is part of the
  spec, not a starting point to restyle.
- `genome/intent.md` is the intent spec (purpose, invariants, free choices,
  golden examples) kept separate from `SKILL.md`'s phenotype instructions.
  See the `skill-evolution` skill in this repo for why that split exists
  and how it's meant to be used.
