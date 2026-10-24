import { defineSegment } from "videowright";
import { drawPath, fadeIn, linear, polyline } from "../../components/charts";
import { BY_MROI, CHANNEL_COLOR, fmt } from "../../components/demo-data";
import { enterHud, hudScene, rise } from "../../components/hud";

let host: HTMLElement | null = null;

const PW = 500;
const PH = 420;

export default defineSegment({
	id: "mmm-curves",
	advances: [2.73, 10.67],
	voiceover:
		"Each channel gets a response curve. The slope at today's spend is the marginal return. Search returns two point three per pound. Social returns one point two.",
	notes: "One response curve per channel on shared axes, so slopes compare directly; tangents mark marginal ROI.",

	mount(el) {
		host = el;
		// Shared scales: the same pound and the same sale look the same in every panel.
		const xMax = Math.max(...BY_MROI.map((c) => c.curve[c.curve.length - 1][0]));
		const yMax = Math.max(...BY_MROI.flatMap((c) => c.curve.map((p) => p[1]))) * 1.1;
		const x = linear(0, xMax, 0, PW);
		const y = linear(0, yMax, PH, 0);

		const panels = BY_MROI.map((c) => {
			const color = CHANNEL_COLOR[c.name];
			const xs = c.curve.map((p) => p[0]);
			const ys = c.curve.map((p) => p[1]);
			const span = xMax * 0.18;
			const t0 = Math.max(0, c.current - span);
			const t1 = c.current + span;
			const tangent = `M${x(t0)},${y(c.currentResponse + c.mroi * (t0 - c.current))} L${x(t1)},${y(c.currentResponse + c.mroi * (t1 - c.current))}`;
			return `
        <div data-panel="${c.name}" style="position: relative; width: ${PW}px;">
          <div style="font-family: var(--font-mono); font-size: 40px; color: ${color};">${c.name}</div>
          <svg style="overflow: visible; margin-top: 16px;" width="${PW}" height="${PH + 40}">
            <line x1="0" y1="${PH}" x2="${PW}" y2="${PH}" stroke="var(--color-border)" stroke-width="2" />
            <line x1="0" y1="0" x2="0" y2="${PH}" stroke="var(--color-border)" stroke-width="2" />
            <text x="${PW}" y="${PH + 32}" fill="var(--color-muted)" font-size="20" font-family="var(--font-mono)"
              text-anchor="end">weekly spend &rarr;</text>
            <path data-curve d="${polyline(xs, ys, x, y)}" fill="none" stroke="${color}" stroke-width="4" style="opacity: 0;" />
            <path data-tangent d="${tangent}" fill="none" stroke="var(--color-fg)" stroke-width="2.5"
              stroke-dasharray="8,6" style="opacity: 0;" />
            <circle data-dot cx="${x(c.current)}" cy="${y(c.currentResponse)}" r="10" fill="var(--color-bg)"
              stroke="var(--color-fg)" stroke-width="3" style="opacity: 0;" />
          </svg>
          <div data-label style="opacity: 0; margin-top: 8px; font-family: var(--font-mono);">
            <div style="font-size: 22px; letter-spacing: 0.15em; color: var(--color-muted);">MARGINAL ROI AT TODAY'S SPEND</div>
            <div data-value style="font-size: 88px;">${fmt(c.mroi, 2)}</div>
          </div>
        </div>`;
		}).join("");

		el.innerHTML = hudScene(
			"RESPONSE CURVES &middot; SHARED AXES",
			`<div style="position: absolute; left: 56px; right: 56px; top: 120px; display: flex; justify-content: space-between;">${panels}</div>`,
			'<span>SLOPE AT &#9675; = SALES FROM THE NEXT POUND</span><span style="margin-left: auto;">CURVES FROM mmm fit</span>',
		);
	},

	async play(ctx) {
		if (!host) return;
		enterHud(host);
		host.querySelectorAll("[data-curve]").forEach((p, i) => drawPath(p as SVGPathElement, 300 + i * 350, 1200));

		await ctx.waitForNext();

		host.querySelectorAll("[data-panel]").forEach((panel, i) => {
			fadeIn(panel.querySelector("[data-dot]") as Element, 200 + i * 150);
			fadeIn(panel.querySelector("[data-tangent]") as Element, 500 + i * 150);
			rise(panel.querySelector("[data-label]") as Element, 800 + i * 150);
		});
		// Emphasis paced to "Search returns..." then "Social returns...".
		const pulse = (name: string, delay: number) =>
			(host?.querySelector(`[data-panel="${name}"] [data-value]`) as HTMLElement).animate(
				[{ color: "var(--color-fg)" }, { color: "var(--color-accent)" }],
				{ duration: 300, delay, fill: "forwards" },
			);
		pulse("search", 3300);
		pulse("social", 5600);
	},

	unmount() {
		host = null;
	},
});
