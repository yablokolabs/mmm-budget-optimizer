#!/usr/bin/env python3
"""Run mmm-engine on the skill's example data and write mmm-demo.json for the scenes.

Every number in the video comes from this file, so re-running it after an
engine change updates the video.

Usage: python3 build_data.py [--mmm ~/.local/share/mmm-engine/build/mmm]
"""

import argparse
import json
import os
import shutil
import statistics
import subprocess
import sys
import tempfile
import time
from pathlib import Path

here = Path(__file__).resolve().parent
examples = here.parent.parent / "skills" / "mmm-budget-optimizer" / "examples"


def run(cmd, cwd):
    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if result.returncode != 0:
        sys.exit(f"{' '.join(map(str, cmd))} failed:\n{result.stderr}")
    return result.stdout


def response(p, x):
    level = x / (1 - p["decay"])
    return p["beta"] * level ** p["p"] / (p["alpha"] ** p["p"] + level ** p["p"])


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--mmm", default=os.path.expanduser("~/.local/share/mmm-engine/build/mmm"))
    args = parser.parse_args()
    mmm = args.mmm

    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        for name in ("history.csv", "truth.json", "make_data.py", "grade.py"):
            shutil.copy(examples / name, work / name)

        # Reference run on the shipped example (seed 7).
        timings = []
        for _ in range(5):
            start = time.perf_counter()
            run([mmm, "fit", "--data", "history.csv", "--output", "model.json"], work)
            timings.append((time.perf_counter() - start) * 1000)
        run([mmm, "optimize", "--config", "model.json", "--output", "plan.json"], work)
        model = json.loads((work / "model.json").read_text())
        plan = json.loads((work / "plan.json").read_text())
        grade = run([sys.executable, "grade.py"], work)
        captured_ref = float(grade.strip().splitlines()[-1].split("captures ")[1].split("%")[0])

        fit = model["fit"]
        params = {c["name"]: c["params"] for c in model["channels"]}
        plan_by = {c["name"]: c for c in plan["channels"]}
        channels = []
        for c in fit["channels"]:
            p, pc = params[c["name"]], plan_by[c["name"]]
            top = 2.2 * c["current_weekly_spend"]
            curve = [[round(top * i / 60, 2), round(response(p, top * i / 60), 2)] for i in range(61)]
            channels.append({
                "name": c["name"], "share": c["share"], "roi": c["roi"], "mroi": c["mroi"],
                "decay": p["decay"], "slope": p["p"],
                "current": pc["current_weekly_spend"], "optimal": pc["optimal_weekly_spend"],
                "mroiOptimal": pc["mroi_optimal"],
                "currentResponse": pc["current_weekly_contribution"],
                "optimalResponse": pc["optimal_weekly_contribution"],
                "curve": curve,
            })

        # Trust check across 10 synthetic datasets with known answers.
        sweep = []
        for seed in range(1, 11):
            run([sys.executable, "make_data.py", "--seed", str(seed)], work)
            out = run([mmm, "fit", "--data", "history.csv", "--output", "model.json"], work)
            run([mmm, "optimize", "--config", "model.json", "--output", "plan.json"], work)
            m = json.loads((work / "model.json").read_text())
            g = run([sys.executable, "grade.py"], work)
            sweep.append({
                "seed": seed,
                "holdoutMape": m["fit"]["holdout"]["mape"],
                "captured": float(g.strip().splitlines()[-1].split("captures ")[1].split("%")[0]),
            })

    captured = [s["captured"] for s in sweep]
    data = {
        "weeks": len(model["target"]["values"]),
        "holdoutStart": fit["train_weeks"],
        "actual": model["target"]["values"],
        "trainingModelPrediction": fit["training_model_prediction"],
        "train": fit["train"], "holdout": fit["holdout"],
        "fitMsMedian": round(statistics.median(timings), 1),
        "baseShare": fit["base_share"],
        "channels": channels,
        "plan": {
            "budget": plan["weekly_budget"], "bound": plan["bound"],
            "current": plan["current_weekly_media_contribution"],
            "optimal": plan["optimal_weekly_media_contribution"],
            "lift": plan["weekly_lift"], "liftPct": plan["lift_pct"],
        },
        "proof": {
            "referenceCaptured": captured_ref,
            "sweep": sweep,
            "capturedMedian": statistics.median(captured),
            "capturedMin": min(captured),
            "atLeast90": sum(c >= 90 for c in captured),
            "holdoutMapeMax": max(s["holdoutMape"] for s in sweep),
        },
    }
    (here / "mmm-demo.json").write_text(json.dumps(data, indent=1) + "\n")
    print(f"wrote mmm-demo.json: fit {data['fitMsMedian']} ms median, "
          f"plan lift {data['plan']['lift']:+.0f}/week, captured median {data['proof']['capturedMedian']}%, "
          f"{data['proof']['atLeast90']}/10 >= 90%, min {data['proof']['capturedMin']}%")


if __name__ == "__main__":
    main()
