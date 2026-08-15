---
name: vault-capture
description: >
  Write a session summary to the memory vault's episodes folder. Use at the
  end of any substantive work session, when the user says "capture this
  session", "write this to the vault", "log this session", "remember this
  for the vault", or before a long session ends or compacts.
spec: genome/intent.md
---

# Capture a Session Episode

Write one append-only episode file summarizing the current session. Load vault-conventions first; the episode template and rules live there.

## Steps

1. **Locate the vault** per conventions. If none exists, offer vault-init instead of inventing a location.

2. **Create one new file** at `episodes/YYYY-MM-DD-<kebab-topic>.md` using today's date and a topic slug from the session's main subject. If a file with that name exists, append `-2`, `-3`, etc. Never open or edit an existing episode.

3. **Fill the template exactly** (frontmatter: date, surface, project; body: Intent, Actions, Outcome, Candidates; nothing else):
   - `surface` is exactly one of: `chat | cowork | claude-code | <agent-name>`. One spelling, no variants.
   - `project` is a kebab-case topic or `none`.
   - No H1 title line, no sections beyond the four.
   - HARD CAP 40 lines total. Compress Actions hardest; it is a summary, not a log. Intent is 1-2 lines.
   - In Outcome, label "Decisions (user's):" and "Suggestions (Claude's):" separately. A decision is something the user stated as decided. Everything Claude proposed, however well received, is a suggestion.
   - In Candidates, list anything that smelled like a pattern: a correction the user made, a preference they voiced, a technique that worked. One line each. Do not promote them; that is review's job.
   - Redact credentials, keys, and anything the user marked private; note the redaction.

4. **Touch nothing else.** Do not update INDEX.md, CATALOG.md, or any semantic file. Do not editorialize about what review should decide.

5. **Confirm in one line:** the filename written and how many candidates it contains.

## Intentions

If the session produced a follow-up ("check X next week"), also append an entry to `intentions/QUEUE.md` per the schema: status pending, a concrete trigger date or event, and a context link to the episode just written. This is the one other write this skill is allowed.
