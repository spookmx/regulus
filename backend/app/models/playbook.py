from __future__ import annotations
from datetime import date, datetime, timezone
from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from .common import User
from .decision import Decision

class Risk(BaseModel):
    id: str  # e.g., "RSK-001"
    date_identified: date
    description: str
    owner: User
    likelihood: int = Field(ge=1, le=5)
    impact: int = Field(ge=1, le=5)
    risk_score: Optional[float] = None
    status: Literal["Open", "Mitigated", "Accepted", "Closed"] = "Open"
    resolution_date: Optional[date] = None
    closure_notes: Optional[str] = None
    mitigation_plan: Optional[str] = None

    def model_post_init(self, __context):
        if self.risk_score is None:
            self.risk_score = float(self.likelihood * self.impact)

class Playbook(BaseModel):
    id: str  # e.g., "PLAY-ECGT"
    project_ref: str
    lrd_refs: List[str] = Field(default_factory=list)
    owner: User
    version: str = "1.0.0"
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    risk_register: List[Risk] = Field(default_factory=list)
    decision_log: List[Decision] = Field(default_factory=list)

