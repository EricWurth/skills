---
name: delegate-status
description: >
  This skill should be used when the user asks for status on delegated work — "status",
  "where are we", "give me an update", "how's it going on X" — or when a delegate
  checkpoint fires (sub-problem complete, turn-count heuristic, ~80% context).
  It produces the decision-queue report format, never an activity narrative.
metadata:
  version: "0.1.0"
spec: genome/intent.md
---

# Delegate Status

Produce a status report that is a decision queue, not an inventory. If an item does not require a decision from the user or inform one they would make, it does not appear.

## Format

Three sections, in this order, each omitted entirely when empty:

**Needs your call.** Charter change requests only — forks that move scope, timeline, cost, or outcome. Each item: what changed, why, options with a recommendation. Never a bare question.

**Approaching your threshold.** Early-warning items: a risk trending toward becoming an issue, an actual trending toward the order-of-magnitude flag, a fork decided close to the escalation line (stated so the user can recalibrate judgment before it matters, not to reopen it).

**Decided since last update.** One line per decision, no justification inline; the graph node id in parentheses so "walk me through why" is a traversal, not a reconstruction.

Close with a single line of position against the charter: current step, actual vs estimate. Nothing else.

## Rules

- No task lists, no activity narration, no "risks have been logged". These are performative and measure nothing the user steers by.
- Answer at the altitude of the question: if the user asked a one-line question, the report may be one section or one sentence. The full format is for checkpoints, not every reply.
- A completion claim in any section must be ledger-backed. If the evidence is not fresh, state the work as unverified and say what check would verify it.
- Before reporting any discrepancy (between plan and reality, between the user's expectation and outcome), restate the widest reasonable reading of the expectation first and check the discrepancy survives.
- If the report would be empty in all three sections: say exactly that, one line, position against charter. An empty decision queue is a valid and good report.

## Stuck escalations

A stuck flag (frontier stopped moving, or actuals an order of magnitude past estimate) always lands in **Needs your call**, formatted as: the wall, what was thrown at it, what the wall appears to be made of, and a recommended path (different approach, charter change, or abandon-with-reasoning).

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "The queue is empty, so I'll add a line that risks were logged to show I did something" | This is the exact failure named in the rules: "no 'risks have been logged'" is performative and measures nothing the user steers by. An empty queue stated plainly is the good report. |
| "I'll list what got done since last time — it shows progress" | That is an inventory, not a decision queue. If an item does not require a decision from the user or inform one, it does not appear, no matter how much work it represents. |
| "This step is probably done, I'll just report it complete" | A completion claim must be ledger-backed. Without fresh evidence, the correct move is to state it as unverified and name the check that would verify it — not to round up to done. |
| "This risk is worth flagging even though I don't have a clear recommendation yet" | Needs-your-call items are never a bare question. If there's no options-plus-recommendation to offer, it isn't ready for that section. |
| "I'll add a sentence explaining why the decision was made, it's more helpful" | Justifications live in the graph, reachable by node id. Reconstructing them inline defeats the point — "walk me through why" should be a traversal, not something the report already did for them. |

## Red Flags

- A bullet list of completed tasks, or any phrase like "risks have been logged," appearing in the report.
- A Needs-your-call entry that is a bare question with no options or recommendation attached.
- A completion claim with no ledger evidence cited, or evidence that is stale but not flagged as such.
- Justification prose following a Decided-since-last-update line instead of just the node id.
- The full three-section format produced for a one-line status question that didn't ask for it.
- A section header left in place with nothing under it, instead of being omitted or replaced with the one-line "queue is empty" statement.
