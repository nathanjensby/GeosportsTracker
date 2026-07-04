"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { buildPlayerMap, buildPlayerColorMap, getInitials } from "@/lib/players";
import { cn } from "@/lib/utils";
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
const SELECTED_PLAYER_STORAGE_KEY = "geosports:selectedPlayerId";

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
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(SELECTED_PLAYER_STORAGE_KEY);
    if (stored && players.some((player) => player.id === stored)) {
      setSelectedPlayerId(stored);
    }
  }, [players]);

  function handleSelect(playerId: string | null) {
    setSelectedPlayerId(playerId);
    if (playerId) {
      window.localStorage.setItem(SELECTED_PLAYER_STORAGE_KEY, playerId);
    } else {
      window.localStorage.removeItem(SELECTED_PLAYER_STORAGE_KEY);
    }
  }

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

  // Draw the selected player's line last so it renders on top of the dimmed ones.
  const orderedPlayers =
    selectedPlayerId == null
      ? players
      : [
          ...players.filter((player) => player.id !== selectedPlayerId),
          ...players.filter((player) => player.id === selectedPlayerId),
        ];

  return (
    <Card id="trends" className="scroll-mt-20">
      <CardHeader>
        <CardTitle>Score Trends</CardTitle>
        <CardDescription>Last {recentDays.length} days played</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Highlight a player's trend line">
          <button
            type="button"
            onClick={() => handleSelect(null)}
            aria-pressed={selectedPlayerId === null}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              selectedPlayerId === null
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            All
          </button>
          {players.map((player) => (
            <button
              key={player.id}
              type="button"
              onClick={() => handleSelect(player.id)}
              aria-pressed={selectedPlayerId === player.id}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium transition-colors",
                selectedPlayerId === player.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Avatar className="size-4">
                <AvatarFallback
                  className="text-[9px]"
                  style={{ backgroundColor: colorMap[player.id], color: "var(--color-card)" }}
                >
                  {getInitials(player.name)}
                </AvatarFallback>
              </Avatar>
              {player.name}
            </button>
          ))}
        </div>
        <div className="h-64 w-full sm:h-80">
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
              <Tooltip content={<ChartTooltip playerMap={playerMap} />} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                formatter={(value: string) => playerMap[value]?.name ?? value}
              />
              {orderedPlayers.map((player) => {
                const isDimmed = selectedPlayerId != null && player.id !== selectedPlayerId;
                return (
                  <Line
                    key={player.id}
                    type="monotone"
                    dataKey={player.id}
                    stroke={colorMap[player.id]}
                    strokeWidth={isDimmed ? 1.5 : 2.5}
                    strokeOpacity={isDimmed ? 0.25 : 1}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-card)" }}
                    connectNulls
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
