# Skill-evolution technique library

Reference catalog for the evolution process. Each entry: what it is, when
the signal to use it is present, what it actually buys you, what it costs,
and which free-choice category it occupies. This file is read at the start
of every evolution run and is meant to grow -- new techniques get appended
with a dated entry, not inserted by rewriting history.

Research pass: 2026-07-14. Sources at bottom of each entry.

---

## 1. Reflection / self-critique

**What it is:** the same agent generates a first draft, then reviews its own
output against the stated criteria before returning it, revising if it finds
a problem.

**Signal to use it:** the skill has criteria the model can check without new
information (formatting rules, brief-completeness, internal consistency),
and a first-pass miss is plausible but a second look would catch it.

**Benefit:** cheap (one extra pass, same context), and empirically real --
reflection has been measured boosting coding-benchmark accuracy from ~80%
to ~91% in some evaluations.

**Cost / risk:** the reviewer is the same context that just produced the
work, so it shares the same blind spots as the generation -- it will not
catch a mistake it didn't already know was a mistake. This is the weakest
form of verification in this list for exactly that reason.

**Free-choice mapping:** "whether output is produced single-pass or via a
draft-review loop."

Sources: [Learning from Anthropic about building effective agents](https://maa1.medium.com/learning-from-anthropic-about-building-effective-agents-2a7469941428), [Maker-Checker (Reflection) - Agentic AI Design Patterns Workshop](https://jeffrey-groneberg.github.io/AI_Workshop_Agentic_Patterns/patterns/maker-checker/)

---

## 2. Maker-checker / evaluator-optimizer (independent verification)

**What it is:** a generator produces the work; a *separate* evaluator --
different context, ideally no memory of how the work was made, sometimes a
different model -- judges it against criteria and returns pass/fail plus
feedback. Loops with a hard iteration cap.

**Signal to use it:** the skill has criteria currently resolved by
self-judgment ("judge against brief," "looks right to me"), *especially* if
the skill has a documented history of self-certifying something that later
turned out wrong. This is the direct fix for that failure class -- an
evaluator with no stake in having produced the draft has nothing to protect
by rubber-stamping it.

**Benefit:** catches the specific blind spot reflection can't: shared context
between maker and checker. Anthropic's own workflow taxonomy names this the
evaluator-optimizer pattern.

**Cost / risk:** an extra LLM call (or agent spawn) per generation --
latency and token cost go up. If the evaluator's rubric is vague, it adds
cost without adding a real check.

**Free-choice mapping:** "whether output is produced single-pass or via a
draft-review loop," specifically an *independent* one.

Sources: [Building Effective AI Agents \ Anthropic](https://www.anthropic.com/engineering/building-effective-agents), [Agentic Design Patterns: The 2026 Guide + Examples](https://heym.run/blog/agentic-design-patterns)

---

## 3. Executable / mechanical checks

**What it is:** replace judgment (human or LLM) with code that returns a
deterministic pass/fail -- grep for a token set, parse and measure a layout,
validate a schema, run a test suite.

**Signal to use it:** the criterion can be reduced to something a script can
verify (structure, presence/absence, measurable quantity). If a criterion
keeps getting judged inconsistently, that's the signal it should move here.

**Benefit:** deterministic, cheap, fast, and -- critically -- falsifiable:
a mechanical check can ship with a known-bad fixture that proves the check
actually discriminates, which no judgment-based check can do the same way.
This is often the single most load-bearing technique in a skill that
produces a structured artifact -- e.g. a layout-overflow check done via
computed measurement rather than a keyword heuristic.

**Cost / risk:** deterministic checks fail on semantically-fine-but-
differently-worded output (rigid to wording, brittle to anything outside
what the script anticipated). Best used for structural/quantitative
criteria, not semantic judgment ones -- pushing content-quality judgment
into a rigid mechanical check is where the "check that's never failed
proves nothing" problem starts.

**Free-choice mapping:** "verification mechanism" for any criterion that
can be reduced to a measurable check.

Sources: [When AIs Judge AIs: Agent-as-a-Judge Evaluation](https://arxiv.org/html/2508.02994v1), [How to Evaluate AI Agents: LLM-as-Judge Tutorial](https://dev.to/aws/how-to-evaluate-ai-agents-llm-as-judge-tutorial-4a6h)

---

## 4. LLM-as-judge (semantic evaluation)

**What it is:** an LLM call scores or pass/fails output against a rubric,
for criteria too semantic for a mechanical check (tone, whether a diagram
"reads faster than prose," whether color use is genuinely semantic vs.
decorative).

**Signal to use it:** the criterion is real but can't be reduced to a
grep/measurement -- this is where several visual or stylistic judgment
criteria typically sit.

**Benefit:** measured agreement with human raters is high when the rubric is
concrete and ground truth is verifiable (Cohen's Kappa 0.84-0.92 in some
studies; ~86-87% agreement with human/gold-standard evaluation in others).
Much cheaper than a human reviewer at the same rubric quality.

**Cost / risk:** agreement rates are conditional on rubric quality and
independence from the generator (see #2) -- an LLM judge sharing context
with the maker degrades toward reflection's weaknesses. Non-deterministic
by default; two runs on the same input can disagree.

**Free-choice mapping:** verification mechanism for judged criteria.

Sources: [When AIs Judge AIs](https://arxiv.org/html/2508.02994v1), [Evaluating AI Agents in Practice - InfoQ](https://www.infoq.com/articles/evaluating-ai-agents-lessons-learned/)

---

## 5. Orchestrator-workers (task decomposition + delegation)

**What it is:** a central agent breaks a task into subtasks, delegates each
to a worker (sub-agent or tool call), and synthesizes the results.

**Signal to use it:** the brief genuinely decomposes into independent
sub-problems (e.g. "generate three sections, each self-contained") where
parallel work is faster and doesn't need shared state.

**Benefit:** parallelism, and each worker can carry a narrower, cleaner
context than one agent doing everything serially.

**Cost / risk:** multi-agent systems reportedly use on the order of 15x the
tokens of a single chat call; coordination overhead and failure modes (a
worker silently producing wrong output the orchestrator doesn't catch)
scale with the number of workers. Overkill for a task that's naturally one
pass, like a single-file-per-brief generation task.

**Free-choice mapping:** not applicable to a skill with a single
deliverable and no natural decomposition -- logged here so skills with
genuinely decomposable briefs don't have to re-derive this.

Sources: [Building Effective AI Agents \ Anthropic](https://www.anthropic.com/engineering/building-effective-agents), [Multi-Agent Orchestration Patterns: Pattern Language 2026](https://www.digitalapplied.com/blog/multi-agent-orchestration-patterns-producer-consumer)

---

## 6. Routing

**What it is:** a classifier (rule-based or LLM) inspects the input and
sends it to one of several specialized handling paths.

**Signal to use it:** inputs fall into genuinely distinct categories that
should be handled differently (a diagram-generation skill might already do
an informal version of this: "classify the brief: flow, comparison,
concept, or reference").

**Benefit:** each path can be simpler and more reliable than one handler
trying to cover every case; misrouting is visible and debuggable
separately from the handling logic itself.

**Cost / risk:** an extra classification step that can itself misroute;
value depends entirely on the categories actually being distinct enough
to need different handling.

**Free-choice mapping:** "how the brief is parsed and which content type is
inferred" -- often an informal mechanism a skill already uses without
naming it as routing.

Sources: [Building Effective AI Agents \ Anthropic](https://www.anthropic.com/engineering/building-effective-agents)

---

## 7. Parallelization (sectioning / voting)

**What it is:** run multiple LLM calls simultaneously, either splitting a
task into independent sections (sectioning) or running the *same* task
multiple times and aggregating (voting -- see #8, self-consistency).

**Signal to use it:** sectioning -- a task splits cleanly into independent
parts. Voting -- a single call's output is unreliable enough that sampling
several and aggregating measurably improves accuracy.

**Benefit:** sectioning parallelizes decomposable work; voting reduces
variance on tasks where individual runs are noisy.

**Cost / risk:** multiplies token cost by the fan-out factor; only pays off
if the aggregation step (majority vote, merge) is itself reliable.

**Free-choice mapping:** overlaps with #5 (sectioning) and #8 (voting).

Sources: [Building Effective AI Agents \ Anthropic](https://www.anthropic.com/engineering/building-effective-agents)

---

## 8. Self-consistency / ensemble sampling

**What it is:** sample multiple independent reasoning traces for the same
input, then take the majority (or a similarity-weighted) answer.

**Signal to use it:** the task has a checkable "answer" that can be compared
across samples (reasoning/math-style tasks show the biggest measured gains:
+17.9pp on GSM8K in one benchmark), and single-sample variance is a known
problem.

**Benefit:** meaningfully reduces error rate on tasks where the correct
answer is more likely to be the modal one across independent attempts.

**Cost / risk:** expensive -- full extra generations per sample, and
aggregation for free-text/creative output (not multiple-choice-style
answers) is nontrivial (no clean "majority vote" for HTML layouts, e.g.).
Poor fit for a task where there's one canonical "right" output (e.g. a
single correct layout), not a checkable numeric answer to vote on.

**Free-choice mapping:** not a good fit for a single-canonical-output skill
-- logged for skills with a checkable, sample-able output space.

Sources: [Self-Consistency in LLM Reasoning](https://calmops.com/algorithms/self-consistency-reasoning/), [Kinde: LLM Fan-Out 101](https://www.kinde.com/learn/ai-for-software-engineering/workflows/llm-fan-out-101-self-consistency-consensus-and-voting-patterns/)

---

## 9. Templated / structured generation

**What it is:** instead of freeform generation, constrain output to a
schema, grammar, or fill-in-the-blank template -- from soft (a prompt
skeleton) to hard (grammar-constrained decoding).

**Signal to use it:** the output space is genuinely repetitive/structural
(the same shape every time) and consistency matters more than adapting to
novel briefs.

**Benefit:** real, measured gains on structural correctness -- grammar-
constrained decoding cuts syntax errors by ~96% in some benchmarks,
type-constrained decoding cuts compilation errors >50%. Structural
guarantees are mathematical, not statistical.

**Cost / risk:** structural correctness is not semantic correctness --
constrained modes show documented failure modes like enum collapse
(defaulting to common values), numeric drift, and silent field-dropping on
optional fields. There's a measurable "quality tax" versus freeform,
usually within noise on routine cases but real on adversarial/long-tail
ones. For a refuse-to-invent-style skill specifically, this can be the
biggest-bet item in the library: a golden example testing refusal on an
underspecified brief is exactly a long-tail case a template would handle
badly -- a template either forces content into slots that don't fit, or
can't represent "there isn't enough here to generate" at all.

**Free-choice mapping:** "layout system" and "how the brief is parsed" --
would need its own dedicated sweep given that conflict, not a drop-in.

Sources: [Structured Generation: Making LLM Output Reliable in Production](https://tianpan.co/blog/2026-03-03-structured-generation-reliable-llm-output), [Evaluating LLM Structured Output Modes (2026)](https://futureagi.com/blog/evaluating-llm-structured-output-modes-2026/)

---

## 10. Few-shot examples / in-context demonstrations

**What it is:** bundle example input-output pairs the generator reads before
producing new output, so it pattern-matches structure/style from
demonstrations rather than prose rules alone.

**Signal to use it:** the skill's prose rules alone leave real variance in
output shape/style that examples would visibly tighten, and there's a
representative, diverse set of examples available (not just 1-2 near-
identical ones).

**Benefit:** doesn't require touching model weights, cheap to add, can
meaningfully reduce output variance.

**Cost / risk:** the literature's own warning applies directly here: models
tend to overfit to few examples, mimicking them rather than generalizing,
especially with a narrow/non-diverse example set. A skill's spec may
already have a named Goodhart watch for exactly this direction of drift
(e.g. "a migration that passes by stripping all visual structure fails
intent") -- bundling only a couple of near-identical golden examples risks
every future output bending toward those shapes regardless of brief.
Mitigated by deliberately diverse examples and an explicit anti-overfitting
fixture (a brief that should look nothing like the bundled examples) in
the discrimination test.

**Free-choice mapping:** delivery mechanism is progressive disclosure (see
#11) -- bundled reference files loaded on demand, not inlined in SKILL.md.

Sources: [Few-Shot Prompting: Examples, Theory, Use Cases](https://www.datacamp.com/tutorial/few-shot-prompting), [What is Few-Shot Learning?](https://www.datacamp.com/blog/what-is-few-shot-learning)

---

## 11. Progressive disclosure (reference-file bundling)

**What it is:** a skill's SKILL.md stays short; deeper material (references,
scripts, example assets) lives in separate files under the skill directory,
loaded only when actually needed, at zero context cost otherwise.

**Signal to use it:** almost always relevant once a skill accumulates any
reference material beyond its core instructions (this library file itself
is an application of the pattern).

**Benefit:** unlimited depth of reference material with no fixed context
tax -- only name+description is preloaded; SKILL.md loads on trigger;
bundled files load on demand. Keeps the always-loaded cost flat regardless
of how much the skill "knows."

**Cost / risk:** requires the generating agent to actually know to go
fetch the reference file (an explicit pointer in SKILL.md) -- a reference
that's never pointed to might as well not exist.

**Free-choice mapping:** this is the delivery *mechanism* for other
techniques (few-shot examples, technique libraries, brand/style guides),
not a technique with its own gain to measure.

Sources: [Progressive Disclosure Pattern - DeepWiki](https://deepwiki.com/daymade/claude-code-skills/3.3-progressive-disclosure-pattern), [Skill authoring best practices - Claude Platform Docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)

---

## 12. Model/version pinning for determinism

**What it is:** pin an immutable model snapshot (not a moving alias),
temperature/seed, and record them with run metadata, rather than relying on
whatever the current default model happens to be.

**Signal to use it:** the skill or spec makes a replayability/determinism
claim ("pure function: brief in, HTML out," "fully replayable") that isn't
actually backed by a pinned configuration.

**Benefit:** bounds (doesn't eliminate) non-determinism -- given fixed
model version, seed, and temperature, outputs are far more likely to match
run over run. Reproducibility matters especially for evaluation itself:
an LLM-as-judge (#4) that isn't pinned is judging against a moving target.

**Cost / risk:** provider infrastructure changes (multiple times a year)
can shift behavior even at a pinned version in ways outside the skill
author's control; this bounds drift, it doesn't guarantee byte-identical
output. Low implementation cost, mostly a documentation/config discipline.

**Free-choice mapping:** candidate to add to a skill's free-choices list if
a "Replayable: yes" claim in its spec is meant literally rather than
aspirationally.

Sources: [Achieving Determinism with LLM Agents](https://charlessieg.com/articles/achieving-determinism-with-llm-agents-architecture-guide.html), [Non-Deterministic LLM Prompts: A Practical Guide](https://futureagi.com/blog/non-deterministic-llm-prompts-2025/)

---

## 13. Human-in-the-loop gate

**What it is:** the agent prepares an action fully, presents it, and waits
for explicit approval before an irreversible or high-stakes step executes.

**Signal to use it:** the action is irreversible, materially consequential,
or regulated (financial transfers, deployments, anything with legal/
compliance exposure). A three-tier model applies generally: auto-approve
safe/reversible, notify on impactful-but-recoverable, block pending
approval on irreversible/high-stakes.

**Benefit:** catches the class of error no amount of internal verification
can, because it's not about correctness, it's about consequence.

**Cost / risk:** over-gating causes user fatigue and abandonment; the
pattern only works if most actions are correctly triaged into the
auto-approve tier and gates are reserved for the genuinely high-stakes
ones.

**Free-choice mapping:** not really applicable to a skill whose output is a
single file with no side effects -- but directly applicable to the
evolution *process* itself: promoting a phenotype change is exactly the
kind of consequential, hard-to-fully-reverse action this pattern is for,
which is why gate decisions in this system are logged and disclosed rather
than silently auto-applied.

Sources: [What Is the Gate Pattern for AI Agents?](https://www.mindstudio.ai/blog/gate-pattern-ai-agents-prepare-not-submit), [Human-in-the-Loop for AI Agents: How Approval Gates Work](https://www.bestaiweb.ai/what-is-human-in-the-loop-for-agents-and-how-approval-gates-keep-autonomous-workflows-safe/)

---

## 14. ReAct (interleaved reasoning + tool use)

**What it is:** the agent alternates explicit thought, action (tool call),
and observation of the result, feeding each observation back into the next
reasoning step, rather than planning everything upfront.

**Signal to use it:** the task requires external tool calls where later
steps genuinely depend on earlier results (can't be planned in one shot) --
not a fit for tasks with a fixed, predetermined sequence.

**Benefit:** interpretable, step-by-step reasoning traces aid debugging;
adapts dynamically when a tool result changes what's needed next.

**Cost / risk:** explicitly a poor fit for predetermined workflows or
cost-sensitive tool usage per the sources -- a one-pass classify-then-write
generation task isn't tool-call-dependent in this way, so this is logged
as not currently applicable rather than adopted for that shape of skill.

**Free-choice mapping:** not applicable to a fixed-sequence generation
skill; relevant if a skill needs to look things up mid-generation.

Sources: [The ReAct Pattern for Reasoning and Acting](https://apxml.com/courses/getting-started-with-llm-toolkit/chapter-8-developing-autonomous-agents/react-pattern-for-agents), [What is a ReAct Agent? | IBM](https://www.ibm.com/think/topics/react-agent)

---

## How to add a new entry (for the self-refresh step)

1. New number, same fields: what it is / signal to use / benefit / cost /
   free-choice mapping / sources.
2. Date the addition in the entry or in a changelog line at the top of this
   file -- never silently edit an existing numbered entry's substance; if a
   technique's assessment changes, add a dated note under it instead.
3. If the research turns up a technique that's a **rename or minor variant**
   of one already here, don't duplicate it -- add a "see also" note to the
   existing entry instead.
