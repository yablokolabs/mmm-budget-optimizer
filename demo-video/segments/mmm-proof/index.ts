import { defineSegment } from "videowright";
import { fadeIn, linear } from "../../components/charts";
import { DATA, fmt } from "../../components/demo-data";
import { EASE, enterHud, hudScene, rise } from "../../components/hud";

let host: HTMLElement | null = null;

const W = 1100;
const H = 520;

export default defineSegment({
	id: "mmm-proof",
	advances: [3.45, 10.33],
	voiceover:
		"We tested it on ten datasets with known answers. On nine of them, the plan captured over ninety percent of the best possible gain. On one, sixty three percent.",
	notes: "Ten bars: share of the true best lift each fitted plan captured, with a 90% guide line.",

	mount(el) {
		host = el;
		const sweep = DATA.proof.sweep;
		const band = W / sweep.length;
		const y = linear(0, 100, H, 0);
		const bars = sweep
			.map((s, i) => {
				const low = s.captured < 90;
				return `
          <rect data-bar x="${i * band + band * 0.18}" y="${y(s.captured)}" width="${band * 0.64}" height="${H - y(s.captured)}"
            fill="${low ? "var(--warn)" : "var(--cyan)"}" style="transform-origin: 0 ${H}px; transform: scaleY(0);" />
          <text data-val x="${i * band + band / 2}" y="${y(s.captured) - 14}" fill="${low ? "var(--warn)" : "var(--color-fg)"}"
            font-size="26" font-family="var(--font-mono)" text-anchor="middle" style="opacity: 0;">${fmt(s.captured)}%</text>
          <text x="${i * band + band / 2}" y="${H + 36}" fill="var(--color-muted)" font-size="22"
            font-family="var(--font-mono)" text-anchor="middle">#${s.seed}</text>`;
			})
			.join("");

		el.innerHTML = hudScene(
			"TRUST CHECK &middot; DATA WITH KNOWN ANSWERS",
			`
      <div data-ref="setup" style="position: absolute; left: 56px; top: 110px; right: 56px; opacity: 0;
        font-size: 40px; color: var(--color-muted);">
        &bull; 10 synthetic datasets &middot; 3 years &middot; true curves hidden from the fit<br/>
        &bull; Score: share of the best possible lift the plan captures, on the <span style="color: var(--color-fg);">true</span> curves
      </div>
      <svg style="position: absolute; left: 56px; top: 300px; overflow: visible;" width="${W}" height="${H + 50}">
        <line x1="0" y1="${H}" x2="${W}" y2="${H}" stroke="var(--color-border)" stroke-width="2" />
        <line data-ref="guide" x1="0" y1="${y(90)}" x2="${W}" y2="${y(90)}" stroke="var(--color-accent)"
          stroke-width="2" stroke-dasharray="10,8" style="opacity: 0;" />
        <text data-ref="guide-label" x="${W + 12}" y="${y(90) + 8}" fill="var(--color-accent)" font-size="24"
          font-family="var(--font-mono)" style="opacity: 0;">90%</text>
        ${bars}
      </svg>
      <div data-ref="summary" style="position: absolute; left: 1290px; right: 56px; top: 320px; opacity: 0; font-family: var(--font-mono);">
        <div style="font-size: 24px; letter-spacing: 0.15em; color: var(--color-muted);">AT LEAST 90%</div>
        <div style="font-size: 110px; color: var(--cyan);">${DATA.proof.atLeast90}/10</div>
        <div style="font-size: 24px; letter-spacing: 0.15em; color: var(--color-muted); margin-top: 24px;">MEDIAN</div>
        <div style="font-size: 72px;">${fmt(DATA.proof.capturedMedian)}%</div>
        <div style="font-size: 24px; letter-spacing: 0.15em; color: var(--color-muted); margin-top: 24px;">WORST</div>
        <div style="font-size: 72px; color: var(--warn);">${fmt(DATA.proof.capturedMin)}%</div>
      </div>
    `,
			`<span>examples/grade.py</span><span style="margin-left: auto;">HOLDOUT MAPE &le; ${fmt(DATA.proof.holdoutMapeMax * 100, 1)}% ON ALL 10</span>`,
		);
	},

	async play(ctx) {
		if (!host) return;
		const q = (ref: string) => host?.querySelector(`[data-ref="${ref}"]`) as HTMLElement;
		enterHud(host);
		rise(q("setup"), 300);

		await ctx.waitForNext();

		fadeIn(q("guide"), 0);
		fadeIn(q("guide-label"), 100);
		host.querySelectorAll("[data-bar]").forEach((b, i) =>
			(b as SVGRectElement).animate([{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], {
				duration: 600,
				delay: 300 + i * 180,
				fill: "forwards",
				easing: EASE,
			}),
		);
		host.querySelectorAll("[data-val]").forEach((v, i) => fadeIn(v, 800 + i * 180));
		rise(q("summary"), 3200);
	},

	unmount() {
		host = null;
	},
});
