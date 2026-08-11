#!/usr/bin/env python3
"""
document-forge lint: mechanical checks only.
Anything checkable by pattern-matching should never be left to judgment.
Run: python lint.py <path-to-draft.md>

Deliberately tuned to avoid false positives. A linter that fires on every
line gets ignored, and then the real violations get ignored with it.

Two categories of finding, and the distinction is load-bearing:

- CONFIRMED: unsourced numeric claims. This check is universal - any
  business document benefits from tracing its numbers to a source or an
  [assumption] tag. Always real, always worth fixing.
- GENERIC DEFAULT, UNCONFIRMED: the em-dash ban and filler-opener list
  below. These shipped with the skill template as ONE EXAMPLE author's
  style rules, not as this project's confirmed rules. Before treating a
  finding in this category as a defect, check whether it's actually
  written down in this project's context/tone-of-voice.md. If it isn't,
  the finding is informational, not a failure to fix - see SKILL.md
  Stage 0 step 2.
"""
import re
import sys

# Numbers that are structural or referential, not factual claims.
SKIP_LINE_PATTERNS = [
    r"^\s{0,3}#{1,6}\s",          # markdown headers
    r"^\s*\d+[.)]\s",              # ordered list numbering
    r"^\s*[-*+]\s*\d+[.)]\s",      # nested ordered list
    r"^\s*\|",                     # table rows (source cited in table, not inline)
    r"^\s*```",                    # code fences
]

# Number-like strings that aren't claims even mid-sentence.
NON_CLAIM_NUMBERS = [
    r"\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b",
    r"\b\d{4}-\d{2}-\d{2}\b",                      # ISO dates
    r"\bQ[1-4]\b",                                  # quarters
    r"\b(?:section|stage|step|figure|table|appendix|page|item|phase|part)\s+\d+\s*[–-]\s*\d+\b",  # ranges: "Phase 1-2"
    r"\b(?:section|stage|step|figure|table|appendix|page|item|phase|part)\s+\d+\b",
    r"\bday\s+\d+\b",                               # "day 1"
    r"\b\d+-day\b",                                 # named-ritual compounds: "90-day retro"
    r"\b\d+\s*min(?:ute)?s?\b",                     # meeting durations: "30 min"
    r"\b\d+:\d+s?\b",                               # shorthand like "1:1s"
    r"\b\d{4}\b(?=\s|$|[.,;:])",                    # bare years
]

# GENERIC DEFAULT, UNCONFIRMED - a template example, not this project's rule
# until context/tone-of-voice.md actually says so. See module docstring.
FILLER_OPENERS = [
    r"^\s*In today's",
    r"^\s*It's important to note",
    r"^\s*It is worth noting",
    r"^\s*As we all know",
    r"^\s*Needless to say",
    r"^\s*At the end of the day",
]

CLAIM_NUMBER = re.compile(r"\b\d[\d,.]*\s*(?:%|percent|k|m|bn|billion|million|thousand)?\b", re.I)


def line_is_structural(line):
    return any(re.match(p, line, re.I) for p in SKIP_LINE_PATTERNS)


def strip_non_claims(line):
    out = line
    for p in NON_CLAIM_NUMBERS:
        out = re.sub(p, "", out, flags=re.I)
    return out


def check(path):
    text = open(path, encoding="utf-8").read()
    lines = text.split("\n")
    confirmed = []       # always real: unsourced numeric claims
    generic_default = []  # only real once confirmed in tone-of-voice.md

    for i, line in enumerate(lines, 1):
        # Em dash / double hyphen: GENERIC DEFAULT, unconfirmed until this
        # project's tone-of-voice.md actually says so.
        if "—" in line or " -- " in line:
            generic_default.append(f"line {i}: em dash or double-hyphen (generic default, unconfirmed - check context/tone-of-voice.md)")

        # Throat-clearing openers: same category, same caveat.
        for pat in FILLER_OPENERS:
            if re.match(pat, line, re.I):
                generic_default.append(f"line {i}: throat-clearing opener (generic default, unconfirmed - check context/tone-of-voice.md)")
                break

        # Unsourced numeric claims, skipping structural and referential numbers
        if line_is_structural(line):
            continue
        if "[source:" in line or "[assumption]" in line:
            continue
        stripped = strip_non_claims(line)
        if CLAIM_NUMBER.search(stripped):
            confirmed.append(f"line {i}: numeric claim with no [source: ] or [assumption] tag")

    if confirmed:
        print(f"CONFIRMED - {len(confirmed)} finding(s), always real:\n")
        for f in confirmed:
            print(f"  - {f}")
        print()

    if generic_default:
        print(f"GENERIC DEFAULT, UNCONFIRMED - {len(generic_default)} finding(s) against a template example rule, not yet checked against this project's context/tone-of-voice.md:\n")
        for f in generic_default:
            print(f"  - {f}")
        print("\nThese are informational until confirmed. Check context/tone-of-voice.md before bulk-fixing - if it doesn't ban em dashes or these openers, leave them and don't treat this as a failure.\n")

    if confirmed:
        print("FAIL - confirmed findings need fixing.")
        return 1
    print("PASS - no confirmed findings. (See above if any generic-default findings need a decision.)")
    print("Judgment-based checks (stages 6, 8) still required separately.")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python lint.py <path-to-draft.md>")
        sys.exit(2)
    sys.exit(check(sys.argv[1]))
