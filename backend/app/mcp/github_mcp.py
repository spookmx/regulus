"""
GitHub MCP Adapter Client (§7.5)
================================
Adapter for GitHub MCP integration.
Links PRs/commits to Jira tickets and enables code -> ticket -> requirement traceability.
"""

from typing import Dict, Any
from app.mcp.base_mcp import BaseMCPAdapter


class GitHubMCPAdapter(BaseMCPAdapter):
    def __init__(self):
        super().__init__(server_name="GitHub", env_var_name="GITHUB_MCP_URL")

    async def get_pull_request(self, repo: str, pr_number: int) -> Dict[str, Any]:
        """Fetches PR status, author, and linked commits."""
        return await self.call_rpc("get_pull_request", {"repo": repo, "pr_number": pr_number})

    async def get_commit(self, repo: str, commit_sha: str) -> Dict[str, Any]:
        """Fetches commit message, author, and touched files."""
        return await self.call_rpc("get_commit", {"repo": repo, "commit_sha": commit_sha})

    async def link_pr_to_jira(self, pr_url: str, jira_id: str) -> Dict[str, Any]:
        """Links GitHub PR to JiraTicket node for end-to-end traceability."""
        return await self.call_rpc("link_pr_to_jira", {"pr_url": pr_url, "jira_id": jira_id})

    async def _execute_mock(self, method: str, params: Dict[str, Any]) -> Dict[str, Any]:
        if method == "get_pull_request":
            return {
                "repo": params.get("repo", "ebay/regulus-compliance-service"),
                "pr_number": params.get("pr_number", 402),
                "title": "feat(ecgt): Implement VIP badge disclosure component",
                "state": "merged",
                "merged_at": "2026-08-03T11:00:00Z",
                "author": "developer1@ebay.com",
                "jira_tickets": ["REG-104"]
            }
        elif method == "get_commit":
            return {
                "repo": params.get("repo", "ebay/regulus-compliance-service"),
                "sha": params.get("commit_sha", "a1b2c3d4e5f6"),
                "message": "fix(ecgt): Add third-party lab verification badge validation",
                "files_changed": ["src/components/VipBadge.tsx", "src/services/AuditClient.ts"]
            }
        elif method == "link_pr_to_jira":
            return {
                "pr_url": params.get("pr_url"),
                "jira_id": params.get("jira_id"),
                "linked": True
            }
        return {"status": "ok", "method": method}
