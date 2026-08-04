"""
Regulus MCP Adapters Package
============================
Exports MCP Adapter Clients for Airtable, Zoom, Slack, Jira, Figma, and GitHub.
"""

from app.mcp.base_mcp import BaseMCPAdapter
from app.mcp.airtable_mcp import AirtableMCPAdapter
from app.mcp.zoom_mcp import ZoomMCPAdapter
from app.mcp.slack_mcp import SlackMCPAdapter
from app.mcp.jira_mcp import JiraMCPAdapter
from app.mcp.figma_mcp import FigmaMCPAdapter
from app.mcp.github_mcp import GitHubMCPAdapter

__all__ = [
    "BaseMCPAdapter",
    "AirtableMCPAdapter",
    "ZoomMCPAdapter",
    "SlackMCPAdapter",
    "JiraMCPAdapter",
    "FigmaMCPAdapter",
    "GitHubMCPAdapter"
]
