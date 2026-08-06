'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { INITIAL_PROJECTS } from '@/lib/mockData';
import { Project, RegulationType, ProjectStatus, PhaseType } from '@/lib/types';
import {
  LayoutGrid,
  ListFilter,
  Search,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Calendar,
  User,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  FileCheck,
} from 'lucide-react';

export default function ProjectPortfolioPage() {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegulation, setSelectedRegulation] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPM, setSelectedPM] = useState<string>('ALL');
  const [selectedPhase, setSelectedPhase] = useState<string>('ALL');
  const [selectedProgram, setSelectedProgram] = useState<string>('ALL');
  const [groupBy, setGroupBy] = useState<'none' | 'regulation' | 'phase' | 'pm' | 'program'>('none');
  
  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Days to enforcement badge renderer - eBay Evo accessible badge style
  const renderDaysBadge = (days: number) => {
    if (days <= 30) {
      return (
        <span className="evo-badge bg-ebay-red-bg text-ebay-red border border-red-500/20">
          <Clock className="w-3.5 h-3.5" />
          <span>{days}d left</span>
        </span>
      );
    } else if (days <= 90) {
      return (
        <span className="evo-badge bg-ebay-amber-bg text-ebay-amber border border-amber-500/20">
          <Clock className="w-3.5 h-3.5" />
          <span>{days}d left</span>
        </span>
      );
    } else {
      return (
        <span className="evo-badge bg-ebay-green-bg text-ebay-green border border-green-500/20">
          <Clock className="w-3.5 h-3.5" />
          <span>{days}d left</span>
        </span>
      );
    }
  };

  // Status Badge - eBay Evo Pill Badge
  const renderStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'On Track':
        return (
          <span className="evo-badge bg-ebay-green-bg text-ebay-green border border-green-500/20">
            <CheckCircle2 className="w-3 h-3" /> On Track
          </span>
        );
      case 'At Risk':
        return (
          <span className="evo-badge bg-ebay-amber-bg text-ebay-amber border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" /> At Risk
          </span>
        );
      case 'Blocked':
        return (
          <span className="evo-badge bg-ebay-red-bg text-ebay-red border border-red-500/20">
            <ShieldAlert className="w-3 h-3" /> Blocked
          </span>
        );
      case 'Completed':
        return (
          <span className="evo-badge bg-ebay-info-bg text-ebay-info border border-blue-500/20">
            <FileCheck className="w-3 h-3" /> Completed
          </span>
        );
    }
  };

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesReg = selectedRegulation === 'ALL' || p.regulation === selectedRegulation;
      const matchesStat = selectedStatus === 'ALL' || p.status === selectedStatus;
      const matchesPM = selectedPM === 'ALL' || p.pm === selectedPM;
      const matchesPhase = selectedPhase === 'ALL' || p.phase === selectedPhase;
      const matchesProgram = selectedProgram === 'ALL' || p.program === selectedProgram;

      return matchesSearch && matchesReg && matchesStat && matchesPM && matchesPhase && matchesProgram;
    });
  }, [projects, searchQuery, selectedRegulation, selectedStatus, selectedPM, selectedPhase, selectedProgram]);

  // Grouped projects
  const groupedProjects = useMemo(() => {
    if (groupBy === 'none') return { 'All Projects': filteredProjects };

    const groups: Record<string, Project[]> = {};
    filteredProjects.forEach((p) => {
      let key = 'Other';
      if (groupBy === 'regulation') key = p.regulation;
      else if (groupBy === 'phase') key = p.phase;
      else if (groupBy === 'pm') key = p.pm;
      else if (groupBy === 'program') key = p.program;

      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }, [filteredProjects, groupBy]);

  const handleSyncAirtable = (id: string, name: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              airtableSyncStatus: 'In Sync',
              lastSyncedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            }
          : p
      )
    );
    showToast(`Synced "${name}" to Airtable Base appsAttrVGoHjSfHR!`);
  };

  const handleFlagBlocker = (id: string, name: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: p.status === 'Blocked' ? 'At Risk' : 'Blocked' } : p))
    );
    showToast(`Updated status for "${name}"!`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-ebay-bg-primary text-ebay-fg-primary transition-colors duration-200">
      <Navbar />

      {/* Toast Notification - eBay Section Notice Style */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-ebay-blue text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-6">
        {/* Header Title Section - eBay Evo Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 evo-card p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-ebay-fg-primary">
                Project Portfolio Roadmap
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-ebay-blue/10 text-ebay-blue border border-ebay-blue/30">
                Airtable H1&apos;25 Engine
              </span>
            </div>
            <p className="text-ebay-fg-secondary text-sm mt-1">
              Multi-Agent Compliance Tracking across EU AI Act, DORA, ESG, MiCA & GDPR Regulations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle - eBay Segmented Control */}
            <div className="flex items-center bg-ebay-bg-secondary p-1 rounded-full border border-ebay-border">
              <button
                id="view-table-btn"
                onClick={() => setViewMode('table')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'table' ? 'bg-ebay-blue text-white shadow-sm' : 'text-ebay-fg-secondary hover:text-ebay-fg-primary'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" /> Table
              </button>
              <button
                id="view-grid-btn"
                onClick={() => setViewMode('grid')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'grid' ? 'bg-ebay-blue text-white shadow-sm' : 'text-ebay-fg-secondary hover:text-ebay-fg-primary'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Grid Cards
              </button>
            </div>
          </div>
        </div>

        {/* Portfolio Stats Summary - eBay Evo Metrics Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="evo-card p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-ebay-fg-secondary tracking-wider block">Total Active Projects</span>
              <span className="text-2xl font-extrabold text-ebay-fg-primary">{projects.length}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-ebay-blue/10 border border-ebay-blue/20 flex items-center justify-center text-ebay-blue">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="evo-card p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-ebay-fg-secondary tracking-wider block">On Track</span>
              <span className="text-2xl font-extrabold text-ebay-green">
                {projects.filter((p) => p.status === 'On Track').length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-ebay-green-bg border border-green-500/20 flex items-center justify-center text-ebay-green">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="evo-card p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-ebay-fg-secondary tracking-wider block">At Risk / Blocked</span>
              <span className="text-2xl font-extrabold text-ebay-amber">
                {projects.filter((p) => p.status === 'At Risk' || p.status === 'Blocked').length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-ebay-amber-bg border border-amber-500/20 flex items-center justify-center text-ebay-amber">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="evo-card p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-ebay-fg-secondary tracking-wider block">Avg Compliance Score</span>
              <span className="text-2xl font-extrabold text-ebay-blue">
                {Math.round(projects.reduce((acc, p) => acc + p.complianceScore, 0) / projects.length)}%
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-ebay-blue/10 border border-ebay-blue/20 flex items-center justify-center text-ebay-blue">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter Toolbar - eBay Evo Control Panel */}
        <div className="evo-card p-4 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center shadow-sm">
          {/* Search bar */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-ebay-fg-secondary" />
            <input
              type="text"
              placeholder="Search projects, codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-ebay-bg-primary text-xs text-ebay-fg-primary pl-9 pr-3 py-2 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue transition-all placeholder:text-ebay-fg-disabled"
            />
          </div>

          {/* Filters Selectors */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <select
              id="filter-regulation"
              value={selectedRegulation}
              onChange={(e) => setSelectedRegulation(e.target.value)}
              className="bg-ebay-bg-primary text-xs text-ebay-fg-primary px-3 py-2 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue"
            >
              <option value="ALL">All Regulations</option>
              <option value="EU AI Act">EU AI Act</option>
              <option value="DORA">DORA</option>
              <option value="ESG Disclosures">ESG Disclosures</option>
              <option value="MiCA">MiCA</option>
              <option value="GDPR">GDPR</option>
            </select>

            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-ebay-bg-primary text-xs text-ebay-fg-primary px-3 py-2 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue"
            >
              <option value="ALL">All Statuses</option>
              <option value="On Track">On Track</option>
              <option value="At Risk">At Risk</option>
              <option value="Blocked">Blocked</option>
              <option value="Completed">Completed</option>
            </select>

            <select
              id="filter-phase"
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              className="bg-ebay-bg-primary text-xs text-ebay-fg-primary px-3 py-2 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue"
            >
              <option value="ALL">All Phases</option>
              <option value="Discovery">Discovery</option>
              <option value="Framing">Framing</option>
              <option value="Execution">Execution</option>
              <option value="Verification">Verification</option>
              <option value="Sign-off">Sign-off</option>
            </select>

            <select
              id="filter-pm"
              value={selectedPM}
              onChange={(e) => setSelectedPM(e.target.value)}
              className="bg-ebay-bg-primary text-xs text-ebay-fg-primary px-3 py-2 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue"
            >
              <option value="ALL">All PMs</option>
              <option value="Sarah Chen">Sarah Chen</option>
              <option value="Marcus Vance">Marcus Vance</option>
              <option value="Elena Rostova">Elena Rostova</option>
              <option value="David Kim">David Kim</option>
            </select>

            {/* Group By */}
            <div className="flex items-center gap-1.5 bg-ebay-bg-secondary px-3 py-1.5 rounded-xl border border-ebay-border text-xs">
              <Layers className="w-3.5 h-3.5 text-ebay-blue" />
              <span className="text-ebay-fg-secondary">Group by:</span>
              <select
                id="group-by-select"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                className="bg-transparent text-ebay-blue font-semibold focus:outline-none cursor-pointer"
              >
                <option value="none">None</option>
                <option value="regulation">Regulation</option>
                <option value="phase">Phase</option>
                <option value="pm">PM Owner</option>
                <option value="program">Program</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Render (Table or Grid) */}
        {Object.entries(groupedProjects).map(([groupTitle, groupItems]) => (
          <div key={groupTitle} className="space-y-4">
            {groupBy !== 'none' && (
              <div className="flex items-center gap-3 border-b border-ebay-border pb-2">
                <span className="text-lg font-bold text-ebay-fg-primary">{groupTitle}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-ebay-bg-secondary text-ebay-fg-secondary border border-ebay-border">
                  {groupItems.length} project(s)
                </span>
              </div>
            )}

            {viewMode === 'table' ? (
              <div className="evo-card overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-ebay-bg-secondary text-ebay-fg-secondary uppercase tracking-wider font-semibold border-b border-ebay-border">
                      <tr>
                        <th className="py-3.5 px-4">Project & Code</th>
                        <th className="py-3.5 px-4">Regulation</th>
                        <th className="py-3.5 px-4">PM Owner</th>
                        <th className="py-3.5 px-4">Phase</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">BRD / PRD</th>
                        <th className="py-3.5 px-4">Enforcement Date</th>
                        <th className="py-3.5 px-4">Days Left</th>
                        <th className="py-3.5 px-4">Compliance Score</th>
                        <th className="py-3.5 px-4 text-right">Quick Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ebay-border">
                      {groupItems.map((p) => (
                        <tr key={p.id} className="hover:bg-ebay-bg-secondary/60 transition-colors group">
                          {/* Name & Code */}
                          <td className="py-4 px-4 font-medium">
                            <Link href={`/project/${p.id}`} className="flex flex-col gap-0.5">
                              <span className="font-bold text-ebay-fg-primary text-sm group-hover:text-ebay-blue transition-colors">
                                {p.name}
                              </span>
                              <span className="text-[10px] font-mono text-ebay-fg-secondary">{p.code} • {p.program}</span>
                            </Link>
                          </td>

                          {/* Regulation */}
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-ebay-blue/10 text-ebay-blue border border-ebay-blue/20">
                              {p.regulation}
                            </span>
                          </td>

                          {/* PM */}
                          <td className="py-4 px-4 text-ebay-fg-primary font-medium">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-ebay-fg-secondary" />
                              <span>{p.pm}</span>
                            </div>
                          </td>

                          {/* Phase */}
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-ebay-bg-secondary text-ebay-fg-primary border border-ebay-border">
                              {p.phase}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">{renderStatusBadge(p.status)}</td>

                          {/* BRD / PRD */}
                          <td className="py-4 px-4">
                            <div className="flex flex-col text-[10px] font-mono gap-0.5">
                              <span className="text-ebay-fg-secondary">BRD: <strong className="text-ebay-green">{p.brdStatus}</strong></span>
                              <span className="text-ebay-fg-secondary">PRD: <strong className="text-ebay-amber">{p.prdStatus}</strong></span>
                            </div>
                          </td>

                          {/* Compliance Date */}
                          <td className="py-4 px-4 text-ebay-fg-primary font-mono text-[11px]">
                            {p.complianceDate}
                          </td>

                          {/* Days to enforcement */}
                          <td className="py-4 px-4">{renderDaysBadge(p.daysToEnforcement)}</td>

                          {/* Compliance Score */}
                          <td className="py-4 px-4">
                            <div className="w-32 space-y-1">
                              <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-ebay-fg-secondary">Score</span>
                                <span className={p.complianceScore >= 80 ? 'text-ebay-green' : p.complianceScore >= 60 ? 'text-ebay-amber' : 'text-ebay-red'}>
                                  {p.complianceScore}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-ebay-bg-secondary rounded-full overflow-hidden border border-ebay-border">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    p.complianceScore >= 80
                                      ? 'bg-ebay-green'
                                      : p.complianceScore >= 60
                                      ? 'bg-ebay-amber'
                                      : 'bg-ebay-red'
                                  }`}
                                  style={{ width: `${p.complianceScore}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Quick actions */}
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                href={`/project/${p.id}`}
                                title="Open Detail"
                                className="p-1.5 rounded-lg bg-ebay-bg-secondary hover:bg-ebay-blue text-ebay-fg-secondary hover:text-white transition-colors border border-ebay-border"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>

                              <button
                                title="Flag Blocker"
                                onClick={() => handleFlagBlocker(p.id, p.name)}
                                className="p-1.5 rounded-lg bg-ebay-bg-secondary hover:bg-red-600 text-ebay-fg-secondary hover:text-white transition-colors border border-ebay-border"
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                              </button>

                              <button
                                title="Sync to Airtable"
                                onClick={() => handleSyncAirtable(p.id, p.name)}
                                className="p-1.5 rounded-lg bg-ebay-bg-secondary hover:bg-ebay-blue text-ebay-fg-secondary hover:text-white transition-colors border border-ebay-border"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Grid View - eBay Evo Cards */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupItems.map((p) => (
                  <div key={p.id} className="evo-card p-6 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-ebay-blue/10 text-ebay-blue border border-ebay-blue/20">
                          {p.regulation}
                        </span>
                        {renderStatusBadge(p.status)}
                      </div>

                      <div>
                        <Link href={`/project/${p.id}`}>
                          <h3 className="font-bold text-ebay-fg-primary text-base leading-snug hover:text-ebay-blue transition-colors">
                            {p.name}
                          </h3>
                        </Link>
                        <p className="text-ebay-fg-secondary text-xs mt-1 line-clamp-2">{p.description}</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-ebay-border">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-ebay-fg-secondary text-[10px] uppercase font-semibold">PM Owner</span>
                          <div className="font-medium text-ebay-fg-primary">{p.pm}</div>
                        </div>
                        <div>
                          <span className="text-ebay-fg-secondary text-[10px] uppercase font-semibold">Phase</span>
                          <div className="font-medium text-ebay-fg-primary">{p.phase}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-ebay-fg-secondary text-[10px] uppercase font-semibold block">Enforcement</span>
                          {renderDaysBadge(p.daysToEnforcement)}
                        </div>

                        <div className="text-right">
                          <span className="text-ebay-fg-secondary text-[10px] uppercase font-semibold block">Compliance Score</span>
                          <span className={`font-extrabold text-sm ${p.complianceScore >= 80 ? 'text-ebay-green' : 'text-ebay-amber'}`}>
                            {p.complianceScore}%
                          </span>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center gap-2 pt-2">
                        <Link
                          href={`/project/${p.id}`}
                          className="flex-1 text-center py-2 rounded-full text-xs font-semibold bg-ebay-blue text-white shadow-sm hover:bg-blue-700 transition-all"
                        >
                          View Detail
                        </Link>
                        <button
                          onClick={() => handleSyncAirtable(p.id, p.name)}
                          className="p-2 rounded-full bg-ebay-bg-secondary hover:bg-ebay-blue text-ebay-fg-secondary hover:text-white transition-colors border border-ebay-border"
                          title="Sync to Airtable"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
