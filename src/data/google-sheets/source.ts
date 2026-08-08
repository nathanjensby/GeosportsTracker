import "server-only";
import type { DailyResult, DataSource, Game, Player, ScoreEntry } from "@/types";
import { aggregateDailyResults } from "@/lib/aggregate";
import { fetchRawRows } from "./client";
import { parseRawRows } from "./parse";

const CACHE_TTL_MS = 30_000;

interface Cache {
  players: Player[];
  entries: ScoreEntry[];
  fetchedAt: number;
}

/** Reads live scores from the Google Sheet the sync script populates, across all games. */
export class GoogleSheetsDataSource implements DataSource {
  private cache: Cache | null = null;

  private async load(): Promise<Cache> {
    if (this.cache && Date.now() - this.cache.fetchedAt < CACHE_TTL_MS) {
      return this.cache;
    }

    const rows = await fetchRawRows();
    const { entries, players } = parseRawRows(rows);

    this.cache = {
      players: [...players.values()],
      entries,
      fetchedAt: Date.now(),
    };
    return this.cache;
  }

  async getPlayers(game: Game): Promise<Player[]> {
    const { players, entries } = await this.load();
    const playerIdsForGame = new Set(entries.filter((e) => e.game === game).map((e) => e.playerId));
    return players.filter((player) => playerIdsForGame.has(player.id));
  }

  async getDailyResults(game: Game): Promise<DailyResult[]> {
    const { entries } = await this.load();
    return aggregateDailyResults(entries, game);
  }
}
