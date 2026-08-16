# Intent Spec: tracker

Spec version: 1.0
Current phenotype: SKILL.md (as published)
Owner: the skill's user
Replayable: mostly -- the schema, dedupe key, status enum, and backup
rotation are all enforced mechanically by `scripts/tracker_io.py`, so most
of this skill's behavior is deterministic and script-checkable. The one
genuinely judgment-heavy step is the "ready" gate, which requires confirming
a tailored resume file actually exists in `Applications/` rather than
trusting a flag.

## Purpose [INVARIANT]

Be the single source of truth for job-search state: schema, statuses,
dedupe, append-only writes, and backups for `Tracker/JobSearchTracker.xlsx`.
Load before any read or write to the tracker, and whenever the user asks
about tracker columns, job statuses, or why a role is/isn't "ready".

## Inputs [INVARIANT]

- Read/filter/update/append requests against `Tracker/JobSearchTracker.xlsx`,
  issued through `scripts/tracker_io.py`.
- Job data to append: rows keyed by the 23-column schema (`id`, `company`,
  `title`, `status`, `fit`, `level`, `effort`, `variant`, `comp`,
  `compSource`, `location`, `moveType`, `sector`, `found`, `board`, `url`,
  `applyUrl`, `ats`, `notes`, `packetComplete`, `queueRank`, `matchKey`,
  `fitEvidence`).
- Status-change evidence: the user editing Excel directly, the user telling
  Claude directly, or `email-sync` evidence -- no other source is valid.
- Implicit: the live xlsx on disk, since the user edits it directly between
  runs and any in-memory copy goes stale immediately.

## Success criteria [INVARIANT]

1. Every write goes through `scripts/tracker_io.py`, never a direct
   read/edit of the sheet's full contents in context.
2. A row is added only after checking `matchKey` (lowercased
   `company|title`) against the full existing sheet; a match is skipped, not
   appended, and reported as a duplicate.
3. Every automated write is preceded by a timestamped backup in
   `Tracker/backups/`, and the backup directory is pruned to the newest 10
   files in the same pass.
4. A role reaches `status=ready` only when `packetComplete=TRUE` is itself
   verified against a real file in `Applications/` -- a high fit score alone
   never flips it.
5. A write that fails is retried once; if it still fails, findings go to a
   dated `Tracker/<date>-not-in-tracker.md` file and are flagged for manual
   merge, rather than being dropped.
6. The `Dashboard` sheet is never written to by automation -- it is
   formula-only and recalculates itself in Excel.

## Behavioral invariants [INVARIANT]

- Never fork tracker state into a second markdown/JSON "queue," "priority
  list," or "rescored" copy -- forked state drifts and eventually clobbers
  the real sheet. Scratch notes mid-scan must merge into the xlsx in the
  same pass.
- Append-only for automation: scans and syncs add rows or update named
  fields on existing rows; they never delete rows or rewrite the sheet
  wholesale.
- Read fresh immediately before writing -- never write from a stale
  in-memory copy, since the user may have edited the file directly since
  the last read.
- Dedupe by `matchKey` alone; `board` and `url` are never part of the
  identity, since the same job posted on two boards is one job.
- Automation never invents a status change -- status changes flow only from
  the user or from `email-sync` evidence.
- `tracker_io.py` itself enforces two hard gates on `append`/`update`:
  unknown columns abort the write (`error: unknown columns [...]`), and a
  `status` value outside `{new, ready, applied, interviewing, rejected,
  dead, deferred}` aborts the write (`error: bad status '...'`).

## Free choices [IMPLEMENTATION MAY VARY]

- Which `tracker_io.py` subcommand a given task uses (`filter`, `keys`,
  `counts`, `append`, `update`) -- driven by the task, not prescribed.
- Wording of free-text fields (`level`, `notes`, `fitEvidence`, `compSource`)
  and the `--reason` string passed to backups/updates.
- How results of a `filter` are summarized back to the user.
- Effort-tier and fit-score judgment calls themselves (the values are
  free text/1-5 score; the rubric for assigning them lives outside this
  skill).

## Golden examples [MIGRATION TEST SET]

G-1: Duplicate append.
  Input: `append` is called with a row whose `matchKey` (case-insensitive)
  already exists in the sheet.
  Expected: the row is not written; it appears in `skipped_duplicates` in
  the command's output, and the existing row is untouched.

G-2: High fit, no packet.
  Input: a role scores well against the match profile but has no tailored
  resume file in `Applications/`.
  Expected: `status` stays `new` (or whatever it already was) with a note
  such as "scored ready, packet pending" -- it is never set to `ready` on
  fit score alone.

G-3: Unknown column in append.
  Input: `append --rows rows.json` where a row object has a key not in the
  23-column schema.
  Expected: the command exits with `error: unknown columns [...]` and
  writes nothing -- no backup-then-partial-write.

G-4: Bad status value.
  Input: `append` or `update --set status=<value>` with a value outside the
  seven-value status enum.
  Expected: the command exits with `error: bad status '...'` before any
  write occurs.

G-5: Backup-before-write and rotation.
  Input: any successful `append` or `update` call, run when
  `Tracker/backups/` already holds 10 files.
  Expected: a new timestamped backup file is created in `Tracker/backups/`
  before the write lands, and the oldest backup is deleted so the folder
  still holds exactly 10.

## Eval notes

- Mostly script-checkable: G-1, G-3, G-4, and G-5 can be run directly
  against `tracker_io.py` and asserted on exit code / stdout / filesystem
  state, since the module enforces them independent of the model.
- G-2 is the one judgment-bound case -- it requires an LLM (or human) to
  check `Applications/` for an actual file, since `packetComplete` is just
  a boolean cell that could otherwise be set carelessly.
- Detectable failure signatures to watch for retrospectively: a row
  appended without a matching backup file timestamped just before it; a
  `ready` status with `packetComplete=TRUE` but no corresponding file in
  `Applications/`; a second state file (md/json) holding job data outside
  the xlsx.
