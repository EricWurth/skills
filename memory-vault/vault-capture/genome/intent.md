# Intent Spec: vault-capture

Spec version: 1.0
Current phenotype: SKILL.md (as packaged in the memory-vault plugin)
Owner: the skill's user (Eric)
Replayable: partially -- content depends on the live session, but given
the same session the same episode shape should result, so golden examples
test file discipline and template compliance.

## Purpose [INVARIANT]

Write exactly one append-only episode file summarizing the current session
into the vault's episodes/ folder -- template-exact, hard-capped, with
decisions and suggestions honestly separated and promotion candidates
listed but never promoted.

## Inputs [INVARIANT]

- The current session; vault-conventions loaded first.
- A locatable vault. If none exists, offer vault-init -- never invent a
  location.

## Success criteria [INVARIANT]

1. One new file at `episodes/YYYY-MM-DD-<kebab-topic>.md`; name
   collisions get `-2`, `-3`. An existing episode is never opened or
   edited.
2. The template is filled exactly: frontmatter date/surface/project
   (surface from the exact enum `chat | cowork | claude-code |
   <agent-name>`; project kebab-case or `none`); body sections Intent,
   Actions, Outcome, Candidates and nothing else; no H1; hard cap 40
   lines total.
3. Outcome separates "Decisions (user's):" from "Suggestions
   (Claude's):" -- a decision is something the user stated as decided;
   everything Claude proposed, however well received, is a suggestion.
4. Candidates lists pattern-smelling items one line each, unpromoted.
   Promotion is review's job, and this skill does not editorialize about
   what review should decide.
5. Nothing else is touched: no INDEX.md, no CATALOG.md, no semantic
   files. The one permitted extra write is an intentions/QUEUE.md entry
   (status pending, concrete trigger, context link) when the session
   produced a follow-up.
6. Credentials and private material are redacted, with the redaction
   noted.
7. Confirmation is one line: the filename and the candidate count.

## Behavioral invariants [INVARIANT]

- Compress Actions hardest -- it is a summary, not a log.
- Never promote from within capture, no matter how obvious the pattern
  looks.

## Free choices [IMPLEMENTATION MAY VARY]

- The topic slug wording.
- What makes the cut within the 40 lines -- selection judgment is the
  skill.
- Whether a given observation rises to a Candidates line.

## Golden examples [MIGRATION TEST SET]

G-1: Filename collision.
  Input: a second capture on the same date and topic.
  Expected: a new `-2` file. Appending to or rewriting the existing
  episode fails this example.

G-2: Decision vs suggestion labeling.
  Input: a session where Claude proposed an architecture and the user
  enthusiastically agreed, and the user separately declared a deploy
  policy.
  Expected: the architecture under Suggestions (Claude's), the policy
  under Decisions (user's).

G-3: Over-length session.
  Input: a long session with many actions.
  Expected: the episode still lands at or under 40 lines, with Actions
  compressed -- not a 60-line "thorough" version.

## Eval notes

- Mechanically checkable: file is new; line count <= 40; no H1; exactly
  the four sections; surface value in the enum; no diffs to INDEX.md /
  CATALOG.md / semantic/ / procedures/ in the same operation.
- Human-judged: decision/suggestion honesty; whether Candidates are real
  pattern smells vs filler.
- No failure history yet -- this genome is the baseline.
