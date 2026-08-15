---
name: master-resume
description: Build or maintain the user's master resume — the single source document all tailored versions are cut from. Use when the user wants to create a resume from scratch, import an existing resume into resumebot, add new accomplishments, or revise resume language. Works with the resume-writer agent for line-level language coaching.
---

# Master Resume

The master resume (`Master/MasterResume.md`) is the evidence library: everything true
and impressive about the user's career, in one leadership-grade document that
tailored variants SUBTRACT from. Variants never invent; they cut.

See `Master/_ExampleMasterResume.md` for the target structure (fictional persona).

## Building from scratch — the interview

Run a conversational interview, one era at a time, newest first. For each role:

1. **The frame:** employer, title(s), dates, team size, who they reported to.
2. **The wins:** "What are you proudest of from this role?" Then push for evidence:
   what shipped, what changed, who noticed. Capture numbers only where the number
   itself is the story (money, team size, time cut) — do not manufacture metrics.
3. **The hidden material:** promotions, mentoring, things they built that outlived
   them, work they did that wasn't in the job description. Users under-report these;
   ask directly.
4. **The verbs check:** every bullet should name a real delivered thing. "Responsible
   for X" becomes "did X" or gets cut.

Then assemble: header note (standing rules) → name/contact → professional summary
(3–4 sentences, career arc not adjectives) → selected achievements band (the 4–6
facts a skimming recruiter must see) → core competencies grouped by theme → per-role
experience → professional development.

## Importing an existing resume

Read it, map it into the master structure, then interview only for the gaps: missing
metrics, missing promotions, thin recent roles. Flag anything that smells like an
unverifiable claim and confirm it with the user rather than carrying it forward.

## Research the language (don't skip this)

The words the user reaches for are rarely the words the market searches for. For
each role family the user targets, do fresh online research before locking the
master's vocabulary:

- **How the market names this work:** pull a sample of current postings for the
  target role families and note the recurring terms for skills, deliverables, and
  methods. Professional-body vocabulary matters too (the user's field's equivalent
  of PMI/IIBA/SHRM language) — ATS screens and recruiters search on these.
- **Translate, never import:** rename what the user genuinely did into the
  market's term for it ("stakeholder management" for what they called "keeping
  everyone aligned"). The evidence bar doesn't move — if the user hasn't done the
  thing, the keyword doesn't go in.
- **Competencies are where this lands hardest:** group them by theme using the
  researched terms, a few per group. This is ATS keyword alignment at the source —
  done once here, every variant and tailored cut inherits it.
- **Refresh when targets change:** new role family in the match profile = new
  language research pass.

## Writing for AI screening

Increasingly, the first reader is an LLM — either inside the ATS or a recruiter
pasting the resume and JD into a chatbot for a match summary. (Unlike the rest of
this system, this section is general best practice, not battle-tested — treat it
as advice, revise as evidence comes in.)

- **Write for a faithful summary.** Assume the resume will be summarized by AI
  for a human who reads only the summary. If an accurate summary of your master
  is the pitch you want, you win; the summary leans hardest on the top of the
  document, which is what the professional summary and achievements band are for.
- **Semantic match beats keyword density.** LLM screeners understand that
  "delivery leadership" covers "program management" — so honest, plain
  descriptions of real scope carry more weight than keyword repetition. Keep the
  researched market vocabulary (it serves keyword-ATS and recruiter search too),
  but never degrade a sentence to fit a keyword in twice.
- **Specific and verifiable outscores generic.** LLM screeners rank concrete
  claims (what shipped, scale, outcome) above adjective prose — and generic
  AI-sounding filler blends into the pile of AI-written resumes they now read
  all day. The no-AI-tells and evidence-only rules aren't just for humans.
- **Consistency gets checked.** AI screeners flag date overlaps, title
  mismatches, and internal contradictions far more reliably than a skimming
  human. The claims-audit red-team pass below covers this; treat a machine as
  the auditor.
- **Structure must parse.** Single column, standard section headers, no tables,
  text boxes, or graphics — a parsing failure ends the candidacy before any
  intelligence is applied. (The plugin's docx generator is deliberately plain
  for exactly this reason.)
- **Never game it.** No hidden white text, no pasted-in prompt instructions, no
  invisible keyword blocks. Detection is routine, it reads as fraud, and it
  fails the only durable strategy: a resume whose claims survive any reader,
  human or machine.

## Red-team passes

Once the draft stabilizes, review it adversarially before calling it done. Run
each pass as a distinct read (the resume-writer agent can execute them):

1. **Recruiter skim (6 seconds):** what actually lands in a fast top-to-bottom
   scan? Cut trailing hedges and qualifiers, strengthen the opening of every role,
   check the achievements band carries the story alone.
2. **Growth-story read:** does the career arc show progression? Promotions and
   scope increases must be visible, not implied — and titles sharpened for
   accuracy, not inflated.
3. **Claims audit:** every bullet checked against "did this actually ship, and
   would the user defend this sentence out loud in an interview?" Anything
   unverifiable gets cut or confirmed with the user.

Record each incorporated pass as a one-line note in the master's header changelog
so future sessions don't re-litigate settled edits.

## Standing content rules

Load `Profile/content-rules.md` and apply it to every line. Defaults the template
ships with:

- **Delivered work only.** Never "designed/built/established" for anything that
  didn't ship. Unexecuted proposals are not resume material even with a caveat.
- **No manufactured KPIs.** A metric on every bullet reads as dated resume-speak.
- **No certifications unless actually held.** Never "candidate" status.
- **No AI tells:** no em dashes, no mid-sentence inline bolding, no formulaic
  bold-lead-in bullets, no rule-of-three flourishes.
- **Client confidentiality:** if the user's work was client-facing, ask whether
  clients may be named; default to sector + scale descriptions ("a regional grocery
  distributor") and record the decision in content-rules.md.
- **No age signals:** no graduation years, no "25+ years."
- **Gaps: silence by default.** Never preemptively address a qualification gap.

## Language coaching

For line-level rewriting — tightening bullets, de-jargoning, voice consistency —
hand the text to the **resume-writer** agent with the relevant content rules. Batch
edits: collect all requested changes in a review pass, apply them in one edit, not
one round-trip per line.

## Variants

**The goal: every main role family the user applies to has a finished, standing
variant — so preparing an application is a light copy-and-tweak, not a fresh
writing job.** If packet prep regularly involves real writing, the variant set is
wrong or incomplete; fix the variant, not the packet.

Once the master is stable, derive 2–4 standing variants into `Variants/<Name>/` —
one per distinct role family the user targets (the job-profile skill defines these).
Each variant is a named cut: which roles lead, which bullets stay, which summary
opens. Record the catalog (variant name → role types it serves) at the bottom of
`Profile/match-profile.md`.

Tailored per-application resumes start from a variant. **Custom cuts from the
master are reserved for roles that don't map cleanly to any variant** — hybrid
roles that straddle two families, or genuine one-offs. When the same "hybrid"
shape keeps appearing in the tracker, that's the signal to promote it to a new
standing variant rather than keep hand-cutting.

## Maintenance

New accomplishments append to the master first, then flow into variants. The master
carries a header changelog note (see the example) so every edit session sees what
has already been incorporated.
