import type { Player, ScoreEntry } from "@/types";
import { resolveSenderToPlayer } from "./player-directory";

/** What a single Google Sheets cell can come back as. */
export type SheetCellValue = string | number | boolean;

interface ParsedRawRows {
  entries: ScoreEntry[];
  players: Map<string, Player>;
}

const ISO_LIKE = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/;

// Google Sheets' date serial epoch: December 30, 1899.
const SHEETS_SERIAL_EPOCH_UTC_MS = Date.UTC(1899, 11, 30);

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Normalizes a msg_time cell to an ISO-ish "YYYY-MM-DDTHH:MM:SS" string.
 *
 * The cell arrives in one of two shapes, both coming out of the same sheet:
 *  - a plain "YYYY-MM-DD HH:MM:SS" string, for rows Sheets left as text, or
 *  - a numeric date serial, for rows Sheets auto-converted to a Date value
 *    (fetched with UNFORMATTED_VALUE specifically to get this as an
 *    unambiguous number rather than a locale-formatted, hard-to-reparse
 *    string like "6/1/2026 9:15:00").
 * Returns null for anything else so the caller can skip the row instead of
 * silently mis-grouping it into the wrong day.
 */
function parseSheetTimestamp(raw: SheetCellValue | undefined): string | null {
  if (typeof raw === "number") {
    const date = new Date(SHEETS_SERIAL_EPOCH_UTC_MS + raw * 86_400_000);
    return (
      `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}` +
      `T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`
    );
  }

  if (typeof raw === "string") {
    const match = ISO_LIKE.exec(raw);
    if (match) {
      const [, year, month, day, hour, minute, second] = match;
      return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    }
  }

  return null;
}

/**
 * Parses raw `RawData` rows (`[msg_time, sender, message, score]`) into score
 * entries. Rows with a non-numeric score are skipped — this naturally filters
 * out a header row without needing to special-case it.
 */
export function parseRawRows(rows: SheetCellValue[][]): ParsedRawRows {
  const entries: ScoreEntry[] = [];
  const players = new Map<string, Player>();

  rows.forEach((row, index) => {
    const [msgTimeRaw, senderRaw, messageRaw, scoreRaw] = row;
    if (msgTimeRaw == null || senderRaw == null || scoreRaw === undefined) return;

    const score = Number(scoreRaw);
    if (!Number.isFinite(score)) return;

    const timestamp = parseSheetTimestamp(msgTimeRaw);
    if (!timestamp) return;

    const sender = String(senderRaw);
    const player = resolveSenderToPlayer(sender);
    players.set(player.id, player);

    entries.push({
      id: `${timestamp}-${player.id}-${index}`,
      playerId: player.id,
      timestamp,
      score,
      rawMessage: messageRaw == undefined ? undefined : String(messageRaw),
    });
  });

  return { entries, players };
}
