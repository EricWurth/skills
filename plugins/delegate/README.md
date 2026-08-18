# delegate

An agent that owns an assigned problem end-to-end and reports as a decision queue.

Hand it work ("take this, you own it") and it builds a model of the system
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

**The charter defines an authority envelope** with four terms: scope,
timeline, cost, outcome. Every fork inside it is the agent's to decide and
log. A fork that would move any of the four comes to you as a change request
**with a recommendation**, never a bare question.

**Stuck-detection runs continuously**, on two triggers: actuals roughly an
order of magnitude past estimate (2x slip is normal), or the frontier
stopping, meaning the same wall survives a genuinely different approach.
Three attempts is the diagnostic, not the definition: three different
failures at different points is progress.

**Dissent is settled once.** State a position with reasoning; when you
decide, that decision is logged as an assumption the work rests on and the
objection persists as an opinion. Zero re-raises. If evidence later
contradicts the assumption, resurfacing is mandatory.

`delegate-status` reports in three sections (needs your call, approaching
your threshold, decided since), and an empty queue is a valid report.

## Requirements

None. The method is self-contained: hand it an assignment and it will build
a model, run the cast check, charter the work, execute inside the envelope,
detect stuck, and report as a decision queue, with nothing else installed.

## What extends it

Two things make it better, and neither is needed to run it.

**`rulegate` makes its claims checkable.** Delegate already promises that
completion claims are backed by evidence and that steps stay in scope.
Rulegate is what turns those promises into something external: the scope
gate blocks an out-of-scope write, the ledger records what actually ran,
the output gate blocks a completion claim the ledger does not support.
Without it the promises still hold as instructions, and nothing verifies
them. That matters because a run where the agent overclaimed and a run
where it did not look identical from outside, and that is the specific
failure rulegate was built for.

The pairing runs both ways: rulegate's plan steps carry a mandatory
`estimate:` line specifically so stuck-detection has a baseline to measure
actuals against.

**A graph-shaped memory gives it continuity.** Two behaviours use one:
resurfacing a contradicted assumption by naming "what is downstream of it,
by graph traversal", and `delegate-status` citing a node id per decision so
"walk me through why" is a traversal rather than a reconstruction. Both
want addressable nodes and edges, which rules out a file-based store:
markdown with frontmatter has nothing to traverse. Any MCP-backed graph
memory does; the agent never names a particular one.

Without one it loses continuity across sessions and evidence-gated dissent,
since an objection that cannot be stored cannot resurface when evidence
later contradicts the decision. Inside a single session the difference does
not show.

**Outside a coding harness** there is nothing to dispatch the agent as a
subagent, so the method runs in the main conversation rather than its own
context. It works; it just does not keep your context clean.
`delegate-status` is an ordinary skill and works anywhere.

## The agent is named Rick

It identifies as Rick, signs reports as Rick, and answers to "Rick, take
this." That is deliberate, not a leftover. If you would rather it did not,
edit `agents/delegate.md`. The name appears ten times there, spread across
the frontmatter description, its examples, and the opening paragraph, and
nothing outside that file depends on it.
