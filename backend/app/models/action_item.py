from __future__ import annotations
from datetime import date
from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from .common import User

class ActionItem(BaseModel):
    id: str  # e.g., "ACTN-2026-001"
    date_raised: date
    workstream: str
    description: str
    owner: List[User] = Field(default_factory=list)
    forum: Literal["Reg Leads", "BU Review", "Legal Review", "Exec", "Async", "Meeting"] = "Async"
    due_date: date
    status: Literal["Open", "In Progress", "Done", "Blocked", "Cancelled"] = "Open"
    notes: Optional[str] = None
    source: Literal["Meeting", "Decision", "Manual", "Agent"] = "Manual"
    source_ref: Optional[str] = None
    project_refs: List[str] = Field(default_factory=list)
