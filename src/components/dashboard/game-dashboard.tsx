import { DailyResultsCard } from "@/components/dashboard/daily-results-card";
import { LeaderboardCard } from "@/components/dashboard/leaderboard-card";
import { ScoreTrendChart } from "@/components/dashboard/score-trend-chart";
import { StatsSummaryRow } from "@/components/dashboard/stats-summary-row";
import { dataSource } from "@/data/source";
import { computePlayerStats, computeRankChanges, computeSummaryStats, filterToCurrentMonth } from "@/lib/stats";
import type { Game } from "@/types";

interface GameDashboardProps {
  game: Game;
  title: string;
  description: string;
  /** Extra content rendered below the trend chart — e.g. Challenge's time stats. */
  children?: React.ReactNode;
}

export async function GameDashboard({ game, title, description, children }: Readonly<GameDashboardProps>) {
  const [players, dailyResults] = await Promise.all([
    dataSource.getPlayers(game),
    dataSource.getDailyResults(game),
  ]);

  const playerStats = computePlayerStats(players, dailyResults);
  const monthlyPlayerStats = computePlayerStats(players, filterToCurrentMonth(dailyResults));
  const summary = computeSummaryStats(players, dailyResults, playerStats);
  const rankChanges = computeRankChanges(players, dailyResults);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-10">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-1 text-muted-foreground">{description}</p>
      </div>

      <StatsSummaryRow summary={summary} players={players} />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 fill-mode-both lg:col-span-3">
          <LeaderboardCard
            players={players}
            playerStats={playerStats}
            monthlyPlayerStats={monthlyPlayerStats}
            rankChanges={rankChanges}
          />
        </div>
        <div className="min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 fill-mode-both lg:col-span-2">
          <DailyResultsCard day={summary.latestDay} players={players} />
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300 fill-mode-both">
        <ScoreTrendChart dailyResults={dailyResults} players={players} />
      </div>

      {children}
    </div>
  );
}
