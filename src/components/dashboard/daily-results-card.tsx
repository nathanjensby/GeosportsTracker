import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getInitials } from "@/lib/players";
import { getDailyStupidIds, getDailyWinnerIds } from "@/lib/stats";
import type { DailyResult, Player } from "@/types";
import { Crown } from "lucide-react";

interface DailyResultsCardProps {
  day: DailyResult | null;
  players: Player[];
}

function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

export function DailyResultsCard({ day, players }: DailyResultsCardProps) {
  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));
  const winnerIds = new Set(day ? getDailyWinnerIds(day) : []);
  const stupidIds = new Set(day ? getDailyStupidIds(day) : []);

  return (
    <Card id="today" className="scroll-mt-20">
      <CardHeader>
        <CardTitle>Today&apos;s Results</CardTitle>
        <CardDescription>{day ? formatDate(day.date) : "No games logged yet"}</CardDescription>
      </CardHeader>
      <CardContent>
        {!day || day.scores.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nobody&apos;s posted a score yet today.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {[...day.scores]
              .sort((a, b) => b.score - a.score)
              .map((entry, index) => {
                const player = playerMap[entry.playerId];
                if (!player) return null;
                const isWinner = winnerIds.has(entry.playerId);
                const isStupid = stupidIds.has(entry.playerId);

                return (
                  <li
                    key={entry.playerId}
                    className="flex animate-in items-center justify-between gap-2 rounded-lg border border-transparent bg-muted/40 px-3 py-2 fade-in slide-in-from-left-2 duration-300 ease-out fill-mode-both transition-colors data-[highlight=true]:border-amber-300/60 data-[highlight=true]:bg-amber-50 dark:data-[highlight=true]:bg-amber-950/20"
                    style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
                    data-highlight={isWinner}
                  >
                    <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
                      <Avatar className="size-8 shrink-0">
                        <AvatarFallback className="text-xs">{getInitials(player.name)}</AvatarFallback>
                      </Avatar>
                      <span className="truncate font-medium">{player.name}</span>
                      {isWinner ? <Crown className="size-4 shrink-0 text-amber-500" /> : null}
                      {isStupid ? (
                        <Badge variant="outline" className="shrink-0 text-muted-foreground">
                          Stupid
                        </Badge>
                      ) : null}
                    </div>
                    <span className="shrink-0 tabular-nums font-semibold">{entry.score}</span>
                  </li>
                );
              })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
