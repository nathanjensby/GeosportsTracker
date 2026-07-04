import type { DataSource } from "@/types";
import { MockDataSource } from "./mock";
import { GoogleSheetsDataSource } from "./google-sheets/source";

function createDataSource(): DataSource {
  if (process.env.GEOSPORTS_DATA_SOURCE === "sheets") {
    return new GoogleSheetsDataSource();
  }
  return new MockDataSource();
}

/**
 * Single point of truth for "where does data come from." Defaults to mock
 * data; set GEOSPORTS_DATA_SOURCE=sheets in .env.local (see
 * .env.local.example) to read live data from the Google Sheet the sync
 * script populates instead. Everything that imports `dataSource` keeps
 * working unchanged either way.
 */
export const dataSource: DataSource = createDataSource();
