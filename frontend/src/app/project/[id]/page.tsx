'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import {
  INITIAL_PROJECTS,
  INITIAL_ARTIFACTS,
  INITIAL_RISKS,
  INITIAL_DECISIONS,
  INITIAL_MILESTONES,
  INITIAL_TASKS,
  INITIAL_VERSION_HISTORY,
} from '@/lib/mockData';
import {
  Project,
  ArtifactNode,
  RiskItem,
  DecisionItem,
  MilestoneItem,
  TaskItem,
  VersionHistoryItem,
} from '@/lib/types';
import {
  ArrowLeft,
  Calendar,
  UserCheck,
  RefreshCw,
  FileText,
  AlertTriangle,
  GitBranch,
  Kanban,
  History,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  ArrowRight,
  Filter,
  Eye,
  Edit3,
} from 'lucide-react';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = (params?.id as string) || 'prj-ecgt';

  const { canWriteArtifacts, canApproveBRDPRD, canWriteTasks, canWriteMilestones } = useAuth();

  // Find project or default to ECGT
  const project: Project =
    INITIAL_PROJECTS.find((p) => p.id === projectId) || INITIAL_PROJECTS[0];

  const [activeTab, setActiveTab] = useState<
    'overview' | 'artifacts' | 'playbook' | 'milestones' | 'tasks' | 'history'
  >('overview');

  // State for interactive features
  const [artifacts, setArtifacts] = useState<ArtifactNode[]>(
    INITIAL_ARTIFACTS[projectId] || INITIAL_ARTIFACTS['prj-ecgt']
  );
  const [risks, setRisks] = useState<RiskItem[]>(
    INITIAL_RISKS[projectId] || INITIAL_RISKS['prj-ecgt'] || []
  );
  const [decisions, setDecisions] = useState<DecisionItem[]>(
    INITIAL_DECISIONS.filter((d) => d.projectId === projectId)
  );
  const [milestones, setMilestones] = useState<MilestoneItem[]>(
    INITIAL_MILESTONES[projectId] || INITIAL_MILESTONES['prj-ecgt'] || []
  );
  const [tasks, setTasks] = useState<TaskItem[]>(
    INITIAL_TASKS[projectId] || INITIAL_TASKS['prj-ecgt'] || []
  );
  const [history, setHistory] = useState<VersionHistoryItem[]>(
    INITIAL_VERSION_HISTORY[projectId] || INITIAL_VERSION_HISTORY['prj-ecgt'] || []
  );

  // Playbook sorting & filtering
  const [riskSort, setRiskSort] = useState<'score' | 'severity'>('score');
  const [decisionFilter, setDecisionFilter] = useState<string>('ALL');

  // Kanban task filtering
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<string>('ALL');

  // Modal artifact inspector
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactNode | null>(null);

  // Handle task status shift in Kanban (§11.2 tab 5)
  const moveTask = (taskId: string, newStatus: TaskItem['status']) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-ebay-bg-primary text-ebay-fg-primary transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-6">
        {/* Top Header Breadcrumb & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 evo-card p-6 shadow-sm">
          <div className="space-y-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-ebay-blue hover:underline font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Portfolio
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-ebay-fg-primary">
                {project.name}
              </h1>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-ebay-blue/10 text-ebay-blue border border-ebay-blue/30">
                {project.code}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-ebay-green-bg text-ebay-green border border-green-500/30">
                {project.regulation}
              </span>
            </div>
            <p className="text-ebay-fg-secondary text-xs max-w-3xl">{project.description}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-ebay-bg-secondary border border-ebay-border px-4 py-2 rounded-2xl text-right">
              <div className="text-[10px] uppercase font-bold text-ebay-fg-secondary">Compliance Score</div>
              <div className="text-xl font-extrabold text-ebay-green">{project.complianceScore}%</div>
            </div>
            <div className="bg-ebay-bg-secondary border border-ebay-border px-4 py-2 rounded-2xl text-right">
              <div className="text-[10px] uppercase font-bold text-ebay-fg-secondary">Days to Enforcement</div>
              <div className="text-xl font-extrabold text-ebay-amber">{project.daysToEnforcement}d</div>
            </div>
          </div>
        </div>

        {/* 6 Tabs Navigation (§11.2) */}
        <div className="flex items-center border-b border-ebay-border overflow-x-auto gap-2 text-xs font-semibold pb-1">
          {[
            { id: 'overview', label: '1. Overview', icon: FileText },
            { id: 'artifacts', label: '2. Artifacts Chain', icon: GitBranch },
            { id: 'playbook', label: '3. Risk & Decision Playbook', icon: AlertTriangle },
            { id: 'milestones', label: '4. Milestone Plan', icon: Calendar },
            { id: 'tasks', label: '5. Tasks Kanban', icon: Kanban },
            { id: 'history', label: '6. Change History & Diffs', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
                  active
                    ? 'border-ebay-blue bg-ebay-blue/10 text-ebay-blue font-bold'
                    : 'border-transparent text-ebay-fg-secondary hover:text-ebay-fg-primary hover:bg-ebay-bg-secondary'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-ebay-blue' : 'text-ebay-fg-secondary'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Metadata & RASCI Team */}
            <div className="lg:col-span-2 space-y-6">
              <div className="evo-card p-6 space-y-4 shadow-sm">
                <h3 className="text-base font-bold text-ebay-fg-primary flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-ebay-blue" />
                  RASCI Team Assignment Matrix (§12)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-ebay-bg-secondary p-3 rounded-2xl border border-ebay-border">
                    <span className="text-[10px] text-ebay-blue uppercase font-bold">Responsible (R)</span>
                    <p className="font-semibold text-ebay-fg-primary mt-0.5">{project.rasci.responsible}</p>
                  </div>
                  <div className="bg-ebay-bg-secondary p-3 rounded-2xl border border-ebay-border">
                    <span className="text-[10px] text-ebay-amber uppercase font-bold">Accountable (A)</span>
                    <p className="font-semibold text-ebay-fg-primary mt-0.5">{project.rasci.accountable}</p>
                  </div>
                  <div className="bg-ebay-bg-secondary p-3 rounded-2xl border border-ebay-border">
                    <span className="text-[10px] text-ebay-blue uppercase font-bold">Supported By (S)</span>
                    <p className="font-semibold text-ebay-fg-primary mt-0.5">{project.rasci.supportedBy}</p>
                  </div>
                  <div className="bg-ebay-bg-secondary p-3 rounded-2xl border border-ebay-border">
                    <span className="text-[10px] text-ebay-fg-secondary uppercase font-bold">Consulted (C)</span>
                    <p className="font-semibold text-ebay-fg-primary mt-0.5">{project.rasci.consulted}</p>
                  </div>
                  <div className="sm:col-span-2 bg-ebay-bg-secondary p-3 rounded-2xl border border-ebay-border">
                    <span className="text-[10px] text-ebay-green uppercase font-bold">Informed (I)</span>
                    <p className="font-semibold text-ebay-fg-primary mt-0.5">{project.rasci.informed}</p>
                  </div>
                </div>
              </div>

              {/* Key Dates & Milestones Summary */}
              <div className="evo-card p-6 space-y-4 shadow-sm">
                <h3 className="text-base font-bold text-ebay-fg-primary flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-ebay-blue" /> Key Timeline Dates
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="bg-ebay-bg-secondary p-4 rounded-2xl border border-ebay-border space-y-1">
                    <span className="text-[10px] text-ebay-fg-secondary uppercase font-bold">Enforcement Deadline</span>
                    <p className="font-mono text-sm font-bold text-ebay-red">{project.complianceDate}</p>
                  </div>
                  <div className="bg-ebay-bg-secondary p-4 rounded-2xl border border-ebay-border space-y-1">
                    <span className="text-[10px] text-ebay-fg-secondary uppercase font-bold">Current Phase</span>
                    <p className="font-mono text-sm font-bold text-ebay-amber">{project.phase}</p>
                  </div>
                  <div className="bg-ebay-bg-secondary p-4 rounded-2xl border border-ebay-border space-y-1">
                    <span className="text-[10px] text-ebay-fg-secondary uppercase font-bold">BRD / PRD Status</span>
                    <p className="font-mono text-sm font-bold text-ebay-green">{project.brdStatus} / {project.prdStatus}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Airtable Sync Status & Summary Sidebar */}
            <div className="space-y-6">
              <div className="evo-card p-6 space-y-4 shadow-sm">
                <h3 className="text-base font-bold text-ebay-fg-primary flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-ebay-blue" /> Airtable Sync Status
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-ebay-fg-secondary">Sync State</span>
                    <span
                      className={`evo-badge ${
                        project.airtableSyncStatus === 'In Sync'
                          ? 'bg-ebay-green-bg text-ebay-green border border-green-500/20'
                          : project.airtableSyncStatus === 'Pending Sync'
                          ? 'bg-ebay-amber-bg text-ebay-amber border border-amber-500/20'
                          : 'bg-ebay-red-bg text-ebay-red border border-red-500/20'
                      }`}
                    >
                      {project.airtableSyncStatus}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-ebay-fg-secondary">Target Base</span>
                    <span className="font-mono text-ebay-fg-primary">appsAttrVGoHjSfHR</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-ebay-fg-secondary">Last Synced</span>
                    <span className="font-mono text-ebay-fg-secondary">{project.lastSyncedAt}</span>
                  </div>

                  <button className="w-full mt-2 py-2 rounded-full text-xs font-semibold bg-ebay-blue/10 text-ebay-blue border border-ebay-blue/30 hover:bg-ebay-blue/20 transition-all flex items-center justify-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5" /> Trigger Bi-directional Sync
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ARTIFACTS CHAIN (§11.2) */}
        {activeTab === 'artifacts' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between evo-card p-4 shadow-sm">
              <div>
                <h3 className="font-bold text-ebay-fg-primary text-sm">Regulatory Lineage Chain</h3>
                <p className="text-xs text-ebay-fg-secondary">LRD → BRD → PRD → Sub-PRD → Jira implementation flow with compliance validation badges.</p>
              </div>
              {canWriteArtifacts && (
                <button className="px-4 py-2 rounded-full text-xs font-semibold bg-ebay-blue text-white shadow-sm hover:bg-blue-700 flex items-center gap-1.5 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Create Artifact
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {artifacts.map((art, idx) => (
                <div key={art.id} className="relative group">
                  <div className="evo-card p-5 space-y-3 shadow-sm hover:shadow-md border border-ebay-border transition-all flex flex-col justify-between h-full">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-ebay-blue/10 text-ebay-blue border border-ebay-blue/30">
                          {art.tier}
                        </span>
                        <span className="text-[10px] font-mono text-ebay-fg-secondary">{art.version}</span>
                      </div>

                      <h4 className="font-bold text-xs text-ebay-fg-primary line-clamp-2">{art.title}</h4>
                      <p className="text-[11px] text-ebay-fg-secondary line-clamp-3">{art.summary}</p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-ebay-border">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-ebay-fg-secondary">Status</span>
                        <span className="font-semibold text-ebay-green">{art.status}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-ebay-fg-secondary">Compliance Bar</span>
                          <span className="font-bold text-ebay-blue">{art.complianceScore}%</span>
                        </div>
                        <div className="w-full h-1 bg-ebay-bg-secondary rounded-full overflow-hidden border border-ebay-border">
                          <div
                            className="h-full bg-ebay-blue rounded-full"
                            style={{ width: `${art.complianceScore}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 pt-1">
                        <button
                          onClick={() => setSelectedArtifact(art)}
                          className="w-full py-1.5 rounded-full bg-ebay-bg-secondary hover:bg-ebay-bg-tertiary text-ebay-fg-primary border border-ebay-border text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> Quick Inspect
                        </button>
                        <Link
                          href={`/artifact/${art.id}`}
                          className="w-full py-1.5 rounded-full bg-ebay-blue hover:bg-blue-700 text-white text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 shadow-xs"
                        >
                          <ExternalLink className="w-3 h-3" /> Open Dedicated View
                        </Link>
                      </div>
                    </div>
                  </div>

                  {idx < artifacts.length - 1 && (
                    <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-ebay-bg-card border border-ebay-border items-center justify-center text-ebay-fg-secondary shadow-sm">
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Selected Artifact Modal */}
            {selectedArtifact && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
                <div className="evo-card w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-ebay-blue/10 text-ebay-blue border border-ebay-blue/30">
                        {selectedArtifact.tier} • {selectedArtifact.version}
                      </span>
                      <h3 className="font-bold text-lg text-ebay-fg-primary mt-1">{selectedArtifact.title}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedArtifact(null)}
                      className="text-ebay-fg-secondary hover:text-ebay-fg-primary text-sm font-bold p-1 rounded-full hover:bg-ebay-bg-secondary"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-3 text-xs text-ebay-fg-primary">
                    <p className="bg-ebay-bg-secondary p-3 rounded-2xl border border-ebay-border">{selectedArtifact.summary}</p>
                    <div className="grid grid-cols-2 gap-2 font-mono text-ebay-fg-secondary">
                      <div>Owner: <span className="text-ebay-blue font-bold">{selectedArtifact.owner}</span></div>
                      <div>Status: <span className="text-ebay-green font-bold">{selectedArtifact.status}</span></div>
                      <div>Updated: <span className="text-ebay-fg-primary">{selectedArtifact.lastUpdated}</span></div>
                      <div>Compliance Score: <span className="text-ebay-blue font-bold">{selectedArtifact.complianceScore}%</span></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-ebay-border">
                    <Link
                      href={`/artifact/${selectedArtifact.id}`}
                      className="px-4 py-2 rounded-full text-xs font-semibold bg-ebay-blue text-white shadow-sm hover:bg-blue-700 flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open Dedicated Full View & Components
                    </Link>
                    <button
                      onClick={() => setSelectedArtifact(null)}
                      className="px-4 py-2 rounded-full text-xs font-semibold bg-ebay-bg-secondary text-ebay-fg-primary border border-ebay-border hover:bg-ebay-bg-tertiary"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PLAYBOOK (RISK REGISTER & DECISION LOG - §11.2) */}
        {activeTab === 'playbook' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Register */}
            <div className="evo-card p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-ebay-fg-primary text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-ebay-amber" /> Risk Register
                </h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-ebay-fg-secondary">Sort by:</span>
                  <select
                    value={riskSort}
                    onChange={(e) => setRiskSort(e.target.value as any)}
                    className="bg-ebay-bg-primary text-ebay-fg-primary px-2 py-1 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue"
                  >
                    <option value="score">Risk Score (High-Low)</option>
                    <option value="severity">Severity</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {risks.map((risk) => (
                  <div key={risk.id} className="evo-card p-4 space-y-2 shadow-xs">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-ebay-fg-primary text-xs">{risk.riskTitle}</span>
                      <span
                        className={`evo-badge ${
                          risk.score >= 15
                            ? 'bg-ebay-red-bg text-ebay-red border border-red-500/20'
                            : 'bg-ebay-amber-bg text-ebay-amber border border-amber-500/20'
                        }`}
                      >
                        Score: {risk.score}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] text-ebay-fg-secondary">
                      <div>Category: <span className="text-ebay-fg-primary font-medium">{risk.category}</span></div>
                      <div>Status: <span className="text-ebay-blue font-bold">{risk.status}</span></div>
                      <div>Owner: <span className="text-ebay-fg-primary font-medium">{risk.owner}</span></div>
                    </div>

                    <p className="text-[11px] text-ebay-fg-primary bg-ebay-bg-secondary p-2.5 rounded-xl border border-ebay-border">
                      <strong className="text-ebay-blue">Mitigation:</strong> {risk.mitigation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Decision Log */}
            <div className="evo-card p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-ebay-fg-primary text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-ebay-green" /> Decision Log
                </h3>
                <select
                  value={decisionFilter}
                  onChange={(e) => setDecisionFilter(e.target.value)}
                  className="bg-ebay-bg-primary text-ebay-fg-primary text-xs px-2 py-1 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue"
                >
                  <option value="ALL">All Types</option>
                  <option value="Architectural">Architectural</option>
                  <option value="Regulatory Interpretation">Regulatory Interpretation</option>
                  <option value="Policy Approval">Policy Approval</option>
                </select>
              </div>

              <div className="space-y-3">
                {decisions
                  .filter((d) => decisionFilter === 'ALL' || d.type === decisionFilter)
                  .map((dec) => (
                    <div key={dec.id} className="evo-card p-4 space-y-2 shadow-xs">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-ebay-fg-primary text-xs">{dec.title}</span>
                        <span
                          className={`evo-badge ${
                            dec.status === 'Signed Off'
                              ? 'bg-ebay-green-bg text-ebay-green border border-green-500/20'
                              : 'bg-ebay-amber-bg text-ebay-amber border border-amber-500/20'
                          }`}
                        >
                          {dec.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] text-ebay-fg-secondary font-mono">
                        <div>Type: <span className="text-ebay-blue font-semibold">{dec.type}</span></div>
                        <div>Forum: <span className="text-ebay-fg-primary font-semibold">{dec.forum}</span></div>
                      </div>

                      <p className="text-[11px] text-ebay-fg-primary bg-ebay-bg-secondary p-2.5 rounded-xl border border-ebay-border">
                        <strong className="text-ebay-blue">Rationale:</strong> {dec.rationale}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MILESTONE PLAN (§11.2) */}
        {activeTab === 'milestones' && (
          <div className="evo-card p-6 space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-ebay-fg-primary text-sm">Workstream Milestone Timeline</h3>
                <p className="text-xs text-ebay-fg-secondary">Sequential roadmap items by workstream and target execution dates.</p>
              </div>
              {canWriteMilestones && (
                <button className="px-4 py-2 rounded-full text-xs font-semibold bg-ebay-blue text-white shadow-sm hover:bg-blue-700 flex items-center gap-1.5 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Milestone
                </button>
              )}
            </div>

            <div className="space-y-4">
              {milestones.map((m) => (
                <div key={m.id} className="evo-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-ebay-blue/10 text-ebay-blue border border-ebay-blue/30 font-bold">
                        {m.workstream}
                      </span>
                      <span
                        className={`evo-badge ${
                          m.status === 'Completed'
                            ? 'bg-ebay-green-bg text-ebay-green border border-green-500/20'
                            : m.status === 'In Progress'
                            ? 'bg-ebay-amber-bg text-ebay-amber border border-amber-500/20'
                            : 'bg-ebay-bg-secondary text-ebay-fg-secondary border border-ebay-border'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-ebay-fg-primary text-sm">{m.title}</h4>
                  </div>

                  <div className="flex items-center gap-6 text-xs text-ebay-fg-secondary">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-ebay-fg-secondary">POC</span>
                      <span className="text-ebay-fg-primary font-semibold">{m.poc}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-ebay-fg-secondary">Target Date</span>
                      <span className="text-ebay-blue font-mono font-bold">{m.targetDate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: TASKS & ACTIONS (KANBAN BOARD - §11.2) */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between evo-card p-4 shadow-sm">
              <h3 className="font-bold text-ebay-fg-primary text-sm">Kanban Execution Board</h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-ebay-fg-secondary">Priority Filter:</span>
                <select
                  value={taskPriorityFilter}
                  onChange={(e) => setTaskPriorityFilter(e.target.value)}
                  className="bg-ebay-bg-primary text-ebay-fg-primary px-3 py-1.5 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {(['Backlog', 'Todo', 'In Progress', 'Blocked', 'Done'] as const).map((colStatus) => {
                const colTasks = tasks.filter(
                  (t) =>
                    t.status === colStatus &&
                    (taskPriorityFilter === 'ALL' || t.priority === taskPriorityFilter)
                );

                return (
                  <div key={colStatus} className="evo-card p-4 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between border-b border-ebay-border pb-2">
                      <span className="font-extrabold text-xs text-ebay-fg-primary">{colStatus}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-ebay-bg-secondary text-ebay-fg-secondary border border-ebay-border">
                        {colTasks.length}
                      </span>
                    </div>

                    <div className="space-y-3 min-h-[300px]">
                      {colTasks.map((task) => (
                        <div key={task.id} className="evo-card p-3 space-y-2 shadow-xs border border-ebay-border">
                          <span
                            className={`evo-badge ${
                              task.priority === 'High'
                                ? 'bg-ebay-red-bg text-ebay-red border border-red-500/20'
                                : 'bg-ebay-bg-secondary text-ebay-fg-secondary border border-ebay-border'
                            }`}
                          >
                            {task.priority} Priority
                          </span>
                          <h5 className="font-bold text-xs text-ebay-fg-primary">{task.title}</h5>

                          <div className="text-[10px] text-ebay-fg-secondary flex justify-between pt-1 border-t border-ebay-border">
                            <span>{task.assignee}</span>
                            <span className="font-mono text-ebay-fg-secondary">{task.dueDate}</span>
                          </div>

                          {/* Move Task Controls */}
                          {canWriteTasks && (
                            <div className="flex gap-1 pt-1">
                              {colStatus !== 'Backlog' && (
                                <button
                                  onClick={() =>
                                    moveTask(
                                      task.id,
                                      colStatus === 'Todo'
                                        ? 'Backlog'
                                        : colStatus === 'In Progress'
                                        ? 'Todo'
                                        : colStatus === 'Blocked'
                                        ? 'In Progress'
                                        : 'Blocked'
                                    )
                                  }
                                  className="px-2 py-0.5 rounded-full bg-ebay-bg-secondary hover:bg-ebay-bg-tertiary border border-ebay-border text-[9px] text-ebay-fg-primary font-medium"
                                >
                                  ← Prev
                                </button>
                              )}
                              {colStatus !== 'Done' && (
                                <button
                                  onClick={() =>
                                    moveTask(
                                      task.id,
                                      colStatus === 'Backlog'
                                        ? 'Todo'
                                        : colStatus === 'Todo'
                                        ? 'In Progress'
                                        : colStatus === 'In Progress'
                                        ? 'Blocked'
                                        : 'Done'
                                    )
                                  }
                                  className="px-2 py-0.5 rounded-full bg-ebay-blue hover:bg-blue-700 text-[9px] text-white font-bold ml-auto"
                                >
                                  Next →
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 6: CHANGE HISTORY & SEMANTIC DIFF (§11.2) */}
        {activeTab === 'history' && (
          <div className="evo-card p-6 space-y-6 shadow-sm">
            <h3 className="font-bold text-ebay-fg-primary text-sm">Artifact Version Log & Semantic Diff Viewer</h3>

            <div className="space-y-6">
              {history.map((ver) => (
                <div key={ver.id} className="evo-card p-5 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-ebay-fg-primary text-sm">{ver.artifactName}</h4>
                      <div className="text-xs text-ebay-fg-secondary flex items-center gap-2 mt-0.5">
                        <span>Version: <strong className="text-ebay-blue font-mono">{ver.version}</strong></span>
                        <span>•</span>
                        <span>Author: {ver.author}</span>
                        <span>•</span>
                        <span className="font-mono text-ebay-fg-secondary">{ver.timestamp}</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-ebay-blue/10 text-ebay-blue border border-ebay-blue/30">
                      Semantic Change Log
                    </span>
                  </div>

                  <p className="text-xs text-ebay-fg-primary bg-ebay-bg-secondary p-3 rounded-2xl border border-ebay-border">
                    {ver.summary}
                  </p>

                  {/* Semantic Diff Box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-3 rounded-2xl bg-ebay-red-bg border border-red-500/30 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-ebay-red block">- Previous Version</span>
                      <p className="text-ebay-fg-primary leading-relaxed">{ver.diffBefore}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-ebay-green-bg border border-green-500/30 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-ebay-green block">+ New Version</span>
                      <p className="text-ebay-fg-primary leading-relaxed">{ver.diffAfter}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

