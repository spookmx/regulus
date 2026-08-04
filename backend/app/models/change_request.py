from __future__ import annotations
from datetime import date
from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from .common import User

class ChangeRequest(BaseModel):
    id: str  # e.g., "CR-2026-001"
    title: str
    description: str
    regulation: List[str] = Field(default_factory=list)
    requestor: User
    pm_lead: User
    date_raised: date
    date_approved: Optional[date] = None
    status: Literal["Pending", "Approved", "Rejected", "Deferred"] = "Pending"
    notes: Optional[str] = None
    impacted_artifacts: List[str] = Field(default_factory=list)
