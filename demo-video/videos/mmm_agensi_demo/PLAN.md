# Plan: MMM Budget Optimizer · Agensi demo

## Purpose
- Audience: Agensi marketplace browsers; marketers, analysts, developers
- Takeaway: the skill fits an MMM in milliseconds, checks it on unseen weeks, and moves budget to equal marginal returns
- Constraints: every number comes from `data/mmm-demo.json`, written by `data/build_data.py` from real mmm-engine runs. Say "known answers" only for the synthetic trust check.

## Style
- Active style: motion-engineering (self-hosted fonts)
- Reference: the QuantumClaw route optimizer demo (same HUD frame, same diagram rules)

## Audio intent
- Voiceover: yes. Kokoro `bf_emma`, British female
- Sound effects: no
- Background music: no

## Segment outline
1. mmm-title: skill name, promise, method
2. mmm-pipeline: buyer prompt; flowchart with a holdout gate (diagram-design rules)
3. mmm-fit: actual vs training-only model; 13 unseen weeks shaded; fit time, MAPE, R²
4. mmm-curves: response curves on shared axes; tangent = marginal ROI
5. mmm-plan: now → recommended bars; equal marginal ROI; weekly lift
6. mmm-proof: 10 known-answer datasets; share of best lift captured
7. mmm-cta: Free on Agensi; repos

## Script
See `voiceover_script/script.md`.

---

## Log

### 2026-10-24 — Initial build
- Data from `data/build_data.py` (engine main @ 4505a63)
- 7 segments; components: hud.ts, charts.ts, demo-data.ts, mmm-diagram.ts
- VO v1 generated with setup_kokoro.sh; timing per beat
- Copy pass: stop-slop and i-have-adhd (active voice, no em dashes, point-wise captions)
- Preview check at 10 fps: fixed fit-chart contrast, added skill repo to CTA
