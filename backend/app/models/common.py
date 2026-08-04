from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field

class User(BaseModel):
    name: str
    email: str
    role: Optional[str] = None

class Signoff(BaseModel):
    approver: User
    role: str
    date: str  # ISO string or date representation

class Approval(BaseModel):
    approver: User
    role: str
    date: str
    confirmed_via: Optional[str] = "email"
