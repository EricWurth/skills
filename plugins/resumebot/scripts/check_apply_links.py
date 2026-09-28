#!/usr/bin/env python3
"""Check whether job apply pages actually load, the way the user will see them.

A plain HTTP fetch is not enough: Workday, Eightfold, Avature and other ATS
pages return 200 for dead postings and only render "the page you are looking
for doesn't exist" or "no longer accepting applications" after JavaScript runs.
Two tiers, cheapest first:
  1. ATS data endpoint. Workday, Greenhouse, Lever and Ashby publish the posting
     as JSON behind the career page. Asking the endpoint needs no rendering,
     rarely hits a bot wall, and usually returns the ATS's own posted date.
  2. Headless Chrome (a throwaway profile, never the user's) for every other
     ATS, or when the endpoint gives no clear answer.

Verdicts:
  live     posting exists and is open
  dead     posting missing or closed (safe to mark dead)
  unknown  didn't render, bot wall, or no apply control found (don't open it,
           don't mark it dead; check it in a real browser next)

Only `live` URLs belong in an apply-tabs batch.

CLI:
  python check_apply_links.py URL [URL ...]
  python check_apply_links.py --file urls.txt        # one URL per line; "id|url" also accepted
  Output: one JSON object per line:
    {"id", "url", "verdict", "reason", "source", "posted", "snippet"}
  source is "ats-api" or "headless"; posted is the ATS's date (YYYY-MM-DD) or null.
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
import urllib.error
import urllib.request
from datetime import datetime, timezone
from urllib.parse import urlparse

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


UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")
LOCALE = re.compile(r"^[a-z]{2}-[A-Z]{2}$")


def fetch_json(url, timeout=20):
    """Return (status, parsed_json_or_None). status is None on network failure."""
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8", errors="ignore")
            try:
                return resp.status, json.loads(body)
            except ValueError:
                return resp.status, None
    except urllib.error.HTTPError as e:
        return e.code, None
    except (urllib.error.URLError, TimeoutError, OSError):
        return None, None


def iso_date(value):
    if not value:
        return None
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value / 1000, tz=timezone.utc).strftime("%Y-%m-%d")
    m = re.match(r"(\d{4}-\d{2}-\d{2})", str(value))
    return m.group(1) if m else None


def workday_endpoint(u):
    parts = [p for p in u.path.split("/") if p]
    if "job" not in parts:
        return None
    i = parts.index("job")
    head, job = parts[:i], parts[i + 1:]
    if job and job[-1] == "apply":
        job = job[:-1]
    head = [p for p in head if not LOCALE.match(p)]
    if u.netloc.endswith(".myworkdayjobs.com"):
        if len(head) != 1:
            return None
        tenant, site = u.netloc.split(".")[0], head[0]
    elif u.netloc.endswith(".myworkdaysite.com"):
        if len(head) != 3 or head[0] != "recruiting":
            return None
        tenant, site = head[1], head[2]
    else:
        return None
    if not job:
        return None
    return f"https://{u.netloc}/wday/cxs/{tenant}/{site}/job/{'/'.join(job)}"


def check_via_api(url):
    """Ask the ATS's JSON endpoint. Returns (verdict, reason, posted) or None to fall through."""
    u = urlparse(url)
    host = u.netloc.lower()
    parts = [p for p in u.path.split("/") if p]

    if host.endswith((".myworkdayjobs.com", ".myworkdaysite.com")):
        endpoint = workday_endpoint(u)
        if not endpoint:
            return None
        status, data = fetch_json(endpoint)
        if status in (404, 410):
            return "dead", "ATS API: Workday posting not found", None
        if status == 200 and isinstance(data, dict) and data.get("jobPostingInfo"):
            info = data["jobPostingInfo"]
            posted = iso_date(info.get("startDate"))
            if info.get("canApply") is False:
                return "dead", "ATS API: Workday says applications are closed", posted
            return "live", "ATS API: Workday posting open", posted
        return None

    if host in ("job-boards.greenhouse.io", "boards.greenhouse.io") and len(parts) >= 3 and parts[1] == "jobs":
        board, job_id = parts[0], parts[2]
        status, data = fetch_json(f"https://boards-api.greenhouse.io/v1/boards/{board}/jobs/{job_id}")
        if status == 404:
            return "dead", "ATS API: Greenhouse posting not found", None
        if status == 200 and isinstance(data, dict) and data.get("id"):
            posted = iso_date(data.get("first_published") or data.get("updated_at"))
            return "live", "ATS API: Greenhouse posting open", posted
        return None

    if host == "jobs.lever.co" and len(parts) >= 2:
        company, posting = parts[0], parts[1]
        status, data = fetch_json(f"https://api.lever.co/v0/postings/{company}/{posting}")
        if status == 404:
            return "dead", "ATS API: Lever posting not found", None
        if status == 200 and isinstance(data, dict) and data.get("id"):
            return "live", "ATS API: Lever posting open", iso_date(data.get("createdAt"))
        return None

    if host == "jobs.ashbyhq.com" and len(parts) >= 2:
        org, job_id = parts[0], parts[1]
        status, data = fetch_json(f"https://api.ashbyhq.com/posting-api/job-board/{org}")
        if status == 200 and isinstance(data, dict) and isinstance(data.get("jobs"), list):
            match = next((j for j in data["jobs"] if j.get("id") == job_id), None)
            if match is None:
                return "dead", "ATS API: not on the Ashby job board", None
            return "live", "ATS API: Ashby posting open", iso_date(match.get("publishedAt"))
        return None

    return None


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

    chrome = None
    profile = tempfile.mkdtemp(prefix="resumebot-linkcheck-")
    try:
        for rid, url in items:
            text, source, posted = "", "headless", None
            if not url.lower().startswith(("http://", "https://")):
                verdict, reason, source = "unknown", "not a URL", "none"
            else:
                api = check_via_api(url)
                if api:
                    verdict, reason, posted = api
                    source = "ats-api"
                else:
                    chrome = chrome or find_chrome()
                    text = render_text(chrome, url, profile) or ""
                    verdict, reason = classify(text)
            print(json.dumps({"id": rid, "url": url, "verdict": verdict, "reason": reason,
                              "source": source, "posted": posted, "snippet": text[:200]}), flush=True)
    finally:
        shutil.rmtree(profile, ignore_errors=True)


if __name__ == "__main__":
    main()
