'use client';

import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { GRAPH_NODES, GRAPH_EDGES } from '@/lib/mockData';
import { ArtifactNode, ArtifactEdge, RegulationType } from '@/lib/types';
import {
  GitGraph,
  Filter,
  Eye,
  ArrowRight,
  ShieldCheck,
  Search,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function TraceabilityPage() {
  const [nodes, setNodes] = useState<ArtifactNode[]>(GRAPH_NODES);
  const [edges, setEdges] = useState<ArtifactEdge[]>(GRAPH_EDGES);

  // Filters
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Node Inspection & Lineage Path Highlight (§11.3)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('lrd-101');
  const [highlightChain, setHighlightChain] = useState<string[]>([]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      const matchesProject = selectedProject === 'ALL' || n.projectId === selectedProject;
      const matchesTier = selectedTier === 'ALL' || n.tier === selectedTier;
      const matchesStatus = selectedStatus === 'ALL' || n.status === selectedStatus;
      const matchesSearch =
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.summary.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesProject && matchesTier && matchesStatus && matchesSearch;
    });
  }, [nodes, selectedProject, selectedTier, selectedStatus, searchQuery]);

  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  // Compute full upward and downward chain for selected node (§11.3)
  const handleSelectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);

    // BFS to find connected nodes upward & downward
    const connected = new Set<string>([nodeId]);
    let queue = [nodeId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      edges.forEach((e) => {
        if (e.source === current && !connected.has(e.target)) {
          connected.add(e.target);
          queue.push(e.target);
        }
        if (e.target === current && !connected.has(e.source)) {
          connected.add(e.source);
          queue.push(e.source);
        }
      });
    }

    setHighlightChain(Array.from(connected));
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'LRD':
        return 'from-purple-600 to-indigo-600 border-purple-400 text-purple-200';
      case 'BRD':
        return 'from-blue-600 to-cyan-600 border-blue-400 text-cyan-200';
      case 'PRD':
        return 'from-cyan-600 to-teal-600 border-cyan-400 text-teal-200';
      case 'Sub-PRD':
        return 'from-teal-600 to-emerald-600 border-emerald-400 text-emerald-200';
      case 'Jira':
        return 'from-amber-600 to-orange-600 border-amber-400 text-amber-200';
      default:
        return 'from-slate-700 to-slate-800 border-slate-600 text-slate-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'In Review':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Implemented':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                Regulatory Traceability Graph
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                §11.3 Visualizer
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Interactive lineage map connecting LRDs, BRDs, PRDs, Sub-PRDs, and Jira implementations with directional edges.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setHighlightChain([])}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset View
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search graph nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 text-xs text-slate-200 pl-9 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <select
              id="graph-project-filter"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-slate-900 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Projects</option>
              <option value="prj-ecgt">ECGT Generative AI</option>
              <option value="prj-dora">DORA Resilience</option>
            </select>

            <select
              id="graph-tier-filter"
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="bg-slate-900 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Artifact Tiers</option>
              <option value="LRD">LRD</option>
              <option value="BRD">BRD</option>
              <option value="PRD">PRD</option>
              <option value="Sub-PRD">Sub-PRD</option>
              <option value="Jira">Jira</option>
            </select>

            <select
              id="graph-status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-900 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="In Review">In Review</option>
              <option value="Draft">Draft</option>
              <option value="Implemented">Implemented</option>
            </select>
          </div>
        </div>

        {/* Main Canvas & Side Panel Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visual Graph Canvas */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 min-h-[500px] flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-center z-10">
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Click node to highlight full lineage chain (§11.3)
              </span>
              <span className="text-xs font-bold text-cyan-300 bg-cyan-950 px-2.5 py-1 rounded-md border border-cyan-500/30">
                {filteredNodes.length} Nodes Active
              </span>
            </div>

            {/* Interactive Graph Node Flow Canvas */}
            <div className="py-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 relative z-10">
              {filteredNodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isHighlighted = highlightChain.includes(node.id);

                return (
                  <div
                    key={node.id}
                    id={`graph-node-${node.id}`}
                    onClick={() => handleSelectNode(node.id)}
                    className={`cursor-pointer glass-card p-5 rounded-2xl border transition-all space-y-3 ${
                      isSelected
                        ? 'border-cyan-400 ring-2 ring-cyan-500/50 scale-105 shadow-2xl shadow-cyan-500/20 bg-slate-900'
                        : isHighlighted
                        ? 'border-indigo-400 ring-1 ring-indigo-500/40 bg-slate-900/90'
                        : 'border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-gradient-to-r ${getTierColor(
                          node.tier
                        )}`}
                      >
                        {node.tier}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(
                          node.status
                        )}`}
                      >
                        {node.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-slate-100 line-clamp-2">{node.title}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{node.summary}</p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-800 font-mono">
                      <span className="text-slate-500">{node.version}</span>
                      <span className="text-cyan-400 font-bold">{node.complianceScore}% Score</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Edge relationship list badge legend */}
            <div className="z-10 pt-4 border-t border-slate-800/80 flex flex-wrap gap-2 text-[10px] font-mono">
              <span className="text-slate-500 font-bold uppercase">Relationship Edge Types:</span>
              <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">MANDATES</span>
              <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">DERIVES_FROM</span>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">MAPS_TO</span>
              <span className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-500/30">IMPLEMENTS</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">DELIVERS</span>
            </div>
          </div>

          {/* Node Inspection Side Panel (§11.3) */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2 border-b border-slate-800 pb-3">
              <Eye className="w-4 h-4 text-cyan-400" />
              Node Inspection Panel
            </h3>

            {selectedNode ? (
              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                    {selectedNode.tier} • {selectedNode.version}
                  </span>
                  <h4 className="font-bold text-slate-100 text-sm mt-1">{selectedNode.title}</h4>
                </div>

                <div className="glass-card p-3 rounded-xl border border-slate-800 space-y-1 text-slate-300">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase">Context Summary</span>
                  <p>{selectedNode.summary}</p>
                </div>

                <div className="space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Owner</span>
                    <span className="text-slate-200 font-semibold">{selectedNode.owner}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Status</span>
                    <span className="text-emerald-400 font-semibold">{selectedNode.status}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Compliance Score</span>
                    <span className="text-cyan-400 font-bold">{selectedNode.complianceScore}%</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Last Modified</span>
                    <span className="text-slate-400">{selectedNode.lastUpdated}</span>
                  </div>
                </div>

                {/* Upward / Downward Edge Relationships */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Connected Lineage Edges</span>
                  {edges
                    .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                    .map((edge) => (
                      <div
                        key={edge.id}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-[10px] font-mono"
                      >
                        <span className="text-indigo-300">{edge.source}</span>
                        <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold">
                          {edge.label}
                        </span>
                        <span className="text-indigo-300">{edge.target}</span>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Select any node on the graph to inspect metadata and trace relationships.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
