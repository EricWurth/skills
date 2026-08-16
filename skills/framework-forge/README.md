# framework-forge

Hardens a framework thesis drawn from experience into a publishable document.

## Why this exists

Someone with a real point of view, earned by doing the work, writes it up and
it reads like every other framework post. The usual advice makes this worse:
research more, add citations, cover the counterarguments — and the result is
better sourced and even less distinctive.

This inverts the order. It verifies the author's own claims *first*, before
any outside research, so the grounding attaches to a position that already
exists rather than replacing it.

## How it works

Seven phases, and the ordering is load-bearing:

- **0 — Contract.** What the document argues, for whom, and what would make it wrong.
- **1 — Verify the author's claims.** Never skipped, never reordered. The
  author's own assertions are checked before anything external enters, so
  research grounds a real thesis instead of diluting one.
- **2 — Map the territory and ground in it.** Produces four lists: what to
  ground, what to cite, what to credit generously rather than claim, and the
  positioning statement.
- **3 — Draft.**
- **4 — Adversarial review.** Five personas, the engine of the skill. The
  primary gate is an experienced peer who can tell within two pages whether
  the author did the job or read about it — hunting for advice that would
  survive contact with no real organization, tradeoffs stated without picking
  a side, failure modes that are textbook rather than scar tissue.
- **5 — Remediate and loop.**
- **6 — Subtract and land.**

Two rules do the real work. **Ground generously** — cite the standard each
mechanism extends and say plainly what it adds; credit costs nothing and buys
standing. And **overlap is not a defect** — the question is never whether
anyone thought this before, but whether it is well-assembled, honestly
credited, runnable, and visibly the product of someone who did the work.
Phase 4 explicitly does not reward novelty; it penalizes only the absence of
a point of view.

## Requirements

- **Subagents.** Phase 4 runs its persona panel in parallel. Claude Code only.
- **Web research**, for phase 2.
- Nothing else. No scripts, no other skills.

## Install

```
cp -r skills/framework-forge ~/.claude/skills/
```

## Use

Type `/framework-forge`. Bring a thesis you already hold — this sharpens and
grounds a position, it does not generate one.

Wrong tool for a summary, a literature review, or a first-draft brainstorm.
It assumes there is already something to defend.

## Limits

It cannot tell you whether your thesis is *correct*, only whether it is
honestly grounded, credited, and visibly earned. A confidently wrong
framework will pass every gate.
