# Memory Vault

*An OpenIntellect pattern*

A file-based, human-gated memory system for AI agents. One folder of plain markdown with YAML frontmatter that any agent surface can read, maintained by a weekly review you approve rather than by unsupervised automation.

The principle: **deliberate writes, gated promotion, quiet reads, cold path only.** Agents append session summaries; only a human-approved review promotes facts, retires stale ones, and keeps the store honest. Nothing is deleted, everything carries provenance, and no memory operation runs per-message.

## What's in the plugin

| Skill | What it does |
|---|---|
| `vault-conventions` | The rules and schema every other skill obeys. Loads automatically whenever the vault is involved. |
| `vault-init` | Creates the vault skeleton and seeds it. Run once. |
| `vault-capture` | Writes an append-only session summary to `episodes/` at the end of a work session. |
| `vault-review` | The weekly engine: clusters patterns across episodes, proposes promotions with evidence, sweeps for stale facts, writes reflections, regenerates the catalog. You approve every change. |

## Setup

1. Install this plugin in Claude Code and/or Claude Cowork.
2. Say "set up my memory vault." The init skill builds the folder (default `~/memory-vault`) and hands you two configuration lines:
   - **Cowork** → Settings → Personal Preferences: the bootstrap line that makes every session read the vault's INDEX at start and write an episode at end.
   - **Claude Code** → `~/.claude/CLAUDE.md`: an `@~/memory-vault/INDEX.md` import plus the session-end capture rule.
3. Work normally. Episodes accumulate.
4. Once a week, say "run the vault review." Approve or reject what it proposes.

## Multi-device and hosted access (optional)

The vault is plain files, so any sync tool works. Recommended: Syncthing with an always-on hub (NAS, mini PC, or small VPS) that also runs backups. To give web chat and mobile a window and a door, run an MCP filesystem server on the hub, or a self-hosted markdown knowledge base that ships one (e.g. NoteDiscovery: web UI, mobile PWA, built-in MCP, plain files underneath). Before exposing either off-LAN, verify write scoping (episodes/ and intentions/ writable; semantic/ and procedures/ read-only at the permission level) and auth on the endpoint. Any such tool is trim, not plumbing: if it dies, the files don't notice.

The vault also includes a `library/` folder for curated reference artifacts (design docs, research briefings): catalogued, never auto-loaded, outside the promotion machinery.

## The one warning that matters

Every documented failure of file-based agent memory is a failure of files without a curator. If the weekly review stops happening, this vault degrades into the same stale-note graveyard as every unsupervised memory tool. The review is not maintenance on the system. It is the system.

## Design lineage & provenance

Memory Vault is part of the OpenIntellect R&D portfolio.

Supersede-not-delete follows Zep/Graphiti's temporal invalidation and matches AWS AgentCore and Claude Code's Auto Dream. The reader/writer split follows Letta's sleep-time agent architecture. Reflections follow Stanford's Generative Agents. Layered loading follows MemPalace and MemGPT's block budgets. The human approval gate is the part most tools skip, and the part the failure reports keep proving necessary.
