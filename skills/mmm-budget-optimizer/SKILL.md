---
name: mmm-budget-optimizer
description: Marketing mix modelling from weekly sales and channel spend. Fits adstock, saturation, trend and seasonality with a deterministic C++ engine (mmm-engine), checks accuracy on held-out weeks, reports each channel's contribution and marginal ROI, and reallocates the budget to maximise sales within safe bounds. Use when the user asks which marketing channels work, where to move budget, what an extra pound/dollar of spend returns, or to build or audit an MMM.
license: MIT
compatibility: Python 3.9+ (standard library only) and curl. Prebuilt engine for Linux x86-64/arm64 (glibc 2.38+) and macOS Apple Silicon; other systems build from source (git, CMake 3.27+, GCC 13+) or use Docker. Offline after install. No API keys.
metadata:
  author: Yabloko Labs
  homepage: https://yablokolabs.com
  source: https://github.com/yablokolabs/mmm-engine
---

# MMM Budget Optimizer

Drives the `mmm` CLI from [mmm-engine](https://github.com/yablokolabs/mmm-engine).

1. Turn the user's sales and spend into a weekly CSV
2. Fit the model; score it on weeks it never saw
3. Report what each channel drives and what the next unit of spend returns
4. Reallocate the weekly budget within bounds
5. Write a Markdown report

## Step 0: Install the engine (once)

One command. Ask the user to approve it once:

```sh
MMM=$(bash scripts/install_engine.sh)
```

- Downloads the prebuilt `mmm` binary for this OS and verifies its SHA-256 checksum
- No binary for this system, or it will not run: builds from source (needs git, CMake, GCC 13+) and runs the engine tests
- Prints the binary path (default `~/.local/share/mmm-engine/bin/mmm`); re-running is instant
- **If your permission system blocks the install:** do not retry variations. Give the user this command to run in their own terminal, then continue with the path it prints:

  ```sh
  bash <path-to-this-skill>/scripts/install_engine.sh
  ```

- Docker alternative: `docker run --rm -v "$PWD:/work" ghcr.io/yablokolabs/mmm-engine:0.2.1 <command>`

## Step 1: Prepare and check the data

Format: [references/data-format.md](references/data-format.md). Read it first.

Always run the data check, whatever shape the data arrives in:

| Data | Command |
| --- | --- |
| weekly CSV (`week,sales,<channels>`) | `python3 scripts/prepare_data.py --check history.csv` |
| daily wide CSV | `python3 scripts/prepare_data.py --wide daily.csv --out history.csv` |
| sales + spend in long format | `python3 scripts/prepare_data.py --sales sales.csv --spend spend.csv --out history.csv` |

- Errors stop the run: gaps, negative spend, constant channels, channel pairs with correlated spend (r ≥ 0.98), too few weeks. Fix each one with the user; `mmm fit` refuses the same cases.
- Correlated pair: ask the user to merge the two channels into one column or drop one. Never pick for them.
- Warnings (r ≥ 0.90, small channels, under 104 weeks): proceed, and repeat them in the report.
- Need: at least 2 × (7 + channels) training weeks. Aim for 104+ weeks.
- Never invent or fill spend values. Ask the user.
- Ask what the sales column measures (revenue, units, sign-ups) and the currency. Use them in the report.

## Step 2: Fit

```sh
"$MMM" fit --data history.csv --target sales --holdout 13 --output model.json
```

Read the printed accuracy. Gates:

| Holdout MAPE | Holdout R² | Action |
| --- | --- | --- |
| < 5% | > 0.7 | proceed |
| 5–10% | 0.5–0.7 | proceed, flag as low confidence |
| > 10% | < 0.5 | stop; tell the user the model does not explain their sales well enough to move budget |

- Holdout weeks are the last 13. Never use `--holdout 0` for a decision.
- A channel with share 0% got a zero coefficient: the data shows no measurable effect. Say so; do not hide it.
- Lines starting `warning:` (e.g. correlated channels) go into the report's caveats.

## Step 3: Optimize

```sh
"$MMM" optimize --config model.json --bound 0.5 --output plan.json
"$MMM" forecast --config model.json --weeks 13 --plan plan.json --output forecast.json
```

- Default budget = current weekly spend (mean of the last 13 weeks). Use `--budget` for a different total.
- `--bound 0.5` keeps each channel within ±50% of current spend. Wider bounds extrapolate beyond the data. Only widen when the user asks, and say the plan is less reliable.

## Step 4: Report

```sh
python3 scripts/report.py model.json plan.json --forecast forecast.json --currency GBP > mmm-report.md
```

Add a 3-line summary at the top: the move, the expected weekly lift, the confidence level.

## Rules for describing results

- **Lead with marginal ROI**, not total ROI. Marginal ROI (what the next unit returns) drives budget decisions and the data pins it down well.
- **Total ROI is softer.** Channels that never go dark are hard to separate from baseline demand. Say this when quoting total ROI.
- **MMM is correlational.** Recommend a lift test (geo or holdout) before large moves.
- **The lift is a steady-state weekly estimate** inside the bounds. Do not annualise it without saying so.
- **No causal language** like "TV caused X". Use "the model attributes X to TV".
- **Name the method**: deterministic fit, no Bayesian priors, no confidence intervals.

## Trust check (optional)

`examples/` holds 3 years of synthetic data with known answers:

```sh
cd examples && "$MMM" fit --data history.csv --output model.json \
  && "$MMM" optimize --config model.json --output plan.json && python3 grade.py
```

`grade.py` compares fitted marginal ROI with the truth and scores the plan on the **true** curves.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `too few training weeks` | More history, fewer channels (merge small ones), or `--fourier 1` |
| `moves together` / `constant spend` | Merge the correlated channels into one column, or drop the constant one |
| `design matrix is singular` | Remaining near-duplicate columns; merge or drop one |
| install blocked by agent permissions | Ask the user to run `bash scripts/install_engine.sh` in their terminal |
| `prebuilt binary does not run here` | Older Linux (glibc < 2.38): the script builds from source, or use Docker |
| `budget ... outside the reachable range` | Budget too far from current spend for the bound; widen `--bound` or change `--budget` |
| source build fails | Compiler too old; needs GCC 13+ (C++23) |
