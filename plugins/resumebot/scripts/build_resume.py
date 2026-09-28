#!/usr/bin/env python3
"""Render a resumebot markdown resume (master cut / variant) to a .docx.

Single-column, ATS-safe format (no tables, text boxes, fields, headers or
footers): Calibri, centered bold name, 12pt bold caps section headers over a
thin rule, 10.5pt body, 0.7" side margins and 0.5" top/bottom. Headings and
employer/role lines stay with the text that follows, so nothing is stranded at
a page break. Document properties (author, title, dates) are set at build time
and the template thumbnail is removed. Requires python-docx.

Input markdown conventions (see examples/ExampleMasterResume.md):
  # Name                     -> centered bold, --name-size
  first non-empty line after -> centered contact line (pipes kept)
  lines before the first ##  -> centered bold headline (e.g. target title)
  ## Section                 -> bold caps section header with rule line
  ### Employer, City | dates -> bold employer line
  **Title** | dates          -> bold role line
  - bullet                   -> bulleted body text
  plain paragraph            -> body text (summary, scope lines)
Blockquote lines (>) and horizontal rules (---) are skipped: they are
master-document annotations, never submission content.

Usage:
  python build_resume.py input.md output.docx [--name-size 16] [--body-size 10.5] [--side-margin 0.7]
"""

import argparse
import os
import re
import shutil
import sys
import tempfile
import zipfile
from datetime import datetime, timezone
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt

BODY = 10.5
HEADER = 12
ROLE_LINE = re.compile(r"^\*\*[^*]+\*\*\s*\|")


def add_rule(para):
    """Thin bottom border on a paragraph: a rule line that parsers read as plain text."""
    ppr = para._p.get_or_add_pPr()
    bdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    for k, v in (("w:val", "single"), ("w:sz", "6"), ("w:space", "1"), ("w:color", "000000")):
        bottom.set(qn(k), v)
    bdr.append(bottom)
    ppr.append(bdr)


def strip_thumbnail(path: Path):
    """Remove the python-docx template thumbnail and its relationship."""
    fd, name = tempfile.mkstemp(suffix=".docx")
    os.close(fd)  # Windows can't replace a file with an open handle
    tmp = Path(name)
    with zipfile.ZipFile(path) as zin, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            if item.filename.startswith("docProps/thumbnail"):
                continue
            data = zin.read(item.filename)
            if item.filename == "_rels/.rels":
                data = re.sub(rb'<Relationship [^>]*thumbnail[^>]*/>', b"", data)
            if item.filename == "[Content_Types].xml":
                data = re.sub(rb'<Override [^>]*thumbnail[^>]*/>', b"", data)
            zout.writestr(item, data)
    shutil.move(tmp, path)


def add_run(para, text, bold=False, size=BODY):
    """Add text, honoring **bold** spans (structural bold only — the lint
    gate rejects mid-sentence bold in generated output, so use sparingly)."""
    parts = re.split(r"(\*\*[^*]+\*\*)", text)
    for part in parts:
        if not part:
            continue
        if part.startswith("**") and part.endswith("**"):
            r = para.add_run(part[2:-2])
            r.bold = True
        else:
            r = para.add_run(part)
            r.bold = bold
        r.font.size = Pt(size)
        r.font.name = "Calibri"


def build(md_path: Path, out_path: Path, name_size: int, body: float, side_margin: float):
    doc = Document()
    for section in doc.sections:
        section.top_margin = section.bottom_margin = Inches(0.5)
        section.left_margin = section.right_margin = Inches(side_margin)
    style = doc.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(body)

    lines = md_path.read_text(encoding="utf-8").splitlines()
    saw_name = False
    expect_contact = False
    in_header = False  # between the contact line and the first ## section
    name = ""
    headline = ""

    for raw in lines:
        line = raw.rstrip()
        stripped = line.strip()
        if not stripped or stripped.startswith(">") or set(stripped) <= {"-"} and len(stripped) >= 3:
            continue

        if stripped.startswith("# ") and not saw_name:
            name = stripped[2:].replace("**", "").strip()
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            add_run(p, name, bold=True, size=name_size)
            p.paragraph_format.space_after = Pt(2)
            saw_name = True
            expect_contact = True
        elif expect_contact and not stripped.startswith("#"):
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            add_run(p, re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", stripped).replace("**", ""), size=body)
            p.paragraph_format.space_after = Pt(8)
            expect_contact = False
            in_header = True
        elif in_header and not stripped.startswith("#"):
            headline = headline or stripped.replace("**", "").strip()
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            add_run(p, stripped.replace("**", ""), bold=True, size=HEADER)
            p.paragraph_format.space_after = Pt(6)
        elif stripped.startswith("## "):
            in_header = False
            p = doc.add_paragraph()
            add_run(p, stripped[3:].upper(), bold=True, size=HEADER)
            add_rule(p)
            p.paragraph_format.space_before = Pt(10)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.keep_with_next = True
        elif stripped.startswith("### "):
            p = doc.add_paragraph()
            add_run(p, stripped[4:], bold=True, size=body)
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(1)
            p.paragraph_format.keep_with_next = True
        elif stripped.startswith("- "):
            p = doc.add_paragraph(style="List Bullet")
            add_run(p, stripped[2:], size=body)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.keep_together = True
        else:
            p = doc.add_paragraph()
            add_run(p, stripped, size=body)
            p.paragraph_format.space_after = Pt(3)
            if ROLE_LINE.match(stripped):
                p.paragraph_format.keep_with_next = True

    cp = doc.core_properties
    now = datetime.now(timezone.utc).replace(microsecond=0)
    cp.author = cp.last_modified_by = name
    cp.title = f"{name} Resume" + (f" | {headline}" if headline else "")
    cp.comments = cp.subject = cp.keywords = cp.category = ""
    cp.created = cp.modified = now
    cp.revision = 1

    out_path.parent.mkdir(parents=True, exist_ok=True)
    doc.save(out_path)
    strip_thumbnail(out_path)
    print(f"wrote {out_path}")


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("input")
    ap.add_argument("output")
    ap.add_argument("--name-size", type=int, default=16)
    ap.add_argument("--body-size", type=float, default=BODY)
    ap.add_argument("--side-margin", type=float, default=0.7)
    args = ap.parse_args()
    if not Path(args.input).exists():
        sys.exit(f"error: {args.input} not found")
    build(Path(args.input), Path(args.output), args.name_size, args.body_size, args.side_margin)


if __name__ == "__main__":
    main()
