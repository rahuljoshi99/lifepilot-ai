
from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=1000)
    priority: Literal["low", "medium", "high"] = "medium"
    due_date: date | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=1000)
    completed: bool | None = None
    priority: Literal["low", "medium", "high"] | None = None
    due_date: date | None = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str
    completed: bool
    priority: str
    due_date: date | None
