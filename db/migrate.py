import sqlite3
import os
from dotenv import load_dotenv

load_dotenv()

DB_PATH = os.getenv("DB_PATH")
MIGRATIONS_DIR = os.getenv("MIGRATIONS_DIR")


def get_current_version(conn):
    return conn.execute("PRAGMA user_version;").fetchone()[0]


def apply_migration(conn, filepath):
    print(f"Applying {os.path.basename(filepath)}")
    with open(filepath, "r", encoding="utf-8") as f:
        sql = f.read()
    conn.executescript(sql)


def migrate():
    if not os.path.exists(MIGRATIONS_DIR):
        raise FileNotFoundError(f"Migrations directory not found: {MIGRATIONS_DIR}")

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON;")

    current_version = get_current_version(conn)

    migration_files = sorted(os.listdir(MIGRATIONS_DIR))

    for filename in migration_files:
        if not filename.endswith(".sql"):
            continue

        version = int(filename.split("_")[0])
        if version > current_version:
            apply_migration(conn, os.path.join(MIGRATIONS_DIR, filename))

    conn.commit()
    conn.close()


if __name__ == "__main__":
    migrate()
