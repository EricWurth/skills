# Skills

Reusable skills and plugins for Claude — disciplined methods for reasoning,
research, writing, agent memory, delegation, rule enforcement, and job
search. Each one installs on its own.

Built and maintained by [Eric Wurth](https://www.ericwurth.com). MIT licensed.

## Install

Add the marketplace once:

```
/plugin marketplace add EricWurth/skills
```

Then install what you want:

```
/plugin install critical-thinking@ericwurth
/plugin install storm-research@ericwurth
```

<details>
<summary>Other ways to install</summary>

**Copy a single skill.** Every skill is a self-contained folder. Copy one
into `.claude/skills/` in your project, or `~/.claude/skills/` for all
projects, and it works immediately:

```
cp -r skills/critical-thinking ~/.claude/skills/
```

**Upload to claude.ai.** Build the archives, then upload the one you want
under Settings:

```
py -3 scripts/package.py
```

Artifacts land in `dist/`, one `.plugin` per plugin.

**Develop against a local checkout.** Point a marketplace at the directory
instead of GitHub, so edits take effect without publishing:

```
/plugin marketplace add ./path/to/skills
```

</details>

## What's here

<!-- catalog:start -->

5 standalone skills and 5 plugins (19 skills). Skills are copied; plugins are installed.

### Skills

Self-contained folders. Copy one into `.claude/skills/`, or upload it on claude.ai.

| Skill | What it does |
|---|---|
| [`critical-thinking`](skills/critical-thinking) | Rigorous problem-solving method for backward-chaining from a goal to a task breakdown, with disciplined assumption-handling and an optimist default |
| [`document-forge`](skills/document-forge) | Run a disciplined, staged production pipeline for a business document (memo, proposal, strategy doc, brief, report) that mirrors how coding agent… |
| [`framework-forge`](skills/framework-forge) | Use when someone has a framework thesis drawn from their own experience that they want researched, hardened, and built into a mature publishable document,… |
| [`problem-hunt`](skills/problem-hunt) | Hunt for a real, unsolved-in-practice problem in AI, then brainstorm a solution collaboratively with the user |
| [`storm-research`](skills/storm-research) | Use when someone asks to run Storm Research, use the storm-research skill, run the STORM method on a topic, says "storm research this" / "storm report on… |

### Plugins

Installed through the marketplace. Each carries more than instructions — extra skills, agents, hooks, or scripts.

| Plugin | Ver | What it does |
|---|---|---|
| [`skill-evolution`](plugins/skill-evolution) | 1.0.0 | Evolves your other skills on a schedule — finds a real technique gap, proves the gain, sandboxes it, and gates promotion on your sign-off |
| [`memory-vault`](plugins/memory-vault) | 0.2.2 | A file-based, human-gated memory system for AI agents: deliberate writes, gated promotion, quiet reads, cold-path maintenance |
| [`rulegate`](plugins/rulegate) | 0.3.2 | Makes project rules bind instead of decay — compiles requests into rule-compliant plans, gates execution scope, and keeps an evidence ledger |
| [`delegate`](plugins/delegate) | 0.1.2 | A senior-resource agent that owns problems end-to-end and reports in decision-queue format |
| [`resumebot`](plugins/resumebot) | 0.2.0 | A job-search operating system: master resume, targeting coach, Excel tracker, board scans, tailored packets, apply queue, email sync, and interview prep |

Plugins carrying more than one skill:

- **skill-evolution** — `skill-evolution`, `skill-evolution-sweep`
- **memory-vault** — `vault-capture`, `vault-conventions`, `vault-init`, `vault-review`
- **rulegate** — `rule-compiler`, `rulegate-setup`, `rules-audit`
- **resumebot** — `apply-tabs`, `build-packets`, `email-sync`, `interview-prep`, `job-profile`, `job-scan`, `master-resume`, `setup`, `tracker`

Skills that only run when you type them (`disable-model-invocation`):

- `skill-evolution-sweep` — Run the weekly skill-evolution sweep across every installed skill

<!-- catalog:end -->

## How a skill is put together

Each skill is a directory with a `SKILL.md`, whose frontmatter carries the
name and the description Claude matches against to decide when it applies.
Most also carry `genome/intent.md`, and some add `references/`, `scripts/`,
or `agents/`.

```
skills/critical-thinking/        a skill: instructions, nothing else
├── SKILL.md                     what the model reads and executes
├── genome/intent.md             purpose, invariants, golden examples
└── references/                  supporting material, loaded on demand

plugins/rulegate/                a plugin: carries more than instructions
├── .claude-plugin/plugin.json   name, version, and the skills array
├── skills/                      one or more skills
└── hooks/                       plus agents/, commands/, scripts/, templates/
```

A skill that is only instructions stays in `skills/`, where it can be
copied or uploaded directly. Wrapping it in a plugin would add a manifest
and two directory levels and buy nothing.

**Genome and phenotype.** `SKILL.md` is the phenotype — the instructions
that run. `genome/intent.md` is the spec: purpose, success criteria,
behavioural invariants, the choices deliberately left free, and test
examples. It is edited by hand only.

The point of the split is repair. When a packaging format changes, or a
skill drifts from what it was meant to do, you regenerate the phenotype from
the genome instead of patching a stale file and hoping it still matches the
intent. `skill-evolution` is built directly on this: it finds eligible
targets by looking for a genome, and treats anything marked `[INVARIANT]`
as off-limits to autonomous change.

Not every skill needs one. It earns its keep once a skill matters enough
that you want a record of *why* it works the way it does, kept separate from
the instructions themselves.

## Working on this repository

```
py -3 scripts/validate.py     structure, manifests, links
py -3 scripts/package.py      build dist/*.plugin  (validates first)
py -3 scripts/catalog.py      regenerate the catalogue above
```

Stdlib only — nothing to install. CI runs all three on every push.

A skill ships when a plugin's `skills` array names it, and only then. A
skill present in the tree but absent from the array is unreleased, which is
where work in progress lives. Nothing ships by existing.

[`CONTEXT.md`](CONTEXT.md) defines the terms used here — skill, plugin,
release, surface, ship — and is worth reading before making changes.

## License

MIT — see [LICENSE](LICENSE). Use, modify, and redistribute freely.
