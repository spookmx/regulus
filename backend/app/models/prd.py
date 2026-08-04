from __future__ import annotations
from datetime import datetime, timezone
from typing import List, Optional, Literal
from pydantic import BaseModel, Field, ConfigDict
from .common import User

class PRDRequirement(BaseModel):
    id: str  # e.g., "PRD-001-1.1.1"
    user_story: str
    brd_refs: List[str] = Field(default_factory=list)
    lrd_refs: List[str] = Field(default_factory=list)
    acceptance_criteria: List[str] = Field(default_factory=list)
    notes_dependencies: Optional[str] = None
    jira_links: List[str] = Field(default_factory=list)
    status: Literal["Draft", "Approved", "In Dev", "Done", "Deferred"] = "Draft"

class PRDSections(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    section_1_1_compliance: List[PRDRequirement] = Field(default_factory=list, alias="1_1_compliance")
    section_1_2_enhancements: List[PRDRequirement] = Field(default_factory=list, alias="1_2_enhancements")
    section_2_deferred: List[PRDRequirement] = Field(default_factory=list, alias="2_deferred")

class PRD(BaseModel):
    id: str  # e.g., "PRD-ECGT"
    title: str
    brd_ref: str
    lrd_refs: List[str] = Field(default_factory=list)
    prd_owner: User
    eng_lead: Optional[User] = None
    ux_lead: Optional[User] = None
    status: Literal["Draft", "PM Review", "Eng Review", "Approved", "Delivered", "Deferred"] = "Draft"
    version: str = "1.0.0"
    created: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    sections: PRDSections


class SubPRD(BaseModel):
    id: str  # e.g., "SPRD-ECGT-001"
    title: str
    parent_prd: str
    scope: str
    requirements: List[PRDRequirement] = Field(default_factory=list)
    tech_notes: Optional[str] = None
    ux_notes: Optional[str] = None
    status: Literal["Draft", "Approved", "Delivered", "Deferred"] = "Draft"
