import React, { useEffect, useState, useCallback } from 'react';
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Info
} from 'lucide-react';
import { apiClient } from '../../services/api';
import { InstitutionProfile, InstitutionStatus } from '../../types';
import { Badge } from '../../components/ui/badge';

function formatTimestamp(isoString: string): string {
  try {
    return new Date(isoString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  } catch {
    return isoString;
  }
}

function getStatusBadgeVariant(
  status: InstitutionStatus
): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'subtle' {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'SUSPENDED':
      return 'danger';
    case 'INACTIVE':
      return 'subtle';
    default:
      return 'default';
  }
}

export const InstitutionProfilePage: React.FC = () => {
  const [institutions, setInstitutions] = useState<InstitutionProfile[]>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchInstitutions = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await apiClient.getInstitutions();
      const list = response.data.institutions;
      setInstitutions(list);
      if (list.length > 0) {
        setSelectedInstitutionId((prev) => prev && list.some((i) => i.id === prev) ? prev : list[0].id);
      } else {
        setSelectedInstitutionId(null);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to retrieve institution profile';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstitutions();
  }, [fetchInstitutions]);

  const activeInstitution = institutions.find((inst) => inst.id === selectedInstitutionId);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Statutory Independent Prototype Notice Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-900 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-950">
            Independent Prototype Notice &bull; AICTE Approval Workflow Automation (SIH26262)
          </span>
          <p className="mt-1 leading-relaxed text-amber-800">
            This institution profile view reflects canonical tenant records defined under the AICTE
            Approval Process Handbook (APH 2024–2027) data model. System records are read-only in this
            increment to maintain tenant isolation and prevent unverified modifications.
          </p>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-text-strong tracking-tight flex items-center gap-2">
            <Building2 className="w-7 h-7 text-primary" />
            Institution Profile Management
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Authoritative institutional record, legal entity classification, and verified tenancy scope.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchInstitutions}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-text-primary bg-surface border border-border rounded-md hover:bg-surface-muted transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-surface border border-border rounded-lg p-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm font-medium text-text-secondary">
            Querying permitted institution records...
          </span>
        </div>
      )}

      {/* Error State */}
      {!isLoading && errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="font-semibold text-red-900">Failed to load institution profile</h2>
            <p className="mt-1">{errorMessage}</p>
            <button
              type="button"
              onClick={fetchInstitutions}
              className="mt-3 px-3 py-1 bg-red-100 text-red-900 rounded text-xs font-semibold hover:bg-red-200 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Empty State: Authenticated user with no active memberships */}
      {!isLoading && !errorMessage && institutions.length === 0 && (
        <div className="bg-surface border border-border rounded-lg p-8 text-center max-w-xl mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center mx-auto text-text-secondary">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-text-strong">
            No Active Institution Association
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Your user account is successfully authenticated, but is not currently linked to an active
            institution membership. Under institutional data isolation policy, access to institutional records
            requires an active assignment verified by an authorized AICTE official.
          </p>
        </div>
      )}

      {/* Active Profile View */}
      {!isLoading && !errorMessage && activeInstitution && (
        <div className="space-y-6">
          {/* Multiple Institutions Selector (if user has memberships in more than one) */}
          {institutions.length > 1 && (
            <div className="bg-surface border border-border rounded-lg p-4 flex items-center gap-4">
              <label htmlFor="inst-select" className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Select Institution:
              </label>
              <select
                id="inst-select"
                value={activeInstitution.id}
                onChange={(e) => setSelectedInstitutionId(e.target.value)}
                className="bg-surface border border-border rounded px-3 py-1.5 text-sm text-text-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.internalCode || 'Pending Code'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Profile Header Card */}
          <div className="bg-surface border border-border rounded-lg p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-text-strong">
                    {activeInstitution.name}
                  </h2>
                  <Badge variant={getStatusBadgeVariant(activeInstitution.status)}>
                    {activeInstitution.status}
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
                  <span>
                    <span className="font-semibold text-text-primary">Permanent AICTE Code:</span>{' '}
                    {activeInstitution.internalCode || 'Not Assigned / Pending'}
                  </span>
                  <span>&bull;</span>
                  <span>
                    <span className="font-semibold text-text-primary">Classification:</span>{' '}
                    {activeInstitution.institutionType}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-green-50 border border-green-200 text-xs font-medium text-green-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  Verified Tenant Record
                </span>
              </div>
            </div>
          </div>

          {/* Profile Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Registered Address */}
            <div className="bg-surface border border-border rounded-lg p-6 space-y-4 shadow-xs">
              <h3 className="text-sm font-semibold text-text-strong uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
                <MapPin className="w-4 h-4 text-primary" />
                Registered Campus Address
              </h3>
              {activeInstitution.address ? (
                <div className="space-y-2 text-sm text-text-primary">
                  {activeInstitution.address.line1 && (
                    <p className="font-medium">{activeInstitution.address.line1}</p>
                  )}
                  {activeInstitution.address.line2 && (
                    <p className="text-text-secondary">{activeInstitution.address.line2}</p>
                  )}
                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-text-secondary">
                    {activeInstitution.address.city && (
                      <div>
                        <span className="font-semibold text-text-primary">City:</span>{' '}
                        {activeInstitution.address.city}
                      </div>
                    )}
                    {activeInstitution.address.district && (
                      <div>
                        <span className="font-semibold text-text-primary">District:</span>{' '}
                        {activeInstitution.address.district}
                      </div>
                    )}
                    {activeInstitution.address.state && (
                      <div>
                        <span className="font-semibold text-text-primary">State:</span>{' '}
                        {activeInstitution.address.state}
                      </div>
                    )}
                    {activeInstitution.address.pincode && (
                      <div>
                        <span className="font-semibold text-text-primary">PIN Code:</span>{' '}
                        {activeInstitution.address.pincode}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-secondary italic">
                  Address details not yet recorded for this institution.
                </p>
              )}
            </div>

            {/* Official Contact Details */}
            <div className="bg-surface border border-border rounded-lg p-6 space-y-4 shadow-xs">
              <h3 className="text-sm font-semibold text-text-strong uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
                <Mail className="w-4 h-4 text-primary" />
                Official Communication
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-text-secondary block">Primary Contact Email</span>
                    <span className="font-medium text-text-primary">
                      {activeInstitution.contactEmail || 'Not Specified'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-text-secondary block">Primary Contact Phone</span>
                    <span className="font-medium text-text-primary">
                      {activeInstitution.contactPhone || 'Not Specified'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tenancy & Active Memberships */}
            <div className="bg-surface border border-border rounded-lg p-6 space-y-4 shadow-xs">
              <h3 className="text-sm font-semibold text-text-strong uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Caller Membership &amp; Tenancy Scope
              </h3>
              {activeInstitution.memberships && activeInstitution.memberships.length > 0 ? (
                <div className="space-y-3">
                  {activeInstitution.memberships.map((membership) => (
                    <div
                      key={membership.id}
                      className="p-3 rounded-md bg-surface-subtle border border-border/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-text-strong block text-sm">
                          {membership.membershipRole}
                        </span>
                        <span className="text-text-secondary mt-0.5 block">
                          Valid from: {formatTimestamp(membership.validFrom)}
                          {membership.validUntil ? ` to ${formatTimestamp(membership.validUntil)}` : ' (Ongoing)'}
                        </span>
                      </div>
                      <Badge variant="default" className="text-[10px]">
                        {membership.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-secondary italic">
                  No active membership records returned.
                </p>
              )}
            </div>

            {/* Audit & Record Timestamps */}
            <div className="bg-surface border border-border rounded-lg p-6 space-y-4 shadow-xs">
              <h3 className="text-sm font-semibold text-text-strong uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
                <Calendar className="w-4 h-4 text-primary" />
                Record Audit &amp; Metadata
              </h3>
              <div className="space-y-3 text-xs text-text-secondary">
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="font-medium text-text-primary">System Institution ID:</span>
                  <span className="font-mono text-text-secondary">{activeInstitution.id}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="font-medium text-text-primary">Record Initialized:</span>
                  <span>{formatTimestamp(activeInstitution.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="font-medium text-text-primary">Last Profile Update:</span>
                  <span>{formatTimestamp(activeInstitution.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Context Notice on Mutations */}
          <div className="bg-surface-subtle border border-border rounded-lg p-4 text-xs text-text-secondary flex items-start gap-2.5">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Profile update workflows (`PATCH /api/v1/institutions/:id`) and institution onboarding (`POST /api/v1/institutions`)
              are conditional contract operations reserved for subsequent phases following RBAC authorization resolution (Decision Q-09).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
