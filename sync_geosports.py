#!/usr/bin/env python3
import argparse
import json
import re
import sqlite3
import tempfile
from pathlib import Path

from datetime import datetime

import gspread
from google.oauth2.service_account import Credentials

# ----------------------------
# CONFIG
# ----------------------------
CHAT_IDS = (45, 221)  # add more chat_ids here to pull scores from other threads too
SELF_NAME = "Nathan"  # change if you want your name shown differently
SHEET_ID = "1U0kjj6bQbGQyiAa5E2wpGiMvvNy_C7WvdYE9pUn7HnA"
WORKSHEET_NAME = "RawData"
SERVICE_ACCOUNT_JSON = "/Users/njensby/geosports/service-account.json"
STATE_FILE = Path.home() / ".geosports_state.json"

GEOSPORTS_SCORE_RE = re.compile(r"(\d{1,4})\s*/\s*1,000")
MAPTAP_SCORE_RE = re.compile(r"Final score:\s*(\d+)")
MAPTAP_CHALLENGE_SCORE_RE = re.compile(r"Score:\s*(\d+)\s+in\s+([\d.]+)s")
MAPTAP_CHALLENGE_SPARE_RE = re.compile(r"\(([\d.]+)s to spare!?\)")

REACTION_PREFIXES = (
    "Emphasized ",
    "Liked ",
    "Loved ",
    "Disliked ",
    "Laughed at ",
    "Questioned ",
    "Reacted ",
)

# ----------------------------
# LOGGING
# ----------------------------
def log(message: str):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")

# ----------------------------
# STATE
# ----------------------------
def load_state():
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {"last_rowid": 0}

def save_state(state):
    STATE_FILE.write_text(json.dumps(state))

# ----------------------------
# MESSAGE CLASSIFICATION
# ----------------------------
def classify_message(text: str):
    """
    Identifies every game score present in a message and pulls out its
    numbers. Matches each game's score pattern independently (rather than
    picking one game via a domain substring) so a single message that
    combines more than one game's result — e.g. someone pastes a MapTap and
    a GeoSports result together in one text — yields an entry for each,
    instead of silently dropping whichever game was checked second. The
    three formats don't overlap ("X / 1,000" vs "Final score: X" vs the
    capital-S "Score: X in Ys"), so matching all three is safe.

    Returns a list of (game, score, time_seconds, time_to_spare) tuples —
    empty if nothing matched.
    """
    results = []

    challenge_match = MAPTAP_CHALLENGE_SCORE_RE.search(text)
    if challenge_match:
        score = int(challenge_match.group(1))
        time_seconds = float(challenge_match.group(2))
        if "TIME UP!" in text:
            # Ran out the clock — zero seconds to spare, not "unknown".
            time_to_spare = 0
        else:
            spare = MAPTAP_CHALLENGE_SPARE_RE.search(text)
            time_to_spare = float(spare.group(1)) if spare else ""
        results.append(("maptap-challenge", score, time_seconds, time_to_spare))

    geosports_match = GEOSPORTS_SCORE_RE.search(text)
    if geosports_match:
        results.append(("geosports", int(geosports_match.group(1)), "", ""))

    maptap_match = MAPTAP_SCORE_RE.search(text)
    if maptap_match:
        results.append(("maptap", int(maptap_match.group(1)), "", ""))

    return results

# ----------------------------
# DATABASE
# ----------------------------
def backup_chat_db(src_path: Path) -> Path:
    tmp = Path(tempfile.gettempdir()) / "chat_backup.db"
    if tmp.exists():
        tmp.unlink()

    with sqlite3.connect(f"file:{src_path}?mode=ro", uri=True) as src, sqlite3.connect(tmp) as dst:
        src.backup(dst)

    return tmp

def fetch_new_rows(db_path: Path, from_rowid: int, chat_ids):
    rows = []
    max_rowid = from_rowid

    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        chat_id_placeholders = ", ".join("?" for _ in chat_ids)
        cur = conn.execute(
            f"""
            SELECT
                m.ROWID AS rowid,
                datetime(m.date/1000000000 + 978307200, 'unixepoch', 'localtime') AS msg_time,
                CASE
                    WHEN m.is_from_me = 1 THEN ?
                    ELSE COALESCE(h.id, '')
                END AS sender,
                m.text AS message
            FROM message m
            JOIN chat_message_join cmj ON cmj.message_id = m.ROWID
            LEFT JOIN handle h ON h.ROWID = m.handle_id
            WHERE cmj.chat_id IN ({chat_id_placeholders})
              AND m.ROWID > ?
              AND (COALESCE(m.text, '') LIKE '%geosports.app%' OR COALESCE(m.text, '') LIKE '%maptap.gg%')
              AND COALESCE(m.associated_message_guid, '') = ''
              AND COALESCE(m.associated_message_type, 0) = 0
            ORDER BY m.ROWID
            """,
            (SELF_NAME, *chat_ids, from_rowid),
        )

        for r in cur.fetchall():
            max_rowid = max(max_rowid, int(r["rowid"]))
            text = (r["message"] or "").strip()

            # Skip reactions / tapbacks
            if text.startswith(REACTION_PREFIXES):
                continue

            # A single message can carry more than one game's score (e.g. a
            # MapTap and a GeoSports result pasted together) — one row per
            # game found, all sharing this message's time/sender/raw text.
            for game, score, time_seconds, time_to_spare in classify_message(text):
                # Column E ("player") is the sheet owner's own formula,
                # unrelated to this script — left blank here so append_rows
                # doesn't disturb it. Game/time data lives in F-H.
                rows.append([r["msg_time"], r["sender"], text, score, "", game, time_seconds, time_to_spare])

    return rows, max_rowid

# ----------------------------
# SHEETS
# ----------------------------
def append_rows_to_sheet(rows):
    if not rows:
        return 0

    scopes = ["https://www.googleapis.com/auth/spreadsheets"]
    creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_JSON, scopes=scopes)
    client = gspread.authorize(creds)

    sh = client.open_by_key(SHEET_ID)
    ws = sh.worksheet(WORKSHEET_NAME)

    ws.append_rows(rows, value_input_option="USER_ENTERED")
    return len(rows)

# ----------------------------
# MAIN
# ----------------------------
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--backfill",
        type=int,
        metavar="CHAT_ID",
        help="One-time full-history pull for a single chat_id (e.g. a thread just "
        "added to CHAT_IDS), ignoring the saved watermark. Use when a new thread's "
        "past messages need to be picked up without re-scanning already-synced chats.",
    )
    args = parser.parse_args()

    state = load_state()
    last_rowid = int(state.get("last_rowid", 0))

    if args.backfill is not None:
        chat_ids = (args.backfill,)
        from_rowid = 0
    else:
        chat_ids = CHAT_IDS
        from_rowid = last_rowid

    src_db = Path.home() / "Library" / "Messages" / "chat.db"
    backup_db = backup_chat_db(src_db)

    rows, max_rowid = fetch_new_rows(backup_db, from_rowid, chat_ids)

    if not rows:
        log("No new score rows found.")
        return

    log(f"Found {len(rows)} new score row(s):")

    for row in rows:
        log(f"{row[0]}  {row[1]:<15} {row[5]:<16} {row[3]}")

    appended = append_rows_to_sheet(rows)

    if max_rowid > last_rowid:
        state["last_rowid"] = max_rowid
        save_state(state)

    log(f"Appended {appended} row(s). last_rowid={state['last_rowid']}")

if __name__ == "__main__":
    main()
