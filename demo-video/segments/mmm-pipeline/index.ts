import { defineSegment } from "videowright";
import { enterHud, hudScene, rise } from "../../components/hud";
import { mmmDiagram, revealStep } from "../../components/mmm-diagram";

let host: HTMLElement | null = null;

const PROMPT = "Where should next quarter's budget go?";

export default defineSegment({
	id: "mmm-pipeline",
	advances: [3.26, 8.9],
	voiceover:
		"You hand your agent three years of weekly data. The engine fits the model, checks it on weeks it never saw, and only then moves the budget.",
	notes: "Buyer prompt, then the pipeline as a diagram-design flowchart with a holdout gate.",

	mount(el) {
		host = el;
		const words = PROMPT.split(" ")
			.map((w) => `<span style="opacity: 0;">${w}</span>`)
			.join(" ");
		el.innerHTML = hudScene(
			"SESSION &middot; CLAUDE CODE",
			`
      <div data-ref="you" style="position: absolute; left: 56px; top: 120px; opacity: 0;
        font-family: var(--font-mono); font-size: 30px; color: var(--color-accent);">&rsaquo; BUYER &middot; history.csv (156 weeks)</div>
      <div data-ref="prompt" style="position: absolute; left: 56px; top: 168px; right: 56px;
        font-family: var(--font-display); font-size: 72px; line-height: 1.1;">${words}</div>
      <div style="position: absolute; left: 56px; top: 330px;">${mmmDiagram()}</div>
    `,
			'<span>SKILL.md LOADED</span><span>HOLDOUT: LAST 13 WEEKS</span><span style="margin-left: auto;">OFFLINE &middot; NO API KEYS</span>',
		);
	},

	async play(ctx) {
		if (!host) return;
		const q = (ref: string) => host?.querySelector(`[data-ref="${ref}"]`) as HTMLElement;
		enterHud(host);
		rise(q("you"), 200, 300, 8);
		q("prompt")
			.querySelectorAll("span")
			.forEach((w, i) => w.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1, delay: 400 + i * 120, fill: "forwards" }));
		revealStep(host, "history", 1700);

		await ctx.waitForNext();

		// Paced to: fits the model → checks it on unseen weeks → only then moves the budget.
		revealStep(host, "fit", 300);
		revealStep(host, "gate", 1500);
		revealStep(host, "stop", 2400);
		revealStep(host, "optimize", 3300);
		revealStep(host, "report", 4200);
		revealStep(host, "legend", 4800);
	},

	unmount() {
		host = null;
	},
});
