import datetime
import pytest
from app.models import (
    User,
    Signoff,
    Approval,
    LRD,
    Obligation,
    OpenQuestion,
    LRDSections,
    BRD,
    Requirement,
    RiskDecision,
    BRDSections,
    PRD,
    SubPRD,
    PRDRequirement,
    PRDSections,
    Playbook,
    Risk,
    MilestonePlan,
    WorkstreamItem,
    Decision,
    ActionItem,
    Task,
    ChangeRequest,
    Project,
    DocumentRefs,
    ArtifactStatuses,
    AirtableSync,
    Factsheet,
    ImpactAssessment,
    CategoryEligibility,
    ResearchFindings,
    PolicyBrief,
    GTMBrief,
    L10NBrief,
    ProductOverview,
)
from app.database import Neo4jEngine
from app.embeddings import GeminiEmbeddingWrapper


# Helper dummy user
def sample_user():
    return User(name="Jane Legal", email="jlegal@ebay.com", role="Legal Counsel")


def sample_pm():
    return User(name="John PM", email="jpm@ebay.com", role="PM Owner")


# --- Test Models ---

def test_lrd_model():
    user_legal = sample_user()
    user_pm = sample_pm()
    
    obligation = Obligation(
        id="OBL-LRD-2024-001-001",
        article="Article 3(1)(a)",
        text="Sellers must display environmental claims verification.",
        type="Display",
        affected_surface=["View Item", "Checkout"],
    )
    
    open_q = OpenQuestion(
        id="OQ-001",
        question="Does this apply to refurbished items?",
        asked_by=user_pm,
        date_raised=datetime.date(2026, 8, 1),
        status="Open",
    )
    
    sections = LRDSections(
        legal_context="EU Green Transition Directive summary",
        obligations=[obligation],
        ebay_applicability="Applicable to EU seller listings",
        affected_categories=["Electronics", "Home & Garden"],
        exemptions="C2C occasional sellers exempt",
        open_legal_questions=[open_q],
        related_lrds=[],
    )
    
    lrd = LRD(
        id="LRD-2024-001",
        title="ECGT Legal Requirements Document",
        regulation="EU Directive 2024/1799 (ECGT)",
        jurisdiction=["EU", "DE", "FR"],
        enforcement_date=datetime.date(2026, 9, 27),
        lrd_owner=user_legal,
        pm_owner=user_pm,
        status="Approved",
        sections=sections,
    )
    
    assert lrd.id == "LRD-2024-001"
    assert len(lrd.sections.obligations) == 1
    assert lrd.sections.obligations[0].type == "Display"


def test_brd_model():
    user_pm = sample_pm()
    req = Requirement(
        id="BR-001",
        obligation_refs=["OBL-LRD-2024-001-001"],
        text="Display green label badge on listing page",
        priority="Must",
    )
    
    risk_dec = RiskDecision(
        id="RD-001",
        context="Exemption interpretation for refurbished goods",
        legal_basis="Article 3(1)(a)",
        decision="Exclude refurbished goods from initial rollout",
        risk_accepted=True,
    )
    
    sections = BRDSections(
        purpose_scope="Define business requirements for ECGT compliance",
        customer_requirements=[req],
        business_requirements=[req],
        out_of_scope="Non-EU listings",
        risk_decisions=[risk_dec],
    )
    
    brd = BRD(
        id="BRD-ECGT-001",
        title="ECGT Business Requirements",
        lrd_refs=["LRD-2024-001"],
        regulation="EU Directive 2024/1799",
        brd_owner=user_pm,
        bu_lead=user_pm,
        sections=sections,
    )
    
    assert brd.id == "BRD-ECGT-001"
    assert brd.sections.customer_requirements[0].priority == "Must"


def test_prd_and_sub_prd_models():
    user_pm = sample_pm()
    prd_req = PRDRequirement(
        id="PRD-ECGT-1.1.1",
        user_story="As a buyer in DE, I see eco-labels on listing pages.",
        brd_refs=["BR-001"],
        lrd_refs=["OBL-LRD-2024-001-001"],
        acceptance_criteria=["Badge renders within 200ms", "Tooltip shows legal basis"],
        status="Approved",
    )
    
    prd_sections = PRDSections(
        section_1_1_compliance=[prd_req],
        section_1_2_enhancements=[],
        section_2_deferred=[],
    )
    
    prd = PRD(
        id="PRD-ECGT",
        title="ECGT Product Requirements Document",
        brd_ref="BRD-ECGT-001",
        lrd_refs=["LRD-2024-001"],
        prd_owner=user_pm,
        status="Approved",
        sections=prd_sections,
    )
    
    sprd = SubPRD(
        id="SPRD-ECGT-001",
        title="ECGT Mobile UI Sub-PRD",
        parent_prd="PRD-ECGT",
        scope="Mobile Web & Apps",
        requirements=[prd_req],
    )
    
    assert prd.id == "PRD-ECGT"
    assert len(prd.sections.section_1_1_compliance) == 1
    assert sprd.parent_prd == "PRD-ECGT"


def test_playbook_and_risk_models():
    user_pm = sample_pm()
    risk = Risk(
        id="RSK-001",
        date_identified=datetime.date(2026, 8, 1),
        description="Potential delay in legal signoff",
        owner=user_pm,
        likelihood=3,
        impact=4,
    )
    # Risk score auto-calculated: 3 * 4 = 12.0
    assert risk.risk_score == 12.0
    
    playbook = Playbook(
        id="PLAY-ECGT",
        project_ref="PROJ-ECGT",
        lrd_refs=["LRD-2024-001"],
        owner=user_pm,
        risk_register=[risk],
    )
    
    assert playbook.id == "PLAY-ECGT"
    assert playbook.risk_register[0].risk_score == 12.0


def test_milestone_plan_model():
    user_pm = sample_pm()
    ws_item = WorkstreamItem(
        id="WS-001",
        workstream="E2E Testing",
        workstream_group="70: E2E Testing",
        milestone="Complete EU Compliance Scenarios",
        deliverables="Test report",
        primary_poc=user_pm,
        start_date=datetime.date(2026, 8, 1),
        end_date=datetime.date(2026, 8, 30),
        status="In Progress",
        pdlc_phase="Test",
    )
    
    mplan = MilestonePlan(
        id="MPLAN-ECGT",
        project_ref="PROJ-ECGT",
        workstreams=[ws_item],
    )
    
    assert mplan.id == "MPLAN-ECGT"
    assert mplan.workstreams[0].workstream == "E2E Testing"


def test_project_model():
    user_pm = sample_pm()
    project = Project(
        id="PROJ-ECGT",
        name="Empowering Consumers Green Transition",
        regulation=["EU Directive 2024/1799"],
        product_capability=["Listings", "Search"],
        stack_rank=1,
        pm_lead=user_pm,
        pgm_lead=user_pm,
        bu_lead=user_pm,
        project_phase="Design",
        project_status="On Track",
        regulation_compliance_date=datetime.date(2026, 9, 27),
        document_refs=DocumentRefs(lrd=["LRD-2024-001"], brd=["BRD-ECGT-001"], prd="PRD-ECGT"),
        artifact_statuses=ArtifactStatuses(brd_status="Approved", prd_status="In Review"),
        airtable_sync=AirtableSync(base_id="appsAttrVGoHjSfHR", record_id="rec123", sync_status="Synced"),
    )
    
    assert project.id == "PROJ-ECGT"
    assert project.artifact_statuses.brd_status == "Approved"


def test_all_17_artifact_types_instantiation():
    user = sample_user()
    pm = sample_pm()
    
    # 1. LRD
    lrd = LRD(
        id="LRD-1", title="T", regulation="R", jurisdiction=["EU"],
        enforcement_date=datetime.date(2026, 9, 1), lrd_owner=user, pm_owner=pm,
        sections=LRDSections(legal_context="C", ebay_applicability="A", exemptions="E")
    )
    # 2. BRD
    brd = BRD(
        id="BRD-1", title="T", regulation="R", brd_owner=pm, bu_lead=pm,
        sections=BRDSections(purpose_scope="P", out_of_scope="O")
    )
    # 3. PRD
    prd = PRD(
        id="PRD-1", title="T", brd_ref="BRD-1", prd_owner=pm,
        sections=PRDSections()
    )
    # 4. SubPRD
    sprd = SubPRD(id="SPRD-1", title="T", parent_prd="PRD-1", scope="Mobile")
    # 5. Playbook
    play = Playbook(id="PLAY-1", project_ref="PROJ-1", owner=pm)
    # 6. MilestonePlan
    mplan = MilestonePlan(id="MPLAN-1", project_ref="PROJ-1")
    # 7. Decision
    dec = Decision(id="DEC-2026-001", decision_text="Approved policy exception", pm_owner=pm)
    # 8. ActionItem
    actn = ActionItem(
        id="ACTN-2026-001", date_raised=datetime.date(2026, 8, 1), workstream="Legal",
        description="Verify DE law clause", owner=[user], due_date=datetime.date(2026, 8, 10)
    )
    # 9. Task
    task = Task(
        id="TASK-ECGT-001", title="Draft PRD section", description="Desc",
        project_ref="PROJ-1", workstream="Product", assignee=pm, due_date=datetime.date(2026, 8, 15),
        created_by=pm
    )
    # 10. ChangeRequest
    cr = ChangeRequest(
        id="CR-2026-001", title="Scope expansion", description="Desc",
        requestor=user, pm_lead=pm, date_raised=datetime.date(2026, 8, 1)
    )
    # 11. Project
    proj = Project(
        id="PROJ-1", name="Project 1", pm_lead=pm, pgm_lead=pm, bu_lead=pm,
        regulation_compliance_date=datetime.date(2026, 9, 27)
    )
    # 12. Factsheet
    fact = Factsheet(id="FACT-1", title="T", owner=pm, content="Summary content")
    # 13. ImpactAssessment
    ia = ImpactAssessment(id="IA-1", title="T", lrd_ref="LRD-1", owner=pm, summary="S")
    # 14. CategoryEligibility
    catq = CategoryEligibility(id="CATQ-1", title="T", lrd_ref="LRD-1", owner=pm, eligibility_criteria="Criteria")
    # 15. ResearchFindings
    res = ResearchFindings(id="RES-1", title="T", author=user, summary="S", findings="F")
    # 16. PolicyBrief
    polb = PolicyBrief(id="POLB-1", title="T", lrd_ref="LRD-1", owner=user, policy_analysis="A", recommendations="R")
    # 17. GTMBrief
    gtm = GTMBrief(id="GTM-1", title="T", prd_ref="PRD-1", owner=pm, launch_strategy="Strategy")
    # 18. L10NBrief
    l10n = L10NBrief(id="L10N-1", title="T", prd_ref="PRD-1", owner=pm, translation_scope="Scope")
    # 19. ProductOverview
    deck = ProductOverview(id="DECK-1", title="T", owner=pm, deck_url="http://slides.com/1")

    artifacts = [lrd, brd, prd, sprd, play, mplan, dec, actn, task, cr, proj, fact, ia, catq, res, polb, gtm, l10n, deck]
    assert len(artifacts) >= 17
    for a in artifacts:
        assert hasattr(a, "id") and len(a.id) > 0


# --- Test Neo4j Cypher Queries ---

def test_neo4j_cypher_queries():
    engine = Neo4jEngine()

    # URN format
    urn = engine.format_urn("LRD", "LRD-2024-001")
    assert urn == "urn:regulus:lrd:LRD-2024-001"

    # Upward trace query
    q_up = engine.get_upward_trace_query("JIRA-123")
    assert "JiraTicket {id: 'JIRA-123'}" in q_up
    assert "[:DELIVERS*1..5]" in q_up

    # Downward trace query
    q_down = engine.get_downward_trace_query("LRD-2024-001")
    assert "LRD {id: 'LRD-2024-001'}" in q_down
    assert "[:MANDATES]" in q_down
    assert "[:MAPS_TO]" in q_down

    # Coverage gap query
    q_gap = engine.get_coverage_gap_query("LRD-2024-001")
    assert "WHERE NOT (o)<-[:MAPS_TO]-(:BRDRequirement)" in q_gap

    # Orphan Jira query
    q_orphan = engine.get_orphan_jira_query()
    assert "WHERE NOT ()-[:DELIVERS]->(j)" in q_orphan

    # Compliance metrics query
    q_metrics = engine.get_compliance_metrics_query("LRD-2024-001")
    assert "count(DISTINCT o) AS total_obligations" in q_metrics

    # Calculate metrics function
    metrics = engine.calculate_metrics(
        total_obligations=10,
        covered_in_brd=8,
        brd_reqs_covered_in_prd=6,
        delivered_jira=5,
    )
    assert metrics["compliance_score"] == 0.50
    assert metrics["brd_coverage"] == 0.80
    assert metrics["prd_coverage"] == 0.75


# --- Test Gemini Embedding Wrapper & Cosine Similarity ---

def test_embedding_wrapper_cosine_and_severity():
    embedder = GeminiEmbeddingWrapper()

    # Identical text
    sim, dist = embedder.compute_semantic_diff("Same text", "Same text")
    assert sim == 1.0
    assert dist == 0.0
    assert embedder.classify_severity(dist) == "Minor"

    # Test severity threshold bounds per §6.4 & §9
    assert embedder.classify_severity(0.01) == "Minor"
    assert embedder.classify_severity(0.08) == "Moderate"
    assert embedder.classify_severity(0.25) == "Major"
    assert embedder.classify_severity(0.50) == "Critical"
