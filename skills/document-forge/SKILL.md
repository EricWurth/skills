---
name: document-forge
summary: A staged production pipeline for business documents — isolated scoping and explicit acceptance criteria per stage, not one-shot drafting
description: Run a staged production pipeline for a business document.
spec: genome/intent.md
disable-model-invocation: true
---

# Document Forge

A staged pipeline for producing a business document with the discipline a coding pipeline applies to software. Read `references/rationale.md` for the "why" behind any stage - it's not repeated here to keep this file scannable.

## Stage 0: Workspace setup (once per workspace)

Only needed the first time, or when the user says "/init-doc-forge" or asks to set up a document workspace.

```bash
python scripts/init-workspace.py <workspace-path>
```

Creates `system/`, `context/`, `projects/`, `outputs/`, and `skills/`, installs this skill into `skills/document-forge/`, and writes starter context stubs. Idempotent: safe to re-run, never overwrites an existing file. It installs the skill folder it lives in, so there's exactly one copy to maintain.

### If the workspace isn't directly writable (cloud sandbox, device-bridged folder)

In a cloud Cowork session, the workspace folder often lives on the user's own device and only reaches this session through a bridge - the sandbox running this script cannot write to it directly. Check for that before assuming the one-liner above works as-is: if the target path isn't reachable by the same tool that would run the script, do this instead:

1. Run `python scripts/init-workspace.py <scratch-path>` against a local scratch path inside the sandbox.
2. Write the resulting tree to the real workspace using whatever direct mechanism the environment provides. If more than one reaches the target, prefer the most direct one - a mounted path you can write to in a single pass beats a per-file upload-and-commit round-trip, which is a fallback for when nothing else reaches the target, not a default. Real file, real content, one pass per file.
3. Skip any encoding detour (tar, base64, or reading an encoded blob back into context) that isn't actually needed to get the content there. It adds latency without adding a check that matters - the check that matters is listing the real target directory afterward and confirming the files landed, not inspecting the intermediate encoding.

After running (either path):
1. Replace the three `context/` stubs with real content. Before interviewing the user from scratch, check whether a source of truth already exists elsewhere (a personal memory system, a CLAUDE.md, prior stated preferences) and default to porting that in directly, naming where it came from - don't ask whether to use it if the answer is already written down somewhere durable. Interview the user only for what isn't already established, and push for specifics: "be concise" isn't a usable rule, "lead with the recommendation, no throat-clearing" is. Keep all three under roughly 4,500 words total.
2. Audit `scripts/lint.py` against the real `context/tone-of-voice.md` you just wrote, in both directions: migrate any mechanically-checkable rule that's actually this project's into the linter, and check whether the em-dash ban and filler-opener list the script ships with are rules this project actually has. They're a generic example from the skill template, not a default that applies until confirmed - see the linter's own module docstring. An unconfirmed rule flagged as a lint failure is noise, not a defect, and it's easy to let it bury the numeric-claim findings that are always real. This is the step that's easiest to skip and matters most.
3. In Claude Desktop, go to Cowork, then Projects, then `+`, and choose to use an existing folder. Point it at the workspace. It asks once for read/write access.

Note: Cowork project memory is isolated per project, so this skill isn't visible from other projects unless installed there too.

### Maintaining this skill across projects

This skill can exist in two places at once: the account-level copy (what gets installed into a brand-new workspace) and each project's own installed copy under that project's `skills/document-forge/`, which Stage 0 deliberately snapshots rather than links. A fix made while working in one project's copy doesn't reach the account-level copy, or any other project's copy, on its own.

When a fix is project-specific (this project's own lint rules, this project's context stubs), it belongs only in that project. When a fix corrects the skill's own instructions or logic - a gap in this file, a bug in `scripts/init-workspace.py` or `scripts/lint.py` that isn't about one project's content - propagate it to the account-level skill too, not just the copy in front of you. Otherwise every other project, and every future `/init-doc-forge`, keeps the same defect. State explicitly which copies got the fix rather than leaving it implied.

## The pipeline

Run each stage in order. Each stage has a narrow job. Don't let a later stage silently redo an earlier stage's job. Re-read prior stage artifacts fresh at each step rather than trusting memory of them.

### 1. Brief
State the decision or action this document must enable, in one sentence. If you can't, stop - drafting now produces well-written ambiguity, not a document.

Write explicit acceptance criteria: specific, testable conditions the finished document must satisfy. Not just the goal - a checklist. Capture audience and what they already know coming in. This is what a planning agent hands an executor; a goal alone isn't a spec.

For a known document type (charter, comms plan, change/OCM plan, status report, and so on), cross-check the acceptance criteria against that type's standard components before finalizing the brief - what a practitioner in this domain would expect a complete version to cover, not just what the requester happened to name. A missing standard section is a completeness gap, not a simplification. If there's a real reason to omit one (genuinely out of scope, premature at this stage), say so explicitly as an open question or a stated exclusion - don't let it drop silently because naming it wasn't asked for. See Stage 7's note on brevity vs. completeness - they're often conflated and shouldn't be.

Write this to a durable artifact. Stages 6 and 8 check against it directly.

### 2. Gather
Pull source material. For anything asserted as fact, note its source now. Anything without a source gets flagged `[assumption]` - carried forward, never silently dropped.

### 3. Outline
Structure against the document type's required sections. Check the outline against stage 1's brief before drafting: does this structure deliver the decision, or just cover the topic.

### 4. Draft
Write it. If drafting multiple sections, scope each as its own isolated pass, then reconcile terminology and claims across sections afterward.

Retrofitting an existing draft: if a draft already exists that was written outside this pipeline, don't treat its existence as having already satisfied stages 2-4. Treat it as stage 2/3 source material - verify it against stage 1's brief, keep what actually holds up, and still run it through stages 5 onward for real rather than copying it into the output.

### 5. Claim check
Walk every specific claim, number, or quote. Traced to a source, or tagged `[assumption]`. No silent unsourced assertions.

Two different things get called a "claim" here, and conflating them causes either over-tagging or under-tagging. A factual assertion about the world (a stat, a date, a quote) needs a source or an `[assumption]` tag on the assertion itself. A prescriptive recommendation the document is making as its own judgment call - a suggested cadence, a threshold, a default - isn't sourced from anywhere and isn't supposed to be; it's the document's whole point. Still tag the quantified ones `[assumption]` where a reader could otherwise mistake a judgment call for an established fact, but don't hold every recommendation to the same bar as a factual claim.

Write the resulting claim list to `projects/<project>/review-notes.md` rather than leaving it only in conversation. Stage 8 and anyone auditing this project later need it to still exist as a real file, not a memory of this session.

### 5.5 Mechanical lint
Run `scripts/lint.py` against the draft before the judgment-based stages below. It separates two kinds of findings: unsourced numeric claims (always real, always worth fixing) from the em-dash/filler-opener defaults it ships with (a generic template example, only real once confirmed in `context/tone-of-voice.md` - see Stage 0 step 2). Don't let unconfirmed generic-default findings block progress or get bulk-fixed as if they were established rules. Not a substitute for stages 6-8, only for the parts that don't need judgment.

### 5.6 Ground truth check (when the document invokes named practice)
Stage 5 tags claims as sourced or `[assumption]` - it doesn't check whether an asserted source or a named methodology claim is actually right. When a document invokes a named framework, standard, or established practice as part of its reasoning ("ADKAR fits this audience," "this is standard PMI charter structure," "Kotter's coalition-building"), extract every such load-bearing claim - one where, if wrong or misdescribed, a section of the document has to be reframed - and verify it with real research before treating it as settled.

Skip this stage explicitly, stating why, when a document makes no such claims - a status report template that invokes no named methodology has nothing to ground. Don't run it as theater.

**Agent-capable runtime:** one verifier agent per claim cluster (group related claims across documents if reviewing a set), real web search/fetch required, not a recall of training data dressed up as verification.

Verifier prompt: `Independently verify this claim with real web research. Be skeptical, don't trust a single secondary source. CLAIM: {claim, stated exactly as the document frames it}. Search for (a) direct support, (b) direct contradiction, (c) how the named framework/standard actually defines or handles this today, with sources, and (d) whether this document's framing matches the source or oversimplifies/misstates it. Return: VERDICT = CONFIRMED / TRUE BUT NOT AS FRAMED / CONTRADICTED / CONTESTED / UNFINDABLE. Then 3-5 bullets with URLs. Then one line: what breaks in the document if this claim is wrong as framed. Under 350 words.`

Report every non-CONFIRMED verdict before treating the section as done. A CONTESTED or TRUE BUT NOT AS FRAMED verdict usually means tightening the framing, not deleting the section - a live disagreement among practitioners is a legitimate thing to name rather than paper over. For UNFINDABLE, don't manufacture a citation - label the claim explicitly as the document's own judgment call (`[assumption]`), not a verified fact, the same convention used elsewhere in this pipeline.

### 6. Ambiguity pass
The one stage where isolation is load-bearing, not optional.

**Subagents available (Claude Code, Cowork):** dispatch a separate subagent using `agents/ambiguity-reader.md` as its full instructions. Give it the draft only, no brief, no acceptance criteria, no history. Diff its readback against stage 1's acceptance criteria, item by item. Divergence is a defect, rewrite it, don't annotate around it.

**No subagents (Claude.ai chat):** a same-context re-read isn't a real substitute. Open a new, separate conversation, paste in the draft alone, run `agents/ambiguity-reader.md` cold. Anything less is skipping this stage, not a lighter version of it.

Append the subagent's full readback and flagged ambiguities to `projects/<project>/review-notes.md`, along with what changed in response and what didn't. A finding only counts as durable if it survives past this conversation.

### 6.5 Adversarial content review
Stage 6 checks whether the document agrees with itself. This stage checks whether the content is actually sound and usable - a different failure mode, and the one a single self-graded pipeline is worst at catching on its own. Run this for documents where being substantively wrong costs something beyond internal inconsistency - most documents this pipeline is used for qualify; skip it explicitly, stating why, for something genuinely low-stakes.

Run 2-3 independent personas against the document (or against a full set of documents together, when they form one interlocking system - reviewing them jointly can surface cross-document issues a single-document read would miss). Each persona sees only the draft(s) and its own prompt - no brief, no history, no other persona's findings.

- **Standards-literate practitioner** - `You've run this kind of work for years and hold the relevant credentials/certifications for this domain. Read: {DOC}. Do real web research. Find: any named methodology, framework, or standard cited inaccurately or in a way its own source material doesn't support; any place a standard practice should have been invoked and wasn't; any claim that would embarrass the author in front of a credentialed peer. Be specific about what the actual source says, with URLs. Rank by how badly each undermines the document's credibility. Under 600 words.`
- **Skeptical operator** - `You're the person who'd actually have to run this on Monday, with no special authority, tooling, or time beyond what's normal. Read: {DOC}. Find every place this assumes standing, resources, or buy-in you don't have, and anywhere the advice wouldn't survive contact with a real team. No research needed - this is a practical read, not a citation check. Rank by how badly each blocks actual use. Under 500 words.`
- Add a third persona only when the document's stakes justify it (a domain-specific skeptic, a named audience's advocate).

**Agent-capable runtime:** spawn personas in parallel, one subagent each.

Findings classify the same way as stage 5.6: repair (mechanical, fix it), needs research (verify before fixing), or design call (changes what the document claims - present the tradeoff, don't decide silently). A finding that can only be answered by making the document more generic is a design call to flag, not a fix to make quietly - sanding off a specific recommendation to dodge a finding is a regression, not a repair.

### 7. Style and structure check
Apply the governing style rules for this document, whatever they are. Establish them in stage 1 if they aren't already defined somewhere durable; don't infer them mid-check.

Rules split into two kinds, and the split matters: mechanically checkable ones belong in `scripts/lint.py` where they're enforced deterministically, and judgment-based ones get checked here. If a rule keeps getting missed here and could be pattern-matched, move it into the linter rather than restating it.

Brevity and conciseness, however `context/tone-of-voice.md` defines them, are a sentence- and paragraph-level property: short sentences, no throat-clearing, lead with the judgment rather than the procedure. They are not license to cut a standard section a practitioner would expect a document of this type to cover - that's a stage 1 completeness question, not a stage 7 style question. A terse voice writes a complete document in fewer words; it doesn't write an incomplete document. If the two genuinely conflict - a one-page constraint that can't fit every standard section - that's a real tradeoff to name explicitly in the brief's acceptance criteria, not a decision to make silently at draft time.

Illustration only, not a default to adopt: one prior author's own rule set looked like "no em dashes, use commas, colons, semicolons, or restructured sentences; collaborative language about problems rather than people; no blame framing; pattern-level description rather than specific-failure callouts; no throat-clearing; no announced transitions; each section stands alone without relative-scope references to other sections." That's shown to demonstrate the shape a real rule set takes, not to be checked against unless this project's own `context/tone-of-voice.md` actually says these things.

### 8. Contract check
Check the draft against every item in stage 1's acceptance criteria, one by one. Could someone outside this conversation act on the one-sentence decision using only this document. Name any unmet criterion specifically.

### 9. Gate
Pass or fail, with the specific failing criterion named if fail. This stage is currently self-graded, see `references/rationale.md` for why that's a known weak point. On fail, return to the specific stage that owns the gap, don't redraft from stage 4. If stages 5.6 or 6.5 ran, their non-CONFIRMED verdicts and unresolved findings need a stated resolution (fixed, or explicitly deferred with reasoning) before this stage passes - a document can't gate PASS with an open CONTRADICTED verdict sitting unaddressed.

## Notes

- This pipeline is for documents where being wrong costs something. For a quick summary or casual note, skip it and just write. An internal document with no external audience still qualifies if getting it wrong has a real cost - audience being "just me" doesn't mean low-stakes.
- Terse voice and complete coverage are different axes - see Stage 1's completeness check and Stage 7's note. A document can be both concise and missing a standard section a practitioner would expect; that's a defect the brevity instruction doesn't excuse. Caught in production once: three template documents (charter, comms plan, OCM plan) came out of the pipeline passing every acceptance criterion the brief listed, but the briefs themselves had under-scoped what a complete version of each document type covers, and house style (short, judgment-first) had been read as license to keep sections minimal rather than just keep prose tight.
- `agents/ambiguity-reader.md` holds full instructions for the isolated subagent, read it before dispatching, don't paraphrase from memory.
- `scripts/lint.py` - mechanical checks only, run before stage 6. Splits findings into confirmed (always real) and generic-default (only real once confirmed in `context/tone-of-voice.md`) - see the script's own docstring and Stage 0 step 2.
- `references/rationale.md` - the reasoning behind the pipeline shape, the standing definition of done, and known gaps stated plainly.
- `projects/<project>/review-notes.md` - durable record of stage 5's claim list and stage 6's ambiguity readback, plus stages 5.6 and 6.5's verdicts and persona findings when those stages ran. If this file doesn't exist for a project that's been through these stages, the findings live only in a conversation transcript, which defeats the point.
- Stages 5.6 and 6.5 exist because internal consistency (stage 6) and source-tagging (stage 5) are not the same thing as "this is actually true" and "this actually works when someone tries to run it." A document can pass every earlier stage - internally consistent, every claim tagged, every acceptance criterion met - and still rest on a methodology claim that's wrong as framed, or a recommendation that collapses on contact with a real team. Don't treat stages 5-8 as sufficient rigor on their own for a document whose being-wrong cost is more than cosmetic.
