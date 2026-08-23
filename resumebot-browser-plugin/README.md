# ResumeBot Browser Plugin

A Chrome extension (Manifest V3) that fills job applications from a profile
you enter once and an answer memory that grows with every application. It
is the browser half of [resumebot](../plugins/resumebot): resumebot finds
roles and builds packets; this plugin takes the typing out of the apply
step. It fills and stops. You click submit.

**Prime directive: you never answer the same application question twice.**
Every field either fills from stored knowledge or gets asked once, captured,
and never asked again.

Everything stays on your machine: `chrome.storage.local` only (never Chrome
sync), no server, no analytics, no auto-submit. Passwords are handled only
through the optional 1Password flow and are never stored by the extension.

## What it does

1. **Scans** every form field on the page, including iframes and open
   shadow roots, and resolves each field's best label (`<label for>`,
   `aria-label`, `aria-labelledby`, wrapping label, fieldset legend,
   placeholder, preceding text). The toolbar badge shows the count.
2. **Matches** each field, first match wins:
   - *Override*: a field you remapped via the right-click menu on this ATS.
   - *Adapter*: the ATS adapter's selector map (Workday, Greenhouse, Lever,
     iCIMS).
   - *Attributes*: `autocomplete`/`name`/`id`/`data-automation-id` against
     the synonym dictionary (`extension/content/synonyms.json`).
   - *Labels*: fuzzy label match against profile fields and, for custom
     questions, against the answer memory. Company names are normalized
     away, so "Why Acme?" and "Why Initech?" are the same question.
3. **Fills** what it knows, React-safely (prototype value setter + events),
   one field at a time with a small delay. Workday's fake dropdowns and
   segmented dates go through the Workday adapter. Radios click only the
   option that means your answer. Empty EEO values are never guessed.
4. **Captures** what it doesn't know in a slide-in panel: answer, choose
   whether to save, and "Save and fill" writes the answers to the page and
   to memory. Long stored answers (200+ chars) are shown for a one-click
   confirm instead of filled silently.

Second application on the same ATS should take under two minutes of your
attention; that is the metric `test-log.md` tracks.

## Install

1. Clone or download this folder.
2. Open `chrome://extensions`, enable **Developer mode**, click **Load
   unpacked**, and select the `extension/` directory (the one containing
   `manifest.json`).
3. Click the toolbar icon → **Options**. Enter your profile (identity,
   address, work authorization, education, employment, resume file, EEO
   answers if you want them filled). Save.
4. Open a posting on Greenhouse, Lever, Workday (`*.myworkdayjobs.com`) or
   iCIMS and click **Fill this page** in the popup, or press
   **Ctrl+Shift+F** (Cmd+Shift+F on Mac; remap at
   `chrome://extensions/shortcuts`).

For any other site, the popup shows **Grant access on this site**; the
extension asks Chrome for that origin only and loads itself there.

## Using it

| Control | Where | What |
|---|---|---|
| Badge count | toolbar icon | fillable fields found on this tab (re-counted on SPA step changes) |
| Fill this page | popup, or Ctrl+Shift+F | scan → match → fill → open the capture panel for the rest |
| Scan | popup | count and match without touching the page |
| Capture panel | slides in from the right after a fill | answer unmatched questions once; "Save to memory" is on by default |
| ResumeBot: remap this field | right-click any form field | correct a bad match; the fix is remembered per ATS |
| Options | popup | profile editor, saved-answer browser (edit/delete), ATS overrides, export/import |

Export/import is the sync mechanism: one JSON file with profile, answers,
overrides and your embedded resume. It is personal data; treat the file
accordingly.

## 1Password (optional)

Many ATS tenants (Workday especially) make you create an account before you
can apply. With the native host installed, the popup offers **Create login in
1Password** on pages with a password field: 1Password generates a strong
password, saves a Login item for the domain, and the extension fills email +
password into the form. Back on the same tenant later, **Fill login from
1Password** fills the saved credentials. The password transits memory only.

The host uses the 1Password JavaScript SDK with **desktop-app authentication**
(`DesktopAuth`): the 1Password app shows its own approval prompt (biometrics
or password), sessions expire, and there is no service-account token or CLI
involved.

Prerequisites you have to do by hand:

1. Install the 1Password desktop app and sign in.
2. 1Password → Settings → Developer → enable **Integrate with other apps**.
3. For biometric approval: Settings → Security → enable Windows Hello /
   Touch ID / system authentication.
4. Node.js 18+ on the machine.

Then:

```bash
cd native-host
npm install
./install.sh <extension-id> <1password-account-name>      # Linux / macOS
```

```powershell
cd native-host
npm install
.\install.ps1 <extension-id> <1password-account-name>    # Windows
```

The extension ID is on `chrome://extensions` with Developer mode on. The
account name is what the 1Password app shows at the top of its sidebar (an
account UUID also works). Restart Chrome afterwards. Details and the wire
protocol: [native-host/README.md](native-host/README.md).

If 1Password is locked, the popup says "approve in 1Password" rather than
failing; unlock and retry.

## Hard rails

- Never auto-submits anything.
- Never fills `input[type=password]` outside the 1Password flow.
- Never guesses EEO answers: empty profile value → left blank and surfaced in
  the capture panel.
- Never writes secrets to storage, logs, or committed files.
- Never fills hidden inputs (honeypots, collapsed steps).

## Development

```bash
npm install
npm test          # node --test, jsdom; 119 tests
```

Layout:

```
extension/
  manifest.json
  service-worker.js      storage, message router, frame fan-out, badge, command, context menu, native bridge
  content/
    normalize.js         question normalization + SHA-1 keys
    scanner.js           field discovery + label resolution
    matcher.js           override → adapter → attribute → label/qa-memory
    filler.js            React-safe value injection
    capture.js           ask-once panel
    main.js              orchestrator (runs last; handles fill/scan/credential/remap messages)
    synonyms.json        attribute dictionary (editable without code changes)
    ats/                 detect.js + one adapter per platform
  popup/                 status, fill, grant, 1Password buttons
  options/               profile editor, answer browser, overrides, export/import
  MESSAGE-CONTRACT.md    every message action's shape (read before touching messaging)
native-host/             1Password native messaging host + installers
test/                    node --test suite, fixtures, shared chrome mock
PLAN.md                  product spec and milestones
AGENTS.md                engineering conventions for agents working here
DECISIONS.md             decisions the plan did not cover
test-log.md              per-ATS manual checklist and fill-rate log
```

## Status

Unit-tested end to end in jsdom (scan → match → fill → capture → re-fill on
the next company). The ATS adapters and the 1Password host were written
against the platforms' public DOM conventions and the SDK's typings; live
verification on each ATS and against a real 1Password app is tracked in
`test-log.md`, where the per-site fill rate should climb toward 100% as the
answer memory and adapters grow.
