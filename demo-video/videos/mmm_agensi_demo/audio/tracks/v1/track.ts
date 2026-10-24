import type { AudioTrack } from "videowright";
import { perSegment } from "../../originals/voiceovers/v1/timing";

const track: AudioTrack = {
	audio_file: "./audio/tracks/v1/track.mp3",
	length_s: 71.472000,
	timing: { perSegment },
	audio_plan_path: "../../audio_plan.md",
	plan_snapshot_path: "./plan_snapshot.md",
	notes: "VO only, loudness-normalised to -16 LUFS.",
};

export default track;
