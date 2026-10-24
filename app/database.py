from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

active_db_type = "postgresql"

try:
    engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("[db] connected to postgresql")
except Exception as e:
    if settings.USE_SQLITE_FALLBACK:
        print(f"[db] postgres connect failed ({e}), falling back to sqlite")
        engine = create_engine("sqlite:///./taskflow.db", connect_args={"check_same_thread": False})
        active_db_type = "sqlite"
    else:
        raise e

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_active_db_type() -> str:
    return active_db_type
