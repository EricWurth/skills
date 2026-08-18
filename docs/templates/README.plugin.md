# <plugin-name>

<One line, under 120 characters, on its own. No leading "> ". Matches the
description in `.claude-plugin/plugin.json` and the marketplace entry.>

## Why this exists

<Optional. The failure mode this replaces. What happens without it.>

## How it works

<The mechanism. For a plugin this usually means how the parts fit together
rather than a restatement of each skill; a table of moments and mechanisms
often does more than prose. Name the load-bearing behaviour and anything that
would surprise a reader.>

## What's in it

| Skill | Invocation | What it does |
|---|---|---|
| `<skill>` | you type / automatic | <one line> |

<Mark user-invoked skills with a leading slash: `/vault-init`. The
distinction is what a reader needs to know before installing; it tells
them what will fire on its own.

List anything beyond skills too: agents, hooks, commands, scripts,
templates. Those are what make this a plugin rather than a folder of
skills, so they belong in the README.>

## Requirements

<The test is narrow: remove this and does the plugin stop working? Whether
the plugin mentions it is a different question; an agent's own text can
assert a pairing in the present tense ("you work under X") without X being
installed, and that assertion is not evidence the pairing is required.
Only list what is actually load-bearing:

- services, MCP servers, databases, or private systems it cannot run without
- files or folders it expects
- surfaces it will not run on, and why

Write "None." when that is true.

## What extends it

<Other plugins or systems that make this better without being required.
This is where a companion plugin belongs if the method still runs alone.
State plainly what is gained and what is lost without each one; "installed
alone it still follows the method, but nothing enforces it" is the shape.
An undeclared real requirement is the single worst README defect: the
reader installs, it half works, and nothing says why. A requirement claimed
that turns out to be optional is the second worst; it stops someone
installing something that would have worked fine.>

## Setup

```
/plugin marketplace add EricWurth/skills
/plugin install <plugin-name>@ericwurth
```

<Then whatever first-run step exists, usually a user-invoked setup skill.
Show the command.>

## Limits

<Optional and strongly encouraged. What it does not catch, where it
degrades, what this version is honest about. Version-stamp the section if
limits differ by release. A credible limits section buys more trust than
any feature list.>
