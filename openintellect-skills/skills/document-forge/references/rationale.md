# Why document-forge is staged, not one-shot

Code gets reliability from two separate mechanisms, and documents need both:

- **Execution** (the truth layer): tests pass or fail. Documents have no compiler. The closest equivalent is treating every specific claim as a testable assertion, traceable to a source or explicitly flagged as an assumption.
- **Isolation** (the coordination layer): scoped, non-overlapping tasks prevent collision and drift when multiple passes touch the same artifact.

Skipping straight to drafting collapses both into "does this sound right" - the failure mode this pipeline exists to catch. The stage order (brief and gather, then structure, then draft, then verify, then gate) mirrors what practitioners across coding-agent workflows converge on independently: research, plan, execute, review, ship. Skipping from plan straight to ship is the specific move that produces confident, wrong output in both code and prose.

## Handoffs between stages

Each stage's output should be a written artifact, not something carried in working memory. This isn't theoretical: under context compaction, what survives is the current task and recent errors, while initial instructions, intermediate decisions, and style rules are exactly what gets dropped first. If the brief, acceptance criteria, or style rules only exist as something said early in the session, don't trust they're still available by stage 7 or 8 - re-read the artifact, don't rely on recall.

Minimum artifacts to keep as actual text:
- The one-sentence brief and acceptance criteria from stage 1
- The sourced/assumption-tagged claim list from stages 2 and 5
- The draft itself, versioned if it goes through more than one pass

## Standing definition of done

Applies to every document this pipeline touches, independent of what the document is:

- No unsourced claim survives past stage 5 without an explicit `[assumption]` tag
- No section reads differently to a cold reader than it was intended to, past stage 6
- No violation of the document's style rules survives past stage 7
- The document could be handed to someone outside this conversation and used, with no follow-up question needed for the core decision

A document can pass every item on its own stage-1 checklist and still fail this bar if the checklist itself was incomplete. Check both.

## Known gaps, stated plainly

- Stage 6 (ambiguity pass) and stage 8 (contract check) are judgment calls, not mechanical checks. There is no independent oracle for "did this convey what I meant" the way a test suite is an oracle for code. The acceptance criteria checklist narrows this gap, it doesn't close it.
- The gate (stage 9) is currently self-graded by the same pipeline that produced the draft. Practitioner pattern is adversarial challenge - a separate pass whose only job is to try to fail the document, not confirm it. Not yet built into this skill; worth doing before trusting the gate on anything high-stakes.
- `scripts/lint.py` only catches what's mechanically checkable (em dashes, unsourced numbers, known filler openers). It is not a substitute for stages 6-8. Run it before those stages, not instead of them.

