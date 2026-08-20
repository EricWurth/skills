---
name: interview-prep
description: Build a complete, research-backed interview prep report for a specific job interview, publish it to Notion, then run a live mock interview round against it. Use this whenever the user asks for interview prep, help getting ready for an interview or screen, "prep me for my call with X", research on a company they're interviewing with, anticipated interview questions, or a mock/practice interview ("interview me", "run a mock", "let's practice my answers") — for any role, any company, any interview stage. Also use when they mention an upcoming interview and ask what they should know, study, or expect.
spec: genome/intent.md
---

# Interview Prep

Produce one organized prep report for a specific interview, then rehearse it live. The goal is not a research dump — it is to walk the user into the room knowing (1) what problem this hire exists to solve, (2) what good looks like in this function at this company, and (3) what they'll be asked and how they'll answer, in their own voice — and (4) having said those answers out loud at least once before it counts. The report is study material; interviews are performed.

## Why this skill exists

A real prep session failed in a specific way: the report was heavy on framework trivia (reciting NIST/ISO structure, regulatory news) and light on the thing the interview actually centered on — how to *build and run the program* the role exists to deliver. It also contained a claim about the candidate that contradicted their own standing rules, and a "current events" fact that had been superseded months earlier.

A second failure, found later: the "questions to ask" section was consistently flat — either generic enough to ask any company, or so deep in the weeds it belonged to week two of the job. Every question in it helped the candidate *do* the job; none helped them decide whether to *take* it. Section 6 was rewritten around that. The framing: the goal is to learn whether this is a great place to work.

A third set of gaps came from outside review rather than a lived failure. Research into how interviews are actually lost shows they're rarely lost on missing information — they're lost on delivery: fumbled "tell me about yourself" openers, vague stories that were never said aloud, no comp number ready when the recruiter asks. Mock-heavy prep cultures (consulting candidates run 20–40 live practice cases) far outperform document-only prep, yet most candidates never rehearse. That's why this skill now ends in a live mock round instead of at the published report, and why the staples and quick sheet exist.

Every step below exists to prevent one of those failures. Don't skip the gates.

## Inputs to gather first

- The job description (ask for it if not provided or findable in Applications/ or the tracker).
- Interview logistics: search the calendar for the company name — time, stage, interviewer name/title, join link. If the interviewer's name appears, do a quick search on their role/background; note if nothing is found rather than guessing.
- Which round this is and who it's with (recruiter screen / hiring manager / panel / exec). If unclear from the calendar entry, ask — the whole question-anticipation section depends on it.
- Prior context: check the Applications/ folder, Notion Job Hunt pages, and vault/memory for earlier prep on the same company. Build on it; never contradict it silently.

## Build the report in this order

### 1. Decode the role
Company, industry, and level (IC vs. leadership). Then the single most important output of this step: **the core need — what problem is this hire being paid to solve?** Derive it from the JD's actual duties (the "lead / build / establish / own" verbs), not its title or requirements list. State it in one sentence. Everything else in the report serves this sentence.

### 2. What good looks like (every role, every level)
For this function, in this organization: what are the established frameworks, methodologies, and best practices a strong practitioner would be expected to know and use? Research this fresh per role — the answer for an AI compliance auditor (program lifecycle, risk-based monitoring, control assessment) is different from a delivery director (portfolio governance, capacity models) or a BA (elicitation, requirements traceability). Filter through the company's context: their industry's regulators, standards bodies, market pressures, and any public statements about how they operate. This section answers: *if they hired me, what do I need to know to be effective on day 1?*

### 3. Stage and interviewer read
What this round screens for. Recruiter screens gate on basic fit, comms, comp, motivation. Hiring managers probe depth, problem-solving, and would-I-want-you-on-my-team; they live with the hire, so expect "how would you actually do this." Panels test consistency and cross-functional fit. Execs test judgment and strategic framing. Tailor everything downstream to the stage, and to the interviewer's function (a compliance leader probes ethics-under-pressure; an engineering leader probes technical judgment).

**Per named attendee, include a bite-sized need-to-know card** (three to five lines): role and background from a fresh search, what their round screens for, one connection point to the user's material, and one **don't**. Cards are scannable facts, not prose — they're what the user rereads between back-to-back sessions when there's no time for the full stage read.

### 4. The staples — asked in every round, fumbled most often
The questions that appear in every interview regardless of role or stage, drafted in the user's voice, never left to improvisation:
- **The opener.** "Tell me about yourself" is the single most-fumbled question in interviewing, and every round opens with some version of it. Draft it: 60–90 seconds, present → relevant past → why this role, landing on the core-need sentence from step 1. Built from the user's own saved framings, not a template.
- **Why this company / why this role.** One tier deeper than the website's About page — tied to something specific the research surfaced.
- **Why are you looking / why did you leave.** Honest, short, forward-facing. If there's a sensitive exit anywhere in the history, script the one-sentence version now, not live.
- **The comp answer.** Research the market range for this role, level, and metro fresh (recency gate applies — comp data goes stale). Give the user a researched range to state, and a walk-away floor for their own reference. Recruiter screens gate on this number; "what are you looking for?" answered with a stall reads as unprepared, answered with an unresearched number costs real money. For contract roles: rate, W2 vs. 1099, and benefits load-in belong here too.

### 5. Anticipated questions with story assignments
Research-backed where possible (search for common questions for this role type and stage). For each anticipated question, lead with the **method** (the "how" the interviewer is really asking for), then assign **one story** with a checkable result. Spread stories across engagements — hanging four answers on the same project sounds like a one-engagement career. Pull stories and STAR mechanics from the story bank if one exists (Notion or local), and use the user's own saved voice framings from memory before inventing generic formulas — their own framings beat textbook answers every time.

### 6. The problem-to-solve (leadership and program-owning roles)
For roles where the core need is building or running something: sketch the implementation approach the user would bring — the operational spine of standing up that program or process, derived from step 2's best practices. Frame it as **approach plus discovery questions**, never a finished prescription: "here's how I'd approach it, here's what I'd need to learn in the first 30 days to calibrate." Prescribing before diagnosing reads as arrogance; a framework held loosely reads as judgment. For IC roles, compress this to "how I'd run my first engagement."

### 7. Questions to ask — diligence, not performance

**The purpose of the user's questions is to find out whether this is a good place to work.** Not to demonstrate preparation. Questions that impress are a by-product; when they become the goal, the output turns to filler. Full method and per-round question bank: `Master/InterviewQuestionsByRound.html`. Apply it here rather than re-deriving it.

**The two failure modes to check every question against:**
- **Too generic** — could be asked verbatim at any company ("what's the culture like", "what does success look like in 90 days", "what do you like about working here"). The interviewer has a rehearsed answer. Zero information transfers.
- **Too far in the trenches** — a question for week two of the job, not for deciding whether to take it. Tooling, intake processes, meeting cadence. Burns a slot and presumes acceptance.

The right altitude is between them: how decisions actually get made, who holds authority over what, what happened the last time this went wrong, and who absorbs it when it does.

**Aim at what actually determines whether the year goes well.** In rough order of evidence: whether the role goes anywhere; day-to-day manager and team support (the strongest work-design predictor of turnover intention); real mandate versus responsibility-without-authority; whether they're being told the truth about the job; how work gets prioritized. Do **not** spend a question on org stability or reorg risk — it isn't detectable by asking and belongs in the Reference section from external research (LinkedIn tenure across the team, leadership churn, news).

**Five mechanics — every question in the report should use at least one:**
1. **Past, not hypothetical.** "When's the last time X happened" beats "how do you handle X." Values statements are free to produce; real incidents require retrieval.
2. **Specific enough that vagueness is visible.** A vague answer to a vague question tells you nothing; a vague answer to a specific one is a finding.
3. **Triangulate.** Pick facts that shouldn't vary — why the role is open, what this person is judged on at six months, the hardest part of the job — and ask them across rounds. Inconsistency is the signal.
4. **Check whether a promise is theirs to make.** When an interviewer commits to something ("we keep it lightweight", "you'd own that call"), the follow-up is *is that yours to set, or does someone else set the floor?* Catches sincere misrepresentation — Legal, Quality, Finance, or their own boss overruling a manager who genuinely meant it. In regulated environments this is mandatory, not optional.
5. **Frame so they don't have to badmouth their employer.** "What would you change if you could" gets what "what don't you like here" never will.

**Write each question with:** what it's diagnosing, what a good versus bad answer sounds like, and the one follow-up that stops a rehearsed answer. A question listed without these is not usable in the room.

**Calibrate to who is actually in the room.** Recruiters know comp bands, timeline, pipeline, and whether an internal candidate exists — nothing about team dynamics. Hiring managers are the only source for mandate, why the seat is open, budget reality, and their own standing. Peers give honest answers about the work and cagey ones about the manager, so ask about the team, never the person. Panels give the least question time per person — one question to the room. Execs know funding, strategy, and reorg history, not workflow. Third-party recruiters are paid on placement, so route contract terms to them and treat their urgency as a commission clock.

**Budget by round and rank before the user walks in.** Phone screen two, hiring manager four or five, panel one, exec two. Mark a Tier 1 that must be asked and a Tier 2 pick-list; an unranked list forces the user to re-derive priority live. Route anything the interviewer can't answer — comp, PTO, contract terms — to the right party in a separate block, and list explicitly what *not* to ask this person.

**Adjust for leverage.** Standard late-round advice ("what reservation do you still have about me", asking to speak with someone else) assumes a frontrunner in an unhurried process. For a contract candidate, a fast clock, or a competing candidate, both cost more than they return — flag them rather than including them by default.

**Contract and agency roles get their own block:** hard stop versus extension versus conversion *and when they'd find out*; the agency's own conversion record at that specific client, never the industry average; pay rate versus bill rate and the markup itemized; PTO and holidays paid or unpaid; when health coverage starts; bench policy if the engagement ends early; who is employer of record versus who directs the work.

Keep at most one "informed outsider" question that shows research — and mark researched current-events references as **hold, don't volunteer** (offering unprompted reads as "look what I found").

### 8. Open gaps — forward-facing actions only, top of the report
An open gap is something the user can still *do* before the call: look up a fact only they hold, supply a story the stage will demand, verify a claim, capture context from a prior round. Every entry names the action. What does NOT belong here: history that can't be changed — a submitted resume's stale wording, a past misstatement, anything that's water under the bridge. Those become **tripwires** attached to the relevant answer (and the Quick Sheet): one line saying what to say if it comes up. A gap list padded with unactionable record-keeping buries the two things the user actually needs to do tonight. Never paper over a real gap with plausible-sounding filler — a forced story collapses under one follow-up.

## The two gates (run both before publishing)

**Consistency gate.** Re-read the draft against the master resume (Master/MasterResume.md — source of truth) and the user's standing content rules in memory. Typical tripwires: **certifications never claimed unless actually held** (willing-to-earn framing otherwise); **client confidentiality respected** (sector + scale instead of names, if that is the user's rule); **proposed work never phrased as delivered**. If the submitted resume for this application contradicts the master (drift happens), record it as a tripwire on the affected answer — what to say if the interviewer raises the version they're holding — never as an Open Gap (the paper can't be changed, so there's no action) and never by repeating the resume's version to stay "consistent."

**Recency gate.** Every time-sensitive claim — laws, deadlines, leadership names, news — gets verified with a fresh search *with dates* before it goes in the report. Regulatory timelines shift, executives change, sanctions get resolved. A confidently stale fact is worse than no fact: it hands the interviewer a chance to correct the candidate.

## Red-team pass (mandatory, not on request)

Before publishing, re-read the whole report playing the interviewer: Does each story actually answer its assigned question, or a nearby easier one? Does any answer collapse under one obvious follow-up ("how do you know it worked?", "did they actually require that?")? Is any claim about the company checkably wrong or outdated? Is one engagement carrying too many answers? Fix what fails; move what can't be fixed into Open Gaps.

## Publish

Create the report as a child page under the company's page in Notion's Job Hunt > Interview Prep tree (create the company page if none exists), titled with the round and date — e.g. "Hiring Manager Round — [name] ([date])". Save a local copy in the company's folder under Resume/Applications/.

**Open the report with a one-page Quick Sheet** — the last-30-minutes view, readable in the parking lot: the logistics line (time, interviewer, join link), the core-need sentence, the opener, the comp range, the Tier 1 questions, and the question→story map at one line each. Everything on it appears in full later in the report; the sheet exists because a thorough report is unusable at T-minus-20.

Report order: Quick Sheet → Open Gaps → Core Need → What Good Looks Like → Stage Read → Staples → Questions & Stories → Problem-to-Solve → Questions to Ask → Reference (frameworks/news, clearly marked hold-vs-lead).

**Unpack acronyms on first use in the body.** Domain shorthand (regulatory programs, audit terms, internal project codenames) gets spelled out with a gloss the first time it appears — the user may need to say these correctly out loud, and a prep report that requires its own decoder fails at T-minus-30. The Quick Sheet may stay terse, but only with terms the body has already unpacked. Count the interview rounds from the user's side of the process (every conversation including recruiter screens), even when the company's own emails number them differently — note the company's label so the user can mirror it in the room.

## Mock interview mode (the default next step, not an add-on)

The report is study material; the interview is a performance, and the research is unambiguous about where interviews are lost — answers that were never said aloud. So the session doesn't end at publish. Hand the user the report, tell them to read it through, and say the mock starts whenever they're ready. Then run it.

**Run it as the interviewer, not as a coach with a script:**
- Adopt the persona of this round: the actual stage (recruiter / hiring manager / panel / exec) and, if known, the actual interviewer's function and background. A recruiter mock gates on staples and comp; a hiring-manager mock probes depth and "how would you actually do this."
- Open exactly like the real round will: "So, tell me about yourself."
- Ask one question at a time and wait for the answer. Draw mostly from the report's anticipated questions, but include one or two cold questions that are plausible for the round and *not* in the report — the real interviewer hasn't read it either.
- When an answer invites the obvious follow-up ("how do you know it worked?", "what was your role specifically?"), ask it live before giving any feedback. Surviving the follow-up is the test; the first answer is just the setup.

**Feedback, per answer, kept short:** what landed, what to tighten, and — only if the answer missed — a one-line reframe in the user's own voice. Score against the report's own bar: did the answer lead with method, did the story carry a checkable result, did it survive the follow-up. Never coach a claim the consistency gate would reject; the gates bind the mock as much as the report.

**Close with a debrief:** the two or three strongest answers (leave them alone), the weakest (drill these again), and anything the mock surfaced that the report missed — a gap goes into Open Gaps and the published report gets updated, not just mentioned in chat. Offer a second pass on the weak answers if there's time before the interview.

## After the interview

When the user next mentions how it went, offer two things:

**Thank-you notes.** Offer to draft a short personalized note per interviewer — referencing a specific point from the actual conversation (pulled from the debrief), not a template. One note per panelist for panel rounds. The user sends them; drafting is the help.

**A short debrief.** What was actually asked vs. predicted, what landed, what was missing. Capture it (vault episode if the vault is in use, or memory) so the next prep's question-anticipation is sharper. If the interview surfaced a prep failure, name it plainly and note which step above should have caught it — including whether the mock round rehearsed the answer that failed.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "The submitted resume already says they're cert-in-progress — matching it keeps the story consistent for the interviewer." | The interviewer holding a stale claim doesn't make it true. The consistency gate corrects the verbal guidance to the standing rule (willing-to-earn, not candidate) and records the drift as a tripwire on the affected answer — it never repeats the resume's version to stay "consistent." |
| "The resume discrepancy is important — it should go in Open Gaps so it isn't missed." | Open Gaps is for actions the user can take before the call. A submitted document can't be unsent; there is no action. It goes in the tripwires — one line on what to say if asked — where it's still visible without burying the real to-dos. |
| "I already researched this last week — no need to search it again today." | Regulations shift, executives change, sanctions resolve. The recency gate requires a fresh dated verification in this session; "recently" researched is not the same as "verified now." |
| "This is a compliance role, so I'll lead with the NIST/ISO structure — that's the standard reference." | Framework recitation is reference material, not the spine. The core need — what the hire is paid to build or run — has to lead; frameworks displacing it is the exact failure this skill exists to prevent. |
| "This project is their strongest story — it fits three of these questions well enough." | Hanging multiple answers on one engagement reads as a one-engagement career. Spread stories across engagements even when one story is objectively the best fit for several questions. |
| "There's no clean story for this one, but a composite built from two projects would read fine." | A forced or composited story collapses under one follow-up. No story beats a fabricated one — it goes in Open Gaps instead. |
| "The report is thorough — the mock is optional if the user seems confident." | Overconfidence is precisely the documented failure mode: experienced candidates assume the track record speaks for itself and fumble the opener. The mock is the default next step; skipping it is the user's call to make explicitly, never a silent omission. |
| "The user knows their own salary expectations — no need to research comp." | An unresearched number costs real money in both directions, and a stall reads as unprepared. The comp range gets a fresh dated search like any other time-sensitive claim. |
| "In the mock, their answer was weak — I'll suggest a stronger version of the story." | A stronger version that the master resume and standing rules don't support is a fabrication with a coach's fingerprints on it. The gates bind mock feedback exactly as they bind the report. |

## Red Flags

- A claim in the draft report (certification, client name, delivery status) doesn't match Master/MasterResume.md or the user's standing memory rules.
- A time-sensitive fact (law, deadline, executive name, news item) is cited with no dated search performed in this session.
- The report's opening sections recite frameworks or regulatory context before stating the core-need sentence.
- Two or more anticipated questions in the same report are assigned to the same engagement.
- A question or claim appears with no traceable story behind it and no corresponding Open Gaps entry.
- An Open Gaps entry names no action the user can take before the call (unchangeable history belongs in the tripwires, not the gap list).
- The report is published without a visible consistency-gate, recency-gate, or red-team pass having run.
- The report is published without a Quick Sheet page, a staples section (opener, why-here, why-looking, comp range), or a researched comp range with a dated source.
- The session ends at publish with no mock round run and no explicit decline from the user.
- Mock feedback coaches an answer or claim that the consistency gate would reject in the written report.
