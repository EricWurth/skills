#!/usr/bin/env python3
"""Re-run the Phase 1 stop-gate fixture set in `stop-rule-fixtures.json`.

R-* cases are regression fixtures holding the golden examples the gate must
not break; D-* cases are discrimination fixtures holding the case the old
saturation-only rule got wrong. Each case carries its own `expect`.

Usage: py -3 scripts/run_stop_fixtures.py
Exit 0 = all pass, 1 = at least one case failed.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from stop_check import decide  # noqa: E402

CASES = Path(__file__).resolve().parent / "stop-rule-fixtures.json"


def main() -> int:
    cases = json.loads(CASES.read_text(encoding="utf-8"))["cases"]
    failed = 0
    for case in cases:
        verdict, reason = decide(case["ledger"])
        ok = verdict == case["expect"]
        failed += not ok
        print(
            f"{'PASS' if ok else 'FAIL'}  {case['name']:<32} "
            f"expect={case['expect']:<9} got={verdict} -- {reason}"
        )
    print(f"\n{len(cases) - failed}/{len(cases)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
