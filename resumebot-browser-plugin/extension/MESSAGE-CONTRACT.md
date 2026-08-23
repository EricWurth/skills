# chrome.runtime message contract

Single source of truth for every message the extension passes around. Two
directions: **popup/options/content → service worker** (`chrome.runtime.
sendMessage`, handled by the `switch` in `service-worker.js`), and
**service worker → content script** (`chrome.tabs.sendMessage` per frame,
handled by `main.js`'s `handleMessage`).
If this doc and the code ever disagree, the code wins and this doc is stale;
fix the doc, don't guess.

**Why this file exists:** four separate bugs in this project were the same
mistake — a caller sent or read a field one level away from where the handler
puts it (`entry` vs `data.entry`; `credentialStatus` as a sibling of `status`
instead of inside it). Check here before writing a call site or a test mock.

Every message is `{ action: '<name>', ...top-level fields }`. There is NO
generic `data` wrapper except where the table says `data`. Every response is
`{ success: true|false, ... }`; on failure `{ success: false, error }`.

## To the service worker

| action | request fields | response |
|---|---|---|
| `getProfile` | — | `{ success, data: <profile> }` (schema-defaulted) |
| `setProfile` | `data` (full profile) | `{ success }` |
| `qaGet` | `key` | `{ success, data: <entry or null> }` |
| `qaUpsert` | `entry` (full entry incl. `key`) — NOT `data.entry` | `{ success }` |
| `qaList` | — | `{ success, data: { entries: [...] } }` — note the `entries` wrapper |
| `qaDelete` | `key` — NOT `data.key` | `{ success }` |
| `incrementTimesUsed` | `key`, `wasReviewed` | `{ success }` (`wasReviewed: true` also clears `reviewBeforeFill`) |
| `qaAddAlias` | `key`, `alias` | `{ success }` |
| `qaUpsertMany` | `entries` (array of full entries) | `{ success }` — one read-modify-write; the capture panel and import use this |
| `getSiteRegistry` | — | `{ success, data: { domains, atsOverrides, fieldOverrides } }` |
| `setSiteRegistry` | `data` (registry keys to replace) | `{ success }` — merged over the stored registry at the top level, so sending only `{ atsOverrides }` leaves `domains` and `fieldOverrides` intact |
| `check1PasswordCredential` | `domain` | `{ success, exists, itemId? }` or `{ success: true, locked: true }` |
| `create1PasswordCredential` | `domain`, `username`, `title` | `{ success, itemId, password }` or locked |
| `get1PasswordCredential` | `itemId` | `{ success, username, password }` or locked |
| `scan` | — | `{ success, fields, matches, ats }` aggregated over all frames of the active tab |
| `fill` | — | `{ success, fieldCount, matchCount, attempted, filled, captured, ats }` aggregated |
| `getStatus` | — | `{ success, status }` — see below |
| `createLogin` | `title?` | `{ success, itemId, filled }` or locked; creates the 1Password item, fills the page, records the domain |
| `fillLogin` | — | `{ success, filled }` or locked |
| `injectContentScripts` | `tabId?` | `{ success }` — after the popup obtained an optional host permission |
| `scanResult` | `count`, `ats?` — sent BY content scripts (`fields` array also accepted) | `{ success }`; updates the tab badge (summed across frames) |

`getStatus` → `status` shape:

```
{
  ats: 'workday' | 'greenhouse' | 'lever' | 'icims' | null,
  lastScan: { fieldCount, matchCount },
  credentialStatus: { hasCredential, locked },   // INSIDE status; locked = last answer the native host gave
  needsPermission: boolean,                       // INSIDE status
  page: { isAccountCreation, hasPasswordField, hasUsernameField } | null
}
```

## To content scripts (per frame)

| action | request fields | handled in | response |
|---|---|---|---|
| `scanFromContent` | — | main.js | `{ success, fields }` raw field report |
| `scanAndMatchFromContent` | `profile`, `qaMemory` (entries array or `{entries}`), `siteRegistry?` | main.js | `{ success, fields, matches, ats }` |
| `fillFromContent` | — | main.js | `{ success, fieldCount, matchCount, attempted, filled, captured, ats }` |
| `fillCredentials` | `username`, `password`, `hostname` | main.js | `{ success, filled, passwordFields, skipped? }` — the ONLY path that fills a password field; a frame whose origin is not `hostname` fills nothing (`skipped: "origin"`) |
| `pageInfo` | — | main.js | `{ success, ats, hostname, fieldCount, hasPasswordField, hasUsernameField, isAccountCreation }` |
| `remapField` | — (acts on the last right-clicked element) | main.js | `{ success, key, ats, choice, filled }` or `{ success: false, error }` |

## Native host (stdio, 4-byte LE length prefix)

| cmd | fields | reply |
|---|---|---|
| `check` | `domain` | `{ exists, itemId? }` |
| `create` | `domain`, `username`, `title` | `{ itemId, password }` |
| `get` | `itemId` | `{ username, password }` |
| any | — | `{ error: 'locked' }` when the app is locked / session expired; `{ error: 'unknown_cmd' \| 'bad_request' \| 'malformed_message' \| 'internal_error' }` otherwise |

## When you add an action

1. Add it to the handler (`service-worker.js` switch, or `main.js` `handleMessage`) first. Content modules other than main.js do not touch `chrome.*`; they get what they need as arguments.
2. Add a row here in the same commit.
3. Never let a test mock a response shape that doesn't match this file.
