---
name: apply-tabs
description: Open browser tabs for tracker roles that are ready to apply, in priority order, so the user can walk the queue and submit. Use when the user says "open my apply queue", "set up my application tabs", "what should I apply to today", or when invoked by a scheduled task.
---

# Apply Tabs

Bridges "packet ready" to "actually applied": opens each ready role's direct apply
page in a browser tab so the user works a pre-ranked queue with zero hunting. Load
the **tracker** skill first.

**The user submits every application. This skill opens tabs; it never fills or
submits forms.**

## Build the queue

1. Query the tracker for `status=ready AND packetComplete=TRUE`.
2. Verify each role's packet file actually exists in `Applications/`; a row whose
   packet is missing gets flagged, not opened.
3. Check every candidate's `applyUrl` before sorting, because the check also
   supplies the real posting date:
   `python scripts/check_apply_links.py --file <id|url list>`. It asks the ATS's
   JSON endpoint first (Workday, Greenhouse, Lever, Ashby: no rendering, rarely
   bot-walled, returns the ATS's own posted date), then Eightfold career sites
   (`/careers/job/<id>` pages, often on the employer's own domain), and renders the
   page in headless Chrome for any other ATS. A plain HTTP fetch of the page isn't
   enough, because Workday and similar pages return 200 for dead postings, and
   Eightfold keeps serving a closed job's full description with only the Apply
   button missing; its check asks Eightfold's open-jobs search, and a job absent
   from search is dead (`source=eightfold`). Each result has
   a `verdict` (`live` / `dead` / `unknown`), a `source`, and a `posted` date when
   the ATS exposes one.
   - `dead` → skip and mark `status=dead` with the evidence.
   - `unknown` (bot wall, didn't render) → load it in the built-in browser
     (`get_page_text`) and classify it the same way: closed-posting language is
     dead, an apply control with no closed language is live. Read the posted date
     off the page if it shows one. Headless Chrome is easy for bot-management
     products to spot; a normal browser session usually isn't. Only if the
     browser also fails (CAPTCHA, login wall, the site approval goes unanswered)
     does the row go to "couldn't verify, check by hand." Never solve a CAPTCHA
     or sign in to get past a wall.
   - Only `live` rows go on to the sort.
4. Sort the live rows by fit, with freshness breaking ties:
   - **Same fit:** newer wins (fewer days since posting beats more).
   - **Adjacent fit (gap of 1):** a fresh role (≤14 days) can outrank a stale
     (>14 days) role one fit point higher — a fresh fit-4 beats a stale fit-5,
     a fresh fit-3 beats a stale fit-4. This is the only case freshness
     overrides fit.
   - **Fit gap of 2 or more always wins outright**, regardless of age — a
     fresh fit-2 never outranks a stale fit-4.
   - `queueRank` is the final tiebreak.

   Age is days since the ATS's posted date: use the checker's `posted` (or the
   date read off the page in the browser tier), then an ATS date already in
   `notes`, and only then `found`. The tracker's `found` date is often wrong in
   both directions — a repost makes an old role look new, and a late find makes a
   fresh role look old — so never sort on it when a real date is available. When
   the real date differs from what the tracker implied, say so in the checklist.
5. Cap the batch at the user's per-session limit (`Profile/preferences.md`, default
   5) — a wall of 20 tabs kills momentum.

## Open the tabs

- Use `applyUrl` (the direct ATS page), never the board listing.
- One tab per role, in queue order, in the user's browser.
- Then print a compact checklist the user works alongside the tabs: company, role,
  which resume file to upload (full path), whether a cover letter exists for it, and
  any per-role notes (known form quirks, comp answer strategy from
  `Profile/form-answers.md`).

## After the session

Ask which ones were submitted (or learn it later from email-sync). For each
submitted role: `status=applied`, date in `notes`. For any the user hit a wall on
(login required, posting dead, portal broken): capture the reason in `notes` and
adjust — dead posting → `status=dead`; aggregator wall → find the direct path before
the next session.

## Freshness note

Early applicants get read. Recruiters screen in batches as applications arrive and
most reqs have a shortlist within one to two weeks, so a two-week-old posting is
often still open but no longer really being read. That's why a fresh fit-4 outranks
a stale fit-5 — but freshness only closes a one-point fit gap, never two: a fresh
fit-2 still loses to a stale fit-4. Fit remains the primary sort; freshness is the
tiebreaker, not a replacement for quality. Stale low-fit rows that never surface
should be flagged for the user to defer or reject, not left to quietly rot.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "The tab probably opened fine, I'll just mark it applied" | Opening a tab is not submitting a form. Status only moves to `applied` when the user reports it (or email-sync confirms it) — never inferred from having opened the tab. |
| "`packetComplete` is TRUE in the tracker, no need to check the folder" | The sheet cell can be stale or wrong. The row only gets opened as a tab after the packet file is confirmed to actually exist in `Applications/`; otherwise it's flagged, not opened. |
| "The board listing link is right there, I'll just use that" | The board URL and the direct apply URL are not interchangeable — one is the aggregator page, the other is the real ATS form. Always `applyUrl`, never `url`. |
| "The user's clearly on a roll today, I'll open all 12 instead of stopping at 5" | The per-session cap exists because a wall of tabs kills momentum, not because 5 is a hard technical limit. Qualifying for more doesn't override the cap. |
| "This one's been sitting in ready for weeks, it's owed a turn" | Time in the queue earns nothing on its own. A packet already built is sunk cost; the user wants the best shot at a response, which means fit leads and freshness only breaks a close call — a stale role still needs real fit (within one point of the best fresh option, or a 2+ point fit lead of its own) to earn a slot. |
| "It's fresh, so it goes ahead of that stale fit-4" | Freshness only overrides a one-point fit gap. A fresh fit-2 does not outrank a stale fit-4 — that gap is 2, and fit wins outright regardless of age. |
| "This form looks quick, I'll just fill it in for them" | The skill's one hard boundary is that it opens tabs and never fills or submits forms — quickness doesn't create an exception. |

## Red Flags

- Setting `status=applied` without the user reporting it or email-sync confirming it
- Opening the board `url` instead of `applyUrl` for any tab
- Opening more tabs than the user's per-session batch cap
- Opening a tab for a row whose packet file doesn't actually exist in `Applications/`
- Opening a tab for a page that neither `check_apply_links.py` nor the built-in-browser check confirmed `live`, or treating a plain HTTP 200 as proof the posting is open
- Sending an `unknown` row straight to "check by hand" without trying it in the built-in browser first
- Sorting on the tracker's `found` date when the checker returned a real ATS `posted` date
- Filling in or submitting any part of an application form
- A stale, low-fit role getting a tab while a fresh, higher-or-equal-fit ready role with a packet goes unopened
- A fresh role beating a stale role that outranks it by 2+ fit points ("it's fresh" is not enough to close a 2-point fit gap)
