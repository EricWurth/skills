---
name: "vault-review-hermes-mode"
description: "Addendum to memory-vault:vault-review. Load this alongside vault-review whenever running a vault review, promoting to the memory vault, or when the user references the vault's \"Hermes mode\", promotion rule, or task-tracking scope. Overrides vault-review's per-item pre-approval gate (promote directly, review/prune after) and narrows its scope to knowledge only, not task tracking."
spec: genome/intent.md
---

This skill amends `memory-vault:vault-review` and `memory-vault:vault-conventions` rule 7. Two changes, both decided by Eric on 2026-08-02, both because the base skill text (in the memory-vault plugin, not user-editable in this session) is out of date:

**1. Promotion is no longer pre-approval-gated.** During a vault-review pass, promote clusters that clear the evidence bar (2+ distinct contexts, clean routing, honest provenance) by writing the semantic/procedure file directly — no waiting for a yes on each one. Log reasoning and evidence inline and in the review report; Eric prunes or corrects after, at his own pace. Still ask first, narrowly: a write would supersede/contradict an existing decision-provenance fact outright, provenance is genuinely ambiguous, or it's a sync-conflict file (always ask which version survives).

**2. vault-review does not track tasks.** Its job is knowledge only: cluster episodes, promote facts/reflections/techniques, sweep staleness, regenerate INDEX/CATALOG. It does not read, write, or report on `intentions/QUEUE.md`, and does not surface Eric's open items/follow-ups in any form — skip that entirely, don't just do it quietly. Task-tracking here was tried and was bad: items got re-flagged instead of resolved, and by the time anything surfaced it was already stale and irrelevant to how fast his situation moves. The daily `vault-intentions-check` scheduled task that did this was disabled then deleted (its SKILL.md is still on disk if ever needed). `intentions/QUEUE.md` is a historical file now, not actively maintained.

Neither change loosens rule 3 (nothing deleted) or rule 4 (honest provenance, default down not up). Neither touches the separate, standing rule outside the vault that anything destructive, financial, or sent in Eric's name still gets shown as a plan first.

Source of truth, if this summary and the vault ever disagree: `procedures/vault-review-promotion-mode.md` and `procedures/vault-review-scope-no-task-tracking.md`. Read those first, they may have been updated since this skill was written.

