#!/usr/bin/env python3
"""Phase 1 stop gate for ai-fit-discovery.

The stop rule used to be self-assessed prose ("stop at saturation", "ask
yourself whether the answer would change the brief"). It fired late twice --
2026-08-17 (one question past the point the inventory could have been
written) and 2026-08-18 (one question past a stated time budget) -- because
the context deciding whether to ask another question is the same context
that wants to ask it.

This replaces the judgment with four countable triggers. Run it before every
Phase 1 question. It returns STOP with the trigger that fired, or CONTINUE
with what is still open.

Ledger schema (JSON):
  {
    "budget_minutes": 25 | null,      # a budget the person stated out loud
    "elapsed_minutes": 18,
    "lenses": {"recurring": "asked"|"assumed"|"open", "workflows": ...,
               "inverse": ..., "friction": ...},
    "turns": [{"new_items": 2, "stop_signal": false}, ...]
  }

Usage: py -3 stop_check.py <ledger.json>
Exit 0 = CONTINUE, exit 3 = STOP. Verdict on stdout.
"""

from __future__ import annotations

import json
import sys

LENSES = ("recurring", "workflows", "inverse", "friction")

# Reserve the last third of a stated budget for writing (SKILL.md, Phase 0).
BUDGET_FRACTION = 2.0 / 3.0

# Two consecutive answers adding nothing new is saturation.
SATURATION_RUN = 2


def decide(ledger: dict) -> tuple[str, str]:
    turns = ledger.get("turns", [])
    lenses = ledger.get("lenses", {})
    items = sum(t.get("new_items", 0) for t in turns)

    # 1. The person said so. Highest priority -- this is the trigger that
    #    fired latest in the 2026-08-17 run.
    if any(t.get("stop_signal") for t in turns):
        return "STOP", "explicit_signal: the person signalled they want output, not more questions"

    # 2. A stated budget is two-thirds spent. The last third is for writing.
    budget = ledger.get("budget_minutes")
    if budget:
        spent = ledger.get("elapsed_minutes", 0)
        if spent >= budget * BUDGET_FRACTION:
            return "STOP", (
                f"budget_exhausted: {spent} of {budget} stated minutes spent "
                f"(cap {budget * BUDGET_FRACTION:.1f}); the last third is for writing"
            )

    open_lenses = [l for l in LENSES if lenses.get(l, "open") == "open"]

    # 3. Saturation: a run of answers adding no new inventory item. Gated on
    #    the inverse lens being closed -- "the inverse is always asked" is a
    #    behavioral invariant, and G-3 is the golden that saturation on the
    #    other lenses must not short-circuit it.
    if items > 0 and len(turns) >= SATURATION_RUN and lenses.get("inverse", "open") != "open":
        tail = turns[-SATURATION_RUN:]
        if all(t.get("new_items", 0) == 0 for t in tail):
            return "STOP", f"saturation: last {SATURATION_RUN} answers added no new inventory item"

    # 4. Coverage complete and the last answer added nothing.
    if items > 0 and not open_lenses and turns and turns[-1].get("new_items", 0) == 0:
        return "STOP", "coverage_complete: all four lenses closed and the last answer added nothing"

    if open_lenses:
        return "CONTINUE", "open lenses: " + ", ".join(open_lenses)
    return "CONTINUE", "all lenses closed but the last answer is still producing items"


def main() -> int:
    ledger = json.loads(open(sys.argv[1], encoding="utf-8").read())
    verdict, reason = decide(ledger)
    print(f"{verdict} -- {reason}")
    return 3 if verdict == "STOP" else 0


if __name__ == "__main__":
    sys.exit(main())
