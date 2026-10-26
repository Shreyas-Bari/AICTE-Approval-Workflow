/**
 * User account status enum matching backend Prisma UserStatus.
 */
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

/**
 * Membership status enum matching backend Prisma MembershipStatus.
 */
export type MembershipStatus = 'ACTIVE' | 'SUSPENDED' | 'ENDED';

/**
 * Basic user identity summary returned upon successful login.
 */
export interface UserSummary {
  id: string;
  displayName: string;
  email: string | null;
  status: UserStatus;
}

/**
 * Assigned role definition returned by GET /api/v1/me.
 */
export interface UserRoleRecord {
  id: string;
  key: string;
  name: string;
  description: string | null;
}

/**
 * Institution tenant membership returned by GET /api/v1/me.
 */
export interface InstitutionMembershipRecord {
  id: string;
  institutionId: string;
  membershipRole: string;
  status: MembershipStatus;
}

/**
 * Full safe user profile returned by GET /api/v1/me.
 * Strictly excludes password hashes, tokens, and internal security metadata.
 */
export interface AuthenticatedUserProfile extends UserSummary {
  phone: string | null;
  createdAt: string;
  roles: UserRoleRecord[];
  memberships: InstitutionMembershipRecord[];
}

/**
 * Field-level validation detail from backend error envelope (§6.2).
 */
export interface ApiErrorDetail {
  field?: string;
  code?: string;
  message: string;
}

/**
 * Backend standardized error response envelope (§6.2).
 */
export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
    requestId?: string;
  };
}

/**
 * Generic successful API response envelope (§6.1).
 */
export interface ApiResponse<T> {
  data: T;
  meta?: {
    requestId?: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export type LoginResponse = ApiResponse<{ user: UserSummary }>;
export type MeResponse = ApiResponse<{ user: AuthenticatedUserProfile }>;
export type MessageResponse = ApiResponse<{ message: string }>;

