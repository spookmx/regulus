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
  ArrowUpDown,
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

  // Days to enforcement badge renderer per §11.1
  // Color coding: Days-to-Enforcement (red <= 30, yellow <= 90, green > 90)
  const renderDaysBadge = (days: number) => {
    if (days <= 30) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/40">
          <Clock className="w-3.5 h-3.5 text-rose-400" />
          <span>{days}d left</span>
        </span>
      );
    } else if (days <= 90) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>{days}d left</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>{days}d left</span>
        </span>
      );
    }
  };

  // Status Badge
  const renderStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'On Track':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> On Track
          </span>
        );
      case 'At Risk':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" /> At Risk
          </span>
        );
      case 'Blocked':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-3 h-3" /> Blocked
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
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
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel bg-indigo-900/90 text-indigo-100 px-4 py-3 rounded-xl border border-indigo-400/40 shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-indigo-300" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-6">
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                Project Portfolio Roadmap
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Airtable H1&apos;25 Replacement
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Multi-Agent Compliance Tracking across EU AI Act, DORA, ESG, MiCA & GDPR Regulations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800">
              <button
                id="view-table-btn"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  viewMode === 'table' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" /> Table
              </button>
              <button
                id="view-grid-btn"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Grid Cards
              </button>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          {/* Search bar */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects, codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 text-xs text-slate-200 pl-9 pr-3 py-2 rounded-xl border border-slate-700/70 focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Filters Selectors */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Regulation */}
            <select
              id="filter-regulation"
              value={selectedRegulation}
              onChange={(e) => setSelectedRegulation(e.target.value)}
              className="bg-slate-900/90 text-xs text-slate-200 px-3 py-2 rounded-xl border border-slate-700/70 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Regulations</option>
              <option value="EU AI Act">EU AI Act</option>
              <option value="DORA">DORA</option>
              <option value="ESG Disclosures">ESG Disclosures</option>
              <option value="MiCA">MiCA</option>
              <option value="GDPR">GDPR</option>
            </select>

            {/* Status */}
            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-900/90 text-xs text-slate-200 px-3 py-2 rounded-xl border border-slate-700/70 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="On Track">On Track</option>
              <option value="At Risk">At Risk</option>
              <option value="Blocked">Blocked</option>
              <option value="Completed">Completed</option>
            </select>

            {/* Phase */}
            <select
              id="filter-phase"
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              className="bg-slate-900/90 text-xs text-slate-200 px-3 py-2 rounded-xl border border-slate-700/70 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Phases</option>
              <option value="Discovery">Discovery</option>
              <option value="Framing">Framing</option>
              <option value="Execution">Execution</option>
              <option value="Verification">Verification</option>
              <option value="Sign-off">Sign-off</option>
            </select>

            {/* PM */}
            <select
              id="filter-pm"
              value={selectedPM}
              onChange={(e) => setSelectedPM(e.target.value)}
              className="bg-slate-900/90 text-xs text-slate-200 px-3 py-2 rounded-xl border border-slate-700/70 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All PMs</option>
              <option value="Sarah Chen">Sarah Chen</option>
              <option value="Marcus Vance">Marcus Vance</option>
              <option value="Elena Rostova">Elena Rostova</option>
              <option value="David Kim">David Kim</option>
            </select>

            {/* Group By */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700/70 text-xs">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Group by:</span>
              <select
                id="group-by-select"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                className="bg-transparent text-cyan-300 font-medium focus:outline-none cursor-pointer"
              >
                <option value="none" className="bg-slate-900 text-slate-200">None</option>
                <option value="regulation" className="bg-slate-900 text-slate-200">Regulation</option>
                <option value="phase" className="bg-slate-900 text-slate-200">Phase</option>
                <option value="pm" className="bg-slate-900 text-slate-200">PM Owner</option>
                <option value="program" className="bg-slate-900 text-slate-200">Program</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Render (Table or Grid) */}
        {Object.entries(groupedProjects).map(([groupTitle, groupItems]) => (
          <div key={groupTitle} className="space-y-4">
            {groupBy !== 'none' && (
              <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
                <span className="text-lg font-bold text-slate-200">{groupTitle}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-400">
                  {groupItems.length} project(s)
                </span>
              </div>
            )}

            {viewMode === 'table' ? (
              <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
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
                    <tbody className="divide-y divide-slate-800/60">
                      {groupItems.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-900/40 transition-colors group">
                          {/* Name & Code */}
                          <td className="py-4 px-4 font-medium">
                            <Link href={`/project/${p.id}`} className="hover:text-indigo-300 flex flex-col gap-0.5">
                              <span className="font-semibold text-slate-100 text-sm group-hover:text-cyan-300 transition-colors">
                                {p.name}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">{p.code} • {p.program}</span>
                            </Link>
                          </td>

                          {/* Regulation */}
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
                              {p.regulation}
                            </span>
                          </td>

                          {/* PM */}
                          <td className="py-4 px-4 text-slate-300 font-medium">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span>{p.pm}</span>
                            </div>
                          </td>

                          {/* Phase */}
                          <td className="py-4 px-4">
                            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                              {p.phase}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">{renderStatusBadge(p.status)}</td>

                          {/* BRD / PRD */}
                          <td className="py-4 px-4">
                            <div className="flex flex-col text-[10px] font-mono gap-0.5">
                              <span className="text-slate-300">BRD: <strong className="text-emerald-400">{p.brdStatus}</strong></span>
                              <span className="text-slate-400">PRD: <strong className="text-amber-400">{p.prdStatus}</strong></span>
                            </div>
                          </td>

                          {/* Compliance Date */}
                          <td className="py-4 px-4 text-slate-300 font-mono text-[11px]">
                            {p.complianceDate}
                          </td>

                          {/* Days to enforcement color badge (§11.1) */}
                          <td className="py-4 px-4">{renderDaysBadge(p.daysToEnforcement)}</td>

                          {/* Compliance Score */}
                          <td className="py-4 px-4">
                            <div className="w-32 space-y-1">
                              <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-slate-300">Score</span>
                                <span className={p.complianceScore >= 80 ? 'text-emerald-400' : p.complianceScore >= 60 ? 'text-amber-400' : 'text-rose-400'}>
                                  {p.complianceScore}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    p.complianceScore >= 80
                                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                      : p.complianceScore >= 60
                                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                                      : 'bg-gradient-to-r from-rose-500 to-red-400'
                                  }`}
                                  style={{ width: `${p.complianceScore}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Quick actions per row (§11.1) */}
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/project/${p.id}`}
                                title="Open Detail"
                                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>

                              <button
                                title="Flag Blocker"
                                onClick={() => handleFlagBlocker(p.id, p.name)}
                                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                              </button>

                              <button
                                title="Sync to Airtable"
                                onClick={() => handleSyncAirtable(p.id, p.name)}
                                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-cyan-600 text-slate-300 hover:text-white transition-colors"
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
              /* Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupItems.map((p) => (
                  <div key={p.id} className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
                          {p.regulation}
                        </span>
                        {renderStatusBadge(p.status)}
                      </div>

                      <div>
                        <Link href={`/project/${p.id}`} className="hover:underline">
                          <h3 className="font-bold text-slate-100 text-base leading-snug hover:text-cyan-300 transition-colors">
                            {p.name}
                          </h3>
                        </Link>
                        <p className="text-slate-400 text-xs mt-1 line-clamp-2">{p.description}</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-800/80">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase font-semibold">PM Owner</span>
                          <div className="font-medium text-slate-300">{p.pm}</div>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase font-semibold">Phase</span>
                          <div className="font-medium text-slate-300">{p.phase}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase font-semibold block">Enforcement</span>
                          {renderDaysBadge(p.daysToEnforcement)}
                        </div>

                        <div className="text-right">
                          <span className="text-slate-500 text-[10px] uppercase font-semibold block">Compliance Score</span>
                          <span className={`font-extrabold text-sm ${p.complianceScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {p.complianceScore}%
                          </span>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center gap-2 pt-2">
                        <Link
                          href={`/project/${p.id}`}
                          className="flex-1 text-center py-2 rounded-xl text-xs font-semibold bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 hover:bg-indigo-600 hover:text-white transition-all"
                        >
                          View Detail
                        </Link>
                        <button
                          onClick={() => handleSyncAirtable(p.id, p.name)}
                          className="p-2 rounded-xl bg-slate-800/80 hover:bg-cyan-600 text-slate-300 hover:text-white transition-colors"
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
