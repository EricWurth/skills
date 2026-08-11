# Intent Spec: vault-init

Spec version: 1.0
Current phenotype: SKILL.md (as packaged in the memory-vault plugin)
Owner: the skill's user (Eric)
Replayable: mostly -- the skeleton is deterministic; the seeded facts come
from the conversation, so golden examples test structure, gating, and
seeding discipline.

## Purpose [INVARIANT]

Create a new memory vault -- folder skeleton, INDEX.md, CATALOG.md,
templates, intentions queue, chat-capture playbook, and a first episode --
seeded from the conversation so the first real session can use it
immediately, and hand the user the exact setup lines each surface needs.

## Inputs [INVARIANT]

- A confirmed location (propose `~/memory-vault`; honor the user's path;
  never scatter vault folders inside project repos; in Cowork the vault
  must be a connected folder matching the absolute path other surfaces
  reference).
- 3-5 day-one facts elicited from the user.
- vault-conventions loaded first; everything created must conform to it.

## Success criteria [INVARIANT]

1. Double-init is refused: if the target already contains INDEX.md, stop,
   say a vault exists, offer to inspect it instead.
2. The full structure is created: INDEX.md, CATALOG.md, episodes/,
   semantic/, procedures/, intentions/QUEUE.md, library/, and both
   templates copied verbatim from the conventions schema reference.
3. INDEX.md at init: three-line orientation, the seven rules by name, the
   load order, empty "Load-bearing facts" and "Recent episodes" sections,
   under 60 lines.
4. Seeded facts follow the schema with provenance honestly assigned --
   `decision` only when the user states it as their standing decision,
   otherwise `suggestion` -- and each lands in CATALOG.md (and INDEX.md
   only if genuinely load-bearing).
5. The init session itself is documented as the first episode, using the
   episode template.
6. `procedures/chat-capture-playbook.md` is written at init (the one time
   a procedures/ write is permitted outside review) with the standing
   chat-capture rules, including the NEVER list.
7. The user receives their setup lines verbatim, told where each goes
   (Cowork preferences; Claude Code CLAUDE.md import), and the weekly
   review cadence is stated plainly once, without lecturing.

## Behavioral invariants [INVARIANT]

- After init, procedures/ belongs to the review -- this skill never
  becomes a general procedures writer.
- No invented vault locations, ever.

## Free choices [IMPLEMENTATION MAY VARY]

- Wording of the orientation lines and the cadence close.
- How the 3-5 seed facts are elicited.
- Which seeded facts qualify as load-bearing enough for INDEX.md.

## Golden examples [MIGRATION TEST SET]

G-1: Existing vault at target.
  Input: the target folder already has an INDEX.md.
  Expected: stop and offer inspection. Overwriting or "refreshing" the
  existing vault fails this example.

G-2: Seeding provenance.
  Input: during seeding the user says "I decided long ago: no meetings
  before 10" and Claude suggests "should we record that you prefer
  Python?" with the user replying "sure."
  Expected: the first seeds as `provenance: decision`, the second as
  `provenance: suggestion`.

G-3: Init in Cowork with an unconnected path.
  Input: Cowork session, vault path not yet a connected folder.
  Expected: ask the user to connect `~/memory-vault` via "Connect a
  folder" rather than initializing inside the session's working folder.

## Eval notes

- Mechanically checkable: full structure present after init; INDEX.md
  under 60 lines; templates byte-identical to the schema reference; first
  episode exists and follows the template; QUEUE.md created.
- Human-judged: provenance honesty at seeding; whether the setup lines
  handed over match the surfaces the user actually uses.
- No failure history yet -- this genome is the baseline.
