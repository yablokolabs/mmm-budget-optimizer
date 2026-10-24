#!/usr/bin/env python3
"""Turn `mmm fit` / `mmm optimize` / `mmm forecast` JSON into a Markdown report.

Example:
  python3 report.py model.json plan.json --forecast forecast.json --currency GBP > mmm-report.md
"""

import argparse
import json


def money(value, currency):
    return f"{currency} {value:,.0f}" if currency else f"{value:,.0f}"


def confidence(holdout):
    mape, r2 = holdout["mape"], holdout["r2"]
    if mape < 0.05 and r2 > 0.7:
        return "good"
    if mape < 0.10 and r2 > 0.5:
        return "low: treat the plan as directional"
    return "insufficient: do not move budget on this model"


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("model")
    parser.add_argument("plan")
    parser.add_argument("--forecast")
    parser.add_argument("--currency", default="", help="label for spend, e.g. GBP")
    args = parser.parse_args()

    model = json.load(open(args.model))
    plan = json.load(open(args.plan))
    fit = model["fit"]
    target = model["target"]["name"]
    cur = args.currency
    out = []

    out += [f"## Model accuracy: `{target}`", ""]
    out += ["| Weeks | R² | MAPE |", "| --- | --- | --- |"]
    out.append(f"| training ({fit['train_weeks']}) | {fit['train']['r2']:.3f} | {fit['train']['mape']:.1%} |")
    if fit["holdout_weeks"]:
        out.append(f"| holdout ({fit['holdout_weeks']}, never seen by the fit) | {fit['holdout']['r2']:.3f} | {fit['holdout']['mape']:.1%} |")
    out += ["", f"- Confidence: **{confidence(fit['holdout'])}**",
            f"- Baseline (trend + seasonality): {fit['base_share']:.1%} of {target}", ""]

    out += ["## Channels", ""]
    out += ["| Channel | Weekly spend now | Share of sales | Total ROI | Marginal ROI | Carryover | Curve |",
            "| --- | --- | --- | --- | --- | --- | --- |"]
    params = {c["name"]: c["params"] for c in model["channels"]}
    for c in sorted(fit["channels"], key=lambda c: -c["mroi"]):
        p = params[c["name"]]
        curve = "S-shaped" if p["p"] > 1.25 else "diminishing"
        effect = "no measurable effect" if c["share"] == 0 else f"{c['share']:.1%}"
        out.append(f"| {c['name']} | {money(c['current_weekly_spend'], cur)} | {effect} | {c['roi']:.2f} | "
                   f"**{c['mroi']:.2f}** | {p['decay']:.1f} | {curve} |")
    out += ["",
            "- Marginal ROI: extra sales from the next unit of weekly spend. Use this for decisions.",
            "- Total ROI: sales attributed per unit spent so far. Softer for always-on channels.",
            "- Carryover: share of this week's effect that lasts into next week.", ""]

    out += ["## Recommended weekly budget", ""]
    out += [f"| Channel | Now | Recommended | Change | Marginal ROI after |", "| --- | --- | --- | --- | --- |"]
    for c in plan["channels"]:
        change = (c["optimal_weekly_spend"] / c["current_weekly_spend"] - 1) if c["current_weekly_spend"] else 0
        out.append(f"| {c['name']} | {money(c['current_weekly_spend'], cur)} | {money(c['optimal_weekly_spend'], cur)} | "
                   f"{change:+.0%} | {c['mroi_optimal']:.2f} |")
    out += ["",
            f"- Same total: {money(plan['weekly_budget'], cur)} per week",
            f"- Media-driven {target}: {plan['current_weekly_media_contribution']:,.0f} → "
            f"{plan['optimal_weekly_media_contribution']:,.0f} per week (**{plan['weekly_lift']:+,.0f}**, {plan['lift_pct']:+.1%})",
            f"- Each channel kept within ±{plan['bound']:.0%} of current spend", ""]

    if args.forecast:
        fc = json.load(open(args.forecast))
        future = fc["future"]
        out += ["## Forecast with the recommended plan", "",
                f"- Next {len(future)} weeks: {sum(future):,.0f} {target} total, {sum(future) / len(future):,.0f} per week", ""]

    out += ["## Caveats",
            "- MMM is correlational. Validate large moves with a geo or holdout lift test.",
            "- Lift is a steady-state weekly estimate inside the bounds.",
            "- Not modelled: price, promotions, competitors, distribution.",
            "- No confidence intervals (deterministic fit)."]
    print("\n".join(out))


if __name__ == "__main__":
    main()
