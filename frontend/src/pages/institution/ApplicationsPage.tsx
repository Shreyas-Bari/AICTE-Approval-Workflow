import React, { useEffect, useState } from 'react';
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
  HelpCircle
} from 'lucide-react';
import { api, ApiError } from '../../services/api';
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
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [appsRes, catsRes, instsRes] = await Promise.all([
        api.getApplications(),
        api.getApplicationCategories(),
        api.getInstitutions()
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

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstId || !selectedCatId) {
      setCreateError('Please select an institution and an application category.');
      return;
    }

    setIsSubmitting(true);
    setCreateError(null);

    try {
      const res = await api.createApplicationDraft({
        institutionId: selectedInstId,
        categoryId: selectedCatId,
        intakePayload: draftNotes ? { draftNotes } : {}
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
    setEditNotes(
      typeof draft.intakePayload?.draftNotes === 'string'
        ? draft.intakePayload.draftNotes
        : ''
    );
    setEditError(null);
    setEditSuccess(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDraft) return;

    setIsSavingEdit(true);
    setEditError(null);
    setEditSuccess(false);

    try {
      const res = await api.updateApplicationDraft(activeDraft.id, {
        intakePayload: {
          ...activeDraft.intakePayload,
          draftNotes: editNotes
        }
      });

      setActiveDraft(res.data.application);
      setApplications((prev) =>
        prev.map((app) => (app.id === res.data.application.id ? res.data.application : app))
      );
      setEditSuccess(true);
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

  const selectedCategoryObj = categories.find((c) => c.id === selectedCatId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Primary Action */}
      <div className="sm:flex sm:items-center sm:justify-between pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-text-strong tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-primary" />
            Applications &amp; Intake Drafting
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Phase 5 Substage 3 Foundation · Select an approved category and draft intake records.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
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

      {/* Prototype Baseline Context Banner */}
      <div className="mt-6 p-4 rounded-lg bg-surface-subtle border border-primary/20 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-text-secondary space-y-1">
          <p className="font-semibold text-text-strong">
            Prototype Boundary Notice (Decision Q-04 Scope)
          </p>
          <p>
            This foundation demonstrates editable draft creation for the two approved categories:
            <strong> Setting up a New Technical Institution</strong> and <strong>Extension of Approval (EoA)</strong>.
            Drafts remain in <code className="text-primary font-mono bg-white px-1 py-0.5 rounded border border-border">DRAFT</code> status.
            Formal committee scrutiny and statutory approval workflows are deferred to subsequent substages.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center text-text-secondary gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Loading applications and catalogue data...</p>
        </div>
      ) : error ? (
        <div className="mt-6 p-4 rounded-lg bg-danger-bg border border-danger/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-danger">Failed to load data</h3>
            <p className="text-xs text-text-secondary mt-1">{error}</p>
            <button
              onClick={fetchData}
              className="mt-3 text-xs font-medium text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          {applications.length === 0 ? (
            <div className="text-center py-16 bg-surface rounded-xl border border-border">
              <FileText className="mx-auto h-12 w-12 text-text-secondary/40" />
              <h3 className="mt-3 text-base font-semibold text-text-strong">No application drafts yet</h3>
              <p className="mt-1 text-sm text-text-secondary max-w-sm mx-auto">
                {institutions.length === 0
                  ? 'No active institution memberships available to create application drafts.'
                  : 'Start a new draft to begin preparing an application for this academic cycle.'}
              </p>
              {institutions.length > 0 && (
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    Create First Draft
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-surface shadow-xs rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border text-left">
                  <thead className="bg-surface-muted/50 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    <tr>
                      <th scope="col" className="px-6 py-3.5">Application Reference</th>
                      <th scope="col" className="px-6 py-3.5">Category</th>
                      <th scope="col" className="px-6 py-3.5">Academic Cycle</th>
                      <th scope="col" className="px-6 py-3.5">Status</th>
                      <th scope="col" className="px-6 py-3.5">Created Date</th>
                      <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-surface-subtle/40 transition-colors">
                        <td className="px-6 py-4 font-mono font-medium text-text-strong">
                          {app.internalReference}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-text-strong">{app.categoryName}</div>
                          <div className="text-xs text-text-secondary font-mono">{app.categoryCode}</div>
                        </td>
                        <td className="px-6 py-4 text-text-secondary">
                          <span className="inline-flex items-center gap-1">
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
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-border text-text-primary bg-surface hover:bg-surface-muted transition-colors"
                          >
                            <Edit3 className="w-3 h-3 text-primary" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-xs p-4">
          <div className="bg-surface rounded-xl shadow-xl max-w-lg w-full border border-border overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-base font-bold text-text-strong">Start Application Draft</h3>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="text-text-secondary hover:text-text-primary p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDraft} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 bg-danger-bg text-danger text-xs rounded-md border border-danger/20 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}

              {/* Institution Selection */}
              <div>
                <label className="block text-xs font-semibold text-text-strong uppercase tracking-wider mb-1">
                  Target Institution
                </label>
                <select
                  value={selectedInstId}
                  onChange={(e) => setSelectedInstId(e.target.value)}
                  className="w-full text-sm rounded-md border border-border bg-surface px-3 py-2 text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary"
                  required
                >
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.institutionType})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-text-secondary flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  Restricted to institutions where your user account holds active membership.
                </p>
              </div>

              {/* Application Category Selection */}
              <div>
                <label className="block text-xs font-semibold text-text-strong uppercase tracking-wider mb-1">
                  Application Category (Q-04 Prototype Scope)
                </label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full text-sm rounded-md border border-border bg-surface px-3 py-2 text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.applicableChapter})
                    </option>
                  ))}
                </select>
                {selectedCategoryObj && (
                  <div className="mt-2 p-2.5 bg-surface-muted rounded-md text-xs text-text-secondary space-y-1">
                    <p className="font-medium text-text-strong">{selectedCategoryObj.name}</p>
                    <p>{selectedCategoryObj.description}</p>
                    <p className="text-[11px] font-mono text-primary">
                      Basis: {selectedCategoryObj.regulatoryBasis}
                    </p>
                  </div>
                )}
              </div>

              {/* Draft Intake Notes */}
              <div>
                <label className="block text-xs font-semibold text-text-strong uppercase tracking-wider mb-1">
                  Draft Intake Notes / Proposed Programmes
                </label>
                <textarea
                  rows={3}
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  placeholder="Optional preparatory intake notes or proposed programme details..."
                  className="w-full text-sm rounded-md border border-border bg-surface px-3 py-2 text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-md text-sm font-medium text-text-primary hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover shadow-xs disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Application Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View & Edit Draft */}
      {activeDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-xs p-4">
          <div className="bg-surface rounded-xl shadow-xl max-w-lg w-full border border-border overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-text-strong">Application Draft Details</h3>
                <span className="font-mono text-xs text-primary">{activeDraft.internalReference}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveDraft(null)}
                className="text-text-secondary hover:text-text-primary p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 bg-danger-bg text-danger text-xs rounded-md border border-danger/20 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{editError}</span>
                </div>
              )}

              {editSuccess && (
                <div className="p-3 bg-success-bg text-success text-xs rounded-md border border-success/20 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Draft intake changes saved successfully.</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-surface-muted rounded-md">
                  <span className="text-text-secondary block">Category</span>
                  <span className="font-semibold text-text-strong">{activeDraft.categoryName}</span>
                </div>
                <div className="p-2.5 bg-surface-muted rounded-md">
                  <span className="text-text-secondary block">Academic Cycle</span>
                  <span className="font-semibold text-text-strong">{activeDraft.academicCycle}</span>
                </div>
                <div className="p-2.5 bg-surface-muted rounded-md">
                  <span className="text-text-secondary block">Status</span>
                  <Badge variant="subtle" className="text-xs mt-0.5">
                    {activeDraft.status}
                  </Badge>
                </div>
                <div className="p-2.5 bg-surface-muted rounded-md">
                  <span className="text-text-secondary block">Institution Type</span>
                  <span className="font-semibold text-text-strong">{activeDraft.institutionTypeSnapshot}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-strong uppercase tracking-wider mb-1">
                  Draft Intake Notes / Specifications
                </label>
                <textarea
                  rows={4}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Record draft intake details, course indications, or preparer notes..."
                  className="w-full text-sm rounded-md border border-border bg-surface px-3 py-2 text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="p-3 bg-surface-subtle border border-primary/20 rounded-md text-xs text-text-secondary">
                <p className="font-semibold text-text-strong">Immutable Submission Safeguard (FR-005)</p>
                <p>
                  Edits are permitted strictly while this application is in <code className="font-mono text-primary font-bold">DRAFT</code> status.
                  Official submission locks revisions to preserve audit snapshot integrity.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setActiveDraft(null)}
                  className="px-4 py-2 border border-border rounded-md text-sm font-medium text-text-primary hover:bg-surface-muted"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover shadow-xs disabled:opacity-50"
                >
                  {isSavingEdit && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Draft Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
