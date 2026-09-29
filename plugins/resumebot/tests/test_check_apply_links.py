"""Unit tests for check_apply_links.py's Eightfold tier (no network: fetch is stubbed)."""

import json
import sys
import unittest
from pathlib import Path
from urllib.parse import urlparse

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "scripts"))
import check_apply_links as cal  # noqa: E402

URL = "https://searchjobs.libertymutualgroup.com/careers/job/618519572821"


def load(name):
    return json.loads((HERE / "fixtures" / name).read_text(encoding="utf-8"))


def stub(search_fixture, job_status=200):
    calls = []

    def fetch(url):
        calls.append(url)
        if "/api/apply/v2/jobs/618519572821" in url:
            return (job_status, load("eightfold_job_618519572821.json") if job_status == 200 else None)
        if "/api/apply/v2/jobs?" in url:
            return 200, load(search_fixture)
        return None, None

    fetch.calls = calls
    return fetch


class EightfoldTier(unittest.TestCase):
    def check(self, fetch, url=URL):
        return cal.check_eightfold(urlparse(url), "618519572821", fetch=fetch)

    def test_closed_job_missing_from_search_is_dead(self):
        verdict, reason, posted = self.check(stub("eightfold_search_closed.json"))
        self.assertEqual(verdict, "dead")
        self.assertIn("open-jobs search", reason)
        self.assertEqual(posted, "2026-08-31")

    def test_open_job_listed_in_search_is_live(self):
        fetch = stub("eightfold_search_open.json")
        verdict, _, posted = self.check(fetch)
        self.assertEqual(verdict, "live")
        self.assertEqual(posted, "2026-08-31")
        self.assertIn("query=2026-244289", fetch.calls[1])

    def test_job_json_404_is_dead(self):
        verdict, _, _ = self.check(stub("eightfold_search_open.json", job_status=404))
        self.assertEqual(verdict, "dead")

    def test_unreachable_job_json_falls_through(self):
        self.assertIsNone(self.check(lambda url: (None, None)))

    def test_domain_param_is_passed_through(self):
        fetch = stub("eightfold_search_open.json")
        self.check(fetch, URL + "?microsite=libertymutual.com")
        self.assertTrue(all("domain=libertymutual.com" in c for c in fetch.calls))

    def test_router_tags_source_eightfold(self):
        orig = cal.fetch_json
        cal.fetch_json = stub("eightfold_search_closed.json")
        try:
            self.assertEqual(cal.check_via_api(URL)[3], "eightfold")
        finally:
            cal.fetch_json = orig

    def test_other_ats_keep_ats_api_source(self):
        orig = cal.fetch_json
        cal.fetch_json = lambda url: (404, None)
        try:
            r = cal.check_via_api("https://jobs.lever.co/acme/abc-123")
            self.assertEqual((r[0], r[3]), ("dead", "ats-api"))
        finally:
            cal.fetch_json = orig


if __name__ == "__main__":
    unittest.main()
