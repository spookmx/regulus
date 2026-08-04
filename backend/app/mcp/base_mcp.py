"""
Base MCP Server Adapter Client
==============================
Provides dual operational mode:
  1. Real HTTP / SSE JSON-RPC 2.0 client targeting configurable env vars.
  2. Mock / Stub mode for local development when env vars are unset or pointing to localhost.
"""

import os
import json
import logging
import urllib.request
import urllib.error
import asyncio
from typing import Dict, Any, Optional

logger = logging.getLogger("regulus.mcp.base")


class BaseMCPAdapter:
    """Base class for all Regulus MCP Server Adapters."""

    def __init__(self, server_name: str, env_var_name: str, default_mock: bool = True):
        self.server_name = server_name
        self.env_var_name = env_var_name
        self.mcp_url = os.getenv(env_var_name, "").strip()
        
        # Determine operational mode
        force_mock = os.getenv("FORCE_MOCK_MCP", "false").lower() in ["true", "1", "yes"]
        
        if force_mock:
            self.is_mock = True
        elif not self.mcp_url:
            self.is_mock = True
        elif "localhost" in self.mcp_url or "127.0.0.1" in self.mcp_url:
            # Pointing to localhost without an explicit production endpoint
            self.is_mock = True
        else:
            self.is_mock = False

        mode_str = "MOCK / STUB MODE" if self.is_mock else f"REAL HTTP/SSE MODE ({self.mcp_url})"
        logger.info(f"[{self.server_name} MCP Adapter] Initialized in {mode_str}")

    async def call_rpc(self, method: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Executes a JSON-RPC method call on the MCP server or returns mock payload.
        """
        params = params or {}

        if self.is_mock:
            logger.info(f"[{self.server_name} MCP Mock] Executing '{method}' with params: {params}")
            return await self._execute_mock(method, params)

        # Real HTTP / SSE MCP RPC call
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": method,
            "params": params
        }
        
        logger.info(f"[{self.server_name} MCP Real] Posting '{method}' to {self.mcp_url}")

        def _do_http_request():
            req_data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                self.mcp_url,
                data=req_data,
                headers={"Content-Type": "application/json", "Accept": "application/json"}
            )
            try:
                with urllib.request.urlopen(req, timeout=10) as response:
                    res_body = response.read().decode("utf-8")
                    return json.loads(res_body)
            except urllib.error.URLError as e:
                logger.warning(f"[{self.server_name} MCP HTTP Error] {e}. Falling back to mock response.")
                return None

        # Execute in thread loop to avoid blocking async runtime
        result = await asyncio.to_thread(_do_http_request)
        if result is None:
            # Fallback to mock if HTTP endpoint is unreachable
            return await self._execute_mock(method, params)

        return result.get("result", result)

    async def _execute_mock(self, method: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Subclasses override this to return realistic sample responses."""
        raise NotImplementedError("Subclasses must implement _execute_mock()")
