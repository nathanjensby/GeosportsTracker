import { GameDashboard } from "@/components/dashboard/game-dashboard";

// Matches GoogleSheetsDataSource's own in-memory cache TTL — without this the
// route has no dynamic APIs and Next prerenders it once at build time, then
// caches that HTML indefinitely (sheet updates would never show up).
export const revalidate = 30;

export default function DashboardPage() {
  return (
    <GameDashboard
      game="geosports"
      title="Geosports"
      description="Who's winning, who's streaking, and who's today's Stupid."
    />
  );
}
