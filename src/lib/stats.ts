import type { DailyResult, Player, PlayerStats, RankChange, SummaryStats } from "@/types";

function sortByDateAsc(days: DailyResult[]): DailyResult[] {
  return [...days].sort((a, b) => a.date.localeCompare(b.date));
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((Date.parse(b) - Date.parse(a)) / msPerDay);
}

function computeStreaks(playedDatesAsc: string[], latestDate: string | null) {
  if (playedDatesAsc.length === 0) return { currentStreak: 0, bestStreak: 0 };

  let bestStreak = 1;
  let run = 1;
  for (let i = 1; i < playedDatesAsc.length; i++) {
    run = daysBetween(playedDatesAsc[i - 1], playedDatesAsc[i]) === 1 ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
  }

  let currentStreak = 1;
  for (let i = playedDatesAsc.length - 1; i > 0; i--) {
    if (daysBetween(playedDatesAsc[i - 1], playedDatesAsc[i]) === 1) {
      currentStreak++;
    } else {
      break;
    }
  }
  // A streak only counts as "current" if it's still running as of the latest logged day.
  if (playedDatesAsc[playedDatesAsc.length - 1] !== latestDate) {
    currentStreak = 0;
  }

  return { currentStreak, bestStreak };
}

/** Trailing streak of consecutive played days (by calendar date) that appear in `hitDates`. */
function computeResultStreak(
  playedDatesAsc: string[],
  hitDates: Set<string>,
  latestDate: string | null,
): number {
  if (playedDatesAsc.length === 0) return 0;
  if (playedDatesAsc[playedDatesAsc.length - 1] !== latestDate) return 0;

  let streak = 0;
  for (let i = playedDatesAsc.length - 1; i >= 0; i--) {
    if (!hitDates.has(playedDatesAsc[i])) break;
    if (streak > 0 && daysBetween(playedDatesAsc[i], playedDatesAsc[i + 1]) !== 1) break;
    streak++;
  }
  return streak;
}

/** The player(s) with the highest score for a given day — plural to cover ties. Empty on a solo day. */
export function getDailyWinnerIds(day: DailyResult): string[] {
  if (day.scores.length < 2) return [];
  const max = Math.max(...day.scores.map((s) => s.score));
  return day.scores.filter((s) => s.score === max).map((s) => s.playerId);
}

/** The player(s) with the lowest score for a given day — the day's "Stupid(s)." */
export function getDailyStupidIds(day: DailyResult): string[] {
  if (day.scores.length < 2) return [];
  const min = Math.min(...day.scores.map((s) => s.score));
  return day.scores.filter((s) => s.score === min).map((s) => s.playerId);
}

/** Rolls raw daily results up into one stats row per player. */
export function computePlayerStats(players: Player[], dailyResults: DailyResult[]): PlayerStats[] {
  const sortedDays = sortByDateAsc(dailyResults);
  const latestDate = sortedDays.at(-1)?.date ?? null;

  const totals = new Map<
    string,
    {
      gamesPlayed: number;
      totalScore: number;
      wins: number;
      stupids: number;
      bestScore: number;
      worstScore: number;
      playedDates: string[];
      winDates: Set<string>;
      stupidDates: Set<string>;
      lastWinDate: string | null;
      lastStupidDate: string | null;
    }
  >();
  for (const player of players) {
    totals.set(player.id, {
      gamesPlayed: 0,
      totalScore: 0,
      wins: 0,
      stupids: 0,
      bestScore: -Infinity,
      worstScore: Infinity,
      playedDates: [],
      winDates: new Set(),
      stupidDates: new Set(),
      lastWinDate: null,
      lastStupidDate: null,
    });
  }

  for (const day of sortedDays) {
    const winnerIds = new Set(getDailyWinnerIds(day));
    const stupidIds = new Set(getDailyStupidIds(day));

    for (const { playerId, score } of day.scores) {
      const t = totals.get(playerId);
      if (!t) continue;

      t.gamesPlayed++;
      t.totalScore += score;
      t.bestScore = Math.max(t.bestScore, score);
      t.worstScore = Math.min(t.worstScore, score);
      t.playedDates.push(day.date);
      if (winnerIds.has(playerId)) {
        t.wins++;
        t.winDates.add(day.date);
        t.lastWinDate = day.date;
      }
      if (stupidIds.has(playerId)) {
        t.stupids++;
        t.stupidDates.add(day.date);
        t.lastStupidDate = day.date;
      }
    }
  }

  return players.map((player) => {
    const t = totals.get(player.id)!;
    const { currentStreak, bestStreak } = computeStreaks(t.playedDates, latestDate);
    const currentWinStreak = computeResultStreak(t.playedDates, t.winDates, latestDate);
    const currentLossStreak = computeResultStreak(t.playedDates, t.stupidDates, latestDate);

    return {
      playerId: player.id,
      gamesPlayed: t.gamesPlayed,
      averageScore: t.gamesPlayed > 0 ? Math.round(t.totalScore / t.gamesPlayed) : 0,
      wins: t.wins,
      stupids: t.stupids,
      bestScore: t.gamesPlayed > 0 ? t.bestScore : 0,
      worstScore: t.gamesPlayed > 0 ? t.worstScore : 0,
      currentStreak,
      bestStreak,
      currentWinStreak,
      currentLossStreak,
      daysSinceLastWin:
        t.lastWinDate !== null && latestDate !== null ? daysBetween(t.lastWinDate, latestDate) : null,
      daysSinceLastStupid:
        t.lastStupidDate !== null && latestDate !== null ? daysBetween(t.lastStupidDate, latestDate) : null,
    };
  });
}

/**
 * The one leaderboard ranking used everywhere: most wins first, ties broken
 * by fewest Stupids, remaining ties broken by highest average score.
 */
export function rankPlayers(stats: PlayerStats[]): PlayerStats[] {
  return [...stats].sort(
    (a, b) => b.wins - a.wins || a.stupids - b.stupids || b.averageScore - a.averageScore,
  );
}

/**
 * Whether each player moved up or down the leaderboard between the previous
 * game day and the latest one. Players not ranked on both days (e.g. their
 * first day playing) get no entry — there's nothing to compare against.
 */
export function computeRankChanges(
  players: Player[],
  dailyResults: DailyResult[],
): Map<string, RankChange> {
  const sortedDays = sortByDateAsc(dailyResults);
  const latestDate = sortedDays.at(-1)?.date ?? null;
  if (latestDate === null) return new Map();

  const previousDays = sortedDays.filter((day) => day.date !== latestDate);
  const currentRanked = rankPlayers(computePlayerStats(players, dailyResults)).filter(
    (s) => s.gamesPlayed > 0,
  );
  const previousRanked = rankPlayers(computePlayerStats(players, previousDays)).filter(
    (s) => s.gamesPlayed > 0,
  );
  const previousRankByPlayer = new Map(previousRanked.map((s, index) => [s.playerId, index]));

  const changes = new Map<string, RankChange>();
  currentRanked.forEach((stats, index) => {
    const previousIndex = previousRankByPlayer.get(stats.playerId);
    if (previousIndex === undefined) return;
    if (index < previousIndex) changes.set(stats.playerId, "up");
    if (index > previousIndex) changes.set(stats.playerId, "down");
  });

  return changes;
}

/** Dashboard-wide numbers for the top stats row. */
export function computeSummaryStats(
  players: Player[],
  dailyResults: DailyResult[],
  playerStats: PlayerStats[],
): SummaryStats {
  const sortedDays = sortByDateAsc(dailyResults);
  const allScores = dailyResults.flatMap((day) => day.scores.map((s) => s.score));

  const topPlayer = rankPlayers(playerStats)[0] ?? null;

  return {
    totalGamesLogged: allScores.length,
    totalPlayers: players.length,
    allTimeAverageScore:
      allScores.length > 0 ? Math.round(allScores.reduce((sum, s) => sum + s, 0) / allScores.length) : 0,
    topPlayer: topPlayer && topPlayer.gamesPlayed > 0 ? topPlayer : null,
    latestDay: sortedDays.at(-1) ?? null,
  };
}
