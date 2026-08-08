import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayerGameProfile } from "@/components/players/player-game-profile";
import { dataSource } from "@/data/source";
import { getInitials } from "@/lib/players";
import type { Game } from "@/types";
import { ArrowLeft } from "lucide-react";

// Matches GoogleSheetsDataSource's own in-memory cache TTL. There's no
// generateStaticParams here, so player pages currently render fresh on first
// visit only by accident; this makes the revalidation window explicit.
export const revalidate = 30;

interface PlayerPageProps {
  params: Promise<{ id: string }>;
}

const GAMES: { id: Game; label: string }[] = [
  { id: "geosports", label: "GeoSports" },
  { id: "maptap", label: "MapTap" },
  { id: "maptap-challenge", label: "Challenge" },
];

export default async function PlayerPage({ params }: Readonly<PlayerPageProps>) {
  const { id } = await params;

  const results = await Promise.all(
    GAMES.map(({ id: game }) =>
      Promise.all([dataSource.getPlayers(game), dataSource.getDailyResults(game)]),
    ),
  );

  const player = results.map(([players]) => players.find((p) => p.id === id)).find(Boolean) ?? null;
  if (!player) notFound();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-10">
      <Link
        href="/"
        className="inline-flex w-fit animate-in fade-in items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-500 hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to leaderboard
      </Link>

      <div className="flex animate-in fade-in slide-in-from-bottom-2 items-center gap-4 duration-500">
        <Avatar className="size-14">
          <AvatarFallback className="text-lg">{getInitials(player.name)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{player.name}</h1>
        </div>
      </div>

      <Tabs defaultValue="geosports">
        <TabsList>
          {GAMES.map(({ id: game, label }) => (
            <TabsTrigger key={game} value={game}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        {GAMES.map(({ id: game, label }, index) => {
          const [players, dailyResults] = results[index];
          return (
            <TabsContent key={game} value={game} className="mt-6">
              <PlayerGameProfile gameLabel={label} playerId={id} players={players} dailyResults={dailyResults} />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
