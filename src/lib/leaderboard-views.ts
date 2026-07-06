import { OVERALL_SORT_FIELDS } from "@/lib/stats";
import type { SortField } from "@/lib/sort";
import type { PlayerStats } from "@/types";

/** Every stat the leaderboard knows how to show as a column. Add a key here to make it available to any view. */
export type LeaderboardColumnKey =
  | "averageScore"
  | "wins"
  | "stupids"
  | "gamesPlayed"
  | "winPct"
  | "stupidPct"
  | "scoreStdDev"
  | "bestScore"
  | "worstScore"
  | "totalScore"
  | "currentWinStreak"
  | "currentTop3Streak";

export interface LeaderboardColumnDef {
  label: string;
  format: (stats: PlayerStats) => string;
}

export const LEADERBOARD_COLUMNS: Record<LeaderboardColumnKey, LeaderboardColumnDef> = {
  averageScore: { label: "Avg", format: (s) => s.averageScore.toLocaleString() },
  wins: { label: "Wins", format: (s) => String(s.wins) },
  stupids: { label: "Stupids", format: (s) => String(s.stupids) },
  gamesPlayed: { label: "Games", format: (s) => String(s.gamesPlayed) },
  winPct: { label: "Win %", format: (s) => `${s.winPct}%` },
  stupidPct: { label: "Stupid %", format: (s) => `${s.stupidPct}%` },
  scoreStdDev: { label: "Std Dev", format: (s) => s.scoreStdDev.toFixed(1) },
  bestScore: { label: "Best", format: (s) => s.bestScore.toLocaleString() },
  worstScore: { label: "Worst", format: (s) => s.worstScore.toLocaleString() },
  totalScore: { label: "Total Pts", format: (s) => s.totalScore.toLocaleString() },
  currentWinStreak: { label: "Win Streak", format: (s) => `${s.currentWinStreak}d` },
  currentTop3Streak: { label: "Top-3 Streak", format: (s) => `${s.currentTop3Streak}d` },
};

export type LeaderboardViewId =
  | "overall"
  | "wins"
  | "stupids"
  | "consistency"
  | "scoring"
  | "hot-streak"
  | "this-month";

export interface LeaderboardView {
  id: LeaderboardViewId;
  label: string;
  /** Shown under the card title while this view is active. */
  subtitle: string;
  /** The 4 stat columns shown alongside the always-present Rank and Player columns. */
  columns: LeaderboardColumnKey[];
  sort: SortField<PlayerStats>[];
  /** Which computed stats this view reads from — all-time totals, or the current calendar month only. */
  scope: "all-time" | "this-month";
}

/** One entry per tab in the view switcher, in display order. Add a view here without touching the table component. */
export const LEADERBOARD_VIEWS: LeaderboardView[] = [
  {
    id: "overall",
    label: "Overall",
    subtitle: "Best all-around performers",
    columns: ["averageScore", "wins", "stupids", "gamesPlayed"],
    sort: OVERALL_SORT_FIELDS,
    scope: "all-time",
  },
  {
    id: "wins",
    label: "Wins",
    subtitle: "Who wins the most",
    columns: ["wins", "winPct", "gamesPlayed", "averageScore"],
    sort: [
      { key: "wins", direction: "desc" },
      { key: "winPct", direction: "desc" },
      { key: "averageScore", direction: "desc" },
    ],
    scope: "all-time",
  },
  {
    id: "stupids",
    label: "Stupids",
    subtitle: "Who earns the most stupids",
    columns: ["stupids", "stupidPct", "gamesPlayed", "averageScore"],
    sort: [
      { key: "stupids", direction: "desc" },
      { key: "stupidPct", direction: "desc" },
      { key: "averageScore", direction: "asc" },
    ],
    scope: "all-time",
  },
  {
    id: "consistency",
    label: "Consistency",
    subtitle: "Most consistent scores",
    columns: ["averageScore", "scoreStdDev", "bestScore", "worstScore"],
    sort: [
      { key: "scoreStdDev", direction: "asc" },
      { key: "averageScore", direction: "desc" },
    ],
    scope: "all-time",
  },
  {
    id: "scoring",
    label: "Scoring",
    subtitle: "Who racks up the most points",
    columns: ["totalScore", "averageScore", "bestScore", "gamesPlayed"],
    sort: [
      { key: "totalScore", direction: "desc" },
      { key: "averageScore", direction: "desc" },
    ],
    scope: "all-time",
  },
  {
    id: "hot-streak",
    label: "Hot Streak",
    subtitle: "Who's on a run right now",
    columns: ["currentWinStreak", "currentTop3Streak", "averageScore", "gamesPlayed"],
    sort: [
      { key: "currentWinStreak", direction: "desc" },
      { key: "averageScore", direction: "desc" },
    ],
    scope: "all-time",
  },
  {
    id: "this-month",
    label: "This Month",
    subtitle: "This month's leaders",
    columns: ["averageScore", "wins", "stupids", "gamesPlayed"],
    sort: OVERALL_SORT_FIELDS,
    scope: "this-month",
  },
];
