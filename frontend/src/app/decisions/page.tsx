'use client';

import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { INITIAL_DECISIONS } from '@/lib/mockData';
import { DecisionItem } from '@/lib/types';
import {
  Scale,
  Download,
  Filter,
  Layers,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  User,
  Building2,
  Sparkles,
} from 'lucide-react';

export default function DecisionsDashboardPage() {
  const [decisions, setDecisions] = useState<DecisionItem[]>(INITIAL_DECISIONS);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('ALL');
  const [selectedRegulation, setSelectedRegulation] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [groupBy, setGroupBy] = useState<'none' | 'project' | 'regulation' | 'status' | 'forum'>('none');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered decisions
  const filteredDecisions = useMemo(() => {
    return decisions.filter((d) => {
      const matchesSearch =
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.rationale.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.decisionMaker.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProject = selectedProject === 'ALL' || d.projectId === selectedProject;
      const matchesReg = selectedRegulation === 'ALL' || d.regulation === selectedRegulation;
      const matchesStatus = selectedStatus === 'ALL' || d.status === selectedStatus;
      const matchesType = selectedType === 'ALL' || d.type === selectedType;

      return matchesSearch && matchesProject && matchesReg && matchesStatus && matchesType;
    });
  }, [decisions, searchQuery, selectedProject, selectedRegulation, selectedStatus, selectedType]);

  // Grouped decisions
  const groupedDecisions = useMemo(() => {
    if (groupBy === 'none') return { 'All Decisions': filteredDecisions };

    const groups: Record<string, DecisionItem[]> = {};
    filteredDecisions.forEach((d) => {
      let key = 'Other';
      if (groupBy === 'project') key = d.projectName;
      else if (groupBy === 'regulation') key = d.regulation;
      else if (groupBy === 'status') key = d.status;
      else if (groupBy === 'forum') key = d.forum;

      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    });
    return groups;
  }, [filteredDecisions, groupBy]);

  // CSV Export for Legal Review Packages (§11.5)
  const exportCSV = () => {
    const headers = ['ID', 'Project', 'Regulation', 'Title', 'Type', 'Decision Maker', 'Status', 'Date', 'Forum', 'Rationale'];
    const rows = filteredDecisions.map((d) => [
      d.id,
      `"${d.projectName}"`,
      `"${d.regulation}"`,
      `"${d.title}"`,
      `"${d.type}"`,
      `"${d.decisionMaker}"`,
      `"${d.status}"`,
      d.date,
      `"${d.forum}"`,
      `"${d.rationale.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Regulus_Legal_Decisions_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Legal Review Package CSV exported successfully!');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel bg-purple-900/90 text-purple-100 px-4 py-3 rounded-xl border border-purple-400/40 shadow-2xl flex items-center gap-2 animate-bounce">
          <Download className="w-5 h-5 text-purple-300" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-purple-300 bg-clip-text text-transparent">
                Cross-Project Decisions Dashboard
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                §11.5 Governance Ledger
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Centralized decision ledger across EU AI Act, DORA, ESG, MiCA, and GDPR projects with exportable legal review packages.
            </p>
          </div>

          <button
            id="export-csv-btn"
            onClick={exportCSV}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/20 hover:scale-105 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export Legal Review CSV Pack
          </button>
        </div>

        {/* Filters Toolbar */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search decisions, rationale..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 text-xs text-slate-200 pl-9 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto text-xs">
            <select
              id="decision-project-filter"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-slate-900 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Projects</option>
              <option value="prj-ecgt">ECGT Generative AI</option>
              <option value="prj-dora">DORA Operational</option>
              <option value="prj-esg">ESG CSRD</option>
            </select>

            <select
              id="decision-regulation-filter"
              value={selectedRegulation}
              onChange={(e) => setSelectedRegulation(e.target.value)}
              className="bg-slate-900 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Regulations</option>
              <option value="EU AI Act">EU AI Act</option>
              <option value="DORA">DORA</option>
              <option value="ESG Disclosures">ESG Disclosures</option>
            </select>

            <select
              id="decision-status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-900 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Signed Off">Signed Off</option>
              <option value="Under Review">Under Review</option>
              <option value="Proposed">Proposed</option>
            </select>

            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-slate-400">Group by:</span>
              <select
                id="decision-group-by"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                className="bg-transparent text-purple-300 font-medium focus:outline-none cursor-pointer"
              >
                <option value="none" className="bg-slate-900 text-slate-200">None</option>
                <option value="project" className="bg-slate-900 text-slate-200">Project</option>
                <option value="regulation" className="bg-slate-900 text-slate-200">Regulation</option>
                <option value="status" className="bg-slate-900 text-slate-200">Status</option>
                <option value="forum" className="bg-slate-900 text-slate-200">Forum</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grouped Decisions Ledger Content */}
        {Object.entries(groupedDecisions).map(([groupTitle, groupItems]) => (
          <div key={groupTitle} className="space-y-4">
            {groupBy !== 'none' && (
              <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
                <span className="text-base font-bold text-slate-200">{groupTitle}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-400">
                  {groupItems.length} decision(s)
                </span>
              </div>
            )}

            <div className="space-y-4">
              {groupItems.map((dec) => (
                <div
                  key={dec.id}
                  className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 shadow-lg hover:border-purple-500/40 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                        {dec.regulation}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-purple-950 text-purple-300 border border-purple-500/30">
                        {dec.type}
                      </span>
                      <span className="text-xs text-slate-400 font-medium hidden md:inline">
                        Project: <strong className="text-slate-200">{dec.projectName}</strong>
                      </span>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        dec.status === 'Signed Off'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {dec.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-100 text-base">{dec.title}</h3>
                    <p className="text-slate-300 text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-800 leading-relaxed">
                      <strong className="text-purple-400 block mb-1">Decision Rationale & Legal Justification:</strong>
                      {dec.rationale}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400 font-mono pt-1">
                    <div>Decision Maker: <span className="text-slate-200 font-semibold">{dec.decisionMaker}</span></div>
                    <div>Forum: <span className="text-cyan-300 font-semibold">{dec.forum}</span></div>
                    <div>Date Signed: <span className="text-slate-400">{dec.date}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
