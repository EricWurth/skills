---
name: vault-init
description: Create a new memory vault.
spec: genome/intent.md
disable-model-invocation: true
---

# Initialize a Memory Vault

Create the vault skeleton and seed it so the first real session can use it immediately. Load the vault-conventions skill first; everything here must conform to it.

## Steps

1. **Confirm location.** Propose `~/memory-vault`. If the user wants it elsewhere, use their path and note it. Never scatter vault folders inside project repos. **In Cowork:** the vault must be a connected folder; ask the user to connect `~/memory-vault` (creating it if needed) via "Connect a folder," not the session's working folder, so the path matches other surfaces' configs (the Claude Code import references the same absolute path).

2. **Refuse to double-init.** If the target already contains INDEX.md, stop and tell the user a vault exists there; offer to inspect it instead.

3. **Create the structure:**
   ```
   <vault>/INDEX.md
   <vault>/CATALOG.md
   <vault>/episodes/
   <vault>/semantic/
   <vault>/procedures/
   <vault>/intentions/QUEUE.md
   <vault>/library/
   <vault>/templates/episode.md
   <vault>/templates/fact.md
   ```
   Copy the episode and fact templates verbatim from the vault-conventions schema reference.

4. **Write INDEX.md** with: a three-line orientation, the seven rules listed by name only, the load order (INDEX at start, CATALOG for lookups, files on demand, episodes for provenance), and empty sections titled "Load-bearing facts" and "Recent episodes." Keep the whole file under 60 lines at init.

5. **Write CATALOG.md** with only its header comment and column legend.

6. **Seed from the conversation.** Ask the user for 3 to 5 facts worth recording on day one (stable preferences, key constraints). For each, create a semantic file per the schema with `provenance: decision` only if they state it as their standing decision, otherwise `suggestion`. Add each to CATALOG.md and, if genuinely load-bearing, to INDEX.md.

7. **Write the first episode** documenting this init session, using the episode template, with this setup listed under Outcome.

8. **Write `procedures/chat-capture-playbook.md`**: the standing prompt the user pastes into claude.ai project instructions so chat sessions capture episodes too. Include: vault-wins-over-chat-memory, quiet reads (INDEX at start via connector if available, no per-message lookups), the exact episode template and rules from the vault-capture skill (exact surface enum, 40-line hard cap, no H1, decisions vs suggestions labeled, Candidates unpromoted), the intentions/QUEUE.md write, and the NEVER list (no semantic/ or procedures/ writes, no credentials). Writing this file at init is permitted; after init, procedures/ belongs to the review.

9. **Hand the user their setup lines**, verbatim, and tell them where each goes:
   - Cowork, Settings then Personal Preferences: "When working in or near <vault path>, or when I reference 'the vault': at session start, read INDEX.md before anything else. At session end, append a session summary to episodes/ (one new file, never edit existing ones). Never modify files in semantic/ or procedures/."
   - Claude Code, `~/.claude/CLAUDE.md`: an `@<vault path>/INDEX.md` import line, plus the session-end capture rule from the vault-capture skill.

10. **Close with the cadence:** episodes happen every session automatically; the user should run vault-review weekly, and the vault degrades into clutter if the review stops. Say this plainly once, without lecturing.
