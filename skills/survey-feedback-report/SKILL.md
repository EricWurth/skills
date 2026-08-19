---
name: survey-feedback-report
description: Turn open-ended survey responses (a Google Sheet, CSV, or spreadsheet export) into a branded, data-driven HTML feedback report. Use whenever the user wants to analyze free-text survey/feedback columns, asks to "pull meaningful feedback" from specific columns, wants ideas grouped and deduplicated, wants a report that "matches our brand" or references a company/event website for styling, or asks for a leadership-ready or decision-maker-ready summary of qualitative feedback. Also use when the user asks to red-team, QA, or fact-check a feedback analysis, or to repeat/rerun this kind of report on new data. Triggers on phrases like "analyze this survey," "lift meaningful feedback from columns X/Y/Z," "build a report on this feedback," or "make this pretty using our brand."
---

# Survey Feedback Report

Turns messy open-ended survey columns into a report a decision-maker can actually act on. Built from a real run analyzing a convention's post-event feedback survey — follow this sequence, it's tuned from what broke the first time through.

## Step 0: Clarify before building (skip if already answered)

Ask at most once, briefly:
1. Which columns contain the free-text feedback to analyze?
2. Output format — HTML report (default), markdown, or inline in chat?
3. Is there a brand/site to match the styling to? (If yes → Step 4 before building HTML.)

If the user has already specified all of this in their request, don't ask — proceed and state your assumptions inline.

## Step 1: Pull the data

Read the source (Google Sheet, uploaded CSV/XLSX, etc.) in full — don't sample. Identify the exact column headers so you can cite them accurately (e.g. "Column F — What would you like to see in the future").

## Step 2: Per-column extraction — skip, then group

For **each** target column, independently:

1. **Skip non-meaningful entries**: blank, "N/A"/"n/a", "None", "Nothing", emoji-only or emoji-shrug responses (e.g. `¯\_(ツ)_/¯`), and single-word non-answers ("No", "Nope"). Keep a running count of what's skipped and why — you'll need it for the stats.
   - Judgment call: a response that's real text but says nothing specific ("I don't have any ideas," "it was great") is *meaningful* but has *no ask* — don't silently drop it and don't force it into a theme. Track it separately as "general sentiment, no specific ask." See [references/qa-checklist.md](references/qa-checklist.md) for why this distinction matters.
2. **Split multi-idea responses.** One respondent's answer often contains several distinct asks (e.g. "more artists, bigger stage for X, and more vendors" = 3 separate ideas). Split before grouping — grouping the whole response as one unit undercounts real themes and overcounts others.
3. **Group distinct ideas, erring toward more granularity.** Combine only near-duplicate phrasings of the *same* concept ("I had fun" / "we had fun"). Keep genuinely different ideas separate even if topically related (e.g. three different "bring back this specific act" requests are three ideas, not one). When in doubt, don't merge.
4. **Count by respondent, not by mention**, for every group header/chip. If one respondent's answer contains 3 sub-asks in a group, that group's count still reflects how many *people* raised it, and you say so explicitly in the copy (see the QA checklist — this exact mismatch was the top bug last run).
5. Long-tail single-mention ideas: list compactly rather than forcing a chip/group for each one.

## Step 3: Cross-column theme detection (do this before writing the report)

After all columns are grouped, look for ideas that appear **independently in more than one column** — this is the strongest signal in open-ended data, since nobody was prompted to repeat themselves. For each cross-column theme, state:
- How many *distinct respondents* raised it
- Which columns it appeared in
- If the same respondent said it more than once (different column), say that explicitly rather than letting it inflate the "distinct respondents" count

This becomes the report's top section — it's usually more useful to a reader than any single column's breakdown.

## Step 4: Brand matching (if requested)

If the user references a live site/brand to match:
1. Fetch the site's homepage with whatever web-fetch tool the runtime provides (and a page or two more if the palette isn't obvious from one page).
2. Search the web for the logo/hero imagery if the fetched HTML doesn't make the visual identity obvious (colors, mascot, type feel).
3. Derive a compact token system before writing CSS: 4–6 named hex colors pulled from what you actually saw, a display/body/mono type pairing that matches the brand's energy (not a generic default), and one signature layout element tied to the subject. If a frontend-design or design-system skill is available in this runtime, load it for the full method; the token discipline above is the minimum either way.
4. State your derived palette/type choices somewhere self-evident (comment in the HTML or your own working notes) so a later pass can sanity-check them against the source.

## Step 5: Build the report

Structure, top to bottom:
1. **Hero** — title, one-line framing, top-line stats (total responses, meaningful-response count per column).
2. **Leadership/priority panel** (if the audience is a decision-maker — ask if unclear) — same findings re-sorted by urgency/cost: safety or liability-adjacent issues first, then low-cost/high-agreement fixes, then items that need real budget or resourcing. This is usually a *second pass* after the descriptive sections exist — see Step 7.
3. **Cross-column themes** (from Step 3), ranked.
4. **One section per source column** — group chips + idea lists + compact single-mention list, using the counting discipline from Step 2.
5. Footer with source/scope note.

Use numbers everywhere a claim is made. Don't reach for a sensational quote when a frequency count is available — the brief for this skill is explicitly "data-driven, not cherry-picked."

## Step 6: Self-QA as a data analyst (mandatory, do this before showing the user)

Before presenting the report, re-open the source data and re-verify it adversarially. Use [references/qa-checklist.md](references/qa-checklist.md) — it's a checklist of the actual error classes that showed up the first time this workflow ran (miscounted skips, respondent-count vs. mention-count mismatches, duplicated items across columns, unverified category percentages). Fix everything you find. State briefly what you checked and fixed — don't silently correct without surfacing it, the user needs to trust the numbers.

## Step 7: Persona red-team pass

Re-read the finished report as a specific, named decision-maker in the subject's world (e.g. "a convention leadership/ops staff member," "a product manager," whoever fits the domain) — not as a generic reviewer. Ask what that person would actually need to act, not just to read. Common gaps this surfaces:
- Everything has equal visual/structural weight — nothing signals what's urgent.
- No cost/effort framing — a $0 signage fix and a five-figure equipment ask read the same.
- A loud, detailed single complaint (e.g. a pricing critique) isn't labeled as "one voice" vs. "a pattern."

If the user asks you to invoke a *specific named model* to red-team the report and you have no tool to actually call that model mid-conversation, say so plainly, then simulate the persona yourself — don't silently substitute without disclosing it.

Iterate Steps 6–7 until the report is accurate and a domain decision-maker could act on it without asking clarifying questions.

## Output

Deliver as a single self-contained HTML file (inline CSS, no external JS dependencies beyond a Google Fonts link if used), saved or presented however the runtime delivers files — written to disk in a coding harness, an artifact in chat, the outputs directory in Cowork. If the user separately asks to email or otherwise share it, treat that as its own step — don't bundle it into the report build.
