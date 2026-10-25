# Agensi listing: MMM Budget Optimizer

Paste-ready values for https://www.agensi.io/dashboard/submit.

- Step 1: upload `../dist/mmm-budget-optimizer.zip`
- Step 2 logo: `logo.png`
- Screenshots: `screenshot-report.png`
- Demo video: `../demo-video/final/mmm-budget-optimizer-demo.mp4` (upload to YouTube or Loom, paste the link)
- Demo numbers: real `mmm-engine` output on the bundled example (seed 7)

---

## Step 2: Skill details

**Skill name** (20/60)

```
MMM Budget Optimizer
```

**Summary**

```
Marketing mix modelling from weekly sales and spend. See each channel's marginal ROI and move budget to where it sells most.
```

**Full description**

```markdown
Built on [mmm-engine](https://github.com/yablokolabs/mmm-engine) (C++, MIT, Yabloko Labs).

### What you get
- Weekly CSV from daily or long-format data, with checks for gaps, negatives, constant or correlated channels, history length
- Model fit in ~20 ms: adstock, saturation, trend, seasonality
- Accuracy on the last 13 weeks the fit never saw; stops if too low to act on
- Per channel: share of sales, total ROI, **marginal ROI**, carryover, curve shape
- Budget plan: every channel moved to the same marginal return, each within ±50% of today
- Weekly lift estimate and 13-week forecast
- Markdown report

### Method
- Deterministic: same data, same answer
- Grid search over decay, half-saturation, slope; least squares with non-negative channel effects
- Optimizer checked against brute force (within 0.1%)

### Trust check (10 datasets with known answers)
- Holdout MAPE ≤ 0.9%
- Marginal ROI: 11% average error, 41% worst
- Plan on the true curves: ≥ 92% of best lift on 9 of 10, 63% on 1

### Runs
- One-command install: prebuilt, checksum-verified engine (Linux, macOS Apple Silicon); source build fallback
- Offline after install
- No API keys, no cloud accounts
- Your data stays on your machine

### For
- Marketing teams splitting budget across channels
- Analysts who need an MMM in minutes
- Agencies auditing a client's mix

### Included
- `SKILL.md`: workflow, accuracy gates, reporting rules
- `scripts/prepare_data.py`: data to weekly CSV
- `scripts/report.py`: model and plan to Markdown
- `references/`: data format, method, limits
- `examples/`: 3 years of synthetic data with known answers, `grade.py`

### Limits
- Correlational: validate large moves with a lift test
- Total ROI of always-on channels is soft; marginal ROI is reliable
- No confidence intervals
- Weekly data; 104+ weeks recommended
```

---

## Step 3: Demo

**The request (what the buyer types)**

```markdown
Weekly sales and spend for TV, search and social, 3 years: `examples/history.csv`. Currency GBP.

Which channel should get more budget? Keep the same total. Show what we gain.
```

**The result (what your agent delivers)**

```markdown
## Summary
- Move: social −43% → search +25%, TV +16%. Same £1,318/week.
- Gain: +95 media-driven sales/week (+2.5%).
- Confidence: good. 0.6% error on 13 unseen weeks.

## Model accuracy: `sales`

| Weeks | R² | MAPE |
| --- | --- | --- |
| training (143) | 0.985 | 0.7% |
| holdout (13, never seen by the fit) | 0.989 | 0.6% |

- Baseline (trend + seasonality): 75.0% of sales

## Channels

| Channel | Weekly spend now | Share of sales | Total ROI | Marginal ROI | Carryover | Curve |
| --- | --- | --- | --- | --- | --- | --- |
| search | GBP 313 | 8.8% | 3.96 | **2.33** | 0.1 | diminishing |
| tv | GBP 606 | 9.1% | 2.59 | **2.21** | 0.6 | S-shaped |
| social | GBP 399 | 7.1% | 2.16 | **1.22** | 0.3 | diminishing |

- Marginal ROI: sales from the next £1 of weekly spend. Use for decisions.
- Total ROI: softer for always-on channels.

## Recommended weekly budget

| Channel | Now | Recommended | Change | Marginal ROI after |
| --- | --- | --- | --- | --- |
| search | GBP 313 | GBP 391 | +25% | 1.92 |
| social | GBP 399 | GBP 227 | −43% | 1.92 |
| tv | GBP 606 | GBP 700 | +16% | 1.92 |

- Equal marginal ROI (1.92): no £1 has a better place to go
- Media-driven sales: 3,822 → 3,918 per week (**+95**, +2.5%)
- Each channel within ±50% of current spend

## Forecast with the plan
- Next 13 weeks: 195,352 sales, 15,027 per week

**Next steps**
1. Run a geo or holdout lift test on social before the full cut
2. Move budget in two steps; re-fit after 8 weeks
3. Add price and promotions as soon as you have them weekly
```

---

## Step 4: Compatibility note

```
Python 3.9+ and curl. Engine installs in ~1 s as a checksum-verified binary on Linux x86-64/arm64 (glibc 2.38+) and macOS Apple Silicon; other systems build from source (git, CMake 3.27+, GCC 13+) or use Docker. Offline after install. No API keys. Tested in CI on Linux and macOS.
```

---

## Step 5: Pricing

**Free** (same reasons as the route optimizer: open-source engine, visibility for the repos)

---

## Tags, categories, use cases

- **Tags:** marketing-mix-modeling, mmm, marketing-analytics, budget-optimization, roi, media-planning, attribution, adstock, forecasting, cpp
- **Category:** Data & Analytics (or Marketing if listed)
- **Use cases:** budget allocation, channel ROI audit, media planning, sales forecasting

---

## Permissions

**Required tools & software** (one per line)

```
Python 3.9+
curl
mmm-engine (installed by scripts/install_engine.sh from github.com/yablokolabs/mmm-engine releases)
git, CMake, GCC 13+ (only if no prebuilt binary fits)
```

**Tools used:** tick **Terminal / Shell**, **Read Files**, **Write Files**, **Network Access**. Leave **Browser** and **Environment Variables** unticked.

**Needs access to:** leave empty.

**File scopes**

```
*.csv
model.json
plan.json
forecast.json
mmm-report.md
~/.local/share/mmm-engine/**
```

**Notes**

```
- Shell: builds and runs the mmm CLI, runs bundled Python scripts
- Network: one-time download of the mmm-engine release binary (SHA-256 verified); modelling runs offline
- Data never leaves the machine
```

---

## FAQ

**Is this Bayesian MMM?**
- No. Deterministic fit, no priors, no confidence intervals.
- Same data gives the same answer every run.

**How much data do I need?**
- Weekly sales and spend per channel.
- Minimum 2 × (7 + channels) + 13 weeks. Aim for 104+.

**Can I trust the ROI numbers?**
- Marginal ROI: 11% average error on known-answer tests, 41% worst. Good enough to rank channels and move budget.
- Total ROI of always-on channels: less reliable. Use a lift test.

**Will it tell me to cut a channel to zero?**
- No. Each channel stays within ±50% of today by default (`--bound`).

**Does my data leave my machine?**
- No. Everything runs locally.

**Open source?**
- Yes. MIT: github.com/yablokolabs/mmm-engine, github.com/yablokolabs/mmm-budget-optimizer

---

## Extra details

- **Documentation URL:** `https://github.com/yablokolabs/mmm-budget-optimizer/blob/main/skills/mmm-budget-optimizer/references/method.md`
- **Website:** `https://yablokolabs.com`
- **Source:** `https://github.com/yablokolabs/mmm-budget-optimizer`
- **Demo video:** `../demo-video/final/mmm-budget-optimizer-demo.mp4`, 71 s, 1080p60, British female narration
