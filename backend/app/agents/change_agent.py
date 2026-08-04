"""
Change Detection Agent (§6.4)
=============================
Computes semantic diff cosine similarity between original and updated artifact text,
classifies change severity (Minor, Moderate, Major, Critical), and generates change summaries.
"""

import re
import math
from collections import Counter
from datetime import datetime
from typing import Dict, Any, List
from app.agents.runner import BaseAgent, AgentRegistry


class ChangeDetectionAgent(BaseAgent):
    name = "change_agent"
    description = "Semantic Diff & Change Detection Agent"

    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Input format:
        {
            "artifact_urn": "urn:regulus:lrd:LRD-2026-001",
            "original_text": "Article 3(1)(a): Online marketplaces must display verified eco-certificates...",
            "updated_text": "Article 3(1)(a): Online marketplaces must display verified eco-certificates AND mandate third-party lab verification for high-risk categories within 30 days...",
            "context_type": "LRD_Obligation_Update"
        }
        """
        artifact_urn = input_data.get("artifact_urn", "urn:regulus:artifact:001")
        original_text = input_data.get("original_text", "")
        updated_text = input_data.get("updated_text", "")

        self.log(f"Computing semantic diff for {artifact_urn}")

        # 1. Compute cosine similarity
        similarity = self._compute_cosine_similarity(original_text, updated_text)

        # 2. Check critical keyword triggers
        critical_triggered, trigger_reason = self._check_critical_triggers(original_text, updated_text)

        # 3. Classify severity
        if critical_triggered or similarity < 0.50:
            severity = "Critical"
        elif similarity < 0.70:
            severity = "Major"
        elif similarity < 0.85:
            severity = "Moderate"
        else:
            severity = "Minor"

        # 4. Generate structured change summary
        summary = self._generate_summary(original_text, updated_text, similarity, severity, trigger_reason)

        change_record = {
            "artifact_urn": artifact_urn,
            "detected_at": datetime.utcnow().isoformat() + "Z",
            "similarity_score": round(similarity, 4),
            "severity": severity,
            "summary": summary,
            "critical_flag": critical_triggered,
            "trigger_reason": trigger_reason
        }

        return {
            "status": "success",
            "change_record": change_record
        }

    def _compute_cosine_similarity(self, text1: str, text2: str) -> float:
        """Computes text term-frequency cosine similarity fallback shim."""
        if text1 == text2:
            return 1.0
        if not text1 or not text2:
            return 0.0

        def tokenize(text: str) -> List[str]:
            return re.findall(r'\w+', text.lower())

        words1 = tokenize(text1)
        words2 = tokenize(text2)

        vec1 = Counter(words1)
        vec2 = Counter(words2)

        intersection = set(vec1.keys()) & set(vec2.keys())
        dot_product = sum(vec1[x] * vec2[x] for x in intersection)

        sum1 = sum(v ** 2 for v in vec1.values())
        sum2 = sum(v ** 2 for v in vec2.values())
        magnitude = math.sqrt(sum1) * math.sqrt(sum2)

        if not magnitude:
            return 0.0

        return dot_product / magnitude

    def _check_critical_triggers(self, text1: str, text2: str) -> tuple[bool, str]:
        t1_lower = text1.lower()
        t2_lower = text2.lower()

        # Enforcement date changes
        date_pattern = r'\b20\d{2}-\d{2}-\d{2}\b|\b\d{1,2}/\d{1,2}/20\d{2}\b'
        dates1 = set(re.findall(date_pattern, text1))
        dates2 = set(re.findall(date_pattern, text2))

        if dates1 != dates2 and dates2:
            return True, f"Enforcement date shift detected: {dates1} -> {dates2}"

        # Mandate additions or deletions
        critical_words = ["prohibit", "ban", "mandatory", "sanction", "penalty", "audit", "fine"]
        added_critical = [w for w in critical_words if w in t2_lower and w not in t1_lower]
        if added_critical:
            return True, f"New critical compliance terms introduced: {', '.join(added_critical)}"

        return False, ""

    def _generate_summary(self, text1: str, text2: str, sim: float, severity: str, trigger_reason: str) -> str:
        if trigger_reason:
            return f"[{severity}] Critical regulatory update: {trigger_reason} (Similarity: {sim:.2f})"
        return f"[{severity}] Text modified with similarity score {sim:.2f}. Length delta: {len(text2) - len(text1)} chars."


# Register agent
AgentRegistry.register(ChangeDetectionAgent)
