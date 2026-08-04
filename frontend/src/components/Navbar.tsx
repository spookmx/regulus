'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/types';
import {
  ShieldCheck,
  LayoutDashboard,
  GitGraph,
  Bell,
  Scale,
  UserCheck,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

export function Navbar({ pendingActionCount = 6 }: { pendingActionCount?: number }) {
  const pathname = usePathname();
  const { user, role, switchUserRole } = useAuth();
  const [roleDropdownOpen, setRoleDropdownOpen] = React.useState(false);

  const rolesList: { role: UserRole; label: string; desc: string }[] = [
    { role: 'legal_counsel', label: 'Legal Counsel', desc: 'Read all, Write/Approve LRD, Sign Decisions' },
    { role: 'pm_owner', label: 'PM Owner', desc: 'Write artifacts, Approve BRD/PRD/Decisions' },
    { role: 'pgm_lead', label: 'PgM Lead', desc: 'Read all, Write Milestones & Tasks' },
    { role: 'bu_lead', label: 'BU Lead', desc: 'Read all, Approve BRD' },
    { role: 'eng_lead', label: 'Eng Lead', desc: 'Read all, Write Jira links' },
    { role: 'portfolio_admin', label: 'Portfolio Admin', desc: 'Full admin rights & role management' },
    { role: 'viewer', label: 'Auditor / Viewer', desc: 'Read-only access' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-cyan-400 group-hover:rotate-6 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-300 bg-clip-text text-transparent">
                REGULUS
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                MVP v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Multi-Agent Regulatory Compliance & Traceability Engine
            </p>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              isActive('/')
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-indigo-400" />
            <span>Portfolio</span>
          </Link>

          <Link
            href="/traceability"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              isActive('/traceability')
                ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <GitGraph className="w-4 h-4 text-cyan-400" />
            <span>Traceability</span>
          </Link>

          <Link
            href="/action-center"
            className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              isActive('/action-center')
                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Action Center</span>
            {pendingActionCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-slate-950 bg-amber-400 rounded-full animate-pulse">
                {pendingActionCount}
              </span>
            )}
          </Link>

          <Link
            href="/decisions"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              isActive('/decisions')
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-sm shadow-purple-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Scale className="w-4 h-4 text-purple-400" />
            <span>Decisions</span>
          </Link>
        </nav>

        {/* User RBAC Selector */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl glass-card text-left text-xs text-slate-200 hover:bg-slate-800/70 transition-all border border-slate-700/60"
          >
            <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center overflow-hidden">
              <UserCheck className="w-4 h-4 text-indigo-300" />
            </div>
            <div className="hidden md:block">
              <div className="font-semibold text-slate-200 leading-tight">{user?.name}</div>
              <div className="text-[10px] font-mono text-cyan-400 capitalize">{role.replace('_', ' ')}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 glass-panel rounded-2xl border border-slate-700/80 shadow-2xl p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-800 text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulate RBAC User Role (§12)</span>
              </div>
              <div className="py-1 max-h-80 overflow-y-auto">
                {rolesList.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => {
                      switchUserRole(r.role);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex flex-col gap-0.5 ${
                      role === r.role
                        ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40'
                        : 'hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <div className="font-semibold flex items-center justify-between">
                      <span>{r.label}</span>
                      {role === r.role && <span className="text-[10px] text-cyan-400 font-bold">Active</span>}
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
