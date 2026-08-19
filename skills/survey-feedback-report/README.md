# survey-feedback-report

Turns open-ended survey columns into a branded, data-driven HTML report a decision-maker can act on.

## Why this exists

The default behaviour when handed a feedback spreadsheet is to skim it, quote
the most vivid responses, and eyeball some counts. That produces a report that
reads well and doesn't survive contact with the source data: skip rules
applied inconsistently between columns, one enthusiastic respondent counted as
three, the same comment pasted into two sections, percentages nobody actually
tallied.

Every rule in this skill exists because one of those bugs happened on a real
run (a convention's post-event survey). The QA checklist is a list of error
classes that occurred, not hypotheticals.

## How it works

1. **Clarify once** — target columns, output format, brand to match. Skipped
   entirely if the request already says.
2. **Read everything.** The full source, never a sample, citing exact column
   headers.
3. **Per-column extraction.** Skip non-answers (keeping count), split
   multi-idea responses before grouping, group toward granularity, and count
   every theme by distinct respondents rather than mentions.
4. **Cross-column themes.** Ideas that surface independently in more than one
   column lead the report — the strongest signal in open-ended data.
5. **Brand matching** (when asked): fetch the referenced site, derive a
   4–6 color token system and type pairing from what was actually seen.
6. **Build the report** — hero stats, a leadership/priority panel re-sorted by
   urgency and cost, cross-column themes, then one section per column. A
   frequency count always beats a sensational quote.
7. **Self-QA against the source** — mandatory, before the user sees anything,
   using `references/qa-checklist.md`. What it caught is surfaced, not
   silently fixed.
8. **Persona red-team** — re-read as a specific decision-maker in the domain,
   and iterate until that reader could act without follow-up questions.

## Requirements

None. It needs the survey data itself (an uploaded file or a sheet reachable
by whatever connector the runtime has), and everything else is instructions
plus judgment.

## What extends it

- Web fetch/search, for the optional brand-matching step. Without it the
  report still builds, just with a neutral design.
- A frontend-design or design-system skill, if one is installed — Step 4
  defers to it for the full styling method.

## Install

```
cp -r skills/survey-feedback-report ~/.claude/skills/
```

Or on claude.ai: zip the folder and upload it under Settings → Capabilities.

## Use

Model-invoked. Triggers when someone hands over survey or feedback data and
wants the free-text columns analyzed — "pull the meaningful feedback from
columns F/G/H," "build a report on this feedback," "make it match our brand,"
or a leadership-ready summary of qualitative responses.

Wrong tool for purely quantitative work (averages, NPS math, pivot tables —
that's a spreadsheet task) and for *designing* a survey rather than analyzing
one.

## Limits

- Theme grouping is judgment. The rules bound it (split multi-idea answers,
  merge only near-duplicates) but two runs can draw group boundaries
  differently.
- Counting discipline is only as good as respondent identity in the source —
  if the export has no stable row-per-respondent, distinct-respondent counts
  degrade to distinct-response counts.
- Brand matching derives colors from fetched HTML and public imagery; it gets
  the palette's spirit, not brand-guideline fidelity.
