#!/usr/bin/env bash
# rulegate scope gate — PreToolUse (Write|Edit|Bash)
# Blocks file mutations outside the CURRENT plan step's declared scope.
# Exit 0 = allow. Exit 2 = block (message on stdout goes to Claude).
set -u

PLAN=".rulegate/plan.md"
INPUT="${CLAUDE_TOOL_INPUT:-}"

# No plan, no gate. rulegate only binds work that went through the front gate.
[ -f "$PLAN" ] || exit 0
[ -n "$INPUT" ] || exit 0

# Extract the CURRENT step's files: line.
SCOPE=$(awk '/^## CURRENT/{f=1} f && /^files:/{sub(/^files:[ ]*/,""); print; exit}' "$PLAN")
[ -n "$SCOPE" ] || exit 0
[ "$SCOPE" = "*" ] && exit 0

# Pull candidate paths out of the tool input JSON (file_path fields, and
# common write-ish targets inside bash commands).
PATHS=$(printf '%s' "$INPUT" | grep -oE '"file_path"[[:space:]]*:[[:space:]]*"[^"]+"' | sed 's/.*:[[:space:]]*"//; s/"$//')
if [ -z "$PATHS" ]; then
  CMD=$(printf '%s' "$INPUT" | grep -oE '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*:[[:space:]]*"//; s/"$//')
  # Only gate bash commands that plausibly mutate files; reads pass freely.
  if printf '%s' "$CMD" | grep -qE '(^|[;&| ])(rm|mv|cp|tee|sed[[:space:]]+-i|>[^>]|>>)'; then
    PATHS=$(printf '%s' "$CMD" | grep -oE '[A-Za-z0-9_./-]+\.[A-Za-z0-9]+' | sort -u)
  fi
fi
[ -n "$PATHS" ] || exit 0

# Ledger and plan are always writable (the machinery must not gate itself).
IN_SCOPE=0
OUT_OF_SCOPE=""
while IFS= read -r p; do
  [ -n "$p" ] || continue
  case "$p" in .rulegate/*) continue;; esac
  MATCHED=0
  for pat in $SCOPE; do
    # shellcheck disable=SC2254
    case "$p" in $pat) MATCHED=1; break;; esac
  done
  if [ "$MATCHED" -eq 0 ]; then
    OUT_OF_SCOPE="$OUT_OF_SCOPE $p"
  fi
done << EOF
$PATHS
EOF

if [ -n "$OUT_OF_SCOPE" ]; then
  echo "rulegate scope gate: BLOCKED. Target(s)$OUT_OF_SCOPE outside current step scope [$SCOPE]."
  echo "Do not fix this inline. Report the discovered work in your reply so it re-enters through the front gate as its own planned task, or advance the plan to a step that declares this scope."
  exit 2
fi
exit 0
