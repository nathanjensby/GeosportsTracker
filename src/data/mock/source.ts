import type { DailyResult, DataSource, Player } from "@/types";
import { mockDailyResults } from "./daily-results";
import { mockPlayers } from "./players";

export class MockDataSource implements DataSource {
  async getPlayers(): Promise<Player[]> {
    return mockPlayers;
  }

  async getDailyResults(): Promise<DailyResult[]> {
    return mockDailyResults;
  }
}
