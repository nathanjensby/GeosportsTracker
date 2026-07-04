import "server-only";
import fs from "node:fs";
import path from "node:path";
import { google, sheets_v4 } from "googleapis";
import type { SheetCellValue } from "./parse";

interface SheetsConfig {
  spreadsheetId: string;
  worksheetName: string;
  serviceAccountKeyPath: string;
  serviceAccountKeyBase64: string | undefined;
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
    serviceAccountKeyBase64: process.env.GEOSPORTS_SERVICE_ACCOUNT_KEY_BASE64,
  };
}

let cachedClient: sheets_v4.Sheets | null = null;

/**
 * Deployed environments (e.g. Vercel) have no on-disk service-account file —
 * it's gitignored on purpose. GEOSPORTS_SERVICE_ACCOUNT_KEY_BASE64 (the key
 * file's JSON, base64-encoded to survive env var storage intact) takes
 * priority so production reads credentials from Vercel's env vars; the
 * key-file path remains for local dev convenience.
 */
function getSheetsClient(config: SheetsConfig): sheets_v4.Sheets {
  if (cachedClient) return cachedClient;

  if (config.serviceAccountKeyBase64) {
    const credentials = JSON.parse(Buffer.from(config.serviceAccountKeyBase64, "base64").toString("utf8"));
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    cachedClient = google.sheets({ version: "v4", auth });
    return cachedClient;
  }

  const keyFile = path.isAbsolute(config.serviceAccountKeyPath)
    ? config.serviceAccountKeyPath
    : path.join(/* turbopackIgnore: true */ process.cwd(), config.serviceAccountKeyPath);

  if (!fs.existsSync(keyFile)) {
    throw new Error(
      `Google service account key not found at ${keyFile}. Set GEOSPORTS_SERVICE_ACCOUNT_KEY_BASE64 ` +
        "(required in deployed environments) or GEOSPORTS_SERVICE_ACCOUNT_KEY_PATH if the key file lives elsewhere.",
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
  const client = getSheetsClient(config);

  const response = await client.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId,
    range: `${config.worksheetName}!A:D`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  return response.data.values ?? [];
}
