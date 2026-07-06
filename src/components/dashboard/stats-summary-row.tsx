import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatTile } from "@/components/ui/stat-tile";
import { getInitials } from "@/lib/players";
import type { Player, SummaryStats } from "@/types";
import { Star, Target, Trophy, Frown } from "lucide-react";

interface StatsSummaryRowProps {
  summary: SummaryStats;
  players: Player[];
}

const LOSER_INSULTS = [
  "idiot",
  "moron",
  "dumbass",
  "shithead",
  "dumbfuck",
  "fucktard",
  "shit-for-brains",
];

function randomLoserInsult() {
  return LOSER_INSULTS[Math.floor(Math.random() * LOSER_INSULTS.length)];
}

function PlayerAvatar({ player }: Readonly<{ player: Player }>) {
  return (
    <Avatar className="size-6" title={player.name}>
      {player.avatarUrl ? <AvatarImage src={player.avatarUrl} alt={player.name} /> : null}
      <AvatarFallback className="text-[10px]">{getInitials(player.name)}</AvatarFallback>
    </Avatar>
  );
}

function PlayerIconAvatar({ player }: Readonly<{ player: Player }>) {
  return (
    <Avatar className="size-10" title={player.name}>
      {player.avatarUrl ? <AvatarImage src={player.avatarUrl} alt={player.name} /> : null}
      <AvatarFallback className="text-xs">{getInitials(player.name)}</AvatarFallback>
    </Avatar>
  );
}

export function StatsSummaryRow({ summary, players }: Readonly<StatsSummaryRowProps>) {
  const topPlayer = summary.topPlayer
    ? players.find((p) => p.id === summary.topPlayer!.playerId)
    : null;

  const topScoreToday = summary.latestDay?.scores.length
    ? summary.latestDay.scores.reduce(
        (best, s) => (s.score > best.score ? s : best),
        summary.latestDay.scores[0],
      )
    : null;
  const topScorer = topScoreToday ? players.find((p) => p.id === topScoreToday.playerId) : null;

  const lowScoreToday = summary.latestDay?.scores.length
    ? summary.latestDay.scores.reduce(
        (worst, s) => (s.score < worst.score ? s : worst),
        summary.latestDay.scores[0],
      )
    : null;
  const lowScorer = lowScoreToday ? players.find((p) => p.id === lowScoreToday.playerId) : null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatTile
        index={0}
        label="Today's high score"
        value={topScoreToday ? String(topScoreToday.score) : "—"}
        hint={
          topScorer ? (topScorer.name) : (
            "no games yet"
          )
        }
        icon={<Star className="size-5 text-amber-500" />}
      />
      <StatTile
        index={1}
        label="Group average"
        value={summary.allTimeAverageScore.toLocaleString()}
        hint="out of 1000"
        icon={<Target className="size-5" />}
      />
      <StatTile
        index={2}
        label="Reigning champ"
        value={topPlayer?.name ?? "—"}
        hint={topPlayer ? `${summary.topPlayer!.wins} wins` : "no games yet"}
        icon={topPlayer ? <PlayerIconAvatar player={topPlayer} /> : <Trophy className="size-5 text-amber-500" />}
      />
      <StatTile
        index={3}
        label="Today's stupid"
        value={lowScoreToday ? String(lowScoreToday.score) : "—"}
        hint={randomLoserInsult()}
        icon={lowScorer ? <PlayerIconAvatar player={lowScorer} /> : <Frown className="size-5" />}
      />
    </div>
  );
}
