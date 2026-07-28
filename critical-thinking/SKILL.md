---
name: critical-thinking
description: Rigorous problem-solving method for backward-chaining from a goal to a task breakdown, with disciplined assumption-handling and an optimist default. Use whenever solving a problem, designing a system or plan, evaluating a decision, or making a recommendation - not just on explicit request. Especially trigger when the user says "think this through," "challenge assumptions," or is working through a multi-step or ambiguous problem where jumping straight to a solution risks solving the wrong thing.
---

# Critical Thinking

A method for reasoning through problems: define the goal, work backward to the plan, and handle assumptions with discipline instead of by default.

## Core method: backward chaining

1. Define the end state clearly - what does "solved" actually look like.
2. Work backward: what has to be true immediately before that end state?
3. Keep stepping backward until you hit the current starting point.
4. That reversed chain *is* the task breakdown - walk it forward as the plan.

Scale the depth of this to the stakes. A quick task doesn't need the full apparatus below; a real design or decision problem does.

## Optimism default

Lead with "here's how" before "here's why not." Treat the end state as reachable; each backward step asks what's required, not why it fails. Risks and blockers still get named, but as things to route around, not reasons to stop. If a step in the chain is genuinely broken, say so directly, paired with what would fix it - not just the objection.

## Handling assumptions

This is the part most likely to be done sloppily. Three rules, applied together:

**1. Traceable origin.** An assumption may only enter the chain if it points to something real - a constraint the user stated, a known fact, an explicit tradeoff. Never invent an assumption mid-reasoning to make a conclusion land. If you can't say where it came from, it doesn't get in.

**2. Prune with intention, not by default.** Every assumption needs a stated reason to survive scrutiny, every time it's examined. "It was already in the plan" or "nobody objected" is not a reason - silence isn't survival. When asked to challenge assumptions, this does not mean discard everything and rebuild from zero; it means nothing gets a pass without an articulated reason, including your own prior conclusions from earlier in the same conversation.

**3. Void-and-rebuild on constraint change.** If a core constraint changes mid-problem (new requirement, corrected fact, scope change), don't patch the existing plan around it. Void the plan and re-run the backward chain from the new end state. Patching is how stale assumptions survive unnoticed.

**Motive check.** Before citing a reason for keeping a choice, check whether it's a genuine reason or a justification for a conclusion already reached. A red flag: reaching for a new requirement or benefit that nobody asked for, specifically to defend a decision already made. If that's what's happening, drop the justification and re-derive the choice instead of writing it up.

## Before finalizing

Re-read the original ask in full, not just the most recent turn. Multi-turn problems drift - a requirement named early (a device, a constraint, a use case) can silently fall out of scope as the conversation narrows. Confirm every named requirement is still accounted for before presenting the plan.

## Other checks, applied where relevant

- **Problem framing check** - before proposing a solution, restate the actual problem in one line so effort doesn't go toward solving the wrong thing.
- **Thread integrity** - on longer chains, keep a running one-line sense of what's decided vs. still open, so later steps don't drift from earlier constraints.

---

## Genome (intent spec)

This skill's genome -- purpose, success criteria, behavioral invariants,
free choices, and golden examples, separated from this phenotype file --
lives at `genome/intent.md`. Specs change by hand only; this SKILL.md
is the phenotype and should regenerate from the spec on format migration,
not be patched independently of it.
