---
name: linkedin-profile
description: Turn the master resume and target career path into a LinkedIn profile that balances search visibility (recruiter and algorithm SEO) with a profile a real human wants to read — headline, About, Featured, Experience, Skills, custom URL. Use when the user wants to build, review, or refresh their LinkedIn profile, has exported their LinkedIn data or pasted their current profile text, or asks for help with their professional brand or online image. Works with the resume-writer agent for line-level language.
---

# LinkedIn Profile

Produces `Profile/LinkedInProfile.md`: a section-by-section draft the user copies into
LinkedIn's own editor by hand. Same division of labor as the rest of this plugin —
this skill drafts, it never opens a browser and edits the live profile itself. See
`Profile/_example-linkedin-profile.md` for the target shape (fictional persona).

## Prerequisites

Needs both of these to exist first — redirect rather than proceed without them:

- **`Master/MasterResume.md`** (via `master-resume`) — the evidence library every
  claim on the profile must trace back to.
- **`Profile/match-profile.md`** (via `job-profile`) — the target function keywords
  that tell you what this profile needs to rank for.

If either is missing, say so and hand off to that skill first. A LinkedIn profile
built before the target is settled just gets rewritten once it is.

## Gather the input

Ask the user for whatever they have — don't block on one specific format:

- **Data export** (Settings & Privacy → Data privacy → Get a copy of your data) — a
  zip of CSVs (`Profile.csv`, `Positions.csv`, `Skills.csv`, etc.). Messy but complete.
- **Pasted text** — headline, About, and Experience copied straight from their live
  profile. Fastest path, and fine on its own.
- **Profile URL** — read it directly if the user shares it and it's viewable.

Read whatever comes in against the master resume: anything on the current LinkedIn
profile that the master doesn't evidence gets flagged the same way an unverifiable
resume claim would — confirm with the user, don't carry it forward silently.

## Research LinkedIn-specific best practice before writing

LinkedIn's search and recommendation behavior shifts often enough that this needs a
fresh pass each time, the same discipline `master-resume` applies to market
vocabulary — don't write from memory of stale advice. It also needs a fresh
**skepticism** pass every time, for a reason specific to this topic (see below).

**Source discipline — read this before searching.** LinkedIn profile-optimization is
one of the most SEO-content-mill-saturated topics on the web. A search on "LinkedIn
algorithm 2026" returns dozens of near-identical blogs citing invented-sounding
specifics — a named "algorithm update," a precise multiplier ("21x more recruiter
attention," "10x algorithmic visibility") — that trace to no primary source and no
independent corroboration, just other blogs citing each other. Rank sources before
trusting a claim:

1. **Primary:** LinkedIn's own engineering blog, Talent Blog, Help Center, or a
   LinkedIn-authored paper (their research is on arXiv under the LinkedIn/FAIT name).
2. **Practitioner/sourcing community:** working recruiters and sourcers (SourceCon,
   ERE, RecruitingDaily, r/recruiting) describing what they actually search on —
   closer to ground truth than marketing content, but still anecdotal.
3. **Generic SEO/career-coach blogs:** treat every specific number as unverified
   until corroborated elsewhere. Directional claims ("a complete profile surfaces
   more often") are usually fine; a decimal-precision stat almost never is. Never
   put an unsourced number in front of the user as fact.

**What currently holds up** (verified against primary sources as of this writing —
re-verify rather than trusting this list forever):

- Recruiter/profile search still leans heavily on **exact matching against
  standardized title IDs** at the retrieval stage, with semantic expansion to
  related titles only when a search returns too few results (LinkedIn's own
  engineering write-up on Recruiter search). Practical effect: the headline and
  current-position title need real, recognizable title language a recruiter would
  actually type — not just evocative prose — even though the writing still has to
  read as a sentence, not a title stack.
- A **Skill only surfaces in a recruiter's skill filter if it's listed as an actual
  Skill entry** — mentioning it in About or Experience prose doesn't make it
  filterable, it only helps free-text keyword search.
- Profile completeness genuinely matters — LinkedIn's own stated figure is that
  complete ("All-Star") profiles are found dramatically more often — but treat the
  specific multiplier as LinkedIn's own marketing framing, not an audited number
  worth repeating to the user as precise fact.
- The **feed/content-ranking algorithm and the Recruiter/profile-search system are
  different systems** optimizing for different things (content engagement and dwell
  time vs. title/skill/experience match plus likelihood of a positive response).
  Advice about posting cadence or content format belongs to the feed algorithm and
  is out of scope here — don't let it leak into profile-section guidance.
- Directionally, unnatural keyword repetition reads as spam to a human reader
  regardless of what it does algorithmically — solid writing advice on its own
  merits, independent of how confidently a given blog asserts a stuffing "penalty."
- The "Open to Work" badge has a genuine public/private tradeoff (public banner
  visible to your current company's colleagues vs. "recruiters only") and mixed
  recruiter sentiment (efficiency signal to many, a "desperate" read in some
  agency/executive contexts) — surface the tradeoff and let the user choose; don't
  assert one setting is simply correct.
- **Don't over-fit to the algorithm.** A profile that reads as a keyword list to a
  human reader has already lost the recruiter who opens it. SEO earns the click;
  the writing earns the reply.

## Draft each section

Apply `Profile/content-rules.md` throughout — same rules as the resume (delivered
work only, no manufactured metrics, no unverifiable claims, client-naming per the
recorded decision, no age signals). LinkedIn voice differs from resume voice: **first
person, narrative, not bulleted resume fragments** — a wall of resume bullets pasted
into About is the most common failure mode here.

- **Headline (≤220 chars, only ~60–70 shown before truncation in search results and
  connection requests):** front-load a real, recognizable title-like phrase for the
  target function (retrieval matching leans on this), then extend into a readable
  sentence a human would say out loud — not a pipe-delimited stack of buzzwords.
  States the value the person delivers, not just a title.
- **About (≤2,600 chars, only ~300 shown before "see more"):** opens with the
  strongest hook in those first lines, tells the career arc in first person, weaves
  in the target-function keywords naturally rather than listing them, closes with
  what the person is looking for or open to.
- **Featured:** what to pin — a portfolio piece, a strong article, a certification —
  and why, if the user has candidates.
- **Experience:** per-role synopsis in first-person narrative voice, evidence-only,
  same delivered-work bar as the master resume. Cut anything that's just the resume
  bullet restated with "I" in front of it — that's not a rewrite, it's a paste.
- **Skills:** every target-function keyword that's genuinely true has to be added as
  an actual Skill entry, not just mentioned in prose elsewhere — a skill only
  surfaces in a recruiter's skill filter if it's listed as one. Pin the top 3
  deliberately by target-role relevance (these get the most prominent display), then
  the full deduped list.
- **Custom URL, photo, banner:** flag as the user's own action — this skill drafts
  text, it doesn't generate or upload images. Note best practice (real headshot,
  custom `linkedin.com/in/name` URL) without blocking on it.
- **Open to Work:** name the tradeoff (public badge — visible to colleagues at the
  user's current company too — vs. "recruiters only," which stays private from their
  employer) and let the user pick; don't default this silently.

## Language pass

Hand the drafted Headline, About, and Experience text to the **resume-writer** agent
for a line-level pass — no AI tells, no manufactured metrics, evidence-only, voice
consistency — with a note that this text is LinkedIn narrative voice (first-person,
prose), not resume-bullet voice, so it isn't flattened back into fragments.

## Output and handoff

Write `Profile/LinkedInProfile.md`, laid out section by section in copy-paste order.
The user pastes it into LinkedIn's editor themselves and publishes on their own
schedule — this skill never logs into or edits the live profile, for the same reason
no skill in this plugin fills or submits an application.

## Maintenance

Re-run after a real change: new role, new master-resume accomplishment, or a target
function change in `match-profile.md`. Diff against the existing `LinkedInProfile.md`
rather than rewriting it wholesale when only one section is stale.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "I have browser access, I'll just log in and update the live profile directly." | This skill drafts; it never edits the live profile, matching the plugin's applies/submits rule everywhere else. Write the draft file and hand it back for the user to paste in. |
| "The About section is basically the resume summary, I'll paste it in with 'I' added." | LinkedIn voice is first-person narrative prose, not resume bullets with a pronoun bolted on. A pasted bullet list reads as lazy to a human reader even if the keywords are all present. |
| "More keywords in the headline is strictly better for search." | A pipe-stacked buzzword headline loses the human reader who was about to click through. Front-load the real keywords, but it still has to read as a sentence. |
| "The export didn't have this claim, but it sounds like something they'd have done, I'll include it." | Anything on the profile that the master resume doesn't evidence gets flagged and confirmed with the user — never carried forward on a guess, same as an unverifiable resume claim. |
| "They haven't built a master resume yet, but I have enough from this conversation to draft a profile anyway." | The master resume is the evidence library every claim traces back to. Redirect to `master-resume` (and `job-profile` for the target) first rather than drafting against thin air. |
| "Multiple blogs agree on this specific stat, so it's probably solid." | LinkedIn profile-optimization content is unusually contaminated by SEO mills that cite each other in a loop — convergence across blogs is not corroboration. Check whether the claim traces to LinkedIn itself or a practitioner/sourcing-community source before repeating a number to the user. |

## Red Flags

- A skill in this session attempts to log into LinkedIn and edit the live profile instead of writing the draft file.
- About or Experience text reads as resume bullets with pronouns added, not first-person narrative.
- A claim appears in the draft that isn't evidenced in the master resume and wasn't flagged to the user.
- The headline is a buzzword pipe-list rather than a readable sentence.
- The skill runs before `Master/MasterResume.md` or `Profile/match-profile.md` exists.
- The full profile gets rewritten from scratch on a maintenance pass when only one section changed.
- A specific stat or a named "algorithm update" gets stated to the user with no primary or practitioner source behind it — just blog convergence.
- A target-function keyword lives only in About/Experience prose with no matching Skill entry added.
