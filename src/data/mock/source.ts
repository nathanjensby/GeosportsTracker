import type { DailyResult, DataSource, Game, Player } from "@/types";
import { mockDailyResults } from "./daily-results";
import { mockMapTapDailyResults } from "./maptap-daily-results";
import { mockMapTapChallengeDailyResults } from "./maptap-challenge-daily-results";
import { mockPlayers } from "./players";

const DAILY_RESULTS_BY_GAME: Record<Game, DailyResult[]> = {
  geosports: mockDailyResults,
  maptap: mockMapTapDailyResults,
  "maptap-challenge": mockMapTapChallengeDailyResults,
};

export class MockDataSource implements DataSource {
  async getPlayers(): Promise<Player[]> {
    return mockPlayers;
  }

  async getDailyResults(game: Game): Promise<DailyResult[]> {
    return DAILY_RESULTS_BY_GAME[game];
  }
}
