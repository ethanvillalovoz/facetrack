import os
import sqlite3
from datetime import UTC, datetime
from pathlib import Path


def get_db_path() -> Path:
    return Path(os.getenv("FACETRACK_DB_PATH", "backend/attendance.db"))


def connect() -> sqlite3.Connection:
    db_path = get_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(db_path)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    with connect() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                attendance_date TEXT NOT NULL,
                UNIQUE(name, attendance_date)
            );

            CREATE TABLE IF NOT EXISTS roster (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                label TEXT NOT NULL COLLATE NOCASE UNIQUE,
                filename TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL
            );
            """
        )


def mark_attendance(name: str, timestamp: datetime | None = None) -> bool:
    observed_at = timestamp or datetime.now(UTC)
    with connect() as connection:
        cursor = connection.execute(
            """
            INSERT OR IGNORE INTO attendance (name, timestamp, attendance_date)
            VALUES (?, ?, ?)
            """,
            (name, observed_at.isoformat(), observed_at.date().isoformat()),
        )
        return cursor.rowcount == 1


def get_attendance_records(limit: int = 500) -> list[dict]:
    with connect() as connection:
        rows = connection.execute(
            """
            SELECT id, name, timestamp
            FROM attendance
            ORDER BY timestamp DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
    return [dict(row) for row in rows]


def clear_attendance_records() -> int:
    with connect() as connection:
        cursor = connection.execute("DELETE FROM attendance")
        return cursor.rowcount


def add_roster_identity(label: str, filename: str) -> dict:
    created_at = datetime.now(UTC).isoformat()
    with connect() as connection:
        connection.execute(
            """
            INSERT INTO roster (label, filename, created_at)
            VALUES (?, ?, ?)
            ON CONFLICT(label) DO UPDATE SET
                filename = excluded.filename,
                created_at = excluded.created_at
            """,
            (label, filename, created_at),
        )
        row = connection.execute(
            "SELECT id, label, filename, created_at FROM roster WHERE label = ?",
            (label,),
        ).fetchone()
    return dict(row)


def get_roster() -> list[dict]:
    with connect() as connection:
        rows = connection.execute(
            """
            SELECT id, label, filename, created_at
            FROM roster
            ORDER BY label COLLATE NOCASE
            """
        ).fetchall()
    return [dict(row) for row in rows]
