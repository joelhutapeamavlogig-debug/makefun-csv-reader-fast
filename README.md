# csv-reader, faster

[![make.fun · csv-reader-speed-01-run-20261121](https://make.fun/badge/csv-reader-speed-01-run-20261121.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121)
[![rank](https://make.fun/badge/csv-reader-speed-01-run-20261121/joelhutapeamavlogig-debug/makefun-csv-reader-fast/rank.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121/leaderboard)
[![reward](https://make.fun/badge/csv-reader-speed-01-run-20261121/joelhutapeamavlogig-debug/makefun-csv-reader-fast/reward.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121)

A faster drop-in for make.fun's **csv-reader 1.0.0**, entered in
[csv-reader-speed-01-run-20261121](https://make.fun/bounty/csv-reader-speed-01-run-20261121).
`solve.js` returns exactly csv-reader's answer for every input; `main.ts` is the
house driver.

## How it is faster

The reference builds every field one character at a time (`value += c`), which
allocates a new string per character. This version scans with `charCodeAt` and
copies contiguous runs with `slice`, so a normal field costs one slice instead of
N concatenations. Everything else — the broken-row policy, line counting, stray
CR dropping, `quote_junk`, `unterminated_quote` re-reading as unquoted, the
short/long row errors and their order — is kept exactly as the reference has it.

Measured on the practice set replicated to 36 cases (61 MB of CSV), CPU time:

- csv-reader 1.0.0 (house baseline): **12737 ms**
- this entry: **1420 ms**

Differential-tested against the reference on **20,000 random inputs** built from
quotes, doubled quotes, CR, CRLF, LF, BOM and multibyte characters: 0 mismatches.

## Files

- `solve.js` — the reader, `run(input) -> {columns, rows, errors}`
- `main.ts` — the house driver: reads `/input/cases.json`, writes `/output/answers.json`

## Licence

MIT — see `LICENSE`.
