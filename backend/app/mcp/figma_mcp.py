"""
Figma MCP Adapter Client (§7.5)
===============================
Adapter for Figma MCP integration.
Links Figma design files to PRD/Sub-PRD requirements and surfaces design status.
"""

from typing import Dict, Any
from app.mcp.base_mcp import BaseMCPAdapter


class FigmaMCPAdapter(BaseMCPAdapter):
    def __init__(self):
        super().__init__(server_name="Figma", env_var_name="FIGMA_MCP_URL")

    async def get_file_info(self, file_key: str) -> Dict[str, Any]:
        """Fetches Figma file metadata, version, and component node states."""
        return await self.call_rpc("get_file", {"file_key": file_key})

    async def link_figma_file(self, prd_id: str, file_url: str) -> Dict[str, Any]:
        """Links Figma file URL/ID to PRD or Sub-PRD."""
        return await self.call_rpc("link_file", {"prd_id": prd_id, "file_url": file_url})

    async def get_design_status(self, file_key: str) -> Dict[str, Any]:
        """Surfaces UI/UX design review status for Project Detail view."""
        return await self.call_rpc("get_design_status", {"file_key": file_key})

    async def _execute_mock(self, method: str, params: Dict[str, Any]) -> Dict[str, Any]:
        file_key = params.get("file_key", "figma-file-abc12345")
        
        if method == "get_file":
            return {
                "file_key": file_key,
                "name": "EU Green Claims (ECGT) VIP Disclosures & Tooltips UI",
                "last_modified": "2026-08-02T18:30:00Z",
                "thumbnail_url": "https://figma.com/file/thumbnail.png",
                "version": "4.2"
            }
        elif method == "get_design_status":
            return {
                "file_key": file_key,
                "status": "Approved by UX & Legal",
                "components_count": 8,
                "review_completed": True
            }
        elif method == "link_file":
            return {
                "prd_id": params.get("prd_id"),
                "file_url": params.get("file_url"),
                "status": "linked"
            }
        return {"status": "ok", "method": method}
