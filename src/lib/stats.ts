import type {
  DailyPlayerStat,
  DailyResult,
  HeadToHeadMatchup,
  HeadToHeadPlayerLine,
  HeadToHeadStats,
  Player,
  PlayerStats,
  RankChange,
  SummaryStats,
} from "@/types";

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

/** Each player's rank, margins, and winner/Stupid flags for a single day's game. */
export function computeDailyPlayerStats(day: DailyResult): DailyPlayerStat[] {
  const gamesPlayedThatDay = day.scores.length;
  if (gamesPlayedThatDay === 0) return [];

  const winnerIds = new Set(getDailyWinnerIds(day));
  const stupidIds = new Set(getDailyStupidIds(day));
  const firstScore = Math.max(...day.scores.map((s) => s.score));
  const lastScore = Math.min(...day.scores.map((s) => s.score));

  const sortedDesc = [...day.scores].sort((a, b) => b.score - a.score);
  const rankByScore = new Map<number, number>();
  sortedDesc.forEach((entry, index) => {
    if (!rankByScore.has(entry.score)) rankByScore.set(entry.score, index + 1);
  });

  return sortedDesc.map((entry) => ({
    playerId: entry.playerId,
    score: entry.score,
    rank: rankByScore.get(entry.score)!,
    gamesPlayedThatDay,
    winner: winnerIds.has(entry.playerId),
    stupid: stupidIds.has(entry.playerId),
    marginToFirst: firstScore - entry.score,
    marginToLast: entry.score - lastScore,
  }));
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
      totalRank: number;
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
      totalRank: 0,
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
    for (const dayStat of computeDailyPlayerStats(day)) {
      const t = totals.get(dayStat.playerId);
      if (!t) continue;

      t.gamesPlayed++;
      t.totalScore += dayStat.score;
      t.totalRank += dayStat.rank;
      t.bestScore = Math.max(t.bestScore, dayStat.score);
      t.worstScore = Math.min(t.worstScore, dayStat.score);
      t.playedDates.push(day.date);
      if (dayStat.winner) {
        t.wins++;
        t.winDates.add(day.date);
        t.lastWinDate = day.date;
      }
      if (dayStat.stupid) {
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
      averageFinish: t.gamesPlayed > 0 ? Math.round((t.totalRank / t.gamesPlayed) * 10) / 10 : 0,
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

/** Number of days both players posted a score — cheap enough to rank candidate opponents by. */
export function countSharedGames(dailyResults: DailyResult[], playerAId: string, playerBId: string): number {
  return dailyResults.filter((day) => {
    const ids = new Set(day.scores.map((s) => s.playerId));
    return ids.has(playerAId) && ids.has(playerBId);
  }).length;
}

/** Among the given candidates, the one with the most shared game days against `playerId` — the closest thing to a rival. */
export function pickDefaultOpponentId(
  playerId: string,
  candidates: Player[],
  dailyResults: DailyResult[],
): string | null {
  const others = candidates.filter((p) => p.id !== playerId);
  if (others.length === 0) return null;

  let best = others[0];
  let bestSharedGames = countSharedGames(dailyResults, playerId, best.id);
  for (const candidate of others.slice(1)) {
    const sharedGames = countSharedGames(dailyResults, playerId, candidate.id);
    if (sharedGames > bestSharedGames) {
      best = candidate;
      bestSharedGames = sharedGames;
    }
  }
  return best.id;
}

function determineMatchupWinnerId(
  playerAId: string,
  playerBId: string,
  playerAScore: number,
  playerBScore: number,
): string | null {
  if (playerAScore === playerBScore) return null;
  return playerAScore > playerBScore ? playerAId : playerBId;
}

interface HeadToHeadScoreTotals {
  totalScore: number;
  totalFinish: number;
  highestScore: number;
  lowestScore: number;
  stupids: number;
}

function accumulateScoreTotals(totals: HeadToHeadScoreTotals, entry: DailyPlayerStat): void {
  totals.totalScore += entry.score;
  totals.totalFinish += entry.rank;
  totals.highestScore = Math.max(totals.highestScore, entry.score);
  totals.lowestScore = Math.min(totals.lowestScore, entry.score);
  if (entry.stupid) totals.stupids++;
}

interface HeadToHeadVictoryTotals {
  gamesAhead: number;
  totalMargin: number;
}

function findClosestFinish(matchups: HeadToHeadMatchup[]): HeadToHeadStats["closestFinish"] {
  let closestFinish: HeadToHeadStats["closestFinish"] = null;
  for (const matchup of matchups) {
    const margin = Math.abs(matchup.playerAScore - matchup.playerBScore);
    if (!closestFinish || margin < closestFinish.margin) {
      closestFinish = {
        date: matchup.date,
        margin,
        playerAScore: matchup.playerAScore,
        playerBScore: matchup.playerBScore,
      };
    }
  }
  return closestFinish;
}

function findBiggestVictory(
  matchups: HeadToHeadMatchup[],
  playerAId: string,
  playerBId: string,
): HeadToHeadStats["biggestVictory"] {
  let biggestVictory: HeadToHeadStats["biggestVictory"] = null;
  for (const matchup of matchups) {
    if (matchup.winnerId === null) continue;

    const margin = Math.abs(matchup.playerAScore - matchup.playerBScore);
    if (biggestVictory && margin <= biggestVictory.margin) continue;

    const winnerId = matchup.winnerId;
    const winnerIsA = winnerId === playerAId;
    biggestVictory = {
      winnerId,
      loserId: winnerIsA ? playerBId : playerAId,
      margin,
      date: matchup.date,
      winnerScore: winnerIsA ? matchup.playerAScore : matchup.playerBScore,
      loserScore: winnerIsA ? matchup.playerBScore : matchup.playerAScore,
    };
  }
  return biggestVictory;
}

/** Per-player count of shared games where their score was ahead, plus the summed margin on those days. */
function computeVictoryTotals(
  matchups: HeadToHeadMatchup[],
  playerAId: string,
  playerBId: string,
): { totals: Map<string, HeadToHeadVictoryTotals>; ties: number } {
  const totals = new Map<string, HeadToHeadVictoryTotals>([
    [playerAId, { gamesAhead: 0, totalMargin: 0 }],
    [playerBId, { gamesAhead: 0, totalMargin: 0 }],
  ]);

  let ties = 0;
  for (const matchup of matchups) {
    if (matchup.winnerId === null) {
      ties++;
      continue;
    }
    const winnerTotals = totals.get(matchup.winnerId)!;
    winnerTotals.gamesAhead++;
    winnerTotals.totalMargin += Math.abs(matchup.playerAScore - matchup.playerBScore);
  }

  return { totals, ties };
}

/** Longest-ever streak per player, plus the streak still active as of the latest shared game (null once it's broken by a tie). */
function computeHeadToHeadStreaks(
  matchups: HeadToHeadMatchup[],
  playerAId: string,
  playerBId: string,
): { bestStreak: Map<string, number>; currentStreak: HeadToHeadStats["currentStreak"] } {
  const bestStreak = new Map<string, number>([
    [playerAId, 0],
    [playerBId, 0],
  ]);

  let runStreakPlayer: string | null = null;
  let runStreakLength = 0;

  for (const matchup of matchups) {
    if (matchup.winnerId === null) {
      runStreakPlayer = null;
      runStreakLength = 0;
      continue;
    }
    runStreakLength = runStreakPlayer === matchup.winnerId ? runStreakLength + 1 : 1;
    runStreakPlayer = matchup.winnerId;
    bestStreak.set(matchup.winnerId, Math.max(bestStreak.get(matchup.winnerId)!, runStreakLength));
  }

  const currentStreak =
    runStreakPlayer !== null && runStreakLength > 0 ? { playerId: runStreakPlayer, length: runStreakLength } : null;

  return { bestStreak, currentStreak };
}

/**
 * Pairwise comparison between two players, restricted to days both posted a
 * score. Reuses `computeDailyPlayerStats` for rank/winner/Stupid so this
 * never drifts from the main leaderboard's definitions of those terms.
 */
export function computeHeadToHead(
  dailyResults: DailyResult[],
  playerAId: string,
  playerBId: string,
): HeadToHeadStats {
  const sortedDays = sortByDateAsc(dailyResults);

  const matchups: HeadToHeadMatchup[] = [];
  const scoreTotals = new Map<string, HeadToHeadScoreTotals>([
    [playerAId, { totalScore: 0, totalFinish: 0, highestScore: -Infinity, lowestScore: Infinity, stupids: 0 }],
    [playerBId, { totalScore: 0, totalFinish: 0, highestScore: -Infinity, lowestScore: Infinity, stupids: 0 }],
  ]);

  for (const day of sortedDays) {
    const dayStatsByPlayer = new Map(computeDailyPlayerStats(day).map((s) => [s.playerId, s]));
    const a = dayStatsByPlayer.get(playerAId);
    const b = dayStatsByPlayer.get(playerBId);
    if (!a || !b) continue; // Only count days both players actually played.

    accumulateScoreTotals(scoreTotals.get(playerAId)!, a);
    accumulateScoreTotals(scoreTotals.get(playerBId)!, b);
    matchups.push({
      date: day.date,
      playerAScore: a.score,
      playerBScore: b.score,
      winnerId: determineMatchupWinnerId(playerAId, playerBId, a.score, b.score),
    });
  }

  const { totals: victoryTotals, ties } = computeVictoryTotals(matchups, playerAId, playerBId);
  const { bestStreak, currentStreak } = computeHeadToHeadStreaks(matchups, playerAId, playerBId);
  const biggestVictory = findBiggestVictory(matchups, playerAId, playerBId);
  const closestFinish = findClosestFinish(matchups);
  const gamesPlayed = matchups.length;

  function buildLine(playerId: string): HeadToHeadPlayerLine {
    const scores = scoreTotals.get(playerId)!;
    const victory = victoryTotals.get(playerId)!;
    return {
      playerId,
      gamesAhead: victory.gamesAhead,
      winPct: gamesPlayed > 0 ? Math.round((victory.gamesAhead / gamesPlayed) * 100) : 0,
      averageScore: gamesPlayed > 0 ? Math.round(scores.totalScore / gamesPlayed) : 0,
      averageFinish: gamesPlayed > 0 ? Math.round((scores.totalFinish / gamesPlayed) * 10) / 10 : 0,
      highestScore: gamesPlayed > 0 ? scores.highestScore : 0,
      lowestScore: gamesPlayed > 0 ? scores.lowestScore : 0,
      stupids: scores.stupids,
      longestWinStreak: bestStreak.get(playerId) ?? 0,
      averageMarginOfVictory: victory.gamesAhead > 0 ? Math.round(victory.totalMargin / victory.gamesAhead) : 0,
    };
  }

  return {
    playerAId,
    playerBId,
    gamesPlayed,
    ties,
    lines: [buildLine(playerAId), buildLine(playerBId)],
    biggestVictory,
    closestFinish,
    currentStreak,
    matchups,
    recentMatchups: [...matchups].reverse().slice(0, RECENT_HEAD_TO_HEAD_MATCHUPS),
  };
}

const RECENT_HEAD_TO_HEAD_MATCHUPS = 10;

function formatSummaryDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
  });
}

/** Turns a computed head-to-head into a few plain-English rivalry sentences. */
export function buildHeadToHeadSummary(stats: HeadToHeadStats, playerNames: Record<string, string>): string[] {
  if (stats.gamesPlayed === 0) return ["These two haven't played any shared games yet."];

  const nameA = playerNames[stats.playerAId] ?? "Player A";
  const nameB = playerNames[stats.playerBId] ?? "Player B";
  const summaries: string[] = [];

  const recentWindow = stats.recentMatchups;
  if (recentWindow.length >= 2) {
    const winsA = recentWindow.filter((m) => m.winnerId === stats.playerAId).length;
    const winsB = recentWindow.filter((m) => m.winnerId === stats.playerBId).length;
    if (winsA !== winsB) {
      const leaderName = winsA > winsB ? nameA : nameB;
      summaries.push(`${leaderName} has won ${Math.max(winsA, winsB)} of the last ${recentWindow.length} meetings.`);
    }
  }

  if (stats.currentStreak && stats.currentStreak.length >= 2) {
    const streakPlayerId = stats.currentStreak.playerId;
    const otherPlayerId = streakPlayerId === stats.playerAId ? stats.playerBId : stats.playerAId;
    const streakName = playerNames[streakPlayerId] ?? "?";
    const otherName = playerNames[otherPlayerId] ?? "?";
    const lastOtherWin = [...stats.matchups].reverse().find((m) => m.winnerId === otherPlayerId);
    summaries.push(
      lastOtherWin
        ? `${otherName} has not beaten ${streakName} since ${formatSummaryDate(lastOtherWin.date)}.`
        : `${otherName} has never beaten ${streakName}.`,
    );
  }

  const avgMargin = Math.round(
    stats.matchups.reduce((sum, m) => sum + Math.abs(m.playerAScore - m.playerBScore), 0) / stats.gamesPlayed,
  );
  summaries.push(`This rivalry has averaged only ${avgMargin} point${avgMargin === 1 ? "" : "s"} between players.`);

  return summaries;
}
