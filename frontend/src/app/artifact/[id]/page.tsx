'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { SAMPLE_LRD_FULL_DOCUMENTS, INITIAL_ARTIFACTS, GRAPH_NODES, GRAPH_EDGES } from '@/lib/mockData';
import { LRDFullDocument, Obligation, OpenQuestion, Approval, ArtifactNode, AuditLogEntry, AuditLogChange } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import {
  FileText,
  Star,
  Share2,
  Download,
  Save,
  Plus,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  ArrowLeft,
  Search,
  ExternalLink,
  Layers,
  Sparkles,
  UserCheck,
  Calendar,
  Globe,
  Tag,
  MessageSquare,
  Edit3,
  Check,
  X,
  History,
  Trash2,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  GitBranch,
  Info,
} from 'lucide-react';

export default function DedicatedArtifactPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id as string;
  const artifactId = rawId ? decodeURIComponent(rawId) : 'art-lrd-101';

  const { user, canWriteLRD, canApproveLRD } = useAuth();

  // Find artifact metadata
  const artifactMeta: ArtifactNode | undefined = useMemo(() => {
    const node = GRAPH_NODES.find((n) => n.id === artifactId || n.title.toLowerCase().includes(artifactId.toLowerCase()));
    if (node) return node;

    for (const key of Object.keys(INITIAL_ARTIFACTS)) {
      const found = INITIAL_ARTIFACTS[key].find((a) => a.id === artifactId);
      if (found) return found;
    }

    return undefined;
  }, [artifactId]);

  // Load LRD document state (checking localStorage first for persisted edits)
  const [lrdDoc, setLrdDoc] = useState<LRDFullDocument>(() => {
    if (typeof window !== 'undefined') {
      const savedDoc = localStorage.getItem(`regulus_lrd_doc_${artifactId}`);
      if (savedDoc) {
        try {
          return JSON.parse(savedDoc);
        } catch (e) {
          // ignore
        }
      }
    }
    if (SAMPLE_LRD_FULL_DOCUMENTS[artifactId]) {
      return SAMPLE_LRD_FULL_DOCUMENTS[artifactId];
    }
    return (
      SAMPLE_LRD_FULL_DOCUMENTS['art-lrd-101'] ||
      SAMPLE_LRD_FULL_DOCUMENTS['LRD-2024-001']
    );
  });

  // Favorite toggle state with localStorage persistence
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Component View
  const [activeTab, setActiveTab] = useState<
    'overview' | 'obligations' | 'questions' | 'approvals' | 'lineage' | 'schema' | 'audit'
  >('overview');

  // In-Page Inline Editing States (No Popups!)
  const [isEditingOverview, setIsEditingOverview] = useState<boolean>(false);
  const [editingObligationId, setEditingObligationId] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [showAddObligationInline, setShowAddObligationInline] = useState<boolean>(false);
  const [showAddQuestionInline, setShowAddQuestionInline] = useState<boolean>(false);

  // Collapsible Traceability State per Obligation ID
  const [expandedTraceability, setExpandedTraceability] = useState<Record<string, boolean>>({});
  // Selected In-Page Inspection Node for Traceability Module
  const [inspectedTraceNode, setInspectedTraceNode] = useState<ArtifactNode | null>(null);

  // Open Questions Component Filters
  const [questionStatusFilter, setQuestionStatusFilter] = useState<string>('ALL');
  const [questionAskedByFilter, setQuestionAskedByFilter] = useState<string>('ALL');
  const [questionSearch, setQuestionSearch] = useState<string>('');

  // Obligation Component Filters
  const [obligationTypeFilter, setObligationTypeFilter] = useState<string>('ALL');
  const [obligationSearch, setObligationSearch] = useState<string>('');

  // Overview Edit Form State
  const [overviewForm, setOverviewForm] = useState<{
    title: string;
    regulation: string;
    legal_context: string;
    ebay_applicability: string;
    exemptions: string;
    affected_categories: string;
    enforcement_date: string;
    grace_period_end: string;
  }>({
    title: lrdDoc.title,
    regulation: lrdDoc.regulation,
    legal_context: lrdDoc.sections.legal_context,
    ebay_applicability: lrdDoc.sections.ebay_applicability,
    exemptions: lrdDoc.sections.exemptions,
    affected_categories: lrdDoc.sections.affected_categories.join(', '),
    enforcement_date: lrdDoc.enforcement_date,
    grace_period_end: lrdDoc.grace_period_end || '',
  });

  // Obligation Form State for Inline Edit
  const [obligationEditForm, setObligationEditForm] = useState<Partial<Obligation>>({});
  const [obligationSurfaceInput, setObligationSurfaceInput] = useState<string>('');

  // Question Form State for Inline Edit
  const [questionEditForm, setQuestionEditForm] = useState<{
    question: string;
    resolution: string;
    status: 'Open' | 'Resolved' | 'Escalated';
    linked_obligation_id: string;
  }>({ question: '', resolution: '', status: 'Open', linked_obligation_id: '' });

  // New Obligation Inline Form State
  const [newObligation, setNewObligation] = useState<Partial<Obligation>>({
    article: '',
    text: '',
    type: 'Display',
    affected_surface: [],
    notes: '',
  });
  const [newSurfaceInput, setNewSurfaceInput] = useState<string>('');

  // New Question Inline Form State
  const [newQuestion, setNewQuestion] = useState<{
    question: string;
    asked_by_name: string;
    asked_by_role: string;
    linked_obligation_id: string;
  }>({
    question: '',
    asked_by_name: user?.name || 'Elena Rostova',
    asked_by_role: 'Legal Counsel',
    linked_obligation_id: '',
  });

  // Save document state to localStorage whenever updated
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`regulus_lrd_doc_${artifactId}`, JSON.stringify(lrdDoc));
    }
  }, [lrdDoc, artifactId]);

  // Check localStorage for favorited artifacts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const favs = JSON.parse(localStorage.getItem('regulus_favorited_artifacts') || '[]');
      setIsFavorited(favs.includes(artifactId));
    }
  }, [artifactId]);

  const toggleFavorite = () => {
    if (typeof window !== 'undefined') {
      const favs: string[] = JSON.parse(localStorage.getItem('regulus_favorited_artifacts') || '[]');
      let updated: string[];
      if (favs.includes(artifactId)) {
        updated = favs.filter((f) => f !== artifactId);
        setIsFavorited(false);
        showToast('Removed artifact from favorites');
      } else {
        updated = [...favs, artifactId];
        setIsFavorited(true);
        showToast('Added artifact to favorites!');
      }
      localStorage.setItem('regulus_favorited_artifacts', JSON.stringify(updated));
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper to generate a structured audit entry
  const createAuditEntry = (
    targetComponent: 'Overview Context' | 'Obligation' | 'Open Question' | 'Approval' | 'Governance Metadata',
    action: 'Created' | 'Edited' | 'Resolved' | 'Deleted' | 'Status Changed' | 'Signed Off',
    summary: string,
    changes?: AuditLogChange[]
  ): AuditLogEntry => {
    return {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      author: {
        name: user?.name || 'Elena Rostova',
        role: user?.role ? user.role.replace('_', ' ').toUpperCase() : 'Legal Counsel',
        email: user?.email || 'elena.rostova@ebay.com',
      },
      targetComponent,
      action,
      summary,
      changes,
    };
  };

  // Filtered Open Questions
  const filteredQuestions = useMemo(() => {
    return lrdDoc.sections.open_legal_questions.filter((q) => {
      const matchesStatus = questionStatusFilter === 'ALL' || q.status === questionStatusFilter;
      const matchesAskedBy =
        questionAskedByFilter === 'ALL' ||
        q.asked_by.name.toLowerCase().includes(questionAskedByFilter.toLowerCase());
      const matchesSearch =
        q.question.toLowerCase().includes(questionSearch.toLowerCase()) ||
        (q.resolution && q.resolution.toLowerCase().includes(questionSearch.toLowerCase()));
      return matchesStatus && matchesAskedBy && matchesSearch;
    });
  }, [lrdDoc, questionStatusFilter, questionAskedByFilter, questionSearch]);

  const uniqueAskedBy = useMemo(() => {
    const names = lrdDoc.sections.open_legal_questions.map((q) => q.asked_by.name);
    return Array.from(new Set(names));
  }, [lrdDoc]);

  // Filtered Obligations
  const filteredObligations = useMemo(() => {
    return lrdDoc.sections.obligations.filter((obl) => {
      const matchesType = obligationTypeFilter === 'ALL' || obl.type === obligationTypeFilter;
      const matchesSearch =
        obl.article.toLowerCase().includes(obligationSearch.toLowerCase()) ||
        obl.text.toLowerCase().includes(obligationSearch.toLowerCase()) ||
        obl.affected_surface.some((s) => s.toLowerCase().includes(obligationSearch.toLowerCase()));
      return matchesType && matchesSearch;
    });
  }, [lrdDoc, obligationTypeFilter, obligationSearch]);

  // Save Inline Overview Edits
  const handleSaveOverviewInline = (e: React.FormEvent) => {
    e.preventDefault();

    const changes: AuditLogChange[] = [];
    if (overviewForm.title !== lrdDoc.title) {
      changes.push({ field: 'title', oldValue: lrdDoc.title, newValue: overviewForm.title });
    }
    if (overviewForm.legal_context !== lrdDoc.sections.legal_context) {
      changes.push({ field: 'legal_context', oldValue: lrdDoc.sections.legal_context, newValue: overviewForm.legal_context });
    }
    if (overviewForm.ebay_applicability !== lrdDoc.sections.ebay_applicability) {
      changes.push({ field: 'ebay_applicability', oldValue: lrdDoc.sections.ebay_applicability, newValue: overviewForm.ebay_applicability });
    }

    const auditEntry = createAuditEntry(
      'Overview Context',
      'Edited',
      `In-page edit: Updated statutory legal context & scope`,
      changes.length > 0 ? changes : undefined
    );

    setLrdDoc((prev) => ({
      ...prev,
      title: overviewForm.title,
      regulation: overviewForm.regulation,
      enforcement_date: overviewForm.enforcement_date,
      grace_period_end: overviewForm.grace_period_end || undefined,
      last_updated: new Date().toISOString(),
      sections: {
        ...prev.sections,
        legal_context: overviewForm.legal_context,
        ebay_applicability: overviewForm.ebay_applicability,
        exemptions: overviewForm.exemptions,
        affected_categories: overviewForm.affected_categories.split(',').map((c) => c.trim()).filter(Boolean),
      },
      audit_log: [auditEntry, ...(prev.audit_log || [])],
    }));

    setIsEditingOverview(false);
    showToast('Saved LRD Overview Context in place');
  };

  // Inline Add Obligation
  const handleAddObligationInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObligation.article || !newObligation.text) return;

    const idNumber = String(lrdDoc.sections.obligations.length + 1).padStart(3, '0');
    const createdObligation: Obligation = {
      id: `OBL-${lrdDoc.id}-${idNumber}`,
      urn: `urn:regulus:obligation:OBL-${lrdDoc.id}-${idNumber}`,
      article: newObligation.article || 'Article X',
      text: newObligation.text || '',
      type: newObligation.type || 'Display',
      affected_surface: newSurfaceInput ? newSurfaceInput.split(',').map((s) => s.trim()) : ['View Item'],
      notes: newObligation.notes || '',
      traceability_refs: ['brd-201', 'prd-301'],
    };

    const auditEntry = createAuditEntry(
      'Obligation',
      'Created',
      `Created Obligation ${createdObligation.id} (${createdObligation.article})`,
      [{ field: 'article', oldValue: 'N/A', newValue: createdObligation.article }]
    );

    setLrdDoc((prev) => ({
      ...prev,
      last_updated: new Date().toISOString(),
      sections: {
        ...prev.sections,
        obligations: [...prev.sections.obligations, createdObligation],
      },
      audit_log: [auditEntry, ...(prev.audit_log || [])],
    }));

    setShowAddObligationInline(false);
    setNewObligation({ article: '', text: '', type: 'Display', affected_surface: [], notes: '' });
    setNewSurfaceInput('');
    showToast(`Added Obligation ${createdObligation.id}`);
  };

  // Start Inline Editing an Obligation
  const handleStartEditObligation = (obl: Obligation) => {
    setEditingObligationId(obl.id);
    setObligationEditForm(obl);
    setObligationSurfaceInput(obl.affected_surface.join(', '));
  };

  // Save Inline Editing an Obligation
  const handleSaveEditObligationInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingObligationId || !obligationEditForm.article) return;

    const original = lrdDoc.sections.obligations.find((o) => o.id === editingObligationId);
    const changes: AuditLogChange[] = [];
    if (original) {
      if (original.article !== obligationEditForm.article) changes.push({ field: 'article', oldValue: original.article, newValue: obligationEditForm.article });
      if (original.text !== obligationEditForm.text) changes.push({ field: 'text', oldValue: original.text || '', newValue: obligationEditForm.text || '' });
      if (original.type !== obligationEditForm.type) changes.push({ field: 'type', oldValue: original.type, newValue: obligationEditForm.type || 'Display' });
    }

    const updatedObligation: Obligation = {
      ...original,
      ...obligationEditForm,
      id: editingObligationId,
      article: obligationEditForm.article,
      text: obligationEditForm.text || '',
      type: obligationEditForm.type || 'Display',
      affected_surface: obligationSurfaceInput.split(',').map((s) => s.trim()).filter(Boolean),
    };

    const auditEntry = createAuditEntry(
      'Obligation',
      'Edited',
      `In-page edit: Updated Obligation ${updatedObligation.id} (${updatedObligation.article})`,
      changes.length > 0 ? changes : undefined
    );

    setLrdDoc((prev) => ({
      ...prev,
      last_updated: new Date().toISOString(),
      sections: {
        ...prev.sections,
        obligations: prev.sections.obligations.map((o) => (o.id === editingObligationId ? updatedObligation : o)),
      },
      audit_log: [auditEntry, ...(prev.audit_log || [])],
    }));

    setEditingObligationId(null);
    showToast(`Saved Obligation ${editingObligationId}`);
  };

  // Delete Obligation
  const handleDeleteObligation = (id: string) => {
    if (!confirm(`Delete Obligation ${id}?`)) return;

    const auditEntry = createAuditEntry(
      'Obligation',
      'Deleted',
      `In-page action: Deleted Obligation ${id}`
    );

    setLrdDoc((prev) => ({
      ...prev,
      last_updated: new Date().toISOString(),
      sections: {
        ...prev.sections,
        obligations: prev.sections.obligations.filter((o) => o.id !== id),
      },
      audit_log: [auditEntry, ...(prev.audit_log || [])],
    }));

    showToast(`Deleted Obligation ${id}`);
  };

  // Start Inline Editing a Question
  const handleStartEditQuestion = (q: OpenQuestion) => {
    setEditingQuestionId(q.id);
    setQuestionEditForm({
      question: q.question,
      resolution: q.resolution || '',
      status: q.status,
      linked_obligation_id: q.linked_obligation_id || '',
    });
  };

  // Save Inline Editing Question Resolution
  const handleSaveQuestionInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestionId) return;

    const original = lrdDoc.sections.open_legal_questions.find((q) => q.id === editingQuestionId);
    const changes: AuditLogChange[] = [];
    if (original) {
      if (original.status !== questionEditForm.status) changes.push({ field: 'status', oldValue: original.status, newValue: questionEditForm.status });
      if (original.resolution !== questionEditForm.resolution) changes.push({ field: 'resolution', oldValue: original.resolution || 'None', newValue: questionEditForm.resolution });
    }

    const updatedQuestion: OpenQuestion = {
      ...original!,
      question: questionEditForm.question,
      resolution: questionEditForm.resolution || undefined,
      status: questionEditForm.status,
      linked_obligation_id: questionEditForm.linked_obligation_id || undefined,
    };

    const auditEntry = createAuditEntry(
      'Open Question',
      questionEditForm.status === 'Resolved' ? 'Resolved' : 'Edited',
      `In-page edit: Updated Question ${updatedQuestion.id} status to "${updatedQuestion.status}"`,
      changes.length > 0 ? changes : undefined
    );

    setLrdDoc((prev) => ({
      ...prev,
      last_updated: new Date().toISOString(),
      sections: {
        ...prev.sections,
        open_legal_questions: prev.sections.open_legal_questions.map((q) => (q.id === editingQuestionId ? updatedQuestion : q)),
      },
      audit_log: [auditEntry, ...(prev.audit_log || [])],
    }));

    setEditingQuestionId(null);
    showToast(`Saved Question ${editingQuestionId}`);
  };

  // Inline Add Question
  const handleAddQuestionInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.question) return;

    const idNumber = String(lrdDoc.sections.open_legal_questions.length + 1).padStart(3, '0');
    const createdQuestion: OpenQuestion = {
      id: `OLQ-${idNumber}`,
      question: newQuestion.question,
      asked_by: {
        name: newQuestion.asked_by_name || user?.name || 'User',
        role: newQuestion.asked_by_role || 'Member',
      },
      date_raised: new Date().toISOString().split('T')[0],
      status: 'Open',
      linked_obligation_id: newQuestion.linked_obligation_id || undefined,
    };

    const auditEntry = createAuditEntry(
      'Open Question',
      'Created',
      `In-page action: Raised Open Question ${createdQuestion.id}`,
      [{ field: 'question', oldValue: 'N/A', newValue: createdQuestion.question }]
    );

    setLrdDoc((prev) => ({
      ...prev,
      last_updated: new Date().toISOString(),
      sections: {
        ...prev.sections,
        open_legal_questions: [...prev.sections.open_legal_questions, createdQuestion],
      },
      audit_log: [auditEntry, ...(prev.audit_log || [])],
    }));

    setShowAddQuestionInline(false);
    setNewQuestion({ question: '', asked_by_name: user?.name || 'Elena Rostova', asked_by_role: 'Legal Counsel', linked_obligation_id: '' });
    showToast(`Added Question ${createdQuestion.id}`);
  };

  // Handle Add Approval
  const handleAddApproval = () => {
    const newApproval: Approval = {
      approver: {
        name: user?.name || 'Elena Rostova',
        email: user?.email || 'elena.rostova@ebay.com',
        role: user?.role ? user.role.replace('_', ' ').toUpperCase() : 'Senior Legal Counsel',
      },
      role: user?.role ? user.role.replace('_', ' ').toUpperCase() : 'Senior Legal Counsel',
      date: new Date().toISOString(),
      confirmed_via: 'email',
    };

    const auditEntry = createAuditEntry(
      'Approval',
      'Signed Off',
      `Recorded formal Legal Counsel sign-off by ${newApproval.approver.name}`
    );

    setLrdDoc((prev) => ({
      ...prev,
      status: 'Approved',
      last_updated: new Date().toISOString(),
      approvals: [...prev.approvals, newApproval],
      audit_log: [auditEntry, ...(prev.audit_log || [])],
    }));

    showToast('Recorded Legal Counsel Sign-off');
  };

  // Toggle Traceability Accordion for Obligation
  const toggleObligationTraceability = (oblId: string) => {
    setExpandedTraceability((prev) => ({
      ...prev,
      [oblId]: !prev[oblId],
    }));
  };

  // Get connected nodes for an obligation
  const getLinkedNodesForObligation = (obl: Obligation): ArtifactNode[] => {
    const refs = obl.traceability_refs || ['brd-201', 'prd-301'];
    return GRAPH_NODES.filter((n) => refs.includes(n.id) || refs.includes(n.id.toLowerCase()));
  };

  return (
    <div className="min-h-screen flex flex-col bg-ebay-bg-primary text-ebay-fg-primary transition-colors duration-200">
      <Navbar />

      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-ebay-blue text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-bounce">
          <Sparkles className="w-5 h-5 text-white" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Workspace Header Bar */}
      <header className="border-b border-ebay-border bg-ebay-bg-primary sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 space-y-3">
          {/* Breadcrumb & Quick Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-ebay-fg-secondary">
              <button
                onClick={() => router.back()}
                className="hover:text-ebay-fg-primary flex items-center gap-1 transition-colors font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <span>/</span>
              <span className="font-mono text-ebay-blue">artifact</span>
              <span>/</span>
              <span className="font-mono text-ebay-fg-primary">{lrdDoc.id}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleFavorite}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isFavorited
                    ? 'bg-ebay-amber-bg text-ebay-amber border border-amber-500/40'
                    : 'bg-ebay-bg-secondary text-ebay-fg-secondary hover:text-ebay-fg-primary border border-ebay-border'
                }`}
                title="Favorite / Bookmark artifact"
              >
                <Star className={`w-3.5 h-3.5 ${isFavorited ? 'fill-amber-400 text-amber-400' : ''}`} />
                <span>{isFavorited ? 'Favorited' : 'Favorite'}</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  showToast('Direct Deep URL copied to clipboard!');
                }}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-ebay-bg-secondary text-ebay-fg-primary hover:bg-ebay-bg-tertiary border border-ebay-border flex items-center gap-1.5 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5 text-ebay-blue" /> Share Deep Link
              </button>

              <button
                onClick={() => {
                  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(lrdDoc, null, 2));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute('href', dataStr);
                  downloadAnchor.setAttribute('download', `${lrdDoc.id}.json`);
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                  showToast('Exported artifact JSON');
                }}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-ebay-bg-secondary text-ebay-fg-primary hover:bg-ebay-bg-tertiary border border-ebay-border flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-ebay-green" /> Export JSON
              </button>
            </div>
          </div>

          {/* Document Main Title Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-ebay-blue/10 text-ebay-blue border border-ebay-blue/40">
                  LRD
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono text-ebay-blue bg-ebay-blue/10 border border-ebay-blue/30">
                  {lrdDoc.version}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono text-ebay-green bg-ebay-green-bg border border-green-500/30">
                  {lrdDoc.status}
                </span>
                <span className="text-xs font-mono text-ebay-fg-secondary">{lrdDoc.urn}</span>
              </div>
              <h1 className="text-xl lg:text-2xl font-extrabold text-ebay-fg-primary tracking-tight">{lrdDoc.title}</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-ebay-bg-secondary border border-ebay-border px-4 py-2 rounded-2xl text-right">
                <span className="text-[10px] uppercase font-bold text-ebay-fg-secondary block">Legal Enforcement Date</span>
                <span className="text-sm font-extrabold text-ebay-amber font-mono">{lrdDoc.enforcement_date}</span>
              </div>
              <div className="bg-ebay-bg-secondary border border-ebay-border px-4 py-2 rounded-2xl text-right">
                <span className="text-[10px] uppercase font-bold text-ebay-fg-secondary block">Compliance Score</span>
                <span className="text-sm font-extrabold text-ebay-blue font-mono">100%</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main 2-Column Workspace: Left Content (3 cols), Right Sidebar Menu (1 col) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* LEFT / MAIN WORKSPACE COLUMN (3 cols) */}
          <div className="lg:col-span-3 space-y-6">

            {/* TAB 1: OVERVIEW & CONTEXT */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="evo-card p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-ebay-border pb-3">
                    <h3 className="font-bold text-ebay-fg-primary text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-ebay-blue" /> Statutory Legal Context & Scope
                    </h3>
                    {canWriteLRD && (
                      <button
                        onClick={() => {
                          if (!isEditingOverview) {
                            setOverviewForm({
                              title: lrdDoc.title,
                              regulation: lrdDoc.regulation,
                              legal_context: lrdDoc.sections.legal_context,
                              ebay_applicability: lrdDoc.sections.ebay_applicability,
                              exemptions: lrdDoc.sections.exemptions,
                              affected_categories: lrdDoc.sections.affected_categories.join(', '),
                              enforcement_date: lrdDoc.enforcement_date,
                              grace_period_end: lrdDoc.grace_period_end || '',
                            });
                          }
                          setIsEditingOverview(!isEditingOverview);
                        }}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                          isEditingOverview
                            ? 'bg-ebay-amber-bg text-ebay-amber border-amber-500/40'
                            : 'bg-ebay-blue/10 text-ebay-blue border-ebay-blue/30 hover:bg-ebay-blue hover:text-white'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isEditingOverview ? 'Cancel In-Page Edit' : 'Edit In Place'}</span>
                      </button>
                    )}
                  </div>

                  {isEditingOverview ? (
                    /* IN-PAGE INLINE EDIT FORM FOR OVERVIEW */
                    <form onSubmit={handleSaveOverviewInline} className="space-y-4 text-xs bg-ebay-bg-secondary p-4 rounded-2xl border border-ebay-border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-ebay-fg-secondary font-medium mb-1">Title</label>
                          <input
                            type="text"
                            required
                            value={overviewForm.title}
                            onChange={(e) => setOverviewForm({ ...overviewForm, title: e.target.value })}
                            className="w-full bg-ebay-bg-primary text-ebay-fg-primary px-3 py-2 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue"
                          />
                        </div>
                        <div>
                          <label className="block text-ebay-fg-secondary font-medium mb-1">Regulation</label>
                          <input
                            type="text"
                            required
                            value={overviewForm.regulation}
                            onChange={(e) => setOverviewForm({ ...overviewForm, regulation: e.target.value })}
                            className="w-full bg-ebay-bg-primary text-ebay-fg-primary px-3 py-2 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-ebay-fg-secondary font-medium mb-1">Enforcement Date</label>
                          <input
                            type="text"
                            required
                            value={overviewForm.enforcement_date}
                            onChange={(e) => setOverviewForm({ ...overviewForm, enforcement_date: e.target.value })}
                            className="w-full bg-ebay-bg-primary text-ebay-fg-primary px-3 py-2 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-ebay-fg-secondary font-medium mb-1">Grace Period End Date</label>
                          <input
                            type="text"
                            value={overviewForm.grace_period_end}
                            onChange={(e) => setOverviewForm({ ...overviewForm, grace_period_end: e.target.value })}
                            className="w-full bg-ebay-bg-primary text-ebay-fg-primary px-3 py-2 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-ebay-fg-secondary font-medium mb-1">Statutory Legal Context Summary</label>
                        <textarea
                          rows={4}
                          value={overviewForm.legal_context}
                          onChange={(e) => setOverviewForm({ ...overviewForm, legal_context: e.target.value })}
                          className="w-full bg-ebay-bg-primary text-ebay-fg-primary p-3 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="block text-ebay-fg-secondary font-medium mb-1">eBay Platform Applicability Scope</label>
                        <textarea
                          rows={3}
                          value={overviewForm.ebay_applicability}
                          onChange={(e) => setOverviewForm({ ...overviewForm, ebay_applicability: e.target.value })}
                          className="w-full bg-ebay-bg-primary text-ebay-fg-primary p-3 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="block text-ebay-fg-secondary font-medium mb-1">Affected Product Categories (comma separated)</label>
                        <input
                          type="text"
                          value={overviewForm.affected_categories}
                          onChange={(e) => setOverviewForm({ ...overviewForm, affected_categories: e.target.value })}
                          className="w-full bg-ebay-bg-primary text-ebay-fg-primary px-3 py-2 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue"
                        />
                      </div>

                      <div>
                        <label className="block text-ebay-fg-secondary font-medium mb-1">Exemptions & Out-of-Scope Provisions</label>
                        <textarea
                          rows={2}
                          value={overviewForm.exemptions}
                          onChange={(e) => setOverviewForm({ ...overviewForm, exemptions: e.target.value })}
                          className="w-full bg-ebay-bg-primary text-ebay-fg-primary p-3 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue leading-relaxed"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-ebay-border">
                        <button
                          type="button"
                          onClick={() => setIsEditingOverview(false)}
                          className="px-4 py-2 rounded-full text-ebay-fg-secondary hover:text-ebay-fg-primary"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-full bg-ebay-blue text-white font-bold hover:bg-blue-700 shadow-sm flex items-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" /> Save Section Overview
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* READ MODE FOR OVERVIEW SECTION */
                    <>
                      <p className="text-xs text-ebay-fg-primary leading-relaxed bg-ebay-bg-secondary p-4 rounded-2xl border border-ebay-border">
                        {lrdDoc.sections.legal_context}
                      </p>

                      <div className="space-y-2 pt-2">
                        <h4 className="font-bold text-ebay-fg-primary text-xs flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-ebay-blue" /> eBay Platform Applicability Scope
                        </h4>
                        <p className="text-xs text-ebay-fg-primary leading-relaxed bg-ebay-bg-secondary p-4 rounded-2xl border border-ebay-border">
                          {lrdDoc.sections.ebay_applicability}
                        </p>

                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          <span className="text-xs text-ebay-fg-secondary font-semibold block w-full">Affected Product Categories:</span>
                          {lrdDoc.sections.affected_categories.map((cat) => (
                            <span key={cat} className="px-3 py-1 rounded-full text-xs font-semibold bg-ebay-blue/10 text-ebay-blue border border-ebay-blue/20">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>

                      {lrdDoc.sections.exemptions && (
                        <div className="space-y-2 pt-2">
                          <h4 className="font-bold text-ebay-fg-primary text-xs flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-ebay-amber" /> Statutory Exemptions & Out-of-Scope Provisions
                          </h4>
                          <p className="text-xs text-ebay-fg-primary leading-relaxed bg-ebay-bg-secondary p-4 rounded-2xl border border-ebay-border">
                            {lrdDoc.sections.exemptions}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Metadata Summary Box */}
                <div className="evo-card p-6 space-y-3 shadow-sm">
                  <h3 className="font-bold text-ebay-fg-primary text-sm border-b border-ebay-border pb-3">Governance Metadata Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                    <div>
                      <span className="text-ebay-fg-secondary block text-[10px]">Regulation</span>
                      <strong className="text-ebay-blue">{lrdDoc.regulation}</strong>
                    </div>
                    <div>
                      <span className="text-ebay-fg-secondary block text-[10px]">Legal Counsel</span>
                      <strong className="text-ebay-fg-primary">{lrdDoc.lrd_owner.name}</strong>
                    </div>
                    <div>
                      <span className="text-ebay-fg-secondary block text-[10px]">Lead PM</span>
                      <strong className="text-ebay-fg-primary">{lrdDoc.pm_owner.name}</strong>
                    </div>
                    <div>
                      <span className="text-ebay-fg-secondary block text-[10px]">Enforcement Date</span>
                      <strong className="text-ebay-amber">{lrdDoc.enforcement_date}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: OBLIGATIONS COMPONENT */}
            {activeTab === 'obligations' && (
              <div className="space-y-6">
                {/* Filter & Action Header */}
                <div className="evo-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-ebay-fg-primary font-semibold">
                      <Filter className="w-4 h-4 text-ebay-blue" /> Filter Obligations:
                    </div>
                    <select
                      value={obligationTypeFilter}
                      onChange={(e) => setObligationTypeFilter(e.target.value)}
                      className="bg-ebay-bg-primary text-ebay-fg-primary px-3 py-1.5 rounded-xl border border-ebay-border text-xs focus:outline-none focus:ring-2 focus:ring-ebay-blue"
                    >
                      <option value="ALL">All Obligation Types</option>
                      <option value="Display">Display</option>
                      <option value="Disclosure">Disclosure</option>
                      <option value="Process">Process</option>
                      <option value="Prohibition">Prohibition</option>
                      <option value="Reporting">Reporting</option>
                    </select>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ebay-fg-secondary" />
                      <input
                        type="text"
                        placeholder="Search by article, text, or surface..."
                        value={obligationSearch}
                        onChange={(e) => setObligationSearch(e.target.value)}
                        className="bg-ebay-bg-primary text-ebay-fg-primary pl-8 pr-3 py-1.5 rounded-xl border border-ebay-border text-xs focus:outline-none focus:ring-2 focus:ring-ebay-blue w-64"
                      />
                    </div>
                  </div>

                  {canWriteLRD && (
                    <button
                      onClick={() => setShowAddObligationInline(!showAddObligationInline)}
                      className="px-4 py-2 rounded-full text-xs font-bold bg-ebay-blue text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5 self-end md:self-auto shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{showAddObligationInline ? 'Close Form' : '+ Add Obligation Entry'}</span>
                    </button>
                  )}
                </div>

                {/* INLINE FORM FOR CREATING NEW OBLIGATION */}
                {showAddObligationInline && (
                  <form onSubmit={handleAddObligationInline} className="evo-card p-5 space-y-3 bg-ebay-bg-secondary text-xs animate-fadeIn shadow-sm">
                    <h4 className="font-bold text-ebay-fg-primary text-sm flex items-center gap-2 border-b border-ebay-border pb-2">
                      <Plus className="w-4 h-4 text-ebay-blue" /> Create New Obligation Entry
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-ebay-fg-secondary font-medium mb-1">Article Reference (e.g. Article 4(2))</label>
                        <input
                          type="text"
                          required
                          value={newObligation.article || ''}
                          onChange={(e) => setNewObligation({ ...newObligation, article: e.target.value })}
                          className="w-full bg-ebay-bg-primary text-ebay-fg-primary px-3 py-2 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue"
                          placeholder="Article 3(1)(c)"
                        />
                      </div>
                      <div>
                        <label className="block text-ebay-fg-secondary font-medium mb-1">Obligation Type</label>
                        <select
                          value={newObligation.type}
                          onChange={(e) => setNewObligation({ ...newObligation, type: e.target.value as any })}
                          className="w-full bg-ebay-bg-primary text-ebay-fg-primary px-3 py-2 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue"
                        >
                          <option value="Display">Display</option>
                          <option value="Disclosure">Disclosure</option>
                          <option value="Process">Process</option>
                          <option value="Prohibition">Prohibition</option>
                          <option value="Reporting">Reporting</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-ebay-fg-secondary font-medium mb-1">Statutory Text</label>
                      <textarea
                        required
                        rows={3}
                        value={newObligation.text || ''}
                        onChange={(e) => setNewObligation({ ...newObligation, text: e.target.value })}
                        className="w-full bg-ebay-bg-primary text-ebay-fg-primary p-3 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue leading-relaxed"
                        placeholder="Obligation text as written in directive..."
                      />
                    </div>

                    <div>
                      <label className="block text-ebay-fg-secondary font-medium mb-1">Affected UI Surfaces (comma separated)</label>
                      <input
                        type="text"
                        value={newSurfaceInput}
                        onChange={(e) => setNewSurfaceInput(e.target.value)}
                        className="w-full bg-ebay-bg-primary text-ebay-fg-primary px-3 py-2 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue"
                        placeholder="View Item, Search SRP, Checkout"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-ebay-border">
                      <button
                        type="button"
                        onClick={() => setShowAddObligationInline(false)}
                        className="px-4 py-2 rounded-full text-ebay-fg-secondary hover:text-ebay-fg-primary"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-full bg-ebay-blue text-white font-bold hover:bg-blue-700 shadow-sm"
                      >
                        Save Obligation Entry
                      </button>
                    </div>
                  </form>
                )}

                {/* Obligation Cards List */}
                <div className="space-y-4">
                  {filteredObligations.length === 0 ? (
                    <div className="evo-card p-8 text-center text-ebay-fg-secondary text-xs shadow-sm">
                      No obligations match the selected filters.
                    </div>
                  ) : (
                    filteredObligations.map((obl) => {
                      const linkedTraceNodes = getLinkedNodesForObligation(obl);
                      const isTraceExpanded = expandedTraceability[obl.id];

                      return (
                        <div
                          key={obl.id}
                          className="evo-card p-5 space-y-4 shadow-sm hover:border-ebay-blue/50 transition-all"
                        >
                          {/* Obligation Header Bar */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                                {obl.article}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded text-xs font-bold font-mono border ${
                                  obl.type === 'Prohibition'
                                    ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                                    : obl.type === 'Display'
                                    ? 'bg-purple-950 text-purple-300 border-purple-500/40'
                                    : obl.type === 'Disclosure'
                                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                                    : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                                }`}
                              >
                                {obl.type}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">{obl.id}</span>
                            </div>

                            {canWriteLRD && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleStartEditObligation(obl)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 ${
                                    editingObligationId === obl.id
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                      : 'bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border-slate-700'
                                  }`}
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>{editingObligationId === obl.id ? 'Cancel' : 'Edit In Place'}</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteObligation(obl.id)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-950/40 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition-colors flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" /> Delete
                                </button>
                              </div>
                            )}
                          </div>

                          {/* INLINE EDIT MODE OR READ MODE */}
                          {editingObligationId === obl.id ? (
                            /* IN-PAGE INLINE EDIT FORM FOR OBLIGATION */
                            <form onSubmit={handleSaveEditObligationInline} className="space-y-3 bg-slate-900/90 p-4 rounded-xl border border-indigo-500/40 text-xs">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-slate-400 font-medium mb-1">Article Reference</label>
                                  <input
                                    type="text"
                                    required
                                    value={obligationEditForm.article || ''}
                                    onChange={(e) => setObligationEditForm({ ...obligationEditForm, article: e.target.value })}
                                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-400 font-medium mb-1">Obligation Type</label>
                                  <select
                                    value={obligationEditForm.type || 'Display'}
                                    onChange={(e) => setObligationEditForm({ ...obligationEditForm, type: e.target.value as any })}
                                    className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                                  >
                                    <option value="Display">Display</option>
                                    <option value="Disclosure">Disclosure</option>
                                    <option value="Process">Process</option>
                                    <option value="Prohibition">Prohibition</option>
                                    <option value="Reporting">Reporting</option>
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="block text-slate-400 font-medium mb-1">Statutory Text</label>
                                <textarea
                                  required
                                  rows={3}
                                  value={obligationEditForm.text || ''}
                                  onChange={(e) => setObligationEditForm({ ...obligationEditForm, text: e.target.value })}
                                  className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 font-serif leading-relaxed"
                                />
                              </div>

                              <div>
                                <label className="block text-slate-400 font-medium mb-1">Affected UI Surfaces (comma separated)</label>
                                <input
                                  type="text"
                                  value={obligationSurfaceInput}
                                  onChange={(e) => setObligationSurfaceInput(e.target.value)}
                                  className="w-full bg-slate-950 text-slate-100 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
                                />
                              </div>

                              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                                <button
                                  type="button"
                                  onClick={() => setEditingObligationId(null)}
                                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 flex items-center gap-1.5"
                                >
                                  <Save className="w-3.5 h-3.5" /> Save Obligation
                                </button>
                              </div>
                            </form>
                          ) : (
                            /* READ MODE */
                            <>
                              <p className="text-xs text-slate-100 font-serif leading-relaxed bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                                {obl.text}
                              </p>

                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase">Affected Surfaces:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {obl.affected_surface.map((surf) => (
                                      <span key={surf} className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                                        {surf}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {obl.notes && (
                                  <div className="text-[11px] text-slate-400 italic">
                                    Notes: {obl.notes}
                                  </div>
                                )}
                              </div>
                            </>
                          )}

                          {/* COLLAPSIBLE OBLIGATION TRACEABILITY MODULE & IN-PAGE INSPECTOR */}
                          <div className="pt-2 border-t border-slate-800/80">
                            <button
                              onClick={() => toggleObligationTraceability(obl.id)}
                              className="w-full flex items-center justify-between text-xs font-semibold text-purple-300 hover:text-purple-200 transition-colors py-1"
                            >
                              <div className="flex items-center gap-2">
                                <GitBranch className="w-3.5 h-3.5 text-purple-400" />
                                <span>Traceability Chain ({linkedTraceNodes.length} Linked Artifact Elements)</span>
                              </div>
                              {isTraceExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            {isTraceExpanded && (
                              <div className="pt-3 space-y-3 animate-fadeIn">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  {linkedTraceNodes.map((node) => (
                                    <div
                                      key={node.id}
                                      onClick={() => setInspectedTraceNode(inspectedTraceNode?.id === node.id ? null : node)}
                                      className={`p-2.5 rounded-xl border text-xs font-mono cursor-pointer transition-all ${
                                        inspectedTraceNode?.id === node.id
                                          ? 'bg-purple-950/80 border-purple-400 text-white ring-1 ring-purple-500/50'
                                          : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                                          {node.tier}
                                        </span>
                                        <span className="text-[10px] text-emerald-400 font-semibold">{node.status}</span>
                                      </div>
                                      <div className="font-bold text-[11px] truncate mt-1">{node.title}</div>
                                      <div className="text-[10px] text-cyan-400 font-bold mt-0.5">{node.complianceScore}% Score</div>
                                    </div>
                                  ))}
                                </div>

                                {/* IN-PAGE QUICK INSPECTOR DRAWER */}
                                {inspectedTraceNode && (
                                  <div className="p-4 rounded-xl bg-slate-900/90 border border-purple-500/50 text-xs space-y-2 animate-fadeIn">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                      <div className="flex items-center gap-2">
                                        <Info className="w-4 h-4 text-purple-400" />
                                        <span className="font-bold text-slate-100">{inspectedTraceNode.title}</span>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-500/30">
                                          {inspectedTraceNode.tier} • {inspectedTraceNode.version}
                                        </span>
                                      </div>
                                      <button onClick={() => setInspectedTraceNode(null)} className="text-slate-400 hover:text-white">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    <p className="text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px]">
                                      {inspectedTraceNode.summary}
                                    </p>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10px] pt-1">
                                      <div>Owner: <span className="text-indigo-300">{inspectedTraceNode.owner}</span></div>
                                      <div>Status: <span className="text-emerald-400">{inspectedTraceNode.status}</span></div>
                                      <div>Score: <span className="text-cyan-400">{inspectedTraceNode.complianceScore}%</span></div>
                                      <div>Updated: <span className="text-slate-400">{inspectedTraceNode.lastUpdated}</span></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: OPEN QUESTIONS COMPONENT */}
            {activeTab === 'questions' && (
              <div className="space-y-6">
                {/* Filter Bar */}
                <div className="evo-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-ebay-fg-primary font-semibold">
                      <Filter className="w-4 h-4 text-ebay-amber" /> Filter Open Questions:
                    </div>

                    <select
                      value={questionStatusFilter}
                      onChange={(e) => setQuestionStatusFilter(e.target.value)}
                      className="bg-ebay-bg-primary text-ebay-fg-primary px-3 py-1.5 rounded-xl border border-ebay-border text-xs focus:outline-none focus:ring-2 focus:ring-ebay-blue"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="Open">Open</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Escalated">Escalated</option>
                    </select>

                    <select
                      value={questionAskedByFilter}
                      onChange={(e) => setQuestionAskedByFilter(e.target.value)}
                      className="bg-ebay-bg-primary text-ebay-fg-primary px-3 py-1.5 rounded-xl border border-ebay-border text-xs focus:outline-none focus:ring-2 focus:ring-ebay-blue"
                    >
                      <option value="ALL">All Asked-By Users</option>
                      {uniqueAskedBy.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ebay-fg-secondary" />
                      <input
                        type="text"
                        placeholder="Search question text or resolution..."
                        value={questionSearch}
                        onChange={(e) => setQuestionSearch(e.target.value)}
                        className="bg-ebay-bg-primary text-ebay-fg-primary pl-8 pr-3 py-1.5 rounded-xl border border-ebay-border text-xs focus:outline-none focus:ring-2 focus:ring-ebay-blue w-60"
                      />
                    </div>
                  </div>

                  {canWriteLRD && (
                    <button
                      onClick={() => setShowAddQuestionInline(!showAddQuestionInline)}
                      className="px-4 py-2 rounded-full text-xs font-bold bg-ebay-amber text-white hover:bg-amber-600 transition-colors flex items-center gap-1.5 self-end md:self-auto shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{showAddQuestionInline ? 'Close Form' : '+ Raise Open Question'}</span>
                    </button>
                  )}
                </div>

                {/* INLINE FORM FOR CREATING NEW QUESTION */}
                {showAddQuestionInline && (
                  <form onSubmit={handleAddQuestionInline} className="evo-card p-5 space-y-3 bg-ebay-bg-secondary text-xs animate-fadeIn shadow-sm">
                    <h4 className="font-bold text-ebay-fg-primary text-sm flex items-center gap-2 border-b border-ebay-border pb-2">
                      <HelpCircle className="w-4 h-4 text-ebay-amber" /> Raise New Open Legal Question
                    </h4>
                    <div>
                      <label className="block text-ebay-fg-secondary font-medium mb-1">Question Description</label>
                      <textarea
                        required
                        rows={3}
                        value={newQuestion.question}
                        onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                        className="w-full bg-ebay-bg-primary text-ebay-fg-primary p-3 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue leading-relaxed"
                        placeholder="State the ambiguous legal scenario requiring resolution..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-ebay-fg-secondary font-medium mb-1">Asked By (Name)</label>
                        <input
                          type="text"
                          required
                          value={newQuestion.asked_by_name}
                          onChange={(e) => setNewQuestion({ ...newQuestion, asked_by_name: e.target.value })}
                          className="w-full bg-ebay-bg-primary text-ebay-fg-primary px-3 py-2 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-ebay-fg-secondary font-medium mb-1">Link to Obligation (Optional)</label>
                        <select
                          value={newQuestion.linked_obligation_id}
                          onChange={(e) => setNewQuestion({ ...newQuestion, linked_obligation_id: e.target.value })}
                          className="w-full bg-ebay-bg-primary text-ebay-fg-primary px-3 py-2 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue"
                        >
                          <option value="">(Root LRD Question)</option>
                          {lrdDoc.sections.obligations.map((obl) => (
                            <option key={obl.id} value={obl.id}>
                              {obl.id} ({obl.article})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-ebay-border">
                      <button
                        type="button"
                        onClick={() => setShowAddQuestionInline(false)}
                        className="px-4 py-2 rounded-full text-ebay-fg-secondary hover:text-ebay-fg-primary"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-full bg-ebay-amber text-white font-bold hover:bg-amber-600 shadow-sm"
                      >
                        Submit Question Entry
                      </button>
                    </div>
                  </form>
                )}

                {/* Questions List */}
                <div className="space-y-4">
                  {filteredQuestions.length === 0 ? (
                    <div className="evo-card p-8 text-center text-ebay-fg-secondary text-xs shadow-sm">
                      No open legal questions match the selected filters.
                    </div>
                  ) : (
                    filteredQuestions.map((q) => (
                      <div
                        key={q.id}
                        className="evo-card p-5 space-y-3 shadow-sm hover:border-ebay-amber/50 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`evo-badge ${
                                q.status === 'Resolved'
                                  ? 'bg-ebay-green-bg text-ebay-green border border-green-500/30'
                                  : q.status === 'Escalated'
                                  ? 'bg-ebay-red-bg text-ebay-red border border-red-500/30'
                                  : 'bg-ebay-amber-bg text-ebay-amber border border-amber-500/30'
                              }`}
                            >
                              {q.status}
                            </span>
                            <span className="text-[10px] font-mono text-ebay-fg-secondary">{q.id}</span>
                            {q.linked_obligation_id && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-ebay-blue/10 text-ebay-blue border border-ebay-blue/30 font-bold">
                                Linked: {q.linked_obligation_id}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-[10px] font-mono text-ebay-fg-secondary">
                              Raised: <strong>{q.date_raised}</strong> by <span className="text-ebay-blue font-semibold">{q.asked_by.name}</span> ({q.asked_by.role || 'Member'})
                            </div>

                            {canWriteLRD && (
                              <button
                                onClick={() => handleStartEditQuestion(q)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors flex items-center gap-1 ${
                                  editingQuestionId === q.id
                                    ? 'bg-ebay-amber-bg text-ebay-amber border-amber-500/40'
                                    : 'bg-ebay-bg-secondary hover:bg-ebay-bg-tertiary text-ebay-fg-primary border-ebay-border'
                                }`}
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>{editingQuestionId === q.id ? 'Cancel' : 'Resolve / Edit In Place'}</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* INLINE EDIT FOR QUESTION RESOLUTION */}
                        {editingQuestionId === q.id ? (
                          <form onSubmit={handleSaveQuestionInline} className="space-y-3 bg-ebay-bg-secondary p-4 rounded-2xl border border-ebay-border text-xs">
                            <div>
                              <label className="block text-ebay-fg-secondary font-medium mb-1">Question Description</label>
                              <input
                                type="text"
                                required
                                value={questionEditForm.question}
                                onChange={(e) => setQuestionEditForm({ ...questionEditForm, question: e.target.value })}
                                className="w-full bg-ebay-bg-primary text-ebay-fg-primary px-3 py-2 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue"
                              />
                            </div>

                            <div>
                              <label className="block text-ebay-fg-secondary font-medium mb-1">Resolution Status</label>
                              <select
                                value={questionEditForm.status}
                                onChange={(e) => setQuestionEditForm({ ...questionEditForm, status: e.target.value as any })}
                                className="w-full bg-ebay-bg-primary text-ebay-fg-primary px-3 py-2 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue font-semibold"
                              >
                                <option value="Open">Open</option>
                                <option value="Resolved">Resolved</option>
                                <option value="Escalated">Escalated</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-ebay-fg-secondary font-medium mb-1">Legal Interpretation / Resolution</label>
                              <textarea
                                rows={3}
                                value={questionEditForm.resolution}
                                onChange={(e) => setQuestionEditForm({ ...questionEditForm, resolution: e.target.value })}
                                className="w-full bg-ebay-bg-primary text-ebay-fg-primary p-3 rounded-xl border border-ebay-border focus:outline-none focus:ring-2 focus:ring-ebay-blue leading-relaxed"
                                placeholder="Provide formal legal counsel resolution details..."
                              />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-ebay-border">
                              <button
                                type="button"
                                onClick={() => setEditingQuestionId(null)}
                                className="px-4 py-2 rounded-full text-ebay-fg-secondary hover:text-ebay-fg-primary"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-2 rounded-full bg-ebay-amber text-white font-bold hover:bg-amber-600 flex items-center gap-1.5 shadow-sm"
                              >
                                <Save className="w-3.5 h-3.5" /> Save Question Resolution
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <h4 className="font-bold text-ebay-fg-primary text-xs">{q.question}</h4>

                            {q.resolution ? (
                              <div className="p-3 rounded-2xl bg-ebay-green-bg border border-green-500/30 space-y-1">
                                <span className="text-[10px] font-bold text-ebay-green uppercase flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Legal Resolution
                                </span>
                                <p className="text-xs text-ebay-fg-primary">{q.resolution}</p>
                              </div>
                            ) : (
                              <div className="p-3 rounded-2xl bg-ebay-bg-secondary border border-ebay-border text-[11px] text-ebay-fg-secondary italic flex items-center justify-between">
                                <span>Pending legal counsel interpretation & formal resolution.</span>
                                {canWriteLRD && (
                                  <button
                                    onClick={() => handleStartEditQuestion(q)}
                                    className="text-ebay-amber hover:underline font-bold text-xs"
                                  >
                                    Resolve In Place →
                                  </button>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: APPROVALS COMPONENT */}
            {activeTab === 'approvals' && (
              <div className="space-y-6">
                <div className="evo-card p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-ebay-border pb-3">
                    <div>
                      <h3 className="font-bold text-ebay-fg-primary text-sm flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-ebay-green" /> Formal Legal Sign-off Log
                      </h3>
                      <p className="text-xs text-ebay-fg-secondary">Structured human-in-the-loop approvals required for LRD ratification.</p>
                    </div>

                    {canApproveLRD && (
                      <button
                        onClick={handleAddApproval}
                        className="px-4 py-2 rounded-full text-xs font-bold bg-ebay-green text-white hover:bg-green-700 transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Record Sign-off
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {lrdDoc.approvals.length === 0 ? (
                      <p className="text-xs text-ebay-fg-secondary italic">No formal sign-offs recorded yet.</p>
                    ) : (
                      lrdDoc.approvals.map((app, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-ebay-bg-secondary border border-ebay-border flex items-center justify-between text-xs">
                          <div className="space-y-1">
                            <div className="font-bold text-ebay-fg-primary">{app.approver.name}</div>
                            <div className="text-[10px] text-ebay-fg-secondary font-mono">{app.role} • Confirmed via {app.confirmed_via || 'email'}</div>
                          </div>
                          <div className="text-ebay-green font-mono font-bold flex items-center gap-1">
                            <Check className="w-4 h-4" /> {app.date.split('T')[0]}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: LINEAGE & DOWNSTREAM */}
            {activeTab === 'lineage' && (
              <div className="space-y-6">
                <div className="evo-card p-6 space-y-4 shadow-sm">
                  <h3 className="font-bold text-ebay-fg-primary text-sm flex items-center gap-2 border-b border-ebay-border pb-3">
                    <Layers className="w-4 h-4 text-ebay-blue" /> Downstream Traceability Graph Connections
                  </h3>
                  <p className="text-xs text-ebay-fg-secondary">
                    Connected Business Requirements Documents (BRDs), Product Requirements (PRDs), and Jira implementation items derived from this LRD.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {GRAPH_EDGES.filter((e) => e.source === lrdDoc.id || e.source === 'art-lrd-101' || e.source === 'lrd-101').map((edge) => (
                      <div key={edge.id} className="evo-card p-4 space-y-2 shadow-xs">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-ebay-blue/10 text-ebay-blue border border-ebay-blue/30">
                          {edge.label}
                        </span>
                        <div className="font-mono text-xs text-ebay-fg-primary">
                          Target: <strong className="text-ebay-blue">{edge.target}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: RAW SCHEMA JSON */}
            {activeTab === 'schema' && (
              <div className="evo-card p-6 space-y-3 shadow-sm">
                <h3 className="font-bold text-ebay-fg-primary text-sm flex items-center gap-2 border-b border-ebay-border pb-3">
                  <Tag className="w-4 h-4 text-ebay-blue" /> Conforming §4.1 LRD Schema Object
                </h3>
                <pre className="bg-ebay-bg-secondary p-4 rounded-2xl border border-ebay-border text-xs font-mono text-ebay-blue overflow-x-auto max-h-[500px]">
                  {JSON.stringify(lrdDoc, null, 2)}
                </pre>
              </div>
            )}

            {/* TAB 7: ACTIVITY & AUDIT LOG */}
            {activeTab === 'audit' && (
              <div className="space-y-6">
                <div className="evo-card p-6 space-y-4 shadow-sm">
                  <div className="border-b border-ebay-border pb-3">
                    <h3 className="font-bold text-ebay-fg-primary text-sm flex items-center gap-2">
                      <History className="w-4 h-4 text-ebay-amber" /> Real-time Activity & Audit Log Trail
                    </h3>
                    <p className="text-xs text-ebay-fg-secondary">Chronological history of all user edits, obligation updates, open question resolutions, and legal approvals.</p>
                  </div>

                  {!lrdDoc.audit_log || lrdDoc.audit_log.length === 0 ? (
                    <div className="text-center py-8 text-ebay-fg-secondary text-xs italic">
                      No activity log entries recorded yet.
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-ebay-border ml-4 space-y-6 py-2">
                      {lrdDoc.audit_log.map((log) => (
                        <div key={log.id} className="relative pl-6 space-y-2">
                          <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-ebay-bg-primary border-2 border-ebay-amber flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-ebay-amber" />
                          </div>

                          <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`evo-badge ${
                                  log.action === 'Created'
                                    ? 'bg-ebay-blue/10 text-ebay-blue border border-ebay-blue/30'
                                    : log.action === 'Resolved' || log.action === 'Signed Off'
                                    ? 'bg-ebay-green-bg text-ebay-green border border-green-500/30'
                                    : log.action === 'Deleted'
                                    ? 'bg-ebay-red-bg text-ebay-red border border-red-500/30'
                                    : 'bg-ebay-amber-bg text-ebay-amber border border-amber-500/30'
                                }`}
                              >
                                {log.action}
                              </span>
                              <span className="font-mono text-ebay-blue text-[11px] font-bold">{log.targetComponent}</span>
                              <span className="text-[10px] font-mono text-ebay-fg-secondary">{log.id}</span>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] font-mono text-ebay-fg-secondary">
                              <Clock className="w-3 h-3 text-ebay-fg-secondary" />
                              <span>{log.timestamp.replace('T', ' ').substring(0, 16)}</span>
                              <span>•</span>
                              <User className="w-3 h-3 text-ebay-fg-secondary" />
                              <strong className="text-ebay-fg-primary">{log.author.name}</strong> ({log.author.role})
                            </div>
                          </div>

                          <p className="text-xs text-ebay-fg-primary font-medium bg-ebay-bg-secondary p-3 rounded-2xl border border-ebay-border">
                            {log.summary}
                          </p>

                          {log.changes && log.changes.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[10px] font-bold text-ebay-fg-secondary uppercase block">Field Changes:</span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                                {log.changes.map((c, i) => (
                                  <div key={i} className="p-2 rounded-xl bg-ebay-bg-secondary border border-ebay-border text-[11px]">
                                    <span className="text-ebay-amber font-bold block">{c.field}</span>
                                    <div className="text-ebay-red line-through text-[10px]">From: {c.oldValue}</div>
                                    <div className="text-ebay-green text-[10px]">To: {c.newValue}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT-HAND SIDEBAR COMPONENT NAVIGATION MENU */}
          <div className="lg:col-span-1 space-y-4 sticky top-24">
            <div className="evo-card p-4 space-y-3 shadow-sm">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-ebay-fg-secondary border-b border-ebay-border pb-2 flex items-center justify-between">
                <span>Component Menu</span>
                <span className="text-[10px] text-ebay-blue font-mono font-bold">§4.1 LRD</span>
              </h3>

              <nav className="space-y-1 text-xs">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full p-2.5 rounded-xl font-semibold flex items-center justify-between transition-all ${
                    activeTab === 'overview'
                      ? 'bg-ebay-blue text-white shadow-sm font-bold'
                      : 'text-ebay-fg-secondary hover:text-ebay-fg-primary hover:bg-ebay-bg-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Overview Context</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('obligations')}
                  className={`w-full p-2.5 rounded-xl font-semibold flex items-center justify-between transition-all ${
                    activeTab === 'obligations'
                      ? 'bg-ebay-blue text-white shadow-sm font-bold'
                      : 'text-ebay-fg-secondary hover:text-ebay-fg-primary hover:bg-ebay-bg-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Obligations</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-ebay-bg-secondary text-ebay-blue border border-ebay-border">
                    {lrdDoc.sections.obligations.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('questions')}
                  className={`w-full p-2.5 rounded-xl font-semibold flex items-center justify-between transition-all ${
                    activeTab === 'questions'
                      ? 'bg-ebay-blue text-white shadow-sm font-bold'
                      : 'text-ebay-fg-secondary hover:text-ebay-fg-primary hover:bg-ebay-bg-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    <span>Open Questions</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-ebay-amber-bg text-ebay-amber border border-amber-500/20">
                    {lrdDoc.sections.open_legal_questions.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('approvals')}
                  className={`w-full p-2.5 rounded-xl font-semibold flex items-center justify-between transition-all ${
                    activeTab === 'approvals'
                      ? 'bg-ebay-blue text-white shadow-sm font-bold'
                      : 'text-ebay-fg-secondary hover:text-ebay-fg-primary hover:bg-ebay-bg-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    <span>Approvals</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-ebay-green-bg text-ebay-green border border-green-500/20">
                    {lrdDoc.approvals.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('lineage')}
                  className={`w-full p-2.5 rounded-xl font-semibold flex items-center justify-between transition-all ${
                    activeTab === 'lineage'
                      ? 'bg-ebay-blue text-white shadow-sm font-bold'
                      : 'text-ebay-fg-secondary hover:text-ebay-fg-primary hover:bg-ebay-bg-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    <span>Lineage Graph</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('schema')}
                  className={`w-full p-2.5 rounded-xl font-semibold flex items-center justify-between transition-all ${
                    activeTab === 'schema'
                      ? 'bg-ebay-blue text-white shadow-sm font-bold'
                      : 'text-ebay-fg-secondary hover:text-ebay-fg-primary hover:bg-ebay-bg-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    <span>Raw Schema JSON</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('audit')}
                  className={`w-full p-2.5 rounded-xl font-semibold flex items-center justify-between transition-all ${
                    activeTab === 'audit'
                      ? 'bg-ebay-amber text-white shadow-sm font-bold'
                      : 'text-ebay-fg-secondary hover:text-ebay-fg-primary hover:bg-ebay-bg-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4" />
                    <span>Activity & Audit Log</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-ebay-amber-bg text-ebay-amber border border-amber-500/20">
                    {lrdDoc.audit_log?.length || 0}
                  </span>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
