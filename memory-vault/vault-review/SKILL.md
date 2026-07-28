---
name: vault-review
description: >
  Run the weekly memory vault review: cluster patterns across episodes and
  local agent memories, propose promotions with evidence, sweep for stale
  facts, write reflections, and regenerate the catalog. Use when the user
  says "run the vault review", "weekly review", "review my vault",
  "consolidate memory", or "what should be promoted".
---

# Vault Review and Promote

This is the vault's engine: the only process permitted to write to `semantic/`, `procedures/`, INDEX.md, and CATALOG.md. Load vault-conventions first and hold every one of its rules. Every change below is proposed first and applied only after the user approves it, item by item.

## Phase 1: Gather

1. Read all episodes since the last review (find the boundary via the newest `last_reviewed` in semantic files, or ask).
2. Read every episode's Candidates section first; then skim Outcomes.
3. If Claude Code auto-memory exists (`~/.claude/projects/*/memory/`), read each project's MEMORY.md as an additional capture source. Treat its contents as unverified: it is machine-written and may contain stale or misattributed entries.
4. Read `intentions/QUEUE.md` and note anything fired, done, or expired.

## Phase 2: Cluster and propose promotions

1. Group candidate items that recur. The evidence bar: appearing in 2 or more distinct contexts (different episodes, different projects, or episode plus auto-memory). One occurrence is an anecdote; note it and move on.
2. For each cluster, draft a proposal:
   - The fact or technique, stated in one line
   - Routing: preference or fact goes to `semantic/` (scope: global or project); reusable technique goes to `procedures/`; one-off detail stays where it is
   - Provenance, honestly assigned: only `decision` if the user explicitly decided; agent proposals the user liked are `suggestion`
   - Evidence: the episode paths and quotes that support it
3. Present all proposals in one list. Ask the user to approve, edit, or reject each. Do not apply anything yet.

## Phase 3: Staleness sweep

1. List semantic files with `last_reviewed` older than 4 weeks, and any file contradicted by newer episodes.
2. For each, propose: confirm (touch `last_reviewed`), or supersede (new file with `supersedes` pointer; old file gets `status: superseded` and a closed `valid_until`). Never propose deletion.
3. Present alongside the promotions for the same item-by-item approval.

## Phase 4: Reflections

1. Look across episodes for patterns no single session contains: recurring ways of working, repeated friction, trajectories.
2. Draft at most 2 or 3 reflections per review, each as a semantic file with `type: reflection`, `provenance: hypothesis`, and multi-episode sources.
3. Include them in the approval list. Reflections that keep accumulating evidence across reviews may be proposed for provenance upgrade later; cite the new evidence when proposing it.

## Phase 5: Apply and maintain

Only after explicit approvals:

1. Write approved semantic and procedure files exactly per schema; close validity windows on superseded files.
2. Update INDEX.md: add newly load-bearing facts, remove superseded ones, enforce the 200-line cap by cutting the least load-bearing content.
3. Regenerate CATALOG.md completely from the current semantic folder (see conventions for the line format).
4. Validate frontmatter across `semantic/`: every required field present, values from the allowed sets, every `source` path resolving. Report and fix anomalies (fixes to metadata only, never to fact statements without approval).
5. Check for sync-conflict files (names containing `sync-conflict`); if found, show both versions and ask the user which survives.
6. Update `intentions/QUEUE.md` statuses.
7. Write a review episode to `episodes/` summarizing: items proposed, approved, rejected; facts confirmed or superseded; reflections added.

## Phase 6: Report

Close with a short scorecard: episodes read, proposals made and approved, facts superseded, current counts (semantic files, active vs superseded), INDEX line count, and the next review's suggested date. If the review found the Candidates sections consistently empty, say so; capture may be failing upstream.

## Read reference

`references/review-checklist.md` holds the condensed checklist for repeat runs.
