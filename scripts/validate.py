#!/usr/bin/env python3
"""Validate the skill collection before it ships.

Checks, in rough order of how badly they bite:

  1. Every SKILL.md parses and declares a name and description.
  2. Frontmatter `name` matches its directory name, and is kebab-case.
  3. No two skills share a name -- collisions are silent at load time.
  4. Every plugin manifest declares an explicit `skills` array. Without one,
     Claude Code auto-discovers everything under skills/, which means an
     unfinished skill ships the moment the file exists. The array IS the
     release gate.
  5. Every path in a `skills` array resolves to a directory with a SKILL.md.
  6. Every skill on disk is accounted for: shipped by exactly one manifest,
     or reported as unreleased (not an error -- that's how WIP lives here).
  7. marketplace.json plugin sources resolve, and name the plugin they point at.
  8. Relative links inside SKILL.md resolve on disk.
  9. Anything named as third-party in the root PROVENANCE.md carries its own
     PROVENANCE.md, so the claim travels with the files.

Exit code is 1 if any error fired, 0 otherwise. Warnings never fail the run.

Usage:  py -3 scripts/validate.py [repo_root]
"""

from __future__ import annotations

import re
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "lib"))
from skillmodel import (  # noqa: E402
    SKILL_NAME_RE,
    find_skills,
    load_json,
    parse_frontmatter,
)

LINK_RE = re.compile(r"\[[^\]]*\]\(([^)]+)\)")

errors: list[str] = []
warnings: list[str] = []


def err(msg: str) -> None:
    errors.append(msg)


def warn(msg: str) -> None:
    warnings.append(msg)


def check_skills(root: Path):
    skills = find_skills(root)
    by_name: dict[str, list[str]] = defaultdict(list)

    for s in skills:
        if not s.fm.present:
            err(f"{s.rel}/SKILL.md: no YAML frontmatter block")
            continue

        name = s.name
        if not name:
            err(f"{s.rel}/SKILL.md: frontmatter missing `name`")
        else:
            by_name[name].append(s.rel)
            if name != s.dirname:
                err(f"{s.rel}/SKILL.md: name '{name}' != directory '{s.dirname}'")
            if not SKILL_NAME_RE.match(name):
                err(f"{s.rel}/SKILL.md: name '{name}' is not kebab-case")

        desc = s.fm.get("description")
        if not desc:
            # Without a description the model has nothing to trigger on.
            err(f"{s.rel}/SKILL.md: frontmatter missing `description`")
        elif len(desc) < 40:
            warn(f"{s.rel}/SKILL.md: description is {len(desc)} chars; "
                 "too thin to trigger reliably")

        check_links(s.path, s.text, s.rel)

    for name, where in sorted(by_name.items()):
        if len(where) > 1:
            err(f"duplicate skill name '{name}': {', '.join(where)}")

    return skills


def check_links(skill_dir: Path, text: str, rel: str) -> None:
    for target in LINK_RE.findall(text):
        if target.startswith(("http://", "https://", "#", "mailto:")):
            continue
        path = (skill_dir / target.split("#", 1)[0]).resolve()
        if not path.exists():
            err(f"{rel}/SKILL.md: broken link -> {target}")


def check_manifests(root: Path, skills):
    """Verify every manifest's skills array, and reconcile against disk."""
    on_disk = {s.path.resolve() for s in skills}
    shipped: dict[Path, list[str]] = defaultdict(list)

    manifests = sorted(root.rglob(".claude-plugin/plugin.json"))
    if not manifests:
        err("no .claude-plugin/plugin.json found anywhere")

    for man in manifests:
        rel = man.relative_to(root).as_posix()
        data, parse_err = load_json(man)
        if parse_err:
            err(f"{rel}: malformed JSON -- {parse_err}")
            continue

        for field in ("name", "version", "description"):
            if not data.get(field):
                err(f"{rel}: missing `{field}`")

        listed = data.get("skills")
        if listed is None:
            err(f"{rel}: no `skills` array -- auto-discovery ships everything "
                "under skills/, including work in progress")
            continue
        if not isinstance(listed, list) or not listed:
            err(f"{rel}: `skills` must be a non-empty array")
            continue

        base = man.parent.parent
        for entry in listed:
            target = (base / entry).resolve()
            if not target.is_dir():
                err(f"{rel}: skills entry '{entry}' does not exist")
            elif not (target / "SKILL.md").is_file():
                err(f"{rel}: skills entry '{entry}' has no SKILL.md")
            else:
                shipped[target].append(data.get("name", rel))

    for path, owners in shipped.items():
        if len(owners) > 1:
            rp = path.relative_to(root).as_posix()
            err(f"{rp}: shipped by multiple plugins ({', '.join(owners)})")

    unreleased = sorted(on_disk - set(shipped))
    for path in unreleased:
        rp = path.relative_to(root).as_posix()
        print(f"  unreleased: {rp}")
    return unreleased


def check_provenance(root: Path, skills) -> None:
    """Origin must be answerable at release time, not from memory.

    A root PROVENANCE.md declares the default author and lists exceptions.
    Any skill named there as third-party must carry its own PROVENANCE.md,
    so the claim travels with the files if the skill is ever copied out.
    """
    root_file = root / "PROVENANCE.md"
    if not root_file.is_file():
        warn("no root PROVENANCE.md -- third-party content cannot be "
             "distinguished from original work")
        return

    declared = root_file.read_text(encoding="utf-8", errors="replace")
    for s in skills:
        named = re.search(rf"`{re.escape(s.dirname)}`", declared)
        if named and not s.has_provenance:
            err(f"{s.rel}: named in PROVENANCE.md as third-party but has no "
                "PROVENANCE.md of its own")


def check_marketplace(root: Path):
    mp = root / ".claude-plugin" / "marketplace.json"
    if not mp.is_file():
        warn("no .claude-plugin/marketplace.json -- repo is not installable "
             "via `/plugin marketplace add`")
        return

    data, parse_err = load_json(mp)
    if parse_err:
        err(f".claude-plugin/marketplace.json: malformed JSON -- {parse_err}")
        return

    for entry in data.get("plugins", []):
        name, source = entry.get("name"), entry.get("source")
        if not name or not source:
            err(f"marketplace.json: plugin entry missing name or source: {entry}")
            continue
        manifest = (root / source / ".claude-plugin" / "plugin.json").resolve()
        if not manifest.is_file():
            err(f"marketplace.json: '{name}' source '{source}' has no "
                ".claude-plugin/plugin.json")
            continue
        pdata, _ = load_json(manifest)
        if pdata and pdata.get("name") != name:
            err(f"marketplace.json: '{name}' points at a manifest named "
                f"'{pdata.get('name')}'")


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    print(f"validating {root}\n")

    skills = check_skills(root)
    unreleased = check_manifests(root, skills)
    check_provenance(root, skills)
    check_marketplace(root)

    if unreleased:
        print()
    for w in warnings:
        print(f"  warn: {w}")
    if warnings:
        print()
    for e in errors:
        print(f"  ERROR: {e}")

    print(f"\n{len(skills)} skills, {len(errors)} errors, "
          f"{len(warnings)} warnings, {len(unreleased)} unreleased")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
