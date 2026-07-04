import type { DailyResult, ScoreEntry } from "@/types";

/**
 * Rolls raw, message-level score entries up into one score per player per
 * day. When a player posts more than one score on the same day, the first
 * timestamp wins — later posts that day are treated as extra chatter, not
 * a new official score.
 */
export function aggregateDailyResults(entries: ScoreEntry[]): DailyResult[] {
  const sorted = [...entries].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const byDay = new Map<string, Map<string, number>>();
  for (const entry of sorted) {
    const date = entry.timestamp.slice(0, 10);
    if (!byDay.has(date)) byDay.set(date, new Map());
    const scoresByPlayer = byDay.get(date)!;
    if (!scoresByPlayer.has(entry.playerId)) {
      scoresByPlayer.set(entry.playerId, entry.score);
    }
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, scoresByPlayer]) => ({
      date,
      scores: [...scoresByPlayer.entries()].map(([playerId, score]) => ({ playerId, score })),
    }));
}
