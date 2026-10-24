import "../../styles/motion-engineering/tokens.css";
import type { Timeline } from "videowright";
import defaultAudioTrack from "./audio/tracks/v1/track";

const timeline: Timeline = {
	meta: {
		title: "MMM Budget Optimizer · Agensi demo",
	},
	segments: [
		{ id: "mmm-title" },
		{ id: "mmm-pipeline", transition: "fade" },
		{ id: "mmm-fit", transition: "fade" },
		{ id: "mmm-curves", transition: "fade" },
		{ id: "mmm-plan", transition: "fade" },
		{ id: "mmm-proof", transition: "fade" },
		{ id: "mmm-cta", transition: "fade" },
	],
	default_audio_track: defaultAudioTrack,
};
export default timeline;
