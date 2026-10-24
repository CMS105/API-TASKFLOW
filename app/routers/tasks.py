from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from .. import schemas, crud

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("/stats/summary", response_model=schemas.TaskStats)
def get_task_stats(db: Session = Depends(get_db)):
    return crud.get_task_statistics(db)

@router.get("/", response_model=List[schemas.TaskResponse])
def read_tasks(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    is_completed: Optional[bool] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return crud.get_tasks(
        db=db,
        skip=skip,
        limit=limit,
        is_completed=is_completed,
        category=category,
        priority=priority,
        search=search,
    )

@router.post("/", response_model=schemas.TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(task_in: schemas.TaskCreate, db: Session = Depends(get_db)):
    return crud.create_task(db=db, task_in=task_in)

@router.get("/{task_id}", response_model=schemas.TaskResponse)
def read_task(task_id: int, db: Session = Depends(get_db)):
    task = crud.get_task_by_id(db, task_id=task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.put("/{task_id}", response_model=schemas.TaskResponse)
def update_task(task_id: int, task_in: schemas.TaskUpdate, db: Session = Depends(get_db)):
    updated = crud.update_task(db, task_id=task_id, task_in=task_in)
    if not updated:
        raise HTTPException(status_code=404, detail="Task not found")
    return updated

@router.patch("/{task_id}/toggle", response_model=schemas.TaskResponse)
def toggle_task(task_id: int, db: Session = Depends(get_db)):
    updated = crud.toggle_task_completion(db, task_id=task_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Task not found")
    return updated

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    success = crud.delete_task(db, task_id=task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return None

# TODO: add batch delete or reorder endpoint if time permits
