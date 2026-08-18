# rulegate

Makes project rules bind instead of decay.

Prose rules in CLAUDE.md influence an agent; they do not bind it. Compliance decays with context depth because rules are tokens competing in attention against the task. rulegate converts rules into architecture: every rule shape gets exactly one binding moment, and the executor carries a single gateable rule: stay in scope.

## The loop

| Moment | Hook | Mechanism |
|---|---|---|
| Request arrives | UserPromptSubmit (prompt) | Front gate compiles the request into a rule-compliant step plan (`.rulegate/plan.md`). Sequencing rules become step order. |
| Action attempted | PreToolUse (script) | Scope gate diffs the attempted write against the CURRENT step's declared files. Out-of-scope blocks with "report it instead". |
| Action completes | PostToolUse (script) | Evidence ledger silently records what actually ran (`.rulegate/ledger.jsonl`). |
| Reply finishes | Stop (script + prompt) | Output gate: deterministic lint on STYLE rules, then completion-claim language checked against fresh ledger evidence. Both block. A prompt-based judge annotates JUDGMENT rules; advisory only in v0.1. |
| Context compacts | PreCompact (script) | Points back at `.rulegate/plan.md` so the plan survives compaction instead of being silently forgotten. |

Discovered work re-enters through the front gate as a normal message. The conversation is the channel.

## Setup

Say "set up rulegate". The setup skill scaffolds `.rulegate/`, reads your existing CLAUDE.md, and walks you through classifying each rule into SEQUENCING / SCOPE / CLAIMS / STYLE / JUDGMENT, with your correction as the human gate, because misclassified rules bind at the wrong moment.

## Honest limits (v0.1)

- JUDGMENT rules are annotated, never blocked. The judge is another LLM; deterministic gates get teeth first.
- The scope gate reads file paths from tool input and mutation-shaped bash commands; exotic write paths can slip it.
- The claims check is keyword-based on both sides. It catches the documented false-green pattern, not adversarial phrasing.
- The planner can miscompile. Enforcement is then perfect against a wrong plan; the plan file is deliberately short so review is cheap. Use "review the plan" to re-derive from scratch.
- Works only where a hook engine exists (Claude Code / Cowork). Chat has no checkpoints; do not expect parity.
- `.rulegate/RULES.md` is read into the front gate's and the judge's own prompts as trusted instruction material. That is inherent to a prompt-based hook reading a project file, not a bug, but it means a compromised or attacker-influenced RULES.md (shared repo, malicious PR) could steer the compiled plan or the judge's annotations. Treat RULES.md with the same trust you'd give CLAUDE.md itself.

## Rules audit (v0.2)

Rules must sit at requirement, acceptance-criterion, or process-instruction level to bind. The `rules-audit` skill (mandatory first step of setup, runnable standalone via "audit my rules") checks each rule for atomicity, observability, vague quantifiers, unresolvable references, dead weight, and contradictions, then proposes requirement-level rewrites for vague-but-fixable rules, with every rewrite behind your approval. Taste rules stay honestly advisory; they are never dressed up as requirements.

## Estimates (v0.3)

Plan steps carry a mandatory `estimate:` line (rule-compiler v0.3 format), sized to allow for normal failure. Estimate-vs-actual is the baseline any agent's stuck-detection measures against; revising an estimate is a change request with a reason, not a quiet edit. The companion **delegate** plugin consumes this directly.
