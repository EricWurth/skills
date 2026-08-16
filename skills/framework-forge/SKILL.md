---
name: framework-forge
summary: Hardens a framework thesis into a publishable document — verifies the author's claims, grounds them in the territory, then runs a five-persona adversarial review
description: Use when someone has a framework thesis drawn from their own experience that they want researched, hardened, and built into a mature publishable document, or says "forge this framework" / "harden this framework" / "run framework-forge on X". Runs a 7-phase pipeline: contract -> verify the author's own claims -> map and ground in the territory -> draft -> five-persona adversarial review -> remediate and loop -> subtract and land. Best when the author already has a point of view and needs it stress-tested, grounded, and made runnable; overkill for a summary or a first-draft brainstorm.
argument-hint: "[framework thesis, or path/link to a draft]"
spec: genome/intent.md
---

# Framework Forge

## What this does

Takes a framework the author has earned through practice and turns it into a document that survives three readings at once: a peer who might run it, a credentialed reader who knows the standards, and a stranger who owes it no goodwill. It verifies the author's load-bearing claims before anything gets written, maps the established practice the framework builds on so it can cite rather than reinvent, drafts, then attacks the draft with five personas and loops remediation until the findings stop being structural.

This is not a research skill. Storm Research answers "what is true about this topic." This answers "does this framework hold up, is it runnable, and does it read like it came from someone who has actually done the work."

**The framework does not have to be unprecedented.** Overlap with existing practice is expected and is not a defect. A framework that assembles known parts for a situation they are not usually assembled for, and says so plainly, is a real contribution. Discovering that ITIL or PMI already names one of your mechanisms is a gift: cite it, inherit its credibility, and spend your originality budget somewhere it matters.

## The two gates

Every phase serves these, in this order.

**Gate 1 — Earned judgment.** Does this reflect things only someone who has done the work would know? Specific tradeoffs resolved and defended, failure modes that read as scar tissue rather than textbook, opinionated calls with the losing alternative named. The failure mode here is *genericness* — a competent survey with no fingerprints on it.

**Gate 2 — Deployability.** Could a peer read this and actually run some of it in their org next quarter? Named owners, triggers, a first move, honesty about what requires authority the reader may not have. The failure mode here is a smart document nobody can operationalize.

When findings from the two gates conflict, judgment wins. A framework that shows real depth but needs adaptation to a specific org passes. A turnkey framework that reads as committee-written does not.

## Runtime adaptation (read first)

- **Agent-capable runtime.** Run Phase 1 verifiers and Phase 4 personas as parallel agents. Roughly 8-11 agents per full run.
- **Chat runtime.** Run them sequentially inline. Same prompts, same order, same outputs.

Rule: if you cannot spawn agents, do the work inline in sequence. Never drop a phase because the mechanism differs.

Honesty note for the chat path: personas sharing one context see each other's reasoning and converge. Treat agreement between them with less weight, and compensate by running an extra remediation loop.

## Phase 0: Contract

Capture seven things and state them back in under twelve lines. Do not proceed until the audience and the experience base are pinned.

1. **The thesis**, in the author's words.
2. **The position it takes.** What standard practice does this improve, resequence, constrain, or refuse? It does not have to contradict the field — but it has to *choose*. If the framework would draw no disagreement from an informed reader, it is a survey, and say so now rather than at the end.
3. **The experience behind it.** What has the author actually run, watched fail, inherited, or fixed that this comes from? This is the raw material for Gate 1 and the hardest thing to add later. If this is thin, flag it immediately — the framework can still be built, but it will lean on Gate 2 and the author should know that going in.
4. **The audiences.** Pin the primary and name the secondaries. Most documents here serve three: a practitioner who would run it, a hiring panel or public reader judging the author through it, and a credentialed reader checking it against standards. The primary determines what counts as a gap in Phase 4; the secondaries determine what gets a sanity check rather than a full fix.
5. **The strongest attack** the author already anticipates.
6. **The author's own open questions**, the claims they flag as unverified.
7. **Style constraints.** Voice, length, prohibited constructions, whether the author writes the prose or you do.

## Phase 1: Verify the author's claims (never skip, never reorder)

Before drafting anything, extract every load-bearing empirical claim from the thesis. A load-bearing claim is one where, if false, a section of the framework collapses or has to be reframed. Include the author's stated open questions and — critically — any claim that characterizes what the field currently does ("teams typically handle this by X," "the standard approach assumes Y"). Misdescribing the default is the fastest way to lose a credentialed reader, and it is far more common than being wrong about the fix.

- **Agent-capable:** one verifier agent per claim cluster, in a single message.
- **Chat:** verify each in sequence with real search and fetch.

Verifier prompt:

`Independently verify this claim. Be skeptical and do not trust a single secondary source. CLAIM: {claim, stated exactly as the author framed it}. Search for (a) direct support, (b) direct contradiction, (c) how established practice actually handles this today, including any named body, standard, or published framework that addresses it, and (d) whether the sources supporting it have a commercial interest in it being true. Return: VERDICT = CONFIRMED / TRUE BUT NOT AS FRAMED / CONTRADICTED / CONTESTED / COMMERCIALLY MOTIVATED SOURCE / UNFINDABLE. Then 3-5 bullets of specifics with URLs. Then one line: if the author built a framework section on this claim as stated, what would break. Under 350 words.`

Report every non-CONFIRMED verdict to the author before drafting. Do not quietly route around a failed claim and do not soften it.

A CONTRADICTED verdict is often good news: it usually means the author has spotted a real dysfunction the field has only tried to fix by exhortation, and the contradiction becomes the framework's sharpest section. A CONTESTED verdict is also usable — a live disagreement among experts is a legitimate place to plant a flag, as long as the framework acknowledges it is planting one.

For UNFINDABLE, do not manufacture a citation and do not retreat to mush. Ground the claim explicitly in the author's own practice — "across the programs I've run, this is what I've seen" is a defensible and often stronger basis than a weak secondary source, provided it is labeled as experience rather than evidence.

## Phase 2: Map the territory and ground in it

Two sweeps, both required. The purpose is to inherit credibility, not to defend territory.

**2a. Which named standards already own these mechanisms.** For each mechanism the framework proposes, find whether PMI, IIBA, ISO, ITIL, NIST, IIA, a regulator, or a domain body already has a name for it. Finding one is a win. A framework that cites the standard it extends reads as written by someone senior; one that appears not to know the standard exists reads as written by someone who hasn't been in the room.

**2b. Which adjacent frameworks exist and what layer they occupy.** For each, classify what it actually governs: strategy, maturity assessment, operating-model design, or execution. Then write the **positioning statement** — three sentences: what this borrows and from whom, what it assembles differently, and what it adds. "Adds" can be small. A sequencing decision, a named failure mode, a decision rule at a seam between two mature bodies — these are real contributions and should be claimed at their true size rather than inflated.

Output of this phase is four lists: what to ground in, what to cite, what to credit generously rather than claim, and the positioning statement.

The strongest positioning is almost never "nobody has done this." It is "these two mature bodies both stop at the same edge, and here is what I do at that edge, drawn from having stood there." Prefer that framing whenever the evidence supports it.

## Phase 3: Draft

Sharpen the author's structure, do not replace it. If the author gave a working structure, that is the spine, and changes to it are proposed rather than made silently.

Five rules govern every section:

- **Failure-mode anchoring.** Every mechanism names the specific failure it exists to prevent. A mechanism without a named failure mode is decoration and gets cut.
- **Show the call, not just the conclusion.** Where the framework makes an opinionated choice, name the alternative and why it lost. This is where Gate 1 is won or lost — the reasoning behind a call is what a reader cannot get from a textbook.
- **Position test.** Every claim must be one a reasonable, informed person could disagree with. If no one could disagree, it is a platitude and it goes.
- **Ground generously.** Cite the Phase 2a standard each mechanism extends, and say plainly what it adds. Err toward more citation, not less; credit costs nothing and buys standing.
- **Concede early.** Where Phase 1 contradicted the author, the draft states the correction rather than hiding it.

Three sections are mandatory regardless of subject:

1. **A worked example** applying the framework to a realistic scenario end to end.
2. **Objection answers**, including the strongest attack from Phase 0, answered rather than dismissed. Conceding the honest version of an objection is stronger than defeating a weak version.
3. **A self-critical section** naming where the framework strains, using real failure modes rather than performed humility.

## Phase 4: Adversarial review (the engine)

Five personas. Each sees only the current draft, the pinned audience from Phase 0, and its own prompt. Do not tell a persona what earlier rounds found, or the test is contaminated.

Personas 1 and 5 serve Gate 1. Personas 2, 3, and 4 serve Gate 2 and internal soundness. When their findings conflict, Gate 1 wins.

- **Agent-capable:** spawn all five in a single message.
- **Chat:** run them in sequence, resetting your framing between each.

**1. THE EXPERIENCED PEER** (Gate 1, primary) — `You have run this kind of work for twenty years at director level and you can tell within two pages whether a document was written by someone who did the job or someone who read about it. Read: {DOC}. The intended audience is {AUDIENCE}. Hunt for genericness. Specifically flag: advice that would survive contact with no real organization, tradeoffs stated without the author picking a side, failure modes that are textbook rather than scar tissue, mechanisms described without naming what it costs to run them, and any section that could have been produced without ever having done this. Then name the two or three passages where real judgment is visible, and say what makes them credible. Do NOT reward novelty and do NOT penalize overlap with known practice — a well-credited borrowing is fine. Penalize only the absence of a point of view. Return findings ranked by severity. Under 700 words.`

**2. THE PRACTITIONER** (Gate 2) — `You are the business analyst or project manager who would actually have to run this on Monday: {DOC}. You do not control the program, you do not set governance, and you have a day job. Find every place this assumes standing, tooling, data, or time you do not have. Specifically check: is there a starting move, can you run any of it for just your own scope, and what does it require from people who do not report to you. Return findings ranked by how badly each blocks adoption. Under 600 words.`

**3. THE STANDARDS READER** — `You hold PMP, CBAP, and an audit credential. You are not hostile to frameworks that build on standards — that is what good ones do — but you are irritated by imprecision. Read: {DOC}. Do real web research. Find (a) any standard cited inaccurately or in a way its own text does not support, (b) any place the framework should have cited a standard and did not, and (c) any mechanism a named standard already covers well enough that the framework should defer to it and move up a layer rather than restate it. For (c), the finding is "cite this and build on top," not "this is unoriginal." Be specific about which standard, which clause or knowledge area, and what it actually says. Rank by how embarrassing each would be in front of a credentialed reader. Under 600 words.`

**4. THE INTERNAL AUDITOR** — `Check this document against itself only. Do no external research: {DOC}. Find: rules that contradict other rules, cross-references pointing at sections that no longer exist or have been renumbered, terms used before they are defined, mechanisms whose stated scope conflicts with how the worked example uses them, and any rule with no defined termination or no defined actor. Also check whether the worked example is rigged, meaning the finding it dramatizes was made inevitable by how the setup was written rather than genuinely caught by the mechanism. Quote the conflicting text in both places. Under 600 words.`

**5. THE COLD READER** (Gate 1, secondary) — `You are a senior leader encountering this document with no context and no goodwill toward the author — assume you are on a hiring panel, or you found it posted publicly. Read: {DOC}. Answer three things. First: within ten minutes, what would you dismiss, and why? Look for padding, borrowed language with no evidence the author has lived it, confidence without support, and length that does not earn itself. Second: what does this document make you conclude about the author's judgment and seniority — be specific and be blunt, including if the answer is "they read a lot." Third: what genuinely survives, and what is the single strongest passage. Do not pad. Under 700 words.`

After all five, post 3-4 lines in chat: the sharpest structural finding, anything two or more personas independently found, whether any finding is fatal rather than fixable, and the Cold Reader's verdict on what the document says about the author. Keep the raw briefs out of chat.

## Phase 5: Remediate and loop

For each finding, classify:

- **Repair.** Mechanical, no judgment required. Fix it.
- **Needs research.** Search before fixing, because the fix has to be grounded. Findings from the Standards Reader almost always land here.
- **Design call.** Changes what the framework claims. Do not decide silently. Present it to the author with a recommendation and the tradeoff, then act on the answer.

**Remediation that sands off opinion is a failed remediation.** The most common way this skill degrades a document is by answering a deployability complaint with hedging — adding "depending on your context," softening a call into a menu of options, replacing a specific number with "as appropriate." When a Gate 2 finding can only be fixed by making the document more generic, escalate it as a design call instead of fixing it.

Then re-run Phase 4 against the revised draft with fresh persona instances.

**Stopping rule.** Stop when a full round returns only cosmetic findings, or after three rounds, whichever comes first. Report which. Three rounds returning structural findings means either the thesis or the audience pin is wrong, and that should be said plainly rather than patched a fourth time.

Track findings across rounds. A finding that reappears after being fixed means the fix did not work, which is more serious than a new finding.

## Phase 6: Subtract and land

**6a. Subtraction.** Turn the framework's own position on itself, section by section: does this serve the position from Phase 0? Cut what does not, including material added during remediation. Frameworks get worse as they absorb fixes, and this phase exists because every remediation loop adds mass.

Three smells to check explicitly:

- If the self-critical section approaches the length of the mechanism it critiques, the framework is either over-claiming or under-specified.
- If a section is purely advisory, giving orientation rather than a rule with a consequence, it must justify itself against the framework's own test or go.
- If the document could be handed to any organization in any industry without changing a word, it has been sanded generic. Find where the specificity went and put it back.

**6b. Adoption path.** For the primary audience pinned in Phase 0, state how someone begins. Separate what works with no authority from what requires standing the reader may not have, because most readers cannot impose governance. A framework with no starting move does not get adopted regardless of quality.

**6c. The signal check.** Before delivering, answer in one line: what does a sharp reader conclude about the author's judgment from this document? If the honest answer is "they are well-read" rather than "they have done this," Gate 1 has not been cleared, and the fix is more specificity from Phase 0.3 — not more research.

**6d. Deliver** in whatever medium the author is working in, and report: claims verified and what changed, the positioning statement from Phase 2, findings by round with the stopping reason, what was cut in subtraction, and the signal check answer.

## Notes & guardrails

- **Never draft on an unverified premise.** Phase 1 precedes Phase 3, always. Building a section on a claim that is wrong as framed wastes the entire downstream loop.
- **Overlap is not a defect.** Prior art is grounding. The question is never "has anyone thought this before" — it is "is this well-assembled, honestly credited, runnable, and clearly the product of someone who has done the work."
- **Genericness is the failure mode, not similarity.** A framework that resembles three known ones but makes sharp, defended calls is strong. A framework that resembles nothing but takes no position is not.
- **Contradict the author when the research does.** Report it plainly. The author asked for a framework that survives an expert, not one that agrees with them.
- **Sharpen, do not replace.** Work with the author's words and structure. Rebuilding their idea and handing it back is a failure even when the rebuild is better.
- **The worked example must not be rigged.** It has to prove the mechanism on a case where every other gate passes and only this one catches the problem. An example where the setup guarantees the finding proves nothing and a sharp reader will spot it.
- **Concessions are strength.** Answering the honest version of an objection beats defeating a weak version. Where an objection is mostly right, say so and defend only what survives.
- **Audience gates findings.** A Phase 4 finding that only matters for a secondary audience gets a sanity check, not a full remediation. One that only matters for an audience not on the list gets discarded.
- **Do not perform humility.** The self-critical section names mechanisms that will actually fail and why. Hedging reads as not believing the framework works.
- **Cost.** A full run is roughly 8-11 agents in an agent-capable runtime. Do not fan out wider than five personas per round or one verifier per claim cluster.
