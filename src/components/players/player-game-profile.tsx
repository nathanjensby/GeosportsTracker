import { StatTile } from "@/components/ui/stat-tile";
import { PlayerHeatmapCalendar } from "@/components/players/player-heatmap-calendar";
import { PlayerHeadToHeadCard } from "@/components/players/player-head-to-head-card";
import { computePlayerStats, rankPlayers } from "@/lib/stats";
import type { DailyResult, Player } from "@/types";
import {
  CalendarCheck,
  CalendarX2,
  Flame,
  Frown,
  Gamepad2,
  ListOrdered,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";

interface PlayerGameProfileProps {
  gameLabel: string;
  playerId: string;
  players: Player[];
  dailyResults: DailyResult[];
}

function formatDaysSince(days: number | null): string {
  if (days === null) return "—";
  if (days === 0) return "Today";
  return `${days} day${days === 1 ? "" : "s"}`;
}

export function PlayerGameProfile({ gameLabel, playerId, players, dailyResults }: Readonly<PlayerGameProfileProps>) {
  const playerStats = computePlayerStats(players, dailyResults);
  const stats = playerStats.find((s) => s.playerId === playerId);

  if (!stats) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">Hasn&apos;t played {gameLabel} yet.</p>
    );
  }

  const rank = rankPlayers(playerStats)
    .filter((s) => s.gamesPlayed > 0)
    .findIndex((s) => s.playerId === playerId);

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <p className="text-muted-foreground">
        {rank >= 0 ? `Rank #${rank + 1} on the ${gameLabel} leaderboard` : "Hasn't played yet"}
      </p>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          index={0}
          label="Games played"
          value={stats.gamesPlayed.toLocaleString()}
          icon={<Gamepad2 className="size-5" />}
        />
        <StatTile
          index={1}
          label="Average score"
          value={stats.averageScore.toLocaleString()}
          icon={<Target className="size-5" />}
        />
        <StatTile
          index={2}
          label="Average finish"
          value={stats.gamesPlayed > 0 ? stats.averageFinish.toFixed(1) : "—"}
          hint="daily rank, lower is better"
          icon={<ListOrdered className="size-5" />}
        />
        <StatTile
          index={3}
          label="Highest score"
          value={stats.gamesPlayed > 0 ? stats.bestScore.toLocaleString() : "—"}
          icon={<TrendingUp className="size-5" />}
        />
        <StatTile
          index={4}
          label="Lowest score"
          value={stats.gamesPlayed > 0 ? stats.worstScore.toLocaleString() : "—"}
          icon={<TrendingDown className="size-5" />}
        />
        <StatTile
          index={5}
          label="Win rate"
          value={`${stats.winPct}%`}
          hint={`${stats.wins} win${stats.wins === 1 ? "" : "s"}`}
          icon={<Trophy className="size-5 text-amber-500" />}
        />
        <StatTile
          index={6}
          label="Stupid rate"
          value={`${stats.stupidPct}%`}
          hint={`${stats.stupids} stupid${stats.stupids === 1 ? "" : "s"}`}
          icon={<Frown className="size-5" />}
        />
        <StatTile
          index={7}
          label="Current streak"
          value={`${stats.currentStreak} day${stats.currentStreak === 1 ? "" : "s"}`}
          icon={<Flame className="size-5 text-amber-600" />}
        />
        <StatTile
          index={8}
          label="Days since last win"
          value={formatDaysSince(stats.daysSinceLastWin)}
          hint={stats.daysSinceLastWin === null ? "No wins yet" : undefined}
          icon={<CalendarCheck className="size-5 text-amber-500" />}
        />
        <StatTile
          index={9}
          label="Days since last stupid"
          value={formatDaysSince(stats.daysSinceLastStupid)}
          hint={stats.daysSinceLastStupid === null ? "No stupids yet" : undefined}
          icon={<CalendarX2 className="size-5" />}
        />
      </div>

      <PlayerHeatmapCalendar playerId={playerId} dailyResults={dailyResults} />

      <PlayerHeadToHeadCard playerId={playerId} players={players} dailyResults={dailyResults} />
    </div>
  );
}
