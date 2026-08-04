from __future__ import annotations
from datetime import date, datetime, timezone
from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from .common import User

class DocumentRefs(BaseModel):
    lrd: List[str] = Field(default_factory=list)
    brd: List[str] = Field(default_factory=list)
    prd: Optional[str] = None
    playbook: Optional[str] = None
    milestone_plan: Optional[str] = None

class ArtifactStatuses(BaseModel):
    brd_status: Literal["Not Started", "In Draft", "In Review", "Approved"] = "Not Started"
    brd_date: Optional[date] = None
    prd_status: Literal["Not Started", "In Draft", "In Review", "Approved", "Delivered"] = "Not Started"
    prd_date: Optional[date] = None
    design_status: Literal["Not Started", "In Progress", "Complete"] = "Not Started"

class AirtableSync(BaseModel):
    base_id: str
    record_id: str
    last_synced: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    sync_status: Literal["Synced", "Conflict", "Pending"] = "Pending"


class Project(BaseModel):
    id: str  # e.g., "PROJ-ECGT"
    name: str
    regulation: List[str] = Field(default_factory=list)
    product_capability: List[str] = Field(default_factory=list)
    program: Optional[str] = None
    stack_rank: int = 1
    pm_lead: User
    pgm_lead: User
    bu_lead: User
    project_phase: Literal["Scoping", "Design", "Build", "Test", "Ramp", "Live", "Completed", "Cancelled"] = "Scoping"
    project_status: Literal["On Track", "At Risk", "Blocked", "Complete"] = "On Track"
    regulation_compliance_date: date
    lts_date: Optional[date] = None
    ramp_start: Optional[date] = None
    ramp_end: Optional[date] = None
    ramp_pct: Optional[float] = None
    document_refs: DocumentRefs = Field(default_factory=DocumentRefs)
    artifact_statuses: ArtifactStatuses = Field(default_factory=ArtifactStatuses)
    airtable_sync: Optional[AirtableSync] = None
    dependency_domains: List[str] = Field(default_factory=list)
    jira_tickets: List[str] = Field(default_factory=list)
    figma_links: List[str] = Field(default_factory=list)
