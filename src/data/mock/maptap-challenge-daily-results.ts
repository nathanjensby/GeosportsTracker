import type { DailyResult } from "@/types";
import { mockPlayers } from "./players";
import { generateDailyResults, type SkillProfile } from "./generate";

const skillProfile: Record<string, SkillProfile> = {
  nathan: { mean: 800, spread: 130, playRate: 0.75 },
  jake: { mean: 720, spread: 170, playRate: 0.6 },
  sam: { mean: 870, spread: 90, playRate: 0.55 },
  priya: { mean: 780, spread: 120, playRate: 0.7 },
  alex: { mean: 650, spread: 200, playRate: 0.5 },
  maddie: { mean: 740, spread: 150, playRate: 0.6 },
};

/** Challenge rounds run against a fixed time limit — completion time and time-to-spare are derived from it. */
const CHALLENGE_TIME_LIMIT_SECONDS = 25.5;

export const mockMapTapChallengeDailyResults: DailyResult[] = generateDailyResults(mockPlayers, skillProfile, {
  seed: 20260808,
  timeLimitSeconds: CHALLENGE_TIME_LIMIT_SECONDS,
});
