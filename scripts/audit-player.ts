/**
 * Cross-checks our computed stats for one player against the raw sheet data,
 * to diagnose discrepancies against an external source (e.g. a hand-built
 * Excel leaderboard). Usage:
 *
 *   npx tsx scripts/audit-player.ts "Steve Miller"
 */
import fs from "node:fs";
import path from "node:path";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) process.env[match[1]] ??= match[2];
  }
}
loadEnvLocal();

// Inlined instead of importing src/data/google-sheets/client.ts, which is
// guarded by the `server-only` package — that guard rejects any import
// outside Next.js's server-component bundling, including this standalone script.
async function fetchRawRows() {
  const { google } = await import("googleapis");
  const spreadsheetId = process.env.GEOSPORTS_SHEET_ID;
  if (!spreadsheetId) throw new Error("GEOSPORTS_SHEET_ID is not set (check .env.local).");
  const worksheetName = process.env.GEOSPORTS_WORKSHEET_NAME || "RawData";
  const keyFile = path.join(process.cwd(), process.env.GEOSPORTS_SERVICE_ACCOUNT_KEY_PATH || "service-account.json");

  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const client = google.sheets({ version: "v4", auth });
  const response = await client.spreadsheets.values.get({
    spreadsheetId,
    range: `${worksheetName}!A:D`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  return response.data.values ?? [];
}

async function main() {
  const { parseRawRows } = await import("../src/data/google-sheets/parse");
  const { SENDER_DIRECTORY } = await import("../src/data/google-sheets/player-directory");
  const { aggregateDailyResults } = await import("../src/lib/aggregate");
  const { computePlayerStats, getDailyWinnerIds, getDailyStupidIds } = await import("../src/lib/stats");

  const query = process.argv[2];
  if (!query) {
    console.error('Usage: npx tsx scripts/audit-player.ts "Player Name"');
    process.exit(1);
  }

  const rows = await fetchRawRows();
  const { entries, players } = parseRawRows(rows);

  console.log(`Total raw rows: ${rows.length}, parsed score entries: ${entries.length}`);

  // Flag senders that showed up in the sheet but aren't in the directory —
  // these get auto-registered under a raw/slugified id and could be the same
  // person as an existing player under a different phone number/format.
  const knownSenders = new Set(Object.keys(SENDER_DIRECTORY));
  const rawSenders = new Set(rows.map((r) => String(r[1])).filter(Boolean));
  const unmapped = [...rawSenders].filter((s) => !knownSenders.has(s));
  if (unmapped.length > 0) {
    console.log("\n⚠ Senders found in the sheet with NO entry in SENDER_DIRECTORY:");
    for (const s of unmapped) console.log(`   "${s}"`);
  }

  const target = [...players.values()].find((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  if (!target) {
    console.error(`No player matching "${query}" found among parsed entries.`);
    console.error("Known players:", [...players.values()].map((p) => p.name).join(", "));
    process.exit(1);
  }

  const dailyResults = aggregateDailyResults(entries);
  const allStats = computePlayerStats([...players.values()], dailyResults);
  const stats = allStats.find((s) => s.playerId === target.id)!;

  console.log(`\n=== ${target.name} (id: ${target.id}) ===`);
  console.log(`Games played: ${stats.gamesPlayed}`);
  console.log(`Wins: ${stats.wins}`);
  console.log(`Stupids: ${stats.stupids}`);
  console.log(`Average (rounded, as shown in UI): ${stats.averageScore}`);

  const targetEntries = entries.filter((e) => e.playerId === target.id);
  const preciseAvg = targetEntries.reduce((sum, e) => sum + e.score, 0) / targetEntries.length;
  console.log(`Average (unrounded, from raw entries): ${preciseAvg.toFixed(2)}`);

  // Multiple raw entries on the same calendar day reveal double-posts and
  // show which one ("first" per our current rule) got kept.
  const byDay = new Map<string, typeof targetEntries>();
  for (const e of targetEntries) {
    const date = e.timestamp.slice(0, 10);
    if (!byDay.has(date)) byDay.set(date, []);
    byDay.get(date)!.push(e);
  }
  const multiPostDays = [...byDay.entries()].filter(([, es]) => es.length > 1);
  if (multiPostDays.length > 0) {
    console.log(`\n${target.name} posted more than once on ${multiPostDays.length} day(s):`);
    for (const [date, es] of multiPostDays) {
      console.log(`  ${date}: ${es.map((e) => `${e.score}@${e.timestamp.slice(11)}`).join(", ")}`);
    }
  }

  console.log(`\nDay-by-day (${dailyResults.length} days total, showing days ${target.name} played):`);
  for (const day of dailyResults) {
    const entry = day.scores.find((s) => s.playerId === target.id);
    if (!entry) continue;
    const winnerIds = getDailyWinnerIds(day);
    const stupidIds = getDailyStupidIds(day);
    const tags = [
      winnerIds.includes(target.id) ? (winnerIds.length > 1 ? "WIN (tied)" : "WIN") : null,
      stupidIds.includes(target.id) ? (stupidIds.length > 1 ? "STUPID (tied)" : "STUPID") : null,
      day.scores.length < 2 ? "(solo day, no win/stupid awarded)" : null,
    ]
      .filter(Boolean)
      .join(" ");
    console.log(
      `  ${day.date}  score=${entry.score}  players=${day.scores.length}  ${tags}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
