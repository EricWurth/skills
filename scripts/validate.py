#!/usr/bin/env python3
"""Validate the skill collection before it ships.

Checks, in rough order of how badly they bite:

  1. Every SKILL.md parses and declares a name and description, and carries
     a genome/intent.md. The genome never loads at runtime -- nothing costs
     more by having one -- so this is unconditional.
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
 10. Relative links inside every README.md resolve on disk -- not just
     SKILL.md. The root catalogue is checked separately against the
     manifests; this catches everything else, including the prose around it.

Exit code is 1 if any error fired, 0 otherwise. Warnings never fail the run.

Usage:  py -3 scripts/validate.py [repo_root]
"""

from __future__ import annotations

import re
import subprocess
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
        elif len(desc) < 40 and not s.user_invoked:
            # Only model-invoked skills are matched against, so only they
            # need a description rich enough to trigger. A user-invoked one
            # should be a single plain line and nothing more.
            warn(f"{s.rel}/SKILL.md: description is {len(desc)} chars; "
                 "too thin to trigger reliably")
        elif len(desc) > 200 and s.user_invoked:
            warn(f"{s.rel}/SKILL.md: user-invoked but carries a "
                 f"{len(desc)}-char description; nothing matches against it")

        check_links(s.path, s.text, f"{s.rel}/SKILL.md")

        if not s.has_genome:
            # genome/intent.md never loads at runtime -- nothing in SKILL.md
            # instructs reading it during normal execution, only skill-evolution's
            # explicit sweep does. It costs nothing at rest, so there is no
            # tradeoff to weigh: every skill carries one.
            err(f"{s.rel}: no genome/intent.md")

    for name, where in sorted(by_name.items()):
        if len(where) > 1:
            err(f"duplicate skill name '{name}': {', '.join(where)}")

    return skills


def check_links(base_dir: Path, text: str, label: str) -> None:
    for target in LINK_RE.findall(text):
        if target.startswith(("http://", "https://", "#", "mailto:")):
            continue
        path = (base_dir / target.split("#", 1)[0]).resolve()
        if not path.exists():
            err(f"{label}: broken link -> {target}")


def check_readmes(root: Path) -> None:
    """Every README.md, not just SKILL.md -- the root catalogue is
    generated and checked separately, but nothing else ever confirmed a
    README's own links resolve. Found four true positives (zero broken)
    and two prose gaps by hand before this existed; this is what makes
    that a standing check instead of a one-off pass."""
    for readme in sorted(root.rglob("README.md")):
        if ".git" in readme.parts:
            continue
        rel = readme.relative_to(root).as_posix()
        text = readme.read_text(encoding="utf-8", errors="replace")
        check_links(readme.parent, text, rel)


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

    # Two different things look identical here: a skill under skills/ at the
    # repository root is standalone by design -- copied or uploaded directly,
    # never installed -- while a skill inside a plugin that its manifest does
    # not name is genuinely unreleased. Only the second is worth reporting.
    accounted = set(shipped)
    standalone, in_progress, unreleased = [], [], []
    for path in sorted(on_disk - accounted):
        rp = path.relative_to(root).as_posix()
        if rp.startswith("skills/in-progress/"):
            # A standalone skill is published by existing, so unfinished ones
            # need somewhere that existing does not mean published.
            in_progress.append(rp)
        elif rp.startswith("skills/"):
            standalone.append(rp)
        else:
            unreleased.append(rp)

    for rp in standalone:
        print(f"  standalone:  {rp}")
    for rp in in_progress:
        print(f"  in progress: {rp}")
    for rp in unreleased:
        print(f"  unreleased:  {rp}")
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


def check_unpublished(root: Path) -> None:
    """A plugin can be complete and still not for sale.

    marketplace.json is the plugin-level equivalent of a manifest's `skills`
    array: present in the tree but absent from the marketplace means built,
    validated, and deliberately not installable. Without this report that
    state is invisible, and an unpublished plugin looks identical to one
    someone forgot to register.
    """
    market, _ = load_json(root / ".claude-plugin" / "marketplace.json")
    listed = {(root / e["source"]).resolve() for e in market.get("plugins", [])}
    for man in sorted(root.glob("plugins/*/.claude-plugin/plugin.json")):
        if man.parent.parent.resolve() not in listed:
            rel = man.parent.parent.relative_to(root).as_posix()
            print(f"  unpublished: {rel}")


KNOWN_SUBDIRS = ("references", "scripts", "agents", "templates", "examples")
# Plugin-root only. hooks/ is wired through hooks.json, which the hook
# engine reads directly -- like agents/, it is discovered by declaration
# and placement, not by being named in a SKILL.md, so it gets no content
# scan at all, the same treatment as evals/.
PLUGIN_ONLY_SUBDIRS = ("hooks",)


def check_agent_file(path: Path, context_text: str, label: str) -> None:
    """An agents/ file is discovered one of two genuinely different ways,
    found by reading all four that exist in this repo rather than assuming:
    delegate.md, career-coach.md, and resume-writer.md are real registered
    subagents (frontmatter with name + description required, auto-
    discovered by directory placement -- Claude Code invokes them, nothing
    needs to name them anywhere). document-forge's ambiguity-reader.md is
    the other pattern: raw prompt text SKILL.md tells the model to dispatch
    as a subagent's *instructions*, never auto-registered, so it correctly
    carries no frontmatter -- but SKILL.md must name it, since that's its
    only path to being found. Checking for "no frontmatter" alone would
    have flagged the second pattern as broken when it is working as
    designed; checking for "not named in SKILL.md" alone would have missed
    a registered subagent with malformed frontmatter. A file must satisfy
    at least one of the two to be doing its job.
    """
    text = path.read_text(encoding="utf-8", errors="replace")
    has_frontmatter = text.startswith("---") and "\nname:" in text.split("\n---", 1)[0]
    is_referenced = path.name in context_text
    if not has_frontmatter and not is_referenced:
        err(f"{label}: no frontmatter (name/description) and never named "
            "in a SKILL.md -- not discoverable as a registered subagent, "
            "and not usable as dispatched prompt text either")


def check_organization(root: Path, skills) -> None:
    """Hygiene checks a link-checker can't catch, since a misplaced or
    orphaned file is never a broken path -- it resolves fine, it's just in
    the wrong place or never pointed at.

    Runs at two levels. Per-skill, checked once already: report-template.html
    sat loose at storm-research's root instead of in references/, and
    skill-evolution-sweep/example.md was both loose and genuinely orphaned.
    Per-plugin, checked once already: agents/, scripts/, templates/, and
    examples/ can sit beside skills/ at a plugin's own root -- shared across
    every skill in that plugin -- and nothing had ever scanned those. All
    warnings, not errors: a loose or undocumented file is a smell, not a
    break.
    """
    # evals/ holds a reviewer's test suite, never read by the skill at
    # runtime -- same category as README.md. Legitimate plugin-root
    # scripts can be the same way (a build tool that regenerates a
    # template, say) as long as a human reader can find out why it's
    # there, so plugin-level checks accept the README as that place;
    # skill-level checks don't, because those files need to be reachable
    # by the *model*, not just documented for a maintainer.
    unreferenced_ok = {"evals"}

    def scan_dir(base: Path, label: str, reference_text: str, *, is_plugin: bool):
        recognised = (*KNOWN_SUBDIRS, *unreferenced_ok,
                      *(PLUGIN_ONLY_SUBDIRS if is_plugin else ()))
        for item in sorted(base.iterdir()):
            if item.name in ("SKILL.md", "README.md", "genome", "skills",
                              ".claude-plugin"):
                continue
            if item.is_dir():
                if item.name not in recognised:
                    warn(f"{label}: unrecognised folder '{item.name}/' -- "
                         f"{', '.join(KNOWN_SUBDIRS)} are the established names")
                continue
            warn(f"{label}: '{item.name}' sits loose at its root -- move it "
                 "into references/ (or scripts/, agents/, templates/) "
                 "instead of leaving it beside SKILL.md/README.md")

        for sub in (*KNOWN_SUBDIRS, *(PLUGIN_ONLY_SUBDIRS if is_plugin else ())):
            d = base / sub
            if not d.is_dir() or sub in unreferenced_ok or sub in PLUGIN_ONLY_SUBDIRS:
                continue
            for f in sorted(p for p in d.rglob("*") if p.is_file()):
                if sub == "agents":
                    check_agent_file(f, reference_text, f"{label}/{sub}/{f.name}")
                    continue
                if f.name not in reference_text:
                    warn(f"{label}: {sub}/{f.name} is never named anywhere "
                         "it would need to be to be reachable")

    for s in skills:
        scan_dir(s.path, s.rel, s.text, is_plugin=False)

    for man in sorted(root.glob("plugins/*/.claude-plugin/plugin.json")):
        plugin_dir = man.parent.parent
        label = plugin_dir.relative_to(root).as_posix()
        skill_texts = "\n".join(
            p.read_text(encoding="utf-8", errors="replace")
            for p in plugin_dir.glob("skills/*/SKILL.md")
        )
        readme = plugin_dir / "README.md"
        reference_text = skill_texts + (
            readme.read_text(encoding="utf-8", errors="replace")
            if readme.is_file() else ""
        )
        scan_dir(plugin_dir, label, reference_text, is_plugin=True)


def check_catalog(root: Path) -> None:
    """The README restates the manifests, so assert the two agree."""
    rc = subprocess.run(
        [sys.executable, str(root / "scripts" / "catalog.py"), "--check"],
        capture_output=True, text=True,
    )
    if rc.returncode != 0:
        err(rc.stderr.strip() or "README catalogue is out of date")


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    print(f"validating {root}\n")

    skills = check_skills(root)
    unreleased = check_manifests(root, skills)
    check_provenance(root, skills)
    check_marketplace(root)
    check_unpublished(root)
    check_organization(root, skills)
    check_catalog(root)
    check_readmes(root)

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
