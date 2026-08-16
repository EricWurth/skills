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
            "chat": runs_in_chat(source),
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


def runs_in_chat(path: Path) -> bool:
    """True when this is only instructions.

    A chat surface has no shell and no filesystem, so anything shipping
    scripts, hooks, commands, an MCP server, or subagents needs a coding
    environment. Derived rather than declared, so it cannot go stale the
    first time something grows a scripts/ folder.
    """
    blockers = ("scripts", "hooks", "commands", "agents")
    if any((path / d).is_dir() for d in blockers):
        return False
    if (path / ".mcp.json").is_file():
        return False
    # A plugin can be skills-only at the top level while one of its skills
    # ships a script. Check the whole tree, not just the root.
    return not any(
        d.is_dir() and d.name in blockers
        for d in path.rglob("*")
    )


def tick(value: bool) -> str:
    return "✅" if value else "—"


def collect_standalone(repo: Path):
    """Skills under skills/ -- copied or uploaded, never installed."""
    out = []
    for skill_md in sorted((repo / "skills").glob("*/SKILL.md")):
        entry = read_skill(skill_md)
        entry["chat"] = runs_in_chat(skill_md.parent)
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
    lines.append("They split on one axis: who can invoke them. "
                 "**User-invoked** skills are reachable only when you type "
                 "them — they orchestrate. **Model-invoked** skills can be "
                 "typed *or* reached for automatically when the task fits — "
                 "they hold the reusable discipline. A user-invoked skill "
                 "may call a model-invoked one, never another user-invoked "
                 "one.")
    lines.append("")
    lines.append("*Chat* marks what runs with no filesystem or shell. "
                 "Derived from contents, not declared.")
    lines.append("")

    def table(rows, where):
        out = ["| | Chat | What it does |", "|---|:--:|---|"]
        for name, chat, desc, prefix in rows:
            out.append(f"| [`{prefix}{name}`]({where}/{name}) | {tick(chat)} "
                       f"| {first_sentence(desc)} |")
        return out

    for heading, blurb, rows_user, rows_model in (
        ("Skills",
         "Self-contained folders. Copy one into `.claude/skills/`, or upload "
         "it on claude.ai.",
         [(s["name"], s["chat"], s["description"], "/")
          for s in standalone if s["user_invoked"]],
         [(s["name"], s["chat"], s["description"], "")
          for s in standalone if not s["user_invoked"]]),
        ("Plugins",
         "Installed through the marketplace. Each carries more than "
         "instructions — extra skills, agents, hooks, or scripts.",
         [], []),
    ):
        lines.append(f"### {heading}")
        lines.append("")
        lines.append(blurb)
        lines.append("")
        if heading == "Plugins":
            lines.append("| Plugin | Chat | What it does |")
            lines.append("|---|:--:|---|")
            for p in plugins:
                lines.append(f"| [`{p['name']}`](plugins/{p['name']}) | "
                             f"{tick(p['chat'])} | "
                             f"{first_sentence(p['description'])} |")
            lines.append("")
            for p in plugins:
                if len(p["skills"]) < 2:
                    continue
                lines.append(f"**{p['name']}**")
                lines.append("")
                for group, label in (("user", "You type"), ("model", "Automatic")):
                    members = [s for s in p["skills"]
                               if s["user_invoked"] == (group == "user")]
                    if not members:
                        continue
                    joined = ", ".join(
                        f"`{'/' if group == 'user' else ''}{s['name']}`"
                        for s in members)
                    lines.append(f"- *{label}* — {joined}")
                lines.append("")
            continue
        for label, rows in (("User-invoked", rows_user),
                            ("Model-invoked", rows_model)):
            if not rows:
                continue
            lines.append(f"**{label}**")
            lines.append("")
            lines.extend(table(rows, "skills"))
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
