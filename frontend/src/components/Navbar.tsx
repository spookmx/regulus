'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeProvider';
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
  Sun,
  Moon,
} from 'lucide-react';

export function Navbar({ pendingActionCount = 6 }: { pendingActionCount?: number }) {
  const pathname = usePathname();
  const { user, role, switchUserRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
    <header className="sticky top-0 z-50 bg-ebay-bg-primary border-b border-ebay-border px-4 lg:px-8 py-3 transition-colors duration-200 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-ebay-blue text-white shadow-sm group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5 text-white group-hover:rotate-6 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-ebay-fg-primary">
                REGULUS
              </span>
            </div>
            <p className="text-[11px] text-ebay-fg-secondary hidden sm:block font-medium">
              Multi-Agent Compliance & Traceability Engine
            </p>
          </div>
        </Link>

        {/* Navigation Tabs - eBay Evo Segmented Pill / Underline Tabs */}
        <nav className="flex items-center gap-1 sm:gap-1.5 bg-ebay-bg-secondary p-1 rounded-full border border-ebay-border">
          <Link
            href="/"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
              isActive('/')
                ? 'bg-ebay-blue text-white shadow-sm'
                : 'text-ebay-fg-secondary hover:text-ebay-fg-primary hover:bg-ebay-bg-card'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Portfolio</span>
          </Link>

          <Link
            href="/traceability"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
              isActive('/traceability')
                ? 'bg-ebay-blue text-white shadow-sm'
                : 'text-ebay-fg-secondary hover:text-ebay-fg-primary hover:bg-ebay-bg-card'
            }`}
          >
            <GitGraph className="w-4 h-4" />
            <span>Traceability</span>
          </Link>

          <Link
            href="/action-center"
            className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
              isActive('/action-center')
                ? 'bg-ebay-blue text-white shadow-sm'
                : 'text-ebay-fg-secondary hover:text-ebay-fg-primary hover:bg-ebay-bg-card'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Action Center</span>
            {pendingActionCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-600 rounded-full">
                {pendingActionCount}
              </span>
            )}
          </Link>

          <Link
            href="/decisions"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
              isActive('/decisions')
                ? 'bg-ebay-blue text-white shadow-sm'
                : 'text-ebay-fg-secondary hover:text-ebay-fg-primary hover:bg-ebay-bg-card'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Decisions</span>
          </Link>
        </nav>

        {/* Right Controls: Theme Switcher & RBAC Selector */}
        <div className="flex items-center gap-2">
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Light/Dark Theme"
            className="p-2 rounded-full border border-ebay-border bg-ebay-bg-card text-ebay-fg-primary hover:bg-ebay-bg-secondary transition-colors shadow-sm"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-ebay-fg-primary" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>


          {/* User RBAC Selector */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-ebay-bg-card text-left text-xs text-ebay-fg-primary hover:bg-ebay-bg-secondary transition-all border border-ebay-border shadow-sm"
            >
              <div className="w-7 h-7 rounded-full bg-ebay-blue/10 border border-ebay-blue/30 flex items-center justify-center overflow-hidden text-ebay-blue">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="hidden md:block">
                <div className="font-bold text-ebay-fg-primary leading-tight">{user?.name}</div>
                <div className="text-[10px] font-mono text-ebay-blue capitalize">{role.replace('_', ' ')}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-ebay-fg-secondary" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-ebay-bg-card rounded-2xl border border-ebay-border shadow-xl p-2 z-50">
                <div className="px-3 py-2 border-b border-ebay-border text-xs font-semibold text-ebay-fg-secondary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Simulate RBAC User Role</span>
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
                          ? 'bg-ebay-blue/10 text-ebay-blue border border-ebay-blue/30 font-semibold'
                          : 'hover:bg-ebay-bg-secondary text-ebay-fg-primary'
                      }`}
                    >
                      <div className="font-semibold flex items-center justify-between">
                        <span>{r.label}</span>
                        {role === r.role && <span className="text-[10px] text-ebay-blue font-bold">Active</span>}
                      </div>
                      <div className="text-[10px] text-ebay-fg-secondary leading-tight">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
