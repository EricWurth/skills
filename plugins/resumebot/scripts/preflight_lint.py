#!/usr/bin/env python3
"""Preflight lint for generated application documents (.docx or .md).

Every document must pass before delivery. Mechanical rules are built in;
user-specific forbidden names come from Profile/content-rules.md (any line
formatted `- \\`Name\\` ->` inside the Confidentiality section) or a plain
text file passed via --names (one forbidden term per line).

Usage:
  python preflight_lint.py FILE [FILE ...] [--names names.txt] [--allow-bold]

Exit code 0 = clean, 1 = violations found.

Rules:
  R1  no em dashes (and no spaced hyphen used as one)
  R2  no mid-sentence inline bold (docx: bold runs inside a paragraph that is
      not a heading/whole-line bold; md: **text** mid-line)
  R3  no certification claims unless whitelisted (--certs-ok)
  R4  no forbidden names (client list)
  R5  no education years (4-digit year adjacent to degree words)
  R6  no pre-conceding language ("although I lack", "despite not having",
      "while I don't have", "I may not have")
  R7  no unexecuted-work-as-delivered ("proposed and built" style conflations
      is a judgment call; here we flag "designed a proposed", "proposal for X
      delivered")
"""

import argparse
import re
import sys
from pathlib import Path

EM_DASH = re.compile(r"—|–| - ")
CERT_WORDS = re.compile(r"\b(PMP|CISA|CISSP|CPA|CSM|SAFe|AIGP|Six Sigma Black Belt|certified)\b", re.I)
EDU_YEAR = re.compile(r"\b(19|20)\d{2}\b")
DEGREE_WORDS = re.compile(r"\b(B\.?A\.?|B\.?S\.?|M\.?A\.?|M\.?S\.?|MBA|Ph\.?D|Bachelor|Master|degree|university|college)\b", re.I)
PRECONCEDE = re.compile(r"\b(although I lack|despite not having|while I don'?t have|I may not have|even though I have not)\b", re.I)
UNEXECUTED = re.compile(r"\b(designed a proposed|proposed and (built|delivered)|proposal .{0,30}(delivered|shipped))\b", re.I)
MD_INLINE_BOLD = re.compile(r"\S\*\*[^*]+\*\*|\*\*[^*]+\*\*\S")


def load_forbidden(names_file, content_rules):
    terms = []
    if names_file:
        terms += [l.strip() for l in Path(names_file).read_text(encoding="utf-8").splitlines()
                  if l.strip() and not l.startswith("#")]
    if content_rules and Path(content_rules).exists():
        for m in re.finditer(r"-\s*`([^`]+)`\s*(?:→|->)", Path(content_rules).read_text(encoding="utf-8")):
            terms.append(m.group(1).strip())
    return [t for t in terms if t and not t.startswith("<")]


def lint_text_line(line, forbidden, certs_ok):
    hits = []
    if EM_DASH.search(line):
        hits.append(("R1", "em dash (or spaced hyphen used as one)"))
    if not certs_ok and CERT_WORDS.search(line):
        hits.append(("R3", f"certification claim: {CERT_WORDS.search(line).group(0)!r}"))
    for term in forbidden:
        if re.search(rf"\b{re.escape(term)}\b", line, re.I):
            hits.append(("R4", f"forbidden name: {term!r}"))
    if DEGREE_WORDS.search(line) and EDU_YEAR.search(line):
        hits.append(("R5", "year adjacent to education"))
    if PRECONCEDE.search(line):
        hits.append(("R6", f"pre-conceding: {PRECONCEDE.search(line).group(0)!r}"))
    if UNEXECUTED.search(line):
        hits.append(("R7", "unexecuted work framed as delivered"))
    return hits


def lint_docx(path, forbidden, certs_ok, allow_bold):
    from docx import Document
    doc = Document(path)
    problems = []
    for i, para in enumerate(doc.paragraphs, 1):
        text = para.text
        if not text.strip():
            continue
        for rule, msg in lint_text_line(text, forbidden, certs_ok):
            problems.append((f"para {i}", rule, msg, text[:70]))
        if not allow_bold and not para.style.name.lower().startswith("heading"):
            runs = [r for r in para.runs if r.text.strip()]
            bold_runs = [r for r in runs if r.bold]
            if bold_runs and len(bold_runs) < len(runs):  # partial bold = inline bold
                problems.append((f"para {i}", "R2", "mid-sentence inline bold", text[:70]))
    return problems


def lint_md(path, forbidden, certs_ok, allow_bold):
    problems = []
    for i, line in enumerate(Path(path).read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        for rule, msg in lint_text_line(line, forbidden, certs_ok):
            problems.append((f"line {i}", rule, msg, line.strip()[:70]))
        if not allow_bold and MD_INLINE_BOLD.search(line):
            problems.append((f"line {i}", "R2", "mid-sentence inline bold", line.strip()[:70]))
    return problems


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("files", nargs="+")
    ap.add_argument("--names", help="text file of forbidden terms, one per line")
    ap.add_argument("--content-rules", help="Profile/content-rules.md to harvest forbidden names from")
    ap.add_argument("--certs-ok", action="store_true", help="user actually holds listed certifications")
    ap.add_argument("--allow-bold", action="store_true")
    args = ap.parse_args()

    forbidden = load_forbidden(args.names, args.content_rules)
    total = 0
    for f in args.files:
        p = Path(f)
        if p.suffix.lower() == ".docx":
            problems = lint_docx(p, forbidden, args.certs_ok, args.allow_bold)
        else:
            problems = lint_md(p, forbidden, args.certs_ok, args.allow_bold)
        if problems:
            print(f"\nFAIL {p}")
            for where, rule, msg, snippet in problems:
                print(f"  [{rule}] {where}: {msg}\n        > {snippet}")
            total += len(problems)
        else:
            print(f"PASS {p}")
    sys.exit(1 if total else 0)


if __name__ == "__main__":
    main()
