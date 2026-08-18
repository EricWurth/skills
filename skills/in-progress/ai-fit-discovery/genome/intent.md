# Intent Spec: ai-fit-discovery

Spec version: 1.0
Current phenotype: SKILL.md
Owner: the skill's user (Eric)
Replayable: partially -- the interview is live and personal, so golden
examples test discipline (what gets asked, what gets refused, what the
brief must contain), not specific findings.

## Purpose [INVARIANT]

Help one person find where AI would genuinely add value in their own
working day, by discovering their actual work first and reasoning about
fit second. The value is in the discovery and pattern recognition: a
referenceable inventory of what they do (and what they wish they had time
for), each item classified by value and risk, landing on a small set of
options that use tools already within reach.

The skill is the individual-scale front door to a process-level
methodology (CLEAR, in Notion). That relationship is *structural*, not
verbal: the skill reasons about decisions rather than tasks, prefers
relief before replacement, treats judgment and skill as things to protect,
and treats "leave it alone" as a first-class outcome. It never uses the
methodology's name or coined vocabulary in front of the person. What it
reinforces are values the person already holds -- their expertise
matters, they should stay in control, and nothing should be handed off
that they do not understand.

## Inputs [INVARIANT]

- One person, willing to talk about their work. No documents required.
- Optionally: a role description, a calendar week, a task list, or a
  tool list. These accelerate Phase 1 but never replace the interview.
- The operating stance: curious about the work, skeptical about fit.
  Assume nothing is worth automating until the inventory says so.

## Success criteria [INVARIANT]

1. Phase 0 (contract) establishes role, constraints, the tools already in
   reach, and what a good day looks like -- in the person's own words --
   before any question about AI is asked.
2. Phase 1 (discover) covers all four lenses: recurring tasks; workflows
   at the computer (walk through a real recent day, not a typical one);
   the inverse -- work wanted but not done, dropped, or deferred; and
   friction -- waiting, redoing, hunting for information, autopilot work
   done before the expert part can start. One question at a time. Stops
   at saturation (new answers restate earlier ones), not at a count.
3. Phase 2 (inventory) produces the referenceable document: every item
   with frequency, duration, tools, inputs and outputs, how much of it is
   judgment versus procedure, the pain, and what the person would rather
   be doing. The person confirms or edits it before anything is scored.
   Nothing that was not said or shown appears in it.
4. Phase 3 (classify) scores each item on value and risk using the
   rubric, assigns one of four outcomes -- **Assist**, **Redesign**,
   **Automate**, **Leave alone** -- and names an intervention *shape*
   (a prompt habit, a reusable instruction, an agent, a workflow, a
   connection between existing tools). No product names. No new tools to
   buy or build. Every "Automate" is justified against reversibility and
   consequence of error; every high-value item that lands in "Leave
   alone" says why.
5. Phase 4 (brief) presents three to five "start here" options, each
   traced to inventory items in the person's words, plus the leave-alone
   list with reasons, plus what the recovered time is *for* (from the
   inverse lens). It ends by noting, without a name, when a pattern looks
   like it belongs to the team or the process rather than the person --
   and stops there.

## Behavioral invariants [INVARIANT]

- The person is the source. Never search the web for "tasks a [role]
  does" and never pad the inventory from general knowledge.
- The inverse is always asked. Wanted-but-undone work is half the value
  signal and the whole answer to "what is the recovered time for."
- Risk before enthusiasm. A "Leave alone" list is mandatory output; a
  brief with nothing left alone is treated as unfinished.
- Use what is on the desk. Never recommend a specific vendor, product,
  or purchase; never propose building new tooling. Shapes only.
- Judgment stays with the person. Anything that removes their ability to
  see, override, or explain a result is a Redesign question, not an
  Automate.
- No listicle. Generic suggestions ("use AI to draft emails") are refused
  unless an inventory item calls for exactly that.
- Ask one question at a time. Batching questions produces thin answers.
- Plain language throughout. No framework names, no coined terms, no
  acronyms the person did not introduce.

## Free choices [IMPLEMENTATION MAY VARY]

- Question order and phrasing within each lens.
- Inventory size; the stop rule is saturation.
- Output medium: markdown always; a page in the person's own workspace
  (Notion, Drive, a file) when a connector is present and they ask.
- Whether to run Phase 3 in one pass or item by item with the person.
- Loading a discovery-questions or critical-thinking skill when present.

## Golden examples [MIGRATION TEST SET]

G-1: The listicle.
  Input: person says "just tell me where AI could help someone in my
  role."
  Expected: one sentence acknowledging, then Phase 0 begins. Producing a
  role-generic list fails this example.

G-2: The tempting automation.
  Input: inventory item -- weekly, 3 hours, painful, but the output goes
  to a regulator and errors are hard to reverse.
  Expected: high value, high risk. Lands in Assist or Redesign with the
  person still reviewing every output, or Leave alone with the reason
  stated. Landing in Automate fails.

G-3: The missing inverse.
  Input: Phase 1 reaches saturation on tasks and friction; the person has
  not been asked what they would rather be doing.
  Expected: the inverse is asked before the inventory is written. A brief
  whose "recovered time" section is empty or invented fails.

G-4: The vendor question.
  Input: person asks "so which tool should I buy for this?"
  Expected: describes the shape (what the intervention has to do, what it
  needs access to, what stays with the person), notes what they already
  have that fits the shape, and declines to name a product.

G-5: The team-shaped pattern.
  Input: three inventory items share one root -- information the person
  needs lives with someone else and arrives late.
  Expected: named in the brief as a pattern that is not the person's to
  fix alone; suggested as a conversation, not a tool. No methodology
  named.

## Eval notes

- Mechanically checkable: Phase 0 precedes any AI question; every lens
  asked; inventory confirmed before scoring; four-outcome classification
  present for every item; leave-alone list non-empty; no product names;
  no framework vocabulary in output.
- Human-judged: whether the "start here" options are genuinely the best
  three to five; whether risk reasoning is honest rather than reflexive;
  whether the brief reads as the person's work rather than the model's.
- No failure history yet -- this genome is the baseline.
