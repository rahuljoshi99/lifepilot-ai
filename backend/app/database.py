
import sqlite3
from pathlib import Path

DATABASE_PATH = Path(__file__).resolve().parent / "lifepilot.db"


def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                completed INTEGER NOT NULL DEFAULT 0,
                priority TEXT NOT NULL DEFAULT 'medium',
                due_date TEXT
            )
            """
        )

        # Safely add columns to an existing database.
        columns = {
            row["name"]
            for row in connection.execute(
                "PRAGMA table_info(tasks)"
            ).fetchall()
        }

        if "priority" not in columns:
            connection.execute(
                "ALTER TABLE tasks "
                "ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium'"
            )

        if "due_date" not in columns:
            connection.execute(
                "ALTER TABLE tasks ADD COLUMN due_date TEXT"
            )
