'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { INITIAL_ACTION_CENTER } from '@/lib/mockData';
import { ActionCenterItem, ActionItemType } from '@/lib/types';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  MessageSquare,
  AlertOctagon,
  GitPullRequest,
  RefreshCw,
  FileCheck,
  Zap,
  Filter,
  Check,
} from 'lucide-react';

export default function ActionCenterPage() {
  const [items, setItems] = useState<ActionCenterItem[]>(INITIAL_ACTION_CENTER);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAction = (
    id: string,
    action: 'Approved' | 'Rejected' | 'Merged' | 'Discarded',
    title: string
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: action } : item))
    );
    showToast(`Action "${action}" recorded for "${title}"!`);
  };

  const handleSlackNotify = (id: string, title: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, slackNotified: true } : item))
    );
    showToast(`Slack notification sent to #regulus-compliance-steerco for "${title}"!`);
  };

  const pendingItems = items.filter((item) => item.status === 'Pending');
  const processedItems = items.filter((item) => item.status !== 'Pending');

  const filteredPending = pendingItems.filter((item) => {
    const matchesType = selectedType === 'ALL' || item.type === selectedType;
    const matchesPriority = selectedPriority === 'ALL' || item.priority === selectedPriority;
    return matchesType && matchesPriority;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar pendingActionCount={pendingItems.length} />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel bg-amber-900/90 text-amber-100 px-4 py-3 rounded-xl border border-amber-400/40 shadow-2xl flex items-center gap-2 animate-bounce">
          <Zap className="w-5 h-5 text-amber-300" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-6">
        {/* Title Header */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-300 bg-clip-text text-transparent">
                Action Center (HITL Hub)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                §11.4 Human-in-the-Loop
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Centralized queue for Cascade Proposals, Approval Gates, Decision Sign-Offs, Meeting Extractions & Airtable Conflicts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="glass-card px-4 py-2 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Pending HITL Actions</span>
              <span className="text-xl font-extrabold text-amber-400">{pendingItems.length}</span>
            </div>
            <div className="glass-card px-4 py-2 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Resolved Today</span>
              <span className="text-xl font-extrabold text-emerald-400">{processedItems.length}</span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Filter className="w-4 h-4 text-amber-400" />
            <span>Filter Queue:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Item Type filter */}
            <select
              id="action-type-filter"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-900 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Item Types</option>
              <option value="Cascade Proposal">Cascade Proposal</option>
              <option value="HITL approval gate">HITL Approval Gate</option>
              <option value="Decision sign-off">Decision Sign-off</option>
              <option value="Meeting extraction">Meeting Extraction</option>
              <option value="Airtable sync conflict">Airtable Sync Conflict</option>
              <option value="Agent draft review">Agent Draft Review</option>
            </select>

            {/* Priority filter */}
            <select
              id="action-priority-filter"
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-slate-900 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Queue Items */}
        <div className="space-y-4">
          {filteredPending.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-bold text-slate-200">No Pending HITL Action Items</h3>
              <p className="text-slate-400 text-xs">All cascade proposals and decision gates have been successfully reviewed.</p>
            </div>
          ) : (
            filteredPending.map((item) => (
              <div
                key={item.id}
                className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition-all space-y-4 shadow-lg"
              >
                {/* Item Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase ${
                        item.priority === 'Urgent'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : item.priority === 'High'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.priority}
                    </span>

                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                      {item.type}
                    </span>

                    <span className="text-xs text-slate-400 font-mono">
                      Source: <strong className="text-cyan-400">{item.sourceAgent}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Deadline: {item.deadline}</span>
                  </div>
                </div>

                {/* Main Content */}
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-100 text-base">{item.title}</h3>
                  <p className="text-slate-300 text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    {item.contextSummary}
                  </p>

                  {/* Diff Snippet if applicable */}
                  {item.diffSnippet && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono pt-2">
                      <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30">
                        <span className="text-[10px] text-rose-400 font-bold block mb-1">Previous Context</span>
                        <p className="text-rose-200">{item.diffSnippet.before}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                        <span className="text-[10px] text-emerald-400 font-bold block mb-1">Proposed Cascade Change</span>
                        <p className="text-emerald-200">{item.diffSnippet.after}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions Bar per §11.4 table */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => handleSlackNotify(item.id, item.title)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                      item.slackNotified
                        ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{item.slackNotified ? 'Slack Notified ✓' : 'Notify Slack Channel'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {item.type === 'Airtable sync conflict' ? (
                      <>
                        <button
                          onClick={() => handleAction(item.id, 'Approved', item.title)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-600/30 text-cyan-200 border border-cyan-500/40 hover:bg-cyan-600 hover:text-white transition-all"
                        >
                          Use Regulus
                        </button>
                        <button
                          onClick={() => handleAction(item.id, 'Approved', item.title)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 hover:bg-indigo-600 hover:text-white transition-all"
                        >
                          Use Airtable
                        </button>
                        <button
                          onClick={() => handleAction(item.id, 'Merged', item.title)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600/30 text-purple-200 border border-purple-500/40 hover:bg-purple-600 hover:text-white transition-all"
                        >
                          Merge Both
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          id={`reject-btn-${item.id}`}
                          onClick={() => handleAction(item.id, 'Rejected', item.title)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600 hover:text-white transition-all flex items-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4" /> Reject / Send Back
                        </button>
                        <button
                          id={`approve-btn-${item.id}`}
                          onClick={() => handleAction(item.id, 'Approved', item.title)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Approve & Cascade
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
