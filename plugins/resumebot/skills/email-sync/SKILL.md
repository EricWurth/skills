---
name: email-sync
description: Scan the user's email for application-related messages (confirmations, rejections, interview requests, recruiter outreach) and update the job tracker to match. Use when the user says "check my email for job updates", "sync the tracker", or when invoked by a scheduled task. Read-only on email; never sends or replies.
---

# Email Sync

Keeps the tracker honest without the user hand-logging every status change. Requires
a connected email tool (e.g. the Gmail connector); if none is available, say so and
stop — do not guess at statuses.

**Read-only on the mailbox. Never send, reply, archive, delete, or label without an
explicit user request. Never click links in emails.**

## Scan

Search the last N days (default 3; first run 14) for application-related mail:
ATS senders (workday, greenhouse, lever, icims, myworkday, ashbyhq, jobvite,
smartrecruiters…), subjects matching application/interview/offer patterns, and
company names from tracker rows in active statuses (`applied`, `interviewing`,
`ready`).

## Classify each hit

| Signal | Tracker action |
|---|---|
| Application received/confirmation | confirm `status=applied`; add confirmation date to notes |
| Rejection | `status=rejected`, date + one-line reason in notes |
| Interview request / scheduling link | `status=interviewing`, stage + date in notes; surface to the user prominently |
| Recruiter outreach about a NEW role | new `status=new` row (dedupe by matchKey first), `board=recruiter outreach` |
| Offer | surface to the user immediately; no automated status change |
| Ambiguous | list it for the user; make no change |

Match emails to rows by company name against the tracker (via
`scripts/tracker_io.py`), tolerant of subsidiaries/brand names — when uncertain,
ask rather than mis-file.

## Write back

Tracker rules apply (backup, fresh read, field-level updates, append-only). Every
automated status change appends a `[email-sync <date>]` breadcrumb to notes so the
user can always see why a status moved.

## Report

Lead with what needs the user: interview requests and offers first, with dates.
Then: N statuses updated (list), N new recruiter roles added, N ambiguous items
awaiting a call. If nothing changed, one line saying so.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "The email connector was working last session, I'll assume it still is" | Connection state can change between runs. No connector this run means say so and stop — not proceed on a memory of last time. |
| "This one reads like an interview invite, I'll mark it interviewing to be helpful" | If it doesn't cleanly match a classify-table row, it's ambiguous — list it for the user, don't force a classification to look decisive. |
| "I'll archive this so it doesn't get rescanned next time" | The mailbox is read-only. No archive, delete, label, send, or reply without an explicit user request — deduping future runs is not that request. |
| "Editing the tracker row directly is faster than going through tracker_io.py" | Every write goes through tracker_io.py, no exceptions — that's what enforces backup, fresh-read, and dedupe. Skipping it for speed skips the safety net. |
| "This offer email basically confirms the application, I'll bump the status too" | Offers get surfaced to the user immediately with zero automated status change — same for ambiguous hits. Convenience is not a reason to touch status. |

## Red Flags

- A tracker write that didn't go through `scripts/tracker_io.py`
- A status change made without a connected email tool, or after guessing at one
- Clicking a link inside an email to "check" something
- An automated status change on an offer or an ambiguous hit
- Sending, replying, archiving, deleting, or labeling mail without the user explicitly asking for it
- A company match filed against a tracker row on a hunch instead of asking when uncertain
