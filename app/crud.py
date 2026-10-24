from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, schemas

def get_tasks(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    is_completed: Optional[bool] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
) -> List[models.Task]:
    query = db.query(models.Task)

    if is_completed is not None:
        query = query.filter(models.Task.is_completed == is_completed)
    if category:
        query = query.filter(models.Task.category.ilike(f"%{category}%"))
    if priority:
        query = query.filter(models.Task.priority == priority)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (models.Task.title.ilike(search_filter)) | (models.Task.description.ilike(search_filter))
        )

    return query.order_by(models.Task.created_at.desc()).offset(skip).limit(limit).all()

def get_task_by_id(db: Session, task_id: int) -> Optional[models.Task]:
    return db.query(models.Task).filter(models.Task.id == task_id).first()

def create_task(db: Session, task_in: schemas.TaskCreate) -> models.Task:
    print(f"[crud] adding task: {task_in.title}")
    db_task = models.Task(**task_in.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def update_task(db: Session, task_id: int, task_in: schemas.TaskUpdate) -> Optional[models.Task]:
    db_task = get_task_by_id(db, task_id)
    if not db_task:
        return None

    for field, value in task_in.model_dump(exclude_unset=True).items():
        setattr(db_task, field, value)

    db.commit()
    db.refresh(db_task)
    return db_task

def delete_task(db: Session, task_id: int) -> bool:
    db_task = get_task_by_id(db, task_id)
    if not db_task:
        return False
    db.delete(db_task)
    db.commit()
    return True

def toggle_task_completion(db: Session, task_id: int) -> Optional[models.Task]:
    db_task = get_task_by_id(db, task_id)
    if not db_task:
        return None
    db_task.is_completed = not db_task.is_completed
    db.commit()
    db.refresh(db_task)
    return db_task

def get_task_statistics(db: Session) -> dict:
    total = db.query(models.Task).count()
    completed = db.query(models.Task).filter(models.Task.is_completed == True).count()
    pending = total - completed
    completion_rate = round((completed / total * 100), 1) if total > 0 else 0.0

    priority_counts = (
        db.query(models.Task.priority, func.count(models.Task.id))
        .group_by(models.Task.priority)
        .all()
    )
    category_counts = (
        db.query(models.Task.category, func.count(models.Task.id))
        .group_by(models.Task.category)
        .all()
    )

    return {
        "total_tasks": total,
        "completed_tasks": completed,
        "pending_tasks": pending,
        "completion_rate_percentage": completion_rate,
        "by_priority": {p: count for p, count in priority_counts},
        "by_category": {c: count for c, count in category_counts},
    }
