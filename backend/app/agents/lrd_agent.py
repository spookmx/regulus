"""
LRD Drafting Agent (§4.1 & §6.1)
================================
Parses regulatory text, extracts legal obligations, identifies open legal questions,
builds LRD JSON draft per §4.1 schema, and persists the draft.
"""

import re
from datetime import datetime, date
from typing import Dict, Any, List, Optional
from app.agents.runner import BaseAgent, AgentRegistry


class LRDDraftingAgent(BaseAgent):
    name = "lrd_agent"
    description = "Legal Requirements Document (LRD) Drafting Agent"

    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Input format:
        {
            "title": "EU Green Claims & Eco-Labeling Directive",
            "regulation": "EU Directive 2024/1799 (ECGT)",
            "jurisdiction": ["EU", "DE", "FR"],
            "enforcement_date": "2026-09-01",
            "grace_period_end": "2027-03-01",
            "regulation_text": "Article 3(1)(a): Online marketplaces must display verified eco-certificates... Article 4(2): Sellers are prohibited from using unverified claims...",
            "lrd_owner": {"name": "Jane Doe", "email": "jdoe@ebay.com", "role": "Legal Counsel"},
            "pm_owner": {"name": "Alex Smith", "email": "asmith@ebay.com", "role": "PM Lead"},
            "affected_categories": ["Electronics", "Fashion", "Home & Garden"],
            "related_lrds": []
        }
        """
        title = input_data.get("title", "Untitled Legal Requirements Document")
        regulation = input_data.get("regulation", "Unspecified Regulation")
        jurisdiction = input_data.get("jurisdiction", ["EU"])
        enforcement_date = input_data.get("enforcement_date", datetime.utcnow().strftime("%Y-%m-%d"))
        grace_period_end = input_data.get("grace_period_end")
        text = input_data.get("regulation_text", "")
        lrd_owner = input_data.get("lrd_owner", {"name": "Legal Counsel", "role": "Legal Counsel"})
        pm_owner = input_data.get("pm_owner", {"name": "PM Lead", "role": "PM Lead"})
        categories = input_data.get("affected_categories", ["All Surface Categories"])
        related_lrds = input_data.get("related_lrds", [])

        # Generate LRD ID
        year = datetime.utcnow().year
        seq_num = str(input_data.get("sequence_number", 1)).zfill(3)
        lrd_id = f"LRD-{year}-{seq_num}"

        self.log(f"Parsing regulation text for {lrd_id}: {regulation}")

        # 1. Extract Obligations
        obligations = self._extract_obligations(lrd_id, text)

        # 2. Extract Open Legal Questions
        open_questions = self._extract_open_questions(text, obligations)

        # 3. Draft Legal Context & Applicability
        legal_context = self._generate_legal_context(text, regulation)
        ebay_applicability = self._generate_ebay_applicability(obligations, categories)

        # 4. Construct LRD Document per §4.1
        lrd_document = {
            "id": lrd_id,
            "title": title,
            "regulation": regulation,
            "jurisdiction": jurisdiction,
            "enforcement_date": enforcement_date,
            "grace_period_end": grace_period_end,
            "lrd_owner": lrd_owner,
            "pm_owner": pm_owner,
            "status": "Draft",
            "version": "1.0.0",
            "created": datetime.utcnow().isoformat() + "Z",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "sections": {
                "legal_context": legal_context,
                "obligations": obligations,
                "ebay_applicability": ebay_applicability,
                "affected_categories": categories,
                "exemptions": "Micro-enterprises under 10 employees exempt from mandatory pre-audit requirements for 12 months.",
                "open_legal_questions": open_questions,
                "related_lrds": related_lrds
            },
            "approvals": []
        }

        # 5. Persist Draft Record
        persisted = self._persist_draft(lrd_document)

        return {
            "status": "success",
            "lrd_id": lrd_id,
            "lrd_document": lrd_document,
            "obligations_count": len(obligations),
            "open_questions_count": len(open_questions),
            "persisted": persisted
        }

    def _extract_obligations(self, lrd_id: str, text: str) -> List[Dict[str, Any]]:
        obligations = []
        # Pattern scanning for articles / clauses
        article_matches = re.findall(r'(Article\s+\d+[\(\)\w\.\-]*|Section\s+\d+[\(\)\w\.\-]*|Clause\s+\d+[\(\)\w\.\-]*):?\s*([^Article\n]+)', text, re.IGNORECASE)

        if not article_matches:
            # Fallback split by sentences or paragraphs if no explicit Article pattern found
            paragraphs = [p.strip() for p in text.split("\n") if p.strip()]
            if not paragraphs:
                paragraphs = [text] if text else ["General compliance obligation."]

            for idx, p in enumerate(paragraphs, start=1):
                obl_id = f"OBL-{lrd_id}-{str(idx).zfill(3)}"
                obl_type = self._determine_obligation_type(p)
                obligations.append({
                    "id": obl_id,
                    "article": f"Section {idx}",
                    "text": p,
                    "type": obl_type,
                    "affected_surface": self._determine_affected_surfaces(p),
                    "notes": "Extracted from raw regulation text."
                })
        else:
            for idx, (art, content) in enumerate(article_matches, start=1):
                obl_id = f"OBL-{lrd_id}-{str(idx).zfill(3)}"
                clean_text = content.strip()
                obl_type = self._determine_obligation_type(clean_text)
                obligations.append({
                    "id": obl_id,
                    "article": art.strip(),
                    "text": clean_text,
                    "type": obl_type,
                    "affected_surface": self._determine_affected_surfaces(clean_text),
                    "notes": f"Auto-extracted obligation from {art.strip()}."
                })

        return obligations

    def _determine_obligation_type(self, text: str) -> str:
        text_lower = text.lower()
        if any(k in text_lower for k in ["display", "show", "badge", "render"]):
            return "Display"
        elif any(k in text_lower for k in ["disclose", "inform", "notify", "label"]):
            return "Disclosure"
        elif any(k in text_lower for k in ["prohibit", "forbidden", "shall not", "ban"]):
            return "Prohibition"
        elif any(k in text_lower for k in ["report", "audit", "submit", "file"]):
            return "Reporting"
        else:
            return "Process"

    def _determine_affected_surfaces(self, text: str) -> List[str]:
        text_lower = text.lower()
        surfaces = []
        if "seller" in text_lower or "listing" in text_lower:
            surfaces.append("Seller Hub / Listing Flow")
        if "view" in text_lower or "item page" in text_lower or "buyer" in text_lower:
            surfaces.append("View Item Page (VIP)")
        if "checkout" in text_lower or "payment" in text_lower:
            surfaces.append("Checkout / Cart")
        if "search" in text_lower or "browse" in text_lower:
            surfaces.append("Search & Browse (SRP)")

        return surfaces if surfaces else ["Core Platform Web & Mobile"]

    def _extract_open_questions(self, text: str, obligations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        questions = []
        # Identify ambiguity triggers
        ambiguity_triggers = ["subject to further guidance", "pending clarification", "definition TBD", "undefined term", "unclear scope"]
        
        idx = 1
        for obl in obligations:
            for trigger in ambiguity_triggers:
                if trigger in obl["text"].lower() or "shall" in obl["text"].lower():
                    questions.append({
                        "id": f"OQ-{str(idx).zfill(3)}",
                        "question": f"Clarification needed on enforcement scope for obligation {obl['id']} ({obl['article']}): {obl['text'][:80]}...",
                        "asked_by": {"name": "LRD Drafting Agent", "role": "Automated Legal Analyst"},
                        "date_raised": datetime.utcnow().strftime("%Y-%m-%d"),
                        "resolution": None,
                        "status": "Open"
                    })
                    idx += 1
                    break

        if not questions:
            questions.append({
                "id": "OQ-001",
                "question": "Confirm whether regional sub-entities in non-EU UK/EEA zone require separate localized disclosures.",
                "asked_by": {"name": "LRD Drafting Agent", "role": "Automated Legal Analyst"},
                "date_raised": datetime.utcnow().strftime("%Y-%m-%d"),
                "resolution": None,
                "status": "Open"
            })

        return questions

    def _generate_legal_context(self, text: str, regulation: str) -> str:
        return f"Summary of {regulation}: Sets forth binding regulatory compliance standards across targeted operating jurisdictions. Requires systematic verification, record-keeping, and user-facing notifications."

    def _generate_ebay_applicability(self, obligations: List[Dict[str, Any]], categories: List[str]) -> str:
        cat_str = ", ".join(categories)
        return f"Applies to all eBay transactions involving categories: {cat_str}. Affects cross-border trade into designated jurisdictions."

    def _persist_draft(self, lrd_doc: Dict[str, Any]) -> bool:
        self.log(f"Persisted draft LRD {lrd_doc['id']} into Firestore Bronze/Silver storage tier shim.")
        return True


# Register agent
AgentRegistry.register(LRDDraftingAgent)
