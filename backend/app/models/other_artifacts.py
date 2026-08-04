from __future__ import annotations
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field
from .common import User

class Factsheet(BaseModel):
    id: str  # e.g. "FACT-ECGT"
    title: str
    lrd_refs: List[str] = Field(default_factory=list)
    brd_refs: List[str] = Field(default_factory=list)
    owner: User
    content: str
    status: str = "Draft"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ImpactAssessment(BaseModel):
    id: str  # e.g. "IA-ECGT"
    title: str
    lrd_ref: str
    owner: User
    summary: str
    impacted_areas: List[str] = Field(default_factory=list)
    status: str = "Draft"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CategoryEligibility(BaseModel):
    id: str  # e.g. "CATQ-ECGT"
    title: str
    lrd_ref: str
    owner: User
    categories_in_scope: List[str] = Field(default_factory=list)
    eligibility_criteria: str
    status: str = "Draft"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ResearchFindings(BaseModel):
    id: str  # e.g. "RES-ECGT"
    title: str
    author: User
    summary: str
    findings: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PolicyBrief(BaseModel):
    id: str  # e.g. "POLB-ECGT"
    title: str
    lrd_ref: str
    owner: User
    policy_analysis: str
    recommendations: str
    status: str = "Draft"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GTMBrief(BaseModel):
    id: str  # e.g. "GTM-ECGT"
    title: str
    prd_ref: str
    owner: User
    launch_strategy: str
    target_markets: List[str] = Field(default_factory=list)
    status: str = "Draft"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class L10NBrief(BaseModel):
    id: str  # e.g. "L10N-ECGT"
    title: str
    prd_ref: str
    owner: User
    locales: List[str] = Field(default_factory=list)
    translation_scope: str
    status: str = "Draft"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductOverview(BaseModel):
    id: str  # e.g. "DECK-ECGT"
    title: str
    artifact_refs: List[str] = Field(default_factory=list)
    owner: User
    deck_url: str
    status: str = "Draft"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

