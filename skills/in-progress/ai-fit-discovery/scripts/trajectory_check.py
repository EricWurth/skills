#!/usr/bin/env python3
"""Phase 1 trajectory check for ai-fit-discovery.

`stop_check.py` decides whether to ask another question. It is a pure
function of the ledger's *current* state, so it can only ever be as honest
as the record it reads. Nothing in the skill verified that the gate was
actually consulted before a question, or that the verdict written down was
the verdict the gate would have returned. That leaves the original failure
one level up: the context that wants to ask the next question is still the
context that writes the record saying it was allowed to.

This reads the finished ledger as a *trajectory* and re-derives every turn's
verdict from the state that existed before that turn's question. Three
checks:

  T1 gate_consulted    -- every turn that asked a question recorded a verdict.
  T2 no_question_after_stop -- no question was asked on a turn whose recorded
                          verdict was STOP.
  T3 verdict_integrity -- the recorded verdict matches what `stop_check.decide`
                          returns when replayed against the ledger prefix that
                          preceded that turn. This is the check a narrative
                          "I ran the gate" cannot satisfy by assertion.

Ledger schema: `stop_check.py`'s, plus per turn:
    "asked": true|false        # was a Phase 1 question asked on this turn
    "gate":  "STOP"|"CONTINUE" # the verdict recorded before asking it
    "elapsed_minutes": 14      # optional: clock at gate time (else top-level)
    "lenses": {...}            # optional: lens state at gate time (else top-level)

Usage: py -3 trajectory_check.py <ledger.json>
Exit 0 = clean, exit 3 = violations. Findings on stdout.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from stop_check import decide  # noqa: E402


def replay(ledger: dict, index: int) -> str:
    """The verdict stop_check would have returned before turn `index` was asked."""
    turns = ledger.get("turns", [])
    turn = turns[index]
    prefix = {
        "budget_minutes": ledger.get("budget_minutes"),
        "elapsed_minutes": turn.get("elapsed_minutes", ledger.get("elapsed_minutes", 0)),
        "lenses": turn.get("lenses", ledger.get("lenses", {})),
        "turns": [
            {"new_items": t.get("new_items", 0), "stop_signal": t.get("stop_signal", False)}
            for t in turns[:index]
        ],
    }
    return decide(prefix)[0]


def check(ledger: dict) -> list[str]:
    findings: list[str] = []
    for i, turn in enumerate(ledger.get("turns", [])):
        asked = turn.get("asked", False)
        recorded = turn.get("gate")

        # T1 -- a question with no verdict behind it is an unconsulted gate.
        if asked and recorded is None:
            findings.append(
                f"T1 gate_consulted: turn {i} asked a question with no recorded gate verdict"
            )
            continue

        # T2 -- the gate said stop and the interview asked anyway.
        if asked and recorded == "STOP":
            findings.append(
                f"T2 no_question_after_stop: turn {i} asked a question after a recorded STOP"
            )

        # T3 -- the recorded verdict must survive replay. Checked on every turn
        #       that carries one, asked or not, so a fabricated CONTINUE cannot
        #       hide behind asked=false either.
        if recorded is not None:
            actual = replay(ledger, i)
            if recorded != actual:
                findings.append(
                    f"T3 verdict_integrity: turn {i} recorded {recorded}, "
                    f"replay of the state before it returns {actual}"
                )
    return findings


def main() -> int:
    ledger = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    findings = check(ledger)
    if not findings:
        print("CLEAN -- every Phase 1 question was gated, and every verdict survives replay")
        return 0
    for f in findings:
        print(f"VIOLATION  {f}")
    print(f"\n{len(findings)} violation(s)")
    return 3


if __name__ == "__main__":
    sys.exit(main())
