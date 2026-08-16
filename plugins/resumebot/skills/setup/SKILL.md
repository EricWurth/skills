---
name: setup
description: Initialize a resumebot job-search workspace.
disable-model-invocation: true
---

# Resumebot Setup

One guided flow that takes a new user from nothing to a working job-search system.
Each stage is also independently re-runnable — if the user already has a resume or
half-finished workspace, pick up where they are instead of starting over.

## Stage 0 — Choose the workspace root

Ask where the job-search workspace should live (suggest `~/Documents/JobSearch` or
similar; on Windows prefer a OneDrive/Documents path so files sync). Create this
structure:

```
JobSearch/
  Master/          the master resume (markdown, source of truth) + docx template
  Variants/        standing tailored variants, one subfolder per variant
  Applications/    one folder per application packet: Company_RoleName/
  Tracker/         JobSearchTracker.xlsx
    backups/       timestamped copies made before every automated write
  Profile/         match-profile.md, content-rules.md, preferences.md, form-answers.md
  Reference/       recommendation letters, transcripts, anything attached as-is
  Archive/         retired resumes and superseded files, in dated subfolders
```

Copy these plugin files into place:
- `templates/JobSearchTracker_Template.xlsx` → `Tracker/JobSearchTracker.xlsx`
- `templates/content-rules-template.md` → `Profile/content-rules.md`
- `templates/preferences-template.md` → `Profile/preferences.md`
- `templates/form-answers-template.md` → `Profile/form-answers.md`
- `templates/CoverLetter_Guide.md` → `Master/CoverLetter_Guide.md`
- `examples/ExampleMasterResume.md` → `Master/_ExampleMasterResume.md` (reference only)
- `examples/example-match-profile.md` → `Profile/_example-match-profile.md` (reference only)

Also write a small `JobSearch/CLAUDE.md` recording the workspace root and pointing at
the Profile files, so any future session in that folder loads the right context.

## Stage 1 — Master resume

Invoke the `master-resume` skill. If the user has an existing resume file, start from
it; otherwise run the full interview. Output: `Master/MasterResume.md`.

## Stage 2 — Job profile

Invoke the `job-profile` skill (career-coach conversation). Output:
`Profile/match-profile.md` plus filled-in preferences.

## Stage 3 — Tracker orientation

Open the tracker template briefly and explain: one row per job, `matchKey` is the
dedupe key, `status` lifecycle is `new → ready → applied → interviewing` (or
`rejected`/`dead`/`deferred`), and **"ready" requires a built packet** — a role never
becomes ready until its tailored resume exists in `Applications/`. Point at the
tracker skill for the full rules.

## Stage 4 — Scheduling (optional, recommended)

Offer to register recurring tasks using the available scheduling tool. Suggested
defaults (user adjusts freely):

| Task | Cadence | Skill invoked |
|---|---|---|
| Job board scan | nightly, ~11pm local | `job-scan` |
| Build packets for new high-fit roles | nightly, after the scan | `build-packets` |
| Open apply tabs for ready roles | weekday mornings | `apply-tabs` |
| Email → tracker sync | daily | `email-sync` |

Each scheduled prompt should be one line: "Run the resumebot `<skill>` skill for the
workspace at `<root>`." All logic stays in the skills so there is one source of truth.

Warn the user: scheduled runs stall on any tool that lacks standing permission. After
registering, do one manual run of each task and grant the permission prompts before
trusting the schedule.

## Stage 5 — Wrap up

Summarize what exists, what was skipped, and the first manual action (usually: run a
first `job-scan` and review what lands in the tracker).
