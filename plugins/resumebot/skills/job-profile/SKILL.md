---
name: job-profile
description: Build the user's match profile — target roles, hard gates, comp floor, location rules, exclusions — through a career-coaching conversation. Use when the user asks what jobs they should target, wants to set up or revise job-search preferences, or when job-scan has no Profile/match-profile.md to score against.
---

# Job Profile

Produces `Profile/match-profile.md`: the single source of truth every scan, score,
and scheduled task reads. See `Profile/_example-match-profile.md` for the target
shape (fictional persona).

Run this as a coaching conversation via the **career-coach** agent, not a form. The
agent's job is to surface options the user hasn't considered and to force real
decisions on the gates. Order matters — do gates before wish-list items.

## Start with example job descriptions

Before settling anything abstract, ask the user for 2–3 real job postings they'd
love to land (links or pasted text). Read each one and compare it against the
master resume:

- **Derive search terms from evidence:** the functions and vocabulary these
  postings share become candidate search keywords — grounded in real postings, not
  guesses.
- **Flag gaps honestly:** where a posting asks for something the master resume
  doesn't show, name it. Then dig before conceding — users routinely have relevant
  experience that never made it into the resume. Anything elicited this way flows
  back into the master via the master-resume skill.
- **Apply the best practice: a resume does NOT have to match 100% of a job
  description to be valid.** Posted requirements are a wish list; strong candidates
  routinely apply and win with partial matches. A gap is tailoring information and
  interview prep, never a reason to drop the role or to stuff the resume with
  claims the evidence doesn't support. Only a quantified years-of-specific-
  experience requirement that IS the role's core mandate counts as disqualifying.

## What the conversation must settle

1. **Function keywords (broad, not titles).** What functions can this person do?
   Search terms are FUNCTIONS ("operations", "governance", "business analyst"), never
   title+level combos ("Senior Director of Operations") — broad search plus scoring
   beats pre-filtering every time. Include adjacent functions the user is qualified
   for but wasn't considering; that is the coaching part.
2. **The four hard gates** (fail any one = reject):
   - **Staleness ladder:** defaults — under 42 days normal, 42–89 watch tier, 90+
     presumed dead unless republished. Verify dates on the real ATS page, not the
     board's label.
   - **Fit minimum:** could the user do the job at all, even as a stretch? The only
     auto-reject is a quantified years-of-specific-experience requirement that IS the
     role's core mandate.
   - **Location:** what is actually acceptable — remote? which metro? any relocation
     exceptions and why? State-restricted remote counts as a location gate.
   - **Comp floor:** the real walk-away number, not the hoped-for number.
3. **Bonuses (priority, never requirements):** preferred level band, comp-bonus and
   comp-win thresholds, preferred industries, location expediency tiers.
4. **Exclusions:** employers they will not work for (and why — bad exits, ethics,
   reapply blocks), aggregator handling (never auto-apply through an aggregator;
   always find the real employer), same-company dedupe preference.
5. **Effort-tier mapping:** which fit scores get a custom resume + letter, which get
   a tailored variant only, which get a generic variant. Defaults: fit 5 = custom +
   letter if the portal accepts one; fit 4 = tailored variant; fit ≤3 = generic
   variant, minimal work. Cover letters are AD-HOC by default — built only when the
   portal has the field or the user asks, because most portals have nowhere to put one.
6. **Work authorization facts** (citizenship/visa status) — recorded so scans never
   wrongly skip or flag roles.

## Coaching posture

- Challenge underselling: if the resume evidence supports a level the user isn't
  targeting, say so.
- Challenge overfiltering: every filter the user adds is jobs they never see. Push
  wish-list items from gates into bonuses.
- Wide-net philosophy while between roles: only hard gates justify dropping a role;
  everything else is ranking.

## Outputs

- `Profile/match-profile.md` — the rubric (structure per the example file).
- `Profile/preferences.md` — softer working preferences (batch sizes, notification
  wishes, cadences) from the template.
- Update `Profile/form-answers.md` — standing application-form answers (work
  authorization, notice period, relocation willingness, salary-question strategy).
  Two tiers: standing facts automation may fill silently, and judgment answers
  (comp numbers, essays, legal attestations) that are ALWAYS drafted for user
  approval, never auto-submitted.

## Maintenance

When the user reports a scan miss ("why did this good role get dropped?") or noise
("stop showing me these"), trace it to the specific gate/bonus line, propose the
edit, and update the file in the same session. The profile is living config.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "The user wants 'Senior Director of Operations,' I'll just search that" | Title+level combos are exactly what search terms must never be. Redirect to the underlying function ("operations") — broad search plus scoring beats pre-filtering every time. |
| "They said they'd rather not do hybrid, that's basically a location gate" | A soft preference isn't a gate unless it traces to a real disqualifier. Recording it as a gate hides jobs forever; it belongs in bonuses. |
| "This posting wants a skill the resume doesn't show, I'll flag the role as not viable" | A gap is tailoring information, not an auto-reject — dig first, since users routinely have relevant experience missing from the page. Only a quantified years-of-specific-experience requirement that IS the role's core mandate disqualifies. |
| "I already know their comp floor, I'll just fill in the negotiation essay for them" | Judgment-tier answers (comp numbers, essays, attestations) are always drafted for approval, never auto-filled or auto-submitted — only standing facts get silent automation. |
| "A quick form will get through the gates faster than a full conversation" | This runs as a coaching conversation via the career-coach agent, not a form — the point is surfacing options and forcing real decisions, which a form can't do. |

## Red Flags

- A search term that's a title+level string instead of a function
- A gate added without a traceable hard disqualifier behind it
- A resume gap treated as disqualifying without checking whether it's the quantified core-mandate requirement
- A judgment-tier form answer filled or submitted without surfacing it for user approval
- Wish-list items settled before the four hard gates
- Skipping the 2-3 example-posting step and jumping straight to abstract preferences
