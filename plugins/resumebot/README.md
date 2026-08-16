# resumebot

A job-search operating system for [Claude Code](https://claude.com/claude-code).
It turns a battle-tested manual process — one real search, hundreds of tracked
roles, dozens of applications — into a plugin anyone can run: build a master
resume, define what a good job looks like for *you*, then let scheduled scans,
packet builds, and email sync keep the pipeline moving while you spend your time
on the only part that needs you — applying and interviewing.

**Privacy note:** every example in this repo uses a fictional persona ("Jordan
Okafor"). Your real data lives only in your local workspace, never in the plugin.

## Install

```
/plugin marketplace add EricWurth/skills
/plugin install resumebot@ericwurth
```

Then say: **"set up resumebot"** — the guided setup scaffolds your workspace and
walks you through everything below in one sitting.

## What you get

| Piece | What it does |
|---|---|
| `setup` skill | Scaffolds the workspace, copies templates, offers to schedule the automations |
| `master-resume` skill + `resume-writer` agent | Interview-driven master resume; line-level language coaching with hard content rules (delivered work only, no AI tells, no manufactured metrics) |
| `job-profile` skill + `career-coach` agent | A coaching conversation that produces your match profile: broad search terms, four hard gates (staleness, fit, location, comp floor), bonuses, exclusions |
| `tracker` skill + Excel template | One xlsx as the single source of truth — 23-column schema, status lifecycle, dedupe key, live dashboard, backup-before-write discipline |
| `job-scan` skill | Scans boards/employer pages against your profile, scores finds, appends to the tracker. Never applies to anything |
| `build-packets` skill | Batch-builds tailored resumes from your standing variants, lint-gated, and flips roles to "ready" only when the file actually exists |
| `apply-tabs` skill | Opens your ready queue as browser tabs in priority order with a per-role checklist. You submit every application |
| `email-sync` skill | Reads application-related email (confirmations, rejections, interview requests) and updates the tracker with a breadcrumb trail |
| `interview-prep` skill | Builds a research-backed prep report for a specific interview: the core need behind the hire, stage-aware anticipated questions with story assignments, diligence questions to ask, and consistency/recency gates before it publishes |

## The workspace it creates

```
JobSearch/
  Master/          master resume (markdown source of truth)
  Variants/        standing tailored variants
  Applications/    one folder per application packet
  Tracker/         JobSearchTracker.xlsx  (+ backups/)
  Profile/         match-profile, content-rules, preferences, form answers
  Reference/       recommendation letters etc., attached as-is
  Archive/         retired files, dated
```

## Design principles (learned the hard way)

- **One source of truth per thing.** State lives in the tracker xlsx; policy lives
  in Profile/*.md; resume truth lives in the master. Forked copies always drift.
- **"Ready" means a packet exists.** A great fit score with no built resume is not
  ready to apply — the status flips only when the file is on disk.
- **Automation finds and prepares; the human applies.** No skill in this plugin
  fills or submits an application, ever.
- **Append-only automation with backups.** Every automated tracker write backs the
  file up first and only adds rows or updates named fields.
- **Wide net, hard gates.** Broad function searches with a scoring rubric beat
  narrow title searches. Only four things reject a role: staleness, genuine
  can't-do-it, location, comp floor. Everything else is ranking.
- **Documents are linted.** Generated resumes pass a preflight lint (no AI tells,
  no unverifiable claims, your confidentiality rules) before you ever see them.

## Scheduling

Setup offers to register four recurring tasks (nightly scan, packet build, morning
apply-tabs, daily email sync). Each scheduled prompt is one line invoking the
corresponding skill, so logic never forks between the schedule and the skill.

## Requirements

- Claude Code with browser access (for scans and apply-tabs)
- Python with `openpyxl` and `python-docx` (for tracker I/O and resume generation)
- An email connector (e.g. Gmail) if you want `email-sync`

## Maintaining this plugin

`scripts/make_tracker_template.py` regenerates
`templates/JobSearchTracker_Template.xlsx` from scratch. No skill invokes
it — `setup` copies the already-built file into a new workspace. Rerun it
by hand after a schema change; never hand-edit the shipped `.xlsx`.

## License

MIT — see [LICENSE](../../LICENSE).
