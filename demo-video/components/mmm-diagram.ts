/**
 * The skill's pipeline as a flowchart with one gate, built to diagram-design's
 * rules (github.com/cathrynlavery/diagram-design): straight connectors on a
 * shared axis, arrows before boxes, masked arrow labels with a visible gap,
 * accent on two elements only (Optimize and its output arrow), dashed
 * stroke for the failure path, legend as a bottom strip, 4px grid.
 */

import { OPTS } from "./hud";

export const DIAGRAM_W = 1680;
export const DIAGRAM_H = 500;

type Box = { x: number; y: number; w: number; h: number; tag: string; name: string; sub: string };

const Y = 96;
const H = 112;
const MID = Y + H / 2; // 152
const MONO = "Geist Mono, monospace";

const HISTORY: Box = { x: 0, y: Y, w: 280, h: H, tag: "INPUT", name: "Weekly history", sub: "sales + spend" };
const FIT: Box = { x: 364, y: Y, w: 240, h: H, tag: "STEP", name: "Fit", sub: "adstock + hill" };
const GATE: Box = { x: 688, y: Y, w: 280, h: H, tag: "GATE", name: "Holdout check", sub: "13 unseen weeks" };
const OPTIMIZE: Box = { x: 1052, y: Y, w: 260, h: H, tag: "STEP", name: "Optimize", sub: "equal marginal ROI" };
const REPORT: Box = { x: 1396, y: Y, w: 284, h: H, tag: "OUTPUT", name: "Report", sub: "mmm-report.md" };
const STOP: Box = { x: 668, y: 300, w: 320, h: 96, tag: "STOP", name: "Keep budget as is", sub: "MAPE over 10%" };

const right = (b: Box) => b.x + b.w;
const cx = (b: Box) => b.x + b.w / 2;

function arrow(step: string, d: string, kind: "data" | "accent" | "fail" = "data"): string {
	const stroke = kind === "accent" ? "var(--color-accent)" : "var(--color-muted)";
	const marker = kind === "accent" ? "md-arrow-accent" : "md-arrow";
	const dash = kind === "fail" ? ' stroke-dasharray="10,8"' : "";
	return `<path data-step="${step}" d="${d}" fill="none" stroke="${stroke}" stroke-width="3"${dash}
    marker-end="url(#${marker})" style="opacity: 0;" />`;
}

/** Arrow label on an opaque mask, 8px clear of its connector. */
function label(step: string, text: string, x: number, y: number, anchor: "middle" | "start"): string {
	const w = Math.ceil(text.length * 0.62 * 18) + 16;
	const left = anchor === "middle" ? x - w / 2 : x;
	return `<g data-step="${step}" style="opacity: 0;">
    <rect x="${left}" y="${y - 20}" width="${w}" height="26" rx="2" fill="var(--color-bg)" />
    <text x="${anchor === "middle" ? x : x + 8}" y="${y - 1}" text-anchor="${anchor}" fill="var(--color-muted)"
      font-size="18" font-family="${MONO}" letter-spacing="0.08em">${text}</text>
  </g>`;
}

function node(b: Box, step: string, kind: "plain" | "focal" | "stop" = "plain"): string {
	const stroke =
		kind === "focal" ? "var(--color-accent)" : kind === "stop" ? "var(--color-muted)" : "rgba(232, 238, 245, 0.55)";
	const fill = kind === "focal" ? "rgba(255, 136, 0, 0.10)" : "var(--color-surface)";
	const dash = kind === "stop" ? ' stroke-dasharray="10,8"' : "";
	const tagW = b.tag.length * 11 + 20;
	const tall = b.h >= 112;
	return `<g data-step="${step}" style="opacity: 0;">
    <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="6" fill="var(--color-bg)" />
    <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="6" fill="${fill}" stroke="${stroke}"
      stroke-width="${kind === "focal" ? 3 : 1.5}"${dash} />
    <rect x="${b.x + 12}" y="${b.y + 10}" width="${tagW}" height="22" rx="2" fill="none" stroke="${stroke}" stroke-opacity="0.6" />
    <text x="${b.x + 12 + tagW / 2}" y="${b.y + 26}" fill="${stroke}" font-size="15" font-family="${MONO}"
      text-anchor="middle" letter-spacing="0.08em">${b.tag}</text>
    <text x="${cx(b)}" y="${b.y + (tall ? 72 : 62)}" fill="var(--color-fg)" font-size="${tall ? 32 : 28}" font-weight="600"
      font-family="var(--font-display)" text-anchor="middle">${b.name}</text>
    <text x="${cx(b)}" y="${b.y + (tall ? 100 : 86)}" fill="${kind === "focal" ? "var(--color-accent)" : "var(--color-muted)"}"
      font-size="22" font-family="${MONO}" text-anchor="middle">${b.sub}</text>
  </g>`;
}

export function mmmDiagram(): string {
	const arrows = [
		arrow("fit", `M${right(HISTORY)},${MID} H${FIT.x}`),
		arrow("gate", `M${right(FIT)},${MID} H${GATE.x}`),
		arrow("optimize", `M${right(GATE)},${MID} H${OPTIMIZE.x}`),
		arrow("stop", `M${cx(GATE)},${GATE.y + GATE.h} V${STOP.y}`, "fail"),
		arrow("report", `M${right(OPTIMIZE)},${MID} H${REPORT.x}`, "accent"),
	].join("");
	const labels = [
		label("optimize", "PASS", (right(GATE) + OPTIMIZE.x) / 2, MID - 8, "middle"),
		label("stop", "FAIL", cx(GATE) + 8, (GATE.y + GATE.h + STOP.y) / 2 + 8, "start"),
	].join("");
	const nodes = [
		node(HISTORY, "history"),
		node(FIT, "fit"),
		node(GATE, "gate"),
		node(OPTIMIZE, "optimize", "focal"),
		node(REPORT, "report"),
		node(STOP, "stop", "stop"),
	].join("");

	const ly = 452;
	const legend = `<g data-step="legend" style="opacity: 0;">
    <line x1="0" y1="${ly - 20}" x2="${DIAGRAM_W}" y2="${ly - 20}" stroke="rgba(232, 238, 245, 0.10)" />
    <text x="0" y="${ly + 20}" fill="var(--color-muted)" font-size="18" font-family="${MONO}" letter-spacing="0.14em">LEGEND</text>
    <rect x="160" y="${ly + 2}" width="28" height="24" rx="4" fill="rgba(255, 136, 0, 0.10)" stroke="var(--color-accent)" stroke-width="2" />
    <text x="204" y="${ly + 20}" fill="var(--color-fg)" font-size="20" font-family="${MONO}">FOCAL STEP</text>
    <line x1="420" y1="${ly + 14}" x2="480" y2="${ly + 14}" stroke="var(--color-muted)" stroke-width="3" marker-end="url(#md-arrow)" />
    <text x="500" y="${ly + 20}" fill="var(--color-fg)" font-size="20" font-family="${MONO}">DATA</text>
    <line x1="620" y1="${ly + 14}" x2="680" y2="${ly + 14}" stroke="var(--color-muted)" stroke-width="3" stroke-dasharray="10,8" marker-end="url(#md-arrow)" />
    <text x="700" y="${ly + 20}" fill="var(--color-fg)" font-size="20" font-family="${MONO}">FAILED CHECK</text>
  </g>`;

	return `<svg data-ref="mmm-diagram" viewBox="0 0 ${DIAGRAM_W} ${DIAGRAM_H}" width="${DIAGRAM_W}" height="${DIAGRAM_H}"
    role="img" aria-labelledby="md-title md-desc" style="overflow: visible;">
    <title id="md-title">MMM budget optimizer pipeline</title>
    <desc id="md-desc">Weekly history is fitted, checked on 13 unseen weeks, then optimized into a report; a failed check keeps the budget as is.</desc>
    <defs>
      <marker id="md-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill="var(--color-muted)" />
      </marker>
      <marker id="md-arrow-accent" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill="var(--color-accent)" />
      </marker>
    </defs>
    ${arrows}
    ${labels}
    ${nodes}
    ${legend}
  </svg>`;
}

/** Reveal one step: its node, incoming arrows and labels. */
export function revealStep(host: HTMLElement, step: string, delay: number): void {
	host.querySelectorAll(`[data-ref="mmm-diagram"] [data-step="${step}"]`).forEach((el) => {
		(el as SVGElement).animate(
			[
				{ opacity: 0, transform: "translateY(6px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...OPTS, duration: 360, delay },
		);
	});
}
