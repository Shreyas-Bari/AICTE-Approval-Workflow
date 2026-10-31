/**
 * Application domain and drafting types matching backend schemas (§8.5).
 */

export type ApplicationTechnicalStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_PROCESS'
  | 'ON_HOLD'
  | 'WITHDRAWN'
  | 'CLOSED'
  | 'ARCHIVED';

export interface ApplicationCategorySummary {
  id: string;
  categoryCode: string;
  name: string;
  description: string;
  academicCycle: string;
  applicableChapter: string;
  regulatoryBasis: string;
  defaultWorkflowRoute: 'SCRUTINY_AND_EVC' | 'SELF_DISCLOSURE_FAST_TRACK';
  requiresScrutiny: boolean;
  requiresEVC: boolean;
  isActive: boolean;
  reviewStatus: 'APPROVED' | 'DRAFT' | 'RETIRED';
}

export interface ApplicationDraft {
  id: string;
  internalReference: string;
  externalReference: string | null;
  institutionId: string;
  institutionName: string;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  academicCycle: string;
  applicationPurpose: string;
  institutionTypeSnapshot: string;
  status: ApplicationTechnicalStatus;
  intakePayload: Record<string, unknown>;
  submittedAt: string | null;
  submittedByUserId: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationDraftPayload {
  institutionId: string;
  categoryId: string;
  academicCycle?: string;
  intakePayload?: Record<string, unknown>;
}

export interface UpdateApplicationDraftPayload {
  intakePayload?: Record<string, unknown>;
}
