from __future__ import annotations
from datetime import date, datetime, timezone
from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from .common import User, Approval

class Obligation(BaseModel):
    id: str  # e.g., "OBL-LRD-2024-001-001"
    article: str  # e.g., "Article 3(1)(a)"
    text: str
    type: Literal["Display", "Disclosure", "Process", "Prohibition", "Reporting"]
    affected_surface: List[str] = Field(default_factory=list)
    notes: Optional[str] = None

class OpenQuestion(BaseModel):
    id: str
    question: str
    asked_by: User
    date_raised: date
    resolution: Optional[str] = None
    status: Literal["Open", "Resolved", "Escalated"] = "Open"

class LRDSections(BaseModel):
    legal_context: str
    obligations: List[Obligation] = Field(default_factory=list)
    ebay_applicability: str
    affected_categories: List[str] = Field(default_factory=list)
    exemptions: str
    open_legal_questions: List[OpenQuestion] = Field(default_factory=list)
    related_lrds: List[str] = Field(default_factory=list)

class LRD(BaseModel):
    id: str  # e.g., "LRD-2024-001"
    title: str
    regulation: str
    jurisdiction: List[str]
    enforcement_date: date
    grace_period_end: Optional[date] = None
    lrd_owner: User
    pm_owner: User
    status: Literal["Draft", "Legal Review", "Approved", "In Force", "Superseded"] = "Draft"
    version: str = "1.0.0"
    created: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    sections: LRDSections
    approvals: List[Approval] = Field(default_factory=list)

