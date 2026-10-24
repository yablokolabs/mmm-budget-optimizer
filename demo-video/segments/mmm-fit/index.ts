import { defineSegment } from "videowright";
import { drawPath, fadeIn, linear, polyline } from "../../components/charts";
import { DATA, fmt } from "../../components/demo-data";
import { enterHud, hudScene, rise, tickNumber } from "../../components/hud";

let host: HTMLElement | null = null;

const W = 1180;
const CH = 600;

export default defineSegment({
	id: "mmm-fit",
	advances: [2.77, 8.07],
	voiceover:
		"The fit takes twenty two milliseconds. On the thirteen weeks it never saw, it misses actual sales by under one percent.",
	notes: "Actual weekly sales draw in, then the training-only model overlays them; the held-out weeks are shaded.",

	mount(el) {
		host = el;
		const n = DATA.weeks;
		const all = [...DATA.actual, ...DATA.trainingModelPrediction];
		const lo = Math.min(...all);
		const hi = Math.max(...all);
		const x = linear(0, n - 1, 0, W);
		const y = linear(lo - (hi - lo) * 0.05, hi + (hi - lo) * 0.05, CH, 0);
		const weeks = DATA.actual.map((_, i) => i);
		const hx = x(DATA.holdoutStart - 0.5);
		const ticks = [0, 52, 104, n - 1]
			.map((t) => `<text x="${x(t)}" y="${CH + 36}" fill="var(--color-muted)" font-size="22"
          font-family="var(--font-mono)" text-anchor="middle">W${t + 1}</text>`)
			.join("");

		el.innerHTML = hudScene(
			"FIT &middot; WEEKLY SALES &middot; ACTUAL VS MODEL",
			`
      <svg data-ref="chart" style="position: absolute; left: 56px; top: 130px; overflow: visible;" width="${W}" height="${CH + 50}">
        <rect data-ref="holdout" x="${hx}" y="0" width="${W - hx}" height="${CH}" fill="rgba(79, 209, 224, 0.10)"
          stroke="var(--cyan)" stroke-dasharray="6,6" style="opacity: 0;" />
        <text data-ref="holdout-label" x="${hx - 12}" y="34" fill="var(--cyan)" font-size="22" font-family="var(--font-mono)"
          text-anchor="end" style="opacity: 0;">13 WEEKS THE FIT NEVER SAW &rarr;</text>
        <line x1="0" y1="${CH}" x2="${W}" y2="${CH}" stroke="var(--color-border)" stroke-width="2" />
        ${ticks}
        <path data-ref="actual" d="${polyline(weeks, DATA.actual, x, y)}" fill="none" stroke="rgba(232, 238, 245, 0.55)"
          stroke-width="7" stroke-linejoin="round" style="opacity: 0;" />
        <path data-ref="model" d="${polyline(weeks, DATA.trainingModelPrediction, x, y)}" fill="none" stroke="var(--cyan)"
          stroke-width="2.5" style="opacity: 0;" />
      </svg>
      <div style="position: absolute; left: 1300px; right: 56px; top: 150px; font-family: var(--font-mono);">
        <div data-ref="r-time" style="opacity: 0; padding-bottom: 24px; border-bottom: 1px solid var(--color-border);">
          <div style="font-size: 24px; letter-spacing: 0.15em; color: var(--color-muted);">FIT TIME</div>
          <div style="font-size: 96px;"><span data-ref="ms">0</span><span style="font-size: 36px; color: var(--color-muted);"> ms</span></div>
        </div>
        <div data-ref="r-mape" style="opacity: 0; padding: 24px 0; border-bottom: 1px solid var(--color-border);">
          <div style="font-size: 24px; letter-spacing: 0.15em; color: var(--color-muted);">HOLDOUT ERROR (MAPE)</div>
          <div style="font-size: 96px; color: var(--cyan);">${fmt(DATA.holdout.mape * 100, 1)}%</div>
        </div>
        <div data-ref="r-r2" style="opacity: 0; padding-top: 24px;">
          <div style="font-size: 24px; letter-spacing: 0.15em; color: var(--color-muted);">HOLDOUT R&sup2;</div>
          <div style="font-size: 96px;">${fmt(DATA.holdout.r2, 2)}</div>
        </div>
      </div>
      <div data-ref="legend" style="position: absolute; left: 56px; top: 830px; display: flex; gap: 48px; opacity: 0;
        font-family: var(--font-mono); font-size: 26px;">
        <span><span style="display: inline-block; width: 48px; height: 8px; background: rgba(232, 238, 245, 0.55); vertical-align: middle;"></span> actual sales</span>
        <span><span style="display: inline-block; width: 48px; height: 4px; background: var(--cyan); vertical-align: middle;"></span> model fitted on weeks 1&ndash;${DATA.holdoutStart}</span>
      </div>
    `,
			`<span>${DATA.weeks} WEEKS &middot; 3 CHANNELS</span><span style="margin-left: auto;">FIT TIME: MEDIAN OF 5 RUNS</span>`,
		);
	},

	async play(ctx) {
		if (!host) return;
		const q = (ref: string) => host?.querySelector(`[data-ref="${ref}"]`) as HTMLElement;
		enterHud(host);
		drawPath(q("actual") as unknown as SVGPathElement, 300, 1800);
		rise(q("r-time"), 400);
		setTimeout(() => tickNumber(q("ms"), DATA.fitMsMedian, { decimals: 0, steps: 10, stepMs: 60 }), 500);

		await ctx.waitForNext();

		fadeIn(q("holdout"), 0, 500);
		fadeIn(q("holdout-label"), 200, 500);
		drawPath(q("model") as unknown as SVGPathElement, 300, 2200);
		rise(q("legend"), 300);
		rise(q("r-mape"), 2400);
		rise(q("r-r2"), 2900);
	},

	unmount() {
		host = null;
	},
});
