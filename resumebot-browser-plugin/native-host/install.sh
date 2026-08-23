#!/usr/bin/env bash
# ResumeBot 1Password host installer for Linux/macOS
# Usage: ./install.sh <extension_id> <account_name> [vault_id]
# If arguments are omitted, the script prompts for them.
#
# What it does:
#   1. writes run-host.sh, a launcher that pins the absolute path of `node`
#      (Chrome does not inherit your shell PATH, so "node" alone fails);
#   2. writes the native messaging manifest com.resumebot.op.json into the
#      Chrome NativeMessagingHosts directory, allow-listing your extension;
#   3. writes config.json with your 1Password account name.

set -e

prompt() {
  local message="$1"
  local variable_name="$2"
  if [ -z "${!variable_name}" ]; then
    read -r -p "$message: " input
    export "$variable_name"="$input"
  fi
}

EXTENSION_ID="$1"
ACCOUNT_NAME="$2"
VAULT_ID="${3:-}"
prompt "Enter the Chrome extension ID" EXTENSION_ID
prompt "Enter your 1Password account name (as shown in the app sidebar)" ACCOUNT_NAME

if [ -z "$EXTENSION_ID" ]; then echo "Error: Extension ID cannot be empty" >&2; exit 1; fi
if [ -z "$ACCOUNT_NAME" ]; then echo "Error: Account name cannot be empty" >&2; exit 1; fi

case "$(uname -s)" in
  Linux*)  HOST_DIR="$HOME/.config/google-chrome/NativeMessagingHosts" ;;
  Darwin*) HOST_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts" ;;
  *) echo "Unsupported OS: $(uname -s)" >&2; exit 1 ;;
esac
mkdir -p "$HOST_DIR"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOST_JS_PATH="$SCRIPT_DIR/host.js"
LAUNCHER="$SCRIPT_DIR/run-host.sh"
NODE_BIN="${NODE_BIN:-$(command -v node || true)}"
if [ -z "$NODE_BIN" ]; then
  echo "Error: node not found on PATH (install Node.js 18+ or set NODE_BIN)" >&2
  exit 1
fi

if [ ! -d "$SCRIPT_DIR/node_modules/@1password/sdk" ] && [ ! -d "$SCRIPT_DIR/../node_modules/@1password/sdk" ]; then
  echo "Note: @1password/sdk is not installed yet. Run: (cd \"$SCRIPT_DIR\" && npm install)"
fi

cat > "$LAUNCHER" <<LAUNCH
#!/usr/bin/env bash
exec "$NODE_BIN" "$HOST_JS_PATH"
LAUNCH
chmod +x "$LAUNCHER" "$HOST_JS_PATH"

MANIFEST_FILE="$HOST_DIR/com.resumebot.op.json"
cat > "$MANIFEST_FILE" <<MANIFEST
{
  "name": "com.resumebot.op",
  "description": "ResumeBot 1Password host",
  "path": "$LAUNCHER",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://$EXTENSION_ID/"
  ]
}
MANIFEST

CONFIG_FILE="$SCRIPT_DIR/config.json"
cat > "$CONFIG_FILE" <<CONFIG
{
  "accountName": "$ACCOUNT_NAME",
  "vaultId": "$VAULT_ID",
  "extensionId": "$EXTENSION_ID"
}
CONFIG

echo "Installation successful:"
echo "  Launcher written to: $LAUNCHER (node: $NODE_BIN)"
echo "  Manifest written to: $MANIFEST_FILE"
echo "  Config written to:   $CONFIG_FILE"
echo
echo "Prerequisites (cannot be automated):"
echo "  1. Install the 1Password desktop app (https://1password.com/downloads/)"
echo "  2. 1Password Settings -> Developer -> enable \"Integrate with other apps\""
echo "  3. For biometric approval: Settings -> Security -> enable Touch ID / system authentication"
echo
echo "Restart Chrome so it picks up the new host manifest."
