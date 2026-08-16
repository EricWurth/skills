#!/usr/bin/env python3
"""
Scaffold a Cowork workspace configured for document-forge.

Idempotent: never overwrites an existing file. Reports what it created,
what it skipped, and what it could not find. Safe to re-run.

Usage:
    python init-workspace.py <workspace-path> [--skill-source <path-to-document-forge>]
"""
import argparse
import shutil
import sys
from pathlib import Path

WORKSPACE_DIRS = ["system", "context", "projects", "outputs", "skills"]

CONTEXT_STUBS = {
    "context/about-me.md": """# About me

Who I am, what I do, what I'm responsible for. Keep this factual and short.

Replace this stub. Combined with the other context files, aim to stay under
roughly 4,500 words total: past that, the useful signal gets diluted.

- Role:
- What I own:
- Who I work with:
- What I'm currently focused on:
""",
    "context/working-preferences.md": """# Working preferences

How I want work done. Behavioral, not biographical.

Replace this stub.

- Planning: confirm understanding and state a plan before non-trivial work
- Length: concise by default, expand only when asked
- Questions: ask when genuinely ambiguous, don't ask to hedge
- Deliverables: default format, where finished work should be saved
""",
    "context/tone-of-voice.md": """# Tone of voice

Source: memory-vault `semantic/writing-voice-plain-optimistic.md` - Eric's
standing voice rule, ported by default rather than left as a placeholder
(see `semantic/vault-default-for-sourced-context.md`).

- Voice: natural, plain, concise, optimistic. Short direct sentences,
  everyday words. No rhetorical flourishes, aphorisms, or consulting-speak.
  Forward-looking register: no hedging, no self-deprecation, no
  pre-conceding.
- Don't upgrade his words: if he rewrites a line, that rewrite is the
  target, not a first draft to polish.
- Shorter than you think: lead with the judgment, not the procedure.
- Banned constructions / structural preferences: not yet specified beyond
  the above. Add here as they surface for this project, then migrate
  anything mechanically checkable into `scripts/lint.py`.

If this project's audience or register genuinely differs (e.g.,
client-facing status reports vs. a cover letter), note the adaptation here
explicitly rather than silently drifting from the vault default.
""",
    "system/house-rules.md": """# House rules

Base rules that apply to all work in this workspace, regardless of project.

These stay stable. Project-specific instruction belongs in projects/, not here.

## Standing rules

- Finished deliverables go in outputs/, organized by project
- Raw materials and briefs live in projects/<project-name>/
- Never overwrite a source file in projects/; write derived work to outputs/
- When a document is meant to drive a decision, run document-forge rather
  than drafting it in one pass

## Document work

The document-forge skill is installed at skills/document-forge/. Use it for
any document where being wrong has a real cost. Skip it for quick summaries
and casual notes: the pipeline is overhead that only pays for itself when
the output matters.
""",
    "projects/README.md": """# Projects

One subfolder per project. Each holds the raw materials for that work:
brief, source documents, notes, references.

Suggested shape for a document-forge project:

    projects/<project-name>/
    ├── brief.md            # stage 1 output: decision + acceptance criteria
    ├── sources/            # stage 2 gather materials
    ├── drafts/             # working drafts, versioned
    └── review-notes.md     # stage 5 claim list + stage 6 ambiguity readback

Finished output goes to outputs/<project-name>/, not here.
""",
    "outputs/README.md": """# Outputs

Finished work, organized by project. One subfolder per project, matching
the name used in projects/.

Keeping outputs separate from projects/ means a source file is never
silently overwritten by a derived one.
""",
}


def scaffold(workspace: Path, skill_source: Path | None):
    created, skipped, warnings = [], [], []

    if not workspace.exists():
        workspace.mkdir(parents=True)
        created.append(f"{workspace}/")

    for d in WORKSPACE_DIRS:
        target = workspace / d
        if target.exists():
            skipped.append(f"{d}/ (already exists)")
        else:
            target.mkdir(parents=True)
            created.append(f"{d}/")

    for rel, body in CONTEXT_STUBS.items():
        target = workspace / rel
        if target.exists():
            skipped.append(f"{rel} (already exists, left untouched)")
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(body, encoding="utf-8")
        created.append(rel)

    # Install document-forge
    dest = workspace / "skills" / "document-forge"
    if dest.exists():
        skipped.append("skills/document-forge/ (already installed, left untouched)")
    elif skill_source and skill_source.exists():
        shutil.copytree(skill_source, dest)
        created.append("skills/document-forge/ (copied from source)")
    else:
        warnings.append(
            "document-forge source not found. Pass --skill-source <path>, "
            "or copy the skill folder into skills/ manually."
        )

    return created, skipped, warnings


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("workspace", help="Path to the Cowork workspace folder")
    ap.add_argument("--skill-source", default=None,
                    help="Path to the document-forge skill folder to install. "
                         "Defaults to the skill folder this script lives in.")
    args = ap.parse_args()

    if args.skill_source:
        source = Path(args.skill_source).expanduser()
    else:
        # Install the skill this script is part of - no bundled duplicate,
        # so there is exactly one copy of document-forge to maintain.
        source = Path(__file__).resolve().parent.parent
    created, skipped, warnings = scaffold(Path(args.workspace).expanduser(), source)

    if created:
        print("CREATED:")
        for c in created:
            print(f"  + {c}")
    if skipped:
        print("\nSKIPPED (nothing overwritten):")
        for s in skipped:
            print(f"  = {s}")
    if warnings:
        print("\nWARNINGS:")
        for w in warnings:
            print(f"  ! {w}")

    print("\nNext: replace the context/ stubs with real content, then point")
    print("Cowork at this folder via Projects > + > use an existing folder.")
    return 1 if warnings else 0


if __name__ == "__main__":
    sys.exit(main())
