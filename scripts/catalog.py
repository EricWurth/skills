#!/usr/bin/env python3
"""Generate the README's plugin catalogue from the manifests.

The catalogue restates what the repository already knows, which is exactly
the kind of text that drifts: a plugin gets added, the README doesn't, and
nothing notices because nothing reads the README. So it is generated into a
marked block, and `--check` asserts the file on disk matches what the
manifests would produce. validate.py runs the check, so drift fails the
build instead of ageing quietly.

Usage:
    py -3 scripts/catalog.py            rewrite the block
    py -3 scripts/catalog.py --check    exit 1 if it is out of date
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "lib"))
from skillmodel import parse_frontmatter  # noqa: E402

START = "<!-- catalog:start -->"
END = "<!-- catalog:end -->"


def read_skill(path: Path):
    fm = parse_frontmatter(path.read_text(encoding="utf-8", errors="replace"))
    return {
        "name": fm.get("name") or path.parent.name,
        # `description` is written for the matcher and often opens with
        # "Use when someone asks to..." -- correct there, unreadable in a
        # table. `summary` is the human-facing line when one is supplied.
        "description": (fm.get("summary") or fm.get("description", "")).strip(),
        "user_invoked": fm.get("disable-model-invocation", "").lower() == "true",
    }


def collect(repo: Path):
    market = json.loads(
        (repo / ".claude-plugin" / "marketplace.json").read_text(encoding="utf-8")
    )
    out = []
    for entry in market["plugins"]:
        source = repo / entry["source"]
        man = json.loads(
            (source / ".claude-plugin" / "plugin.json").read_text(encoding="utf-8")
        )
        skills = [read_skill(source / rel / "SKILL.md") for rel in man["skills"]]
        out.append({
            "surfaces": surfaces(source, standalone=False),
            "name": man["name"],
            "version": man["version"],
            "description": entry.get("description") or man["description"],
            "skills": skills,
        })
    return out


def first_sentence(text: str, limit: int = 155) -> str:
    text = " ".join(text.split())
    for marker in (". ", " — ", " - "):
        head = text.split(marker, 1)[0]
        if 20 < len(head) <= limit:
            text = head
            break
    if len(text) > limit:
        text = text[:limit].rsplit(" ", 1)[0] + "…"
    return text.rstrip(".")


def surfaces(path: Path, standalone: bool) -> str:
    """Where this can actually run, derived from what it contains.

    Surfaces differ in capability, and the differences are hard: plain
    claude.ai chat has no shell, no filesystem, and no subagents; Cowork has
    files and subagents but not hooks or MCP servers. So the question "can I
    use this here" is answerable from the contents, and deriving it beats
    declaring it -- a declared field goes stale the first time a skill grows
    a script.

    Heuristic, deliberately conservative: anything that could need a shell
    loses chat.
    """
    if (path / "hooks").is_dir() or (path / ".mcp.json").is_file() \
            or (path / "commands").is_dir():
        return "Code"
    needs_tools = (path / "scripts").is_dir() or (path / "agents").is_dir()
    if not standalone:
        # A plugin installs through the marketplace, which chat has no
        # mechanism for, whatever its contents.
        return "Code · Cowork"
    return "Code · Cowork" if needs_tools else "Code · Cowork · chat"


def collect_standalone(repo: Path):
    """Skills under skills/ -- copied or uploaded, never installed."""
    out = []
    for skill_md in sorted((repo / "skills").glob("*/SKILL.md")):
        entry = read_skill(skill_md)
        entry["surfaces"] = surfaces(skill_md.parent, standalone=True)
        out.append(entry)
    return out


def render(plugins, standalone) -> str:
    lines = [START, ""]
    total = sum(len(p["skills"]) for p in plugins)
    lines.append(
        f"{len(standalone)} standalone skills and {len(plugins)} plugins "
        f"({total} skills). Skills are copied; plugins are installed."
    )
    lines.append("")
    lines.append("### Skills")
    lines.append("")
    lines.append("Self-contained folders. Copy one into `.claude/skills/`, "
                 "or upload it on claude.ai.")
    lines.append("")
    lines.append("*Runs in* is derived from contents: anything carrying "
                 "scripts or agents needs a surface that can run them.")
    lines.append("")
    lines.append("| Skill | Runs in | What it does |")
    lines.append("|---|---|---|")
    for s in standalone:
        lines.append(f"| [`{s['name']}`](skills/{s['name']}) | {s['surfaces']} | "
                     f"{first_sentence(s['description'])} |")
    lines.append("")
    lines.append("### Plugins")
    lines.append("")
    lines.append("Installed through the marketplace. Each carries more than "
                 "instructions — extra skills, agents, hooks, or scripts.")
    lines.append("")
    lines.append("| Plugin | Ver | Runs in | What it does |")
    lines.append("|---|---|---|---|")
    for p in plugins:
        lines.append(f"| [`{p['name']}`](plugins/{p['name']}) | {p['version']} | "
                     f"{p['surfaces']} | {first_sentence(p['description'])} |")
    lines.append("")

    multi = [p for p in plugins if len(p["skills"]) > 1]
    if multi:
        lines.append("Plugins carrying more than one skill:")
        lines.append("")
        for p in multi:
            names = ", ".join(f"`{s['name']}`" for s in p["skills"])
            lines.append(f"- **{p['name']}** — {names}")
        lines.append("")

    user = [(p, s) for p in plugins for s in p["skills"] if s["user_invoked"]]
    if user:
        lines.append("Skills that only run when you type them "
                     "(`disable-model-invocation`):")
        lines.append("")
        for p, s in user:
            lines.append(f"- `{s['name']}` — {first_sentence(s['description'])}")
        lines.append("")

    lines.append(END)
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    repo = Path(__file__).resolve().parent.parent
    readme = repo / "README.md"
    text = readme.read_text(encoding="utf-8")

    if START not in text or END not in text:
        print(f"README.md: missing {START} / {END} markers", file=sys.stderr)
        return 1

    block = render(collect(repo), collect_standalone(repo))
    updated = re.sub(
        re.escape(START) + r".*?" + re.escape(END), lambda _: block, text, flags=re.S
    )

    if args.check:
        if updated != text:
            print("README.md catalogue is out of date -- "
                  "run: py -3 scripts/catalog.py", file=sys.stderr)
            return 1
        print("README.md catalogue matches the manifests")
        return 0

    if updated != text:
        readme.write_text(updated, encoding="utf-8")
        print("README.md catalogue updated")
    else:
        print("README.md catalogue already current")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
