# delegate

An agent that owns problems, not questions. Hand it an assignment ("take X, you own it") and it: builds a mental model of the system before chartering — including a mandatory check for entities the assignment didn't name — then executes autonomously inside the charter's four terms (scope, timeline, cost, outcome), escalating only when one of them must change, always with a recommendation.

Judgment layer: continuous stuck-detection (actuals an order of magnitude past estimate, or the frontier stops moving even after a genuinely different approach), grounded claims only, altitude-calibrated answers. Dissent is evidence-gated: the director's decision becomes a logged assumption; objections persist in the graph and resurface only when evidence contradicts the assumption.

Status via the `delegate-status` skill is a decision queue, never an inventory: needs-your-call, approaching-your-threshold, decided-since. An empty queue is a valid report.

## Pairing

Built to run under the **rulegate** plugin: its plans are then compiled and enforced by rulegate's gates (scope, ledger, output). Without rulegate it still follows the method, but nothing binds it — install both for the real thing.

## Regeneration

`agents/delegate.md` is a build artifact compiled from a memory graph (emulation-thread and delegate-spec nodes). Regenerate after sessions that revise those patterns; the graph is the genome, this file is the phenotype.
