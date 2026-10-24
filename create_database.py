import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from app.config import settings

def setup_db():
    print(f"[init] checking postgres db: {settings.DB_NAME} at {settings.DB_HOST}:{settings.DB_PORT}")
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            connect_timeout=5
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()

        cur.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s", (settings.DB_NAME,))
        if not cur.fetchone():
            print(f"[init] creating database '{settings.DB_NAME}'...")
            cur.execute(f'CREATE DATABASE "{settings.DB_NAME}"')
            print(f"[init] database created successfully")
        else:
            print(f"[init] database '{settings.DB_NAME}' already exists")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"[error] failed to create database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    setup_db()
