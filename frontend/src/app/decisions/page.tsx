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
    <div className="min-h-screen flex flex-col bg-ebay-bg-primary text-ebay-fg-primary transition-colors duration-200">
      <Navbar />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-ebay-blue text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-bounce">
          <Download className="w-5 h-5 text-white" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-6">
        {/* Header - eBay Evo Card */}
        <div className="evo-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-ebay-fg-primary">
                Cross-Project Decisions Dashboard
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-ebay-blue/10 text-ebay-blue border border-ebay-blue/30">
                Governance Ledger
              </span>
            </div>
            <p className="text-ebay-fg-secondary text-xs mt-1">
              Centralized decision ledger across EU AI Act, DORA, ESG, MiCA, and GDPR projects with exportable legal review packages.
            </p>
          </div>

          <button
            id="export-csv-btn"
            onClick={exportCSV}
            className="px-5 py-2.5 rounded-full text-xs font-semibold bg-ebay-blue text-white shadow-sm hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export Legal Review CSV Pack
          </button>
        </div>

        {/* Filters Toolbar - eBay Evo Control Bar */}
        <div className="evo-card p-4 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center shadow-sm">
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-ebay-fg-secondary" />
            <input
              type="text"
              placeholder="Search decisions, rationale..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-ebay-bg-primary text-xs text-ebay-fg-primary pl-9 pr-3 py-2 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto text-xs">
            <select
              id="decision-project-filter"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-ebay-bg-primary text-ebay-fg-primary px-3 py-2 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue"
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
              className="bg-ebay-bg-primary text-ebay-fg-primary px-3 py-2 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue"
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
              className="bg-ebay-bg-primary text-ebay-fg-primary px-3 py-2 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue"
            >
              <option value="ALL">All Statuses</option>
              <option value="Signed Off">Signed Off</option>
              <option value="Under Review">Under Review</option>
              <option value="Proposed">Proposed</option>
            </select>

            <div className="flex items-center gap-1.5 bg-ebay-bg-secondary px-3 py-1.5 rounded-xl border border-ebay-border">
              <Layers className="w-3.5 h-3.5 text-ebay-blue" />
              <span className="text-ebay-fg-secondary">Group by:</span>
              <select
                id="decision-group-by"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                className="bg-transparent text-ebay-blue font-semibold focus:outline-none cursor-pointer"
              >
                <option value="none">None</option>
                <option value="project">Project</option>
                <option value="regulation">Regulation</option>
                <option value="status">Status</option>
                <option value="forum">Forum</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grouped Decisions Ledger Content */}
        {Object.entries(groupedDecisions).map(([groupTitle, groupItems]) => (
          <div key={groupTitle} className="space-y-4">
            {groupBy !== 'none' && (
              <div className="flex items-center gap-3 border-b border-ebay-border pb-2">
                <span className="text-base font-bold text-ebay-fg-primary">{groupTitle}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-ebay-bg-secondary text-ebay-fg-secondary border border-ebay-border">
                  {groupItems.length} decision(s)
                </span>
              </div>
            )}

            <div className="space-y-4">
              {groupItems.map((dec) => (
                <div
                  key={dec.id}
                  className="evo-card p-6 space-y-4 shadow-sm hover:shadow-md border border-ebay-border transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-ebay-border pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-ebay-blue/10 text-ebay-blue border border-ebay-blue/20">
                        {dec.regulation}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-ebay-bg-secondary text-ebay-fg-primary border border-ebay-border">
                        {dec.type}
                      </span>
                      <span className="text-xs text-ebay-fg-secondary font-medium hidden md:inline">
                        Project: <strong className="text-ebay-fg-primary">{dec.projectName}</strong>
                      </span>
                    </div>

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

                  <div className="space-y-2">
                    <h3 className="font-bold text-ebay-fg-primary text-base">{dec.title}</h3>
                    <p className="text-ebay-fg-primary text-xs bg-ebay-bg-secondary p-4 rounded-xl border border-ebay-border leading-relaxed">
                      <strong className="text-ebay-blue block mb-1">Decision Rationale & Legal Justification:</strong>
                      {dec.rationale}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-ebay-fg-secondary font-mono pt-1">
                    <div>Decision Maker: <span className="text-ebay-fg-primary font-semibold">{dec.decisionMaker}</span></div>
                    <div>Forum: <span className="text-ebay-blue font-semibold">{dec.forum}</span></div>
                    <div>Date Signed: <span className="text-ebay-fg-secondary">{dec.date}</span></div>
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
