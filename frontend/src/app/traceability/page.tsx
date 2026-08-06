'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { GRAPH_NODES, GRAPH_EDGES } from '@/lib/mockData';
import { ArtifactNode, ArtifactEdge } from '@/lib/types';
import {
  GitGraph,
  Filter,
  Eye,
  ArrowRight,
  ShieldCheck,
  Search,
  RefreshCw,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export default function TraceabilityPage() {
  const [nodes, setNodes] = useState<ArtifactNode[]>(GRAPH_NODES);
  const [edges, setEdges] = useState<ArtifactEdge[]>(GRAPH_EDGES);

  // Filters
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Node Inspection & Lineage Path Highlight
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

  // Compute full upward and downward chain for selected node
  const handleSelectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);

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
        return 'bg-ebay-blue/10 text-ebay-blue border-ebay-blue/30';
      case 'BRD':
        return 'bg-ebay-green-bg text-ebay-green border-green-500/30';
      case 'PRD':
        return 'bg-ebay-amber-bg text-ebay-amber border-amber-500/30';
      case 'Sub-PRD':
        return 'bg-ebay-info-bg text-ebay-info border-blue-500/30';
      case 'Jira':
        return 'bg-ebay-bg-secondary text-ebay-fg-primary border-ebay-border';
      default:
        return 'bg-ebay-bg-secondary text-ebay-fg-secondary border-ebay-border';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-ebay-green-bg text-ebay-green border-green-500/20';
      case 'In Review':
        return 'bg-ebay-amber-bg text-ebay-amber border-amber-500/20';
      case 'Implemented':
        return 'bg-ebay-info-bg text-ebay-info border-blue-500/20';
      default:
        return 'bg-ebay-bg-secondary text-ebay-fg-secondary border-ebay-border';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ebay-bg-primary text-ebay-fg-primary transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-6">
        {/* Header - eBay Evo Card */}
        <div className="evo-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-ebay-fg-primary">
                Regulatory Traceability Graph
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-ebay-blue/10 text-ebay-blue border border-ebay-blue/30">
                Visualizer
              </span>
            </div>
            <p className="text-ebay-fg-secondary text-xs mt-1">
              Interactive lineage map connecting LRDs, BRDs, PRDs, Sub-PRDs, and Jira implementations with directional edges.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setHighlightChain([])}
              className="px-4 py-2 rounded-full text-xs font-semibold bg-ebay-bg-secondary border border-ebay-border text-ebay-fg-primary hover:bg-ebay-bg-tertiary transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset View
            </button>
          </div>
        </div>

        {/* Filter Controls - eBay Evo Toolbar */}
        <div className="evo-card p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-ebay-fg-secondary" />
            <input
              type="text"
              placeholder="Search graph nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-ebay-bg-primary text-xs text-ebay-fg-primary pl-9 pr-3 py-2 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <select
              id="graph-project-filter"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-ebay-bg-primary text-ebay-fg-primary px-3 py-2 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue"
            >
              <option value="ALL">All Projects</option>
              <option value="prj-ecgt">ECGT Generative AI</option>
              <option value="prj-dora">DORA Resilience</option>
            </select>

            <select
              id="graph-tier-filter"
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="bg-ebay-bg-primary text-ebay-fg-primary px-3 py-2 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue"
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
              className="bg-ebay-bg-primary text-ebay-fg-primary px-3 py-2 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue"
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
          <div className="lg:col-span-2 evo-card p-6 min-h-[500px] flex flex-col justify-between relative overflow-hidden shadow-sm">
            <div className="flex justify-between items-center z-10">
              <span className="text-xs text-ebay-fg-secondary font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-ebay-blue" /> Click node to highlight full lineage chain
              </span>
              <span className="text-xs font-semibold text-ebay-blue bg-ebay-blue/10 px-3 py-1 rounded-full border border-ebay-blue/20">
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
                    className={`cursor-pointer evo-card p-5 border transition-all space-y-3 ${
                      isSelected
                        ? 'border-ebay-blue ring-2 ring-ebay-blue/50 scale-105 shadow-md bg-ebay-bg-card'
                        : isHighlighted
                        ? 'border-ebay-blue/70 ring-1 ring-ebay-blue/30 bg-ebay-bg-card'
                        : 'border-ebay-border hover:border-ebay-border-strong'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getTierColor(node.tier)}`}>
                        {node.tier}
                      </span>
                      <span className={`evo-badge ${getStatusBadge(node.status)}`}>
                        {node.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-ebay-fg-primary line-clamp-2">{node.title}</h4>
                      <p className="text-[11px] text-ebay-fg-secondary line-clamp-2 mt-1">{node.summary}</p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-2 border-t border-ebay-border font-mono">
                      <span className="text-ebay-fg-secondary">{node.version}</span>
                      <span className="text-ebay-blue font-bold">{node.complianceScore}% Score</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Edge relationship list badge legend */}
            <div className="z-10 pt-4 border-t border-ebay-border flex flex-wrap gap-2 text-[10px] font-mono">
              <span className="text-ebay-fg-secondary font-bold uppercase">Relationship Edge Types:</span>
              <span className="px-2 py-0.5 rounded-full bg-ebay-blue/10 text-ebay-blue border border-ebay-blue/20">MANDATES</span>
              <span className="px-2 py-0.5 rounded-full bg-ebay-green-bg text-ebay-green border border-green-500/20">DERIVES_FROM</span>
              <span className="px-2 py-0.5 rounded-full bg-ebay-amber-bg text-ebay-amber border border-amber-500/20">MAPS_TO</span>
              <span className="px-2 py-0.5 rounded-full bg-ebay-info-bg text-ebay-info border border-blue-500/20">IMPLEMENTS</span>
              <span className="px-2 py-0.5 rounded-full bg-ebay-bg-secondary text-ebay-fg-primary border border-ebay-border">DELIVERS</span>
            </div>
          </div>

          {/* Node Inspection Side Panel */}
          <div className="evo-card p-6 space-y-4 shadow-sm">
            <h3 className="font-bold text-ebay-fg-primary text-sm flex items-center gap-2 border-b border-ebay-border pb-3">
              <Eye className="w-4 h-4 text-ebay-blue" />
              Node Inspection Panel
            </h3>

            {selectedNode ? (
              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-ebay-blue/10 text-ebay-blue border border-ebay-blue/30">
                    {selectedNode.tier} • {selectedNode.version}
                  </span>
                  <h4 className="font-bold text-ebay-fg-primary text-sm mt-1">{selectedNode.title}</h4>
                </div>

                <div className="bg-ebay-bg-secondary p-3 rounded-2xl border border-ebay-border space-y-1 text-ebay-fg-primary">
                  <span className="text-[10px] font-bold text-ebay-blue uppercase">Context Summary</span>
                  <p>{selectedNode.summary}</p>
                </div>

                <div className="space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between py-1 border-b border-ebay-border">
                    <span className="text-ebay-fg-secondary">Owner</span>
                    <span className="text-ebay-fg-primary font-semibold">{selectedNode.owner}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-ebay-border">
                    <span className="text-ebay-fg-secondary">Status</span>
                    <span className="text-ebay-green font-semibold">{selectedNode.status}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-ebay-border">
                    <span className="text-ebay-fg-secondary">Compliance Score</span>
                    <span className="text-ebay-blue font-bold">{selectedNode.complianceScore}%</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-ebay-fg-secondary">Last Modified</span>
                    <span className="text-ebay-fg-secondary">{selectedNode.lastUpdated}</span>
                  </div>
                </div>

                {/* Upward / Downward Edge Relationships */}
                <div className="space-y-2 pt-2 border-t border-ebay-border">
                  <span className="text-[10px] font-bold text-ebay-fg-secondary uppercase block">Connected Lineage Edges</span>
                  {edges
                    .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                    .map((edge) => (
                      <div
                        key={edge.id}
                        className="p-2 rounded-xl bg-ebay-bg-secondary border border-ebay-border flex items-center justify-between text-[10px] font-mono"
                      >
                        <span className="text-ebay-fg-primary">{edge.source}</span>
                        <span className="px-2 py-0.5 rounded-full bg-ebay-blue/10 text-ebay-blue font-bold">
                          {edge.label}
                        </span>
                        <span className="text-ebay-fg-primary">{edge.target}</span>
                      </div>
                    ))}
                </div>

                {/* Open Dedicated View Button */}
                <div className="pt-2 border-t border-ebay-border">
                  <Link
                    href={`/artifact/${selectedNode.id}`}
                    className="w-full py-2.5 rounded-full bg-ebay-blue hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open Dedicated Full View & Components
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-xs text-ebay-fg-secondary">Select any node on the graph to inspect metadata and trace relationships.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
