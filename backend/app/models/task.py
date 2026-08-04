from __future__ import annotations
from datetime import date, datetime, timezone
from typing import Optional, Literal, Union
from pydantic import BaseModel, Field
from .common import User

class Task(BaseModel):
    id: str  # e.g., "TASK-ECGT-001"
    title: str
    description: str
    project_ref: str
    workstream: str
    artifact_ref: Optional[str] = None
    assignee: User
    due_date: date
    priority: Literal["P0", "P1", "P2", "P3"] = "P2"
    status: Literal["Backlog", "Todo", "In Progress", "Blocked", "Done", "Cancelled"] = "Todo"
    created_by: Union[User, str]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    slack_reminded: bool = False
    jira_ticket: Optional[str] = None
    notes: Optional[str] = None

