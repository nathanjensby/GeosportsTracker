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
