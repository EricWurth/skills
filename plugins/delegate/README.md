# delegate

An agent that owns an assigned problem end-to-end and reports as a decision queue.

> **Not published.** This plugin depends on a memory graph that is not yet
> released, so it is absent from the marketplace and cannot be installed. It
> is complete and validated; it is waiting on its dependency. See
> [Requirements](#requirements).

Hand it work — "take this, you own it" — and it builds a model of the system
before committing to anything, charters the work, then executes inside that
charter without checking in on every fork.

## How it works

**It refuses to decompose on receipt.** The first move is a working model of
the system: entities, constraints, measurements, purpose. Commitment comes
only once the model is complete enough to run.

**A cast check is mandatory.** Before accepting the problem as framed, it
asks what entities the system contains that the assignment did not name. The
reasoning is the useful part: a handed frame inherits its author's blind
spots, and model-building on an incomplete cast feels identical from the
inside to model-building on a complete one. So the check is explicit rather
than felt.

**The charter defines an authority envelope** with four terms — scope,
timeline, cost, outcome. Every fork inside it is the agent's to decide and
log. A fork that would move any of the four comes to you as a change request
**with a recommendation**, never a bare question.

**Stuck-detection runs continuously**, on two triggers: actuals roughly an
order of magnitude past estimate (2x slip is normal), or the frontier
stopping — the same wall surviving a genuinely different approach. Three
attempts is the diagnostic, not the definition: three different failures at
different points is progress.

**Dissent is settled once.** State a position with reasoning; when you
decide, that decision is logged as an assumption the work rests on and the
objection persists as an opinion. Zero re-raises. If evidence later
contradicts the assumption, resurfacing is mandatory.

`delegate-status` reports in three sections — needs your call, approaching
your threshold, decided since — and an empty queue is a valid report.

## Requirements

**A memory graph — currently unavailable.** The agent recalls history before
proposing, persists dissent as opinions, and traverses the graph to find what
is downstream of a contradicted assumption: "by graph traversal, not
remembered grievance." Its own closing line is "you re-arrive at your problem
each session through the graph; it is your continuity."

That graph is muninn, which is not published. This is not a soft dependency
that degrades gracefully — without it the agent holds instructions with
nothing to read or write, and loses continuity between sessions entirely.
This plugin stays out of the marketplace until muninn ships.

**`rulegate`, for enforcement.** The agent's plans are compiled by
rulegate's front gate, bounded by its scope gate, and evidenced by its
ledger. Installed alone, delegate still follows the method, but nothing
binds it — the completion claims it is told the output gate will block go
unchecked.

## The agent is named Rick

It identifies as Rick, signs reports as Rick, and answers to "Rick, take
this." That is deliberate, not a leftover. If you would rather it did not,
edit `agents/delegate.md` — the name appears four times and nothing depends
on it.
