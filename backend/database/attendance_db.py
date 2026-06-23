import sqlite3
from datetime import datetime
import os
from pathlib import Path
from typing import List, Tuple

DB_PATH = Path(os.getenv("FACETRACK_DB_PATH", "backend/attendance.db"))


def init_db() -> None:
    """
    Initialize the attendance database and create the attendance table if it doesn't exist.
    """
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                timestamp TEXT NOT NULL
            )
            """
        )
        conn.commit()


def mark_attendance_db(name: str) -> None:
    """
    Mark attendance for a given name if not already marked for today.
    Args:
        name (str): The name of the person to mark attendance for.
    """
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute(
            "SELECT 1 FROM attendance WHERE name=? AND date(timestamp)=date('now')",
            (name,),
        )
        if not c.fetchone():
            c.execute(
                "INSERT INTO attendance (name, timestamp) VALUES (?, ?)",
                (name, now),
            )
            conn.commit()


def get_attendance_records() -> List[Tuple[str, str]]:
    """
    Retrieve all attendance records, ordered by most recent.
    Returns:
        List[Tuple[str, str]]: List of (name, timestamp) tuples.
    """
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("SELECT name, timestamp FROM attendance ORDER BY timestamp DESC")
        records = c.fetchall()
    return records
