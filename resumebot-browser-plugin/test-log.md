# Test Log

The metric this file tracks is **fill rate**: fields auto-filled / total
fillable fields on a real application, per ATS. It should climb toward 100%
as the answer memory and the adapters grow. Record one line per live run.

## Automated

`npm test` — 129 tests (node --test, jsdom). Covers scanner label
resolution, matcher tiers, React-safe filler, capture panel, the full
orchestrated loop (fill on company A → capture → silent fill on company B →
review-before-fill → remap override → adapter tier-0), popup/options pages,
service-worker stores and the 1Password native host with a mocked SDK.

## Manual checklist per ATS

Run this on a real posting for each platform. Steps:

1. Load the unpacked extension; open the posting; confirm the badge count
   roughly matches the visible inputs.
2. Popup → **Fill this page** (or Ctrl+Shift+F).
3. Count: fields filled correctly / fields that had a profile or memory
   answer / total fillable fields. Note every mis-fill and what the right
   mapping was (fix it with right-click → remap, which also tells you the
   field key to add to the adapter's selector map).
4. Answer the capture panel, **Save and fill**; confirm the page took the
   values and Options → saved answers shows them.
5. Type into a filled field afterwards; it must behave normally (no React
   state desync).
6. Open a *second* posting on the same ATS at a different company; fill;
   every question answered in step 4 must fill silently.
7. Never click submit as part of a test run unless you mean to apply.

Acceptance per milestone (from PLAN.md):

- **M1 Scanner**: ≥95% of visible inputs captured with sensible labels on a Greenhouse and a Workday posting.
- **M2 Profile fill**: Greenhouse basic-info section fills with one click; typing afterwards works normally.
- **M3 QA memory**: a custom question answered at company A is pre-filled at company B on the same ATS.
- **M4 Adapters**: a full Workday application completes end to end with only novel questions needing input (fake dropdowns, segmented dates, multi-page SPA flow, resume injection).
- **M5 1Password**: on a fresh Workday tenant, one click triggers the 1Password prompt, creates a login with a generated password and fills the registration form; revisiting offers credential fill; locking 1Password mid-session shows "approve in 1Password", not an error.
- **M6 Polish**: badge counts, remap menu → per-ATS override, saved-answer browser, export/import.

## Runs

| date | ATS | site | filled / had-answer / total | notes |
|---|---|---|---|---|
| 2026-07-23 | workday | (tenant not recorded) | pass | "Full Workday application end-to-end manual verification passed" — pre-repair build; the fill path has since been rewired, so treat as unverified until re-run |
| 2026-07-29 | workday | live tenant | — | two bugs fixed from live testing (`getStatus` permission check; empty tab URL) — pre-repair build |
|  | greenhouse |  |  | not yet run on the repaired build |
|  | lever |  |  | not yet run on the repaired build |
|  | workday |  |  | not yet run on the repaired build |
|  | icims |  |  | not yet run on the repaired build |
