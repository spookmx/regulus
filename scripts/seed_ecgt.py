#!/usr/bin/env python3
"""
ECGT Seed Ingestion Script for Regulus Compliance OS
Populates local Cloud Firestore and Neo4j Knowledge Graph instances with ECGT pilot fixtures.
"""

import os
import sys
import json
import glob
import logging
import urllib.request
import urllib.parse
import urllib.error

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seed_ecgt")

FIXTURES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fixtures")
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_HTTP_URL = os.getenv("NEO4J_HTTP_URL", "http://localhost:7474")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "regulus")
FIRESTORE_EMULATOR_HOST = os.getenv("FIRESTORE_EMULATOR_HOST", "localhost:8080")
PROJECT_ID = os.getenv("GCP_PROJECT", "demo-regulus")


def load_fixtures():
    fixtures = {}
    pattern = os.path.join(FIXTURES_DIR, "*.json")
    files = glob.glob(pattern)
    if not files:
        logger.error(f"No JSON fixture files found in {FIXTURES_DIR}")
        sys.exit(1)
    
    for filepath in sorted(files):
        filename = os.path.basename(filepath)
        doc_id = os.path.splitext(filename)[0]
        with open(filepath, "r", encoding="utf-8") as f:
            fixtures[doc_id] = json.load(f)
        logger.info(f"Loaded fixture: {doc_id} ({filepath})")
    return fixtures


def seed_firestore(fixtures):
    logger.info("--- Starting Firestore Seeding ---")
    os.environ["FIRESTORE_EMULATOR_HOST"] = FIRESTORE_EMULATOR_HOST

    try:
        from google.cloud import firestore
        db = firestore.Client(project=PROJECT_ID)
        use_sdk = True
        logger.info("Using google.cloud.firestore SDK")
    except ImportError:
        try:
            import firebase_admin
            from firebase_admin import credentials, firestore
            if not firebase_admin._apps:
                firebase_admin.initialize_app(options={"projectId": PROJECT_ID})
            db = firestore.client()
            use_sdk = True
            logger.info("Using firebase_admin.firestore SDK")
        except Exception:
            use_sdk = False
            logger.info("Python Firestore SDK unavailable, falling back to HTTP REST for Firestore Emulator")

    ingested_count = 0
    for doc_id, data in fixtures.items():
        if use_sdk:
            # Bronze raw artifact blob
            db.collection("artifacts").document(doc_id).set(data)
            
            # Silver typed collection
            collection_name = "derived"
            if doc_id.startswith("LRD"): collection_name = "lrds"
            elif doc_id.startswith("BRD"): collection_name = "brds"
            elif doc_id.startswith("PRD"): collection_name = "prds"
            elif doc_id.startswith("PLAY"): collection_name = "playbooks"
            elif doc_id.startswith("MPLAN"): collection_name = "milestones"
            elif doc_id.startswith("CATQ"): collection_name = "catq"
            elif doc_id.startswith("FACT"): collection_name = "factsheets"
            elif doc_id.startswith("IA"): collection_name = "impact_assessments"
            elif doc_id.startswith("DECK"): collection_name = "decks"
            elif doc_id.startswith("PROJ"): collection_name = "projects"

            db.collection(collection_name).document(doc_id).set(data)
            ingested_count += 1
        else:
            # REST Fallback for Emulator
            def value_to_firestore_json(val):
                if isinstance(val, bool): return {"booleanValue": val}
                elif isinstance(val, int): return {"integerValue": str(val)}
                elif isinstance(val, float): return {"doubleValue": val}
                elif isinstance(val, str): return {"stringValue": val}
                elif isinstance(val, list): return {"arrayValue": {"values": [value_to_firestore_json(v) for v in val]}}
                elif isinstance(val, dict): return {"mapValue": {"fields": {k: value_to_firestore_json(v) for k, v in val.items()}}}
                elif val is None: return {"nullValue": None}
                return {"stringValue": str(val)}

            fields = {k: value_to_firestore_json(v) for k, v in data.items()}
            payload = json.dumps({"fields": fields}).encode("utf-8")

            base_url = f"http://{FIRESTORE_EMULATOR_HOST}/v1/projects/{PROJECT_ID}/databases/(default)/documents"
            
            for coll in ["artifacts", "derived"]:
                url = f"{base_url}/{coll}/{doc_id}"
                req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="PATCH")
                try:
                    with urllib.request.urlopen(req) as resp:
                        pass
                except urllib.error.URLError as e:
                    logger.warning(f"Firestore emulator REST write failed for {doc_id} to {coll}: {e}")
            ingested_count += 1

    logger.info(f"Firestore seeding complete: {ingested_count} documents ingested.")


def execute_cypher(cypher_queries):
    """Executes a list of Cypher queries using neo4j driver or HTTP REST transaction endpoint."""
    try:
        from neo4j import GraphDatabase
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        with driver.session() as session:
            for query, params in cypher_queries:
                session.run(query, params or {})
        driver.close()
        logger.info("Cypher queries executed via Bolt driver.")
        return True
    except Exception as e:
        logger.info(f"Bolt driver unavailable or failed ({e}), falling back to Neo4j HTTP API")

    # Fallback to HTTP REST endpoint
    url = f"{NEO4J_HTTP_URL}/db/neo4j/tx/commit"
    statements = [{"statement": q, "parameters": p or {}} for q, p in cypher_queries]
    payload = json.dumps({"statements": statements}).encode("utf-8")

    import base64
    auth_str = base64.b64encode(f"{NEO4J_USER}:{NEO4J_PASSWORD}".encode()).decode()

    req = urllib.request.Request(url, data=payload, headers={
        "Content-Type": "application/json",
        "Authorization": f"Basic {auth_str}"
    }, method="POST")

    try:
        with urllib.request.urlopen(req) as resp:
            res_data = json.loads(resp.read().decode("utf-8"))
            if res_data.get("errors"):
                logger.error(f"Neo4j HTTP Cypher errors: {res_data['errors']}")
                return False
            logger.info("Cypher queries executed via HTTP API.")
            return True
    except Exception as err:
        logger.error(f"Failed to connect to Neo4j HTTP endpoint: {err}")
        return False


def seed_neo4j(fixtures):
    logger.info("--- Starting Neo4j Knowledge Graph Seeding ---")
    queries = []

    # Clear existing graph if uninitialized or fresh seed
    queries.append(("MATCH (n) DETACH DELETE n", {}))

    # Helper URN builder
    def get_urn(node_type, node_id):
        return f"urn:regulus:{node_type.lower()}:{node_id}"

    # 1. Seed Project
    proj_data = fixtures.get("PROJ-ECGT", {})
    queries.append((
        """
        MERGE (p:Project {id: $id})
        SET p.urn = $urn,
            p.name = $name,
            p.code = $code,
            p.status = $project_status,
            p.phase = $project_phase,
            p.regulation_compliance_date = $regulation_compliance_date,
            p.program = $program,
            p.stack_rank = $stack_rank
        """,
        {
            "id": proj_data.get("id", "PROJ-ECGT"),
            "urn": proj_data.get("urn", get_urn("project", "PROJ-ECGT")),
            "name": proj_data.get("name"),
            "code": proj_data.get("code"),
            "project_status": proj_data.get("project_status"),
            "project_phase": proj_data.get("project_phase"),
            "regulation_compliance_date": proj_data.get("regulation_compliance_date"),
            "program": proj_data.get("program"),
            "stack_rank": proj_data.get("stack_rank")
        }
    ))

    # 2. Seed LRD & Obligations
    lrd_data = fixtures.get("LRD-2024-001", {})
    queries.append((
        """
        MERGE (l:LRD {id: $id})
        SET l.urn = $urn,
            l.title = $title,
            l.regulation = $regulation,
            l.status = $status,
            l.version = $version,
            l.enforcement_date = $enforcement_date
        WITH l
        MATCH (p:Project {id: "PROJ-ECGT"})
        MERGE (p)-[:HAS_LRD]->(l)
        """,
        {
            "id": lrd_data.get("id", "LRD-2024-001"),
            "urn": lrd_data.get("urn", get_urn("lrd", "LRD-2024-001")),
            "title": lrd_data.get("title"),
            "regulation": lrd_data.get("regulation"),
            "status": lrd_data.get("status"),
            "version": lrd_data.get("version"),
            "enforcement_date": lrd_data.get("enforcement_date")
        }
    ))

    obligations = lrd_data.get("sections", {}).get("obligations", [])
    for obl in obligations:
        queries.append((
            """
            MERGE (o:Obligation {id: $id})
            SET o.urn = $urn,
                o.article = $article,
                o.text = $text,
                o.type = $type,
                o.notes = $notes
            WITH o
            MATCH (l:LRD {id: "LRD-2024-001"})
            MERGE (l)-[:MANDATES]->(o)
            """,
            {
                "id": obl.get("id"),
                "urn": obl.get("urn", get_urn("obligation", obl.get("id"))),
                "article": obl.get("article"),
                "text": obl.get("text"),
                "type": obl.get("type"),
                "notes": obl.get("notes")
            }
        ))

    # 3. Seed BRD & BRD Requirements
    brd_data = fixtures.get("BRD-ECGT-001", {})
    queries.append((
        """
        MERGE (b:BRD {id: $id})
        SET b.urn = $urn,
            b.title = $title,
            b.status = $status,
            b.version = $version
        WITH b
        MATCH (l:LRD {id: "LRD-2024-001"})
        MERGE (b)-[:DERIVES_FROM]->(l)
        WITH b
        MATCH (p:Project {id: "PROJ-ECGT"})
        MERGE (p)-[:HAS_BRD]->(b)
        """,
        {
            "id": brd_data.get("id", "BRD-ECGT-001"),
            "urn": brd_data.get("urn", get_urn("brd", "BRD-ECGT-001")),
            "title": brd_data.get("title"),
            "status": brd_data.get("status"),
            "version": brd_data.get("version")
        }
    ))

    cust_reqs = brd_data.get("sections", {}).get("customer_requirements", [])
    bus_reqs = brd_data.get("sections", {}).get("business_requirements", [])
    all_brd_reqs = cust_reqs + bus_reqs

    for br_req in all_brd_reqs:
        queries.append((
            """
            MERGE (br:BRDRequirement {id: $id})
            SET br.urn = $urn,
                br.text = $text,
                br.priority = $priority,
                br.rationale = $rationale
            WITH br
            MATCH (b:BRD {id: "BRD-ECGT-001"})
            MERGE (b)-[:CONTAINS_BRD_REQ]->(br)
            """,
            {
                "id": br_req.get("id"),
                "urn": br_req.get("urn", get_urn("brdrequirement", br_req.get("id"))),
                "text": br_req.get("text"),
                "priority": br_req.get("priority"),
                "rationale": br_req.get("rationale")
            }
        ))
        for obl_ref in br_req.get("obligation_refs", []):
            queries.append((
                """
                MATCH (br:BRDRequirement {id: $br_id})
                MATCH (o:Obligation {id: $obl_id})
                MERGE (br)-[:MAPS_TO]->(o)
                """,
                {"br_id": br_req.get("id"), "obl_id": obl_ref}
            ))

    # 4. Seed PRD & PRD Requirements & Jira Tickets
    prd_data = fixtures.get("PRD-ECGT", {})
    queries.append((
        """
        MERGE (pr:PRD {id: $id})
        SET pr.urn = $urn,
            pr.title = $title,
            pr.status = $status,
            pr.version = $version
        WITH pr
        MATCH (b:BRD {id: "BRD-ECGT-001"})
        MERGE (pr)-[:DERIVES_FROM]->(b)
        WITH pr
        MATCH (p:Project {id: "PROJ-ECGT"})
        MERGE (p)-[:HAS_PRD]->(pr)
        """,
        {
            "id": prd_data.get("id", "PRD-ECGT"),
            "urn": prd_data.get("urn", get_urn("prd", "PRD-ECGT")),
            "title": prd_data.get("title"),
            "status": prd_data.get("status"),
            "version": prd_data.get("version")
        }
    ))

    sec_1_1 = prd_data.get("sections", {}).get("1_1_compliance", [])
    sec_1_2 = prd_data.get("sections", {}).get("1_2_enhancements", [])
    sec_2 = prd_data.get("sections", {}).get("2_deferred", [])
    all_prd_reqs = [(r, "1.1_compliance") for r in sec_1_1] + [(r, "1.2_enhancements") for r in sec_1_2] + [(r, "2_deferred") for r in sec_2]

    for prd_req, section in all_prd_reqs:
        queries.append((
            """
            MERGE (pr:PRDRequirement {id: $id})
            SET pr.urn = $urn,
                pr.user_story = $user_story,
                pr.section = $section,
                pr.status = $status
            WITH pr
            MATCH (p:PRD {id: "PRD-ECGT"})
            MERGE (p)-[:CONTAINS_PRD_REQ]->(pr)
            """,
            {
                "id": prd_req.get("id"),
                "urn": prd_req.get("urn", get_urn("prdrequirement", prd_req.get("id"))),
                "user_story": prd_req.get("user_story"),
                "section": section,
                "status": prd_req.get("status")
            }
        ))
        for br_ref in prd_req.get("brd_refs", []):
            queries.append((
                """
                MATCH (pr:PRDRequirement {id: $prd_req_id})
                MATCH (br:BRDRequirement {id: $br_id})
                MERGE (pr)-[:IMPLEMENTS]->(br)
                """,
                {"prd_req_id": prd_req.get("id"), "br_id": br_ref}
            ))

        for jira_key in prd_req.get("jira_links", []):
            queries.append((
                """
                MERGE (j:JiraTicket {id: $jira_key})
                SET j.urn = $urn,
                    j.key = $jira_key,
                    j.status = $status
                WITH j
                MATCH (pr:PRDRequirement {id: $prd_req_id})
                MERGE (j)-[:DELIVERS]->(pr)
                """,
                {
                    "jira_key": jira_key,
                    "urn": get_urn("jira", jira_key),
                    "status": "In Progress" if prd_req.get("status") == "In Dev" else "To Do",
                    "prd_req_id": prd_req.get("id")
                }
            ))

    # 5. Seed Playbook, Risks & Decisions
    play_data = fixtures.get("PLAY-ECGT", {})
    queries.append((
        """
        MERGE (pb:Playbook {id: $id})
        SET pb.urn = $urn,
            pb.version = $version
        WITH pb
        MATCH (p:Project {id: "PROJ-ECGT"})
        MERGE (pb)-[:GOVERNS]->(p)
        """,
        {
            "id": play_data.get("id", "PLAY-ECGT"),
            "urn": play_data.get("urn", get_urn("playbook", "PLAY-ECGT")),
            "version": play_data.get("version")
        }
    ))

    for risk in play_data.get("risk_register", []):
        queries.append((
            """
            MERGE (r:Risk {id: $id})
            SET r.urn = $urn,
                r.description = $description,
                r.likelihood = $likelihood,
                r.impact = $impact,
                r.risk_score = $risk_score,
                r.status = $status
            WITH r
            MATCH (pb:Playbook {id: "PLAY-ECGT"})
            MERGE (pb)-[:CONTAINS_RISK]->(r)
            """,
            {
                "id": risk.get("id"),
                "urn": risk.get("urn", get_urn("risk", risk.get("id"))),
                "description": risk.get("description"),
                "likelihood": risk.get("likelihood"),
                "impact": risk.get("impact"),
                "risk_score": risk.get("risk_score"),
                "status": risk.get("status")
            }
        ))

    for dec in play_data.get("decision_log", []):
        queries.append((
            """
            MERGE (d:Decision {id: $id})
            SET d.urn = $urn,
                d.text = $text,
                d.legal_basis = $legal_basis,
                d.type = $type,
                d.status = $status,
                d.decision_date = $decision_date
            WITH d
            MATCH (pb:Playbook {id: "PLAY-ECGT"})
            MERGE (d)-[:DECIDED_IN]->(pb)
            """,
            {
                "id": dec.get("id"),
                "urn": dec.get("urn", get_urn("decision", dec.get("id"))),
                "text": dec.get("text"),
                "legal_basis": dec.get("legal_basis"),
                "type": dec.get("type"),
                "status": dec.get("status"),
                "decision_date": dec.get("decision_date")
            }
        ))
        for risk_ref in dec.get("related_risks", []):
            queries.append((
                """
                MATCH (d:Decision {id: $dec_id})
                MATCH (r:Risk {id: $risk_id})
                MERGE (d)-[:MITIGATES]->(r)
                """,
                {"dec_id": dec.get("id"), "risk_id": risk_ref}
            ))

    # 6. Seed Milestone Plan & Workstream Items
    mplan_data = fixtures.get("MPLAN-ECGT", {})
    queries.append((
        """
        MERGE (mp:MilestonePlan {id: $id})
        SET mp.urn = $urn
        WITH mp
        MATCH (p:Project {id: "PROJ-ECGT"})
        MERGE (p)-[:HAS_MILESTONE_PLAN]->(mp)
        """,
        {
            "id": mplan_data.get("id", "MPLAN-ECGT"),
            "urn": mplan_data.get("urn", get_urn("milestoneplan", "MPLAN-ECGT"))
        }
    ))

    for ws in mplan_data.get("workstreams", []):
        queries.append((
            """
            MERGE (w:WorkstreamItem {id: $id})
            SET w.urn = $urn,
                w.workstream = $workstream,
                w.workstream_group = $workstream_group,
                w.milestone = $milestone,
                w.status = $status,
                w.pdlc_phase = $pdlc_phase,
                w.start_date = $start_date,
                w.end_date = $end_date
            WITH w
            MATCH (mp:MilestonePlan {id: "MPLAN-ECGT"})
            MERGE (mp)-[:HAS_WORKSTREAM]->(w)
            """,
            {
                "id": ws.get("id"),
                "urn": ws.get("urn", get_urn("workstreamitem", ws.get("id"))),
                "workstream": ws.get("workstream"),
                "workstream_group": ws.get("workstream_group"),
                "milestone": ws.get("milestone"),
                "status": ws.get("status"),
                "pdlc_phase": ws.get("pdlc_phase"),
                "start_date": ws.get("start_date"),
                "end_date": ws.get("end_date")
            }
        ))

    # 7. Seed Auxiliary Documents (CATQ, FACT, IA, DECK)
    aux_map = [
        ("CATQ-ECGT", "CategoryEligibility", "HAS_CATALOG_ELIGIBILITY", "catq"),
        ("FACT-ECGT", "Factsheet", "HAS_FACTSHEET", "factsheet"),
        ("IA-ECGT", "ImpactAssessment", "HAS_IMPACT_ASSESSMENT", "impactassessment"),
        ("DECK-ECGT", "ProductOverview", "HAS_PRODUCT_OVERVIEW", "productoverview")
    ]

    for doc_id, label, rel_type, type_urn in aux_map:
        doc_data = fixtures.get(doc_id, {})
        queries.append((
            f"""
            MERGE (n:{label} {{id: $id}})
            SET n.urn = $urn,
                n.title = $title,
                n.status = $status
            WITH n
            MATCH (p:Project {{id: "PROJ-ECGT"}})
            MERGE (p)-[:{rel_type}]->(n)
            """,
            {
                "id": doc_id,
                "urn": doc_data.get("urn", get_urn(type_urn, doc_id)),
                "title": doc_data.get("title", f"{label} Document"),
                "status": doc_data.get("status", "Approved")
            }
        ))

    # Execute all Cypher queries
    success = execute_cypher(queries)
    if success:
        logger.info("Neo4j Knowledge Graph seeding complete successfully.")
    else:
        logger.warning("Neo4j seeding encountered issues.")


def main():
    logger.info("=== Regulus ECGT Ingestion Script ===")
    fixtures = load_fixtures()
    seed_firestore(fixtures)
    seed_neo4j(fixtures)
    logger.info("=== Ingestion Finished Successfully ===")


if __name__ == "__main__":
    main()
