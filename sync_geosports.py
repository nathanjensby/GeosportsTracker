#!/usr/bin/env python3
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
CHAT_ID = 45
SELF_NAME = "Nathan"  # change if you want your name shown differently
SHEET_ID = "1U0kjj6bQbGQyiAa5E2wpGiMvvNy_C7WvdYE9pUn7HnA"
WORKSHEET_NAME = "RawData"
SERVICE_ACCOUNT_JSON = "/Users/njensby/geosports/service-account.json"
STATE_FILE = Path.home() / ".geosports_state.json"

SCORE_RE = re.compile(r"(\d{1,4})\s*/\s*1,000")

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
# DATABASE
# ----------------------------
def backup_chat_db(src_path: Path) -> Path:
    tmp = Path(tempfile.gettempdir()) / "chat_backup.db"
    if tmp.exists():
        tmp.unlink()

    with sqlite3.connect(f"file:{src_path}?mode=ro", uri=True) as src, sqlite3.connect(tmp) as dst:
        src.backup(dst)

    return tmp

def fetch_new_rows(db_path: Path, last_rowid: int):
    rows = []
    max_rowid = last_rowid

    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.execute(
            """
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
            WHERE cmj.chat_id = ?
              AND m.ROWID > ?
              AND COALESCE(m.text, '') LIKE '%geosports.app%'
              AND COALESCE(m.associated_message_guid, '') = ''
              AND COALESCE(m.associated_message_type, 0) = 0
            ORDER BY m.ROWID
            """,
            (SELF_NAME, CHAT_ID, last_rowid),
        )

        for r in cur.fetchall():
            max_rowid = max(max_rowid, int(r["rowid"]))
            text = (r["message"] or "").strip()

            # Skip reactions / tapbacks
            if text.startswith(REACTION_PREFIXES):
                continue

            m = SCORE_RE.search(text)
            if not m:
                continue

            score = int(m.group(1))
            rows.append([r["msg_time"], r["sender"], text, score])

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
    state = load_state()
    last_rowid = int(state.get("last_rowid", 0))

    src_db = Path.home() / "Library" / "Messages" / "chat.db"
    backup_db = backup_chat_db(src_db)

    rows, max_rowid = fetch_new_rows(backup_db, last_rowid)

    if not rows:
        log("No new GeoSports rows found.")
        return

    log(f"Found {len(rows)} new GeoSports row(s):")

    for row in rows:
        log(f"{row[0]}  {row[1]:<15} {row[3]}")

    appended = append_rows_to_sheet(rows)

    if max_rowid > last_rowid:
        state["last_rowid"] = max_rowid
        save_state(state)

    log(f"Appended {appended} row(s). last_rowid={state['last_rowid']}")

if __name__ == "__main__":
    main()
