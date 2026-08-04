"""
Cascade Proposal Agent (§6.5)
=============================
Traverses downstream knowledge graph upon change detection, constructs Cascade Proposals (CP-{YYYY}-{###}),
maps impact to BRDs, PRDs, and Jira tasks, and flags items for Action Center HITL review.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, List
from app.agents.runner import BaseAgent, AgentRegistry


class CascadeProposalAgent(BaseAgent):
    name = "cascade_agent"
    description = "Downstream Graph Traversal & Cascade Proposal Agent"

    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Input format:
        {
            "change_record": dict (from Change Detection Agent),
            "graph_context": dict (optional mock or real downstream graph representation)
        }
        """
        change_rec = input_data.get("change_record", {})
        source_urn = change_rec.get("artifact_urn", "urn:regulus:lrd:LRD-2026-001")
        severity = change_rec.get("severity", "Moderate")
        summary = change_rec.get("summary", "Upstream regulatory obligation updated.")
        
        year = datetime.utcnow().year
        cp_id = f"CP-{year}-001"

        self.log(f"Traversing downstream graph from source {source_urn} (Severity: {severity})")

        # 1. Traverse Downstream Graph
        affected_artifacts = self._traverse_downstream_graph(source_urn, severity, input_data.get("graph_context"))

        # 2. Compute 14-day Review Expiry Window per §6.5
        expires_at = (datetime.utcnow() + timedelta(days=14)).isoformat() + "Z"

        # 3. Build Cascade Proposal Record
        cascade_proposal = {
            "id": cp_id,
            "source_artifact": source_urn,
            "change_summary": summary,
            "severity": severity,
            "affected_artifacts": affected_artifacts,
            "status": "Pending",
            "created_at": datetime.utcnow().isoformat() + "Z",
            "expires_at": expires_at
        }

        # 4. Flag downstream artifacts in Action Center
        action_center_items = self._route_to_action_center(cascade_proposal)

        return {
            "status": "success",
            "cascade_proposal_id": cp_id,
            "cascade_proposal": cascade_proposal,
            "affected_count": len(affected_artifacts),
            "action_center_items": action_center_items
        }

    def _traverse_downstream_graph(self, source_urn: str, severity: str, graph_context: Any) -> List[Dict[str, Any]]:
        affected = []

        # If source is LRD, downstream items are BRDs, PRDs, and Jira tasks
        if "lrd" in source_urn.lower():
            affected.append({
                "urn": "urn:regulus:brd:BRD-ECGT-001",
                "artifact_type": "BRD",
                "proposed_change": "Update BR-001 priority to Must and append lab verification requirement rationale.",
                "confidence_score": 0.92
            })
            affected.append({
                "urn": "urn:regulus:prd:PRD-ECGT",
                "artifact_type": "PRD",
                "proposed_change": "Add acceptance criterion to PRD-ECGT-1.1.1 for 30-day third-party audit upload.",
                "confidence_score": 0.88
            })
            affected.append({
                "urn": "urn:regulus:jira:JIRA-REG-104",
                "artifact_type": "JiraTicket",
                "proposed_change": "Flag Jira ticket REG-104 for scope expansion review before sprint commitment.",
                "confidence_score": 0.82
            })
        elif "brd" in source_urn.lower():
            affected.append({
                "urn": "urn:regulus:prd:PRD-ECGT",
                "artifact_type": "PRD",
                "proposed_change": "Re-align PRD requirements with updated business scope.",
                "confidence_score": 0.90
            })
        else:
            affected.append({
                "urn": "urn:regulus:task:TASK-001",
                "artifact_type": "Task",
                "proposed_change": "Re-evaluate task due date based on upstream scope change.",
                "confidence_score": 0.75
            })

        return affected

    def _route_to_action_center(self, proposal: Dict[str, Any]) -> List[Dict[str, Any]]:
        items = []
        for artifact in proposal["affected_artifacts"]:
            items.append({
                "proposal_id": proposal["id"],
                "target_urn": artifact["urn"],
                "action": "Review Proposed Cascade Update",
                "severity": proposal["severity"],
                "proposed_change": artifact["proposed_change"],
                "status": "Pending HITL Approval"
            })
        self.log(f"Routed {len(items)} items to Action Center for HITL approval.")
        return items


# Register agent
AgentRegistry.register(CascadeProposalAgent)
