"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { buildPlayerMap, buildPlayerColorMap } from "@/lib/players";
import type { DailyResult, Player } from "@/types";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DAYS_SHOWN = 14;

interface ScoreTrendChartProps {
  dailyResults: DailyResult[];
  players: Player[];
}

function formatShortDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface TooltipPayloadEntry {
  dataKey: string;
  value: number;
  color: string;
}

function ChartTooltip({
  active,
  payload,
  label,
  playerMap,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  playerMap: Record<string, Player>;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="mb-1.5 font-medium">{label}</p>
      <div className="flex flex-col gap-1">
        {payload
          .filter((entry) => entry.value != null)
          .sort((a, b) => b.value - a.value)
          .map((entry) => (
            <div key={entry.dataKey} className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">{playerMap[entry.dataKey]?.name ?? entry.dataKey}</span>
              <span className="ml-auto tabular-nums font-medium">{entry.value}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

export function ScoreTrendChart({ dailyResults, players }: ScoreTrendChartProps) {
  const playerMap = buildPlayerMap(players);
  const colorMap = buildPlayerColorMap(players);

  const recentDays = [...dailyResults].sort((a, b) => a.date.localeCompare(b.date)).slice(-DAYS_SHOWN);

  const chartData = recentDays.map((day) => {
    const row: Record<string, string | number | null> = {
      date: day.date,
      dateLabel: formatShortDate(day.date),
    };
    for (const player of players) {
      const entry = day.scores.find((s) => s.playerId === player.id);
      row[player.id] = entry ? entry.score : null;
    }
    return row;
  });

  return (
    <Card id="trends" className="scroll-mt-20">
      <CardHeader>
        <CardTitle>Score Trends</CardTitle>
        <CardDescription>Last {recentDays.length} days played</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={{ stroke: "var(--color-border)" }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 1000]}
                ticks={[0, 250, 500, 750, 1000]}
                tickFormatter={(value: number) => value.toLocaleString()}
                tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip content={<ChartTooltip playerMap={playerMap} />} />
              <Legend
                wrapperStyle={{ fontSize: 13, paddingTop: 8 }}
                formatter={(value: string) => playerMap[value]?.name ?? value}
              />
              {players.map((player) => (
                <Line
                  key={player.id}
                  type="monotone"
                  dataKey={player.id}
                  stroke={colorMap[player.id]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-card)" }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
