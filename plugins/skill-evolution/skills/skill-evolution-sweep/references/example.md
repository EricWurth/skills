# Example: a real scheduled-sweep prompt

`SKILL.md` in this folder is the generic template. Below is the actual
prompt behind the author's own weekly scheduled sweep — included so the
pattern isn't just theoretical. Adapt the cadence to your own setup;
everything else is usable as written.

---

> Invoke the installed "skill-evolution" skill (via the Skill tool) and run it exactly as it's defined -- refresh its bundled technique-library.md with current research, scan installed skills for a `genome/intent.md` file, and for each one found run identify -> evaluate for fitness -> prioritize (allowing layering, not single-winner-take-all) -> test (sandbox regression + discrimination) -> gate -> promote if clean.
>
> The gate is CI actually executing regression and discrimination against the sandboxed candidate, not a narrative judgment. On a clean pass, promote automatically: regenerate the phenotype from the updated genome, version-bump, changelog, commit, tag. On a failed or ungrounded candidate, shelve it and log it as rejected. All steps -- refresh, identify, evaluate, prioritize, test, gate, promote -- run autonomously with no pause for confirmation.
>
> If zero installed skills currently have a genome/intent.md (other than skill-evolution itself, which is exempt from evolving itself in the same pass), say so plainly and stop -- do not invent a target.
>
> Deliver a concise report: what's new in the technique library (or "nothing new"), which skills were in scope, which candidates were found per skill and their fitness verdict (fit / speculative / rejected, one line why each), full regression + discrimination results for whichever candidate(s) were actually sandbox-tested, and for each, promoted (with new version/commit/tag) or shelved.

---

Notes on why it's shaped this way:

- **Explicit exemption for skill-evolution itself.** Without this line, a
  sweep would try to treat its own genome as a target, which is a
  self-reference the process isn't designed to handle cleanly.
- **"Say so plainly and stop" instead of inventing a target.** A scheduled
  run has no one watching in real time to catch a fabricated finding —
  this line exists specifically so an empty scope produces an honest empty
  report, not a manufactured candidate to justify the run having happened.
- **No sign-off step.** Promotion is gated on CI actually executing the
  regression + discrimination fixtures, not on a person reading a report —
  see the parent skill's genome for why that gate is trusted to stand on
  its own now.
