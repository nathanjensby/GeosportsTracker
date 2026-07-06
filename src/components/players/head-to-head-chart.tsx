"use client";

import type { HeadToHeadMatchup } from "@/types";
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

interface HeadToHeadChartProps {
  matchups: HeadToHeadMatchup[];
  playerAName: string;
  playerBName: string;
  playerAColor: string;
  playerBColor: string;
}

function formatShortDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString(undefined, {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  });
}

interface TooltipPayloadEntry {
  dataKey: string;
  value: number;
  color: string;
  name: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="mb-1.5 font-medium">{label}</p>
      <div className="flex flex-col gap-1">
        {[...payload]
          .sort((a, b) => b.value - a.value)
          .map((entry) => (
            <div key={entry.dataKey} className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">{entry.name}</span>
              <span className="ml-auto tabular-nums font-medium">{entry.value}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

export function HeadToHeadChart({
  matchups,
  playerAName,
  playerBName,
  playerAColor,
  playerBColor,
}: Readonly<HeadToHeadChartProps>) {
  const chartData = matchups.map((matchup) => ({
    dateLabel: formatShortDate(matchup.date),
    [playerAName]: matchup.playerAScore,
    [playerBName]: matchup.playerBScore,
  }));

  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--color-border)" }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 1000]}
            ticks={[0, 250, 500, 750, 1000]}
            tickFormatter={(value: number) => value.toLocaleString()}
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Line
            type="monotone"
            dataKey={playerAName}
            stroke={playerAColor}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-card)" }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey={playerBName}
            stroke={playerBColor}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-card)" }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
