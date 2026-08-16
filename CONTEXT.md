# Vocabulary

Shared terms for this repository. The point is that a human and an agent
mean the same thing by the same word — most of the entries below exist
because a specific misunderstanding cost real work.

## Skill

A directory containing `SKILL.md`. That file's frontmatter carries `name`
(matching the directory) and `description`. A skill is instructions, not a
package: on its own it has no version and no install path.

## Plugin

The installable unit. A directory containing `.claude-plugin/plugin.json`,
which declares `name`, `version`, `description`, and a `skills` array. May
also carry `agents/`, `commands/`, `hooks/`, `scripts/`, `templates/`, and
`examples/`.

Every plugin in this repository lives under `plugins/` as a peer. The root
is **not** a plugin — see *Marketplace*.

## Marketplace

The repository itself, by way of `.claude-plugin/marketplace.json`, which
lists every plugin and where it lives. Installed with:

```
/plugin marketplace add EricWurth/skills
```

A marketplace is not an application that bundles extras. If the root ever
acquires its own `plugin.json` and `skills/`, one plugin has become
privileged over the others and the shape is wrong.

## Ship, and the gate

A skill **ships** when a plugin's `skills` array names it. That array is
the gate, and it is the only gate.

This matters because Claude Code auto-discovers everything under `skills/`
when no array is present. Without one, a skill ships the moment its file
exists, and the only way to hold work back is to not have written it.

## Release

**The discipline of deciding what ships and when** — not a synonym for
"plugin", and not the act of publishing.

This one caused a genuine misfire: "only publish plugins as a release" was
read as *the plugin is the atomic unit of distribution*, which produced an
argument that loose skills must be wrapped into a plugin to exist. That
inference was never intended. When the packaging question comes up, say
"packaging" or "install unit". Reserve *release* for the decision.

## Surface

Where a skill runs: **Claude Code**, **Cowork**, or **claude.ai chat**.
Surfaces differ in capability — chat has no filesystem, no shell, no
subagents, no hooks — so a skill that shells out cannot run in all three.

Surface is a property of what a skill *does*, derived rather than declared.
It is deliberately not the directory structure: capability changes would
otherwise become directory moves.

## User-invoked vs model-invoked

**Model-invoked** is the default: the skill fires when its `description`
matches what is happening. Descriptions should be rich and carry trigger
phrasing.

**User-invoked** means `disable-model-invocation: true` — reachable only
when the human types its name. Descriptions should be one plain line with
*no* trigger language, since nothing is matching against them.

Two consequences: reserve user-invoked for skills with real side effects or
significant cost, and never `Skill`-call a user-invoked skill from another
skill. Tell the user to run it instead.

## Genome and phenotype

`SKILL.md` is the **phenotype** — what the model reads and executes.
`genome/intent.md` is the **genome** — purpose, success criteria,
behavioural invariants, the choices left free to vary, and golden examples.
Changed by hand only.

When packaging changes or a skill drifts from its own intent, regenerate the
phenotype from the genome rather than patching a stale file. `skill-evolution`
discovers eligible targets by looking for a genome, and treats anything
marked `[INVARIANT]` as off-limits.

## agents/ — two different mechanisms sharing one folder name

A plugin-root `agents/` file (`delegate/agents/delegate.md`,
`resumebot/agents/career-coach.md`) is a **registered subagent**: real
YAML frontmatter (`name`, `description`), discovered by directory
placement, dispatched by Claude Code itself. Nothing needs to name it
anywhere — that's the whole point, it's found automatically.

A skill-level `agents/` file (`document-forge/agents/ambiguity-reader.md`)
can instead be **raw prompt text**: no frontmatter, never auto-discovered,
read by the model and handed to the `Agent` tool as that subagent's full
instructions. `document-forge/SKILL.md` says exactly this — "dispatch a
separate subagent using `agents/ambiguity-reader.md` as its full
instructions." For this pattern, being *named in SKILL.md* is what makes
it findable, since nothing else will.

Same folder name, opposite discovery mechanism. Don't add frontmatter to
the second kind expecting it to start behaving like the first — it isn't
registered and was never meant to be. `scripts/validate.py`'s
`check_agent_file` accepts either shape (frontmatter, or named in a
sibling `SKILL.md`) and only flags a file satisfying neither.

## Evals

Every skill has `evals/cases/<skill-name>.json` at the repo root —
**centralized, not inside the skill's own folder**, the one deliberate
exception to "everything about a skill lives together." A handful of
realistic prompts testing whether the skill actually triggers (or
doesn't) the way its `description` claims: `should_trigger` /
`should_not_trigger` / `ambiguous` for model-invoked skills,
`explicit_invocation` / `should_not_auto_trigger` for user-invoked ones.

Centralized on purpose, following the one real precedent found for this —
addyosmani/agent-skills keeps evals outside `skills/` too, CI-gated on a
minimum query count per skill. Living outside every skill and plugin
directory means the packager never has to know evals exist: it only ever
walks what a skill or plugin's own manifest declares, so nothing here can
leak into a shipped plugin archive by accident. That used to require a
manual check; now it's structural.

These are authored test cases, not run results — nothing executes them
automatically. `scripts/validate.py`'s `check_evals` verifies the file
exists, the `invocation` field matches the skill's actual
`disable-model-invocation` state (so it can't quietly go stale if that
changes), and the category counts clear a real minimum — not just that a
file is present.

## Bundle

**Avoid.** It previously named a hand-curated collection of skills packaged
together, which drifted from its sources because the list was maintained by
hand. Say *plugin* for the install unit, and remember that a plugin's
contents come from its manifest, never from a directory walk.

## Library skill

A skill under a plugin's `skills/` that the manifest does *not* name. It is
present, validated, and unreleased. This is where work in progress lives —
there is no separate staging directory, and none is wanted.
