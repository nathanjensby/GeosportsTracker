import { Card, CardContent } from "@/components/ui/card";
import type { Player, SummaryStats } from "@/types";
import { Gamepad2, Target, Trophy, Frown } from "lucide-react";

interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
}

function StatTile({ label, value, hint, icon }: StatTileProps) {
  return (
    <Card className="gap-0 py-4">
      <CardContent className="flex items-center gap-4 px-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="truncate text-2xl font-semibold">{value}</p>
          {hint ? <p className="truncate text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsSummaryRowProps {
  summary: SummaryStats;
  players: Player[];
}

export function StatsSummaryRow({ summary, players }: StatsSummaryRowProps) {
  const topPlayerName = summary.topPlayer
    ? players.find((p) => p.id === summary.topPlayer!.playerId)?.name
    : null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatTile
        label="Games logged"
        value={summary.totalGamesLogged.toLocaleString()}
        hint={`${summary.totalPlayers} players`}
        icon={<Gamepad2 className="size-5" />}
      />
      <StatTile
        label="Group average"
        value={summary.allTimeAverageScore.toLocaleString()}
        hint="out of 1,000"
        icon={<Target className="size-5" />}
      />
      <StatTile
        label="Reigning champ"
        value={topPlayerName ?? "—"}
        hint={summary.topPlayer ? `${summary.topPlayer.wins} wins` : "no games yet"}
        icon={<Trophy className="size-5 text-amber-500" />}
      />
      <StatTile
        label="Today's low bar"
        value={summary.latestDay ? String(Math.min(...summary.latestDay.scores.map((s) => s.score))) : "—"}
        hint="lowest score, on the board"
        icon={<Frown className="size-5" />}
      />
    </div>
  );
}
