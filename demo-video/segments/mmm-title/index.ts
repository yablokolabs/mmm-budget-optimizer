import { defineSegment } from "videowright";
import { enterHud, hudScene, OPTS, rise } from "../../components/hud";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "mmm-title",
	advances: [4.52, 9.61],
	voiceover:
		"MMM Budget Optimizer. A skill for your coding agent. It reads your weekly sales and ad spend, and shows where the next pound sells most.",
	notes: "Title card: skill name and promise, then the method line bracketed by a dimension line.",

	mount(el) {
		host = el;
		el.innerHTML = hudScene(
			"AGENT SKILL &middot; MARKETING MIX MODELLING",
			`
      <div data-ref="kicker" style="position: absolute; left: 56px; top: 190px; opacity: 0;
        font-family: var(--font-mono); font-size: 40px; color: var(--cyan);">mmm-budget-optimizer</div>
      <div data-ref="headline" style="position: absolute; left: 56px; top: 260px; right: 56px; opacity: 0;
        font-family: var(--font-display); font-weight: 500; font-size: 140px; line-height: 1.0; letter-spacing: -0.02em;">
        Find where your<br/>next pound sells most</div>
      <svg data-ref="dim" style="position: absolute; left: 56px; top: 580px; overflow: visible;" width="1680" height="60">
        <line x1="0" y1="20" x2="1680" y2="20" stroke="var(--cyan)" stroke-width="2" style="transform-origin: 0 20px; transform: scaleX(0);" />
        <line x1="0" y1="6" x2="0" y2="34" stroke="var(--cyan)" stroke-width="2" style="opacity: 0;" />
        <line x1="1680" y1="6" x2="1680" y2="34" stroke="var(--cyan)" stroke-width="2" style="opacity: 0;" />
      </svg>
      <div data-ref="sub" style="position: absolute; left: 56px; top: 660px; right: 56px; opacity: 0;
        font-family: var(--font-display); font-size: 56px; color: var(--color-muted);">
        Adstock &middot; saturation &middot; budget optimizer</div>
      <div data-ref="agents" style="position: absolute; left: 56px; top: 760px; opacity: 0;
        font-family: var(--font-mono); font-size: 36px;">Claude Code &middot; Codex &middot; Cursor &middot; any SKILL.md agent</div>
    `,
			'<span>ENGINE: mmm-engine (C++23)</span><span>DETERMINISTIC</span><span style="margin-left: auto;">LET MATH WIN</span>',
		);
	},

	async play(ctx) {
		if (!host) return;
		const q = (ref: string) => host?.querySelector(`[data-ref="${ref}"]`) as HTMLElement;
		enterHud(host);
		rise(q("kicker"), 300);
		rise(q("headline"), 500, 500, 20);

		await ctx.waitForNext();

		const [main, tickL, tickR] = Array.from(q("dim").querySelectorAll("line"));
		main.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { ...OPTS, duration: 600 });
		tickL.animate([{ opacity: 0 }, { opacity: 1 }], { ...OPTS, duration: 150 });
		tickR.animate([{ opacity: 0 }, { opacity: 1 }], { ...OPTS, duration: 150, delay: 550 });
		rise(q("sub"), 250);
		rise(q("agents"), 600);
	},

	unmount() {
		host = null;
	},
});
