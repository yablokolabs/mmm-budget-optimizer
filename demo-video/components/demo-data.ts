/**
 * Typed access to data/mmm-demo.json, written by data/build_data.py from real
 * mmm-engine runs. Every number in the video comes from here.
 */
import raw from "../data/mmm-demo.json";

export type ChannelData = {
	name: string;
	share: number;
	roi: number;
	mroi: number;
	decay: number;
	slope: number;
	current: number;
	optimal: number;
	mroiOptimal: number;
	currentResponse: number;
	optimalResponse: number;
	curve: [number, number][];
};

export type DemoData = {
	weeks: number;
	holdoutStart: number;
	actual: number[];
	trainingModelPrediction: number[];
	train: { r2: number; mape: number };
	holdout: { r2: number; mape: number };
	fitMsMedian: number;
	baseShare: number;
	channels: ChannelData[];
	plan: { budget: number; bound: number; current: number; optimal: number; lift: number; liftPct: number };
	proof: {
		referenceCaptured: number;
		sweep: { seed: number; holdoutMape: number; captured: number }[];
		capturedMedian: number;
		capturedMin: number;
		atLeast90: number;
		holdoutMapeMax: number;
	};
};

export const DATA = raw as unknown as DemoData;

/** Channels sorted by marginal ROI, highest first. */
export const BY_MROI = [...DATA.channels].sort((a, b) => b.mroi - a.mroi);

export const CHANNEL_COLOR: Record<string, string> = {
	search: "var(--cyan)",
	tv: "var(--color-accent)",
	social: "var(--color-fg)",
};

export const fmt = (n: number, digits = 0) =>
	n.toLocaleString("en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits });
