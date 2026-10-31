import React, { useEffect, useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Loader2,
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  X,
  Edit3,
  HelpCircle,
  Search,
  Filter,
  Check,
  ShieldAlert,
  Copy,
  Info
} from 'lucide-react';
import { apiClient, ApiError } from '../../services/api';
import {
  ApplicationCategorySummary,
  ApplicationDraft,
  InstitutionProfile
} from '../../types';
import { Badge } from '../../components/ui/badge';

export const ApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationDraft[]>([]);
  const [categories, setCategories] = useState<ApplicationCategorySummary[]>([]);
  const [institutions, setInstitutions] = useState<InstitutionProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterInstitutionId, setFilterInstitutionId] = useState<string>('ALL');

  // New Draft Modal state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedInstId, setSelectedInstId] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [draftNotes, setDraftNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit / View Modal state
  const [activeDraft, setActiveDraft] = useState<ApplicationDraft | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [initialEditNotes, setInitialEditNotes] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [appsRes, catsRes, instsRes] = await Promise.all([
        apiClient.getApplications(),
        apiClient.getApplicationCategories(),
        apiClient.getInstitutions()
      ]);

      setApplications(appsRes.data.applications || []);
      setCategories(catsRes.data.categories || []);
      setInstitutions(instsRes.data.institutions || []);

      if (instsRes.data.institutions?.length > 0 && !selectedInstId) {
        setSelectedInstId(instsRes.data.institutions[0].id);
      }
      if (catsRes.data.categories?.length > 0 && !selectedCatId) {
        setSelectedCatId(catsRes.data.categories[0].id);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load application drafting data.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered applications list
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch =
        !searchQuery ||
        app.internalReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.institutionName && app.institutionName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesInstitution =
        filterInstitutionId === 'ALL' || app.institutionId === filterInstitutionId;

      return matchesSearch && matchesInstitution;
    });
  }, [applications, searchQuery, filterInstitutionId]);

  // Validation before creating draft
  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstId) {
      setCreateError('Please select a target institution where you hold active membership.');
      return;
    }
    if (!selectedCatId) {
      setCreateError('Please select an approved application category.');
      return;
    }

    setIsSubmitting(true);
    setCreateError(null);

    try {
      const res = await apiClient.createApplicationDraft({
        institutionId: selectedInstId,
        categoryId: selectedCatId,
        intakePayload: draftNotes.trim() ? { draftNotes: draftNotes.trim() } : {}
      });

      setApplications((prev) => [res.data.application, ...prev]);
      setIsNewModalOpen(false);
      setDraftNotes('');
    } catch (err) {
      if (err instanceof ApiError) {
        setCreateError(err.message);
      } else {
        setCreateError('Failed to create application draft.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (draft: ApplicationDraft) => {
    setActiveDraft(draft);
    const existingNotes =
      typeof draft.intakePayload?.draftNotes === 'string'
        ? draft.intakePayload.draftNotes
        : '';
    setEditNotes(existingNotes);
    setInitialEditNotes(existingNotes);
    setEditError(null);
    setEditSuccess(false);
    setShowDiscardConfirm(false);
  };

  const isEditDirty = editNotes !== initialEditNotes;

  const handleCloseEdit = () => {
    if (isEditDirty) {
      setShowDiscardConfirm(true);
    } else {
      setActiveDraft(null);
    }
  };

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false);
    setActiveDraft(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDraft) return;

    setIsSavingEdit(true);
    setEditError(null);
    setEditSuccess(false);

    try {
      const res = await apiClient.updateApplicationDraft(activeDraft.id, {
        intakePayload: {
          ...activeDraft.intakePayload,
          draftNotes: editNotes.trim()
        }
      });

      setActiveDraft(res.data.application);
      setInitialEditNotes(editNotes.trim());
      setApplications((prev) =>
        prev.map((app) => (app.id === res.data.application.id ? res.data.application : app))
      );
      setEditSuccess(true);
      setTimeout(() => setEditSuccess(false), 3500);
    } catch (err) {
      if (err instanceof ApiError) {
        setEditError(err.message);
      } else {
        setEditError('Failed to update draft application.');
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCopyReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="sm:flex sm:items-center sm:justify-between pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-text-strong tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-primary" />
            Applications &amp; Intake Drafting
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Phase 5 Substage 4 · Application Category Selection and Preparation of Case Drafts.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setCreateError(null);
              setIsNewModalOpen(true);
            }}
            disabled={institutions.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-xs text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Start New Application Draft
          </button>
        </div>
      </div>

      {/* Architecture & Persistence Limitation Banner */}
      <div className="p-4 rounded-xl bg-surface-subtle border border-primary/25 shadow-xs">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-text-secondary space-y-1.5 leading-relaxed">
            <p className="font-semibold text-text-strong text-sm">
              Regulatory Scope &amp; Persistence Notice (Decision Q-04 &amp; Phase 5 Foundation)
            </p>
            <p>
              • <strong>Supported Categories:</strong> Aligned with Q-04 proposed scope, draft intake supports
              {' '}<strong>Setting up a New Technical Institution</strong> (Chapter I) and{' '}
              <strong>Extension of Approval (EoA)</strong> (Chapter II). All other categories remain inactive.
            </p>
            <p>
              • <strong>In-Memory Draft Store:</strong> In this foundation substage, application drafts are stored
              in an in-memory session store (Domain 2 relational tables await owner database migration approval).
              <em> Drafts do not persist across backend server restarts.</em>
            </p>
            <p>
              • <strong>Workflow Boundary:</strong> Applications remain in <code className="text-primary font-mono bg-surface px-1 py-0.5 rounded border border-border">DRAFT</code> status.
              Official submission, fee reconciliation, document verification, and committee scrutiny workflows are part of later substages.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      {!isLoading && !error && applications.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-surface rounded-xl border border-border shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference or category..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-border bg-surface text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary"
            />
          </div>

          {institutions.length > 1 && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-text-secondary" />
              <span className="text-xs text-text-secondary font-medium">Institution:</span>
              <select
                value={filterInstitutionId}
                onChange={(e) => setFilterInstitutionId(e.target.value)}
                className="text-xs rounded-md border border-border bg-surface px-2.5 py-1.5 text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary"
              >
                <option value="ALL">All Institutions ({institutions.length})</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-text-secondary gap-3 bg-surface rounded-xl border border-border">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Loading application drafts and approved catalogue...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-danger-bg border border-danger/25 shadow-xs flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-danger shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-danger">Failed to load application data</h3>
            <p className="text-xs text-text-secondary">{error}</p>
            <button
              type="button"
              onClick={fetchData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-danger/30 text-danger hover:bg-danger-bg shadow-xs"
            >
              Retry Connection
            </button>
          </div>
        </div>
      ) : (
        <div>
          {applications.length === 0 ? (
            <div className="text-center py-20 bg-surface rounded-xl border border-border shadow-xs px-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-surface-subtle flex items-center justify-center text-primary mb-4 border border-primary/20">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-text-strong">No Application Drafts Found</h3>
              <p className="mt-1 text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
                {institutions.length === 0
                  ? 'Your account currently holds no active institution memberships. You must be associated with an active institution to draft applications.'
                  : 'Start a new draft to prepare an application under Chapter I (New Institution) or Chapter II (Extension of Approval).'}
              </p>
              {institutions.length > 0 && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover shadow-xs transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create First Application Draft
                  </button>
                </div>
              )}
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12 bg-surface rounded-xl border border-border text-text-secondary text-sm">
              No applications match your filter criteria ({searchQuery}).
            </div>
          ) : (
            <div className="bg-surface shadow-xs rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border text-left">
                  <thead className="bg-surface-muted/60 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    <tr>
                      <th scope="col" className="px-6 py-3.5">Application Reference</th>
                      <th scope="col" className="px-6 py-3.5">Institution</th>
                      <th scope="col" className="px-6 py-3.5">Category &amp; Route</th>
                      <th scope="col" className="px-6 py-3.5">Academic Cycle</th>
                      <th scope="col" className="px-6 py-3.5">Status</th>
                      <th scope="col" className="px-6 py-3.5">Created Date</th>
                      <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {filteredApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-surface-subtle/30 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono font-semibold text-text-strong block">
                            {app.internalReference}
                          </span>
                          <span className="text-[11px] text-text-secondary">
                            ID: {app.id.slice(0, 8)}...
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-text-strong flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                            <span>{app.institutionName || 'Active Institution'}</span>
                          </div>
                          <div className="text-xs text-text-secondary">
                            {app.institutionTypeSnapshot}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-text-strong">{app.categoryName}</div>
                          <div className="mt-1 flex items-center gap-1.5">
                            {app.categoryCode === 'NEW_TECHNICAL_INSTITUTION' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface-muted text-text-secondary border border-border">
                                Scrutiny + EVC
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-success-bg text-success border border-success/30">
                                Fast-Track (Nil Deficiency)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-text-secondary">
                          <span className="inline-flex items-center gap-1 text-xs">
                            <Calendar className="w-3.5 h-3.5 text-text-secondary" />
                            {app.academicCycle}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="subtle" className="text-xs uppercase font-medium">
                            {app.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-text-secondary text-xs">
                          {new Date(app.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(app)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border text-text-primary bg-surface hover:bg-surface-muted shadow-2xs transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-primary" />
                            View / Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Create Application Draft */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-surface rounded-xl shadow-2xl max-w-xl w-full border border-border overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-muted/30">
              <div>
                <h3 className="text-base font-bold text-text-strong">Start Application Draft</h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Select institution and an approved Q-04 category to initialize draft.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="text-text-secondary hover:text-text-primary p-1.5 rounded-md hover:bg-surface-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDraft} className="p-6 space-y-5">
              {createError && (
                <div className="p-3 bg-danger-bg text-danger text-xs rounded-md border border-danger/25 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}

              {/* Institution Selection */}
              <div>
                <label className="block text-xs font-semibold text-text-strong uppercase tracking-wider mb-1.5">
                  Target Institution <span className="text-danger">*</span>
                </label>
                <select
                  value={selectedInstId}
                  onChange={(e) => setSelectedInstId(e.target.value)}
                  className="w-full text-sm rounded-md border border-border bg-surface px-3 py-2 text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary shadow-2xs"
                  required
                >
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.institutionType})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-text-secondary flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-text-secondary" />
                  Tenant boundary enforced: only institutions where your user holds active membership are available.
                </p>
              </div>

              {/* Category Cards Selection */}
              <div>
                <label className="block text-xs font-semibold text-text-strong uppercase tracking-wider mb-2">
                  Application Category (AICTE APH 2024–2027) <span className="text-danger">*</span>
                </label>
                <div className="space-y-2.5">
                  {categories.map((cat) => {
                    const isSelected = selectedCatId === cat.id;
                    const isNewInst = cat.categoryCode === 'NEW_TECHNICAL_INSTITUTION';
                    return (
                      <div
                        key={cat.id}
                        onClick={() => setSelectedCatId(cat.id)}
                        className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-surface-subtle/60 ring-1 ring-primary/40'
                            : 'border-border bg-surface hover:bg-surface-muted/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-text-strong">
                                {cat.name}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface border border-border text-text-secondary">
                                {cat.applicableChapter}
                              </span>
                            </div>
                            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                              {cat.description}
                            </p>
                            <div className="mt-2 flex items-center gap-2 text-[11px]">
                              <span className="text-text-secondary font-mono">
                                Basis: {cat.regulatoryBasis}
                              </span>
                              <span>•</span>
                              <span className="text-primary font-medium">
                                {isNewInst ? 'Route: Scrutiny + EVC' : 'Route: Fast-Track (Nil Deficiency)'}
                              </span>
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected
                                ? 'border-primary bg-primary text-white'
                                : 'border-border bg-surface'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Draft Intake Notes / Specifications */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-text-strong uppercase tracking-wider">
                    Preparatory Intake Notes / Course Indications
                  </label>
                  <span className="text-[11px] text-text-secondary font-mono">
                    {draftNotes.length}/1000
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  placeholder="Record preliminary notes, target diploma/undergraduate programmes, or intake considerations..."
                  className="w-full text-sm rounded-md border border-border bg-surface px-3 py-2 text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary shadow-2xs"
                />
                <p className="mt-1 text-[11px] text-text-secondary">
                  Optional preparatory draft specifications. Statutory intake validation will be applied during formal submission.
                </p>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-md text-sm font-medium text-text-primary hover:bg-surface-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedInstId || !selectedCatId}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover shadow-xs disabled:opacity-50 transition-colors"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Application Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View & Edit Draft */}
      {activeDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-surface rounded-xl shadow-2xl max-w-xl w-full border border-border overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-muted/30">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-text-strong">Application Draft</h3>
                  <Badge variant="subtle" className="text-xs uppercase font-medium">
                    {activeDraft.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs text-primary font-semibold">
                    {activeDraft.internalReference}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyReference(activeDraft.internalReference)}
                    className="text-text-secondary hover:text-text-primary p-0.5 rounded transition-colors"
                    title="Copy Reference ID"
                  >
                    {copiedRef ? (
                      <Check className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                className="text-text-secondary hover:text-text-primary p-1.5 rounded-md hover:bg-surface-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 bg-danger-bg text-danger text-xs rounded-md border border-danger/25 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{editError}</span>
                </div>
              )}

              {editSuccess && (
                <div className="p-3 bg-success-bg text-success text-xs rounded-md border border-success/30 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-success" />
                  <span>Draft intake changes saved successfully.</span>
                </div>
              )}

              {/* Read-only Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-surface-muted/60 rounded-md border border-border/50">
                  <span className="text-text-secondary block text-[11px] uppercase tracking-wider font-semibold mb-0.5">
                    Institution
                  </span>
                  <span className="font-medium text-text-strong truncate block">
                    {activeDraft.institutionName || 'Apex Institute'}
                  </span>
                </div>
                <div className="p-3 bg-surface-muted/60 rounded-md border border-border/50">
                  <span className="text-text-secondary block text-[11px] uppercase tracking-wider font-semibold mb-0.5">
                    Category
                  </span>
                  <span className="font-medium text-text-strong block">
                    {activeDraft.categoryName}
                  </span>
                </div>
                <div className="p-3 bg-surface-muted/60 rounded-md border border-border/50">
                  <span className="text-text-secondary block text-[11px] uppercase tracking-wider font-semibold mb-0.5">
                    Academic Cycle
                  </span>
                  <span className="font-medium text-text-strong block font-mono">
                    {activeDraft.academicCycle}
                  </span>
                </div>
                <div className="p-3 bg-surface-muted/60 rounded-md border border-border/50">
                  <span className="text-text-secondary block text-[11px] uppercase tracking-wider font-semibold mb-0.5">
                    Institution Type Snapshot
                  </span>
                  <span className="font-medium text-text-strong block">
                    {activeDraft.institutionTypeSnapshot}
                  </span>
                </div>
              </div>

              {/* Editable Intake Notes */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-text-strong uppercase tracking-wider">
                    Draft Intake Specifications / Preparatory Notes
                  </label>
                  <span className="text-[11px] text-text-secondary font-mono">
                    {editNotes.length}/2000
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Record draft intake details, course indications, or preparer notes..."
                  className="w-full text-sm rounded-md border border-border bg-surface px-3 py-2 text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary shadow-2xs"
                />
              </div>

              {/* Safeguard & Boundary Note */}
              <div className="p-3 bg-surface-subtle border border-primary/20 rounded-md text-xs text-text-secondary space-y-1">
                <p className="font-semibold text-text-strong flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-primary" />
                  Immutable Submission Safeguard (FR-005)
                </p>
                <p>
                  Edits are permitted strictly while this application is in <code className="font-mono text-primary font-bold">DRAFT</code> status.
                  Official submission locks revisions to preserve audit snapshot integrity.
                </p>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div>
                  {isEditDirty && (
                    <span className="text-xs text-warning font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Unsaved changes
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleCloseEdit}
                    className="px-4 py-2 border border-border rounded-md text-sm font-medium text-text-primary hover:bg-surface-muted transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit || !isEditDirty}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover shadow-xs disabled:opacity-50 transition-colors"
                  >
                    {isSavingEdit && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discard Confirmation Dialog */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-navy/50 backdrop-blur-xs p-4">
          <div className="bg-surface rounded-xl shadow-2xl max-w-sm w-full border border-border p-5 space-y-3">
            <div className="flex items-center gap-2.5 text-warning">
              <ShieldAlert className="w-5 h-5" />
              <h4 className="font-bold text-text-strong text-sm">Discard Unsaved Changes?</h4>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              You have modified draft intake specifications that have not been saved. If you leave now, your changes will be discarded.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="px-3 py-1.5 border border-border rounded-md text-xs font-medium text-text-primary hover:bg-surface-muted"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="px-3 py-1.5 bg-danger text-white rounded-md text-xs font-medium hover:bg-danger/90 shadow-xs"
              >
                Discard &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
