import type { DailyResult, DailyScore, Player } from "@/types";

/** Deterministic PRNG so mock data looks the same on every load/build. */
export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Each player's rough skill band so a mock leaderboard has real texture. */
export interface SkillProfile {
  mean: number;
  spread: number;
  playRate: number;
}

interface GenerateOptions {
  seed: number;
  days?: number;
  scoreMax?: number;
  /** When set, also synthesizes a completion time and time-to-spare (seconds) against this budget — for Challenge-style games. */
  timeLimitSeconds?: number;
}

/** Shared fixture generator for GeoSports-shaped mock data (a bounded score per player per day). */
export function generateDailyResults(
  players: Player[],
  skillProfiles: Record<string, SkillProfile>,
  { seed, days = 30, scoreMax = 1000, timeLimitSeconds }: GenerateOptions,
): DailyResult[] {
  const rand = mulberry32(seed);

  function randomScore(mean: number, spread: number): number {
    // Simple bounded gaussian-ish spread via averaged uniforms, clamped to a valid score.
    const noise = (rand() + rand() + rand() - 1.5) / 1.5;
    return Math.max(0, Math.min(scoreMax, Math.round(mean + noise * spread)));
  }

  function buildScore(player: Player): DailyScore {
    const { mean, spread } = skillProfiles[player.id];
    const score = randomScore(mean, spread);
    if (timeLimitSeconds === undefined) return { playerId: player.id, score };

    const timeSeconds = Math.round(timeLimitSeconds * (0.4 + rand() * 0.5) * 10) / 10;
    const timeToSpareSeconds = Math.round((timeLimitSeconds - timeSeconds) * 10) / 10;
    return { playerId: player.id, score, timeSeconds, timeToSpareSeconds };
  }

  const results: DailyResult[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);

    const scores = players.filter((player) => rand() < skillProfiles[player.id].playRate).map(buildScore);

    // Keep the most recent few days full so the "today" card always looks lively.
    if (i < 2 && scores.length < players.length) {
      for (const player of players) {
        if (!scores.some((s) => s.playerId === player.id)) {
          scores.push(buildScore(player));
        }
      }
    }

    if (scores.length > 0) results.push({ date: dateStr, scores });
  }

  return results;
}
