import "server-only";
import fs from "node:fs";
import path from "node:path";
import { google, sheets_v4 } from "googleapis";
import type { SheetCellValue } from "./parse";

interface SheetsConfig {
  spreadsheetId: string;
  worksheetName: string;
  serviceAccountKeyPath: string;
}

function loadSheetsConfig(): SheetsConfig {
  const spreadsheetId = process.env.GEOSPORTS_SHEET_ID;
  if (!spreadsheetId) {
    throw new Error(
      "GEOSPORTS_SHEET_ID is not set. Add it to .env.local to read live data from Google Sheets " +
        "(see .env.local.example), or unset GEOSPORTS_DATA_SOURCE to fall back to mock data.",
    );
  }

  return {
    spreadsheetId,
    worksheetName: process.env.GEOSPORTS_WORKSHEET_NAME || "RawData",
    serviceAccountKeyPath: process.env.GEOSPORTS_SERVICE_ACCOUNT_KEY_PATH || "service-account.json",
  };
}

let cachedClient: sheets_v4.Sheets | null = null;

function getSheetsClient(serviceAccountKeyPath: string): sheets_v4.Sheets {
  if (cachedClient) return cachedClient;

  const keyFile = path.isAbsolute(serviceAccountKeyPath)
    ? serviceAccountKeyPath
    : path.join(/* turbopackIgnore: true */ process.cwd(), serviceAccountKeyPath);

  if (!fs.existsSync(keyFile)) {
    throw new Error(
      `Google service account key not found at ${keyFile}. Set GEOSPORTS_SERVICE_ACCOUNT_KEY_PATH ` +
        "if it lives somewhere else.",
    );
  }

  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  cachedClient = google.sheets({ version: "v4", auth });
  return cachedClient;
}

/**
 * Raw rows from the RawData tab: [msg_time, sender, message, score].
 *
 * Uses UNFORMATTED_VALUE deliberately: Sheets auto-converts date-looking text
 * into a real Date value on ingestion (the sync script writes with
 * USER_ENTERED), and FORMATTED_VALUE then renders those cells back as a
 * locale-formatted string (e.g. "6/1/2026 9:15:00") that's ambiguous to
 * re-parse and inconsistent with any msg_time cells that stayed plain text.
 * UNFORMATTED_VALUE instead returns real dates as an unambiguous numeric
 * serial (days since the Sheets epoch) and leaves text cells untouched — see
 * parseSheetTimestamp in parse.ts for both cases.
 */
export async function fetchRawRows(): Promise<SheetCellValue[][]> {
  const config = loadSheetsConfig();
  const client = getSheetsClient(config.serviceAccountKeyPath);

  const response = await client.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId,
    range: `${config.worksheetName}!A:D`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  return response.data.values ?? [];
}
