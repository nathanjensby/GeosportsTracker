import "server-only";
import type { DailyResult, DataSource, Player } from "@/types";
import { aggregateDailyResults } from "@/lib/aggregate";
import { fetchRawRows } from "./client";
import { parseRawRows } from "./parse";

const CACHE_TTL_MS = 30_000;

interface Cache {
  players: Player[];
  dailyResults: DailyResult[];
  fetchedAt: number;
}

/** Reads live scores from the Google Sheet the sync script populates. */
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
      dailyResults: aggregateDailyResults(entries),
      fetchedAt: Date.now(),
    };
    return this.cache;
  }

  async getPlayers(): Promise<Player[]> {
    return (await this.load()).players;
  }

  async getDailyResults(): Promise<DailyResult[]> {
    return (await this.load()).dailyResults;
  }
}
