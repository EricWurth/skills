# In progress

Standalone skills that are not finished, and not published.

This folder exists to close one specific gap. A skill inside a plugin is
held back by leaving it out of that plugin's `skills` array; the manifest
is the gate. A standalone skill under `skills/` has no manifest, so it is
published simply by being there. Without somewhere to put unfinished work,
the only way to hold a standalone skill back is to not write it.

Everything here is validated like any other skill (names, links, and
frontmatter are all checked), but nothing here appears in the README
catalogue, and nothing here is packaged.

## Moving one out

`git mv` it up to `skills/`. That is the whole release step; there is no
list to update, because the catalogue is generated from what is present.

## Not a deprecated folder

There isn't one, deliberately. A retired skill is deleted, and the changelog
entry that removes it names whatever replaced it. A graveyard folder is a
second place for stale content to live, and the history already holds it.
