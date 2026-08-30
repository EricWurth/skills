#!/usr/bin/env python3
"""Re-run the Phase 1 trajectory fixture set in `trajectory-fixtures.json`.

R-* cases are compliant runs the check must read as clean, including the two
goldens that touch the stop gate (G-3, G-7). D-* cases are runs the pre-change
surface could not distinguish from a healthy one: each carries a
`baseline_verdict`, which is what `stop_check.decide` returns on the finished
ledger. The case only counts as discriminating if that baseline is the same
verdict a correctly-run interview would have produced -- i.e. the old check
reports nothing wrong -- and the trajectory check reports a violation.

Usage: py -3 scripts/run_trajectory_fixtures.py
Exit 0 = all pass, 1 = at least one case failed.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from stop_check import decide  # noqa: E402
from trajectory_check import check  # noqa: E402

CASES = Path(__file__).resolve().parent / "trajectory-fixtures.json"


def main() -> int:
    cases = json.loads(CASES.read_text(encoding="utf-8"))["cases"]
    failed = 0
    for case in cases:
        findings = check(case["ledger"])
        got = "VIOLATIONS" if findings else "CLEAN"
        ok = got == case["expect"]

        # Discrimination cases must also name the check that fired, and must
        # show the pre-change surface reporting a normal verdict on the same
        # ledger -- otherwise the case proves nothing new.
        detail = ""
        if case["expect"] == "VIOLATIONS":
            wanted = case.get("expect_findings", [])
            fired = {f.split()[0] for f in findings}
            if not set(wanted) <= fired:
                ok = False
                detail = f" [wanted {wanted}, fired {sorted(fired)}]"
            baseline = decide(case["ledger"])[0]
            if baseline != case["baseline_verdict"]:
                ok = False
                detail += f" [baseline {baseline} != {case['baseline_verdict']}]"
            else:
                detail += f" [stop_check on the same ledger: {baseline}]"

        failed += not ok
        print(f"{'PASS' if ok else 'FAIL'}  {case['name']:<34} expect={case['expect']:<10} got={got}{detail}")
        for f in findings:
            print(f"          -> {f}")

    print(f"\n{len(cases) - failed}/{len(cases)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
