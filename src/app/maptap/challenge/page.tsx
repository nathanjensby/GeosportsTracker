import { ChallengeTimeStatsCard } from "@/components/dashboard/challenge-time-stats-card";
import { GameDashboard } from "@/components/dashboard/game-dashboard";
import { dataSource } from "@/data/source";
import { computeChallengeTimeStats } from "@/lib/stats";

export const revalidate = 30;

export default async function MapTapChallengePage() {
  const [players, dailyResults] = await Promise.all([
    dataSource.getPlayers("maptap-challenge"),
    dataSource.getDailyResults("maptap-challenge"),
  ]);
  const timeStats = computeChallengeTimeStats(dailyResults);

  return (
    <GameDashboard
      game="maptap-challenge"
      title="MapTap Challenge"
      description="Same MapTap leaderboard, plus the clock: fastest times and closest calls."
    >
      <ChallengeTimeStatsCard timeStats={timeStats} players={players} />
    </GameDashboard>
  );
}
