#!/usr/bin/env python3
"""Check whether job apply pages actually load, the way the user will see them.

A plain HTTP fetch is not enough: Workday, Eightfold, Avature and other ATS
pages return 200 for dead postings and only render "the page you are looking
for doesn't exist" or "no longer accepting applications" after JavaScript runs.
This script renders each URL in headless Chrome (a throwaway profile, never the
user's) and classifies the rendered text.

Verdicts:
  live     rendered, has an apply control, no closed-posting language
  dead     rendered with closed/missing-posting language (safe to mark dead)
  unknown  didn't render, bot wall, or no apply control found (don't open it,
           don't mark it dead; a person should look)

Only `live` URLs belong in an apply-tabs batch.

CLI:
  python check_apply_links.py URL [URL ...]
  python check_apply_links.py --file urls.txt        # one URL per line; "id|url" also accepted
  Output: one JSON object per line: {"id", "url", "verdict", "reason", "snippet"}
"""

import argparse
import html
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

CHROME_CANDIDATES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "google-chrome",
    "chromium",
]

DEAD_PATTERNS = [
    r"page you are looking for (?:doesn't|does not) exist",
    r"(?:job|position|posting|page|requisition) (?:is )?(?:not found|no longer (?:exists|available|active|open))",
    r"no longer accepting applications",
    r"no longer (?:available|accepting|open|active)",
    r"(?:this|the) (?:job|position|posting|role|requisition) (?:has been|was|is) (?:filled|closed|removed|expired)",
    r"(?:job|posting) has expired",
    r"posting (?:has )?closed",
    r"applications? (?:are|is) (?:now )?closed",
    r"\b404\b.{0,40}(?:not found|error)",
    r"sorry, (?:this|the) (?:job|position)",
]
BOT_WALL_PATTERNS = [
    r"verify you are (?:a )?human",
    r"checking your browser",
    r"enable javascript and cookies",
    r"access denied",
    r"are you a robot",
]
APPLY_PATTERN = r"\bapply\b"


def find_chrome():
    for c in CHROME_CANDIDATES:
        if os.path.isfile(c) or shutil.which(c):
            return c
    sys.exit("check_apply_links: Chrome not found")


def render_text(chrome, url, profile, budget_ms=15000, timeout=60):
    try:
        out = subprocess.run(
            [chrome, "--headless=new", "--disable-gpu", "--no-first-run",
             f"--user-data-dir={profile}", f"--virtual-time-budget={budget_ms}",
             "--dump-dom", url],
            capture_output=True, timeout=timeout,
        )
    except subprocess.TimeoutExpired:
        return None
    dom = out.stdout.decode("utf-8", errors="ignore")
    dom = re.sub(r"<script.*?</script>|<style.*?</style>|<noscript.*?</noscript>", " ", dom, flags=re.S | re.I)
    text = html.unescape(re.sub(r"<[^>]+>", " ", dom))
    return re.sub(r"\s+", " ", text).strip()


def classify(text):
    if not text or len(text) < 40:
        return "unknown", "page did not render"
    low = text.lower()
    for p in DEAD_PATTERNS:
        m = re.search(p, low)
        if m:
            return "dead", f"closed-posting language: \"{m.group(0)}\""
    for p in BOT_WALL_PATTERNS:
        m = re.search(p, low)
        if m:
            return "unknown", f"bot wall: \"{m.group(0)}\""
    if re.search(APPLY_PATTERN, low):
        return "live", "rendered with an apply control"
    return "unknown", "rendered but no apply control found"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("urls", nargs="*")
    ap.add_argument("--file")
    args = ap.parse_args()

    items = [(None, u) for u in args.urls]
    if args.file:
        with open(args.file, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                rid, _, url = line.rpartition("|") if "|" in line else ("", "", line)
                items.append((rid or None, url.strip()))
    if not items:
        ap.error("no URLs given")

    chrome = find_chrome()
    profile = tempfile.mkdtemp(prefix="resumebot-linkcheck-")
    try:
        for rid, url in items:
            if not url.lower().startswith(("http://", "https://")):
                verdict, reason, text = "unknown", "not a URL", ""
            else:
                text = render_text(chrome, url, profile) or ""
                verdict, reason = classify(text)
            print(json.dumps({"id": rid, "url": url, "verdict": verdict,
                              "reason": reason, "snippet": text[:200]}), flush=True)
    finally:
        shutil.rmtree(profile, ignore_errors=True)


if __name__ == "__main__":
    main()
