# document-forge

A staged production pipeline for business documents, with acceptance criteria per stage instead of one-shot drafting.

## Why this exists

Asking for a memo produces a draft that reads well and commits to nothing.
The failure is structural: everything happens in one pass, so there is no
point at which a claim can be checked before it is built on. This borrows
the reliability pattern from coding agent pipelines (isolated task scoping
per stage, explicit acceptance criteria) and applies it to prose.

## How it works

Stage 0 sets up the workspace, once. Then the pipeline runs in order:

1. **Brief.** What the document must do, for whom, and what changes if it works
2. **Gather.** Source material, before any drafting
3. **Outline.** Structure agreed before prose exists
4. **Draft.** The first pass that anyone would call writing
5. **Claim check.** Every factual assertion traced or cut
6. **Mechanical lint.** `scripts/lint.py`, deterministic rules enforced in code rather than by judgment
7. **Ground truth check.** Runs when the document invokes named practice, so borrowed frameworks are checked against their source
8. **Ambiguity pass.** A dedicated subagent reads for what could be misread
9. **Adversarial content review.** Attacks the argument
10. **Style and structure check.**
11. **Contract check.** The draft walked against every acceptance criterion from stage 1
12. **Gate.** Pass or fail, naming the specific failing criterion; a fail returns to the stage that owns the gap

The split between stages 5 and 6 is the load-bearing idea: rules that can be
pattern-matched live in the linter where they run deterministically, and
only judgment-based rules are checked by reading. A rule that keeps getting
missed by eye should move into the linter rather than be restated.

## Requirements

- **Isolation for the ambiguity pass.** It needs to read the document cold,
  without the drafting context. On Claude Code or Cowork that's a subagent;
  without one (Claude.ai chat), it's a fresh separate conversation given the
  draft alone. The skill does not fail without that isolation, but skipping
  it on any surface defeats the stage.
- **A writable workspace.** Stage 0 scaffolds one, and handles the case where
  the target is not directly writable (cloud sandbox, device-bridged folder).
- **Python**, for `scripts/lint.py`.

## Install

```
cp -r skills/document-forge ~/.claude/skills/
```

## Use

Type `/document-forge`. It is user-invoked deliberately: it sets up a
workspace and runs a long pipeline, which should happen because you asked,
not because a memo came up in conversation.

Wrong tool for a quick draft or a summary. The whole point is doing more
work than one pass would.

## Limits

The mechanical linter catches what can be pattern-matched and nothing else;
everything past that depends on the reviewing stages doing real work. The
ground truth check only fires when the document names an outside framework;
it will not catch an unattributed one.

## Maintaining this skill

`evals/cases/document-forge.json`, at the repo root, is a reviewer's test
suite: representative prompts and expected behaviour, run to check the
skill still works after a change. It is never read by the skill itself at
runtime, the same as this README. Every skill in this repo has one; see
`CONTEXT.md` for why it lives outside the skill's own folder.
