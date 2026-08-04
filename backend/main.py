"""
Regulus Antigravity Agent Runtime Engine & MCP Adapter Launcher
================================================================
CLI entrypoint to launch agent runner locally (`python main.py --env local`).
"""

import sys
import os
import argparse
import asyncio
import json
import logging

# Ensure backend root is in PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.agents import (
    AgentRegistry,
    HAS_ANTIGRAVITY
)
from app.mcp import (
    AirtableMCPAdapter,
    ZoomMCPAdapter,
    SlackMCPAdapter,
    JiraMCPAdapter,
    FigmaMCPAdapter,
    GitHubMCPAdapter
)

logger = logging.getLogger("regulus.main")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


async def run_local_simulation():
    """Runs a complete end-to-end local test pipeline across all agents and MCP adapters."""
    print("=" * 80)
    print("🚀 REGULUS ANTIGRAVITY AGENT RUNTIME ENGINE & MCP ADAPTERS")
    print(f"Environment: LOCAL | Antigravity SDK Installed: {HAS_ANTIGRAVITY}")
    print("=" * 80)

    # ---------------------------------------------------------
    # 1. LRD Drafting Agent
    # ---------------------------------------------------------
    print("\n--- [1/6] Running LRD Drafting Agent ---")
    lrd_input = {
        "title": "EU Green Claims & Eco-Labeling Directive",
        "regulation": "EU Directive 2024/1799 (ECGT)",
        "jurisdiction": ["EU", "DE", "FR"],
        "enforcement_date": "2026-09-01",
        "grace_period_end": "2027-03-01",
        "regulation_text": (
            "Article 3(1)(a): Online marketplaces must display verified eco-certificates on product detail pages.\n"
            "Article 4(2): Sellers are prohibited from making unverified environmental claims without pre-audit documentation.\n"
            "Article 7(1): Marketplaces shall report quarterly compliance verification metrics to national regulatory bodies."
        ),
        "lrd_owner": {"name": "Jane Doe", "email": "jdoe@ebay.com", "role": "Senior Legal Counsel"},
        "pm_owner": {"name": "Alex Smith", "email": "asmith@ebay.com", "role": "PM Lead"},
        "affected_categories": ["Electronics", "Fashion", "Home & Garden"]
    }
    lrd_result = await AgentRegistry.run_agent("lrd_agent", lrd_input)
    lrd_doc = lrd_result["lrd_document"]
    print(f"✅ Generated {lrd_result['lrd_id']} | Obligations: {lrd_result['obligations_count']} | Open Questions: {lrd_result['open_questions_count']}")

    # ---------------------------------------------------------
    # 2. BRD Drafting Agent
    # ---------------------------------------------------------
    print("\n--- [2/6] Running BRD Drafting Agent ---")
    brd_input = {
        "lrd_document": lrd_doc,
        "project_code": "ECGT",
        "brd_owner": {"name": "Alex Smith", "role": "PM Lead"},
        "bu_lead": {"name": "Carlos Rivera", "role": "VP EU Operations"}
    }
    brd_result = await AgentRegistry.run_agent("brd_agent", brd_input)
    brd_doc = brd_result["brd_document"]
    print(f"✅ Generated {brd_result['brd_id']} | Customer Reqs: {brd_result['customer_requirements_count']} | Business Reqs: {brd_result['business_requirements_count']} | Risk Decisions: {brd_result['risk_decisions_count']}")

    # ---------------------------------------------------------
    # 3. PRD Drafting Agent
    # ---------------------------------------------------------
    print("\n--- [3/6] Running PRD Drafting Agent ---")
    prd_input = {
        "brd_document": brd_doc,
        "project_code": "ECGT",
        "prd_owner": {"name": "Alex Smith", "role": "PM Lead"}
    }
    prd_result = await AgentRegistry.run_agent("prd_agent", prd_input)
    prd_doc = prd_result["prd_document"]
    print(f"✅ Generated {prd_result['prd_id']} | 1.1 Compliance Reqs: {prd_result['compliance_reqs_count']} | 1.2 Enhancements: {prd_result['enhancement_reqs_count']} | 2.x Deferred: {prd_result['deferred_reqs_count']}")

    # ---------------------------------------------------------
    # 4. Change Detection Agent
    # ---------------------------------------------------------
    print("\n--- [4/6] Running Change Detection Agent ---")
    change_input = {
        "artifact_urn": f"urn:regulus:lrd:{lrd_result['lrd_id']}",
        "original_text": lrd_input["regulation_text"],
        "updated_text": lrd_input["regulation_text"] + "\nArticle 3(1)(b): MANDATORY third-party lab audit required for high-risk categories effective 2026-10-15.",
        "context_type": "LRD_Obligation_Update"
    }
    change_result = await AgentRegistry.run_agent("change_agent", change_input)
    change_rec = change_result["change_record"]
    print(f"✅ Semantic Diff Cosine Similarity: {change_rec['similarity_score']} | Severity: {change_rec['severity']} | Summary: {change_rec['summary']}")

    # ---------------------------------------------------------
    # 5. Cascade Proposal Agent
    # ---------------------------------------------------------
    print("\n--- [5/6] Running Cascade Proposal Agent ---")
    cascade_input = {
        "change_record": change_rec
    }
    cascade_result = await AgentRegistry.run_agent("cascade_agent", cascade_input)
    print(f"✅ Generated Cascade Proposal {cascade_result['cascade_proposal_id']} | Affected Artifacts: {cascade_result['affected_count']} | Action Center Items: {len(cascade_result['action_center_items'])}")

    # ---------------------------------------------------------
    # 6. Decision Extraction Agent
    # ---------------------------------------------------------
    print("\n--- [6/6] Running Decision Extraction Agent ---")
    decision_input = {
        "source_ref": "Zoom Meeting #889977",
        "document_title": "ECGT Legal Alignment Meeting",
        "text": "During review, [DECIDED] we will accept the risk on legacy seller inventory for 90 days based on Article 3(1)(a). Rationale: avoid seller friction during launch week."
    }
    decision_result = await AgentRegistry.run_agent("decision_agent", decision_input)
    print(f"✅ Extracted Decisions: {decision_result['extracted_count']} | Decisions Count: {len(decision_result['decisions'])}")

    # ---------------------------------------------------------
    # 7. MCP Adapters Execution Test
    # ---------------------------------------------------------
    print("\n" + "=" * 80)
    print("🔌 TESTING MCP SERVER ADAPTER CLIENTS (DUAL MODE)")
    print("=" * 80)

    airtable = AirtableMCPAdapter()
    roadmap = await airtable.fetch_roadmap_projects()
    print(f"📊 [Airtable MCP] Fetched {len(roadmap)} roadmap projects. Mode: {'Mock' if airtable.is_mock else 'Real'}")

    zoom = ZoomMCPAdapter()
    transcript = await zoom.get_transcript("zoom-uuid-889977")
    print(f"📹 [Zoom MCP] Fetched transcript for '{transcript.get('topic')}' ({len(transcript.get('transcript', ''))} chars). Mode: {'Mock' if zoom.is_mock else 'Real'}")

    slack = SlackMCPAdapter()
    slack_res = await slack.send_task_assignment("TASK-001", "Update VIP eco-label tooltip", "2026-08-15", "ECGT", "asmith@ebay.com", "http://localhost:3000/tasks/TASK-001")
    print(f"💬 [Slack MCP] Sent task assignment DM. Delivery Status: {slack_res.get('status')}. Mode: {'Mock' if slack.is_mock else 'Real'}")

    jira = JiraMCPAdapter()
    jira_res = await jira.create_issue(prd_doc["sections"]["1_1_compliance"][0], project_code="ECGT")
    print(f"🎫 [Jira MCP] Created ticket {jira_res.get('key')} ({jira_res.get('status')}). Mode: {'Mock' if jira.is_mock else 'Real'}")

    figma = FigmaMCPAdapter()
    figma_status = await figma.get_design_status("figma-file-abc12345")
    print(f"🎨 [Figma MCP] Design Status: '{figma_status.get('status')}'. Mode: {'Mock' if figma.is_mock else 'Real'}")

    github = GitHubMCPAdapter()
    pr_info = await github.get_pull_request("ebay/regulus", 402)
    print(f"🐙 [GitHub MCP] PR #{pr_info.get('pr_number')} Title: '{pr_info.get('title')}' ({pr_info.get('state')}). Mode: {'Mock' if github.is_mock else 'Real'}")

    print("\n" + "=" * 80)
    print("🎉 ALL AGENTS AND MCP ADAPTERS EXECUTED SUCCESSFULLY!")
    print("=" * 80)


def main():
    parser = argparse.ArgumentParser(description="Regulus Antigravity Agent Runtime Engine Launcher")
    parser.add_argument("--env", type=str, default="local", choices=["local", "development", "staging", "production"], help="Execution environment")
    args = parser.parse_args()

    if args.env == "local":
        asyncio.run(run_local_simulation())
    else:
        logger.info(f"Launching Regulus Agent Engine in '{args.env}' environment mode.")
        asyncio.run(run_local_simulation())


if __name__ == "__main__":
    main()
