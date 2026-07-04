import type { DailyResult } from "@/types";
import { mockPlayers } from "./players";

/** Deterministic PRNG so mock data looks the same on every load/build. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260703);

/** Each player gets a rough skill band so the leaderboard has real texture. */
const skillProfile: Record<string, { mean: number; spread: number; playRate: number }> = {
  nathan: { mean: 780, spread: 140, playRate: 0.95 },
  jake: { mean: 700, spread: 180, playRate: 0.85 },
  sam: { mean: 820, spread: 110, playRate: 0.75 },
  priya: { mean: 750, spread: 130, playRate: 0.9 },
  alex: { mean: 620, spread: 200, playRate: 0.7 },
  maddie: { mean: 690, spread: 160, playRate: 0.8 },
};

function randomScore(mean: number, spread: number): number {
  // Simple bounded gaussian-ish spread via averaged uniforms, clamped to a valid 0-1000 score.
  const noise = (rand() + rand() + rand() - 1.5) / 1.5;
  const score = Math.round(mean + noise * spread);
  return Math.max(0, Math.min(1000, score));
}

const DAYS_OF_HISTORY = 30;

function generateDailyResults(): DailyResult[] {
  const results: DailyResult[] = [];
  const today = new Date();

  for (let i = DAYS_OF_HISTORY - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);

    const scores = mockPlayers
      .filter((player) => rand() < skillProfile[player.id].playRate)
      .map((player) => {
        const { mean, spread } = skillProfile[player.id];
        return { playerId: player.id, score: randomScore(mean, spread) };
      });

    // Keep the most recent few days full so the "today" card always looks lively.
    if (i < 2 && scores.length < mockPlayers.length) {
      for (const player of mockPlayers) {
        if (!scores.some((s) => s.playerId === player.id)) {
          const { mean, spread } = skillProfile[player.id];
          scores.push({ playerId: player.id, score: randomScore(mean, spread) });
        }
      }
    }

    if (scores.length > 0) {
      results.push({ date: dateStr, scores });
    }
  }

  return results;
}

export const mockDailyResults: DailyResult[] = generateDailyResults();
