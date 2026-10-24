from datetime import datetime
from typing import Optional, Dict, Literal
from pydantic import BaseModel, Field, ConfigDict

PriorityType = Literal["Low", "Medium", "High", "Urgent"]

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = None
    category: str = "General"
    priority: PriorityType = "Medium"
    is_completed: bool = False
    due_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[PriorityType] = None
    is_completed: Optional[bool] = None
    due_date: Optional[datetime] = None

class TaskResponse(TaskBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TaskStats(BaseModel):
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    completion_rate_percentage: float
    by_priority: Dict[str, int]
    by_category: Dict[str, int]
