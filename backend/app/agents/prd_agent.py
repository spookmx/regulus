"""
PRD Drafting Agent (§4.3 & §6.3)
================================
Reads an approved BRD, drafts user stories and acceptance criteria,
and classifies requirements into 1.1 (Compliance), 1.2 (Enhancements), and 2.x (Deferred).
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from app.agents.runner import BaseAgent, AgentRegistry


class PRDDraftingAgent(BaseAgent):
    name = "prd_agent"
    description = "Product Requirements Document (PRD) Drafting Agent"

    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Input format:
        {
            "brd_document": dict (from BRD Agent or Firestore),
            "project_code": "ECGT",
            "prd_owner": {"name": "Alex Smith", "email": "asmith@ebay.com"},
            "eng_lead": {"name": "Dave Miller", "email": "dmiller@ebay.com"},
            "ux_lead": {"name": "Sarah Chen", "email": "schen@ebay.com"}
        }
        """
        brd = input_data.get("brd_document", {})
        brd_id = brd.get("id", "BRD-ECGT-001")
        lrd_refs = brd.get("lrd_refs", ["LRD-2026-001"])
        project_code = input_data.get("project_code", brd_id.split("-")[1] if "-" in brd_id else "REG")
        prd_owner = input_data.get("prd_owner", {"name": "Lead PM", "role": "PM"})
        eng_lead = input_data.get("eng_lead", {"name": "Eng Lead", "role": "Engineering Lead"})
        ux_lead = input_data.get("ux_lead", {"name": "UX Lead", "role": "UX Lead"})

        prd_id = f"PRD-{project_code}"

        self.log(f"Drafting PRD {prd_id} from BRD {brd_id}")

        brd_sections = brd.get("sections", {})
        cust_reqs = brd_sections.get("customer_requirements", [])
        bus_reqs = brd_sections.get("business_requirements", [])

        # 1. Draft user stories and classify into 1.1 compliance, 1.2 enhancements, 2.x deferred
        sec_1_1, sec_1_2, sec_2_0 = self._generate_and_classify_prd_reqs(project_code, cust_reqs, bus_reqs, lrd_refs)

        # 2. Construct PRD Document per §4.3
        prd_document = {
            "id": prd_id,
            "title": f"End-to-End Product Requirements Document for {project_code}",
            "brd_ref": brd_id,
            "lrd_refs": lrd_refs,
            "prd_owner": prd_owner,
            "eng_lead": eng_lead,
            "ux_lead": ux_lead,
            "status": "Draft",
            "version": "1.0.0",
            "created": datetime.utcnow().isoformat() + "Z",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "sections": {
                "1_1_compliance": sec_1_1,
                "1_2_enhancements": sec_1_2,
                "2_deferred": sec_2_0
            }
        }

        # 3. Log traceability edges (PRDRequirement -[:IMPLEMENTS]-> BRDRequirement)
        total_reqs = len(sec_1_1) + len(sec_1_2) + len(sec_2_0)
        self.log(f"Generated {total_reqs} PRD requirements across 1.1 compliance, 1.2 enhancements, and 2.x deferred.")

        return {
            "status": "success",
            "prd_id": prd_id,
            "prd_document": prd_document,
            "compliance_reqs_count": len(sec_1_1),
            "enhancement_reqs_count": len(sec_1_2),
            "deferred_reqs_count": len(sec_2_0)
        }

    def _generate_and_classify_prd_reqs(
        self, project_code: str, cust_reqs: List[Dict[str, Any]], bus_reqs: List[Dict[str, Any]], lrd_refs: List[str]
    ):
        sec_1_1 = []
        sec_1_2 = []
        sec_2_0 = []

        c_idx = 1
        e_idx = 1
        d_idx = 1

        all_brs = cust_reqs + bus_reqs

        if not all_brs:
            all_brs = [{
                "id": "BR-001",
                "text": "Display standardized compliance disclosures on seller listing page.",
                "obligation_refs": ["OBL-2026-001"],
                "priority": "Must"
            }]

        for br in all_brs:
            br_id = br.get("id", "BR-001")
            text = br.get("text", "")
            priority = br.get("priority", "Must")
            obl_refs = br.get("obligation_refs", [])

            # Primary compliance requirement (1.1.x)
            req_id_11 = f"PRD-{project_code}-1.1.{c_idx}"
            sec_1_1.append({
                "id": req_id_11,
                "user_story": f"As a seller listing an item in affected jurisdictions, I must complete compulsory regulatory input fields so that my listing satisfies legal requirements.",
                "brd_refs": [br_id],
                "lrd_refs": obl_refs if obl_refs else lrd_refs,
                "acceptance_criteria": [
                    "Field is rendered mandatory in seller listing flow for target categories.",
                    "Input validation verifies required formatting and certificates.",
                    "Audit log captures seller submission timestamp and payload hash."
                ],
                "notes_dependencies": "Requires API update to Listing Management Gateway.",
                "jira_links": [],
                "status": "Draft"
            })
            c_idx += 1

            # Compliance-adjacent enhancement (1.2.x)
            if priority in ["Must", "Should"]:
                req_id_12 = f"PRD-{project_code}-1.2.{e_idx}"
                sec_1_2.append({
                    "id": req_id_12,
                    "user_story": f"As a buyer on the View Item Page (VIP), I see a contextual tooltip explaining the regulatory badge so that I understand product eco-certifications.",
                    "brd_refs": [br_id],
                    "lrd_refs": obl_refs if obl_refs else lrd_refs,
                    "acceptance_criteria": [
                        "Hovering or clicking badge opens informational popover.",
                        "Popover provides link to official regulatory registration authority."
                    ],
                    "notes_dependencies": "UX Web & Mobile Component Library alignment.",
                    "jira_links": [],
                    "status": "Draft"
                })
                e_idx += 1

        # Deferred scope (2.x)
        req_id_20 = f"PRD-{project_code}-2.1"
        sec_2_0.append({
            "id": req_id_20,
            "user_story": "As an enterprise seller, I want automated bulk CSV upload and API webhooks for regulatory certificates.",
            "brd_refs": [all_brs[0].get("id", "BR-001") if all_brs else "BR-001"],
            "lrd_refs": lrd_refs,
            "acceptance_criteria": [
                "Bulk upload endpoint accepts batch CSV files up to 50MB.",
                "Webhook dispatches async verification status callbacks."
            ],
            "notes_dependencies": "Deferred to Phase 2 after core compliance deadline.",
            "jira_links": [],
            "status": "Deferred"
        })

        return sec_1_1, sec_1_2, sec_2_0


# Register agent
AgentRegistry.register(PRDDraftingAgent)
