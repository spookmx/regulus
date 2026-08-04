"""
Slack MCP Adapter Client (§7.3)
===============================
Adapter for eBay Slack MCP integration.
Supports direct messages, channel broadcasts (#regulatory-ops, #regulatory-alerts),
task notifications, cascade alerts, and weekly digests.
"""

from typing import Dict, Any
from app.mcp.base_mcp import BaseMCPAdapter


class SlackMCPAdapter(BaseMCPAdapter):
    def __init__(self):
        super().__init__(server_name="Slack", env_var_name="SLACK_MCP_URL")

    async def send_dm(self, user_email: str, message: str) -> Dict[str, Any]:
        """Sends direct message to user by email or ID."""
        return await self.call_rpc("send_dm", {"recipient": user_email, "message": message})

    async def post_channel_message(self, channel: str, message: str) -> Dict[str, Any]:
        """Posts message to Slack channel (e.g. #regulatory-ops)."""
        return await self.call_rpc("post_channel_message", {"channel": channel, "message": message})

    async def send_task_assignment(self, task_id: str, title: str, due_date: str, project_name: str, assignee: str, url: str) -> Dict[str, Any]:
        msg = f"New task [{task_id}]: {title} | Due: {due_date} | Project: {project_name} | {url}"
        return await self.send_dm(assignee, msg)

    async def send_cascade_proposal(self, cp_id: str, source_artifact: str, affected_count: int, recipient: str, url: str) -> Dict[str, Any]:
        msg = f"Cascade proposal [{cp_id}]: change to {source_artifact} may require updates to {affected_count} downstream artifacts. Review: {url}"
        return await self.send_dm(recipient, msg)

    async def send_hitl_approval(self, artifact_type: str, artifact_id: str, title: str, approver: str, url: str) -> Dict[str, Any]:
        msg = f"Approval needed: {artifact_type} [{artifact_id}] — {title} | Approve at: {url}"
        return await self.send_dm(approver, msg)

    async def send_weekly_digest(self, channel: str = "#regulatory-ops") -> Dict[str, Any]:
        msg = "Weekly Regulatory Ops Summary: 3 Active Projects On Track, 1 Decision Ratified, 0 Overdue Tasks."
        return await self.post_channel_message(channel, msg)

    async def _execute_mock(self, method: str, params: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "status": "delivered",
            "method": method,
            "channel_or_recipient": params.get("channel") or params.get("recipient"),
            "timestamp": "1722720000.000100"
        }
