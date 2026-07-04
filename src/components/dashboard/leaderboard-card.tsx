"use client";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getInitials } from "@/lib/players";
import { rankPlayers } from "@/lib/stats";
import type { Player, PlayerStats, RankChange } from "@/types";
import { Flame, Trophy, Triangle } from "lucide-react";

const RANK_MEDAL = ["🥇", "🥈", "🥉"];

/** Green triangle for a leaderboard climb, red for a drop, since the previous game day. */
function RankChangeIndicator({ change }: Readonly<{ change?: RankChange }>) {
  if (change === "up") {
    return (
      <Triangle
        className="size-2.5 shrink-0 fill-green-600 text-green-600"
        aria-label="Moved up the leaderboard"
      />
    );
  }
  if (change === "down") {
    return (
      <Triangle
        className="size-2.5 shrink-0 rotate-180 fill-red-600 text-red-600"
        aria-label="Moved down the leaderboard"
      />
    );
  }
  return null;
}

/** Fire for a 3+ day win streak, poop for a 3+ day losing streak — mutually exclusive. */
function StreakIndicator({ stats }: Readonly<{ stats: PlayerStats }>) {
  if (stats.currentWinStreak >= 3) {
    return (
      <Flame
        className="size-4 shrink-0 text-amber-600"
        aria-label={`On a ${stats.currentWinStreak}-day win streak`}
      />
    );
  }
  if (stats.currentLossStreak >= 3) {
    return (
      <span className="shrink-0" role="img" aria-label={`On a ${stats.currentLossStreak}-day losing streak`}>
        💩
      </span>
    );
  }
  return null;
}

interface LeaderboardCardProps {
  players: Player[];
  playerStats: PlayerStats[];
  rankChanges: Map<string, RankChange>;
}

export function LeaderboardCard({ players, playerStats, rankChanges }: Readonly<LeaderboardCardProps>) {
  const router = useRouter();
  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));
  const ranked = rankPlayers(playerStats).filter((s) => s.gamesPlayed > 0);

  return (
    <Card id="leaderboard" className="scroll-mt-20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="size-5 text-amber-500" />
          Leaderboard
        </CardTitle>
        <CardDescription>Ranked by wins, all-time</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">Avg</TableHead>
              <TableHead className="text-right">Wins</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Stupids</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranked.map((stats, index) => {
              const player = playerMap[stats.playerId];
              if (!player) return null;

              return (
                <TableRow
                  key={stats.playerId}
                  tabIndex={0}
                  role="link"
                  aria-label={`View ${player.name}'s stats`}
                  className="cursor-pointer"
                  onClick={() => router.push(`/players/${stats.playerId}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(`/players/${stats.playerId}`);
                    }
                  }}
                >
                  <TableCell className="font-medium text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {RANK_MEDAL[index] ?? index + 1}
                      <RankChangeIndicator change={rankChanges.get(stats.playerId)} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
                      <Avatar className="size-7 shrink-0 sm:size-8">
                        <AvatarFallback className="text-xs">{getInitials(player.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="max-w-28 truncate font-medium sm:max-w-none">{player.name}</span>
                        <StreakIndicator stats={stats} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{stats.averageScore}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{stats.wins}</TableCell>
                  <TableCell className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">
                    {stats.stupids}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
