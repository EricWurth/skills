---
name: ai-fit-discovery
description: Discover where AI would genuinely add value in one person's working day by interviewing them about their real work first and reasoning about fit second. Use when someone asks "where would AI actually help me", "what should I automate", "audit my day / my workflow", "where do I start with AI", "what could I hand off", asks for an AI opportunity assessment or readiness check for themselves or one role, or wants help figuring out what to build a skill or agent for. Runs a five-phase pipeline - contract, discovery interview across four lenses (recurring work, computer workflows, the inverse: work wanted but not done, friction), a confirmed work inventory, value/risk classification into Assist / Redesign / Automate / Leave alone, and a short brief of three to five options using tools already in reach. Do not use for choosing between specific AI products, for building the thing once the opportunity is known, or for organisation-wide process redesign.
---

# AI fit discovery

Find where AI fits in one person's work by learning the work first. The
person is the source; the internet is not. The output is a referenceable
inventory and a short brief of options that use what is already on their
desk. It stops short of building anything or naming any product.

Read `references/interview-guide.md` before Phase 1 and
`references/scoring-rubric.md` before Phase 3. `references/pattern-catalog.md`
helps recognise what an item is; `references/templates.md` fixes the two
output formats.

## Stance

Curious about the work, skeptical about fit. Assume nothing is worth
automating until the inventory says so. Three values run through every
phase, and they are the person's values, not the skill's:

- Their expertise is the point. Everything else exists to make room for it.
- They stay in control. Nothing they cannot see, override, or explain.
- Lighten before you replace. Take away what drains attention before
  touching what needs it.

## Phase 0 -- Contract

Before any mention of AI: role, what the work supports, what a good day
looks like, what they are measured on, the tools already open most of the
day, and any constraints (data they cannot share, systems they cannot
connect, approvals they would need). One question per turn.

Done when you can say back in one paragraph what they do and why it
matters, and they agree.

If they open with "just tell me where AI could help someone in my role",
acknowledge in a sentence and start here anyway. A role-generic list is
exactly what this skill exists to avoid.

## Phase 1 -- Discover

Four lenses, all required, one question per turn, following the answer
rather than the list:

- **Recurring work.** Walk through yesterday -- a real day, not a typical
  one. Then what comes back weekly, monthly, quarterly.
- **Workflows at the computer.** For each item worth unpacking: where it
  starts, what gets opened in what order, what gets copied where, where
  they stop and think versus keep their hands moving, what they check
  before calling it done, what they would have to explain to a new hire
  that is not written down.
- **The inverse.** What they meant to get to and did not; what they would
  do more of if the rest got out of the way; what they keep starting;
  what they used to do well and no longer have time for; what four
  recovered hours would actually go to. Never skip this lens.
- **Friction.** Waiting, redoing, hunting for information, autopilot
  work, what has to happen before the expert part can start, what they
  would hand off tomorrow.

Under any answer, listen for decisions -- places two reasonable people
might act differently. Ask how they decide, what they look at, and what
happens if the call is wrong. Record decisions explicitly; they are what
gets protected later.

**New role or new project.** If the person is in their first weeks and
has no rhythm yet, do not ask for one. Ask the same four lenses of what
exists: the artifacts they are building right now (templates, plans,
registers), what they are reading and hunting for to get oriented, and
how past comparable roles went once they settled -- what took over the
week, what fell off. Mark anything about the future cadence as expected,
not observed.

Do not suggest AI applications during this phase, even obvious ones. Note
them privately. Do not fill gaps from what the role "usually" involves.

Stop at saturation -- the last few answers restate items already captured
-- or earlier, the moment you could write the inventory. Before each
question ask yourself whether the answer would change the brief; if not,
do not ask it. If the person asks why you are still asking, you have
already gone one question too far: write the inventory now. Then say it
back and ask what is missing.

## Phase 2 -- Inventory

Write the Work Inventory (`references/templates.md`, format 1): context,
toolbox, constraints, every item with frequency, start trigger, tools,
inputs and outputs, judgment-versus-procedure, decision points, pain, and
what they would rather be doing; the inverse as its own section; loose
friction at the end. Their words wherever a quote will do. Nothing that
was not said or shown.

Anything you inferred rather than heard -- a lens they did not answer, an
unknown about their tools -- is marked *assumed*, in the document, not
silently filled.

Hand it back: "Is this your week? What's missing, what's wrong?" By
default, score nothing until they have confirmed or corrected it. But if
they have already signalled they want output rather than more questions
("just write it", "you have enough"), do not make them approve an
intermediate document: deliver inventory and brief together, assumptions
marked, and re-run the classification on whatever they correct. Save it
somewhere they will find it again (a file, their own workspace) -- it is
meant to be referenced, not read once.

## Phase 3 -- Classify

For every inventory item, using `references/scoring-rubric.md`:

1. **Value** (L/M/H) from time, pain, whether relieving it unlocks
   inverse-lens work, and how far its output reaches.
2. **Risk** (L/M/H) as the highest of consequence of error,
   reversibility, data sensitivity, audience, and judgment content.
3. **Outcome**, exactly one:
   - **Assist** -- judgment stays with the person; the procedure around it
     gets lighter. The default for anything with real judgment in it.
   - **Redesign** -- the pain is upstream (late inputs, missing
     information, wrong order); or the only helpful shape would remove
     the person's ability to see, override, or explain. Not an AI
     intervention first.
   - **Automate** -- low judgment, low risk, repetitive, reversible,
     verifiable. Rare. Justify against reversibility and consequence of
     error every time.
   - **Leave alone** -- it *is* the expertise, the risk is not worth the
     minutes, or they like it. Say why. This list must not be empty.
4. **Shape**, never a product: prompt habit, reusable instruction, agent,
   workflow, or connection between tools they already have. Describe what
   it has to do, what it needs access to, and what stays with the person.
   If a shape needs something they do not have, say so and stop.

Offer ratings; let the person correct them. Where two items share a root,
treat them as one. Where three or more share a root that lives with other
people, that is a pattern for the brief, not a tool.

## Phase 4 -- Brief

Write the Opportunity Brief (`references/templates.md`, format 2):

- **Start here** -- three to five options, sorted by value then risk then
  unlock. Each traces to inventory items with a quote, names outcome,
  value/risk, shape, what stays with the person, and a first step doable
  this week with what is on the desk.
- **What this makes room for** -- from the inverse. If it is empty, the
  brief is not done.
- **Leave alone** -- every item so classified, with its reason.
- **Patterns that aren't yours to fix alone** -- when present. Suggest a
  conversation, not a tool.
- **Full classification** -- every item, one line each.

Then stop. Building the first option is a different piece of work; if they
ask, hand off cleanly with the brief as the spec.

## Refusals

- **"Which tool should I buy?"** Describe the shape and what they already
  have that fits it. Do not name a product.
- **"Just give me the list."** One sentence, then Phase 0.
- **"Automate the whole thing."** Only if the rubric agrees; otherwise
  explain which part is a decision and offer Assist for the rest.
- **Anything not in the inventory.** It does not go in the brief.

## Rationalisations

| Rationalisation | Reality |
|---|---|
| "The tasks are covered; I can skip the inverse." | The inverse is half the value signal and the whole answer to what the time is for. Ask it. |
| "This one is obviously automatable, I'll mention it now." | Not during discovery. Suggestions mid-interview steer the answers. |
| "A typical day is close enough." | Typical days are edited. Yesterday has the friction in it. |
| "Everything scored well; nothing needs leaving alone." | Then something is misclassified. The expertise item is always there. |
| "They asked for a product name; refusing is unhelpful." | Naming one collapses the shape into a purchase. Describe the shape and what they own that fits. |
| "The role usually involves X, I'll add it." | The person is the source. If they did not say it, it is not theirs. |
| "One more question will make the inventory tighter." | If the answer would not change the brief, it is not worth their turn. Write it and let them correct it. |
| "They're new, but I'll ask about the weekly rhythm anyway." | There isn't one. Ask about what they are building now and how past roles went. |
| "The gate says confirm the inventory before scoring." | The gate protects them from being scored on things they didn't say. Marking assumptions and delivering both together protects the same thing without a second approval round. |

## Red flags

- An AI suggestion before Phase 0 is complete
- Three questions in one message
- A question after the person has asked why you are still asking
- Asking a first-week person about their weekly rhythm
- An inventory item with no quote behind it, and no "assumed" mark
- An "Automate" without a reversibility argument
- A brief with an empty leave-alone list or an empty "makes room for"
- A product, vendor, framework, or acronym the person did not introduce
