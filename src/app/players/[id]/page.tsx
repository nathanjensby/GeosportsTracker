import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatTile } from "@/components/ui/stat-tile";
import { dataSource } from "@/data/source";
import { getInitials } from "@/lib/players";
import { computePlayerStats, rankPlayers } from "@/lib/stats";
import {
  ArrowLeft,
  CalendarCheck,
  CalendarX2,
  Flame,
  Frown,
  Gamepad2,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";

// Matches GoogleSheetsDataSource's own in-memory cache TTL. There's no
// generateStaticParams here, so player pages currently render fresh on first
// visit only by accident; this makes the revalidation window explicit.
export const revalidate = 30;

interface PlayerPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { id } = await params;

  const [players, dailyResults] = await Promise.all([
    dataSource.getPlayers(),
    dataSource.getDailyResults(),
  ]);

  const player = players.find((p) => p.id === id);
  if (!player) notFound();

  const playerStats = computePlayerStats(players, dailyResults);
  const stats = playerStats.find((s) => s.playerId === id);
  if (!stats) notFound();

  const rank = rankPlayers(playerStats)
    .filter((s) => s.gamesPlayed > 0)
    .findIndex((s) => s.playerId === id);

  const winPct = stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;
  const stupidPct = stats.gamesPlayed > 0 ? Math.round((stats.stupids / stats.gamesPlayed) * 100) : 0;

  const formatDaysSince = (days: number | null) => {
    if (days === null) return "—";
    if (days === 0) return "Today";
    return `${days} day${days === 1 ? "" : "s"}`;
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-10">
      <Link
        href="/#leaderboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to leaderboard
      </Link>

      <div className="flex items-center gap-4">
        <Avatar className="size-14">
          <AvatarFallback className="text-lg">{getInitials(player.name)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{player.name}</h1>
          <p className="text-muted-foreground">
            {rank >= 0 ? `Rank #${rank + 1} on the leaderboard` : "Hasn't played yet"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          label="Games played"
          value={stats.gamesPlayed.toLocaleString()}
          icon={<Gamepad2 className="size-5" />}
        />
        <StatTile
          label="Average score"
          value={stats.averageScore.toLocaleString()}
          hint="out of 1000"
          icon={<Target className="size-5" />}
        />
        <StatTile
          label="Highest score"
          value={stats.gamesPlayed > 0 ? stats.bestScore.toLocaleString() : "—"}
          icon={<TrendingUp className="size-5" />}
        />
        <StatTile
          label="Lowest score"
          value={stats.gamesPlayed > 0 ? stats.worstScore.toLocaleString() : "—"}
          icon={<TrendingDown className="size-5" />}
        />
        <StatTile
          label="Win rate"
          value={`${winPct}%`}
          hint={`${stats.wins} win${stats.wins === 1 ? "" : "s"}`}
          icon={<Trophy className="size-5 text-amber-500" />}
        />
        <StatTile
          label="Stupid rate"
          value={`${stupidPct}%`}
          hint={`${stats.stupids} stupid${stats.stupids === 1 ? "" : "s"}`}
          icon={<Frown className="size-5" />}
        />
        <StatTile
          label="Current streak"
          value={`${stats.currentStreak} day${stats.currentStreak === 1 ? "" : "s"}`}
          icon={<Flame className="size-5 text-amber-600" />}
        />
        <StatTile
          label="Days since last win"
          value={formatDaysSince(stats.daysSinceLastWin)}
          hint={stats.daysSinceLastWin === null ? "No wins yet" : undefined}
          icon={<CalendarCheck className="size-5 text-amber-500" />}
        />
        <StatTile
          label="Days since last stupid"
          value={formatDaysSince(stats.daysSinceLastStupid)}
          hint={stats.daysSinceLastStupid === null ? "No stupids yet" : undefined}
          icon={<CalendarX2 className="size-5" />}
        />
      </div>
    </div>
  );
}
