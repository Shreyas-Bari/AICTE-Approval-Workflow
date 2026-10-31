/**
 * Application domain types matching canonical database schema revision 2 (§4.7)
 * and API specifications (§8.5).
 */

export type ApplicationTechnicalStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_PROCESS'
  | 'ON_HOLD'
  | 'WITHDRAWN'
  | 'CLOSED'
  | 'ARCHIVED';

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

export interface CreateApplicationDraftInput {
  institutionId: string;
  categoryId: string;
  academicCycle?: string;
  intakePayload?: Record<string, unknown>;
}

export interface UpdateApplicationDraftInput {
  intakePayload?: Record<string, unknown>;
}
