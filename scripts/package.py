#!/usr/bin/env python3
"""Build a distributable archive for every plugin in the marketplace.

The pipeline is three gates, in order:

    validate  ->  package  ->  release
    structure     artifacts    versioned tag

This is the middle one. It refuses to run if validation fails, so a broken
tree cannot produce an artifact.

Two rules do most of the work:

1. **Build from the manifest, never from the directory.** A plugin ships
   exactly the skills its `skills` array names. Walking skills/ instead is
   how an archive ends up carrying a skill that moved somewhere else months
   earlier -- the artifact keeps working, so nothing surfaces the drift.

2. **Write archives with Python's zipfile.** PowerShell's Compress-Archive
   writes backslash path separators inside the zip; Linux-side consumers,
   including upload validators, read those as literal filename characters
   and reject the archive. zipfile always writes forward slashes. The QA
   pass below asserts it rather than trusting it.

Usage:  py -3 scripts/package.py [--out dist] [--skip-validate]
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "lib"))
from skillmodel import load_json  # noqa: E402

# Directories a plugin may ship beyond its declared skills. Anything not
# named here stays out -- notably scripts/ and references/ at the repo root,
# which are maintainer tooling, and plugins/, which would nest every other
# plugin inside the root one.
PLUGIN_DIRS = ["agents", "commands", "hooks", "templates", "examples"]
PLUGIN_FILES = ["README.md", ".mcp.json", "LICENSE"]


def iter_files(root: Path):
    for p in sorted(root.rglob("*")):
        if not p.is_file():
            continue
        if any(part in ("__pycache__", ".git", "node_modules") for part in p.parts):
            continue
        if p.suffix in (".pyc", ".pyo"):
            continue
        yield p


def collect(repo: Path, source: Path, manifest: dict) -> list[tuple[Path, str]]:
    """(file, archive_name) pairs for one plugin, arcnames rooted at the plugin."""
    entries: list[tuple[Path, str]] = []

    def add(path: Path, base: Path) -> None:
        entries.append((path, path.relative_to(base).as_posix()))

    add(source / ".claude-plugin" / "plugin.json", source)

    for rel in manifest.get("skills", []):
        skill_dir = (source / rel).resolve()
        for f in iter_files(skill_dir):
            entries.append((f, f.relative_to(source).as_posix()))

    for d in PLUGIN_DIRS:
        target = source / d
        if target.is_dir():
            for f in iter_files(target):
                add(f, source)

    for name in PLUGIN_FILES:
        f = source / name
        if f.is_file():
            add(f, source)

    # A plugin's own scripts/ ships; the repo root's does not.
    if source.resolve() != repo.resolve():
        scripts = source / "scripts"
        if scripts.is_dir():
            for f in iter_files(scripts):
                add(f, source)

    return entries


def build(dest: Path, entries: list[tuple[Path, str]]) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    seen: set[str] = set()
    with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as zf:
        for path, arc in entries:
            if arc in seen:
                continue
            seen.add(arc)
            assert "\\" not in arc, f"backslash in archive path: {arc}"
            zf.write(path, arc)


def qa(dest: Path, manifest: dict) -> list[str]:
    """Read the archive back. Trusting the writer is how bad artifacts ship."""
    problems: list[str] = []
    with zipfile.ZipFile(dest) as zf:
        names = zf.namelist()
        bad = zf.testzip()
        if bad:
            problems.append(f"corrupt entry: {bad}")
        if ".claude-plugin/plugin.json" not in names:
            problems.append("missing .claude-plugin/plugin.json")
        for arc in names:
            if "\\" in arc:
                problems.append(f"backslash in path: {arc}")
            if arc.startswith("/") or ".." in arc.split("/"):
                problems.append(f"unsafe path: {arc}")
        for rel in manifest.get("skills", []):
            want = f"{rel.removeprefix('./')}/SKILL.md"
            if want not in names:
                problems.append(f"declared skill not in archive: {want}")
    return problems


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="dist")
    ap.add_argument("--skip-validate", action="store_true")
    args = ap.parse_args()

    repo = Path(__file__).resolve().parent.parent
    out = (repo / args.out).resolve()

    if not args.skip_validate:
        rc = subprocess.run(
            [sys.executable, str(repo / "scripts" / "validate.py"), str(repo)]
        ).returncode
        if rc != 0:
            print("\nvalidation failed -- no artifacts built", file=sys.stderr)
            return rc
        print()

    market, err = load_json(repo / ".claude-plugin" / "marketplace.json")
    if err:
        print(f"marketplace.json: {err}", file=sys.stderr)
        return 1

    failures = 0
    for entry in market.get("plugins", []):
        name, source = entry["name"], (repo / entry["source"]).resolve()
        manifest, merr = load_json(source / ".claude-plugin" / "plugin.json")
        if merr:
            print(f"  {name}: unreadable manifest -- {merr}", file=sys.stderr)
            failures += 1
            continue

        entries = collect(repo, source, manifest)
        dest = out / f"{name}.plugin"
        build(dest, entries)

        problems = qa(dest, manifest)
        version = manifest.get("version", "?")
        size = dest.stat().st_size
        if problems:
            failures += 1
            print(f"  {name} {version}: FAILED QA")
            for p in problems:
                print(f"      {p}")
        else:
            print(f"  {name} {version}: {len(entries)} files, "
                  f"{size / 1024:.0f} KB -> {dest.relative_to(repo).as_posix()}")

    print(f"\n{len(market.get('plugins', []))} plugins, {failures} failed")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
