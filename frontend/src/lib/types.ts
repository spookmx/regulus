export type UserRole =
  | 'legal_counsel'
  | 'pm_owner'
  | 'pgm_lead'
  | 'bu_lead'
  | 'eng_lead'
  | 'portfolio_admin'
  | 'viewer';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

export type RegulationType = 'EU AI Act' | 'DORA' | 'ESG Disclosures' | 'MiCA' | 'GDPR';
export type ProjectStatus = 'On Track' | 'At Risk' | 'Blocked' | 'Completed';
export type PhaseType = 'Discovery' | 'Framing' | 'Execution' | 'Verification' | 'Sign-off';

export interface Project {
  id: string;
  name: string;
  code: string;
  regulation: RegulationType;
  program: string;
  pm: string;
  phase: PhaseType;
  status: ProjectStatus;
  brdStatus: string;
  prdStatus: string;
  complianceDate: string; // YYYY-MM-DD
  daysToEnforcement: number; // calculated or fixed
  complianceScore: number; // percentage 0-100
  description: string;
  airtableSyncStatus: 'In Sync' | 'Pending Sync' | 'Conflict';
  lastSyncedAt: string;
  rasci: {
    responsible: string;
    accountable: string;
    supportedBy: string;
    consulted: string;
    informed: string;
  };
}

export interface Obligation {
  id: string;
  urn?: string;
  article: string;
  text: string;
  type: 'Display' | 'Disclosure' | 'Process' | 'Prohibition' | 'Reporting';
  affected_surface: string[];
  notes?: string;
  traceability_refs?: string[];
}

export interface OpenQuestion {
  id: string;
  question: string;
  asked_by: {
    id?: string;
    name: string;
    email?: string;
    role?: string;
  };
  date_raised: string;
  resolution?: string;
  status: 'Open' | 'Resolved' | 'Escalated';
  linked_obligation_id?: string;
}

export interface Approval {
  approver: {
    id?: string;
    name: string;
    email?: string;
    role?: string;
  };
  role: string;
  date: string;
  confirmed_via?: string;
}

export interface AuditLogChange {
  field: string;
  oldValue: string;
  newValue: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  author: {
    name: string;
    role: string;
    email?: string;
  };
  targetComponent: 'Overview Context' | 'Obligation' | 'Open Question' | 'Approval' | 'Governance Metadata';
  action: 'Created' | 'Edited' | 'Resolved' | 'Deleted' | 'Status Changed' | 'Signed Off';
  summary: string;
  changes?: AuditLogChange[];
}

export interface LRDSections {
  legal_context: string;
  obligations: Obligation[];
  ebay_applicability: string;
  affected_categories: string[];
  exemptions: string;
  open_legal_questions: OpenQuestion[];
  related_lrds: string[];
}

export interface LRDFullDocument {
  id: string;
  urn: string;
  title: string;
  regulation: string;
  jurisdiction: string[];
  enforcement_date: string;
  grace_period_end?: string;
  lrd_owner: { id?: string; name: string; email?: string; role?: string };
  pm_owner: { id?: string; name: string; email?: string; role?: string };
  status: 'Draft' | 'Legal Review' | 'Approved' | 'In Force' | 'Superseded';
  version: string;
  created: string;
  last_updated: string;
  sections: LRDSections;
  approvals: Approval[];
  audit_log?: AuditLogEntry[];
}

export interface ArtifactNode {
  id: string;
  title: string;
  tier: 'LRD' | 'BRD' | 'PRD' | 'Sub-PRD' | 'Jira';
  status: 'Draft' | 'In Review' | 'Approved' | 'Blocked' | 'Implemented';
  version: string;
  complianceScore: number;
  lastUpdated: string;
  owner: string;
  link: string;
  summary: string;
  projectId: string;
  fullLrd?: LRDFullDocument;
}

export interface ArtifactEdge {
  id: string;
  source: string;
  target: string;
  label: 'DERIVES_FROM' | 'MANDATES' | 'MAPS_TO' | 'IMPLEMENTS' | 'DELIVERS';
}

export interface RiskItem {
  id: string;
  projectId: string;
  riskTitle: string;
  category: 'Legal' | 'Technical' | 'Operational' | 'Data Privacy';
  severity: 'High' | 'Medium' | 'Low';
  likelihood: 'High' | 'Medium' | 'Low';
  score: number; // 1-25
  status: 'Open' | 'Mitigated' | 'Accepted' | 'Under Review';
  mitigation: string;
  owner: string;
}

export interface DecisionItem {
  id: string;
  projectId: string;
  projectName: string;
  regulation: RegulationType;
  title: string;
  type: 'Architectural' | 'Regulatory Interpretation' | 'Scope Adjustment' | 'Policy Approval';
  decisionMaker: string;
  status: 'Proposed' | 'Under Review' | 'Signed Off' | 'Rejected';
  date: string;
  forum: 'SteerCo' | 'Legal Committee' | 'Architecture Board' | 'PMO';
  rationale: string;
}

export interface MilestoneItem {
  id: string;
  projectId: string;
  workstream: string;
  title: string;
  poc: string;
  targetDate: string;
  status: 'Completed' | 'In Progress' | 'Not Started' | 'Delayed';
}

export interface TaskItem {
  id: string;
  projectId: string;
  title: string;
  workstream: string;
  assignee: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Backlog' | 'Todo' | 'In Progress' | 'Blocked' | 'Done';
  dueDate: string;
}

export interface VersionHistoryItem {
  id: string;
  projectId: string;
  artifactName: string;
  version: string;
  author: string;
  timestamp: string;
  summary: string;
  diffBefore: string;
  diffAfter: string;
}

export type ActionItemType =
  | 'Cascade Proposal'
  | 'HITL approval gate'
  | 'Decision sign-off'
  | 'Meeting extraction'
  | 'Airtable sync conflict'
  | 'Agent draft review';

export interface ActionCenterItem {
  id: string;
  title: string;
  type: ActionItemType;
  sourceAgent: string;
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  projectId: string;
  projectName: string;
  contextSummary: string;
  deadline: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Merged' | 'Discarded';
  slackNotified: boolean;
  artifactAffected?: string;
  diffSnippet?: {
    before: string;
    after: string;
  };
}
