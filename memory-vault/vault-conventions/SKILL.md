---
name: vault-conventions
description: >
  Core rules and schema for working with the user's memory vault, a folder of
  markdown files (default ~/memory-vault) holding episodes, semantic facts,
  procedures, and intentions. Load this whenever reading from or writing to the
  vault, whenever the user says "the vault", "memory vault", "vault fact",
  "check the vault", or "what does the vault say", and before any other
  vault skill runs.
---

# Memory Vault Conventions

Follow these rules for every interaction with the memory vault. They are non-negotiable; when another instruction conflicts with them, surface the conflict to the user instead of picking silently.

## Locate the vault

Default location is `~/memory-vault`. If it is not there, check for a `VAULT.path` note in the working folder, then ask the user. Never guess a different location.

## Structure

```
memory-vault/
├── INDEX.md        # L0: always-loaded kernel. Hard cap 200 lines.
├── CATALOG.md      # L1: generated one-line-per-file digest of frontmatter.
├── episodes/       # L3: append-only session summaries and run records.
├── semantic/       # L2: one fact per file, frontmatter-tagged.
├── procedures/     # Skills and playbooks, source of truth.
├── intentions/     # Things to do later, with trigger conditions.
└── library/        # Curated reference artifacts: design docs, research, ADRs.
```

The library is reference, not memory: catalogued in CATALOG.md, never auto-loaded, outside the review pass's promotion machinery. Read a library document only when the user asks or when tracing a design decision.

Layered loading: read INDEX.md at session start. Answer lookups from CATALOG.md first. Open full semantic files only when the catalog hit needs detail. Read raw episodes only when tracing provenance or performing review.

## The seven rules

1. **Writes are deliberate.** Never promote anything into `semantic/` or `procedures/` outside an approved review. Capture into `episodes/` is always allowed.
2. **Reads are quiet.** No continuous lookups. INDEX at start, CATALOG on demand, full files only when needed.
3. **Nothing is deleted.** Supersede with a pointer (`supersedes:` on the new file, `status: superseded` and closed `valid_until` on the old). Never remove a file or erase content.
4. **Provenance on every fact.** Every semantic file links its source episode and declares `provenance: decision | suggestion | hypothesis`. Never record a suggestion as a decision.
5. **Budgets are hard.** INDEX.md stays under 200 lines. Each semantic file stays under 30 lines of body. If it does not fit, it was not index or atomic-fact material.
6. **Surfaces read, the reviewer writes.** Conversational sessions may append episodes and intentions. Only the vault-review process edits `semantic/`, `procedures/`, INDEX.md, or CATALOG.md.
7. **Human at every scope boundary.** Promotion, supersession, and new procedures require explicit user approval, item by item. Never batch-approve on the user's behalf.

## Semantic file schema

Read `references/schema.md` for the full field reference. The shape:

```markdown
---
status: active            # active | superseded | deprecated
type: preference          # preference | fact | reflection | constraint
scope: global             # global | <project-name>
tags: [writing, documents]
source: episodes/2026-03-02-doc-standards.md
provenance: decision      # decision | suggestion | hypothesis
valid_from: 2026-03-02    # when this became true in the world
valid_until: null         # when it stopped being true (null = still true)
last_reviewed: 2026-07-10 # system timeline, maintained by review
supersedes: null          # path of the file this replaces, if any
---
One fact, stated plainly, in as few lines as possible.
```

Bi-temporal rule: `valid_from`/`valid_until` track when the fact was true in the world. `last_reviewed` and file history track the system timeline. When a fact stops being true, close its validity window and mark it superseded; do not edit the statement itself.

## Query patterns

Compose retrieval with grep over frontmatter; never load the whole store into context.

- Active facts on a topic: `grep -l "status: active" semantic/ -r | xargs grep -l "tags:.*n8n"`
- Only real decisions: `grep -l "provenance: decision" semantic/ -r`
- What was true at a date: filter `valid_from <= date` and (`valid_until: null` or `valid_until >= date`)
- Start every lookup at CATALOG.md; fall back to grep when the catalog lacks the field.

## What never goes in the vault

Credentials, API keys, tokens, financial account numbers, or anything the user marks private. If a session summary would contain one, redact it and note the redaction.
