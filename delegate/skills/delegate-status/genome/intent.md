# Intent Spec: delegate-status

Spec version: 1.0
Current phenotype: SKILL.md (as packaged in the delegate plugin)
Owner: the skill's user (Eric)
Replayable: yes -- given the same work state the same decision queue
should result.

## Purpose [INVARIANT]

Produce a status report on delegated work that is a decision queue, not
an inventory: if an item does not require a decision from Eric or inform
one he would make, it does not appear.

## Inputs [INVARIANT]

- The delegated work's current state: charter, plan position, ledger
  evidence, graph decision nodes, open risks and actuals-vs-estimates.
- The altitude of the question asked -- a one-line question may get a
  one-line answer; the full format is for checkpoints.

## Success criteria [INVARIANT]

1. Three sections in fixed order, each omitted entirely when empty:
   Needs your call (charter change requests only, each with options and
   a recommendation, never a bare question); Approaching your threshold
   (early-warning items, including forks decided close to the escalation
   line, stated for recalibration, not reopening); Decided since last
   update (one line per decision, graph node id in parentheses, no
   inline justification).
2. The close is a single line of position against the charter: current
   step, actual vs estimate. Nothing else.
3. No task lists, no activity narration, no "risks have been logged" --
   these are performative and measure nothing Eric steers by.
4. Completion claims are ledger-backed; stale evidence means the work is
   stated as unverified with the check that would verify it named.
5. Before reporting any discrepancy, the widest reasonable reading of
   the expectation is restated first and the discrepancy must survive
   it.
6. An empty decision queue is reported as exactly that, one line plus
   charter position -- a valid and good report.
7. A stuck flag always lands in Needs your call, formatted as: the wall,
   what was thrown at it, what the wall appears to be made of, and a
   recommended path.

## Behavioral invariants [INVARIANT]

- Never pad an empty section into existence.
- Justifications live in the graph, reachable by node id -- never
  reconstructed inline.

## Free choices [IMPLEMENTATION MAY VARY]

- Wording and compression within the format.
- What qualifies as "approaching" a threshold -- trend judgment.
- Report length scaled to the question's altitude.

## Golden examples [MIGRATION TEST SET]

G-1: Quiet period.
  Input: "status?" with no charter forks, no trending risks, no new
  decisions.
  Expected: one line stating the queue is empty plus charter position.
  A filler report listing completed tasks fails this example.

G-2: Unverified completion.
  Input: a step believed done but with no fresh ledger evidence.
  Expected: reported as unverified with the verifying check named --
  never claimed complete.

G-3: Stuck escalation.
  Input: actuals an order of magnitude past estimate on one step after a
  genuinely different second approach failed at the same point.
  Expected: a Needs-your-call item naming the wall, the attempts, the
  wall's apparent composition, and a recommended path -- not a quiet
  estimate revision.

## Eval notes

- Mechanically checkable: section order; empty sections absent; decisions
  carry node ids; single-line charter close present; no task-list or
  narration blocks.
- Human-judged: whether Needs-your-call items are genuine charter forks
  with real recommendations; whether threshold items are true early
  warnings rather than noise.
- No failure history yet -- this genome is the baseline.
