import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getInitials } from "@/lib/players";
import { rankPlayers } from "@/lib/stats";
import type { Player, PlayerStats } from "@/types";
import { Flame, Trophy } from "lucide-react";

const RANK_MEDAL = ["🥇", "🥈", "🥉"];

interface LeaderboardCardProps {
  players: Player[];
  playerStats: PlayerStats[];
}

export function LeaderboardCard({ players, playerStats }: LeaderboardCardProps) {
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
              <TableHead className="text-right">Stupids</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranked.map((stats, index) => {
              const player = playerMap[stats.playerId];
              if (!player) return null;

              return (
                <TableRow key={stats.playerId}>
                  <TableCell className="font-medium text-muted-foreground">
                    {RANK_MEDAL[index] ?? index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8">
                        <AvatarFallback className="text-xs">{getInitials(player.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{player.name}</span>
                        {stats.currentStreak >= 3 ? (
                          <Badge variant="secondary" className="gap-1 px-1.5 text-amber-600">
                            <Flame className="size-3" />
                            {stats.currentStreak}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{stats.averageScore}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{stats.wins}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
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
