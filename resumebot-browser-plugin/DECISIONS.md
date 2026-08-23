# DECISIONS.md

This file logs every decision not covered by PLAN.md, with rationale.

## Purpose
To record architectural and implementation decisions made during development that are not explicitly detailed in PLAN.md, ensuring transparency and traceability for future maintenance and collaboration.

## Decision Log

### 2026-07-22: Matcher Implementation Approach
*(Historical: the namespace was `ApplyOnce` then; it is `ResumeBot` since the 2026-08-22 import. The pattern is unchanged.)*
**Decision**: Implemented matcher as a dual-environment module that works in both Chrome extension context and Node.js test environment.
**Rationale**: Following the established pattern from scanner.js, the matcher needs to be accessible via `window.ApplyOnce.matcher` in Chrome content scripts and via `require()` in Node.js tests. Used the IIFE pattern with `root.ApplyOnce` assignment and `module.exports` for Node compatibility.

**Exact Gap**: The popup.js script executes immediately upon eval in the test environment, sending a getStatus request before the test's mock is fully set up.

### 2026-07-22: Synonym Dictionary Structure
**Decision**: Created synonyms.json as a flat JSON file mapping profile paths to arrays of synonym variations, loaded directly into the matcher module for performance.
**Rationale**: Keeping the synonym dictionary as a standalone JSON file allows it to grow without code changes, as specified in the requirements. Loading it directly into the matcher avoids runtime file I/O in the extension context.

### 2026-07-22: Matching Algorithm Confidence Scoring
**Decision**: Assigned confidence scores of 1.0 for exact Tier 1 matches, 0.9 for substring Tier 1 matches, and the token-set overlap ratio for Tier 2 matches.
**Rationale**: Provides granular confidence scoring where exact attribute matches are highest confidence, substring matches slightly lower, and fuzzy label/match scores reflect the actual similarity measured.

### 2026-07-22: Testability Focus
**Decision**: Designed matcher to be easily testable in Node.js environment with jsdom, exporting a clear matchFields function that takes fields, profile, and qaMemory as parameters.
**Rationale**: Enables comprehensive unit testing without requiring a full Chrome extension environment, following the testing conventions established in the project.T4-T6 work was recovered and committed after the 2026-07-22 machine reboot; several bugs (regex escaping in normalize.js, const reassignment in qaUpsert, wrong Event class + date timezone handling in filler.js) were fixed during repair.

### 2026-07-27: Popup test timing gap — RESOLVED
**Decision**: Fixed. Two real bugs, unrelated to the jsdom timing mechanism itself: (1) the test mocked `getStatus`'s response with `credentialStatus`/`needsPermission` as siblings of `status`, but both service-worker.js's real handler and popup.js's `updateStatus(response.status)` expect them nested inside `status` — the test's mock shape was wrong, not the implementation; (2) the "Fill button" test counted `init()`'s own `getStatus` message alongside the click's `fill` message, expecting 1 total instead of 2 — fixed by clearing the mock's message log after init settles, before the click.
**Rationale**: All 4 popup tests now pass; see AGENTS.md for the general init-call pattern (already correct here, `await`ed and using the `window.module` bridge).

### 2026-07-26: Options QA browser test timing gap — RESOLVED
**Decision**: The DOMContentLoaded timing issue is fixed. Root cause: jsdom's natural DOMContentLoaded auto-fire is unreliable across execution contexts — it fires in a plain `node -e` script but never fires under `node --test`. Fix: call the page script's exported `init()` directly (via the dual-environment `module.exports` stub, bridging `window.module = module` before `eval`) instead of relying on the natural event. Also found and fixed two real bugs surfaced once the harness was reliable: `qaUpsert`/`qaDelete` were sent through a generic `sendMessage(action, data)` helper that nests everything under `.data`, but service-worker.js reads `message.entry`/`message.key` at the top level — both call sites now bypass that helper and send the correct shape directly. The filter test's row-count assertion was also corrected to check visible rows (`style.display !== 'none'`) instead of raw DOM count, since the implementation intentionally hides rather than removes non-matching rows.
**Rationale**: All 4 tests now pass; see AGENTS.md for the general pattern (skip jsdom's natural event entirely, call the exported init directly).

### 2026-08-22: Review and repair on import into the skills repository — what was actually broken
**Decision**: Imported as `resumebot-browser-plugin/` (renamed from Apply-Once) after a full read-through and repair rather than as-is. The original tree had 104 passing tests but the product loop did not run in Chrome:
- `fill` had no content-side handler at all (`fillFromContent` was sent by the service worker and answered by nothing), the keyboard command had no `onCommand` listener, and the ATS adapters were never listed in the manifest — and all four wrote to the same `ResumeBot.ats` key, so even loaded they would overwrite each other.
- `capture.js` carried the double-escaped-regex corruption AGENTS.md warns about (`/[^a-z0-9\s]/`), so stored questions lost their spaces and could never re-match; its submit handler also referenced block-scoped variables from another closure (ReferenceError on click). The "ask once" loop was therefore broken end to end.
- `filler.js` excluded `<textarea>` from text fills, called `HTMLInputElement`'s value setter on textareas (throws), and clicked every radio in a matched group (a yes/no question always ended on the last option).
- The matcher's "substring in either direction" rule matched `end` inside `gender` and `tel` inside `hotel`; replaced with token-boundary matching.
- The native host called the 1Password SDK with shapes that do not exist in `@1password/sdk` 0.4.0 (`items.list()` without a vault, `category: 0x01`, `client.secrets.generatePassword(...)`), and the Windows installer wrote individual registry values where Chrome reads a single default value pointing at a manifest file. Both rewritten against the SDK's typings.
- The popup requested host permission for its own `chrome-extension://` origin instead of the tab's, and `scripting` was not in the manifest.
**Rationale**: The unit suite exercised modules in isolation and passed while the integration between them did not exist. The repair adds `content/main.js` as the single orchestrator, a real SHA-1 fallback for keys, per-frame fan-out in the service worker, a `main.test.js` that drives the whole loop in jsdom (fill on company A → capture → silent fill on company B), and rewrites the tests that carried their own broken `chrome` mocks to use the shared one.

### 2026-08-22: Field remap writes to `siteRegistry.fieldOverrides[ats][fieldKey]`
**Decision**: The right-click "remap this field" item is a real `chrome.contextMenus` entry (contexts: editable); the content script only remembers the right-clicked element. The chosen target (`profilePath` string, or `{ qaKey }`) is stored per ATS under the field's stable key (`data-automation-id` → `id` → `name` → label) and is Tier 0 in the matcher, above the adapter map. The existing `atsOverrides` array (domain → ATS type) is a different thing and was kept as is.
**Rationale**: PLAN.md asked for corrections that "never recur on that platform"; keying by ATS rather than domain is what makes one Workday correction cover every Workday tenant.

### 2026-08-22: Native host launcher scripts
**Decision**: The installers generate `run-host.sh` / `run-host.cmd` that pin the absolute path of `node` and point the native messaging manifest at that launcher, not at `host.js`.
**Rationale**: Chrome does not inherit a login shell's PATH (nvm, Homebrew, fnm), and Windows cannot execute a `.js` file as a native host at all.

### 2026-08-22: Post-import review, second pass
**Decision**: A review of the import commit found ten confirmed defects and a round of duplication; all fixed in one commit rather than logged as follow-ups. The structural changes:
- `content/common.js` now holds the ATS table, profile-path helpers, EEO rules, the account-creation heuristic, the navigation observer and the one `sendMessage` wrapper; the service worker `importScripts` it. Five hostname tables and five message promisifiers became one each.
- Adapter contract narrowed: only an adapter with real widgets (Workday) has `handles`/`fillField`; Greenhouse, Lever and iCIMS carry a selector map and an observer. The unreachable per-adapter fill fallbacks (which also probed a `filler.fill` that never existed) are gone.
- capture.js takes the profile, qa-memory and a `persist` callback from main.js and never reads `chrome.storage` itself; it no longer lists password or hidden fields, an untouched checkbox is "no answer", review rows report back so `timesUsed`/`reviewBeforeFill` update, and the closed shadow root is no longer re-exposed (the scanner also skips `resumebot-*` containers).
- EEO: an empty profile value now falls through to qa-memory in the matcher, so a "decline" answered once in the capture panel is reused; the Options "prefer not to answer" flags resolve to the decline option via aliases.
- `setSiteRegistry` merges at the top level (Options used to wipe `domains` and `fieldOverrides` on every save); `qaUpsertMany` replaces N round trips.
- `fillCredentials` carries the hostname and a frame on another origin fills nothing; the native host checks the `chrome-extension://` origin Chrome passes in argv against `config.json`'s `extensionId` and refuses other callers.
- install.ps1 had an invalid regex on the backslash-escaping line (blank manifest path) and wrote a BOM; it now uses `ConvertTo-Json` and BOM-less writes, and host.js tolerates a BOM anyway.
- Scan work is proportional again: synonyms and labels are tokenized once per page, company candidates once per document, the DOM walk overlaps the store round trips, and the scan payload no longer carries the resume bytes into every frame.
**Rationale**: Each of these was a bug a user would hit on the first real application (wiped remaps, a password in plaintext memory, a Windows install that cannot work) or a duplication that had already drifted. Fixing them before any live run is cheaper than finding them on a Workday tenant.
