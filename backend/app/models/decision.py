from __future__ import annotations
from datetime import date
from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from .common import User
from .action_item import ActionItem

class Decision(BaseModel):
    id: str  # e.g., "DEC-2026-001" or "DEC-001"
    text: Optional[str] = None
    decision_text: Optional[str] = None
    legal_basis: Optional[str] = None
    type: Optional[Literal["RiskBased", "Policy", "Scope", "Operational"]] = "Policy"
    context: Optional[str] = None
    status: Literal["Proposed", "Open", "Under Review", "Made", "Ratified", "Reviewed", "Superseded"] = "Open"
    decision_date: Optional[date] = None
    decision_maker: Optional[User] = None
    pm_owner: Optional[User] = None
    bu_owner: Optional[User] = None
    workstream_project: Optional[str] = None
    regulation: Optional[List[str]] = Field(default_factory=list)
    forum: Optional[Literal["Reg Leads", "BU Review", "Legal Review", "Exec", "Async"]] = None
    approvers: List[User] = Field(default_factory=list)
    informed: List[User] = Field(default_factory=list)
    rationale: Optional[str] = None
    related_risks: List[str] = Field(default_factory=list)
    action_items: List[ActionItem] = Field(default_factory=list)
    documentation_links: List[str] = Field(default_factory=list)
    notes: Optional[str] = None
