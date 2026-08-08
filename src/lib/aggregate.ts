import type { DailyResult, DailyScore, Game, ScoreEntry } from "@/types";

/**
 * Rolls raw, message-level score entries up into one score per player per
 * day, for a single game. When a player posts more than one score on the
 * same day (e.g. in multiple threads), the lowest score wins — the rest are
 * treated as extra chatter, not a new official score.
 */
export function aggregateDailyResults(entries: ScoreEntry[], game: Game): DailyResult[] {
  const byDay = new Map<string, Map<string, ScoreEntry>>();
  for (const entry of entries) {
    if (entry.game !== game) continue;
    const date = entry.timestamp.slice(0, 10);
    if (!byDay.has(date)) byDay.set(date, new Map());
    const entriesByPlayer = byDay.get(date)!;
    const existing = entriesByPlayer.get(entry.playerId);
    if (existing === undefined || entry.score < existing.score) {
      entriesByPlayer.set(entry.playerId, entry);
    }
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, entriesByPlayer]) => ({
      date,
      scores: [...entriesByPlayer.values()].map(
        (entry): DailyScore => ({
          playerId: entry.playerId,
          score: entry.score,
          timeSeconds: entry.timeSeconds,
          timeToSpareSeconds: entry.timeToSpareSeconds,
        }),
      ),
    }));
}
