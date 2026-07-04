import type { Player } from "@/types";

/** Fixed categorical order — matches the CSS chart-1..6 custom properties. */
const CHART_COLOR_VARS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
];

/**
 * Assigns each player a stable color by their position in the roster, not by
 * any ranking — so a player's color never changes when the leaderboard reorders.
 */
export function buildPlayerColorMap(players: Player[]): Record<string, string> {
  const map: Record<string, string> = {};
  players.forEach((player, index) => {
    map[player.id] = CHART_COLOR_VARS[index % CHART_COLOR_VARS.length];
  });
  return map;
}

export function buildPlayerMap(players: Player[]): Record<string, Player> {
  return Object.fromEntries(players.map((player) => [player.id, player]));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
