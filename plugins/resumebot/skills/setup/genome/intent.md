# Intent Spec: setup

Spec version: 1.0
Current phenotype: SKILL.md (as published)
Owner: the skill's user
Replayable: partially -- Stage 0's directory/file scaffolding is fully
mechanical, but Stages 1-4 delegate to conversational skills (master-resume,
job-profile) and user choices (workspace root, whether to schedule), so
golden examples below test process and gate compliance, not exact output
text.

## Purpose [INVARIANT]

Take a new user from nothing to a working job-search system in one guided
flow: workspace root, master resume, job profile, tracker orientation, and
optional scheduling. Each stage is also independently re-runnable, so a user
who already has a resume or a half-finished workspace picks up where they
are instead of starting over.

## Inputs [INVARIANT]

- Where the workspace should live (asked of the user, with a suggested
  default).
- An existing resume file, if the user has one -- master-resume starts from
  it instead of running the full interview.
- The plugin's own template and example files: `JobSearchTracker_Template.xlsx`,
  `content-rules-template.md`, `preferences-template.md`,
  `form-answers-template.md`, `CoverLetter_Guide.md`, `ExampleMasterResume.md`,
  `example-match-profile.md`.
- The `master-resume` and `job-profile` skills, invoked in turn.
- Availability of a scheduling tool, for the optional Stage 4.

## Success criteria [INVARIANT]

1. Stage 0 creates the full `JobSearch/` tree (Master, Variants,
   Applications, Tracker/backups, Profile, Reference, Archive), copies the
   seven named template/example files into their specified destinations, and
   writes `JobSearch/CLAUDE.md` recording the workspace root and pointing at
   the Profile files.
2. Stage 1 invokes `master-resume` (starting from an existing resume file if
   the user has one) to produce `Master/MasterResume.md`.
3. Stage 2 invokes `job-profile` to produce `Profile/match-profile.md` plus
   filled-in preferences.
4. Stage 3 walks the user through the tracker's row model: one row per job,
   `matchKey` as the dedupe key, the status lifecycle
   `new -> ready -> applied -> interviewing` (or `rejected`/`dead`/`deferred`),
   and states plainly that **"ready" requires a built packet** -- a role
   never becomes ready until its tailored resume exists in `Applications/`.
5. Stage 4, offered as optional, proposes recurring tasks (job board scan,
   packet building, apply-tab opening, email-tracker sync) with suggested
   cadences the user can adjust; each registered prompt is one line naming
   the resumebot skill to run; the user is warned that stalled tool
   permissions will block scheduled runs, and one manual run of each task is
   done, with permissions granted, before the schedule is trusted.
6. Stage 5 summarizes what exists, what was skipped, and the first manual
   next action.

## Behavioral invariants [INVARIANT]

- Never force a full restart for a user with an existing resume or a
  half-finished workspace -- stages are independently re-runnable, and
  setup picks up where the user already is. (Origin: SKILL.md states this
  directly -- "Each stage is also independently re-runnable... pick up
  where they are instead of starting over.")
- Stage 4 (scheduling) is offered, not mandatory -- it is marked
  "(optional, recommended)"; suggested cadences are defaults the user
  adjusts freely, never locked in.
- Scheduled prompts stay a single line delegating to the named resumebot
  skill ("Run the resumebot `<skill>` skill for the workspace at `<root>`")
  -- logic stays in the skills, not duplicated into the schedule.
- Never register a schedule and walk away -- do one manual run of each task
  and get its permission prompts granted before trusting it unattended.
- The tracker's "ready" gate is stated as a rule during Stage 3, not
  softened or omitted: a role isn't ready without a built packet already in
  `Applications/`.

## Free choices [IMPLEMENTATION MAY VARY]

- Exact wording of the Stage 0 workspace-root question and the suggested
  default path.
- How much of master-resume's interview runs versus starting from an
  existing file -- left to the master-resume skill's own judgment.
- Which scheduling tool is used to register the recurring tasks.
- Presentation and length of the Stage 5 wrap-up summary.

## Golden examples [MIGRATION TEST SET]

G-1: User with an existing resume and partial workspace.
  Input: the user already has a resume file and some `JobSearch/` folders in
  place.
  Expected: setup resumes from whatever state already exists -- e.g. it
  does not re-create Stage 0 structure that's already there, and
  master-resume starts from the existing file -- rather than re-running the
  full flow from scratch. Failing shape: forcing Stage 0 through Stage 5 in
  full regardless of existing state.

G-2: Declining Stage 4.
  Input: the user says no to scheduling.
  Expected: setup still completes through Stage 5, with scheduling noted as
  skipped; nothing in Stages 0-3 or the wrap-up depends on it having run.
  Failing shape: treating scheduling as required to finish setup.

G-3: Tracker "ready" explanation.
  Input: Stage 3 tracker orientation.
  Expected: the explanation states plainly that "ready" requires a built
  packet -- a role isn't ready until its tailored resume exists in
  `Applications/`. Failing shape: describing the status lifecycle without
  that gate, or implying "ready" can be set before a packet exists.

## Eval notes

- Mechanically checkable: the seven named template/example files land at
  their specified destinations; `JobSearch/CLAUDE.md` gets written; the
  Stage 3 explanation mentions the ready-requires-packet rule; each Stage 4
  prompt is one line and names a resumebot skill.
- Human-judged: whether "pick up where they are" was actually honored for a
  half-finished workspace (no re-asking questions already answered, no
  re-creating files already present); whether the Stage 5 summary
  accurately reflects what was skipped versus done.
- Known open gap: SKILL.md does not specify how setup detects existing
  state -- what counts as "already has a resume," how a half-finished
  folder is recognized. That detection logic is left to the phenotype's
  judgment, not pinned down as an invariant.
