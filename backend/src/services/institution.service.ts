import { getDatabaseClient } from '../database/index.js';
import { InstitutionStatus, MembershipStatus } from '@prisma/client';

export interface InstitutionMembershipSummary {
  id: string;
  membershipRole: string;
  status: MembershipStatus;
  validFrom: string;
  validUntil: string | null;
}

export interface FormattedInstitution {
  id: string;
  internalCode: string | null;
  name: string;
  institutionType: string;
  status: InstitutionStatus;
  address: unknown;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: string;
  updatedAt: string;
  memberships: InstitutionMembershipSummary[];
}

export type GetInstitutionByIdResult =
  | { success: true; institution: FormattedInstitution }
  | { success: false; error: 'FORBIDDEN' | 'NOT_FOUND'; message: string };

/**
 * Retrieves all institutions where the caller holds an active membership.
 * Enforces tenant data isolation by filtering exclusively on caller's active memberships.
 * Groups multiple roles for the same institution under a single institution record.
 */
export async function getInstitutionsForUser(userId: string): Promise<FormattedInstitution[]> {
  const prisma = getDatabaseClient();

  const memberships = await prisma.institutionMembership.findMany({
    where: {
      userId,
      status: 'ACTIVE'
    },
    include: {
      institution: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  // Group memberships by institution to produce clean, unique institution records
  const institutionMap = new Map<string, FormattedInstitution>();

  for (const m of memberships) {
    const inst = m.institution;
    if (!inst) continue;

    const membershipSummary: InstitutionMembershipSummary = {
      id: m.id,
      membershipRole: m.membershipRole,
      status: m.status,
      validFrom: m.validFrom.toISOString(),
      validUntil: m.validUntil ? m.validUntil.toISOString() : null
    };

    const existing = institutionMap.get(inst.id);
    if (existing) {
      existing.memberships.push(membershipSummary);
    } else {
      institutionMap.set(inst.id, {
        id: inst.id,
        internalCode: inst.internalCode,
        name: inst.name,
        institutionType: inst.institutionType,
        status: inst.status,
        address: inst.address,
        contactEmail: inst.contactEmail,
        contactPhone: inst.contactPhone,
        createdAt: inst.createdAt.toISOString(),
        updatedAt: inst.updatedAt.toISOString(),
        memberships: [membershipSummary]
      });
    }
  }

  return Array.from(institutionMap.values());
}

/**
 * Retrieves details of a specific institution for the caller.
 *
 * Tenant Isolation & Security Boundary:
 * 1. Verifies that the caller holds an active membership with this institution.
 *    If no active membership exists, returns FORBIDDEN.
 *    A client-supplied institutionId is never trusted without membership proof.
 * 2. If membership is verified, queries the institution record.
 *    If the institution record does not exist, returns NOT_FOUND.
 */
export async function getInstitutionByIdForUser(
  institutionId: string,
  userId: string
): Promise<GetInstitutionByIdResult> {
  const prisma = getDatabaseClient();

  // 1. Verify caller has active membership with this institution
  const memberships = await prisma.institutionMembership.findMany({
    where: {
      userId,
      institutionId,
      status: 'ACTIVE'
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  if (!memberships || memberships.length === 0) {
    return {
      success: false,
      error: 'FORBIDDEN',
      message: 'Access denied: caller does not have an active membership with this institution'
    };
  }

  // 2. Fetch permitted institution details
  const institution = await prisma.institution.findUnique({
    where: { id: institutionId }
  });

  if (!institution) {
    return {
      success: false,
      error: 'NOT_FOUND',
      message: 'Institution not found'
    };
  }

  const membershipSummaries: InstitutionMembershipSummary[] = memberships.map((m) => ({
    id: m.id,
    membershipRole: m.membershipRole,
    status: m.status,
    validFrom: m.validFrom.toISOString(),
    validUntil: m.validUntil ? m.validUntil.toISOString() : null
  }));

  return {
    success: true,
    institution: {
      id: institution.id,
      internalCode: institution.internalCode,
      name: institution.name,
      institutionType: institution.institutionType,
      status: institution.status,
      address: institution.address,
      contactEmail: institution.contactEmail,
      contactPhone: institution.contactPhone,
      createdAt: institution.createdAt.toISOString(),
      updatedAt: institution.updatedAt.toISOString(),
      memberships: membershipSummaries
    }
  };
}
