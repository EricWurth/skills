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
