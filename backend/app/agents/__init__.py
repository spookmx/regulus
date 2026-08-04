"""
Regulus Agents Package
======================
Exports Agent Runner, Registry, and all built-in Agent Modules.
"""

from app.agents.runner import BaseAgent, AgentRegistry, HAS_ANTIGRAVITY
from app.agents.lrd_agent import LRDDraftingAgent
from app.agents.brd_agent import BRDDraftingAgent
from app.agents.prd_agent import PRDDraftingAgent
from app.agents.change_agent import ChangeDetectionAgent
from app.agents.cascade_agent import CascadeProposalAgent
from app.agents.decision_agent import DecisionExtractionAgent

__all__ = [
    "BaseAgent",
    "AgentRegistry",
    "HAS_ANTIGRAVITY",
    "LRDDraftingAgent",
    "BRDDraftingAgent",
    "PRDDraftingAgent",
    "ChangeDetectionAgent",
    "CascadeProposalAgent",
    "DecisionExtractionAgent"
]
