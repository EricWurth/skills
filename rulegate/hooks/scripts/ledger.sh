#!/usr/bin/env bash
# rulegate evidence ledger — PostToolUse (all tools)
# Silently appends what actually ran. The claims gate reads this; nothing else does.
# Never blocks. Exit 0 always.
set -u

mkdir -p .rulegate 2>/dev/null || exit 0
LEDGER=".rulegate/ledger.jsonl"

TOOL="${CLAUDE_TOOL_NAME:-unknown}"
INPUT="${CLAUDE_TOOL_INPUT:-}"
OUTPUT="${CLAUDE_TOOL_OUTPUT:-}"
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Compact evidence: tool, timestamp, a fingerprint of the input, exit signal if present.
FP=$(printf '%s' "$INPUT" | head -c 300 | tr '\n' ' ' | sed 's/"/'"'"'/g')
EXIT=$(printf '%s' "$OUTPUT" | grep -oE '"(returncode|exit_code|exitCode)"[[:space:]]*:[[:space:]]*[0-9-]+' | head -1 | grep -oE '[0-9-]+$')
FAILTXT=""
if printf '%s' "$OUTPUT" | head -c 2000 | grep -qiE '(FAILED|Error|Traceback|[1-9][0-9]* failed)'; then
  FAILTXT="true"
fi

printf '{"ts":"%s","tool":"%s","exit":"%s","failure_text":"%s","input":"%s"}\n' \
  "$TS" "$TOOL" "${EXIT:-}" "${FAILTXT:-false}" "$FP" >> "$LEDGER" 2>/dev/null

exit 0
