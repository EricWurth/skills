# Evolution Sweep Report (condensed, for repeat runs)

1. **Refresh:** `technique-library.md` checked against current research since its last research-pass date; new/updated entries appended, never rewritten in place.
2. **Identify:** candidates cross-referenced against the target skill's declared free-choices and its own eval-notes/failure history. A technique with no documented problem for THIS skill does not qualify, no matter how well-regarded generally.
3. **Evaluate:** each candidate scored for (a) a real, skill-specific problem, (b) a constructible test case that fails today without it, (c) cost/risk including Goodhart risk and reversibility. Missing (a) or (b) → mark speculative, do not sandbox this round.
4. **Prioritize:** check layering before ranking as rivals — a verification-layer technique and a generation-layer technique usually stack rather than compete. Select exactly one candidate to sandbox this pass.
5. **Sandbox:** apply to a copy of the target skill, live directory untouched. Both required: regression (existing goldens still pass) and discrimination (a new adversarial fixture proves the specific gap closed).
6. **Gate:** regression and discrimination both actually execute in CI against the sandboxed candidate. A clean pass promotes automatically -- regenerate the phenotype from the updated genome, version-bump, changelog, commit, tag. Rejected/shelved candidates are logged in `technique-library.md`, not silently dropped.
7. **Report:** which skills were swept, what was found, what was tested, what was promoted (with version/commit) or rejected and why, and the next suggested sweep date.

Invariants that survive any shortcut: refresh before identify; fitness traced to THIS skill's own documented history, not general technique reputation; exactly one candidate sandboxed per pass, per target skill; both regression and discrimination required, actually executed in CI, before any gate decision; a sweep that promotes nothing is a valid, expected outcome, not a shortfall.
