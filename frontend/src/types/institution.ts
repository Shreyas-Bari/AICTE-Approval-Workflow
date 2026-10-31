/**
 * Institution status enum matching backend Prisma InstitutionStatus.
 */
export type InstitutionStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

/**
 * Structured address object stored in JsonB.
 */
export interface InstitutionAddress {
  line1?: string;
  line2?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  country?: string;
  [key: string]: unknown;
}

/**
 * Institution membership summary returned within institution profiles.
 */
export interface InstitutionMembershipSummary {
  id: string;
  membershipRole: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'ENDED';
  validFrom: string;
  validUntil: string | null;
}

/**
 * Canonical institution profile entity (§8.4).
 * Strictly mirrors approved backend Prisma model and database schema revision 2.
 */
export interface InstitutionProfile {
  id: string;
  internalCode: string | null;
  name: string;
  institutionType: string;
  status: InstitutionStatus;
  address: InstitutionAddress | null;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: string;
  updatedAt: string;
  memberships?: InstitutionMembershipSummary[];
}
