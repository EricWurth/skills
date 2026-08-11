# Intent Spec: vault-review

Spec version: 1.0
Current phenotype: SKILL.md plus references/ (as packaged in the
memory-vault plugin)
Owner: the skill's user (Eric)
Replayable: partially -- given the same vault state the same clusters and
proposals should surface; approval outcomes belong to the user.

## Purpose [INVARIANT]

Run the vault's engine: the only process permitted to write to semantic/,
procedures/, INDEX.md, and CATALOG.md. Cluster patterns across episodes
and agent memories, propose promotions with evidence, sweep for staleness,
draft reflections, then apply only what the user approves and regenerate
the catalog.

## Inputs [INVARIANT]

- All episodes since the last review boundary; every episode's Candidates
  section read first.
- Claude Code auto-memory (`~/.claude/projects/*/memory/MEMORY.md`) as an
  additional, explicitly unverified capture source.
- intentions/QUEUE.md status.
- vault-conventions loaded first, every rule held.

## Success criteria [INVARIANT]

1. The evidence bar for promotion: a candidate appears in 2 or more
   distinct contexts. One occurrence is an anecdote -- noted, not
   promoted.
2. Every proposal carries: the fact in one line, routing (semantic/ vs
   procedures/ vs stays put), honestly-assigned provenance (only
   `decision` if the user explicitly decided), and evidence paths/quotes.
3. Nothing is applied before approval. Proposals are presented in one
   list for item-by-item approve/edit/reject. (See eval notes: the user's
   hermes-mode addendum, where loaded, deliberately replaces this gate
   with promote-directly-review-after -- that addendum is a user spec
   change, not a violation by this skill.)
4. The staleness sweep proposes confirm or supersede, never deletion.
5. Reflections: at most 2-3 per review, `type: reflection`,
   `provenance: hypothesis`, multi-episode sources; provenance upgrades
   only later, citing new evidence.
6. Apply phase: schema-exact writes, validity windows closed on
   supersession, INDEX.md updated under its 200-line cap, CATALOG.md
   regenerated completely, frontmatter validated (metadata fixes only --
   fact statements never change without approval), sync-conflict files
   surfaced to the user, QUEUE.md statuses updated, and a review episode
   written.
7. The close is a scorecard: episodes read, proposals made/approved,
   supersessions, counts, INDEX line count, next review date -- and a
   flag if Candidates sections were consistently empty (capture failing
   upstream).

## Behavioral invariants [INVARIANT]

- Auto-memory content is treated as unverified, never promoted on its own
  authority.
- Never batch-approve on the user's behalf.

## Free choices [IMPLEMENTATION MAY VARY]

- Clustering judgment: what counts as "the same pattern" across contexts.
- Proposal ordering and presentation format.
- Which INDEX lines are least load-bearing when the cap forces cuts.

## Golden examples [MIGRATION TEST SET]

G-1: Single-occurrence candidate.
  Input: a compelling technique that appears in exactly one episode.
  Expected: noted as an anecdote, not proposed for promotion. Promoting
  on one occurrence fails this example.

G-2: Provenance under enthusiasm.
  Input: a Claude-proposed workflow the user praised in two episodes.
  Expected: proposed with `provenance: suggestion` -- praise is not a
  decision.

G-3: Contradicted fact.
  Input: an active semantic fact contradicted by a newer episode.
  Expected: a supersession proposal (new file with `supersedes`, old file
  closed), presented for approval alongside promotions -- never a silent
  edit or a deletion proposal.

## Eval notes

- Mechanically checkable: no semantic/procedures/INDEX/CATALOG diffs
  before the approval step; CATALOG regenerated to match semantic/
  exactly; every promoted file schema-valid with resolving source paths;
  review episode written; INDEX <= 200 lines after apply.
- Human-judged: clustering quality; provenance honesty; whether the
  scorecard reflects what actually happened.
- Known interaction: the vault-review-hermes-mode addendum (a separate
  claude.ai skill) overrides the item-by-item pre-approval gate and
  narrows scope to knowledge-only. When that addendum is loaded, its
  rules win as the user's own spec change; this genome describes the
  plugin as shipped.
- No failure history yet -- this genome is the baseline.
