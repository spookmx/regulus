"""
Jira MCP Adapter Client (§7.4)
==============================
Adapter for Jira MCP integration.
Creates engineering tickets from PRD requirements, updates statuses, and links ticket IDs.
"""

from typing import Dict, Any, List
from app.mcp.base_mcp import BaseMCPAdapter


class JiraMCPAdapter(BaseMCPAdapter):
    def __init__(self):
        super().__init__(server_name="Jira", env_var_name="JIRA_MCP_URL")

    async def create_issue(self, prd_req: Dict[str, Any], project_code: str = "REG", regulation_code: str = "ECGT") -> Dict[str, Any]:
        """
        Creates Jira ticket from PRDRequirement per §7.4.
        Template:
          summary: "[{PRD_req_id}] {user_story_headline}"
          description: "{user_story}\n\nAcceptance Criteria:\n{acceptance_criteria}\n\nRegulus URN: {urn}\nBRD: {brd_refs}\nLRD: {lrd_refs}"
          labels: ["regulatory", "{regulation_code}", "{project_code}"]
        """
        req_id = prd_req.get("id", "PRD-REG-1.1.1")
        user_story = prd_req.get("user_story", "Compliance requirement")
        ac_str = "\n".join([f"- {ac}" for ac in prd_req.get("acceptance_criteria", [])])
        
        summary = f"[{req_id}] {user_story[:60]}..."
        description = (
            f"{user_story}\n\n"
            f"Acceptance Criteria:\n{ac_str}\n\n"
            f"Regulus URN: urn:regulus:prd_req:{req_id}\n"
            f"BRD Refs: {', '.join(prd_req.get('brd_refs', []))}\n"
            f"LRD Refs: {', '.join(prd_req.get('lrd_refs', []))}"
        )
        labels = ["regulatory", regulation_code.lower(), project_code.lower()]

        res = await self.call_rpc("create_issue", {
            "summary": summary,
            "description": description,
            "labels": labels,
            "issue_type": "Story"
        })
        return res

    async def update_issue_status(self, issue_id: str, status: str) -> Dict[str, Any]:
        """Updates Jira ticket status (e.g. Done -> syncs back to PRDRequirement.status)."""
        return await self.call_rpc("update_issue", {"issue_id": issue_id, "status": status})

    async def link_issue(self, prd_req_id: str, issue_id: str) -> Dict[str, Any]:
        """Binds Jira ticket ID to PRDRequirement.jira_links."""
        return await self.call_rpc("link_issue", {"prd_req_id": prd_req_id, "issue_id": issue_id})

    async def _execute_mock(self, method: str, params: Dict[str, Any]) -> Dict[str, Any]:
        if method == "create_issue":
            return {
                "issue_id": "REG-104",
                "key": "REG-104",
                "self": "https://jira.ebay.com/rest/api/2/issue/REG-104",
                "status": "Created"
            }
        elif method == "update_issue":
            return {"issue_id": params.get("issue_id"), "status": params.get("status"), "updated": True}
        elif method == "link_issue":
            return {"prd_req_id": params.get("prd_req_id"), "issue_id": params.get("issue_id"), "linked": True}
        return {"status": "ok", "method": method}
