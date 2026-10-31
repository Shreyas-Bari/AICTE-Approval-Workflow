import crypto from 'node:crypto';
import { getDatabaseClient } from '../database/index.js';
import { ApplicationCategoryService } from './applicationCategory.service.js';
import {
  ApplicationDraft,
  CreateApplicationDraftInput,
  UpdateApplicationDraftInput
} from '../types/application.types.js';

export type CreateApplicationResult =
  | { success: true; application: ApplicationDraft }
  | { success: false; error: 'FORBIDDEN' | 'BAD_REQUEST' | 'NOT_FOUND'; message: string };

export type GetApplicationResult =
  | { success: true; application: ApplicationDraft }
  | { success: false; error: 'NOT_FOUND'; message: string };

export type UpdateApplicationResult =
  | { success: true; application: ApplicationDraft }
  | { success: false; error: 'NOT_FOUND' | 'FORBIDDEN' | 'CONFLICT'; message: string };

/**
 * Application Draft In-Memory Repository.
 * Provides isolated storage for application drafts during Phase 5 Substage 3
 * without modifying database schema or connecting to Neon.
 */
export class ApplicationDraftStore {
  private static drafts = new Map<string, ApplicationDraft>();

  public static set(draft: ApplicationDraft): void {
    this.drafts.set(draft.id, { ...draft });
  }

  public static get(id: string): ApplicationDraft | null {
    const draft = this.drafts.get(id);
    return draft ? { ...draft } : null;
  }

  public static list(): ApplicationDraft[] {
    return Array.from(this.drafts.values()).map((d) => ({ ...d }));
  }

  public static clear(): void {
    this.drafts.clear();
  }
}

/**
 * Service managing application drafting and intake foundations (§8.5).
 */
export class ApplicationService {
  /**
   * Creates a new application draft for an institution.
   * Enforces:
   * 1. Tenant boundary: Caller must hold an active membership at the specified institution.
   * 2. Category validity: Category must be an approved, active entry in the versioned catalogue.
   * 3. Default lifecycle state: Strictly initialized to 'DRAFT'.
   */
  public static async createDraft(
    userId: string,
    input: CreateApplicationDraftInput
  ): Promise<CreateApplicationResult> {
    const prisma = getDatabaseClient();

    // 1. Verify caller holds active membership at target institution (tenant isolation)
    const membership = await prisma.institutionMembership.findFirst({
      where: {
        userId,
        institutionId: input.institutionId,
        status: 'ACTIVE'
      },
      include: {
        institution: true
      }
    });

    if (!membership || !membership.institution) {
      return {
        success: false,
        error: 'FORBIDDEN',
        message: 'Access to institution is forbidden or membership is inactive'
      };
    }

    if (membership.institution.status !== 'ACTIVE') {
      return {
        success: false,
        error: 'FORBIDDEN',
        message: 'Institution is inactive or suspended'
      };
    }

    // 2. Verify application category in the versioned catalogue
    const category = ApplicationCategoryService.getCategoryById(input.categoryId);
    if (!category || !category.isActive || category.reviewStatus !== 'APPROVED') {
      return {
        success: false,
        error: 'BAD_REQUEST',
        message: 'Application category not found or not active in the current catalogue release'
      };
    }

    const id = crypto.randomUUID();
    const academicCycle = input.academicCycle || category.academicCycle || '2024-2025';
    const referenceSuffix = crypto.randomUUID().slice(0, 8).toUpperCase();
    const internalReference = `APP-${academicCycle}-${referenceSuffix}`;
    const now = new Date().toISOString();

    const draft: ApplicationDraft = {
      id,
      internalReference,
      externalReference: null,
      institutionId: input.institutionId,
      institutionName: membership.institution.name,
      categoryId: category.id,
      categoryCode: category.categoryCode,
      categoryName: category.name,
      academicCycle,
      applicationPurpose: category.name,
      institutionTypeSnapshot: membership.institution.institutionType,
      status: 'DRAFT',
      intakePayload: input.intakePayload || {},
      submittedAt: null,
      submittedByUserId: null,
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now
    };

    ApplicationDraftStore.set(draft);

    return {
      success: true,
      application: draft
    };
  }

  /**
   * Lists applications scoped to institutions where the caller holds active membership.
   */
  public static async listApplicationsForUser(userId: string): Promise<ApplicationDraft[]> {
    const prisma = getDatabaseClient();

    const activeMemberships = await prisma.institutionMembership.findMany({
      where: {
        userId,
        status: 'ACTIVE'
      },
      select: {
        institutionId: true
      }
    });

    const allowedInstitutionIds = new Set(activeMemberships.map((m) => m.institutionId));

    const drafts = ApplicationDraftStore.list().filter((d) =>
      allowedInstitutionIds.has(d.institutionId)
    );

    return drafts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /**
   * Retrieves an application by ID with strict tenant boundary enforcement.
   */
  public static async getApplicationById(
    userId: string,
    applicationId: string
  ): Promise<GetApplicationResult> {
    const draft = ApplicationDraftStore.get(applicationId);
    if (!draft) {
      return {
        success: false,
        error: 'NOT_FOUND',
        message: 'Application not found'
      };
    }

    const prisma = getDatabaseClient();
    const membership = await prisma.institutionMembership.findFirst({
      where: {
        userId,
        institutionId: draft.institutionId,
        status: 'ACTIVE'
      }
    });

    if (!membership) {
      // Anti-enumeration: return 404 if caller has no active membership at this institution
      return {
        success: false,
        error: 'NOT_FOUND',
        message: 'Application not found'
      };
    }

    return {
      success: true,
      application: draft
    };
  }

  /**
   * Updates an application draft's intake data.
   * Enforces that only applications in 'DRAFT' status may be edited (FR-005).
   */
  public static async updateDraft(
    userId: string,
    applicationId: string,
    input: UpdateApplicationDraftInput
  ): Promise<UpdateApplicationResult> {
    const draft = ApplicationDraftStore.get(applicationId);
    if (!draft) {
      return {
        success: false,
        error: 'NOT_FOUND',
        message: 'Application not found'
      };
    }

    const prisma = getDatabaseClient();
    const membership = await prisma.institutionMembership.findFirst({
      where: {
        userId,
        institutionId: draft.institutionId,
        status: 'ACTIVE'
      }
    });

    if (!membership) {
      return {
        success: false,
        error: 'NOT_FOUND',
        message: 'Application not found'
      };
    }

    if (draft.status !== 'DRAFT') {
      return {
        success: false,
        error: 'CONFLICT',
        message: 'Only applications in DRAFT status can be modified'
      };
    }

    const updated: ApplicationDraft = {
      ...draft,
      intakePayload: {
        ...draft.intakePayload,
        ...(input.intakePayload || {})
      },
      updatedAt: new Date().toISOString()
    };

    ApplicationDraftStore.set(updated);

    return {
      success: true,
      application: updated
    };
  }
}
