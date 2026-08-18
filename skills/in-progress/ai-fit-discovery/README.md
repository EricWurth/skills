# ai-fit-discovery

Interview one person about their real work, then find where AI fits: an inventory, a classification, and three to five options.

## Why this exists

Ask where AI could help and you get the same list every time: draft the
emails, summarise the meetings, write the documents. It is not wrong, it
is just nobody's. It was written before anyone asked what the person
actually does, what they wish they had time for, or which parts of the
job are the job.

This skill inverts the order. It learns the work first (including the
work that is wanted and not done), writes it down so it can be referred
to later, and only then reasons about fit. It treats "leave that alone" as
a real answer, and it never names a product.

## How it works

1. **Contract.** Role, what the work supports, what a good day looks like,
   the tools already open, constraints. No mention of AI yet.
2. **Discover.** A one-question-at-a-time interview across four lenses:
   recurring work, workflows at the computer (yesterday, not a typical
   day), the inverse (what they'd rather be doing), and friction. Listens
   for decisions under the tasks. Stops at saturation, not a count.
3. **Inventory.** A referenceable document: every item with frequency,
   tools, inputs and outputs, judgment versus procedure, pain, and what
   they'd rather be doing; the inverse as its own section. The person
   confirms it before anything is scored.
4. **Classify.** Each item gets value and risk ratings and exactly one
   outcome: Assist, Redesign, Automate, or Leave alone. Interventions are
   described as shapes (a prompt habit, a reusable instruction, an agent,
   a workflow, a connection) that use tools already in reach.
5. **Brief.** Three to five "start here" options traced to what the
   person said, what the recovered time is for, the leave-alone list with
   reasons, and any pattern that belongs to the team rather than the
   person. Then it stops.

It refuses to produce a role-generic list, to name a vendor, or to put
anything in the brief that isn't in the inventory.

## Requirements

None. It is a conversation and two markdown documents; it runs in Claude
Code, Cowork, and claude.ai chat.

## What extends it

A connector to the person's own workspace (Notion, Drive) lets it save
the inventory where they will find it again. `discovery-questions` and
`critical-thinking`, when present, sharpen the interview and the
classification pass, but nothing depends on them.

## Install

```
cp -r skills/in-progress/ai-fit-discovery ~/.claude/skills/
```

On claude.ai, zip the folder and upload it under Settings.

## Use

Model-invoked. Triggers on "where would AI actually help me", "what should
I automate", "audit my day", "where do I start with AI", or a request for
an AI opportunity assessment for one person or role.

Wrong tool for: picking between specific products, building the thing
once you know what it is, or redesigning a process across a whole team.

## Limits

- One person at a time. It notices team-shaped patterns and names them
  as conversations to have; it does not run the team conversation.
- Only as good as the interview. Someone who answers in generalities gets
  a general brief; the skill pushes for a real day, but cannot force one.
- It classifies and stops. The first option still has to be built.
