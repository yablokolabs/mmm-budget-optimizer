# Data format

## What `mmm fit` reads

One CSV, one row per week, oldest first:

```csv
week,sales,tv,search,social
2023-W01,12571.84,630.88,249.16,462.69
2023-W02,13227.45,464.82,438.31,190.10
```

| Column | Rule |
| --- | --- |
| first column | week label, any text (dates, ISO weeks) |
| target (`--target`, default `sales`) | the outcome: revenue, units, sign-ups |
| every other column | one channel's spend that week, ≥ 0, same currency for all |

- No gaps: every week present, in order
- No blank cells: a week with no spend is `0`
- Plain numbers: no currency symbols, no thousands separators
- No quoted commas in labels

## How much history

| Weeks | Use |
| --- | --- |
| < 2 × (7 + channels) + 13 | `mmm fit` refuses |
| up to 78 | exploratory only, flag low confidence |
| 104+ | recommended (2 full seasonal cycles) |

Example: 4 channels need at least 2 × 11 + 13 = 35 weeks to run, 104+ to trust.

## What makes a channel measurable

- **Variation.** Spend that moves week to week. A flat line looks like baseline.
- **Some dark weeks** help the most. Flighted channels (on/off) separate cleanly.
- **Independence.** Two channels that always rise and fall together cannot be split. `prepare_data.py` and `mmm fit` refuse pairs at r ≥ 0.98 and warn from r ≥ 0.90. Merge them.
- **Size.** Channels under ~5% of spend rarely show a measurable effect. Group them as `other`.

## Converting other shapes

`scripts/prepare_data.py` handles:

| Input | Command |
| --- | --- |
| weekly CSV, any week labels | `--check history.csv` (validate only) |
| daily wide CSV (`date,sales,tv,...`) | `--wide daily.csv` |
| sales and spend in separate files, spend long (`date,channel,spend`) | `--sales sales.csv --spend spend.csv` |

- Dates: `YYYY-MM-DD`
- Days roll up to ISO weeks (Monday start) by summing
- First and last partial weeks are dropped; the script prints which
- Output columns: `week,sales,<channels sorted by name>`
