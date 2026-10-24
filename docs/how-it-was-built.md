# How it was built

Skill, engine upgrade, demo video, CI. Every number in the video and listing comes from real `mmm-engine` runs.

## Tools

| Job | Tool |
| --- | --- |
| Model fit, optimizer, forecast | [mmm-engine](https://github.com/yablokolabs/mmm-engine) v0.2.0 (C++23) |
| Video scenes and render | [Videowright](https://github.com/scosman/videowright), Motion Engineering style |
| Diagram rules | [diagram-design](https://github.com/cathrynlavery/diagram-design) |
| Writing rules | [stop-slop](https://github.com/hardikpandya/stop-slop), [i-have-adhd](https://github.com/ayghri/i-have-adhd) |
| Voice | [Kokoro](https://github.com/hexgrad/kokoro) via [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx), `bf_emma` |
| Reference project | [quantumclaw-route-optimizer](https://github.com/yablokolabs/quantumclaw-route-optimizer) |

## Pipeline

1. **Audit the engine.** mmm-engine v0.1 could only run hand-written parameters. Its optimizer was a placeholder (`// dummy gradient`); forecasts ignored spend.
2. **Add fitting to the engine** (`mmm fit`): grid search per channel over decay, half-saturation, slope; least squares with non-negative channel effects; 13-week holdout.
3. **Add a real optimizer** (`mmm optimize`): greedy marginal return, then pairwise exchange, within ±50% of current spend.
4. **Make forecasts use spend** (`mmm forecast --plan`).
5. **Test against known answers**: synthetic data from known curves; tests check recovery, determinism, brute-force optimality, plan quality on the true curves.
6. **Write the skill**: `SKILL.md` with accuracy gates, `prepare_data.py`, `report.py`, references, examples.
7. **Generate the video data**: `demo-video/data/build_data.py` runs the engine and the 10-dataset trust check, writes `mmm-demo.json`.
8. **Build 7 scenes** that import `mmm-demo.json`. No number typed by hand.
9. **Narrate**: one line per beat in `script.json`; `setup_kokoro.sh` generates clips and exact timing.
10. **Preview at 10 fps**, pull stills, fix layout, render at 60 fps.
11. **CI and releases** for both repos.

## Key techniques

### Fit
- Coordinate descent: one channel at a time, all others fixed, repeat until no change
- Each candidate solves trend + seasonality + all channel effects by least squares (Cholesky)
- Negative channel effect → drop that channel's column, re-solve
- ~20 ms for 3 channels × 156 weeks

### What the data can and cannot tell you
- Always-on channels: their steady effect looks like baseline demand → total ROI is soft
- Marginal ROI (slope at today's spend) comes from week-to-week variation → much better identified
- So the headline metric is **decision quality**: score the fitted plan on the true curves

### Holdout chart without leakage
- The final model refits on all weeks
- `fit.training_model_prediction` keeps the training-only model's predictions
- The fit scene plots that series, so the shaded 13 weeks show a model that never saw them

### Diagram built to diagram-design rules
- Flowchart with one gate: History → Fit → Holdout check → Optimize → Report; FAIL → Keep budget
- Straight connectors on shared axes, arrows drawn before boxes
- Masked arrow labels (PASS, FAIL) with an 8 px gap
- Accent on 2 elements: Optimize and its output arrow
- Dashed stroke for the failure path; legend as a bottom strip
- Deviation: dark Motion Engineering skin to match the video

### Exact voice timing
- One Kokoro clip per narration line → beat start times known exactly
- No speech-to-text pass

## Writing rules applied

| Rule | Example |
| --- | --- |
| Concrete over slogan (stop-slop) | "Find where your next pound sells most" |
| No quotable line (stop-slop) | "no pound has a better place to go" states the maths, not a tagline |
| Points, not prose (i-have-adhd) | listing, FAQ and captions are bullets |
| Honest limits | "41% worst" stated next to "11% average" |

- No em dashes in narration, captions, listing or README

## Problems hit and fixes

| Problem | Fix |
| --- | --- |
| Engine could not learn from data | added `mmm fit` |
| Placeholder optimizer drifted to an equal split | replaced with marginal-return allocation + exchange |
| Fitted total ROI overstated for always-on channels | report leads with marginal ROI; trust check grades decisions |
| `-march=native` binaries crash on other CPUs | `MMM_NATIVE` option; releases build portable |
| Git proxy blocked tag pushes (HTTP 403) | release workflow takes a version input and creates the tag on GitHub |
| espeak-ng fails from deep paths | Kokoro cache in `~/.cache/kokoro-onnx` |

## Reproduce

```sh
# engine
git clone https://github.com/yablokolabs/mmm-engine ~/.local/share/mmm-engine
(cd ~/.local/share/mmm-engine && ./build.sh && ./build/mmm_tests)

# skill test
tests/test_skill.sh

# video
cd demo-video
npm install && npx playwright install chromium
python3 data/build_data.py
./videos/mmm_agensi_demo/audio/originals/voiceovers/v1/setup_kokoro.sh
npx videowright render mmm_agensi_demo --output final/mmm-budget-optimizer-demo.mp4
```

## Releasing

- Actions → **Release** → Run workflow → version `v1.2.3`
- Or push a tag `v1.2.3`
- Assets: skill zip, demo MP4, SHA256SUMS; notes from `CHANGELOG.md`

## Use as a reference for a new demo

```text
Make a demo video for <my product> using
https://github.com/yablokolabs/mmm-budget-optimizer as the reference.
Read docs/how-it-was-built.md first.

Reuse:
- demo-video/components/hud.ts, charts.ts, the mmm-diagram.ts pattern
- data/build_data.py pattern: every on-screen number generated from real runs
- setup_kokoro.sh + generate.py for the voice (bf_emma)

Rules:
- narration and captions: stop-slop and i-have-adhd
- diagrams: diagram-design
- 10 fps preview and still-frame check before the final render
```
