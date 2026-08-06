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
    <div className="min-h-screen flex flex-col bg-ebay-bg-primary text-ebay-fg-primary transition-colors duration-200">
      <Navbar pendingActionCount={pendingItems.length} />

      {/* Toast Notification - eBay Style Section Notice */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-ebay-blue text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-bounce">
          <Zap className="w-5 h-5 text-white" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-6">
        {/* Title Header - eBay Evo Card */}
        <div className="evo-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-ebay-fg-primary">
                Action Center (HITL Hub)
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-ebay-amber-bg text-ebay-amber border border-amber-500/30">
                Human-in-the-Loop Hub
              </span>
            </div>
            <p className="text-ebay-fg-secondary text-xs mt-1">
              Centralized queue for Cascade Proposals, Approval Gates, Decision Sign-Offs, Meeting Extractions & Airtable Conflicts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-ebay-bg-secondary border border-ebay-border px-4 py-2 rounded-2xl text-center">
              <span className="text-[10px] uppercase font-bold text-ebay-fg-secondary block">Pending Actions</span>
              <span className="text-xl font-extrabold text-ebay-amber">{pendingItems.length}</span>
            </div>
            <div className="bg-ebay-bg-secondary border border-ebay-border px-4 py-2 rounded-2xl text-center">
              <span className="text-[10px] uppercase font-bold text-ebay-fg-secondary block">Resolved Today</span>
              <span className="text-xl font-extrabold text-ebay-green">{processedItems.length}</span>
            </div>
          </div>
        </div>

        {/* Filter Bar - eBay Evo Control Bar */}
        <div className="evo-card p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-ebay-fg-primary">
            <Filter className="w-4 h-4 text-ebay-blue" />
            <span>Filter Queue:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <select
              id="action-type-filter"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-ebay-bg-primary text-ebay-fg-primary px-3 py-2 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue"
            >
              <option value="ALL">All Item Types</option>
              <option value="Cascade Proposal">Cascade Proposal</option>
              <option value="HITL approval gate">HITL Approval Gate</option>
              <option value="Decision sign-off">Decision Sign-off</option>
              <option value="Meeting extraction">Meeting Extraction</option>
              <option value="Airtable sync conflict">Airtable Sync Conflict</option>
              <option value="Agent draft review">Agent Draft Review</option>
            </select>

            <select
              id="action-priority-filter"
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-ebay-bg-primary text-ebay-fg-primary px-3 py-2 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue"
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
            <div className="evo-card p-12 text-center space-y-3 shadow-sm">
              <CheckCircle2 className="w-12 h-12 text-ebay-green mx-auto" />
              <h3 className="text-lg font-bold text-ebay-fg-primary">No Pending Action Items</h3>
              <p className="text-ebay-fg-secondary text-xs">All cascade proposals and decision gates have been successfully reviewed.</p>
            </div>
          ) : (
            filteredPending.map((item) => (
              <div
                key={item.id}
                className="evo-card p-6 space-y-4 shadow-sm hover:shadow-md border border-ebay-border transition-all"
              >
                {/* Item Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-ebay-border pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`evo-badge uppercase ${
                        item.priority === 'Urgent'
                          ? 'bg-ebay-red-bg text-ebay-red border border-red-500/20'
                          : item.priority === 'High'
                          ? 'bg-ebay-amber-bg text-ebay-amber border border-amber-500/20'
                          : 'bg-ebay-bg-secondary text-ebay-fg-secondary border border-ebay-border'
                      }`}
                    >
                      {item.priority}
                    </span>

                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-ebay-blue/10 text-ebay-blue border border-ebay-blue/20">
                      {item.type}
                    </span>

                    <span className="text-xs text-ebay-fg-secondary font-medium">
                      Source: <strong className="text-ebay-fg-primary">{item.sourceAgent}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-ebay-fg-secondary font-mono">
                    <Clock className="w-3.5 h-3.5 text-ebay-amber" />
                    <span>Deadline: {item.deadline}</span>
                  </div>
                </div>

                {/* Main Content */}
                <div className="space-y-2">
                  <h3 className="font-bold text-ebay-fg-primary text-base">{item.title}</h3>
                  <p className="text-ebay-fg-primary text-xs bg-ebay-bg-secondary p-3 rounded-xl border border-ebay-border">
                    {item.contextSummary}
                  </p>

                  {/* Diff Snippet if applicable */}
                  {item.diffSnippet && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono pt-2">
                      <div className="p-3 rounded-xl bg-ebay-red-bg border border-red-500/20">
                        <span className="text-[10px] text-ebay-red font-bold block mb-1">Previous Context</span>
                        <p className="text-ebay-fg-primary">{item.diffSnippet.before}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-ebay-green-bg border border-green-500/20">
                        <span className="text-[10px] text-ebay-green font-bold block mb-1">Proposed Cascade Change</span>
                        <p className="text-ebay-fg-primary">{item.diffSnippet.after}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-ebay-border">
                  <button
                    onClick={() => handleSlackNotify(item.id, item.title)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      item.slackNotified
                        ? 'bg-ebay-green-bg text-ebay-green border border-green-500/30'
                        : 'bg-ebay-bg-secondary hover:bg-ebay-bg-tertiary text-ebay-fg-primary border border-ebay-border'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5 text-ebay-blue" />
                    <span>{item.slackNotified ? 'Slack Notified ✓' : 'Notify Slack Channel'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {item.type === 'Airtable sync conflict' ? (
                      <>
                        <button
                          onClick={() => handleAction(item.id, 'Approved', item.title)}
                          className="px-4 py-2 rounded-full text-xs font-semibold bg-ebay-blue text-white shadow-sm hover:bg-blue-700 transition-all"
                        >
                          Use Regulus
                        </button>
                        <button
                          onClick={() => handleAction(item.id, 'Approved', item.title)}
                          className="px-4 py-2 rounded-full text-xs font-semibold bg-ebay-bg-secondary text-ebay-fg-primary border border-ebay-border hover:bg-ebay-bg-tertiary transition-all"
                        >
                          Use Airtable
                        </button>
                        <button
                          onClick={() => handleAction(item.id, 'Merged', item.title)}
                          className="px-4 py-2 rounded-full text-xs font-semibold bg-ebay-blue/10 text-ebay-blue border border-ebay-blue/30 hover:bg-ebay-blue/20 transition-all"
                        >
                          Merge Both
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          id={`reject-btn-${item.id}`}
                          onClick={() => handleAction(item.id, 'Rejected', item.title)}
                          className="px-5 py-2.5 rounded-full text-xs font-bold bg-ebay-red-bg text-ebay-red border border-red-500/30 hover:bg-red-600 hover:text-white transition-all flex items-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4" /> Reject / Send Back
                        </button>
                        <button
                          id={`approve-btn-${item.id}`}
                          onClick={() => handleAction(item.id, 'Approved', item.title)}
                          className="px-5 py-2.5 rounded-full text-xs font-bold bg-ebay-blue text-white shadow-sm hover:bg-blue-700 transition-all flex items-center gap-1.5"
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
