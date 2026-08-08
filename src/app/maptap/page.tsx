import { GameDashboard } from "@/components/dashboard/game-dashboard";

export const revalidate = 30;

export default function MapTapDashboardPage() {
  return (
    <GameDashboard
      game="maptap"
      title="MapTap"
      description="Who's winning, who's streaking, and who's today's Stupid."
    />
  );
}
