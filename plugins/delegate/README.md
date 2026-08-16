# delegate

An agent that owns an assigned problem end-to-end and reports as a decision queue.

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

**A graph-shaped memory, for continuity — optional, and nothing here ships
one.** Two of the agent's behaviours need it. It resurfaces a contradicted
assumption by naming "what is downstream of it, by graph traversal, not
remembered grievance," and `delegate-status` cites a node id per decision "so
'walk me through why' is a traversal, not a reconstruction." Both want
addressable nodes and edges.

That rules out a file-based store as a substitute: markdown with frontmatter
has no node ids and nothing to traverse. Any MCP-backed graph memory will do —
the agent never names a particular one.

**Without a graph it still works, and loses two specific things:** continuity
across sessions, since it re-arrives at a problem by reading its own history;
and evidence-gated dissent, since an objection that cannot be stored cannot
resurface when evidence later contradicts the decision. Everything else — the
cast check, the charter and its four terms, stuck-detection, escalation with
a recommendation, decision-queue reporting — is self-contained. Run it inside
one session and you would not notice the difference.

**A harness that dispatches subagents, for the agent itself.** `delegate` is
an agent definition, and outside a coding harness there is nothing to
dispatch it as one. The method still runs — you can hand it work and it
will charter, execute, and report — but it runs in the main conversation
rather than in its own context, so it does not keep your context clean.
`delegate-status` is an ordinary skill and works anywhere.

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
