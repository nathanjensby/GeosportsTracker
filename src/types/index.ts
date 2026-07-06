/**
 * Core domain types for GeoSports Tracker.
 *
 * These shapes are intentionally decoupled from any one data source. Mock data,
 * a Google Sheet, or a future database all get normalized into these types by
 * a `DataSource` implementation (see `src/data/source.ts`) — nothing above the
 * data layer should know or care where the data actually came from.
 */

/** A member of the friend group who submits GeoSports scores. */
export interface Player {
  id: string;
  name: string;
  /** Optional avatar image; falls back to initials in the UI when absent. */
  avatarUrl?: string;
}

/**
 * A single raw score submission, as it comes off the source of truth (an
 * iMessage thread synced into a Google Sheet "RawData" tab today). Score is
 * out of 1,000 — higher is better.
 */
export interface ScoreEntry {
  id: string;
  playerId: string;
  /** ISO 8601 timestamp of when the score was posted. */
  timestamp: string;
  score: number;
  /** The original raw message text, kept for debugging/audit purposes. */
  rawMessage?: string;
}

/** One player's result for a single day's game. */
export interface DailyScore {
  playerId: string;
  score: number;
}

/** A full day of GeoSports results across every player who played. */
export interface DailyResult {
  /** ISO date string, e.g. "2026-07-02". */
  date: string;
  scores: DailyScore[];
}

/** Rolled-up, all-time stats for a single player — the leaderboard row shape. */
export interface PlayerStats {
  playerId: string;
  gamesPlayed: number;
  averageScore: number;
  /** Average daily rank across all games played (1 = first place). Lower is better. */
  averageFinish: number;
  /** Number of days this player had the top score. */
  wins: number;
  /** Number of days this player had the lowest score — the "Stupids" count. */
  stupids: number;
  bestScore: number;
  worstScore: number;
  /** Consecutive most-recent days played, ending today or the latest game day. */
  currentStreak: number;
  /** Longest streak of consecutive days played, all-time. */
  bestStreak: number;
  /** Consecutive most-recent days this player had the top score, ending today or the latest game day. */
  currentWinStreak: number;
  /** Consecutive most-recent days this player had the lowest score, ending today or the latest game day. */
  currentLossStreak: number;
  /** Days since this player last had the top score, relative to the latest game day. Null if they've never won. */
  daysSinceLastWin: number | null;
  /** Days since this player last had the lowest score, relative to the latest game day. Null if they've never been a Stupid. */
  daysSinceLastStupid: number | null;
}

/** Which way a player's leaderboard position moved since the previous day's ranking. */
export type RankChange = "up" | "down";

/** One player's computed standing within a single day's game. */
export interface DailyPlayerStat {
  playerId: string;
  score: number;
  /** 1-indexed rank for the day; tied scores share a rank (e.g. 1, 1, 3). */
  rank: number;
  /** Number of players who posted a score this day — the same for every row on a given day. */
  gamesPlayedThatDay: number;
  /** Whether this player had the day's top score. */
  winner: boolean;
  /** Whether this player had the day's lowest score — the day's "Stupid." */
  stupid: boolean;
  /** Points behind the day's top score. 0 for the winner(s). */
  marginToFirst: number;
  /** Points ahead of the day's lowest score. 0 for the Stupid(s). */
  marginToLast: number;
}

/** One shared game day between two players being compared head-to-head. */
export interface HeadToHeadMatchup {
  date: string;
  playerAScore: number;
  playerBScore: number;
  /** Null on a tied score. */
  winnerId: string | null;
}

/** One player's side of a head-to-head comparison, computed over shared games only. */
export interface HeadToHeadPlayerLine {
  playerId: string;
  /** Days this player's score beat the opponent's. */
  gamesAhead: number;
  /** gamesAhead as a percentage of shared games played (0-100). */
  winPct: number;
  averageScore: number;
  averageFinish: number;
  highestScore: number;
  lowestScore: number;
  /** Days this player had the day's overall lowest score, among shared games. */
  stupids: number;
  /** Longest run of consecutive shared games this player finished ahead of the opponent. */
  longestWinStreak: number;
  /** Average points ahead of the opponent on days this player finished ahead. */
  averageMarginOfVictory: number;
}

/** A full pairwise comparison between two players, restricted to games both played. */
export interface HeadToHeadStats {
  playerAId: string;
  playerBId: string;
  /** Number of days both players posted a score. */
  gamesPlayed: number;
  /** Shared games where both players tied. */
  ties: number;
  /** [playerA's line, playerB's line]. */
  lines: [HeadToHeadPlayerLine, HeadToHeadPlayerLine];
  biggestVictory: {
    winnerId: string;
    loserId: string;
    margin: number;
    date: string;
    winnerScore: number;
    loserScore: number;
  } | null;
  closestFinish: {
    date: string;
    margin: number;
    playerAScore: number;
    playerBScore: number;
  } | null;
  /** The active run of consecutive wins as of the latest shared game. Null if it ended in a tie or there are no shared games. */
  currentStreak: { playerId: string; length: number } | null;
  /** All shared games, ascending by date. */
  matchups: HeadToHeadMatchup[];
  /** Most recent shared games, descending by date, capped for display. */
  recentMatchups: HeadToHeadMatchup[];
}

/** Dashboard-wide summary numbers shown in the stats row up top. */
export interface SummaryStats {
  totalGamesLogged: number;
  totalPlayers: number;
  allTimeAverageScore: number;
  topPlayer: PlayerStats | null;
  latestDay: DailyResult | null;
}

/**
 * The one interface the rest of the app depends on for data. Swapping the
 * source (mock -> Google Sheets -> anything else) means writing a new
 * `DataSource` implementation, not touching any component or page.
 */
export interface DataSource {
  getPlayers(): Promise<Player[]>;
  getDailyResults(): Promise<DailyResult[]>;
}
