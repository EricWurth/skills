# ResumeBot 1Password Host

Native messaging host for the ResumeBot browser plugin. It bridges the
extension to the 1Password desktop app through `@1password/sdk` with
`DesktopAuth`: no CLI, no service-account token, the app's own approval
prompt.

## Prerequisites

1. Install the [1Password desktop app](https://1password.com/downloads/) and sign in.
2. 1Password → Settings → Developer → enable **Integrate with other apps**.
3. For biometric approval (recommended): Settings → Security → enable
   Windows Hello / Touch ID / system authentication.
4. Node.js 18 or later.

## Installation

### Linux / macOS

```bash
cd native-host
npm install
./install.sh <extension_id> <account_name> [vault_id]
```

### Windows

```powershell
cd native-host
npm install
.\install.ps1 <extension_id> <account_name> [vault_id]
```

Arguments are prompted for if omitted. The extension ID is shown on
`chrome://extensions` with Developer mode on; the account name is what the
1Password app shows at the top of its sidebar (an account UUID also works).
Restart Chrome afterwards.

## What the installer does

- Writes a launcher (`run-host.sh` / `run-host.cmd`) that pins the absolute
  path of `node`, because Chrome does not inherit your shell's PATH and
  Windows cannot run a `.js` file as a host.
- Writes the native messaging manifest `com.resumebot.op.json`: on Linux
  into `~/.config/google-chrome/NativeMessagingHosts/`, on macOS into
  `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/`, on
  Windows into `native-host/` with the registry key
  `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.resumebot.op`
  whose default value is the manifest path. Only your extension ID is
  allow-listed.
- Writes `config.json` with your account name and, optionally, the vault
  ID to use (default: your first personal/private vault). See
  `config.example.json`. All generated files are gitignored.

## How it works

Chrome starts `host.js` on demand and talks JSON over stdio with a 4-byte
little-endian length prefix per message. Three commands:

| cmd | fields | reply |
|---|---|---|
| `check` | `domain` | `{ exists, itemId? }` — is there a Login item for this domain |
| `create` | `domain`, `username`, `title` | `{ itemId, password }` — new Login item with a generated 32-char password |
| `get` | `itemId` | `{ username, password }` |

A locked app or expired desktop session answers `{ error: "locked" }` so the
extension can say "approve in 1Password" instead of failing. Other errors:
`unknown_cmd`, `bad_request`, `malformed_message`, `internal_error`.

The client is created lazily with `DesktopAuth(accountName)`; on first use
the app shows an authorization prompt naming the integration. SDK calls used
(checked against `@1password/sdk` 0.4.0 typings): `vaults.list()`,
`items.list(vaultId)` filtered on `category === "Login"` and
`websites[].url`, `items.create({ category, vaultId, title, fields,
websites })`, `items.get(vaultId, itemId)`, and the static
`Secrets.generatePassword({ type: "Random", parameters })`.

Secrets live only in the reply being written; nothing is cached or logged.
stderr logs command names, never arguments.

## Testing

```bash
npm test            # from the plugin root
```

`test/native-host.test.js` spawns `host.js` with `RESUMEBOT_TEST_MODE=true`,
which makes `opClient.js` return a mock client scripted through `MOCK_LIST`,
`MOCK_CREATE_RESOLVE`, `MOCK_GET_RESOLVE` and `MOCK_GENERATE_PASSWORD`
(`reject:<ErrorName>` simulates SDK errors). `test/install.test.js` runs
`install.sh` against a temporary HOME and checks the manifest, launcher and
config.

To poke the real host by hand, run the launcher and write a framed message
to its stdin, e.g. from Node:

```js
const m = Buffer.from(JSON.stringify({ cmd: "check", domain: "example.com" }));
const len = Buffer.alloc(4); len.writeUInt32LE(m.length);
process.stdout.write(Buffer.concat([len, m]));
```

## Notes

- Intended for the ResumeBot browser plugin only; do not allow-list other
  extensions in the manifest.
- If you change your 1Password account name or vault, edit `config.json`;
  Chrome restarts the host on next use.
