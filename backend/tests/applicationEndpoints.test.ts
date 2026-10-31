import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import * as databaseModule from '../src/database/index.js';
import { createAccessToken } from '../src/utils/token.js';
import { generateCsrfToken } from '../src/middleware/csrf.middleware.js';
import { env } from '../src/config/env.js';
import { UserStatus, InstitutionStatus } from '@prisma/client';
import { APPLICATION_CATEGORIES_CATALOGUE } from '../src/config/applicationCategories.config.js';
import { ApplicationDraftStore } from '../src/services/application.service.js';

describe('Application Drafting & Intake Foundation Endpoints (Phase 5 — Substage 3)', () => {
  const mockUserFindUnique = vi.fn();
  const mockMembershipFindFirst = vi.fn();
  const mockMembershipFindMany = vi.fn();

  const testUserId = '11111111-1111-1111-1111-111111111111';
  const authorizedInstitutionId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const unauthorizedInstitutionId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  const newInstCategory = APPLICATION_CATEGORIES_CATALOGUE.find(
    (c) => c.categoryCode === 'NEW_TECHNICAL_INSTITUTION'
  )!;
  const eoaCategory = APPLICATION_CATEGORIES_CATALOGUE.find(
    (c) => c.categoryCode === 'EXTENSION_OF_APPROVAL_EOA'
  )!;

  let validAccessToken: string;

  // Helper to construct authorized request with CSRF and access token
  function authMutationRequest(req: request.Test, token: string = validAccessToken) {
    const csrf = generateCsrfToken();
    return req
      .set('Origin', env.CLIENT_URL)
      .set('x-xsrf-token', csrf)
      .set('Cookie', [`XSRF-TOKEN=${csrf}`, `access_token=${token}`]);
  }

  beforeEach(async () => {
    vi.restoreAllMocks();
    mockUserFindUnique.mockReset();
    mockMembershipFindFirst.mockReset();
    mockMembershipFindMany.mockReset();
    ApplicationDraftStore.clear();

    // Isolated database mock: zero external connection to Neon
    vi.spyOn(databaseModule, 'getDatabaseClient').mockReturnValue({
      user: {
        findUnique: mockUserFindUnique
      },
      institutionMembership: {
        findFirst: mockMembershipFindFirst,
        findMany: mockMembershipFindMany
      }
    } as unknown as ReturnType<typeof databaseModule.getDatabaseClient>);

    // Default: Authenticated user is active
    mockUserFindUnique.mockResolvedValue({
      id: testUserId,
      status: UserStatus.ACTIVE,
      email: 'registrar@institution.edu.in',
      displayName: 'Registrar Officer'
    });

    // Default: User has active membership in authorizedInstitutionId
    mockMembershipFindFirst.mockImplementation(({ where }: { where: { institutionId: string; status: string } }) => {
      if (where.institutionId === authorizedInstitutionId && where.status === 'ACTIVE') {
        return Promise.resolve({
          id: 'mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm',
          userId: testUserId,
          institutionId: authorizedInstitutionId,
          membershipRole: 'REGISTRAR',
          status: 'ACTIVE',
          institution: {
            id: authorizedInstitutionId,
            internalCode: 'INST-AUTH-01',
            name: 'Apex Institute of Technology',
            institutionType: 'ENGINEERING_AND_TECHNOLOGY',
            status: InstitutionStatus.ACTIVE
          }
        });
      }
      return Promise.resolve(null);
    });

    mockMembershipFindMany.mockResolvedValue([
      {
        institutionId: authorizedInstitutionId
      }
    ]);

    if (!validAccessToken) {
      validAccessToken = await createAccessToken(testUserId, {
        email: 'registrar@institution.edu.in'
      });
    }
  });

  // ---------------------------------------------------------------------------
  // 1. Authentication & Gate Enforcement
  // ---------------------------------------------------------------------------
  describe('Authentication & Gate Enforcement', () => {
    it('should reject POST /api/v1/applications with 401 when unauthenticated', async () => {
      const csrf = generateCsrfToken();
      const res = await request(app)
        .post('/api/v1/applications')
        .set('Origin', env.CLIENT_URL)
        .set('x-xsrf-token', csrf)
        .set('Cookie', [`XSRF-TOKEN=${csrf}`])
        .send({
          institutionId: authorizedInstitutionId,
          categoryId: newInstCategory.id
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject GET /api/v1/applications with 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/v1/applications');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject GET /api/v1/applications/:id with 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/v1/applications/11111111-2222-3333-4444-555555555555');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject access with 403 ACCOUNT_SUSPENDED when user is suspended', async () => {
      mockUserFindUnique.mockResolvedValue({
        id: testUserId,
        status: UserStatus.SUSPENDED,
        email: 'registrar@institution.edu.in'
      });

      const res = await request(app)
        .get('/api/v1/applications')
        .set('Cookie', [`access_token=${validAccessToken}`]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ACCOUNT_SUSPENDED');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Request Validation & Security Safeguards
  // ---------------------------------------------------------------------------
  describe('Request Validation & Security Safeguards', () => {
    it('should reject POST with 400 when institutionId is malformed', async () => {
      const res = await authMutationRequest(request(app).post('/api/v1/applications')).send({
        institutionId: 'not-a-uuid',
        categoryId: newInstCategory.id
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject POST with 400 when categoryId is malformed', async () => {
      const res = await authMutationRequest(request(app).post('/api/v1/applications')).send({
        institutionId: authorizedInstitutionId,
        categoryId: 'invalid-cat-id'
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject POST with 400 when client injects forbidden authoritative fields', async () => {
      const res = await authMutationRequest(request(app).post('/api/v1/applications')).send({
        institutionId: authorizedInstitutionId,
        categoryId: newInstCategory.id,
        status: 'APPROVED', // Client attempting to forge status
        internalReference: 'FORGED-REF-001'
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject GET with 400 when applicationId parameter is not a UUID', async () => {
      const res = await request(app)
        .get('/api/v1/applications/invalid-uuid-id')
        .set('Cookie', [`access_token=${validAccessToken}`]);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Tenant Boundary & Category Catalogue Enforcement
  // ---------------------------------------------------------------------------
  describe('Tenant Boundary & Category Catalogue Enforcement', () => {
    it('should reject POST with 403 when user has no active membership at target institution', async () => {
      const res = await authMutationRequest(request(app).post('/api/v1/applications')).send({
        institutionId: unauthorizedInstitutionId,
        categoryId: newInstCategory.id
      });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(res.body.error.message).toContain('Access to institution is forbidden');
    });

    it('should reject POST with 403 when target institution is suspended', async () => {
      mockMembershipFindFirst.mockResolvedValue({
        id: 'mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm',
        userId: testUserId,
        institutionId: authorizedInstitutionId,
        status: 'ACTIVE',
        institution: {
          id: authorizedInstitutionId,
          name: 'Suspended Tech Institute',
          institutionType: 'ENGINEERING',
          status: InstitutionStatus.SUSPENDED
        }
      });

      const res = await authMutationRequest(request(app).post('/api/v1/applications')).send({
        institutionId: authorizedInstitutionId,
        categoryId: newInstCategory.id
      });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(res.body.error.message).toContain('inactive or suspended');
    });

    it('should reject POST with 400 when categoryId is an unknown or unapproved UUID', async () => {
      const unknownCategoryId = '99999999-9999-4999-9999-999999999999';
      const res = await authMutationRequest(request(app).post('/api/v1/applications')).send({
        institutionId: authorizedInstitutionId,
        categoryId: unknownCategoryId
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('not active in the current catalogue release');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Application Draft Creation (POST /api/v1/applications)
  // ---------------------------------------------------------------------------
  describe('Application Draft Creation (POST /api/v1/applications)', () => {
    it('should create 201 DRAFT for New Technical Institution with generated internalReference', async () => {
      const res = await authMutationRequest(request(app).post('/api/v1/applications')).send({
        institutionId: authorizedInstitutionId,
        categoryId: newInstCategory.id,
        intakePayload: {
          proposedProgrammes: ['Diploma in Mechanical Engineering'],
          campusAreaAcres: 5.5
        }
      });

      expect(res.status).toBe(201);
      expect(res.body.data.application).toBeDefined();

      const appData = res.body.data.application;
      expect(appData.id).toBeDefined();
      expect(appData.internalReference).toMatch(/^APP-2024-2025-[A-Z0-9]{8}$/);
      expect(appData.institutionId).toBe(authorizedInstitutionId);
      expect(appData.categoryId).toBe(newInstCategory.id);
      expect(appData.categoryCode).toBe('NEW_TECHNICAL_INSTITUTION');
      expect(appData.status).toBe('DRAFT');
      expect(appData.submittedAt).toBeNull();
      expect(appData.submittedByUserId).toBeNull();
      expect(appData.createdByUserId).toBe(testUserId);
      expect(appData.institutionTypeSnapshot).toBe('ENGINEERING_AND_TECHNOLOGY');
      expect(appData.intakePayload).toEqual({
        proposedProgrammes: ['Diploma in Mechanical Engineering'],
        campusAreaAcres: 5.5
      });
    });

    it('should create 201 DRAFT for Extension of Approval (EoA)', async () => {
      const res = await authMutationRequest(request(app).post('/api/v1/applications')).send({
        institutionId: authorizedInstitutionId,
        categoryId: eoaCategory.id,
        intakePayload: {
          selfDisclosureDeclaration: true,
          nilDeficiencyClaimed: true
        }
      });

      expect(res.status).toBe(201);
      const appData = res.body.data.application;
      expect(appData.categoryCode).toBe('EXTENSION_OF_APPROVAL_EOA');
      expect(appData.status).toBe('DRAFT');
      expect(appData.intakePayload).toEqual({
        selfDisclosureDeclaration: true,
        nilDeficiencyClaimed: true
      });
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Listing & Scoped Retrieval (GET /api/v1/applications)
  // ---------------------------------------------------------------------------
  describe('Listing & Scoped Retrieval', () => {
    it('should list applications belonging to caller active institutions', async () => {
      // Create two drafts
      await authMutationRequest(request(app).post('/api/v1/applications')).send({
        institutionId: authorizedInstitutionId,
        categoryId: newInstCategory.id
      });

      await authMutationRequest(request(app).post('/api/v1/applications')).send({
        institutionId: authorizedInstitutionId,
        categoryId: eoaCategory.id
      });

      const res = await request(app)
        .get('/api/v1/applications')
        .set('Cookie', [`access_token=${validAccessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.applications).toHaveLength(2);
      expect(res.body.data.applications[0].institutionId).toBe(authorizedInstitutionId);
      expect(res.body.data.applications[1].institutionId).toBe(authorizedInstitutionId);
    });

    it('should not return applications from unauthorized institutions (Tenant Isolation)', async () => {
      // Seed a draft directly into store for an unauthorized institution
      ApplicationDraftStore.set({
        id: '99999999-0000-4000-8000-000000000099',
        internalReference: 'APP-2024-2025-SECRET99',
        externalReference: null,
        institutionId: unauthorizedInstitutionId,
        institutionName: 'Unauthorized Tech Institute',
        categoryId: newInstCategory.id,
        categoryCode: 'NEW_TECHNICAL_INSTITUTION',
        categoryName: 'New Institution',
        academicCycle: '2024-2025',
        applicationPurpose: 'New Institution',
        institutionTypeSnapshot: 'MANAGEMENT',
        status: 'DRAFT',
        intakePayload: {},
        submittedAt: null,
        submittedByUserId: null,
        createdByUserId: 'other-user-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const res = await request(app)
        .get('/api/v1/applications')
        .set('Cookie', [`access_token=${validAccessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.applications).toHaveLength(0); // Scoped out
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Application Details & Anti-Enumeration (GET /api/v1/applications/:id)
  // ---------------------------------------------------------------------------
  describe('Application Detail Retrieval', () => {
    it('should return 200 with application details when caller is an active member', async () => {
      const createRes = await authMutationRequest(request(app).post('/api/v1/applications')).send({
        institutionId: authorizedInstitutionId,
        categoryId: newInstCategory.id
      });

      const createdApp = createRes.body.data.application;

      const res = await request(app)
        .get(`/api/v1/applications/${createdApp.id}`)
        .set('Cookie', [`access_token=${validAccessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.application.id).toBe(createdApp.id);
      expect(res.body.data.application.internalReference).toBe(createdApp.internalReference);
    });

    it('should return 404 NOT_FOUND for non-existent application ID', async () => {
      const unknownId = '88888888-8888-4888-8888-888888888888';
      const res = await request(app)
        .get(`/api/v1/applications/${unknownId}`)
        .set('Cookie', [`access_token=${validAccessToken}`]);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 404 NOT_FOUND when application exists but belongs to unauthorized institution', async () => {
      const secretAppId = '99999999-0000-4000-8000-000000000099';
      ApplicationDraftStore.set({
        id: secretAppId,
        internalReference: 'APP-2024-2025-SECRET99',
        externalReference: null,
        institutionId: unauthorizedInstitutionId,
        institutionName: 'Unauthorized Tech Institute',
        categoryId: newInstCategory.id,
        categoryCode: 'NEW_TECHNICAL_INSTITUTION',
        categoryName: 'New Institution',
        academicCycle: '2024-2025',
        applicationPurpose: 'New Institution',
        institutionTypeSnapshot: 'MANAGEMENT',
        status: 'DRAFT',
        intakePayload: {},
        submittedAt: null,
        submittedByUserId: null,
        createdByUserId: 'other-user-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const res = await request(app)
        .get(`/api/v1/applications/${secretAppId}`)
        .set('Cookie', [`access_token=${validAccessToken}`]);

      // Anti-enumeration: returns 404 instead of 403
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Editing Application Drafts (PATCH /api/v1/applications/:id)
  // ---------------------------------------------------------------------------
  describe('Editing Application Drafts (PATCH /api/v1/applications/:id)', () => {
    it('should update intakePayload on a DRAFT application', async () => {
      const createRes = await authMutationRequest(request(app).post('/api/v1/applications')).send({
        institutionId: authorizedInstitutionId,
        categoryId: newInstCategory.id,
        intakePayload: { initialField: 'initial value' }
      });

      const createdApp = createRes.body.data.application;

      const patchRes = await authMutationRequest(
        request(app).patch(`/api/v1/applications/${createdApp.id}`)
      ).send({
        intakePayload: { updatedField: 'new value', initialField: 'updated value' }
      });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.data.application.intakePayload).toEqual({
        initialField: 'updated value',
        updatedField: 'new value'
      });
      expect(patchRes.body.data.application.status).toBe('DRAFT');
    });

    it('should reject editing with 409 CONFLICT if application is not in DRAFT status (FR-005)', async () => {
      const submittedAppId = '77777777-7777-4777-7777-777777777777';
      ApplicationDraftStore.set({
        id: submittedAppId,
        internalReference: 'APP-2024-2025-SUBMITTED',
        externalReference: null,
        institutionId: authorizedInstitutionId,
        institutionName: 'Apex Institute of Technology',
        categoryId: newInstCategory.id,
        categoryCode: 'NEW_TECHNICAL_INSTITUTION',
        categoryName: 'New Institution',
        academicCycle: '2024-2025',
        applicationPurpose: 'New Institution',
        institutionTypeSnapshot: 'ENGINEERING_AND_TECHNOLOGY',
        status: 'SUBMITTED', // Already submitted!
        intakePayload: {},
        submittedAt: new Date().toISOString(),
        submittedByUserId: testUserId,
        createdByUserId: testUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const patchRes = await authMutationRequest(
        request(app).patch(`/api/v1/applications/${submittedAppId}`)
      ).send({
        intakePayload: { unauthorizedEdit: 'attempt' }
      });

      expect(patchRes.status).toBe(409);
      expect(patchRes.body.error.code).toBe('CONFLICT');
      expect(patchRes.body.error.message).toContain('Only applications in DRAFT status can be modified');
    });
  });
});
