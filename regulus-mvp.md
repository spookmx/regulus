# Regulus — Regulatory Intelligence & Compliance Orchestration System
## MVP Definition v1.0 | 2026-08-02

---

## Proposed Name: Regulus

**Regulus** (Latin: *regulus* — root of *regulation*, *rule*; also the brightest star in Leo, the navigational "heart of the lion") replaces Project Nexus in name and in conception.

Nexus modeled connections between existing artifacts. Regulus models **provenance** — the traceable origin of every product decision back to law — and automates the lifecycle of compliance delivery end-to-end. The shift is from connection graph to compliance operating system.

---

## 1. Purpose & Principles

Regulus replaces the current state — dispersed Google Docs, Airtable tracking sheets, and fragmented handoffs — with a single connected system where the full regulatory chain is observable, traceable, and AI-assisted.

**Core invariant:** every product ticket, design spec, and content change must be traceable to a legal obligation in a ratified LRD. Every legal change propagates forward through the chain with structured human approval at each tier.

**Principles:**

1. **HITL at every tier boundary** — LRD approved → BRD can begin; BRD approved → PRD can begin; agents draft, humans approve
2. **Deterministic traceability** — graph traversal (no AI) for all queries answering *what exists* and *what is covered*
3. **Probabilistic agents** — AI only for proposals answering *what might need to change* (cascade proposals, drafts, extraction)
4. **Regulus is source of truth** — Airtable is a sync target, not the authoritative record
5. **Local-first agents** — Google Antigravity SDK running on localhost; Firebase for persistence; eBay MCP servers as first-class tool pipeline participants

---

## 2. Platform Architecture

**Agent runtime:** Google Antigravity SDK (Python ≥ 3.11)
- Agents are Antigravity `Agent` subclasses with typed tool pipelines
- MCP servers participate as first-class tools alongside custom Python callables and reusable skills
- Multimodal input via content classes (in-memory bytes) or filesystem paths (auto MIME resolution)
- MVP runs on `localhost` and uses Firebase emulators to create a local instance to test. Later stages will move to Firebase App Hosting

**Storage tiers:**

| Tier | Store | Content |
|------|-------|---------|
| Bronze | Cloud Firestore `artifacts/` | Raw document blobs, version history, attachments |
| Silver | Cloud Firestore `derived/` | Structured artifact fields, status, metadata |
| Gold | Neo4j Aura | Knowledge graph — nodes = artifacts, edges = relationships |
| Vector | Firestore vector index | Embedding-based semantic search across artifact text |

**Frontend:** Next.js 16.2.x App Router + Firebase App Hosting + TanStack Query (Firestore realtime)

**Auth:** Firebase Auth + custom claims encoding RASCI role per project

---

## 3. Artifact Type Inventory

Derived from ECGT pilot project + sampled regulatory projects (ROW, R2R, DSA KYT, CA OOPS, DPDP India, US CPSC, EU AI Act):

| Type | Abbr | Owner Role | Upstream | Downstream |
|------|------|-----------|----------|-----------|
| Legal Requirements Doc | LRD | Legal Counsel | — | BRD |
| Business Requirements Doc | BRD | PM (Legal input) | LRD | E2E PRD |
| E2E Product Requirements Doc | PRD | PM | BRD | Sub-PRDs, Jira |
| Sub-PRD | SPRD | PM | PRD | Jira |
| Regulatory Playbook | PLAY | PM | LRD, BRD | Decisions |
| Milestone Plan | MPLAN | PMO | BRD approved | Tasks |
| Decision Record | DEC | PM + Legal | any artifact | downstream artifacts |
| Action Item | ACTN | Any | meeting / decision | Task |
| Task | TASK | Assignee | any artifact | Jira (optional) |
| Change Request | CR | PM | any artifact | BRD / PRD update |
| Factsheet | FACT | PM | LRD / BRD | external stakeholders |
| Impact Assessment | IA | PM | LRD | BRD |
| Category Eligibility | CATQ | PM | LRD | BRD, PRD |
| Research Findings | RES | PM / Legal | — | LRD, BRD |
| Policy Brief | POLB | Policy | LRD | BRD |
| GTM Brief | GTM | PM | PRD approved | — |
| L10N Brief | L10N | PM / L10N | PRD | Engineering |
| Product Overview | DECK | PM | BRD / PRD | stakeholders |

---

## 4. Artifact Schemas

### 4.1 LRD — Legal Requirements Document

```
id:                  "LRD-{YYYY}-{###}"
title:               string
regulation:          string               # e.g. "EU Directive 2024/1799 (ECGT)"
jurisdiction:        string[]             # ["EU", "DE", "FR", ...]
enforcement_date:    date
grace_period_end:    date?
lrd_owner:           User                 # Legal Counsel
pm_owner:            User
status:              Draft | Legal Review | Approved | In Force | Superseded
version:             semver
created:             datetime
last_updated:        datetime

sections:
  legal_context:     richtext             # directive text summary, recitals
  obligations:       Obligation[]
  ebay_applicability: richtext            # which eBay surfaces/products are in scope
  affected_categories: string[]
  exemptions:        richtext
  open_legal_questions: OpenQuestion[]
  related_lrds:      LRD.id[]            # cross-references to other active LRDs

Obligation:
  id:                "OBL-{LRD_id}-{###}"
  article:           string              # "Article 3(1)(a)"
  text:              string              # obligation as written in directive
  type:              Display | Disclosure | Process | Prohibition | Reporting
  affected_surface:  string[]
  notes:             richtext?

OpenQuestion:
  id:                string
  question:          string
  asked_by:          User
  date_raised:       date
  resolution:        richtext?
  status:            Open | Resolved | Escalated

approvals:
  - approver:        User
    role:            string              # "Senior Legal Counsel"
    date:            datetime
    confirmed_via:   email
```

### 4.2 BRD — Business Requirements Document

```
id:                  "BRD-{project_code}-{###}"
title:               string
lrd_refs:            LRD.id[]
regulation:          string
brd_owner:           User                # PM
legal_stakeholders:  User[]
bu_lead:             User
status:              Draft | Legal Review | BU Review | Approved | Superseded
version:             semver
created:             datetime
last_updated:        datetime

sections:
  purpose_scope:     richtext
  customer_requirements: Requirement[]
  business_requirements: Requirement[]
  out_of_scope:      richtext
  risk_decisions:    RiskDecision[]      # inline risk-based decisions with rationale
  dependencies:      string[]            # other systems / projects

Requirement:
  id:                "BR-{###}"
  obligation_refs:   OBL.id[]           # maps to specific LRD obligations
  text:              string
  priority:          Must | Should | Could
  rationale:         richtext?

RiskDecision:
  id:                "RD-{###}"
  context:           richtext
  legal_basis:       string             # "Article 3(1)(a)"
  decision:          string
  risk_accepted:     boolean
  sign_offs:         Signoff[]

approvals:
  - approver:        User
    role:            string
    date:            datetime
```

### 4.3 E2E PRD — Product Requirements Document

```
id:                  "PRD-{project_code}"
title:               string
brd_ref:             BRD.id
lrd_refs:            LRD.id[]
prd_owner:           User
eng_lead:            User?
ux_lead:             User?
status:              Draft | PM Review | Eng Review | Approved | Delivered | Deferred
version:             semver
created:             datetime
last_updated:        datetime

sections:
  1_1_compliance:    PRDRequirement[]   # Required for regulatory compliance
  1_2_enhancements:  PRDRequirement[]   # Compliance-adjacent improvements
  2_deferred:        PRDRequirement[]   # Future / deferred scope

PRDRequirement:
  id:                "PRD-{###}-{1.1.x | 1.2.x | 2.x}"
  user_story:        string             # "As a seller in DE, I see..."
  brd_refs:          BR.id[]
  lrd_refs:          OBL.id[]
  acceptance_criteria: string[]
  notes_dependencies: richtext?
  jira_links:        string[]
  status:            Draft | Approved | In Dev | Done | Deferred
```

### 4.4 Sub-PRD

```
id:                  "SPRD-{project_code}-{###}"
title:               string
parent_prd:          PRD.id
scope:               string             # e.g. "DE market", "mobile surface"
requirements:        PRDRequirement[]
tech_notes:          richtext?
ux_notes:            richtext?
status:              Draft | Approved | Delivered | Deferred
```

### 4.5 Regulatory Playbook

```
id:                  "PLAY-{project_code}"
project_ref:         Project.id
lrd_refs:            LRD.id[]
owner:               User
version:             semver
last_updated:        datetime

risk_register:       Risk[]
decision_log:        Decision[]

Risk:
  id:                "RSK-{###}"
  date_identified:   date
  description:       string
  owner:             User
  likelihood:        1..5
  impact:            1..5
  risk_score:        number             # computed: likelihood × impact
  status:            Open | Mitigated | Accepted | Closed
  resolution_date:   date?
  closure_notes:     richtext?
  mitigation_plan:   richtext?

Decision:
  id:                "DEC-{###}"
  text:              string
  legal_basis:       string            # article reference
  type:              RiskBased | Policy | Scope | Operational
  context:           richtext
  status:            Open | Made | Reviewed | Superseded
  decision_date:     date?
  decision_maker:    User
  approvers:         User[]
  informed:          User[]
  rationale:         richtext
  related_risks:     RSK.id[]
  action_items:      ActionItem[]
```

### 4.6 Milestone Plan

```
id:                  "MPLAN-{project_code}"
project_ref:         Project.id
workstreams:         WorkstreamItem[]

WorkstreamItem:
  id:                "WS-{###}"
  workstream:        Policy | Legal | Product | Engineering | Design | UX |
                     QA | E2E Testing | GCX | Communications | Rollout
  workstream_group:  string            # e.g. "70: E2E Testing"
  milestone:         string            # e.g. "PRD Complete"
  deliverables:      richtext
  mandatory_milestone: boolean
  primary_poc:       User
  start_date:        date
  end_date:          date
  status:            Not Started | In Progress | Complete | At Risk | Blocked
  pdlc_phase:        Scoping | Design | Build | Test | Ramp | Live
  notes:             richtext?
```

### 4.7 Decision Record (cross-program, standalone)

```
id:                  "DEC-{YYYY}-{###}"
workstream_project:  string
decision_text:       string
regulation:          string[]
pm_owner:            User
bu_owner:            User
decision_date:       date
forum:               Reg Leads | BU Review | Legal Review | Exec | Async
status:              Open | Made | Reviewed | Superseded
notes:               richtext
action_items:        ActionItem[]
documentation_links: string[]
```

### 4.8 Action Item

```
id:                  "ACTN-{YYYY}-{###}"
date_raised:         date
workstream:          string
description:         richtext
owner:               User[]
forum:               Reg Leads | BU Review | Legal Review | Exec | Async | Meeting
due_date:            date
status:              Open | In Progress | Done | Blocked | Cancelled
notes:               richtext?
source:              Meeting | Decision | Manual | Agent
source_ref:          string?            # Zoom meeting UUID, DEC.id, etc.
project_refs:        Project.id[]
```

### 4.9 Task (operational, owner-tracked)

```
id:                  "TASK-{project_code}-{###}"
title:               string
description:         richtext
project_ref:         Project.id
workstream:          string
artifact_ref:        string?            # URN of any artifact that originated this task
assignee:            User
due_date:            date
priority:            P0 | P1 | P2 | P3
status:              Backlog | Todo | In Progress | Blocked | Done | Cancelled
created_by:          User | Agent.id
created_at:          datetime
slack_reminded:      boolean
jira_ticket:         string?
notes:               richtext?
```

### 4.10 Change Request

```
id:                  "CR-{YYYY}-{###}"
title:               string
description:         richtext
regulation:          string[]
requestor:           User
pm_lead:             User
date_raised:         date
date_approved:       date?
status:              Pending | Approved | Rejected | Deferred
notes:               richtext?
impacted_artifacts:  string[]           # LRD / BRD / PRD URNs
```

### 4.11 Project (portfolio entity)

```
id:                  "PROJ-{code}"     # e.g. "PROJ-ECGT"
name:                string
regulation:          string[]
product_capability:  string[]
program:             string?            # "Must Win" program designation
stack_rank:          number
pm_lead:             User
pgm_lead:            User
bu_lead:             User
project_phase:       Scoping | Design | Build | Test | Ramp | Live | Completed | Cancelled
project_status:      On Track | At Risk | Blocked | Complete
regulation_compliance_date: date
lts_date:            date?
ramp_start:          date?
ramp_end:            date?
ramp_pct:            percent?

document_refs:
  lrd:               LRD.id[]
  brd:               BRD.id[]
  prd:               PRD.id?
  playbook:          PLAY.id?
  milestone_plan:    MPLAN.id?

artifact_statuses:
  brd_status:        Not Started | In Draft | In Review | Approved
  brd_date:          date?
  prd_status:        Not Started | In Draft | In Review | Approved | Delivered
  prd_date:          date?
  design_status:     Not Started | In Progress | Complete

airtable_sync:
  base_id:           string             # appsAttrVGoHjSfHR
  record_id:         string
  last_synced:       datetime
  sync_status:       Synced | Conflict | Pending

dependency_domains:  string[]
jira_tickets:        string[]
figma_links:         string[]
```

---

## 5. Knowledge Graph

**Node types:** Project, LRD, Obligation, BRD, BRDRequirement, PRD, PRDRequirement, SubPRD, Playbook, Risk, Decision, MilestonePlan, WorkstreamItem, Task, ActionItem, ChangeRequest, User, JiraTicket, ZoomMeeting

**URN scheme:** `urn:regulus:{type}:{id}` — e.g. `urn:regulus:lrd:LRD-2024-001`

**Edge types:**

| Edge | Direction | Description |
|------|-----------|-------------|
| `DERIVES_FROM` | BRD→LRD, PRD→BRD, SPRD→PRD | Primary traceability chain |
| `MANDATES` | LRD→Obligation | Legal obligation ownership |
| `MAPS_TO` | BRDRequirement→Obligation | BRD coverage of legal obligations |
| `IMPLEMENTS` | PRDRequirement→BRDRequirement | Product-to-business mapping |
| `DELIVERS` | JiraTicket→PRDRequirement | Engineering delivery |
| `GOVERNS` | Playbook→Project | Playbook applies to project |
| `DECIDED_IN` | Decision→Playbook | Decision is logged in playbook |
| `MITIGATES` | Decision→Risk | Decision addresses a risk |
| `RAISES` | ZoomMeeting/Agent→ActionItem | Origination of action item |
| `ASSIGNED_TO` | Task→User | Task ownership |
| `BLOCKS` | Any→Any | Dependency blocking |
| `SUPERSEDES` | Artifact→Artifact | Version lineage |
| `RELATES_TO` | Any→Any | Soft cross-reference |

---

## 6. Agent Catalog

All agents built with Google Antigravity Python SDK. Each agent defines a typed tool pipeline of Python callables + MCP servers + skills.

### 6.1 LRD Drafting Agent

```
trigger:  User uploads regulation PDF or pastes regulation text
tools:    FileSystem, Firestore MCP, Neo4j MCP, LRD schema template
pipeline:
  1. Parse regulation text → extract obligations with article references
  2. Query Neo4j for related existing LRDs (semantic + RELATES_TO traversal)
  3. Draft LRD JSON conforming to §4.1 schema
  4. Flag open legal questions requiring counsel input
  5. Persist draft to Firestore + Neo4j LRD node
output:   Draft LRD routed to Action Center HITL review queue
```

### 6.2 BRD Drafting Agent

```
trigger:  LRD status transitions to Approved (HITL gate cleared) OR user invokes
tools:    Firestore MCP, Neo4j MCP, BRD schema template
pipeline:
  1. Load approved LRD + all Obligation nodes from Firestore / Neo4j
  2. For each obligation: generate candidate business requirement text
  3. Flag obligations with no candidate requirement (coverage gap)
  4. Draft risk-based decisions for high-impact obligations (risk_score ≥ 15)
  5. Persist draft BRD + DERIVES_FROM edge in Neo4j
output:   Draft BRD routed to legal + BU review queue
```

### 6.3 PRD Drafting Agent

```
trigger:  BRD status transitions to Approved OR user invokes
tools:    Firestore MCP, Neo4j MCP, E2E PRD schema template, Jira MCP
pipeline:
  1. Load approved BRD requirements from Neo4j
  2. For each BRDRequirement: draft user story with acceptance criteria
  3. Classify into sections 1.1 (compliance), 1.2 (enhancement), 2.x (deferred)
  4. Scan Neo4j for overlapping existing PRDRequirements; flag potential duplicates
  5. Persist draft PRD + IMPLEMENTS edges
output:   Draft PRD routed to PM review queue
```

### 6.4 Change Detection Agent

```
trigger:  Firestore write stream on any artifact document OR daily scheduled scan
tools:    Firestore MCP, Neo4j MCP, embedding service
pipeline:
  1. Compute semantic diff between current and prior version (embedding cosine distance)
  2. Classify severity:
       Minor    (< 0.05):  cosmetic fix       → no cascade, log only
       Moderate (0.05-0.20): content update   → cascade proposed, normal urgency
       Major    (0.20-0.40): structural change → cascade required, HITL gate
       Critical (> 0.40):  fundamental change  → immediate HITL + Slack alert
  3. Persist change_event record with diff summary
  4. If severity ≥ Moderate: invoke Cascade Proposal Agent
output:   Change event record; Cascade Proposal Agent triggered for significant changes
```

### 6.5 Cascade Proposal Agent

```
trigger:  Change Detection Agent (severity ≥ Moderate)
tools:    Neo4j MCP, Firestore MCP, LLM reasoning
pipeline:
  1. Load changed artifact + traverse all downstream nodes via graph
     (DERIVES_FROM, MANDATES, MAPS_TO, IMPLEMENTS, DELIVERS edges)
  2. For each downstream artifact: generate specific proposed text changes with rationale
  3. Assess impact on Playbook risks and decisions
  4. Create CascadeProposal record:
       id:                "CP-{YYYY}-{###}"
       source_artifact:   Artifact URN
       change_summary:    string
       severity:          Moderate | Major | Critical
       affected_artifacts: [{urn, proposed_change, confidence_score}]
       status:            Pending | Partially Approved | Approved | Rejected | Applied
       expires_at:        datetime   # 14-day review window
  5. Route each affected artifact change to Action Center for individual PM/Legal approval
output:   CascadeProposal in Action Center; downstream artifacts flagged "Pending Review"
```

### 6.6 Meeting Transcript Agent (Zoom MCP)

```
trigger:  Scheduled every 6 hours OR user invokes "sync meetings"
tools:    Zoom MCP, Firestore MCP, Neo4j MCP, Slack MCP
pipeline:
  1. Fetch new Zoom meeting transcripts since last sync via Zoom MCP
  2. For each transcript:
     a. Extract: decisions made, action items, requirement changes, risks flagged
        Patterns: "[DECIDED]", "we agreed", "action:", "@person will", "by [date]",
                  "concern", "risk", "change the requirement", "update the PRD"
     b. Match decisions to open Playbook decisions
        (fuzzy text + regulation + topic cosine similarity threshold 0.80)
     c. Match action items to open Tasks/ActionItems
        (dedup threshold: 0.85 cosine similarity)
     d. Create draft Task / ActionItem / Decision records with:
          source: Meeting
          source_ref: Zoom meeting UUID
          status: Pending Confirmation
  3. Route all extracted items to Action Center for user confirm/discard
  4. On confirmation: persist to Firestore + Neo4j (RAISES edge from ZoomMeeting node)
  5. Notify newly assigned task owners via Slack MCP
output:   Draft items in Action Center; Slack notifications to new assignees
sync schedule: every 6 hours; lookback window: 7 days (configurable)
```

### 6.7 Airtable Sync Agent

```
trigger:  Scheduled every 30 minutes OR on Regulus Project status change
tools:    Airtable MCP, Firestore MCP, Neo4j MCP

READ direction (Airtable → Regulus):
  1. Fetch changed records from H1'25 Roadmap (appsAttrVGoHjSfHR / tblVspI9r7fNhMfql)
     and [Reg] 2026 Decisions (tblbbr7giLLyuYPmk) and Action Items (tblp1Y3zPSLe4q92b)
  2. Map Airtable fields to Project / Decision / ActionItem schema (see §7.1 field map)
  3. Detect conflicts: where Regulus and Airtable disagree on the same field
  4. Surface conflicts in Action Center (do not auto-resolve)
  5. Apply non-conflicting updates to Regulus

WRITE direction (Regulus → Airtable):
  1. On Project artifact status / date change in Regulus: push mapped fields to Airtable
  2. On new Decision or Action Item created in Regulus: create corresponding Airtable record
  3. Append Regulus artifact URL to Airtable "Documentation Links" field

Ownership rule: Regulus is authoritative for artifact content and status.
                Airtable receives derived projections; conflicts always resolve to Regulus.
output:   Airtable records in sync; conflicts surfaced in Action Center
```

### 6.8 Slack Notification Agent

```
trigger:  Scheduled daily 9am + event-driven (task assigned, task blocked, HITL needed)
tools:    Slack MCP, Firestore MCP

Daily digest:
  1. Query Tasks with status In Progress | Blocked and due_date ≤ T+3 days
  2. Group by assignee
  3. DM each assignee: overdue + due-soon task list with Regulus links
  4. Post Monday 8am weekly summary to #regulatory-ops:
     project status snapshot, decisions made last week, tasks at risk

Event-driven:
  New task assigned:      DM assignee — title, due date, project, Regulus link
  Task becomes blocked:   DM assignee + blocker owner
  HITL approval needed:   DM each required approver — artifact, action, link
  Cascade proposal:       DM pm_owner + legal_owner — source change, n affected artifacts
  Decision ratification:  DM informed parties when all approvals received
output:   Slack DMs and channel messages per rule set above
```

### 6.9 Decision Extraction Agent

```
trigger:  Document ingested to Firestore OR user invokes on specific document
tools:    Firestore MCP, Neo4j MCP
pipeline:
  1. Parse document for decision-pattern signals
     (risk-based decisions, scope exclusions, policy exceptions, legal interpretations)
  2. Normalize each to Decision schema (type, legal basis, decision maker, rationale)
  3. Check Neo4j for semantic duplicates against existing Decision records (threshold 0.80)
  4. Create draft Decision records with source document reference (DECIDED_IN edge)
  5. Route to Action Center for PM confirmation before persisting
output:   Draft Decision records; linked to source artifact in knowledge graph
```

---

## 7. MCP Integration Specifications

### 7.1 Airtable MCP (eBay internal)

```
base_ids:
  primary:    appsAttrVGoHjSfHR   # "Regulatory Initiative" — create permission
  milestone:  app3QY7fQXJojaRNw   # "Milestone Plan Template" — create permission
  eprel:      appPn4ldG5YjSaHDr   # "EEK and EPREL Projects" — edit permission

key_table_ids:
  projects:           tblVspI9r7fNhMfql   # H1'25 Roadmap
  milestone_template: tblvrdVAIqtam1lp7   # Reg Milestone Plan Template
  decisions_2026:     tblbbr7giLLyuYPmk   # [Reg] 2026 Decisions
  action_items_2026:  tblp1Y3zPSLe4q92b   # [Reg] 2026 Action Items
  change_requests:    tbl1Qtyuv516w45a4   # Change Requests
  issues_tracker:     tblc2EP3h0OMFKZN7   # Major Issues Tracker

field_map (Regulus Project → Airtable H1'25 Roadmap):
  Project.name                     → fldLwW64czatkKnwt  (Project Name)
  Project.regulation               → fldEn6duMdGkLESKT  (Regulation)
  Project.pm_lead                  → fld1XQuIAz3Gweb7y  (PM Lead)
  Project.pgm_lead                 → fldDxlgwveZGBboH2  (PgM Lead)
  Project.bu_lead                  → fldLcNUQCsN28w93D  (BU Lead)
  Project.project_phase            → fld6PzkOg42HlCvxJ  (Project Phase)
  Project.project_status           → fldAN6gnVQAghzpyC  (Project Status)
  Project.artifact_statuses.brd_status  → fldRUGLrPNjHC8Ibm (BRD Status)
  Project.artifact_statuses.brd_date    → fldhGB3m0WPA0huM2 (BRD Date)
  Project.artifact_statuses.prd_status  → fldMCDrmO1JKLBgvr (PRD Status)
  Project.artifact_statuses.prd_date    → fldpWsHna6gZJfCcs (PRD Date)
  Project.lts_date                 → fldIFacQc89jaHViB  (LTS)
  Project.regulation_compliance_date → fld8dbdbSZHTeORch (Regulation Compliance Date)
  Project.dependency_domains       → fldrQSnptzQ8onbU4  (Dependency Domains)
  Project.jira_tickets             → fldNn8duwBjOjTnhj  (H1'25 JIRA Ticket)
  Regulus artifact URL             → fld6HJ5Od0gOj2LQC  (Documentation Links)
```

### 7.2 Zoom MCP (eBay internal)

```
operations:
  search_meetings:   find meetings by topic / attendee / date range
  get_transcript:    retrieve full transcript by meeting UUID
  get_summary:       retrieve AI-generated meeting summary + next steps

meeting_to_project_matching:
  primary:   meeting topic contains project regulation code or name
             (e.g. "ECGT", "Right to Repair", "DPDP")
  secondary: attendee list overlap with Project.pm_lead / Project.bu_lead
  fallback:  user manually links Zoom meeting UUID to Project in UI

transcript_extraction_targets:
  decisions:          "[DECIDED]", "we agreed", "decision is", "going with"
  action_items:       "action:", "@{name} will", "by {date}", "take offline"
  risk_flags:         "concern", "risk", "blocker", "legal review needed"
  requirement_changes: "change the requirement", "update the PRD", "new ask"

dedup_strategy:
  text_similarity_threshold: 0.85 cosine similarity
  if match: link source_ref to existing record — do not create new
  if new:   create draft with status = Pending Confirmation

sync_schedule:   every 6 hours
lookback_window: 7 days (configurable per project)
```

### 7.3 Slack MCP (eBay internal)

```
channels:
  ops_channel:    "#regulatory-ops"      # weekly digest, cascade proposals
  alerts_channel: "#regulatory-alerts"   # Critical-severity HITL items

notification_templates:
  new_task_assigned:
    target:   DM to assignee
    message:  "New task [{TASK_id}]: {title} | Due: {due_date} | Project: {project_name}
               | {regulus_url}"

  overdue_or_due_soon:
    target:   DM to assignee
    schedule: daily 9am
    message:  "You have {n} tasks due soon or overdue: {task_list}"

  hitl_approval_needed:
    target:   DM to each required approver
    message:  "Approval needed: {artifact_type} [{artifact_id}] — {title}
               | Approve at: {regulus_url}"

  cascade_proposal:
    target:   DM to pm_owner + legal_owner of affected artifacts
    message:  "Cascade proposal [{CP_id}]: change to {source_artifact} may require
               updates to {n} artifacts. Review: {regulus_url}"

  weekly_digest:
    target:   "#regulatory-ops"
    schedule: Monday 8am
    content:  projects at risk, decisions made last week, tasks overdue count,
              upcoming compliance dates (≤ 30 days)
```

### 7.4 Jira MCP (existing)

```
operations:
  create_issue:  from PRDRequirement (auto-creates DELIVERS edge in Neo4j)
  update_issue:  status sync on Done → marks PRDRequirement.status = Done
  link_issue:    binds Jira ticket ID to PRDRequirement.jira_links

ticket_template:
  summary:     "[{PRD_req_id}] {user_story_headline}"
  description: "{user_story}\n\nAcceptance Criteria:\n{acceptance_criteria}
                \n\nRegulus URN: {urn}\nBRD: {brd_refs}\nLRD: {lrd_refs}"
  labels:      ["regulatory", "{regulation_code}", "{project_code}"]
```

### 7.5 Figma MCP + GitHub MCP (existing, read-only linkage)

```
Figma:   link Figma file ID to PRD / Sub-PRD; surface design status in Project Detail view
GitHub:  link PR / commit to JiraTicket node; enables code → ticket → requirement trace
```

---

## 8. Traceability Engine (Deterministic)

Pure Neo4j Cypher graph traversal. No AI. Deterministic, auditable.

### Core Queries

```cypher
-- Upward: given Jira ticket, trace to originating legal obligation
MATCH path = (j:JiraTicket {id: $ticket_id})-[:DELIVERS*1..5]->(o:Obligation)
RETURN path

-- Downward: given LRD obligation, find all delivery status across tiers
MATCH (l:LRD {id: $lrd_id})-[:MANDATES]->(o:Obligation)
OPTIONAL MATCH (o)<-[:MAPS_TO]-(br:BRDRequirement)
OPTIONAL MATCH (br)<-[:IMPLEMENTS]-(pr:PRDRequirement)
OPTIONAL MATCH (pr)<-[:DELIVERS]-(j:JiraTicket)
RETURN o.id, o.text, br.id, pr.id, j.id, j.status

-- Coverage gap: LRD obligations with no BRD requirement
MATCH (l:LRD {id: $lrd_id})-[:MANDATES]->(o:Obligation)
WHERE NOT (o)<-[:MAPS_TO]-(:BRDRequirement)
RETURN o.id, o.article, o.text

-- Orphan Jira tickets: delivered but no PRD parent
MATCH (j:JiraTicket)
WHERE NOT ()-[:DELIVERS]->(j)
RETURN j.id, j.summary

-- Compliance completeness score
MATCH (l:LRD {id: $lrd_id})-[:MANDATES]->(o:Obligation)
OPTIONAL MATCH (o)<-[:MAPS_TO]-(br:BRDRequirement)<-[:IMPLEMENTS]-(pr:PRDRequirement)
OPTIONAL MATCH (pr)<-[:DELIVERS]-(jt:JiraTicket {status: "Done"})
RETURN
  count(DISTINCT o)  AS total_obligations,
  count(DISTINCT br) AS covered_in_brd,
  count(DISTINCT pr) AS covered_in_prd,
  count(DISTINCT jt) AS delivered
```

### Computed Metrics (deterministic, no AI)

| Metric | Formula |
|--------|---------|
| `compliance_score` | Done Jira tickets / total obligations |
| `brd_coverage` | obligations with BRD requirement / total obligations |
| `prd_coverage` | BRD requirements with PRD user story / total BRD requirements |
| `days_to_enforcement` | `regulation_compliance_date` − today |
| `artifact_completeness` | required artifacts present / required artifacts expected for phase |

---

## 9. Change Detection & Cascade Proposals (Probabilistic)

**CascadeProposal lifecycle:**

```
1. Firestore write triggers Change Detection Agent
2. Severity classification by embedding cosine distance (v_current vs v_prior):
     Minor    < 0.05  → log only, no cascade
     Moderate 0.05-0.20 → cascade proposed, Action Center (normal)
     Major    0.20-0.40 → cascade required, HITL gate blocked
     Critical > 0.40  → immediate HITL + Slack #regulatory-alerts

3. CascadeProposal created with per-affected-artifact proposed changes
4. PM / Legal review each change in Action Center individually
5. On approval per artifact: agent writes new version, creates audit record,
   updates graph edges
6. On rejection: cascade_proposal.status = Rejected; artifact unchanged
7. Expired proposals (14 days no action): auto-close + Slack reminder
```

---

## 10. Decision Management

**Lifecycle states:** Proposed → Open → Under Review → Made → Ratified → Superseded

**State transitions:**

| Transition | Trigger |
|-----------|---------|
| Proposed → Open | PM creates from template, agent draft, or meeting extraction |
| Open → Under Review | Legal / BU stakeholders begin async review |
| Under Review → Made | Decision maker records decision text + rationale |
| Made → Ratified | All required approvers confirm (Firebase Auth email-confirmed) |
| Ratified → Superseded | Newer decision linked via SUPERSEDES edge |

**Multi-user sign-off rules by Decision type:**

| Type | Required Approvers |
|------|-------------------|
| RiskBased | Legal Counsel + PM + BU Lead |
| Policy | Legal Counsel + PM |
| Scope | PM + BU Lead |
| Operational | PM |

**Sign-off mechanics:**
- Approval link sent via Slack DM; resolves via Firebase Auth session
- Deadline: `decision_date + 5 business days`; Slack reminder at T−2 days
- Ratification requires 100% of required approvers (no majority-rule)

**Action Center triggers on Decision state change:**
- Made → Action Center item created for each `action_items` entry
- Ratified → Cascade Proposal Agent checks downstream artifacts for impact
- Superseded → Slack DM to `Decision.informed` list

---

## 11. UI Views

### 11.1 Project Portfolio (home — replaces Airtable H1'25 Roadmap)

Columns: Project, Regulation, PM, Phase, Status, BRD, PRD, Compliance Date, Days-to-Enforcement, Compliance Score

Filters: Regulation, Status, PM, Phase, Program, Compliance Date range

Grouping options: by Regulation | by Phase | by PM | by Program

Color coding: Days-to-Enforcement (red ≤ 30, yellow ≤ 90, green > 90)

Quick actions per row: Open detail, View compliance score, Flag blocker, Sync to Airtable

### 11.2 Project Detail

Six tabs:

1. **Overview** — metadata, team (RASCI), dates, artifact status summary, Airtable sync status
2. **Artifacts** — LRD → BRD → PRD → Sub-PRDs → Jira chain with status badges; one-click open each document; compliance score bar
3. **Playbook** — Risk Register (sortable by score, status) + Decision Log (filterable by type, status, date)
4. **Milestone Plan** — workstream items in timeline view; status color-coded; POC and date per item
5. **Tasks & Actions** — kanban board (Backlog / Todo / In Progress / Blocked / Done); filter by assignee, workstream, priority
6. **Change History** — artifact version log with semantic diff viewer; cascade proposals log

### 11.3 Traceability View

Interactive graph (vis.js or Sigma.js):
- Nodes sized by artifact type, colored by status
- Edge labels show relationship type
- Click node → side panel with artifact summary and quick actions
- Highlight path: select any artifact → highlight full upward and downward chain
- Filters: artifact type, status, project, regulation

### 11.4 Action Center (HITL hub)

All items requiring human decisions, centralized:

| Item Type | Source Agent | Actions |
|-----------|-------------|---------|
| Cascade Proposal | Cascade Proposal Agent | Approve / Reject per affected artifact |
| HITL approval gate | System | Approve / Send back with comment |
| Decision sign-off | System | Approve / Reject |
| Meeting extraction | Meeting Transcript Agent | Confirm / Discard / Edit each item |
| Airtable sync conflict | Airtable Sync Agent | Use Regulus / Use Airtable / Merge |
| Agent draft review | LRD / BRD / PRD Agent | Accept / Edit before accepting / Reject |

Each item shows: priority badge, source, context summary, deadline, and Slack-notify button.

### 11.5 Decisions Dashboard (cross-project)

All decisions across all projects in one view:
- Filters: project, regulation, status, type, decision maker, date range
- Group by: project | regulation | status | forum
- Export: CSV for legal review packages

---

## 12. Authentication & RBAC

**Firebase Auth + custom claims (per project assignment):**

| Role | Permissions |
|------|------------|
| `legal_counsel` | read all; write + approve LRD; sign Decision |
| `pm_owner` | write all artifacts for assigned projects; approve BRD, PRD, Decisions |
| `pgm_lead` | read all; write Milestone Plan; write Tasks |
| `bu_lead` | read all; approve BRD |
| `eng_lead` | read all; write Jira ticket links |
| `viewer` | read-only (no write) |
| `portfolio_admin` | read all projects; manage user role assignments |
| `system_agent` | write artifacts via API (agent operations only; no UI) |

**RASCI per artifact tier:**

| Artifact | Responsible | Accountable | Supported by | Consulted | Informed |
|---------|------------|------------|-------------|-----------|---------|
| LRD | Legal Counsel | Legal Manager | PM | BU Lead | All stakeholders |
| BRD | PM | PM | Legal Counsel | BU Lead, Eng Lead | All |
| E2E PRD | PM | PM | Eng Lead, UX Lead | Legal, BU | All |
| Playbook | PM | PM | Legal | BU Lead | All |
| Milestone Plan | PMO | PM | Workstream leads | — | All |
| Decision | Decision Maker | PM | Legal | BU | Informed list |

---

## 13. Milestones

### M1 — Foundation (Months 1–3)

- Firebase project: Firestore schema for all artifact types + version history collection
- Neo4j Aura: initial graph model, all node and edge types, Cypher query library
- Next.js app: Firebase Auth, Project Portfolio view (read), Project Detail (read)
- CRUD APIs for all artifact types via Firebase Functions
- ECGT pilot data ingestion: all 9 artifacts manually mapped to Regulus schema
- Deterministic traceability view (basic graph render) + compliance score computation
- Airtable field map validated against live `appsAttrVGoHjSfHR` base

### M2 — Agent Core + HITL (Months 4–6)

- Google Antigravity SDK integration; agent runner on localhost
- LRD Drafting Agent + BRD Drafting Agent
- Change Detection Agent + Cascade Proposal Agent
- Action Center UI (all item types)
- Decision Management: full lifecycle + multi-user sign-offs
- Zoom MCP integration + Meeting Transcript Agent
- Slack MCP integration + Notification Agent (all rules)
- Project Detail: Artifacts tab (full chain), Playbook tab, Change History tab

### M3 — Full Integration + Sync (Months 7–9)

- PRD Drafting Agent + Decision Extraction Agent
- Airtable Sync Agent (bidirectional, all mapped tables)
- Jira MCP: ticket creation from PRDRequirement; DELIVERS edge auto-creation
- GitHub MCP + Figma MCP: artifact linking from Project Detail
- Airtable Sync Agent: full conflict resolution in Action Center
- Slack Notification Agent: complete rule set including weekly digest
- Decisions Dashboard (cross-project)
- ECGT end-to-end validation: LRD → BRD → PRD → Jira; compliance score = 100% for delivered requirements before Sept 27, 2026 enforcement date

---

## 14. ECGT Pilot Plan

ECGT (EU Directive for Empowering Consumers in the Green Transition, enforcement: **September 27, 2026 — 56 days**) is the M1 seed dataset and M3 validation target.

### Seed ingestion map

| Artifact | Regulus ID | Source (Google Drive) |
|----------|-----------|----------------------|
| LRD | LRD-2024-001 | `1CmiJAawPwSaadgy_98Lxqpco4GE-ePMz0Z6OPneQUjY` |
| BRD | BRD-ECGT-001 | `1dD1Ph7EMLqq1CtGOzRq2cpJyH2UBo3Q09OHMmB-mU04` |
| E2E PRD | PRD-ECGT | `1ez9vp19uPossSnS8K6IkMEDT7w1BI38g2p8GGZYoeLY` |
| Regulatory Playbook | PLAY-ECGT | `1-lmwYj72WhcDsX47tZG2UF16S1Ij-Dk0D-b8IGMvbM0` |
| Milestone Plan | MPLAN-ECGT | `19Ye3pEwVfNIW8-WQ9jKy67SVRCamZkKMjzQVS3L9yaY` |
| Category Eligibility | CATQ-ECGT | `1qOupFiBHBPasNBSv8TimzyxV6b0nCaIeDxodLU7Nwkg` |
| Factsheet | FACT-ECGT | `1267cBEsZJkJTEInJVMPk7fpwFxZUO5lfWXMlJaA-v0E` |
| Impact Assessment | IA-ECGT | `1qW6D1Rp4G9ah0hNLgl7Z60qO5VrYjt-xbakcVNPaT90` |
| Product Overview | DECK-ECGT | `1U4WRtq_uQRikkrfh3mchCkG03Wmf9doF7mZT_iQHTkY` |

**M1 graph edges to establish for ECGT:**
- `LRD-2024-001 -[MANDATES]→ OBL-*` (extract all obligations with article references)
- `BRD-ECGT-001 -[DERIVES_FROM]→ LRD-2024-001`
- `BRD requirements -[MAPS_TO]→ OBL-*`
- `PRD-ECGT -[DERIVES_FROM]→ BRD-ECGT-001`
- `PRD requirements -[IMPLEMENTS]→ BR-*`
- `PLAY-ECGT -[GOVERNS]→ PROJ-ECGT`
- ECGT decisions extracted from Playbook Decision Log → Decision nodes
- ECGT risks extracted from Playbook Risk Register → Risk nodes

**M3 validation:** run compliance score query; target 100% obligation → delivered Jira ticket coverage for section 1.1 (compliance-required) requirements

---

## 15. Local Development Setup

```bash
# Prerequisites
python >= 3.11
node >= 22.x
firebase-cli >= 13.x
antigravity-sdk >= 2.0.x    # Google Antigravity SDK (confirm eBay Google partnership access)
docker                      # for local Neo4j

# Firebase
firebase login
firebase init               # hosting, firestore, auth, storage, functions
firebase emulators:start

# Neo4j (local)
docker run -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/regulus \
  neo4j:5

# Python agent runtime
pip install antigravity-sdk firebase-admin neo4j python-dotenv httpx
cp .env.example .env        # fill MCP URLs below
python agents/main.py --env local

# Next.js frontend
npm install
npm run dev                 # http://localhost:3000

# .env (MCP server URLs — requires eBay VPN / internal network)
AIRTABLE_MCP_URL=http://mcp-airtable.internal:8080
ZOOM_MCP_URL=http://mcp-zoom.internal:8080
SLACK_MCP_URL=http://mcp-slack.internal:8080
JIRA_MCP_URL=http://mcp-jira.internal:8080
FIGMA_MCP_URL=http://mcp-figma.internal:8080
GITHUB_MCP_URL=http://mcp-github.internal:8080
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=regulus
```

---

## 16. Open Decisions (alignment required before M1)

| # | Decision | Recommendation |
|---|----------|---------------|
| 1 | **Neo4j hosting** — Aura Free (15k node limit) vs. Aura Professional vs. local Docker | Aura Professional: no infra management, no node cap risk for full regulatory portfolio |
| 2 | **Antigravity SDK access** — confirm eBay has Antigravity 2.0 SDK access under Google partnership (not publicly GA as of Aug 2026) | Verify with eBay Google TAM before committing to Antigravity as build platform; fallback: standard LangGraph + Python |
| 3 | **Airtable write ownership** — existing owners continue updating Airtable directly; Regulus sync will surface conflicts | Need team agreement: Regulus is authoritative from M1 go-live; Airtable becomes read-only display for non-Regulus users |
| 4 | **HITL strictness** — can agents create final records directly or must they always route through Action Center? | Agents always create drafts; Action Center confirmation required for all agent-generated records — no silent writes |
| 5 | **ECGT seed ingestion timeline** — enforcement Sept 27, 2026 (56 days) | M1 seed ingestion must complete within 2 weeks to leave time for M2 change detection validation before go-live |
