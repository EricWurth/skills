# Skills

Disciplined methods for Claude — reasoning, research, writing, agent memory,
delegation, rule enforcement, and job search.

Two kinds of thing live here, and they are used differently. A **skill** is
instructions: a folder you copy or upload. A **plugin** is an installable
package that carries skills plus whatever else they need — agents, hooks,
scripts, templates — and it installs through the marketplace.

Built and maintained by [Eric Wurth](https://www.ericwurth.com). MIT licensed.

## Install a plugin

Add the marketplace once, then install the plugins you want:

```
/plugin marketplace add EricWurth/skills
/plugin install rulegate@ericwurth
/plugin install memory-vault@ericwurth
```

## Use a skill

Skills are not installed. Copy the folder into `.claude/skills/` in a
project, or `~/.claude/skills/` for every project, and it is available
immediately:

```
cp -r skills/critical-thinking ~/.claude/skills/
```

To use one on claude.ai instead, zip that same folder and upload it under
Settings. Nothing needs building.

<details>
<summary>Developing against a local checkout</summary>

Point a marketplace at the directory rather than GitHub, so plugin edits
take effect without publishing:

```
/plugin marketplace add ./path/to/skills
```

Skills need no equivalent — copy them, or symlink the folder if you want
edits to apply live.

</details>

## What's here

<!-- catalog:start -->

5 standalone skills and 5 plugins (19 skills). Skills are copied; plugins are installed.

They split on one axis: who can invoke them. **User-invoked** skills are reachable only when you type them — they orchestrate. **Model-invoked** skills can be typed *or* reached for automatically when the task fits — they hold the reusable discipline. A user-invoked skill may call a model-invoked one, never another user-invoked one.

*Chat* marks what works outside a coding harness. Skills get a filesystem and bash everywhere, so bundled scripts are fine; hooks, slash commands, MCP servers, and bundled subagents are not. Derived from contents, not declared. On claude.ai network access varies by account, so anything doing live web research may not work for every reader.

### Skills

Self-contained folders. Copy one into `.claude/skills/`, or upload it on claude.ai.

**User-invoked**

| | Chat | What it does |
|---|:--:|---|
| [`/document-forge`](skills/document-forge) | — | A staged production pipeline for business documents — isolated scoping and explicit acceptance criteria per stage, not one-shot drafting |
| [`/framework-forge`](skills/framework-forge) | — | Hardens a framework thesis into a publishable document |
| [`/problem-hunt`](skills/problem-hunt) | ✅ | Hunt for a real, unsolved-in-practice problem in AI, then co-brainstorm a solution |
| [`/storm-research`](skills/storm-research) | — | Turns one topic into a verified multi-perspective research briefing — five expert lenses, a contradiction map, then adversarial fact-checking |

**Model-invoked**

| | Chat | What it does |
|---|:--:|---|
| [`critical-thinking`](skills/critical-thinking) | ✅ | Rigorous problem-solving method for backward-chaining from a goal to a task breakdown, with disciplined assumption-handling and an optimist default |

### Plugins

Installed through the marketplace. Each carries more than instructions — extra skills, agents, hooks, or scripts.

| Plugin | Chat | What it does |
|---|:--:|---|
| [`skill-evolution`](plugins/skill-evolution) | ✅ | Evolves your other skills on a schedule — finds a real technique gap, proves the gain, sandboxes it, and gates promotion on your sign-off |
| [`memory-vault`](plugins/memory-vault) | ✅ | A file-based, human-gated memory system for AI agents: deliberate writes, gated promotion, quiet reads, cold-path maintenance |
| [`rulegate`](plugins/rulegate) | — | Makes project rules bind instead of decay — compiles requests into rule-compliant plans, gates execution scope, and keeps an evidence ledger |
| [`delegate`](plugins/delegate) | — | A senior-resource agent that owns problems end-to-end and reports in decision-queue format |
| [`resumebot`](plugins/resumebot) | — | A job-search operating system: master resume, targeting coach, Excel tracker, board scans, tailored packets, apply queue, email sync, and interview prep |

**skill-evolution**

- *You type* — `/skill-evolution-sweep`
- *Automatic* — `skill-evolution`

**memory-vault**

- *You type* — `/vault-init`, `/vault-review`
- *Automatic* — `vault-capture`, `vault-conventions`

**rulegate**

- *You type* — `/rulegate-setup`
- *Automatic* — `rule-compiler`, `rules-audit`

**resumebot**

- *You type* — `/setup`
- *Automatic* — `apply-tabs`, `build-packets`, `email-sync`, `interview-prep`, `job-profile`, `job-scan`, `master-resume`, `tracker`

<!-- catalog:end -->

## How this is laid out

Every skill, standalone or inside a plugin, is a directory with a
`SKILL.md` whose frontmatter carries its `name` and the `description` Claude
matches against to decide when it applies. Most also carry
`genome/intent.md`.

The difference is what surrounds it.

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

Stdlib only — nothing to install. CI runs all of these on every
push, plus a check that each built archive opens on Linux.

Standalone skills under `skills/` are published by being there — they are
copied, not installed, so there is nothing to declare.

Inside a plugin it is the opposite: a skill ships only when that plugin's
`skills` array names it. One present in the plugin but absent from the array
is unreleased, which is where work in progress lives. The validator reports
those two states separately, so an unreleased skill never hides among the
standalone ones.

[`CONTEXT.md`](CONTEXT.md) defines the terms used here — skill, plugin,
release, surface, ship — and is worth reading before making changes.

## License

MIT — see [LICENSE](LICENSE). Use, modify, and redistribute freely.
