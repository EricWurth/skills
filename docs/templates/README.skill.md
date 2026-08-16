# <skill-name>

<One line, under 120 characters, on its own. What it does, not why it is good.
No leading "> ". This matches the skill's `summary` or the first clause of its
`description`.>

## Why this exists

<Optional but usually worth it. The failure mode this skill replaces. Write
the default behaviour it displaces, not a list of features. Two paragraphs
at most.>

## How it works

<The mechanism, in enough detail that a reader can predict what will happen
when the skill runs. Numbered steps if it is a pipeline; bold-led paragraphs
if it is a set of rules. This is the section a reader cannot get anywhere
else — SKILL.md is written for the model, not for them.

State the parts that are load-bearing and non-obvious. If the skill refuses
to do something, say so here.>

## Requirements

<Everything that must exist for this skill to work, including things that
are not files:

- tools it calls (subagents, web search, a shell)
- files it expects to find or writes to
- other skills it loads or is loaded by
- services, MCP servers, or private systems

Write "None. It is instructions only, with no dependencies." when that is
true — the absence is worth stating, because it is what makes a skill
portable to chat.>

## Install

```
cp -r skills/<skill-name> ~/.claude/skills/
```

<Or, for a skill inside a plugin, name the plugin instead. If it works on
claude.ai, say to zip the folder and upload it under Settings.>

## Use

<How it is invoked. If model-invoked, describe the situations that trigger
it. If user-invoked, show the command: `/<skill-name>`.

Say plainly when it is the wrong tool — "overkill for a simple lookup" is
more useful than another sentence about what it does well.>

## Limits

<Optional, and the section most worth writing. What it does not catch, where
it degrades, what version this is honest about. A README with a credible
limits section is trusted more than one without, and it is the section that
stops someone filing a bug for intended behaviour.>
