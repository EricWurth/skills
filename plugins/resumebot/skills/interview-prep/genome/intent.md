# Intent Spec: interview-prep

Spec version: 1.1
Current phenotype: SKILL.md (as packaged in the resumebot plugin)
Owner: the skill's user
Replayable: partially -- the report structure, gates, and red-team pass are
deterministic in shape; the research content (role best practices, company
context, current events) is live-web and varies by role. Golden examples
test process compliance and gate behavior, not exact report text.

## Purpose [INVARIANT]

Walk the user into any interview knowing (1) the core need the hire exists
to solve, (2) what good looks like for that function at that company, and
(3) what they'll be asked and how they answer in their own voice -- with
every claim about the user consistent with their standing rules and every
time-sensitive fact verified fresh. Generalizes across all roles, levels,
companies, and interview stages; never overfit to one function's domain.

## Inputs [INVARIANT]

- The job description (asked for if not found in Applications/ or tracker).
- Calendar entry for logistics, stage, and interviewer identity.
- Prior prep on the same company (local folders, Notion Job Hunt tree,
  vault/memory) -- built on, never silently contradicted.
- The user's master resume (Master/MasterResume.md, source of truth)
  and standing memory rules, for the consistency gate.
- The story bank (Notion or local) and the user's saved voice framings.

## Success criteria [INVARIANT]

1. The report states the core need -- what problem this hire is paid to
   solve -- in one sentence, derived from the JD's duty verbs, not its
   title or requirements list. Every other section serves it.
2. A "what good looks like" section exists for EVERY role and level (not
   just leadership): the frameworks, methodologies, and best practices a
   strong practitioner of this function would use, filtered through this
   company's specific context. Researched fresh per role, never recycled
   from a previous role's prep.
3. Question anticipation is stage-aware (recruiter / hiring manager /
   panel / exec screen for different things) and each anticipated question
   leads with method, then assigns exactly one story with a checkable
   result; stories are spread across engagements.
4. For leadership/program-owning roles, a problem-to-solve section
   sketches the implementation approach for the core need as approach +
   discovery questions -- never a finished prescription.
5. The consistency gate runs before publishing: no claim about the user
   may contradict the master resume or their standing rules (e.g. no
   certifications or candidacies claimed unless held; client
   confidentiality respected; no proposed-work-as-delivered).
   Submitted-resume drift is flagged in Open Gaps, not silently corrected
   or repeated.
6. The recency gate runs before publishing: every time-sensitive claim
   (laws, deadlines, names, news) is re-verified with a dated search in
   the current session, not carried from prior research or model priors.
7. A red-team pass happens unprompted before publishing; findings are
   fixed or moved to Open Gaps.
8. Open Gaps -- things only the user can answer -- appear at the top of
   the report, never buried or papered over with plausible filler.
9. The report publishes to Notion (Job Hunt > Interview Prep tree) when
   Notion is available, with a local copy in the company's Applications
   folder either way.

## Behavioral invariants [INVARIANT]

- Never present a claim about the user's credentials, clients, or delivery
  record that their master resume + memory rules do not support -- even if
  a submitted resume for this application says otherwise. (Origin: a prep
  doc coached claiming an in-progress certification when the user's
  standing rule was no-certs-no-candidacies; caught hours before the
  interview.)
- Never state a time-sensitive fact from memory or prior-session research
  without a fresh dated verification. (Origin: prepped a regulatory
  deadline as imminent months after the regulator had publicly deferred
  it by more than a year.)
- Never let reference material (frameworks, regulations, news) displace
  the core-need/program-build thread as the report's spine. (Origin: an
  interview centered on "how would you build our monitoring program";
  the prep led with framework recitation instead.)
- Never force a story that doesn't exist; a gap goes in Open Gaps.

## Free choices [IMPLEMENTATION MAY VARY]

- Search queries, sources, and depth for role/company research.
- Report length and section phrasing within the fixed section order.
- How many anticipated questions (stage-appropriate judgment).
- Which engagement each story draws from, provided spread is maintained.
- Whether the debrief capture lands in a vault episode or chat memory.

## Golden examples [MIGRATION TEST SET]

G-1: Cert-consistency catch.
  Input: submitted resume and draft prep both claim an in-progress
  certification; the user's standing memory rule says they hold no certs
  and no candidacies (willing-to-earn framing only).
  Expected: consistency gate catches the contradiction before publishing,
  corrects the verbal guidance to willing-to-earn, and flags the
  submitted-resume drift in Open Gaps. Failing shape: repeating the
  resume's claim because "that's what the interviewer will be holding."

G-2: Stale regulatory deadline.
  Input: prior-session research said a regulatory obligation takes effect
  in a few weeks; a later amendment had publicly deferred it by over a
  year.
  Expected: recency gate re-verifies with a dated search and publishes
  the corrected timeline. Failing shape: carrying the earlier finding
  forward because it was researched "recently" in a prior session.

G-3: Core-need spine (program-owning compliance role).
  Input: JD whose duty verbs are "lead the design and execution of
  monitoring and oversight... establish risk-based monitoring plans...
  implement automated monitoring."
  Expected: core need stated as building/running a compliance monitoring
  program; what-good-looks-like covers program lifecycle (inventory,
  risk-tiering, obligations-to-controls, monitoring plan, remediation,
  automation, reporting); problem-to-solve sketches that spine as
  approach + discovery questions. Frameworks (NIST/ISO) appear as
  reference, not as the spine. Failing shape: framework recitation up
  front, program build absent.

G-4: Story spread.
  Input: draft hangs credibility, gap-found, and two framework bridges
  all on the same engagement.
  Expected: red-team pass flags one-engagement overload and reassigns
  stories across the user's other engagements. Failing shape: shipping
  four answers anchored to one project.

## Eval notes

- Mechanically checkable: Open Gaps section present and first-or-second in
  the report; a dated verification search occurred in-session for each
  time-sensitive claim cited; no "candidate"/"certified" language absent
  a registered credential; client confidentiality rules honored in every
  story; one-story-per-question mapping; local copy always produced.
- Human-judged: whether the core-need sentence actually matches what the
  JD pays for; whether what-good-looks-like reflects the function's real
  best practices vs. generic filler; whether the problem-to-solve reads
  as confident-but-diagnostic rather than prescriptive.
- Known open gap: question-anticipation quality depends on the debrief
  loop (asked-vs-predicted) accumulating data; with no debriefs captured,
  anticipation is research-backed but uncalibrated to the user's actual
  interview history.
