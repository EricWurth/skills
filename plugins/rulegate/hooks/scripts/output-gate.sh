#!/usr/bin/env bash
# rulegate output gate — Stop
# Two deterministic, blocking checks on the finished reply:
#   1. Lint: STYLE rules from RULES.md (regex per rule).
#   2. Claims: completion language requires fresh ledger evidence of a passing check.
# Exit 0 = release the reply. Exit 2 = block with reason (Claude revises).
set -u

RULES=".rulegate/RULES.md"
LEDGER=".rulegate/ledger.jsonl"
REPLY="${CLAUDE_STOP_REPLY:-${CLAUDE_ASSISTANT_MESSAGE:-}}"

[ -f "$RULES" ] || exit 0
[ -n "$REPLY" ] || exit 0

# ---- 1. Lint pass: STYLE section, lines of the form  regex :: message
VIOLATIONS=""
IN_STYLE=0
while IFS= read -r line; do
  case "$line" in
    "## STYLE"*) IN_STYLE=1; continue;;
    "## "*) IN_STYLE=0;;
  esac
  [ "$IN_STYLE" -eq 1 ] || continue
  case "$line" in
    lint:*)
      RULE="${line#lint:}"
      PATTERN="${RULE%%::*}"
      MSG="${RULE#*::}"
      PATTERN=$(printf '%s' "$PATTERN" | sed 's/^ *//; s/ *$//')
      MSG=$(printf '%s' "$MSG" | sed 's/^ *//; s/ *$//')
      [ -n "$PATTERN" ] || continue
      if printf '%s' "$REPLY" | grep -qE "$PATTERN"; then
        VIOLATIONS="$VIOLATIONS\n- style: $MSG"
      fi
      ;;
  esac
done < "$RULES"

# ---- 2. Claims pass: completion language must be backed by fresh evidence.
CLAIMS_RE='(all tests pass|tests pass|tests are passing|verified|fully working|build succeed|successfully deploy|everything works|confirmed working|done and working)'
if printf '%s' "$REPLY" | grep -qiE "$CLAIMS_RE"; then
  RECENT_OK=0
  if [ -f "$LEDGER" ]; then
    # Fresh = last 20 ledger entries contain a check-shaped command that did not fail.
    if tail -20 "$LEDGER" | grep -E '"input":"[^"]*(test|pytest|make|build|lint|check|verify)' | grep -q '"failure_text":"false"'; then
      RECENT_OK=1
    fi
    # Any fresh failure text contradicts a green claim outright.
    if tail -20 "$LEDGER" | grep -q '"failure_text":"true"'; then
      RECENT_OK=0
    fi
  fi
  if [ "$RECENT_OK" -eq 0 ]; then
    VIOLATIONS="$VIOLATIONS\n- claims: reply asserts completion/verification but the ledger has no fresh passing check (or has fresh failures). Run the canonical check now, or restate as unverified."
  fi
fi

if [ -n "$VIOLATIONS" ]; then
  echo "rulegate output gate: BLOCKED. Revise the reply:"
  printf '%b\n' "$VIOLATIONS"
  exit 2
fi
exit 0
