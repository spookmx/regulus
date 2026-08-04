from __future__ import annotations
from datetime import datetime, timezone
from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from .common import User, Signoff, Approval

class Requirement(BaseModel):
    id: str  # e.g., "BR-001"
    obligation_refs: List[str] = Field(default_factory=list)
    text: str
    priority: Literal["Must", "Should", "Could"] = "Must"
    rationale: Optional[str] = None

class RiskDecision(BaseModel):
    id: str  # e.g., "RD-001"
    context: str
    legal_basis: str
    decision: str
    risk_accepted: bool = False
    sign_offs: List[Signoff] = Field(default_factory=list)

class BRDSections(BaseModel):
    purpose_scope: str
    customer_requirements: List[Requirement] = Field(default_factory=list)
    business_requirements: List[Requirement] = Field(default_factory=list)
    out_of_scope: str
    risk_decisions: List[RiskDecision] = Field(default_factory=list)
    dependencies: List[str] = Field(default_factory=list)

class BRD(BaseModel):
    id: str  # e.g., "BRD-ECGT-001"
    title: str
    lrd_refs: List[str] = Field(default_factory=list)
    regulation: str
    brd_owner: User
    legal_stakeholders: List[User] = Field(default_factory=list)
    bu_lead: User
    status: Literal["Draft", "Legal Review", "BU Review", "Approved", "Superseded"] = "Draft"
    version: str = "1.0.0"
    created: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    sections: BRDSections
    approvals: List[Approval] = Field(default_factory=list)

