import { defineSegment } from "videowright";
import { fadeIn } from "../../components/charts";
import { CHANNEL_COLOR, DATA, fmt } from "../../components/demo-data";
import { EASE, enterHud, hudScene, rise } from "../../components/hud";

let host: HTMLElement | null = null;

const BAR = 760;

export default defineSegment({
	id: "mmm-plan",
	advances: [5.8, 11.99, 15.37],
	voiceover:
		"The optimizer moves budget from social into search and TV, with the same total spend. Every channel ends at a marginal return of one point nine two, so no pound has a better place to go. Weekly sales from media rise by ninety five.",
	notes: "Bars move from current to recommended weekly spend; then equal marginal ROI; then the lift.",

	mount(el) {
		host = el;
		const max = Math.max(...DATA.channels.flatMap((c) => [c.current, c.optimal]));
		const rows = DATA.channels.map((c) => {
			const change = c.optimal / c.current - 1;
			return `
        <div data-row style="display: grid; grid-template-columns: 220px ${BAR}px 180px 260px; align-items: center;
          padding: 28px 0; border-top: 1px solid var(--color-border); opacity: 0;">
          <span style="font-family: var(--font-mono); font-size: 42px; color: ${CHANNEL_COLOR[c.name]};">${c.name}</span>
          <div style="position: relative; height: 56px;">
            <div style="position: absolute; left: 0; top: 0; height: 56px; width: ${(c.current / max) * BAR}px;
              border: 2px dashed var(--color-muted);"></div>
            <div data-bar data-from="${c.current / max}" data-to="${c.optimal / max}" style="position: absolute; left: 0; top: 8px;
              height: 40px; width: ${(c.current / max) * BAR}px; background: ${CHANNEL_COLOR[c.name]}; opacity: 0.85;"></div>
          </div>
          <span data-change style="font-family: var(--font-mono); font-size: 44px; text-align: right; opacity: 0;
            color: ${change >= 0 ? "var(--cyan)" : "var(--warn)"};">${change >= 0 ? "+" : "&minus;"}${fmt(Math.abs(change) * 100)}%</span>
          <span data-mroi style="font-family: var(--font-mono); font-size: 44px; text-align: right; opacity: 0;">${fmt(c.mroiOptimal, 2)}</span>
        </div>`;
		}).join("");

		el.innerHTML = hudScene(
			"RECOMMENDED WEEKLY BUDGET &middot; SAME TOTAL",
			`
      <div style="position: absolute; left: 56px; right: 56px; top: 110px;">
        <div style="display: grid; grid-template-columns: 220px ${BAR}px 180px 260px; padding-bottom: 14px;
          font-family: var(--font-mono); font-size: 22px; letter-spacing: 0.15em; color: var(--color-muted);">
          <span>CHANNEL</span><span>NOW (dashed) &rarr; RECOMMENDED</span><span style="text-align: right;">CHANGE</span>
          <span style="text-align: right;">MARGINAL ROI</span></div>
        ${rows}
      </div>
      <div data-ref="equal" style="position: absolute; left: 56px; right: 56px; top: 600px; opacity: 0; font-size: 46px;">
        <span style="font-family: var(--font-mono); color: var(--color-accent);">${fmt(DATA.channels[0].mroiOptimal, 2)} &middot; ${fmt(DATA.channels[1].mroiOptimal, 2)} &middot; ${fmt(DATA.channels[2].mroiOptimal, 2)}</span>
        &nbsp;equal marginal return in every channel</div>
      <div data-ref="lift" style="position: absolute; left: 56px; right: 56px; top: 700px; opacity: 0; font-family: var(--font-mono);">
        <div style="font-size: 24px; letter-spacing: 0.15em; color: var(--color-muted);">MEDIA-DRIVEN SALES PER WEEK</div>
        <div style="font-size: 92px;">${fmt(DATA.plan.current)} &rarr; ${fmt(DATA.plan.optimal)}
          <span style="color: var(--cyan);">+${fmt(DATA.plan.lift)}</span></div>
      </div>
    `,
			`<span>BUDGET ${fmt(DATA.plan.budget)} / WEEK</span><span>EACH CHANNEL WITHIN &plusmn;${fmt(DATA.plan.bound * 100)}%</span><span style="margin-left: auto;">STEADY-STATE ESTIMATE</span>`,
		);
	},

	async play(ctx) {
		if (!host) return;
		enterHud(host);
		host.querySelectorAll("[data-row]").forEach((r, i) => rise(r, 300 + i * 200, 360, 10));
		host.querySelectorAll("[data-bar]").forEach((b, i) => {
			const el = b as HTMLElement;
			el.animate(
				[{ width: `${Number(el.dataset.from) * BAR}px` }, { width: `${Number(el.dataset.to) * BAR}px` }],
				{ duration: 1400, delay: 1600 + i * 250, fill: "forwards", easing: EASE },
			);
		});
		host.querySelectorAll("[data-change]").forEach((c, i) => fadeIn(c, 2900 + i * 200));

		await ctx.waitForNext();

		host.querySelectorAll("[data-mroi]").forEach((m, i) => fadeIn(m, 200 + i * 200));
		rise(host.querySelector('[data-ref="equal"]') as HTMLElement, 1000);

		await ctx.waitForNext();

		rise(host.querySelector('[data-ref="lift"]') as HTMLElement, 0, 420, 14);
	},

	unmount() {
		host = null;
	},
});
