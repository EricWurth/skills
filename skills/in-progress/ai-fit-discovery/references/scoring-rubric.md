# Scoring rubric

Applied per inventory item in Phase 3. Scores are the person's judgment
where possible -- offer a rating, let them correct it.

## Value (Low / Medium / High)

Combine:

- **Time.** Frequency × duration. Weekly 30 minutes and monthly 4 hours
  are both about 2 hours a month; treat them alike.
- **Pain.** How much the person dislikes it, or how much it drains
  attention from work that needs them.
- **Unlock.** Whether relieving this item frees time for something named
  in the inverse lens. An item that unlocks wanted work outranks one that
  merely saves the same minutes.
- **Reach.** Whether the item's output feeds other people's work. Ripple
  raises value -- and raises risk (below).

## Risk (Low / Medium / High)

Take the highest of:

- **Consequence of error.** What happens if the output is wrong. Nothing
  / annoying / costly / hard to recover from.
- **Reversibility.** Can a bad result be caught and undone before it
  matters? A draft the person reads is reversible. A message that has
  been sent is not.
- **Data sensitivity.** Personal, financial, legal, health, confidential,
  or regulated data raises risk regardless of the other factors, and may
  make some shapes unavailable.
- **Audience.** Internal scratch work / colleagues / customers, partners,
  regulators, the public.
- **Judgment content.** How much of the item is a decision rather than a
  procedure. Decisions are where risk lives; a "procedure" that turns out
  to be full of quiet decisions is High until proven otherwise.

## The four outcomes

Assign exactly one:

| Outcome | When | What it looks like |
|---|---|---|
| **Assist** | Judgment stays; procedure around it is heavy. Value any, risk Low-Medium. | Drafting from a structure the person supplies, summarising inputs, preparing options, checking a result -- the person still reads, decides, and sends. |
| **Redesign** | The item is painful because the process around it is broken -- late inputs, missing information, work done in the wrong order. Often high risk. | Not an AI intervention first. Change who does what when; then revisit. Also the answer whenever a shape would remove the person's ability to see, override, or explain a result. |
| **Automate** | Low judgment, low risk, high repetition, reversible, output verifiable. | Runs without the person, with a way to check it did what it should. Rare. Justify against reversibility and consequence of error every time. |
| **Leave alone** | The item *is* the expertise, or the risk is not worth the minutes, or the person likes it. | Named, with the reason. Mandatory that this list is non-empty. |

Tie-breakers:

- High value + Low risk + low judgment → Automate candidate.
- High value + any risk + real judgment → Assist.
- High value + High risk → Redesign or Leave alone; Assist only with the
  person reviewing every output.
- Low value → Leave alone unless it is a two-minute Assist habit.

## Intervention shapes

Name a shape, never a product. Describe what it has to do, what it needs
access to, and what stays with the person.

- **Prompt habit** -- a repeatable way of asking that the person types
  themselves. Zero setup.
- **Reusable instruction** -- a saved set of instructions (a skill, a
  custom instruction, a template) that captures how they want it done.
- **Agent** -- something that runs a multi-step piece of work end to end
  and hands back a result for review.
- **Workflow** -- a trigger-and-steps automation, usually between tools
  they already use.
- **Connection** -- giving a tool they already use access to information
  it currently lacks (a calendar, a drive, a mailbox).

If a shape needs something they do not have, say so and stop. Do not
propose acquiring it.

### A shape is a system, not a task

"Build the templates" is a task. It gets done once, and the next document
is on its own. When an item repeats -- documents, reports, notes, plans
-- describe the shape as the thing that makes the *next* one right
without the person starting over:

- **What it takes in.** The few facts the person supplies each time.
- **What it knows.** Voice and brand, the standard the output has to meet
  (a template standard, a house style, a regulatory format), the
  instructional and placeholder text that makes the output usable by
  someone else.
- **What it checks.** A quality gate: completeness against the standard,
  consistency with the other documents in the set, nothing left as a
  bare placeholder, version and date stamped.
- **What it keeps.** A register of what exists and which version is
  current -- often the answer to a "which document is real?" pain that
  showed up elsewhere in the inventory.

If the option can be described in one sentence as "make X", it is
underspecified. Ask what makes the third X as good as the first.

## Ordering the brief

Sort by value descending, then risk ascending, then by whether it unlocks
inverse-lens work. Take the top three to five. If two candidates address
the same root, present them as one.
