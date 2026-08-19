# QA Checklist — Data Analyst Self Red-Team

Run this against the source data (not just the draft report) before presenting. Every item below is a bug class that actually occurred building a report this way — not hypothetical.

## 1. Skip-rule consistency
- Re-scan every target column for emoji-only / shrug (`¯\_(ツ)_/¯`) responses. These are easy to skip in one column and miss in another (e.g. skipped correctly in column F but missed in column G for the same respondent). Check the *same respondent* across *all* target columns, not just column-by-column.
- Distinguish three buckets, don't collapse them: (a) truly blank, (b) explicit non-answer ("N/A", "None", "Nothing to add"), (c) meaningful text with no specific ask ("it's heading in a good direction"). Bucket (c) is NOT a skip — it must appear somewhere in the report (a short "general sentiment, no ask" note), or your meaningful-count and your bucketed-items-count won't reconcile.
- Recompute: (meaningful count) + (skip count) must equal (total responses) for every column. If it doesn't, find the missing respondent before doing anything else.

## 2. Respondent-count vs. mention-count
- Every group/theme "count" chip should mean the same thing throughout the report — pick "distinct respondents" (recommended) and hold it everywhere.
- Watch for one respondent's multi-idea answer inflating a chip: if respondent A said "X, Y, and Z" in one response and you split that into 3 list items under one theme, the chip is **1**, not 3 — unless other respondents also said something in that theme, in which case add them individually. Show your work in the bullet text ("one respondent bundled three asks together...") rather than letting the chip imply three separate people.

## 3. Cross-column duplication
- After grouping each column independently, check whether any single-mention item got listed in more than one column's section. This happens when a respondent makes the same or a related point in two different columns (e.g. a "better X" comment appears once in the "suggestions" column and is echoed in "other comments") — decide once whether it belongs to one column's list, the cross-theme section, or both, explicitly, and don't paste it in twice by accident.
- Also check the inverse: an item attributed to the wrong column entirely (copy-paste drift when building the report by hand).

## 4. Quote-to-respondent attribution
- Every quoted or paraphrased line in a themed group must be traceable back to an actual response in that group. Before finalizing a theme's bullet list, re-open the raw rows for every respondent counted in that theme's chip and confirm each one actually said something matching. Don't let a quote "read as if" it supports a count — verify it does.

## 5. Category/percentage claims
- Any hand-classified percentage breakdown (e.g. "60% of guest requests are voice actors") is a rough tabulation, not a precise stat. Either actually count every item into its category before stating a number, or round conspicuously (nearest 5%) and add a one-line methodology caveat ("hand-classified, directional not exact"). Never state a precise-looking percentage (like 66%) without having actually counted to that precision.

## 6. Blank vs. skipped framing in stats
- If a column is mostly blank (common for optional free-text fields), don't summarize it as "N skipped" without saying how many were blank vs. how many were answered-but-non-meaningful — a reader comparing columns will otherwise think a mostly-unanswered column had unusually low engagement due to bad answers rather than low response rate.

## 7. Final reconciliation pass
- Add up every chip + single-mention count for a column and confirm it doesn't exceed that column's meaningful-response total (accounting for respondents who reasonably appear in more than one theme because they raised multiple distinct ideas).
- Read every number in the hero/stats section against the raw data one more time, last, after all other edits — stat lines are the easiest thing to leave stale after a content fix elsewhere in the document.
