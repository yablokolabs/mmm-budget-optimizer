/** Small SVG chart helpers shared by the MMM scenes. */

import { OPTS } from "./hud";

export type Scale = (v: number) => number;

export function linear(d0: number, d1: number, r0: number, r1: number): Scale {
	return (v) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
}

export function polyline(xs: number[], ys: number[], x: Scale, y: Scale): string {
	return xs.map((v, i) => `${i === 0 ? "M" : "L"}${x(v).toFixed(1)},${y(ys[i]).toFixed(1)}`).join(" ");
}

/** Draw an SVG path from start to end (stroke-dashoffset), render-clock safe. */
export function drawPath(path: SVGPathElement, delay: number, duration: number): void {
	const length = path.getTotalLength();
	path.style.strokeDasharray = `${length}`;
	path.style.strokeDashoffset = `${length}`;
	path.style.opacity = "1";
	path.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], { ...OPTS, duration, delay });
}

export function fadeIn(el: Element, delay: number, duration = 360): void {
	(el as HTMLElement).animate([{ opacity: 0 }, { opacity: 1 }], { ...OPTS, duration, delay });
}
