import os
from typing import Dict, Any, List, Optional
from neo4j import GraphDatabase, Driver

class Neo4jEngine:
    def __init__(self, uri: Optional[str] = None, user: Optional[str] = None, password: Optional[str] = None):
        self.uri = uri or os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.user = user or os.getenv("NEO4J_USER", "neo4j")
        self.password = password or os.getenv("NEO4J_PASSWORD", "regulus")
        self._driver: Optional[Driver] = None

    def connect(self) -> Driver:
        if not self._driver:
            self._driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password))
        return self._driver

    def close(self):
        if self._driver:
            self._driver.close()
            self._driver = None

    @staticmethod
    def format_urn(entity_type: str, entity_id: str) -> str:
        """Construct standard URN format: urn:regulus:{type}:{id}"""
        return f"urn:regulus:{entity_type.lower()}:{entity_id}"

    # --- Query Generators ---

    @staticmethod
    def get_upward_trace_query(ticket_id: str) -> str:
        """Cypher query for upward traceability from Jira ticket to originating obligation."""
        return f"""
        MATCH path = (j:JiraTicket {{id: '{ticket_id}'}})-[:DELIVERS*1..5]->(o:Obligation)
        RETURN path
        """

    @staticmethod
    def get_downward_trace_query(lrd_id: str) -> str:
        """Cypher query for downward traceability from LRD obligation to delivery status across tiers."""
        return f"""
        MATCH (l:LRD {{id: '{lrd_id}'}})-[:MANDATES]->(o:Obligation)
        OPTIONAL MATCH (o)<-[:MAPS_TO]-(br:BRDRequirement)
        OPTIONAL MATCH (br)<-[:IMPLEMENTS]-(pr:PRDRequirement)
        OPTIONAL MATCH (pr)<-[:DELIVERS]-(j:JiraTicket)
        RETURN o.id AS obligation_id, o.text AS obligation_text, br.id AS brd_req_id, pr.id AS prd_req_id, j.id AS jira_ticket_id, j.status AS jira_status
        """

    @staticmethod
    def get_coverage_gap_query(lrd_id: str) -> str:
        """Cypher query for obligations without BRD requirement mapping."""
        return f"""
        MATCH (l:LRD {{id: '{lrd_id}'}})-[:MANDATES]->(o:Obligation)
        WHERE NOT (o)<-[:MAPS_TO]-(:BRDRequirement)
        RETURN o.id AS obligation_id, o.article AS article, o.text AS text
        """

    @staticmethod
    def get_orphan_jira_query() -> str:
        """Cypher query for Jira tickets delivered without PRD parent."""
        return """
        MATCH (j:JiraTicket)
        WHERE NOT ()-[:DELIVERS]->(j)
        RETURN j.id AS jira_id, j.summary AS summary
        """

    @staticmethod
    def get_compliance_metrics_query(lrd_id: str) -> str:
        """Cypher query for calculating compliance completeness metrics."""
        return f"""
        MATCH (l:LRD {{id: '{lrd_id}'}})-[:MANDATES]->(o:Obligation)
        OPTIONAL MATCH (o)<-[:MAPS_TO]-(br:BRDRequirement)
        OPTIONAL MATCH (br)<-[:IMPLEMENTS]-(pr:PRDRequirement)
        OPTIONAL MATCH (pr)<-[:DELIVERS]-(jt:JiraTicket)
        WITH l, o, br, pr, jt
        RETURN
          count(DISTINCT o) AS total_obligations,
          count(DISTINCT CASE WHEN br IS NOT NULL THEN o END) AS covered_in_brd,
          count(DISTINCT CASE WHEN pr IS NOT NULL THEN br END) AS brd_reqs_covered_in_prd,
          count(DISTINCT CASE WHEN jt.status = 'Done' THEN jt END) AS delivered_jira
        """

    @staticmethod
    def calculate_metrics(
        total_obligations: int,
        covered_in_brd: int,
        brd_reqs_covered_in_prd: int,
        delivered_jira: int
    ) -> Dict[str, float]:
        """Compute deterministic compliance score metrics."""
        compliance_score = (delivered_jira / total_obligations) if total_obligations > 0 else 0.0
        brd_coverage = (covered_in_brd / total_obligations) if total_obligations > 0 else 0.0
        prd_coverage = (brd_reqs_covered_in_prd / covered_in_brd) if covered_in_brd > 0 else 0.0

        return {
            "compliance_score": round(compliance_score, 4),
            "brd_coverage": round(brd_coverage, 4),
            "prd_coverage": round(prd_coverage, 4),
        }

    # --- Driver Execution Methods ---

    def execute_query(self, query: str, parameters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        driver = self.connect()
        with driver.session() as session:
            result = session.run(query, parameters or {})
            return [record.data() for record in result]
