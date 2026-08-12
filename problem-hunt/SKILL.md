---
name: problem-hunt
description: Hunt for a real, unsolved-in-practice problem in AI, then brainstorm a solution collaboratively with the user. Runs a 5-phase pipeline - scan practitioner pain, adversarially try to kill each candidate against existing solutions, gate for novelty, teach the underlying mechanism, then co-brainstorm. Use this whenever the user says "lets solve a problem", "let's solve a problem", "find me a problem to solve", "what's broken in AI right now", "problem hunt", or asks for an AI challenge worth working on. Also use when the user wants to find a gap worth building into, is looking for a product or research thesis, or wants to understand why a known AI problem persists despite known fixes. Do not use for debugging a specific system the user already has; that is a troubleshooting task, not a hunt.
spec: genome/intent.md
---

# Problem Hunt

Find a problem in AI that people are still failing at, understand why the failure survives contact with existing solutions, and work out an angle on it together with the user.

The value of this skill is almost entirely in Phase 2. Anyone can list AI problems. The discipline here is trying to destroy each candidate by finding the solution that already exists, and then noticing when people keep failing anyway. That residue is where the real problem lives.

## Operating stance

Be an optimist about tractability and a pessimist about novelty.

Optimist about tractability means: never discard a candidate because it sounds hard. "Hard" is the reason it is still open and therefore the reason it is worth the user's time. Discard candidates for being *already solved* or *already obvious*, never for being difficult.

Pessimist about novelty means: assume by default that a candidate is already solved and that the user has heard of it. Make the candidate survive that assumption before advancing it.

## Phase 1: Scan

Search where practitioners complain, not where vendors market. Vendor docs and launch posts describe intended behavior; the gap lives in the delta between intended and actual.

Prioritize these sources:
- GitHub issues that are open, upvoted, and old. Age plus engagement is the strongest available signal that something resists fixing.
- Practitioner forums and communities where people post failure reports rather than demos.
- Engineering blogs describing a system in production, especially postmortems and "what we got wrong" writeups.
- Recent papers, read for their limitations and future-work sections rather than their claims.
- Support and discussion threads for widely used AI tooling.

Query patterns that surface pain rather than promotion: phrasings like "still doesn't", "why does X keep", "anyone else seeing", "gave up on", "we tried X and", "in production". Include the current year in queries when recency matters, and check the current date rather than assuming.

Run enough searches to get real coverage, typically eight to fifteen in this phase. Produce eight to ten candidates. Do not show them to the user yet. An unfiltered candidate list is exactly the listicle this skill exists to avoid.

If the user supplied a domain to narrow to, honor it. Otherwise scan broadly.

## Phase 2: Adversarial pass

For each candidate, try to kill it. Search specifically for the solution that would make it a non-problem: the library, the technique, the paper, the feature that shipped. Assume it exists and go find it.

Then classify what you found:

**Solved.** A working solution exists, is accessible, and people who apply it succeed. Discard. Say so briefly in the final writeup so the user sees the work was done.

**Adoption gap.** Solution exists and works, people simply do not know about it. Discard for the purposes of this skill. This is a distribution problem, not a technical one, and solving it means writing a blog post rather than building anything.

**Ergonomics gap.** Solution exists and works, but applying it costs more than the problem does. People rationally decline to use it. Keep. These are tractable, because the underlying mechanism is understood and the remaining work is making it cheap.

**Misdiagnosis gap.** Solution exists and correctly solves the stated problem, but people still fail, which means the stated problem was not the real one. Keep, and prioritize. This is the highest-value category and usually the highest-teaching one, because finding the real problem requires understanding the mechanism underneath the symptom.

**Substrate gap.** No solution can work at the current layer because something in the model, the architecture, or the interface forbids it. Keep if there is a plausible workaround at a different layer. Note honestly if there is not.

Rule of thumb: if this phase kills nothing, Phase 1 was too shallow. Go back and scan harder. A healthy pass discards roughly half the candidates.

## Phase 3: Novelty gate

Some problems are true, important, and completely useless to surface, because the user has already read forty posts about them.

Treat these as blocked by default:
- Hallucination in general
- Context windows being too small
- Chunking strategy in RAG
- Prompt injection in general
- Cost or latency in the abstract
- "Evals are hard"
- "Agents are unreliable"

A blocked topic passes only if the candidate is a specific mechanism-level claim inside it rather than the topic itself. "Evals are hard" is blocked. "Teams write evals that pass on the failure mode they already fixed and are blind to the next one, because eval sets are written retrospectively" is a mechanism and passes.

Apply the same test to unblocked candidates. If the candidate can be restated as a widely repeated slogan without losing anything, it is not specific enough. Push it down to mechanism or drop it.

Target three finalists. Two is acceptable. One means going back to Phase 1.

## Phase 4: Teach

For each finalist, prepare the concept payload. This is not a summary of the problem; it is the mechanism that explains why the problem behaves the way it does.

Deliver it in two layers. First, a service-level version to the user: two or three sentences per finalist, enough to know whether it is worth digging into, delivered before the Phase 5 cards. Second, the full mechanism, held back and given only when the user asks to go deeper on a finalist. Do not dump the full payloads unprompted; an essay before the pick buries the choice. Do not compress the mechanism into the card one-liner and call teaching done either. The card is an index, the service-level layer is the pitch, the full payload is the teaching.

Include:
- **The concept name**, using the real term of art so the user can search it later.
- **How it actually works**, in a paragraph, at the level a systems architect would want. Concrete over abstract. If there is a number, a threshold, or an ordering that matters, name it.
- **Why it is non-obvious**, meaning what the intuitive model gets wrong. This is the part that teaches. A concept the user could have guessed has no teaching value.

Draw from the architecture-level territory rather than the prompt-tips territory: context engineering and attention behavior over long inputs, retrieval semantics and embedding failure modes, tool and interface design as a constraint on agent behavior, evaluation design and the retrospective-eval trap, orchestration and routing, caching and state, cost structure as an architectural force, failure compounding across multi-step chains.

If a finalist has no interesting mechanism underneath it, it is a complaint rather than a problem. Drop it and promote a runner-up.

## Phase 5: Brainstorm

Present the service-level payloads from Phase 4, then the three finalist cards, then stop and let the user pick. Do not pre-select for them. Full mechanism payloads come out only when the user asks about a specific finalist.

Presentation format for each finalist:

```
### [Problem stated as a mechanism, one sentence]

**What people try:** [existing solutions found in Phase 2]
**Why it still fails:** [the gap, named by type]
**The concept underneath:** [name] - [one line]
**Why it is worth your time:** [one line]
```

Then a single line noting what got discarded and why, so the user can see the funnel.

Once the user picks, the brainstorm is a conversation, not a deliverable. The failure mode to avoid is presenting a finished solution, which ends the collaboration before it starts. The user is a systems thinker who works by pushing back on concrete proposals, so give them something specific enough to push against.

Each turn of the brainstorm, offer:
1. One hypothesis about what would actually move the problem.
2. One strawman concrete enough to attack, with real mechanics rather than a category name.
3. One thing you believe is wrong with your own strawman.

Then stop and wait. Do not stack three ideas in one turn.

Load the `critical-thinking` skill for the brainstorm phase rather than reinventing goal decomposition. Backward-chain from what would have to be true for the problem to be solved, and hold assumptions explicitly.

Watch for the moment the problem restates itself. In a good brainstorm the problem the user ends with is not the one they started with. When that happens, name it, because it is the signal that the misdiagnosis was found.

## Where it lands

Decide the endpoint per problem rather than assuming one:
- If the finding is a point of view about how something works, it wants `framework-forge` to harden it.
- If it is a decision or a pitch, it wants `document-forge`.
- If it is a mechanism the user wants to test, it wants a small build spec rather than prose.
- If it is understanding, stop. Not every hunt needs an artifact.

Output markdown by default. No em dashes; use commas, colons, semicolons, or restructured sentences.

## Anti-patterns

- Presenting the candidate list before the adversarial pass. The filtering is the product.
- Discarding a hard problem. Hard is why it survived.
- Naming a symptom as the problem. "Agents lose track of state" is a symptom; the mechanism that causes it is the problem.
- Teaching a concept the user could have guessed.
- Solving it alone in one message. Phase 5 is collaborative or it failed.
- Padding to three finalists with weak candidates. Two strong beats three where one is filler.
