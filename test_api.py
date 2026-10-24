import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.database import SessionLocal, engine, Base
from app import crud, schemas

def run():
    print("[test] running quick integration test...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        task = crud.create_task(db, schemas.TaskCreate(title="Test Task", category="Dev", priority="High"))
        assert task.id is not None
        print(f"[test] created task id={task.id}")

        fetched = crud.get_task_by_id(db, task.id)
        assert fetched.title == "Test Task"

        crud.toggle_task_completion(db, task.id)
        assert crud.get_task_by_id(db, task.id).is_completed is True

        stats = crud.get_task_statistics(db)
        assert stats["total_tasks"] >= 1

        crud.delete_task(db, task.id)
        assert crud.get_task_by_id(db, task.id) is None
        print("[test] all checks passed!")
    finally:
        db.close()

if __name__ == "__main__":
    run()
