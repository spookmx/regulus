from __future__ import annotations
from datetime import date
from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from .common import User

class WorkstreamItem(BaseModel):
    id: str  # e.g., "WS-001"
    workstream: Literal[
        "Policy", "Legal", "Product", "Engineering", "Design", "UX",
        "QA", "E2E Testing", "GCX", "Communications", "Rollout"
    ]
    workstream_group: str  # e.g., "70: E2E Testing"
    milestone: str  # e.g., "PRD Complete"
    deliverables: str
    mandatory_milestone: bool = True
    primary_poc: User
    start_date: date
    end_date: date
    status: Literal["Not Started", "In Progress", "Complete", "At Risk", "Blocked"] = "Not Started"
    pdlc_phase: Literal["Scoping", "Design", "Build", "Test", "Ramp", "Live"] = "Scoping"
    notes: Optional[str] = None

class MilestonePlan(BaseModel):
    id: str  # e.g., "MPLAN-ECGT"
    project_ref: str
    workstreams: List[WorkstreamItem] = Field(default_factory=list)
