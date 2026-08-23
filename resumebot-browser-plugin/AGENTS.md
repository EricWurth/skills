# Conventions for agents working on the browser plugin

Read this before changing anything under `resumebot-browser-plugin/`. These rules override task text where they conflict.

## Message contract — read this before touching chrome.runtime messages

`extension/MESSAGE-CONTRACT.md` is the authoritative reference for every message action's request/response shape. Four separate bugs this project were the exact same mistake (a field one level away from where the handler reads it — `entry` vs `data.entry`, `credentialStatus` as a sibling of `status` vs nested inside it). Check that file before writing a new call site or a new test mock — do not infer the shape from one existing call site, since some of those were themselves wrong until caught by a test.

## Every commit runs the full suite green

`npm test` (node --test, jsdom) must pass in full before a commit. There is
no hook enforcing it any more (the original repo's pre-commit guard did not
survive the move into this repository), so it is on you. A second standing
check from that guard is worth keeping by hand: a tracked `.js`/`.html` file
shrinking by more than half in one change is the exact shape of a real
corruption incident (a worker wrote a JSON-escaped string over a live HTML
file) — look before you commit that.

Chrome content scripts CANNOT use ES `import`/`export` (they are classic scripts). But our tests load the same files in Node/jsdom. Every file under `extension/content/` (and anything else a test needs) must use this pattern:

```js
// scanner.js — field discovery
(function (root) {
  "use strict";
  function scanFields(doc) { /* ... */ }

  const api = { scanFields };
  root.ResumeBot = Object.assign(root.ResumeBot || {}, { scanner: api });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
```

- In Chrome: everything hangs off `window.ResumeBot.<module>`. List content scripts in the manifest in dependency order; `content/main.js` must stay last — it is the orchestrator that wires the others together and owns the message handlers (except `scanFromContent`, which scanner.js answers).
- ATS adapters register under `window.ResumeBot.adapters.<name>` (a factory returning `{ name, detect, handles, selectorMap, fillField, onNavigation }`). Do not write to a shared key; four adapters once overwrote each other that way.
- In tests: `const scanner = require("../extension/content/scanner.js")`.
- The service worker may use classic script style with the same guard, or keep it self-contained.

## Testing conventions

- Test runner: `node --test` (built into Node 22). Test files live in `test/`, fixtures in `test/fixtures/`. `npm test` must run the whole suite.
- jsdom is the DOM. Its known gaps — work WITH them, don't fight them:
  - **Visibility**: `offsetParent` is always `null` and `getClientRects()` is empty in jsdom. The scanner's `isVisible(el)` must be a separate exported function, and the scan function must accept an options override (e.g. `scanFields(doc, { isVisible: () => true })`). Tests pass the override; a dedicated unit test covers `isVisible` logic with stubbed element properties.
  - **DataTransfer / File / input.files**: jsdom does not implement `DataTransfer`, and `input.files` is read-only. Wrap all file-attachment logic in one helper (`filler.attachFile(input, fileData, deps)`) where `deps` supplies the `DataTransfer`/`File` constructors (defaulting to globals). Tests inject stub constructors and assert the interaction, not real file objects.
  - **chrome.\* APIs**: do not use `chrome.*` directly inside logic modules. Thin adapter layer only (storage get/set, runtime messaging), injected as a dependency. A single shared mock lives in `test/helpers/chrome-mock.js` (storage.local backed by a Map, message bus as an EventEmitter). All tests use it; never write a second mock.
- **Before every commit: run the FULL suite (`npm test`), not just your card's new tests. A card is not done with any test red — including tests from earlier cards.** If an earlier test is legitimately obsoleted by your change, update it and note why in the commit message.

## Debugging protocol — the thrash-breaker

When a test fails, your FIRST move is to read the exact error text and check the boring causes, in this order, before changing any code:

1. **Paths**: `Cannot find module` almost always means a wrong relative path (`./extension/...` from `test/` must be `../extension/...`).
2. **Wrong Event class**: jsdom rejects Node's global `Event` in `dispatchEvent` — use the page window's (`root.Event` pattern).
3. **jsdom gaps**: DataTransfer/input.files/offsetParent (see Testing conventions above) — use the injection seams, don't fight the DOM.
4. **Assertion direction**: is the test asserting the right thing, or did the fixture forget a field?
5. **Runner**: `node --test` only. If you're reaching for jest/babel/mocha, stop — that's the wrong path.

Hard rule: if the SAME error appears twice in a row after a change, STOP experimenting. Write the exact error text and your top hypothesis as a kanban comment on your card, then keep the scope of any further change to one line at a time. Never rewrite working implementation code to chase a test error you haven't diagnosed. Burning your turn budget on undirected experiments is the #1 cause of failed cards in this repo's history.

Never create scratch files (debug.js, manual-test.js, etc.) — use node -e for quick probes; if you must create one, delete it before committing.

## Known model limitation — regex literals get corrupted

Confirmed on 2026-07-24 across two separate cards: this model reliably double-escapes regex literals when hand-editing a file — `\d` becomes `\\d`, `\/` becomes `\\/` — which is a hard SyntaxError at module load and takes down every test in that file, not just the one you're touching. It does this even to regex lines it wasn't asked to change, just by being in the same file it's editing.

Rule: if your card requires touching a file that contains regex literals, do NOT hand-type or hand-edit any line containing one. Instead:
1. Restore the whole file from the last clean commit first (`git checkout -- <file>`) if it's already corrupted.
2. Make your actual (non-regex) change on top of the clean file.
3. If your change genuinely requires writing new regex, ask for it to be spelled out character-for-character in the card body and copy it verbatim — do not compose it yourself.

## jsdom does not load external `<script src>` files

Confirmed 2026-07-25: `new JSDOM(html, { runScripts: 'dangerously' })` alone does NOT fetch or execute `<script src="popup.js">` — that flag only permits execution of scripts jsdom actually loads, and loading external files requires `resources: 'usable'` plus a resolvable base `url`, which is fragile in a test context. Symptom: the script's own top-level `console.log` never appears, every DOM assertion sees only the static HTML, and it looks like "the feature isn't wired" when the feature code is actually fine.

Fix: don't rely on the HTML's `<script src>` tag. Read the JS file's source directly and eval it into the window after the mock is in place:
```js
window.chrome = chromeMock.createChromeMock();  // mock BEFORE eval — bare `chrome` refs resolve against window, not global
const src = require('fs').readFileSync(path.join(__dirname, '../extension/popup/popup.js'), 'utf8');
window.eval(src);
```
Also note: bare identifiers inside a script executed this way resolve against the jsdom `window`, not Node's `global` — setting `global.chrome` alone does nothing for code under test.

**Final correction, verified 2026-07-26 under the actual `node --test` runner — call the exported `init()` directly.** This note went through two wrong versions before landing here; both were "verified" against the wrong execution context (a plain `node -e` script), which behaves differently from the real `node:test` runner. Empirically confirmed by direct comparison: jsdom's natural `DOMContentLoaded` auto-fire happens reliably in a bare script, but **never fires at all under `node --test`**. So the earlier "mocks before eval, let the natural fire happen" advice silently does nothing under the real test runner — zero init, zero rendered rows, no error.

The reliable fix, verified inside `node --test` itself:
```js
// at the bottom of the page script's IIFE, alongside document.addEventListener('DOMContentLoaded', init):
if (typeof module !== 'undefined' && module.exports) { module.exports = { init }; }
```
```js
// in the test, after setting up mocks:
window.module = module;              // bare `module` in eval'd code resolves against window, not Node's module
window.eval(pageJsSource);
await module.exports.init();         // call directly — do not dispatch or wait for a natural event at all
```
**Always verify jsdom/DOM-timing fixes by running the actual test file through `node --test`, never a standalone reproduction script** — this exact category of bug (something that works in isolation but not in the real runner) has now cost real time twice.

## Repo hygiene

- Commit at the end of your task (small mid-task commits are fine too). Message format: `resumebot-browser-plugin: what changed`.
- `manifest.json` must never reference a file that doesn't exist (including icons — omit the `icons` key rather than pointing at missing PNGs). Chrome refuses to load otherwise.
- Log every decision the plan doesn't cover in `DECISIONS.md` (date, decision, rationale). Log punts there too.
- Never commit `node_modules/` or `native-host/config.json` / the generated launcher + manifest (gitignored: they are machine-specific).
- PLAN.md is the source of truth for product behavior; this file is the source of truth for engineering conventions.
- Tests run in Docker (`node:22`) — never `npm install`/`npm test` on the Windows machine.

## Hard rails (from PLAN.md, repeated because they matter)

- Never auto-submit any form. Fill and stop.
- Never fill `input[type=password]` except through the explicit 1Password flow flag.
- Never guess EEO answers — empty profile value means leave blank and surface in the capture panel.
- No secrets in logs, storage, or committed files. Ever.
