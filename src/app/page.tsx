import { DailyResultsCard } from "@/components/dashboard/daily-results-card";
import { LeaderboardCard } from "@/components/dashboard/leaderboard-card";
import { ScoreTrendChart } from "@/components/dashboard/score-trend-chart";
import { StatsSummaryRow } from "@/components/dashboard/stats-summary-row";
import { dataSource } from "@/data/source";
import { computePlayerStats, computeSummaryStats } from "@/lib/stats";

export default async function DashboardPage() {
  const [players, dailyResults] = await Promise.all([
    dataSource.getPlayers(),
    dataSource.getDailyResults(),
  ]);

  const playerStats = computePlayerStats(players, dailyResults);
  const summary = computeSummaryStats(players, dailyResults, playerStats);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Who&apos;s winning, who&apos;s streaking, and who&apos;s today&apos;s Stupid.
        </p>
      </div>

      <StatsSummaryRow summary={summary} players={players} />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="min-w-0 lg:col-span-3">
          <LeaderboardCard players={players} playerStats={playerStats} />
        </div>
        <div className="min-w-0 lg:col-span-2">
          <DailyResultsCard day={summary.latestDay} players={players} />
        </div>
      </div>

      <ScoreTrendChart dailyResults={dailyResults} players={players} />
    </div>
  );
}
