"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HeadToHeadComparison } from "@/components/players/head-to-head-comparison";
import { buildPlayerColorMap } from "@/lib/players";
import { buildHeadToHeadSummary, computeHeadToHead, pickDefaultOpponentId } from "@/lib/stats";
import type { DailyResult, Player } from "@/types";

interface PlayerHeadToHeadCardProps {
  playerId: string;
  players: Player[];
  dailyResults: DailyResult[];
}

function storageKey(playerId: string): string {
  return `geosports:h2h:${playerId}`;
}

export function PlayerHeadToHeadCard({ playerId, players, dailyResults }: Readonly<PlayerHeadToHeadCardProps>) {
  const player = players.find((p) => p.id === playerId) ?? null;
  const opponents = useMemo(() => players.filter((p) => p.id !== playerId), [players, playerId]);

  const [opponentId, setOpponentId] = useState<string | null>(() =>
    pickDefaultOpponentId(playerId, players, dailyResults),
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey(playerId));
    if (stored && opponents.some((p) => p.id === stored)) {
      setOpponentId(stored);
    }
  }, [playerId, opponents]);

  const colorMap = useMemo(() => buildPlayerColorMap(players), [players]);
  const playerNames = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p.name])), [players]);

  const opponent = opponents.find((p) => p.id === opponentId) ?? opponents[0] ?? null;

  const stats = useMemo(() => {
    if (!player || !opponent) return null;
    return computeHeadToHead(dailyResults, player.id, opponent.id);
  }, [dailyResults, player, opponent]);

  const summaries = useMemo(() => (stats ? buildHeadToHeadSummary(stats, playerNames) : []), [stats, playerNames]);

  function handleOpponentChange(id: string) {
    setOpponentId(id);
    window.localStorage.setItem(storageKey(playerId), id);
  }

  if (!player || !opponent || !stats) return null;

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
      <CardHeader>
        <CardTitle>Head to Head</CardTitle>
        <CardAction className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="hidden sm:inline">Compare against:</span>
          <Select value={opponent.id} onValueChange={handleOpponentChange}>
            <SelectTrigger size="sm" aria-label="Choose an opponent to compare against">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {opponents.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent>
        <HeadToHeadComparison
          playerA={player}
          playerB={opponent}
          colorA={colorMap[player.id]}
          colorB={colorMap[opponent.id]}
          stats={stats}
          summaries={summaries}
        />
      </CardContent>
    </Card>
  );
}
