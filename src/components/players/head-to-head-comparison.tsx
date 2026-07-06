import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getInitials } from "@/lib/players";
import { HeadToHeadChart } from "@/components/players/head-to-head-chart";
import type { HeadToHeadPlayerLine, HeadToHeadStats, Player } from "@/types";
import { Handshake, Swords } from "lucide-react";

interface HeadToHeadComparisonProps {
  playerA: Player;
  playerB: Player;
  colorA: string;
  colorB: string;
  stats: HeadToHeadStats;
  summaries: string[];
}

const METRIC_ROWS: { label: string; format: (line: HeadToHeadPlayerLine) => string }[] = [
  { label: "Average Score", format: (l) => l.averageScore.toLocaleString() },
  { label: "Average Finish", format: (l) => l.averageFinish.toFixed(1) },
  { label: "Highest Score", format: (l) => l.highestScore.toLocaleString() },
  { label: "Lowest Score", format: (l) => l.lowestScore.toLocaleString() },
  { label: "Wins", format: (l) => l.gamesAhead.toLocaleString() },
  { label: "Win %", format: (l) => `${l.winPct}%` },
  { label: "Stupids", format: (l) => l.stupids.toLocaleString() },
  { label: "Longest Streak", format: (l) => `${l.longestWinStreak} game${l.longestWinStreak === 1 ? "" : "s"}` },
  { label: "Avg Margin of Victory", format: (l) => l.averageMarginOfVictory.toLocaleString() },
];

function formatMatchupDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString(undefined, {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function HeadToHeadComparison({
  playerA,
  playerB,
  colorA,
  colorB,
  stats,
  summaries,
}: Readonly<HeadToHeadComparisonProps>) {
  if (stats.gamesPlayed === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {playerA.name} and {playerB.name} haven&apos;t both played the same day yet.
      </p>
    );
  }

  const [lineA, lineB] = stats.lines;
  const totalDecided = lineA.gamesAhead + lineB.gamesAhead;
  const playerAWinShare = totalDecided > 0 ? (lineA.gamesAhead / totalDecided) * 100 : 50;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3">
        <div className="flex w-full items-center justify-center gap-4 sm:gap-8">
          <div className="flex flex-1 flex-col items-center gap-1.5 sm:flex-row sm:justify-end">
            <Avatar className="size-9 sm:size-10">
              <AvatarFallback style={{ backgroundColor: colorA, color: "var(--color-card)" }}>
                {getInitials(playerA.name)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{playerA.name}</span>
          </div>
          <div className="flex shrink-0 items-baseline gap-2 text-2xl font-semibold tabular-nums">
            <span>{lineA.gamesAhead}</span>
            <span className="text-sm font-normal text-muted-foreground">–</span>
            <span>{lineB.gamesAhead}</span>
          </div>
          <div className="flex flex-1 flex-col items-center gap-1.5 sm:flex-row sm:justify-start">
            <span className="font-medium">{playerB.name}</span>
            <Avatar className="size-9 sm:size-10">
              <AvatarFallback style={{ backgroundColor: colorB, color: "var(--color-card)" }}>
                {getInitials(playerB.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        <div className="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full" style={{ width: `${playerAWinShare}%`, backgroundColor: colorA }} />
        </div>
        {stats.ties > 0 ? (
          <p className="text-xs text-muted-foreground">
            {stats.ties} tied game{stats.ties === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Metric</TableHead>
            <TableHead className="text-right">{playerA.name}</TableHead>
            <TableHead className="text-right">{playerB.name}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {METRIC_ROWS.map((row) => (
            <TableRow key={row.label}>
              <TableCell className="text-muted-foreground">{row.label}</TableCell>
              <TableCell className="text-right tabular-nums font-medium">{row.format(lineA)}</TableCell>
              <TableCell className="text-right tabular-nums font-medium">{row.format(lineB)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {stats.biggestVictory ? (
          <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
            <Swords className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <div className="min-w-0 text-sm">
              <p className="font-medium">Biggest victory</p>
              <p className="text-muted-foreground">
                {(stats.biggestVictory.winnerId === playerA.id ? playerA : playerB).name} won{" "}
                {stats.biggestVictory.winnerScore}–{stats.biggestVictory.loserScore} on{" "}
                {formatMatchupDate(stats.biggestVictory.date)} (+{stats.biggestVictory.margin})
              </p>
            </div>
          </div>
        ) : null}
        {stats.closestFinish ? (
          <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
            <Handshake className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 text-sm">
              <p className="font-medium">Closest finish</p>
              <p className="text-muted-foreground">
                {stats.closestFinish.playerAScore}–{stats.closestFinish.playerBScore} on{" "}
                {formatMatchupDate(stats.closestFinish.date)}
                {stats.closestFinish.margin === 0 ? " (tied)" : ` (${stats.closestFinish.margin} apart)`}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div>
        <h4 className="mb-2 text-sm font-medium">Scores over shared games</h4>
        <HeadToHeadChart
          matchups={stats.matchups}
          playerAName={playerA.name}
          playerBName={playerB.name}
          playerAColor={colorA}
          playerBColor={colorB}
        />
      </div>

      <div>
        <h4 className="mb-2 text-sm font-medium">Recent matchups</h4>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {stats.recentMatchups.map((matchup) => {
            const aFirst = matchup.playerAScore >= matchup.playerBScore;
            const rows = aFirst
              ? [
                  { player: playerA, score: matchup.playerAScore },
                  { player: playerB, score: matchup.playerBScore },
                ]
              : [
                  { player: playerB, score: matchup.playerBScore },
                  { player: playerA, score: matchup.playerAScore },
                ];
            const tied = matchup.winnerId === null;

            return (
              <div key={matchup.date} className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">{formatMatchupDate(matchup.date)}</p>
                <div className="mt-1 flex flex-col gap-0.5 text-sm">
                  {rows.map((row, index) => (
                    <div key={row.player.id} className="flex items-center gap-1.5">
                      <span>{tied ? "🤝" : index === 0 ? "🥇" : "🥈"}</span>
                      <span className={index === 0 && !tied ? "font-medium" : "text-muted-foreground"}>
                        {row.player.name}
                      </span>
                      <span className="ml-auto tabular-nums">{row.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg bg-muted/50 p-4">
        <h4 className="mb-2 text-sm font-medium">Rivalry Summary</h4>
        <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          {summaries.map((summary) => (
            <li key={summary}>{summary}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
