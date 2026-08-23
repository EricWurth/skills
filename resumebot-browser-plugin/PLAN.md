# ResumeBot Browser Plugin: Job Application Autofill Extension

*(Originally specified under the working name "ResumeBot"; the product spec below is unchanged apart from names.)*

## Instructions for the agent

Build this as a Chrome extension (Manifest V3) plus a small native messaging host. Work through the milestones in order. Each milestone has acceptance criteria; do not proceed to the next until the current one passes. When you hit a decision not covered here, choose the option that best serves the prime directive, log the decision and rationale in DECISIONS.md, and continue. Do not stop to ask unless the fork is irreversible or touches security.

## Prime directive

**The user never answers the same application question twice.**

Every field on every job application either (a) fills automatically from stored knowledge, or (b) gets asked once, captured, and never asked again. Success is measured by the second application on any given ATS taking under two minutes of human attention.

## Architecture

```
resumebot-browser-plugin/
├── extension/
│   ├── manifest.json          # MV3, all_frames content scripts
│   ├── service-worker.js      # storage, messaging, native host bridge
│   ├── content/
│   │   ├── scanner.js         # field discovery (DOM + shadow DOM + iframes)
│   │   ├── matcher.js         # matching pipeline (tiers 1-3)
│   │   ├── filler.js          # value injection engine
│   │   ├── capture.js         # unmatched-field capture overlay
│   │   ├── main.js            # orchestrator: detect → scan → match → fill → capture
│   │   ├── synonyms.json      # Tier-1 attribute dictionary
│   │   └── ats/               # per-platform adapters
│   │       ├── detect.js      # ATS fingerprinting
│   │       ├── workday.js
│   │       ├── greenhouse.js
│   │       ├── lever.js
│   │       ├── icims.js
│   │       └── generic.js
│   ├── popup/                 # status + manual trigger
│   └── options/               # profile editor, QA memory browser
├── native-host/
│   ├── host.js                # Node native messaging host wrapping 1Password SDK
│   └── install.(sh|ps1)       # registers host manifest with Chrome
└── DECISIONS.md
```

## Data model

Three stores, all in `chrome.storage.local` (never sync — this is PII):

### 1. profile.json — canonical fixed fields

```json
{
  "identity":  { "firstName": "", "lastName": "", "email": "", "phone": "", "linkedin": "", "website": "" },
  "address":   { "street": "", "city": "", "state": "", "zip": "", "country": "US" },
  "work":      { "authorized": "yes", "sponsorship": "no", "remotePreference": "", "salaryExpectation": "", "startDate": "", "noticePeriod": "" },
  "eeo":       { "gender": "", "race": "", "veteranStatus": "", "disabilityStatus": "" },
  "education": [ { "school": "", "degree": "", "field": "", "startYear": "", "endYear": "" } ],
  "employment": [ { "company": "", "title": "", "location": "", "startDate": "", "endDate": "", "current": false, "description": "" } ],
  "documents": { "resume": { "filename": "", "mime": "", "base64": "" }, "coverLetterTemplate": "" }
}
```

### 2. qa-memory.json — the growing question store
This is the heart of the product. Keyed by a normalized question hash:

```json
{
  "entries": [
    {
      "key": "sha1(normalized question text)",
      "questionRaw": "Why do you want to work at {company}?",
      "questionNormalized": "why do you want to work at",
      "answer": "...",
      "answerType": "text|select|radio|checkbox|date|file",
      "selectValueAliases": ["Yes", "Y", "true"],
      "firstSeen": { "domain": "", "ats": "", "date": "" },
      "timesUsed": 0,
      "reviewBeforeFill": false
    }
  ]
}
```

Normalization: lowercase, strip punctuation, strip company/role names (replace detected proper nouns matching the page title or og:site_name with `{company}`), collapse whitespace. This makes "Why Acme?" and "Why Initech?" the same question.

`reviewBeforeFill: true` means show the stored answer for one-click confirm instead of silent fill. Default it to true for free-text answers over 200 chars (cover-letter-style questions deserve a glance).

### 3. site-registry.json — per-domain state

```json
{
  "domains": {
    "myworkdayjobs.com": { "ats": "workday", "hasCredential": true, "opItemId": "...", "lastApplied": "" }
  }
}
```

## Matching pipeline

Run on demand (toolbar button + keyboard shortcut), NOT automatically on page load. Auto-fill on load clobbers user input and triggers bot detection. The scan itself can run on load to show a badge count of fillable fields.

For each discovered field, first match wins:

**Tier 0 — ATS adapter.** `detect.js` fingerprints the platform (URL patterns: `myworkdayjobs.com`, `greenhouse.io`, `boards.greenhouse.io`, `jobs.lever.co`, `icims.com`; DOM signatures as fallback). If an adapter exists, its selector map runs first. This is the leverage layer: there are ~6 ATS platforms behind most job postings, so one Workday adapter covers thousands of companies.

**Tier 1 — attribute matching.** Check `autocomplete`, `name`, `id`, `data-automation-id` (Workday's attribute) against a synonym dictionary: `fname|first_name|firstName|first-name|givenName → identity.firstName`. Build the dictionary as a standalone JSON so it grows without code changes.

**Tier 2 — label matching.** Resolve the field's label: `<label for>`, `aria-label`, `aria-labelledby`, wrapping label, or nearest preceding text node within the same form group. Fuzzy match (token overlap, threshold ~0.75) against profile field labels AND qa-memory normalized questions.

**Tier 3 — capture.** No match: this is a new question. Add it to the capture overlay.

## Fill engine (filler.js) — the part that actually breaks

Most ATSes are React apps. `input.value = x` does nothing because React tracks value through its own descriptor. Use the native setter and dispatch events:

```js
const setter = Object.getOwnPropertyDescriptor(
  window.HTMLInputElement.prototype, "value").set;
setter.call(input, value);
input.dispatchEvent(new Event("input", { bubbles: true }));
input.dispatchEvent(new Event("change", { bubbles: true }));
input.dispatchEvent(new Event("blur", { bubbles: true }));
```

Same pattern with `HTMLTextAreaElement` and `HTMLSelectElement` prototypes.

- **Native selects:** match option by value, then by text, then by alias list (`"yes" ≈ "Yes" ≈ "Y"`). Store the alias that worked back to the qa-memory entry.
- **Workday dropdowns are not selects.** They are `<button>`/`<div>` listboxes. The adapter must click to open, wait for the listbox to render, then click the matching `[role="option"]`. Sequence the interactions with small awaited delays; Workday debounces.
- **Radios/checkboxes:** click the input (or its label if the input is visually hidden), don't set `.checked` directly.
- **Dates:** detect expected format from placeholder/pattern; store dates in ISO internally and format at fill time. Workday date widgets are segmented (MM / DD / YYYY as separate inputs) — the adapter handles them.
- **File upload (resume):** injectable. Build a `File` from the stored base64, attach via `DataTransfer`:
  ```js
  const file = new File([bytes], profile.documents.resume.filename, { type: mime });
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  ```
  Some ATSes use drag-drop zones instead of inputs; adapters dispatch synthetic `drop` events with the same DataTransfer.

## Capture overlay (capture.js)

After a fill pass, render a slide-in panel listing every unmatched field, in DOM order, each with: the resolved question text, the input type, an answer box, and a "save to memory" toggle (default on). Submitting the panel fills the fields AND persists the entries. This is the once-and-only-once loop closing.

Also add a context-menu item on any input: "ResumeBot: remap this field" for correcting bad matches. Corrections write to a per-ATS override map so the mistake never recurs on that platform.

## 1Password integration (native-host/)

Extensions cannot run Node code or reach local processes directly. Bridge through Chrome native messaging to a host that uses the **1Password JavaScript SDK (`@1password/sdk`) with desktop app authentication** (`DesktopAuth`). Do NOT use the `op` CLI or service account tokens; SDK desktop auth (available since Feb 2026, SDK v0.4.0+) gives biometric/Windows Hello authorization prompts from the 1Password app, time-bound sessions (10-minute inactivity expiry), automatic re-auth when the app relocks, and no long-lived credentials.

1. `host.js` is a Node script registered as a native messaging host (`com.resumebot.op`). The install script writes the host manifest with the extension ID allowlisted, into the platform-correct location (Windows registry / `~/.config/google-chrome/NativeMessagingHosts/`).
2. On first request, the host creates an SDK client with `new sdk.DesktopAuth(accountName)` (account name is a host config value set during install). 1Password shows a native authorization prompt naming the integration, scope, and duration; the user approves with biometrics or password.
3. Protocol (JSON over stdio, 4-byte length prefix per Chrome spec):
   - `{"cmd":"check","domain":"..."}` → list Login items, filter by website/domain → `{exists, itemId}`
   - `{"cmd":"create","domain":"...","username":"...","title":"..."}` → create a Login item via `client.items.create` with an SDK-generated strong password and the domain as the website → `{itemId, password}`
   - `{"cmd":"get","itemId":"..."}` → resolve username + password fields → `{username, password}`
4. The host never caches secrets and never writes them to disk. If the SDK reports an unauthorized/locked state, return `{error:"locked"}` and the extension shows "approve in 1Password" instead of failing silently.
5. Prerequisite (document in README, cannot be automated): 1Password desktop app → Settings → Developer → enable "Integrate with other apps"; for biometric approval, Settings → Security → enable Windows Hello / system authentication.
6. Extension flow: on an account-creation page (heuristic: password field + confirm-password field, or "create account" in form text), the popup offers **"Create login in 1Password"** → calls `create` → fills email + generated password into the form → registers the domain in site-registry. On a returning login page with `hasCredential: true`, offer one-click fill via `get`.
7. Security rails: the host validates the calling origin against the allowlisted extension ID; passwords transit memory only; the extension never stores them; log commands but never arguments containing secrets.

## Milestones

**M1 — Scanner.** Extension loads, content script enumerates all form fields on a page including iframes (`all_frames: true` in manifest) and open shadow roots, resolves each field's best label, logs a structured field report. *Accept: field report on a Greenhouse and a Workday posting captures ≥95% of visible inputs with sensible labels.*

**M2 — Profile fill.** Options page edits profile.json. Tier 1 + Tier 2 matching fills identity/address/work fields on demand. React-safe filler working. *Accept: a Greenhouse application's basic-info section fills correctly with one click; typing into the fields afterward works normally (no React state desync).*

**M3 — QA memory loop.** Capture overlay ships. Unmatched fields get asked once, persisted, and auto-fill on the next encounter. Question normalization strips company names. *Accept: apply to two different companies on the same ATS; a custom question answered on the first appears pre-filled on the second.*

**M4 — ATS adapters.** Workday adapter (fake dropdowns, segmented dates, multi-page flow with SPA navigation — use a MutationObserver to re-scan on virtual page transitions). Greenhouse and Lever adapters. Resume file injection. *Accept: a full Workday application completes end-to-end with only novel questions requiring input.*

**M5 — 1Password host.** Native host with `@1password/sdk` + `DesktopAuth`, install script, create/check/get flows. *Accept: on a fresh Workday tenant, one click triggers a 1Password authorization prompt, creates a login with a generated password, and fills the registration form; revisiting the tenant offers credential fill; locking 1Password mid-session produces the "approve in 1Password" state, not an error.*

**M6 — Polish.** Badge counts, per-ATS override maps from the remap menu, qa-memory browser in options (edit/delete/export), profile + memory export/import as JSON files.

## Constraints and gotchas

- Never auto-submit anything. Fill and stop; the human clicks submit.
- Never fill password fields from anywhere except the 1Password flow.
- EEO questions: fill only from explicit profile values; if unset, leave blank and surface in the capture panel rather than guessing.
- Some Workday tenants render the application inside a cross-origin iframe; `all_frames` + host permissions on `*://*.myworkdayjobs.com/*` handles it. Request broad host permissions (`<all_urls>`) as optional and prompt per-site.
- Debounce fills: fire fields sequentially with ~50ms gaps, not all at once. Simultaneous synthetic events trip Workday validation.
- SPA navigation: URL doesn't change between Workday steps. Re-run the scan when the MutationObserver sees a form-level subtree replacement, not on every mutation.
- Storage is local-only by design. Export/import is the sync mechanism; document this in the options page.

## Testing targets

Live postings on: boards.greenhouse.io (any), jobs.lever.co (any), any `*.myworkdayjobs.com` tenant, an iCIMS posting. Keep a `test-log.md` recording per-site fill rate (fields auto-filled / total fields) — the metric that should climb toward 100% as qa-memory and adapters grow.
