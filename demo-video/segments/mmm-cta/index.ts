import { defineSegment } from "videowright";
import { enterHud, hudScene, OPTS, rise } from "../../components/hud";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "mmm-cta",
	advances: [3.56, 8.48],
	voiceover: "MMM Budget Optimizer is free on Agensi. The engine is open source, at yabloko labs slash M M M engine.",
	notes: "Reticle locks onto the call to action; links follow.",

	mount(el) {
		host = el;
		el.innerHTML = hudScene(
			"INSTALL &middot; AGENSI",
			`
      <svg data-ref="reticle" style="position: absolute; left: 50%; top: 300px; transform: translate(-50%, -50%); overflow: visible;"
        width="220" height="220" viewBox="-110 -110 220 220">
        <circle r="90" fill="none" stroke="var(--color-accent)" stroke-width="2" style="transform: scale(0);" />
        <line x1="-110" y1="0" x2="-40" y2="0" stroke="var(--color-accent)" stroke-width="2" style="opacity: 0;" />
        <line x1="40" y1="0" x2="110" y2="0" stroke="var(--color-accent)" stroke-width="2" style="opacity: 0;" />
        <line x1="0" y1="-110" x2="0" y2="-40" stroke="var(--color-accent)" stroke-width="2" style="opacity: 0;" />
        <line x1="0" y1="40" x2="0" y2="110" stroke="var(--color-accent)" stroke-width="2" style="opacity: 0;" />
      </svg>
      <div data-ref="headline" style="position: absolute; left: 56px; right: 56px; top: 440px; text-align: center; opacity: 0;
        font-family: var(--font-display); font-weight: 500; font-size: 120px; letter-spacing: -0.02em;">MMM Budget Optimizer</div>
      <div data-ref="free" style="position: absolute; left: 56px; right: 56px; top: 590px; text-align: center; opacity: 0;
        font-family: var(--font-mono); font-size: 52px; color: var(--color-accent);">Free on Agensi</div>
      <div data-ref="links" style="position: absolute; left: 56px; right: 56px; top: 680px; text-align: center; opacity: 0;
        font-family: var(--font-mono); font-size: 38px; color: var(--cyan); line-height: 1.6;">
        github.com/yablokolabs/mmm-budget-optimizer<br/>github.com/yablokolabs/mmm-engine<br/>yablokolabs.com</div>
    `,
			'<span>LICENSE MIT</span><span>RUNS OFFLINE</span><span style="margin-left: auto;">YABLOKO LABS</span>',
		);
	},

	async play(ctx) {
		if (!host) return;
		const q = (ref: string) => host?.querySelector(`[data-ref="${ref}"]`) as HTMLElement;
		enterHud(host);
		const reticle = q("reticle");
		(reticle.querySelector("circle") as SVGCircleElement).animate([{ transform: "scale(0)" }, { transform: "scale(1)" }], {
			...OPTS,
			duration: 420,
			delay: 200,
		});
		reticle.querySelectorAll("line").forEach((line, i) =>
			line.animate([{ opacity: 0 }, { opacity: 1 }], { ...OPTS, duration: 200, delay: 450 + i * 50 }),
		);
		rise(q("headline"), 600, 460, 16);
		rise(q("free"), 1300, 360, 10);

		await ctx.waitForNext();

		rise(q("links"), 200, 360, 10);
	},

	unmount() {
		host = null;
	},
});
