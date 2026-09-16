# Example Cost-of-Living Crib Sheet — Fictional Persona

> Worked example for the same fictional person as ExampleMasterResume.md and
> example-match-profile.md. `job-profile` seeds this file when COL-adjusted
> comp is turned on; `job-scan` appends a row the first time a
> relocation-eligible posting lands in a metro that isn't here yet, and
> refreshes a row once it's more than 180 days old.
>
> **Source is always BEA Regional Price Parities** — metro-level (covers 387
> US metro areas) when the target is covered, state-level RPP otherwise.
> International and non-MSA rural locations aren't supported; the comp gate
> falls back to the flat floor only for those, noted as "COL adjustment
> unsupported."
>
> **BEA's raw index is relative to the US national average, not to the home
> market.** Every index below has already been rebased so the home row reads
> 100 — never plug a raw BEA figure into the comp-gate math without dividing
> by the home market's own raw index first.

| Metro | Index (home = 100) | Comp floor, translated | Observed salary range (target functions) | Source | Last checked |
|---|---|---|---|---|---|
| Columbus, OH (home) | 100.0 | $110,000 (stated floor) | — | n/a — home market | 2026-09-16 |
| Chicago, IL | 108.9 | $119,790 | $125K–$148K (3 postings) | BEA RPP (metro) | 2026-09-16 |
| Denver, CO | 104.2 | $114,620 | no postings observed yet | BEA RPP (metro) | 2026-08-30 |

A relocation posting in Denver offering $108,000 nominal would fail the flat
$110,000 floor — but $108,000 × (100 ÷ 104.2) ≈ $103,650 home-equivalent also
fails, so that one stays rejected. A Denver offer of $113,000 nominal
(≈$108,445 home-equivalent) still fails. An offer of $115,000 nominal
(≈$110,365 home-equivalent) clears the floor once translated and gets a
`colAdjusted=TRUE` pass instead of an automatic reject.
