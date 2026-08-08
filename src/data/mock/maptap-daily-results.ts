import type { DailyResult } from "@/types";
import { mockPlayers } from "./players";
import { generateDailyResults, type SkillProfile } from "./generate";

const skillProfile: Record<string, SkillProfile> = {
  nathan: { mean: 760, spread: 150, playRate: 0.9 },
  jake: { mean: 680, spread: 190, playRate: 0.8 },
  sam: { mean: 840, spread: 100, playRate: 0.7 },
  priya: { mean: 730, spread: 140, playRate: 0.85 },
  alex: { mean: 610, spread: 210, playRate: 0.65 },
  maddie: { mean: 700, spread: 170, playRate: 0.75 },
};

export const mockMapTapDailyResults: DailyResult[] = generateDailyResults(mockPlayers, skillProfile, {
  seed: 20260807,
});
