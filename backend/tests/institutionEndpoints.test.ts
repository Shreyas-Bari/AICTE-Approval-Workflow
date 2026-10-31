import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import * as databaseModule from '../src/database/index.js';
import { createAccessToken } from '../src/utils/token.js';
import { InstitutionStatus, MembershipStatus, UserStatus } from '@prisma/client';

describe('Institution Profile Foundation Endpoints (Phase 5 — Substage 1)', () => {
  const mockUserFindUnique = vi.fn();
  const mockMembershipFindMany = vi.fn();
  const mockInstitutionFindUnique = vi.fn();

  const testUserId = '11111111-1111-1111-1111-111111111111';
  const otherUserId = '22222222-2222-2222-2222-222222222222';

  const testInstitutionId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const otherInstitutionId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  let validAccessToken: string;

  beforeEach(async () => {
    vi.restoreAllMocks();
    mockUserFindUnique.mockReset();
    mockMembershipFindMany.mockReset();
    mockInstitutionFindUnique.mockReset();

    // Isolated database mock: no external connection to Neon
    vi.spyOn(databaseModule, 'getDatabaseClient').mockReturnValue({
      user: {
        findUnique: mockUserFindUnique
      },
      institutionMembership: {
        findMany: mockMembershipFindMany
      },
      institution: {
        findUnique: mockInstitutionFindUnique
      }
    } as unknown as ReturnType<typeof databaseModule.getDatabaseClient>);

    // Default: Authenticated user is active in Neon PostgreSQL
    mockUserFindUnique.mockResolvedValue({
      id: testUserId,
      status: UserStatus.ACTIVE,
      email: 'principal@engineering.edu.in',
      displayName: 'Dr. Jane Principal'
    });

    if (!validAccessToken) {
      validAccessToken = await createAccessToken(testUserId, {
        email: 'principal@engineering.edu.in'
      });
    }
  });

  // ---------------------------------------------------------------------------
  // 1. Authentication & Session Verification Gates
  // ---------------------------------------------------------------------------
  describe('Authentication & Gate Enforcement', () => {
    it('should reject GET /api/v1/institutions with 401 when no session cookie is present', async () => {
      const res = await request(app).get('/api/v1/institutions');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        error: {
          code: 'UNAUTHORIZED',
          message: expect.stringContaining('Authentication required')
        }
      });
    });

    it('should reject GET /api/v1/institutions/:institutionId with 401 when unauthenticated', async () => {
      const res = await request(app).get(`/api/v1/institutions/${testInstitutionId}`);

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        error: {
          code: 'UNAUTHORIZED',
          message: expect.stringContaining('Authentication required')
        }
      });
    });

    it('should reject access with 403 ACCOUNT_SUSPENDED when user account is suspended', async () => {
      mockUserFindUnique.mockResolvedValue({
        id: testUserId,
        status: UserStatus.SUSPENDED,
        email: 'principal@engineering.edu.in',
        displayName: 'Dr. Jane Principal'
      });

      const res = await request(app)
        .get('/api/v1/institutions')
        .set('Cookie', [`access_token=${validAccessToken}`]);

      expect(res.status).toBe(403);
      expect(res.body).toEqual({
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: expect.stringContaining('suspended or inactive')
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Route Parameter Validation
  // ---------------------------------------------------------------------------
  describe('Route Parameter Validation', () => {
    it('should reject GET /api/v1/institutions/:institutionId with 400 when institutionId is not a valid UUID', async () => {
      const res = await request(app)
        .get('/api/v1/institutions/not-a-valid-uuid')
        .set('Cookie', [`access_token=${validAccessToken}`]);

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'institutionId',
            code: 'INVALID_STRING',
            message: 'Invalid institution ID format; must be a valid UUID'
          })
        ])
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 3. GET /api/v1/institutions (List Permitted Scope)
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/institutions (List caller institutions)', () => {
    it('should return empty list when authenticated user has no active memberships', async () => {
      mockMembershipFindMany.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/v1/institutions')
        .set('Cookie', [`access_token=${validAccessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        data: {
          institutions: []
        }
      });
      expect(mockMembershipFindMany).toHaveBeenCalledWith({
        where: {
          userId: testUserId,
          status: 'ACTIVE'
        },
        include: {
          institution: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });
    });

    it('should return institutions where caller has active memberships and group multiple roles', async () => {
      const mockInstitution = {
        id: testInstitutionId,
        internalCode: 'AICTE-ENG-2026-001',
        name: 'National Institute of Technology and Science',
        institutionType: 'ENGINEERING_COLLEGE',
        status: InstitutionStatus.ACTIVE,
        address: {
          line1: '123 Tech Campus Way',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001'
        },
        contactEmail: 'contact@nits.edu.in',
        contactPhone: '+91-80-23456789',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-15T00:00:00.000Z')
      };

      mockMembershipFindMany.mockResolvedValue([
        {
          id: 'mem-1',
          userId: testUserId,
          institutionId: testInstitutionId,
          membershipRole: 'PRINCIPAL',
          status: MembershipStatus.ACTIVE,
          validFrom: new Date('2026-01-01T00:00:00.000Z'),
          validUntil: null,
          institution: mockInstitution
        },
        {
          id: 'mem-2',
          userId: testUserId,
          institutionId: testInstitutionId,
          membershipRole: 'AUTHORIZED_SIGNATORY',
          status: MembershipStatus.ACTIVE,
          validFrom: new Date('2026-02-01T00:00:00.000Z'),
          validUntil: null,
          institution: mockInstitution
        }
      ]);

      const res = await request(app)
        .get('/api/v1/institutions')
        .set('Cookie', [`access_token=${validAccessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.institutions).toHaveLength(1);

      const inst = res.body.data.institutions[0];
      expect(inst.id).toBe(testInstitutionId);
      expect(inst.internalCode).toBe('AICTE-ENG-2026-001');
      expect(inst.name).toBe('National Institute of Technology and Science');
      expect(inst.institutionType).toBe('ENGINEERING_COLLEGE');
      expect(inst.status).toBe('ACTIVE');
      expect(inst.contactEmail).toBe('contact@nits.edu.in');
      expect(inst.contactPhone).toBe('+91-80-23456789');
      expect(inst.address).toEqual({
        line1: '123 Tech Campus Way',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001'
      });
      // Verifies both roles grouped under same institution
      expect(inst.memberships).toHaveLength(2);
      expect(inst.memberships[0].membershipRole).toBe('PRINCIPAL');
      expect(inst.memberships[1].membershipRole).toBe('AUTHORIZED_SIGNATORY');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. GET /api/v1/institutions/:institutionId (Tenant Data Isolation)
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/institutions/:institutionId (Tenant boundary & isolation)', () => {
    it('should reject with 403 FORBIDDEN when caller has no active membership with target institution', async () => {
      // Caller has no active membership for testInstitutionId
      mockMembershipFindMany.mockResolvedValue([]);

      const res = await request(app)
        .get(`/api/v1/institutions/${testInstitutionId}`)
        .set('Cookie', [`access_token=${validAccessToken}`]);

      expect(res.status).toBe(403);
      expect(res.body).toEqual({
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied: caller does not have an active membership with this institution'
        }
      });
      // Crucial: Never queries institution table if membership check fails
      expect(mockInstitutionFindUnique).not.toHaveBeenCalled();
    });

    it('should return 404 NOT_FOUND when membership is active but institution record does not exist', async () => {
      mockMembershipFindMany.mockResolvedValue([
        {
          id: 'mem-1',
          userId: testUserId,
          institutionId: testInstitutionId,
          membershipRole: 'PRINCIPAL',
          status: MembershipStatus.ACTIVE,
          validFrom: new Date('2026-01-01T00:00:00.000Z'),
          validUntil: null
        }
      ]);
      mockInstitutionFindUnique.mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/v1/institutions/${testInstitutionId}`)
        .set('Cookie', [`access_token=${validAccessToken}`]);

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        error: {
          code: 'NOT_FOUND',
          message: 'Institution not found'
        }
      });
    });

    it('should return 200 with permitted institution details when caller has active membership', async () => {
      mockMembershipFindMany.mockResolvedValue([
        {
          id: 'mem-1',
          userId: testUserId,
          institutionId: testInstitutionId,
          membershipRole: 'PRINCIPAL',
          status: MembershipStatus.ACTIVE,
          validFrom: new Date('2026-01-01T00:00:00.000Z'),
          validUntil: null
        }
      ]);

      mockInstitutionFindUnique.mockResolvedValue({
        id: testInstitutionId,
        internalCode: 'AICTE-ENG-2026-001',
        name: 'National Institute of Technology and Science',
        institutionType: 'ENGINEERING_COLLEGE',
        status: InstitutionStatus.ACTIVE,
        address: {
          line1: '123 Tech Campus Way',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001'
        },
        contactEmail: 'contact@nits.edu.in',
        contactPhone: '+91-80-23456789',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-15T00:00:00.000Z')
      });

      const res = await request(app)
        .get(`/api/v1/institutions/${testInstitutionId}`)
        .set('Cookie', [`access_token=${validAccessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.institution).toBeDefined();

      const inst = res.body.data.institution;
      expect(inst.id).toBe(testInstitutionId);
      expect(inst.internalCode).toBe('AICTE-ENG-2026-001');
      expect(inst.name).toBe('National Institute of Technology and Science');
      expect(inst.institutionType).toBe('ENGINEERING_COLLEGE');
      expect(inst.status).toBe('ACTIVE');
      expect(inst.contactEmail).toBe('contact@nits.edu.in');
      expect(inst.contactPhone).toBe('+91-80-23456789');
      expect(inst.memberships).toHaveLength(1);
      expect(inst.memberships[0].membershipRole).toBe('PRINCIPAL');
    });

    it('should enforce tenant isolation: caller cannot access another institution even by guessing ID', async () => {
      // Mock returns empty when querying testUserId with otherInstitutionId
      mockMembershipFindMany.mockImplementation((args: { where: { userId: string; institutionId: string } }) => {
        if (args.where.userId === testUserId && args.where.institutionId === otherInstitutionId) {
          return Promise.resolve([]);
        }
        return Promise.resolve([]);
      });

      const res = await request(app)
        .get(`/api/v1/institutions/${otherInstitutionId}`)
        .set('Cookie', [`access_token=${validAccessToken}`]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(mockInstitutionFindUnique).not.toHaveBeenCalled();
    });
  });
});
