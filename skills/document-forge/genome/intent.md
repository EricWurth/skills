# Intent Spec: document-forge

Spec version: 1.0
Current phenotype: SKILL.md plus agents/, scripts/, references/, evals/
(project-management copy, the most evolved lineage)
Owner: the skill's user (Eric)
Replayable: partially -- the stage sequence and artifacts are fixed;
content depends on the document, so golden examples test stage discipline
and artifact durability.

## Purpose [INVARIANT]

Produce business documents (memo, proposal, strategy doc, brief, report)
through a staged pipeline with coding-pipeline discipline: isolated task
scoping per stage, explicit acceptance criteria, durable review
artifacts, and a gate -- for documents where being wrong costs something.

## Inputs [INVARIANT]

- The decision or action the document must enable, stated in one
  sentence at Stage 1. If it cannot be stated, drafting does not start.
- The workspace (`system/`, `context/`, `projects/`, `outputs/`,
  `skills/`), created once by Stage 0's idempotent init.
- Governing style rules from `context/tone-of-voice.md`, established --
  never inferred mid-check.

## Success criteria [INVARIANT]

1. Stages run in order with narrow jobs; later stages never silently
   redo earlier ones; prior artifacts are re-read fresh, not recalled.
2. Stage 1 writes a durable brief with testable acceptance criteria,
   cross-checked against the document type's standard components -- a
   missing standard section is a completeness gap, and omissions are
   stated, never silently dropped.
3. Every factual claim is sourced or tagged `[assumption]`; prescriptive
   judgment calls are not held to the factual-claim bar, but quantified
   ones get tagged where a reader could mistake them for fact. The claim
   list lives in `projects/<project>/review-notes.md`, a real file.
4. The mechanical lint (5.5) separates always-real findings (unsourced
   numerics) from unconfirmed generic defaults, which never block or get
   bulk-fixed as if established.
5. The ground-truth check (5.6) verifies load-bearing named-practice
   claims with real research, or is skipped explicitly with the reason
   stated -- never run as theater. UNFINDABLE claims get labeled as the
   document's own judgment, never a manufactured citation.
6. The ambiguity pass (6) runs genuinely isolated: a subagent (or a
   fresh conversation in chat) reading the draft cold with
   `agents/ambiguity-reader.md` -- a same-context re-read is skipping
   the stage, not a lighter version. Findings append to review-notes.md.
7. The adversarial content review (6.5) runs isolated personas for any
   document whose wrongness costs something; findings classify as
   repair / needs research / design call, and generic-making fixes are
   design calls, never quiet edits.
8. Style (7) never cuts completeness: a terse voice writes a complete
   document in fewer words. A genuine conflict is named in the brief's
   acceptance criteria.
9. The contract check (8) walks every acceptance criterion; the gate (9)
   passes or fails naming the specific criterion, returns to the owning
   stage on fail, and cannot pass with an open CONTRADICTED verdict or
   unresolved finding lacking a stated resolution.

## Behavioral invariants [INVARIANT]

- A pre-existing draft is Stage 2/3 source material, never proof that
  stages 2-4 already happened.
- Skill-logic fixes propagate to the account-level copy, stated
  explicitly; project-specific fixes stay in the project.

## Free choices [IMPLEMENTATION MAY VARY]

- Persona count within 2-3 (third only when stakes justify it).
- Verifier clustering in 5.6.
- Section decomposition at draft time.
- Delivery mechanics per environment (direct write vs bridged copy),
  minimizing encoding detours.

## Golden examples [MIGRATION TEST SET]

G-1: No stateable decision.
  Input: a request to "write something up" with no decision it enables.
  Expected: stop at Stage 1 and pin the decision -- drafting now would
  produce well-written ambiguity.

G-2: Brevity vs completeness (documented failure, 2026).
  Input: house style is short and judgment-first; the document type has
  a standard section the brief did not name.
  Expected: the section is included (or its omission stated as a scoped
  exclusion); prose is tightened instead. Three template documents once
  passed every listed criterion while under-scoping their types -- the
  fix is Stage 1's type cross-check, and this fixture must catch it.

G-3: Same-context "ambiguity pass".
  Input: chat runtime, no subagents available.
  Expected: a genuinely separate cold conversation runs the reader;
  an inline re-read presented as the stage fails this example.

## Eval notes

- Mechanically checkable: review-notes.md exists and grows through
  stages 5/5.6/6/6.5; lint ran before stage 6; gate verdict names a
  criterion; no PASS with open non-CONFIRMED verdicts unresolved;
  `evals/cases/document-forge.json` fixtures pass.
- Human-judged: whether acceptance criteria were genuinely testable;
  whether design calls were surfaced rather than silently decided.
- Known failure history: the brevity-vs-completeness incident recorded
  in SKILL.md's Notes (three under-scoped template documents) -- the
  richest current source of discrimination fixtures.
