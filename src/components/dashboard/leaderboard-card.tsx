"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInitials } from "@/lib/players";
import { LEADERBOARD_COLUMNS, LEADERBOARD_VIEWS, type LeaderboardViewId } from "@/lib/leaderboard-views";
import { sortByFields } from "@/lib/sort";
import { cn } from "@/lib/utils";
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
  monthlyPlayerStats: PlayerStats[];
  rankChanges: Map<string, RankChange>;
}

export function LeaderboardCard({
  players,
  playerStats,
  monthlyPlayerStats,
  rankChanges,
}: Readonly<LeaderboardCardProps>) {
  const router = useRouter();
  const [viewId, setViewId] = useState<LeaderboardViewId>("overall");
  const view = LEADERBOARD_VIEWS.find((v) => v.id === viewId) ?? LEADERBOARD_VIEWS[0];

  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));
  const sourceStats = view.scope === "this-month" ? monthlyPlayerStats : playerStats;
  const ranked = sortByFields(
    sourceStats.filter((s) => s.gamesPlayed > 0),
    view.sort,
  );
  // Rank-change arrows are computed off the all-time overall ranking, so only that view can show them meaningfully.
  const showRankChange = view.id === "overall";
  const lastColumnIndex = view.columns.length - 1;

  return (
    <Card id="leaderboard" className="scroll-mt-20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="size-5 text-amber-500" />
          Leaderboard
        </CardTitle>
        <CardDescription>{view.subtitle}</CardDescription>
        <Tabs
          value={viewId}
          onValueChange={(value) => setViewId(value as LeaderboardViewId)}
          className="mt-3 min-w-0"
        >
          <div className="relative">
            <div
              className={cn(
                "-mx-2 touch-pan-x overflow-x-auto overscroll-x-contain px-2 pb-1",
                "snap-x snap-mandatory scroll-px-2",
                "scrollbar-none [-ms-overflow-style:none]",
              )}
            >
              <TabsList className="w-max">
                {LEADERBOARD_VIEWS.map((v) => (
                  <TabsTrigger key={v.id} value={v.id} className="snap-start px-3">
                    {v.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {/* Fades the trailing edge so the strip reads as scrollable instead of just cut off on narrow screens. */}
            <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-linear-to-l from-card to-transparent sm:hidden" />
          </div>
        </Tabs>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Player</TableHead>
              {view.columns.map((key, index) => (
                <TableHead
                  key={key}
                  className={cn("text-right", index === lastColumnIndex && "hidden sm:table-cell")}
                >
                  {LEADERBOARD_COLUMNS[key].label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranked.length === 0 && (
              <TableRow>
                <TableCell colSpan={2 + view.columns.length} className="py-8 text-center text-muted-foreground">
                  No games logged for this view yet.
                </TableCell>
              </TableRow>
            )}
            {ranked.map((stats, index) => {
              const player = playerMap[stats.playerId];
              if (!player) return null;

              return (
                <TableRow
                  key={stats.playerId}
                  tabIndex={0}
                  role="link"
                  aria-label={`View ${player.name}'s stats`}
                  className="cursor-pointer transition-transform active:scale-[0.997]"
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
                      {showRankChange && <RankChangeIndicator change={rankChanges.get(stats.playerId)} />}
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
                  {view.columns.map((key, colIndex) => (
                    <TableCell
                      key={key}
                      className={cn(
                        "text-right tabular-nums",
                        colIndex === 0 && "font-medium",
                        colIndex === lastColumnIndex && "hidden text-muted-foreground sm:table-cell",
                      )}
                    >
                      {LEADERBOARD_COLUMNS[key].format(stats)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
