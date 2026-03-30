import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("DB_URL")
MIGRATIONS_DIR = os.getenv("MIGRATIONS_DIR")


def get_connection(db_url):
    return psycopg2.connect(db_url)


def setup_migrations_table(conn):
    """Create the schema_migrations table if it doesn't exist"""
    with conn.cursor() as cursor:
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """
        )
    conn.commit()


def get_applied_versions(conn):
    """Get list of already applied migration versions"""
    with conn.cursor() as cursor:
        cursor.execute("SELECT version FROM schema_migrations ORDER BY version;")
        return [row[0] for row in cursor.fetchall()]


def apply_migration(conn, filepath, version):
    print(f"Applying migration {version}: {os.path.basename(filepath)}")
    with open(filepath, "r", encoding="utf-8") as f:
        sql = f.read()

    with conn.cursor() as cursor:
        # Split by semicolons and execute each statement
        statements = [s.strip() for s in sql.split(";") if s.strip()]
        for statement in statements:
            if statement.upper() not in ["BEGIN", "COMMIT"]:
                cursor.execute(statement)

        cursor.execute(
            "INSERT INTO schema_migrations (version) VALUES (%s);", (version,)
        )
    conn.commit()


def migrate():
    if not os.path.exists(MIGRATIONS_DIR):
        raise FileNotFoundError(f"Migrations directory not found: {MIGRATIONS_DIR}")

    conn = get_connection(DB_URL)

    try:
        setup_migrations_table(conn)
        applied_versions = get_applied_versions(conn)

        migration_files = sorted(os.listdir(MIGRATIONS_DIR))

        for filename in migration_files:
            if not filename.endswith(".sql"):
                continue

            version = int(filename.split("_")[0])
            if version not in applied_versions:
                apply_migration(conn, os.path.join(MIGRATIONS_DIR, filename), version)

        print("Migrations completed successfully!")
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
