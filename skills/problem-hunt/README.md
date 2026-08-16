# problem-hunt

Finds a real, unsolved-in-practice problem in AI, then co-brainstorms a solution.

## Why this exists

Asked for problems worth solving, a model returns things that sound
important and are already solved, or are solved in the literature and
unsolved only in the asker's awareness. Both waste the work that follows.
This skill spends most of its effort trying to kill its own candidates
before any of them reach you.

## How it works

Five phases, and the middle three are all filters:

1. **Scan** — practitioner pain, where people actually complain, not where vendors market
2. **Adversarial pass** — each candidate is attacked against existing solutions. Most die here, which is the point
3. **Novelty gate** — survivors are checked for whether the fix is genuinely unknown or merely unadopted
4. **Teach** — the underlying mechanism is explained, so you understand *why* the problem persists despite known fixes
5. **Brainstorm** — collaborative, with the problem stated as a mechanism in one sentence

Phase 4 is the one that distinguishes this from a list. A problem you cannot
explain the mechanism of is a problem you cannot evaluate a solution to, so
the teaching step gates the brainstorm rather than decorating it.

The skill carries an explicit anti-patterns section, and "where it lands" —
what a good output actually looks like — so the finish condition is stated
rather than assumed.

## Requirements

- **Web research**, for the scan and novelty gate. On claude.ai, network
  access varies by account, so this may be limited there.
- The `critical-thinking` skill, loaded for the brainstorm phase instead of
  reinventing goal decomposition.
- No scripts, no subagents.

## Install

```
cp -r skills/problem-hunt ~/.claude/skills/
```

## Use

Type `/problem-hunt`. Say what domain you care about, or take what it finds.

Wrong tool for debugging a system you already have — that is troubleshooting,
not hunting. The distinction matters: this skill assumes you are looking for
something to build, not something to fix.

## Limits

The novelty gate is only as good as what the scan surfaced; a problem solved
in a paper nobody cites can still pass it. And "unsolved in practice" is a
judgment about adoption, which moves — a candidate that clears the gate today
may be a product next quarter.
