---
name: storm-research
summary: Turns one topic into a verified multi-perspective research briefing: five expert lenses, a contradiction map, then adversarial fact-checking
description: Turn one topic into a verified multi-perspective research briefing.
disable-model-invocation: true
---

# Storm Research

## What this does

Turns one topic into a verified, multi-perspective HTML briefing. It applies five expert lenses to the topic, maps where they contradict each other, synthesizes everything into a single self-contained HTML report, then adversarially peer-reviews its own output and verifies every citation against its primary source before delivering. The output is one HTML file with no blind spots and no unchecked claims.

Run the full pipeline end to end. Do not shortcut a phase. This is heavier than a quick web lookup; that is the point.

## Runtime adaptation (read first)

This skill runs in two kinds of environment. Detect which one you are in by what tools you actually have, then follow the matching path. The method, the five lenses, the contradiction map, the verification pass, and the template are identical in both. Only the execution mechanics change.

- **Agent-capable runtime (e.g. Claude Code with an `Agent`/subagent tool and file `Write`).** Run the lenses and the verifiers as parallel agents, and write the report to disk. This is the fastest, highest-independence path.
- **Chat runtime (e.g. claude.ai, no subagent tool, no disk write).** Run the lenses and verifiers sequentially yourself in the single context, and deliver the report as an HTML artifact. Everything else holds.

Rule: if you cannot spawn agents, do not fake or skip that work. Do it inline, in sequence. If you cannot write a file, produce the report as an artifact. Never drop a phase because the mechanism differs.

One honesty note for the chat path: because the lenses run in one shared context, they can see each other's reasoning, which weakens their independence. Treat convergence with slightly more caution than the parallel path would, and lean harder on Phase 4 verification to compensate.

## Phase 0: Scope the topic

1. If a topic was provided, use it. Otherwise ask what to research.
2. State your interpretation of the topic in one line and proceed. Only ask a clarifying question if the topic is genuinely ambiguous in a way that changes the research. Default to proceeding.
3. Identify the **reader's role** so the actionable section can target it. Infer it from the topic and any stated context; if unclear, ask in one line, or default to "a practitioner or decision-maker in this field."
4. Derive a kebab-case `topic-slug` from the topic for the filename or artifact title.
5. Tell the user the pipeline is running (5 lenses, then verify) in one line.

## Phase 1: Five expert lenses

Apply all five lenses. Each gets the SAME topic framing plus its own lens. Substitute `{TOPIC}` and a one-line `{TOPIC_FRAME}` (your Phase 0 interpretation).

- **Agent-capable runtime:** spawn five `general-purpose` agents in a single message so they run concurrently, one per lens prompt below.
- **Chat runtime:** work the five lenses one at a time yourself, doing real web search/fetch for each before moving to the next. Keep each lens to its own evidence gathering so it stays a distinct viewpoint, not a rerun of the last one.

Use these exact prompts:

**1. THE PRACTITIONER** — `You are THE PRACTITIONER for: {TOPIC} ({TOPIC_FRAME}). You work with this daily. Do real web research (prioritize recent sources, case studies, practitioner threads, operator data). Surface the GAP between what hands-on operators know and what academics/pundits miss, and the practical realities (workflow friction, what actually works, where it breaks) that get ignored. Return EXACTLY: 1) CORE POSITION in 2 sentences. 2) STRONGEST EVIDENCE, 3-5 bullets each with a concrete data point/case/named source + URL. 3) THE ONE THING only a practitioner would say. Cite real sources with URLs. Under 400 words.`

**2. THE ACADEMIC** — `You are THE ACADEMIC for: {TOPIC} ({TOPIC_FRAME}). You care about peer-reviewed evidence and effect sizes, not anecdotes. Do real web research (peer-reviewed studies, arXiv, university and research-institute reports, journals). Answer: what does the rigorous evidence ACTUALLY say vs popular belief, and where does it CONTRADICT the hype. Return EXACTLY: 1) CORE POSITION in 2 sentences. 2) STRONGEST EVIDENCE, 3-5 bullets each tied to a named study/report + URL with the actual finding/effect size. 3) THE ONE THING only an academic would say. Flag where evidence is thin or contested, and note peer-review status (published vs preprint). Under 400 words.`

**3. THE SKEPTIC** — `You are THE SKEPTIC for: {TOPIC} ({TOPIC_FRAME}). You think the mainstream view is overstated or wrong. Build the STRONGEST steelman bear case. Do real web research for backlash, failures, contradicting data, policy/regulatory changes, debunkings. Answer: the strongest counterargument, and what proponents conveniently ignore. Return EXACTLY: 1) CORE POSITION in 2 sentences. 2) STRONGEST EVIDENCE, 3-5 bullets each with a concrete source + URL. 3) THE ONE THING only a skeptic would say. Be rigorous, not contrarian for sport. Cite real sources with URLs. Under 400 words.`

**4. THE ECONOMIST** — `You are THE ECONOMIST for: {TOPIC} ({TOPIC_FRAME}). You follow the money. Do real web research for revenues, valuations, market size, funding flows, unit economics, incentives. Answer: who profits from the current narrative, and what financial incentives shape the research and hype. Return EXACTLY: 1) CORE POSITION in 2 sentences. 2) STRONGEST EVIDENCE, 3-5 bullets each with a real number (revenue/valuation/market size/funding) + named source + URL. 3) THE ONE THING only an economist would say (the follow-the-money insight). Cite real figures with URLs. Under 400 words.`

**5. THE HISTORIAN** — `You are THE HISTORIAN for: {TOPIC} ({TOPIC_FRAME}). You have seen disruption cycles before and look for patterns. Do real web research for genuine historical parallels (prior technologies, manias, market shifts). Answer: what parallels actually fit, and what we learn from how they played out (who won, who lost, what stabilized). Return EXACTLY: 1) CORE POSITION in 2 sentences. 2) STRONGEST EVIDENCE, 3-5 bullets each a specific historical case with dates/outcomes + a source URL. 3) THE ONE THING only a historian would say (the pattern no one else surfaces). Cite sources with URLs. Under 400 words.`

When all five are done, post a 2-3 line note in chat: which way they converge, and the sharpest disagreement. Keep the raw briefs out of chat.

## Phase 2: Map the contradictions

Working only from the five briefs, determine (inline, no separate agents needed in either runtime):

1. **Direct conflicts** — where two or more lenses claim opposite things. Name the specific clashing claims, not just topics.
2. **Strongest vs weakest evidence** — which lens is best-supported (rank: peer-reviewed causal > official data > anecdote/analogy) and which is weakest, with why.
3. **The resolving question** — the single empirical question that would settle the biggest contradiction.
4. **Universal agreement** — what every lens confirms, even opponents. This is the likely-true load-bearing finding.
5. **The blind spot** — what NO lens addressed. This becomes the "missing 6th lens" and feeds the Frontier Question.

This map is not a separate deliverable. It is the raw material for the report's findings (supports/challenges), hidden connection, 6th-lens box, and frontier question.

## Phase 3: Synthesize the HTML report

1. Read `references/report-template.html`. Clone it; do not rebuild the CSS. Keep the `<style>` block verbatim: clean white and professional (Montserrat / Roboto Mono, blue accent). Do not swap in a different visual style.
2. Fill every section. Mapping from the phases:
   - **60-second summary** — decision-maker-grade, nuance not headline. Lead with the settled fact, then the contested interpretation.
   - **5 key findings, ranked by reliability** — most important things now known, highest reliability first. Each carries a 1-10 confidence score (set in Phase 4) and Supported-by / Challenged-by chips drawn from the contradiction map.
   - **Hidden connection** — the non-obvious link from Phase 2 that only appears across all five lenses.
   - **Key assumption / missing 6th lens** — the blind spot from Phase 2, framed as the lens that could change the conclusions.
   - **Actionable insight** — 3-6 specific moves for the reader's role identified in Phase 0. Specific, not abstract.
   - **Claim safety guide** — assert / caveat / avoid, populated after Phase 4 verification.
   - **Frontier question** — the one question that would change everything.
   - **References** — every citation with a verification-status tag (set in Phase 4).
3. Deliver the report:
   - **Agent-capable runtime:** write to `storm-reports/{topic-slug}-briefing.html` (relative to the current working directory; create the folder if needed).
   - **Chat runtime:** deliver the filled template as a single self-contained HTML artifact titled `{topic-slug}-briefing`.

## Phase 4: Adversarial peer review + verification (do not skip)

This is what separates Storm Research from a normal report. Run it before delivering.

**4a. Self-review (inline).** Score each of the 5 findings 1-10 for reliability and justify. Identify the weakest link and what would verify it. Run a bias check (which lens dominated the synthesis, what got underweighted). Name the missing 6th perspective. Assign an honest overall grade.

**4b. Verify every citation.** Group related claims into clusters (~4-6 clusters).
- **Agent-capable runtime:** spawn one `general-purpose` agent per cluster in a single message.
- **Chat runtime:** work each cluster yourself in sequence, fetching the primary source for each.

Prompt (per cluster):

`Independently verify a citation against its PRIMARY source. Be skeptical; do not trust secondary blog summaries. CLAIM: {claim + cited figure + named source}. Find the actual primary source. Confirm or correct: exact title/authors/venue/year/URL, the real figure or effect size as published, sample/method and any author-stated limits, and peer-review status (published vs preprint). For any contested claim, find the strongest credible counter-source. Return: VERDICT = CONFIRMED / PARTIALLY CONFIRMED (list corrections) / UNVERIFIED / FALSE, then the corrected one-line citation, then 2-4 bullets of specifics with the primary URL. Under 280 words.`

**4c. Apply corrections.** Edit the report:
- Fix any wrong figures, titles, dates, or mischaracterizations.
- Downgrade confidence scores where evidence turned out thin; demote preprints and contested claims into the "Contested signal" sidebar.
- Re-attribute single-survey or commissioned stats honestly.
- Fill the verification banner (`X fabricated, Y corrected, Z demoted`) and the per-citation status tags.
- Populate the claim safety guide from the verdicts.

## Output

1. Final deliverable: the v2, post-verification report — a file at `storm-reports/{topic-slug}-briefing.html` in an agent-capable runtime, or an HTML artifact in a chat runtime.
2. In an agent-capable runtime, open it with the platform's default opener (macOS `open`, Linux `xdg-open`, Windows `start ""` / PowerShell `Start-Process`); if the OS is unclear, just give the path. In a chat runtime the artifact renders on its own; no open step.
3. In chat, give: where the report is, the verification tally (`N/N checked, X fabricated, Y corrected, Z demoted`), the one universal finding, the frontier question, and the claim safety summary (safe to assert vs avoid). Keep it tight.

## Notes & guardrails

- **Real research only.** Every lens and every citation must trace to a real, fetched source. No invented studies, numbers, or URLs. If a figure can't be verified, demote or cut it; never paper over it.
- **The panel is author-built.** Always disclose this in the report. Agreement across lenses is a strong hypothesis, not independent proof. Do not present convergence as consensus of the field. This matters more on the chat path, where the lenses share a context.
- **Verification is mandatory.** A report delivered without Phase 4 is not a Storm Research report. The verification banner must be truthful.
- **Reliability = evidence quality, not confidence.** Score on the source hierarchy: peer-reviewed causal > official policy/financial data > single commissioned survey > analogy > preprint.
- **Target the reader, not a default person.** The actionable insight and claim safety guide speak to the role identified in Phase 0. Keep them generic if no role is given.
- **Cost.** In an agent-capable runtime this spawns ~9-11 agents per run; that is expected. Do not fan out wider than five lenses or one verifier per citation cluster. In a chat runtime the same work runs sequentially, so expect many web searches and a longer single turn.
- **Design.** Keep the template CSS verbatim. Do not swap in a different visual style.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "All five lenses converged on the same take, so this topic is settled" | "Convergence is a strong hypothesis, not independent proof. The panel is author-built — say so, and never present agreement as field consensus." |
| "I'm on the chat path, I can't spawn agents, so I'll fold verification into the synthesis instead of running it separately" | "The rule is explicit: if you can't spawn agents, do the same work inline and in sequence. Never drop a phase because the execution mechanism differs." |
| "I already found these sources while running the lenses, re-checking them in Phase 4 is redundant" | "Phase 4 verification means fetching the primary source and being skeptical of secondary blog summaries — the same URL surfacing twice is not the same as it being confirmed." |
| "This figure is close enough to what the source says, I'll leave it as stated" | "Never paper over it. If a figure can't be verified against its primary source, demote or cut it — that's the whole point of the honest verification banner." |
| "The template's CSS looks dated, a cleaner style would make the report better" | "Keep the `<style>` block verbatim. Do not swap in a different visual style, no matter how well-intentioned." |
| "A report that skips step 5 is basically done, I'll ship it and note verification as a follow-up" | "A report that skips step 5 is not a Storm Research report, full stop." |

## Red Flags

- Delivering a report with no verification banner, or a banner that doesn't state real fabricated/corrected/demoted counts.
- All five lens briefs reading as restatements of one position rather than genuinely distinct core positions and evidence.
- Treating cross-lens agreement as consensus of the field instead of disclosing the panel as author-built.
- Skipping or compressing Phase 4 because the runtime has no subagent tool or no file write.
- A citation clause with no URL, or a Phase 4 verdict accepted from a secondary source instead of the primary one.
- A claim left at CONFIRMED-level confidence after Phase 4 actually returned PARTIALLY CONFIRMED, UNVERIFIED, or FALSE.
- An unverifiable number or citation left in the report instead of being demoted or cut.
- The report's `<style>` block modified from the bundled template.

---

## Genome (intent spec)

This skill's genome -- purpose, success criteria, behavioral invariants,
free choices, and golden examples, separated from this phenotype file --
lives at `genome/intent.md`. Specs change by hand only; this SKILL.md
is the phenotype and should regenerate from the spec on format migration,
not be patched independently of it.
