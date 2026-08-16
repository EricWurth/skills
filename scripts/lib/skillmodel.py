"""Shared model for reading skills, plugins, and bundles off disk.

Stdlib only, on purpose: these validators run on Windows without an install
step, and the packaging script they feed is Python already (muninn's
scripts/package.py, the only real packager in the collection before this).

Frontmatter parsing is deliberately dumb -- a top-level `key: value` scan of
the YAML block, no nested structures. Skill frontmatter is flat in practice,
and a real YAML dependency would mean an install step.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path

SKILL_NAME_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")

# Directories under skills/ that are staging areas, not shippable categories.
UNSHIPPABLE = {"in-progress", "deprecated"}

# Surfaces a package can target. A skill that shells out, writes files, or
# spawns subagents cannot run in plain web chat; the bundle builder enforces
# that a chat bundle contains only chat-capable packages.
SURFACES = {"code", "cowork", "chat"}


@dataclass
class Frontmatter:
    fields: dict[str, str] = field(default_factory=dict)
    present: bool = False

    def get(self, key: str, default: str = "") -> str:
        return self.fields.get(key, default)


def parse_frontmatter(text: str) -> Frontmatter:
    """Read a leading `---` delimited block as flat key: value pairs."""
    if not text.startswith("---"):
        return Frontmatter()
    end = text.find("\n---", 3)
    if end == -1:
        return Frontmatter()
    block = text[3:end]

    fields: dict[str, str] = {}
    key = None
    for raw in block.splitlines():
        if not raw.strip() or raw.lstrip().startswith("#"):
            continue
        m = re.match(r"^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$", raw)
        if m:
            key = m.group(1)
            value = m.group(2).strip()
            # `description: >` and `description: |` continue on later lines.
            fields[key] = "" if value in (">", "|", ">-", "|-") else value
        elif key and raw.startswith((" ", "\t")):
            fields[key] = (fields[key] + " " + raw.strip()).strip()
    return Frontmatter(fields=fields, present=True)


@dataclass
class Skill:
    path: Path          # the skill directory
    root: Path          # repo root, for reporting relative paths
    category: str       # reasoning/research/meta/in-progress/... or plugin name
    text: str = ""
    fm: Frontmatter = field(default_factory=Frontmatter)

    @property
    def dirname(self) -> str:
        return self.path.name

    @property
    def name(self) -> str:
        return self.fm.get("name")

    @property
    def rel(self) -> str:
        return self.path.relative_to(self.root).as_posix()

    @property
    def shippable(self) -> bool:
        return self.category not in UNSHIPPABLE

    @property
    def surfaces(self) -> list[str]:
        raw = self.fm.get("surfaces")
        if not raw:
            return []
        return [s.strip() for s in raw.strip("[]").split(",") if s.strip()]

    @property
    def user_invoked(self) -> bool:
        """Reachable only when the human types it -- never matched against,
        and never callable from another skill."""
        return self.fm.get("disable-model-invocation", "").lower() == "true"

    @property
    def has_genome(self) -> bool:
        return (self.path / "genome" / "intent.md").is_file()

    @property
    def has_provenance(self) -> bool:
        return (self.path / "PROVENANCE.md").is_file()

    @property
    def evals_path(self) -> Path:
        # Centralized, not co-located: evals/cases/<name>.json at the repo
        # root, never inside the skill's own directory. Skill names are
        # already globally unique (validate.py errors on a duplicate), so
        # flat naming can't collide, and living outside every skill and
        # plugin folder means the packager never has to know evals exist --
        # it only ever walks what a skill or plugin actually declares.
        return self.root / "evals" / "cases" / f"{self.dirname}.json"

    @property
    def has_evals(self) -> bool:
        return self.evals_path.is_file()


def find_skills(root: Path) -> list[Skill]:
    """Every directory containing a SKILL.md, anywhere under root."""
    skills: list[Skill] = []
    for skill_md in sorted(root.rglob("SKILL.md")):
        if ".git" in skill_md.parts or "node_modules" in skill_md.parts:
            continue
        d = skill_md.parent
        try:
            parts = d.relative_to(root).parts
        except ValueError:
            continue
        category = parts[-2] if len(parts) >= 2 else "(root)"
        text = skill_md.read_text(encoding="utf-8", errors="replace")
        skills.append(
            Skill(path=d, root=root, category=category, text=text,
                  fm=parse_frontmatter(text))
        )
    return skills


def find_plugin_manifests(root: Path) -> list[Path]:
    """Locate plugin.json files, wherever they landed."""
    found = []
    for p in sorted(root.rglob("plugin.json")):
        if ".git" in p.parts or "node_modules" in p.parts:
            continue
        found.append(p)
    return found


def load_json(path: Path) -> tuple[dict | None, str | None]:
    try:
        return json.loads(path.read_text(encoding="utf-8")), None
    except Exception as exc:  # malformed JSON is a finding, not a crash
        return None, str(exc)
