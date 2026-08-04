"""
Antigravity Agent Runtime Engine - Base Agent Runner & Fallback Shim
=====================================================================
Supports Google Antigravity Agent framework with graceful fallback shim
to standard Python async agent pipelines if the Antigravity SDK is not locally installed.
"""

import sys
import logging
import asyncio
from typing import Dict, Any, Optional, Type, List, Callable
from datetime import datetime

logger = logging.getLogger("regulus.agents.runner")
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

# Antigravity SDK Import & Fallback Detection
HAS_ANTIGRAVITY = False
AntigravityAgentClass = object

try:
    import antigravity
    if hasattr(antigravity, "Agent"):
        AntigravityAgentClass = antigravity.Agent
        HAS_ANTIGRAVITY = True
        logger.info("Google Antigravity SDK detected and active.")
except ImportError:
    try:
        import google.antigravity as antigravity
        if hasattr(antigravity, "Agent"):
            AntigravityAgentClass = antigravity.Agent
            HAS_ANTIGRAVITY = True
            logger.info("Google Antigravity SDK (google.antigravity) detected and active.")
    except ImportError:
        HAS_ANTIGRAVITY = False
        logger.info("Google Antigravity SDK not found locally. Running with Async Python Fallback Shim.")


class BaseAgent:
    """
    Base Agent specification for Regulus Agents.
    Inherits from Antigravity Agent when available, or provides native async fallback pipeline.
    """
    name: str = "base_agent"
    description: str = "Base Regulus Agent"

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.has_antigravity = HAS_ANTIGRAVITY
        self.execution_logs: List[Dict[str, Any]] = []

    def log(self, message: str, level: str = "INFO", meta: Optional[Dict[str, Any]] = None):
        entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "agent": self.name,
            "level": level,
            "message": message,
            "meta": meta or {}
        }
        self.execution_logs.append(entry)
        logger.log(getattr(logging, level.upper(), logging.INFO), f"[{self.name}] {message}")

    async def pre_process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Lifecycle hook executed before agent processing."""
        self.log(f"Pre-processing input for agent {self.name}")
        return input_data

    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Core agent processing logic to be overridden by subclasses."""
        raise NotImplementedError("Subclasses must implement process()")

    async def post_process(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Lifecycle hook executed after agent processing."""
        result["_metadata"] = {
            "agent_name": self.name,
            "antigravity_active": self.has_antigravity,
            "executed_at": datetime.utcnow().isoformat() + "Z",
            "logs_count": len(self.execution_logs)
        }
        self.log(f"Post-processing complete for agent {self.name}")
        return result

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes the full agent pipeline (pre_process -> process -> post_process).
        Uses Antigravity SDK framework if present, else fallback shim.
        """
        self.execution_logs.clear()
        self.log(f"Starting execution of {self.name} (Antigravity SDK={self.has_antigravity})")

        try:
            cleaned_input = await self.pre_process(input_data)
            
            if self.has_antigravity and hasattr(self, "_execute_antigravity"):
                raw_result = await getattr(self, "_execute_antigravity")(cleaned_input)
            else:
                raw_result = await self.process(cleaned_input)
                
            final_result = await self.post_process(raw_result)
            return final_result
        except Exception as e:
            self.log(f"Execution error in {self.name}: {str(e)}", level="ERROR")
            raise


class AgentRegistry:
    """Registry to register, discover, and execute Regulus Agents."""
    _agents: Dict[str, BaseAgent] = {}

    @classmethod
    def register(cls, agent_cls: Type[BaseAgent], config: Optional[Dict[str, Any]] = None) -> BaseAgent:
        instance = agent_cls(config=config)
        cls._agents[instance.name] = instance
        logger.info(f"Registered agent: {instance.name}")
        return instance

    @classmethod
    def get(cls, name: str) -> Optional[BaseAgent]:
        return cls._agents.get(name)

    @classmethod
    def list_agents(cls) -> List[str]:
        return list(cls._agents.keys())

    @classmethod
    async def run_agent(cls, name: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        agent = cls.get(name)
        if not agent:
            raise KeyError(f"Agent '{name}' is not registered in AgentRegistry. Available: {cls.list_agents()}")
        return await agent.execute(input_data)
