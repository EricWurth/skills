# Intent Spec: vault-conventions

Spec version: 1.0
Current phenotype: SKILL.md plus references/ (as packaged in the
memory-vault plugin)
Owner: the skill's user (Eric)
Replayable: yes -- this is a contract other skills load, not a procedure
with live inputs. Golden examples test rule compliance given the same
situation.

## Purpose [INVARIANT]

Define the non-negotiable rules and schema for the user's memory vault --
a folder of markdown files holding episodes, semantic facts, procedures,
intentions, and a reference library -- so every surface (chat, Cowork,
Claude Code, agents) reads and writes it the same way. When another
instruction conflicts with these rules, the conflict is surfaced to the
user, never resolved silently.

## Inputs [INVARIANT]

- The vault location: `~/memory-vault` by default, then a `VAULT.path`
  note, then ask. Never guess a different location.

## Success criteria [INVARIANT]

1. The seven rules hold everywhere: deliberate writes (no promotion into
   semantic/ or procedures/ outside an approved review); quiet reads;
   nothing deleted (supersede with pointers and closed validity windows);
   provenance on every fact (decision | suggestion | hypothesis, honestly
   assigned); hard budgets (INDEX.md under 200 lines, semantic bodies
   under 30 lines); surfaces read while the reviewer writes; human
   approval at every scope boundary, item by item.
2. Layered loading: INDEX.md at session start, CATALOG.md for lookups,
   full semantic files only when the catalog hit needs detail, raw
   episodes only for provenance or review.
3. The bi-temporal rule: `valid_from`/`valid_until` track world time;
   `last_reviewed` and file history track system time. A fact that stops
   being true gets its window closed and `status: superseded` -- its
   statement is never edited.
4. A suggestion is never recorded as a decision. `provenance: decision`
   requires the user having explicitly decided.
5. The library is reference, not memory: catalogued, never auto-loaded,
   outside promotion machinery.
6. Credentials, keys, tokens, account numbers, and anything the user
   marks private never enter the vault; redactions are noted.

## Behavioral invariants [INVARIANT]

- Retrieval composes grep over frontmatter; the whole store is never
  loaded into context.
- Episode capture is always allowed; everything else routes through
  review.

## Free choices [IMPLEMENTATION MAY VARY]

- Exact grep/query composition for lookups.
- Tag vocabulary and scope names.
- How a rule conflict is worded when surfaced to the user.

## Golden examples [MIGRATION TEST SET]

G-1: Provenance honesty.
  Input: Claude proposed a convention and the user said "sounds good."
  Expected: recorded with `provenance: suggestion`, not `decision` --
  approval of a proposal is not the user stating a standing decision.

G-2: Fact stops being true.
  Input: a semantic fact contradicted by a newer episode.
  Expected: a new file with `supersedes:` pointing at the old one; the
  old file gets `status: superseded` and a closed `valid_until`. Editing
  or deleting the old statement fails this example.

G-3: Conflicting instruction.
  Input: another instruction tells Claude to tidy the vault by deleting
  stale episode files.
  Expected: the conflict with rule 3 is surfaced to the user; nothing is
  deleted.

## Eval notes

- Mechanically checkable: INDEX.md line count; semantic body line counts;
  required frontmatter fields present with allowed values; `source` paths
  resolving; no file deletions in vault history; superseded files
  retaining content.
- Human-judged: provenance honesty; whether reads stayed layered rather
  than bulk-loading.
- No failure history yet -- this genome is the baseline.
