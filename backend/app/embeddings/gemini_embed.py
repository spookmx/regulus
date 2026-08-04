import os
import math
from typing import List, Optional, Tuple, Dict, Any

try:
    from google import genai
    from google.genai import types
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

class GeminiEmbeddingWrapper:
    def __init__(self, api_key: Optional[str] = None, model: str = "text-embedding-004"):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.model = model
        self._client = None

    def get_client(self):
        if not HAS_GENAI:
            raise RuntimeError("google-genai library is not installed.")
        if self._client is None:
            if self.api_key:
                self._client = genai.Client(api_key=self.api_key)
            else:
                # Default client initialization using environment credentials
                self._client = genai.Client()
        return self._client

    def get_embedding(self, text: str) -> List[float]:
        """Fetch embedding vector for input text from Gemini API."""
        if not self.api_key and not os.getenv("GEMINI_API_KEY"):
            # Mock deterministic fallback for offline testing
            return self._mock_embedding(text)

        client = self.get_client()
        response = client.models.embed_content(
            model=self.model,
            contents=text,
        )
        if hasattr(response, "embeddings") and response.embeddings:
            return response.embeddings[0].values
        elif isinstance(response, dict) and "embedding" in response:
            return response["embedding"]
        else:
            raise ValueError("Unexpected response structure from Gemini embed_content API")

    @staticmethod
    def _mock_embedding(text: str, dim: int = 128) -> List[float]:
        """Generates a deterministic pseudo-vector based on character hash for testing."""
        seed = sum(ord(c) for c in text)
        vec = [math.sin(seed + i) for i in range(dim)]
        norm = math.sqrt(sum(x * x for x in vec))
        return [x / norm for x in vec] if norm > 0 else vec

    @staticmethod
    def cosine_similarity(v1: List[float], v2: List[float]) -> float:
        """Compute cosine similarity between two embedding vectors."""
        if len(v1) != len(v2):
            raise ValueError(f"Vector dimensions do not match: {len(v1)} vs {len(v2)}")
        
        dot_product = sum(a * b for a, b in zip(v1, v2))
        norm_a = math.sqrt(sum(a * a for a in v1))
        norm_b = math.sqrt(sum(b * b for b in v2))
        
        if norm_a == 0 or norm_b == 0:
            return 0.0
            
        return dot_product / (norm_a * norm_b)

    def compute_semantic_diff(self, text1: str, text2: str) -> Tuple[float, float]:
        """
        Computes cosine similarity and semantic distance (1 - similarity) between two texts.
        Returns tuple: (cosine_similarity, semantic_distance)
        """
        if text1.strip() == text2.strip():
            return 1.0, 0.0

        v1 = self.get_embedding(text1)
        v2 = self.get_embedding(text2)
        
        similarity = self.cosine_similarity(v1, v2)
        distance = max(0.0, 1.0 - similarity)
        return round(similarity, 4), round(distance, 4)

    @staticmethod
    def classify_severity(distance: float) -> str:
        """
        Classifies change severity based on semantic distance (1 - cosine_similarity)
        per regulus-mvp.md §6.4 & §9:
          Minor    (< 0.05): cosmetic fix -> no cascade, log only
          Moderate (0.05-0.20): content update -> cascade proposed, normal urgency
          Major    (0.20-0.40): structural change -> cascade required, HITL gate
          Critical (> 0.40): fundamental change -> immediate HITL + Slack alert
        """
        if distance < 0.05:
            return "Minor"
        elif distance <= 0.20:
            return "Moderate"
        elif distance <= 0.40:
            return "Major"
        else:
            return "Critical"
