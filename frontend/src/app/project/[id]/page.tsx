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
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-6">
        {/* Top Header Breadcrumb & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="space-y-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Portfolio
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-100">
                {project.name}
              </h1>
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                {project.code}
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                {project.regulation}
              </span>
            </div>
            <p className="text-slate-400 text-xs max-w-3xl">{project.description}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="glass-card px-4 py-2 rounded-xl text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Compliance Score</div>
              <div className="text-xl font-extrabold text-emerald-400">{project.complianceScore}%</div>
            </div>
            <div className="glass-card px-4 py-2 rounded-xl text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Days to Enforcement</div>
              <div className="text-xl font-extrabold text-amber-400">{project.daysToEnforcement}d</div>
            </div>
          </div>
        </div>

        {/* 6 Tabs Navigation (§11.2) */}
        <div className="flex items-center border-b border-slate-800 overflow-x-auto gap-2 text-xs font-semibold pb-1">
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
                    ? 'border-indigo-500 bg-indigo-600/10 text-indigo-300 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-slate-500'}`} />
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
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  RASCI Team Assignment Matrix (§12)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="glass-card p-3 rounded-xl">
                    <span className="text-[10px] text-cyan-400 uppercase font-bold">Responsible (R)</span>
                    <p className="font-semibold text-slate-200 mt-0.5">{project.rasci.responsible}</p>
                  </div>
                  <div className="glass-card p-3 rounded-xl">
                    <span className="text-[10px] text-amber-400 uppercase font-bold">Accountable (A)</span>
                    <p className="font-semibold text-slate-200 mt-0.5">{project.rasci.accountable}</p>
                  </div>
                  <div className="glass-card p-3 rounded-xl">
                    <span className="text-[10px] text-indigo-400 uppercase font-bold">Supported By (S)</span>
                    <p className="font-semibold text-slate-200 mt-0.5">{project.rasci.supportedBy}</p>
                  </div>
                  <div className="glass-card p-3 rounded-xl">
                    <span className="text-[10px] text-purple-400 uppercase font-bold">Consulted (C)</span>
                    <p className="font-semibold text-slate-200 mt-0.5">{project.rasci.consulted}</p>
                  </div>
                  <div className="sm:col-span-2 glass-card p-3 rounded-xl">
                    <span className="text-[10px] text-emerald-400 uppercase font-bold">Informed (I)</span>
                    <p className="font-semibold text-slate-200 mt-0.5">{project.rasci.informed}</p>
                  </div>
                </div>
              </div>

              {/* Key Dates & Milestones Summary */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" /> Key Timeline Dates
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="glass-card p-4 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Enforcement Deadline</span>
                    <p className="font-mono text-sm font-bold text-rose-300">{project.complianceDate}</p>
                  </div>
                  <div className="glass-card p-4 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Current Phase</span>
                    <p className="font-mono text-sm font-bold text-amber-300">{project.phase}</p>
                  </div>
                  <div className="glass-card p-4 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">BRD / PRD Status</span>
                    <p className="font-mono text-sm font-bold text-emerald-300">{project.brdStatus} / {project.prdStatus}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Airtable Sync Status & Summary Sidebar */}
            <div className="space-y-6">
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-cyan-400" /> Airtable Sync Status
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Sync State</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-semibold ${
                        project.airtableSyncStatus === 'In Sync'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : project.airtableSyncStatus === 'Pending Sync'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {project.airtableSyncStatus}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Target Base</span>
                    <span className="font-mono text-slate-200">appsAttrVGoHjSfHR</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Last Synced</span>
                    <span className="font-mono text-slate-400">{project.lastSyncedAt}</span>
                  </div>

                  <button className="w-full mt-2 py-2 rounded-xl text-xs font-semibold bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600 hover:text-white transition-all flex items-center justify-center gap-2">
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
            <div className="flex items-center justify-between glass-panel p-4 rounded-2xl border border-slate-800">
              <div>
                <h3 className="font-bold text-slate-200 text-sm">Regulatory Lineage Chain</h3>
                <p className="text-xs text-slate-400">LRD → BRD → PRD → Sub-PRD → Jira implementation flow with compliance validation badges.</p>
              </div>
              {canWriteArtifacts && (
                <button className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white flex items-center gap-1.5 hover:bg-indigo-500 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Create Artifact
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {artifacts.map((art, idx) => (
                <div key={art.id} className="relative group">
                  <div className="glass-card p-5 rounded-2xl space-y-3 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between h-full">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                          {art.tier}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{art.version}</span>
                      </div>

                      <h4 className="font-bold text-xs text-slate-100 line-clamp-2">{art.title}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-3">{art.summary}</p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">Status</span>
                        <span className="font-semibold text-emerald-400">{art.status}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-500">Compliance Bar</span>
                          <span className="font-bold text-cyan-400">{art.complianceScore}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-400 rounded-full"
                            style={{ width: `${art.complianceScore}%` }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedArtifact(art)}
                        className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3 h-3" /> Inspect Node
                      </button>
                    </div>
                  </div>

                  {idx < artifacts.length - 1 && (
                    <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 items-center justify-center text-slate-400">
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Selected Artifact Modal */}
            {selectedArtifact && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-slate-700 space-y-4 shadow-2xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-950 text-indigo-300">
                        {selectedArtifact.tier} • {selectedArtifact.version}
                      </span>
                      <h3 className="font-bold text-lg text-slate-100 mt-1">{selectedArtifact.title}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedArtifact(null)}
                      className="text-slate-400 hover:text-white text-sm font-bold px-2 py-1 bg-slate-800 rounded-lg"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-3 text-xs text-slate-300">
                    <p className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">{selectedArtifact.summary}</p>
                    <div className="grid grid-cols-2 gap-2 font-mono">
                      <div>Owner: <span className="text-indigo-300">{selectedArtifact.owner}</span></div>
                      <div>Status: <span className="text-emerald-400">{selectedArtifact.status}</span></div>
                      <div>Updated: <span className="text-slate-400">{selectedArtifact.lastUpdated}</span></div>
                      <div>Compliance Score: <span className="text-cyan-400">{selectedArtifact.complianceScore}%</span></div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setSelectedArtifact(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
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
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" /> Risk Register
                </h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Sort by:</span>
                  <select
                    value={riskSort}
                    onChange={(e) => setRiskSort(e.target.value as any)}
                    className="bg-slate-900 text-slate-200 px-2 py-1 rounded-lg border border-slate-700"
                  >
                    <option value="score">Risk Score (High-Low)</option>
                    <option value="severity">Severity</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {risks.map((risk) => (
                  <div key={risk.id} className="glass-card p-4 rounded-xl space-y-2 border border-slate-800">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-slate-100 text-xs">{risk.riskTitle}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          risk.score >= 15
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        Score: {risk.score}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400">
                      <div>Category: <span className="text-slate-200">{risk.category}</span></div>
                      <div>Status: <span className="text-cyan-400">{risk.status}</span></div>
                      <div>Owner: <span className="text-slate-200">{risk.owner}</span></div>
                    </div>

                    <p className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                      <strong className="text-indigo-400">Mitigation:</strong> {risk.mitigation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Decision Log */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Decision Log
                </h3>
                <select
                  value={decisionFilter}
                  onChange={(e) => setDecisionFilter(e.target.value)}
                  className="bg-slate-900 text-slate-200 text-xs px-2 py-1 rounded-lg border border-slate-700"
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
                    <div key={dec.id} className="glass-card p-4 rounded-xl space-y-2 border border-slate-800">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-slate-100 text-xs">{dec.title}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            dec.status === 'Signed Off'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {dec.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                        <div>Type: <span className="text-purple-300">{dec.type}</span></div>
                        <div>Forum: <span className="text-slate-200">{dec.forum}</span></div>
                      </div>

                      <p className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                        <strong className="text-cyan-400">Rationale:</strong> {dec.rationale}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MILESTONE PLAN (§11.2) */}
        {activeTab === 'milestones' && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-200 text-sm">Workstream Milestone Timeline</h3>
                <p className="text-xs text-slate-400">Sequential roadmap items by workstream and target execution dates.</p>
              </div>
              {canWriteMilestones && (
                <button className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white flex items-center gap-1.5 hover:bg-indigo-500 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Milestone
                </button>
              )}
            </div>

            <div className="space-y-4">
              {milestones.map((m) => (
                <div key={m.id} className="glass-card p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                        {m.workstream}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.status === 'Completed'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : m.status === 'In Progress'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-100 text-sm">{m.title}</h4>
                  </div>

                  <div className="flex items-center gap-6 text-xs text-slate-400">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-500">POC</span>
                      <span className="text-slate-200 font-medium">{m.poc}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-500">Target Date</span>
                      <span className="text-cyan-300 font-mono font-semibold">{m.targetDate}</span>
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
            <div className="flex items-center justify-between glass-panel p-4 rounded-2xl border border-slate-800">
              <h3 className="font-bold text-slate-200 text-sm">Kanban Execution Board</h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Priority Filter:</span>
                <select
                  value={taskPriorityFilter}
                  onChange={(e) => setTaskPriorityFilter(e.target.value)}
                  className="bg-slate-900 text-slate-200 px-2 py-1 rounded-lg border border-slate-700"
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
                  <div key={colStatus} className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-xs text-slate-200">{colStatus}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">
                        {colTasks.length}
                      </span>
                    </div>

                    <div className="space-y-3 min-h-[300px]">
                      {colTasks.map((task) => (
                        <div key={task.id} className="glass-card p-3 rounded-xl space-y-2 border border-slate-800/80">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              task.priority === 'High'
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {task.priority} Priority
                          </span>
                          <h5 className="font-semibold text-xs text-slate-100">{task.title}</h5>

                          <div className="text-[10px] text-slate-400 flex justify-between pt-1 border-t border-slate-800">
                            <span>{task.assignee}</span>
                            <span className="font-mono text-slate-400">{task.dueDate}</span>
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
                                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[9px] text-slate-300"
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
                                  className="px-1.5 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-[9px] text-white ml-auto"
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
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <h3 className="font-bold text-slate-200 text-sm">Artifact Version Log & Semantic Diff Viewer</h3>

            <div className="space-y-6">
              {history.map((ver) => (
                <div key={ver.id} className="glass-card p-5 rounded-2xl space-y-4 border border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">{ver.artifactName}</h4>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>Version: <strong className="text-indigo-400">{ver.version}</strong></span>
                        <span>•</span>
                        <span>Author: {ver.author}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">{ver.timestamp}</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                      Semantic Change Log
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    {ver.summary}
                  </p>

                  {/* Semantic Diff Box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-rose-400">- Previous Version</span>
                      <p className="text-rose-200 leading-relaxed">{ver.diffBefore}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-emerald-400">+ New Version</span>
                      <p className="text-emerald-200 leading-relaxed">{ver.diffAfter}</p>
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
