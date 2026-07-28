# Claude Skills

A small collection of Claude Code / Claude skills — reusable, self-contained
instruction sets that give Claude a disciplined method for a specific kind
of work. Each one is designed to be dropped into your own `.claude/skills/`
directory and used as-is; none of them depend on each other or on any
private setup.

Built and maintained by [Eric Wurth](https://www.ericwurth.com).

## What's here

| Skill | What it does |
|---|---|
| [`critical-thinking/`](critical-thinking/) | A backward-chaining reasoning method with disciplined assumption-handling — for any problem, plan, or recommendation, not just on explicit request. |
| [`storm-research/`](storm-research/) | Turns one topic into a verified, multi-perspective HTML research briefing: five expert lenses, a contradiction map, then mandatory adversarial fact-checking before delivery. |
| [`skill-evolution/`](skill-evolution/) | Evolves other skills on a disciplined schedule — finds a real technique gap, proves the gain with a constructed test, sandboxes it, and gates promotion behind explicit human approval. |
| [`memory-vault/`](memory-vault/) | A file-based, human-gated memory system for AI agents — a plugin of four skills (init, capture, conventions, review) rather than a single skill. |

## A shared pattern: genome vs. phenotype

Three of these skills (`critical-thinking`, `storm-research`, and the
skills `skill-evolution` targets) separate two files:

- **`SKILL.md`** — the phenotype. What the model actually reads and
  executes.
- **`genome/intent.md`** — the spec. Purpose, success criteria, behavioral
  invariants, the choices left free to vary, and golden test examples.
  Changed by hand only.

The idea: when a skill's packaging format changes, or the phenotype drifts
out of sync with its own intent, you regenerate `SKILL.md` from the genome
rather than patching a stale file and hoping it still matches what the
skill was supposed to do. `skill-evolution/` is built directly on this
split — it discovers which skills are eligible targets by checking for a
`genome/intent.md`, and treats anything marked `[INVARIANT]` in that file
as off-limits for autonomous change.

Not every skill needs this — it's most useful once a skill matters enough
that you want a record of *why* it works the way it does, separate from
the instructions themselves.

## Install

Each skill is a self-contained folder. Copy the one you want into your
`.claude/skills/` directory (project-level, or `~/.claude/skills/` for
global) and it's available immediately — no build step, no external
dependencies beyond what's noted in each skill's own README.

## License

MIT — see [LICENSE](LICENSE). Use, modify, and redistribute freely.

## More

Writing on AI agent design and applied engineering at
[www.ericwurth.com](https://www.ericwurth.com).
