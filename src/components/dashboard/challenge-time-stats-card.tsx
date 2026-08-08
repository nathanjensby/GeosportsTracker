import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getInitials } from "@/lib/players";
import type { ChallengeTimeHighlight, ChallengeTimeStats, Player } from "@/types";
import { Timer } from "lucide-react";

interface ChallengeTimeStatsCardProps {
  timeStats: ChallengeTimeStats;
  players: Player[];
}

function formatSeconds(seconds: number): string {
  return `${seconds.toFixed(1)}s`;
}

function HighlightRow({
  highlight,
  players,
  suffix,
}: Readonly<{ highlight: ChallengeTimeHighlight; players: Player[]; suffix: string }>) {
  const player = players.find((p) => p.id === highlight.playerId);
  return (
    <div className="flex items-center gap-2.5">
      <Avatar className="size-8 shrink-0">
        <AvatarFallback className="text-xs">{getInitials(player?.name ?? "?")}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium">{player?.name ?? "Unknown"}</p>
        <p className="text-xs text-muted-foreground">{suffix}</p>
      </div>
    </div>
  );
}

export function ChallengeTimeStatsCard({ timeStats, players }: Readonly<ChallengeTimeStatsCardProps>) {
  const { fastestTime, mostTimeToSpare, averageTimeSeconds } = timeStats;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="size-5 text-primary" />
          Time Stats
        </CardTitle>
        <CardDescription>
          {averageTimeSeconds !== null
            ? `Average completion time: ${formatSeconds(averageTimeSeconds)}`
            : "No timed runs logged yet."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {fastestTime ? (
          <HighlightRow
            highlight={fastestTime}
            players={players}
            suffix={`Fastest run — ${formatSeconds(fastestTime.timeSeconds)}`}
          />
        ) : null}
        {mostTimeToSpare ? (
          <HighlightRow
            highlight={mostTimeToSpare}
            players={players}
            suffix={`Biggest cushion — ${formatSeconds(mostTimeToSpare.timeToSpareSeconds)} to spare`}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
