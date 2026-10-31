import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import * as databaseModule from '../src/database/index.js';
import { createAccessToken } from '../src/utils/token.js';
import { UserStatus } from '@prisma/client';
import {
  APPLICATION_CATEGORIES_CATALOGUE,
  APPLICATION_CATALOGUE_VERSION
} from '../src/config/applicationCategories.config.js';

describe('Application Category Catalogue Foundation Endpoints (Phase 5 — Substage 2)', () => {
  const mockUserFindUnique = vi.fn();
  const testUserId = '11111111-1111-1111-1111-111111111111';
  let validAccessToken: string;

  beforeEach(async () => {
    vi.restoreAllMocks();
    mockUserFindUnique.mockReset();

    // Isolated database mock: no external connection to Neon
    vi.spyOn(databaseModule, 'getDatabaseClient').mockReturnValue({
      user: {
        findUnique: mockUserFindUnique
      }
    } as unknown as ReturnType<typeof databaseModule.getDatabaseClient>);

    // Default: Authenticated user is active
    mockUserFindUnique.mockResolvedValue({
      id: testUserId,
      status: UserStatus.ACTIVE,
      email: 'applicant@institution.edu.in',
      displayName: 'Registrar User'
    });

    if (!validAccessToken) {
      validAccessToken = await createAccessToken(testUserId, {
        email: 'applicant@institution.edu.in'
      });
    }
  });

  // ---------------------------------------------------------------------------
  // 1. Authentication & Gate Enforcement
  // ---------------------------------------------------------------------------
  describe('Authentication & Gate Enforcement', () => {
    it('should reject GET /api/v1/application-categories with 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/v1/application-categories');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        error: {
          code: 'UNAUTHORIZED',
          message: expect.stringContaining('Authentication required')
        }
      });
    });

    it('should reject GET /api/v1/application-categories/:categoryId with 401 when unauthenticated', async () => {
      const targetId = APPLICATION_CATEGORIES_CATALOGUE[0].id;
      const res = await request(app).get(`/api/v1/application-categories/${targetId}`);

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
        email: 'applicant@institution.edu.in',
        displayName: 'Registrar User'
      });

      const res = await request(app)
        .get('/api/v1/application-categories')
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
    it('should reject GET /api/v1/application-categories/:categoryId with 400 when categoryId is not a UUID', async () => {
      const res = await request(app)
        .get('/api/v1/application-categories/invalid-uuid-format')
        .set('Cookie', [`access_token=${validAccessToken}`]);

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'categoryId',
            code: 'INVALID_STRING',
            message: 'Invalid category ID format; must be a valid UUID'
          })
        ])
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 3. GET /api/v1/application-categories (Catalogue Listing)
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/application-categories (List Approved Catalogue)', () => {
    it('should return 200 with approved categories and catalogue version', async () => {
      const res = await request(app)
        .get('/api/v1/application-categories')
        .set('Cookie', [`access_token=${validAccessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.categories).toHaveLength(2);
      expect(res.body.meta).toEqual({
        catalogueVersion: APPLICATION_CATALOGUE_VERSION
      });

      const codes = res.body.data.categories.map((c: { categoryCode: string }) => c.categoryCode);
      expect(codes).toContain('NEW_TECHNICAL_INSTITUTION');
      expect(codes).toContain('EXTENSION_OF_APPROVAL_EOA');

      // Verify canonical fields on every category
      for (const cat of res.body.data.categories) {
        expect(cat).toHaveProperty('id');
        expect(cat).toHaveProperty('categoryCode');
        expect(cat).toHaveProperty('name');
        expect(cat).toHaveProperty('description');
        expect(cat).toHaveProperty('academicCycle');
        expect(cat).toHaveProperty('applicableChapter');
        expect(cat).toHaveProperty('regulatoryBasis');
        expect(cat).toHaveProperty('defaultWorkflowRoute');
        expect(cat).toHaveProperty('requiresScrutiny');
        expect(cat).toHaveProperty('requiresEVC');
        expect(cat.isActive).toBe(true);
        expect(cat.reviewStatus).toBe('APPROVED');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 4. GET /api/v1/application-categories/:categoryId (Detail Retrieval)
  // ---------------------------------------------------------------------------
  describe('GET /api/v1/application-categories/:categoryId (Category Details & Applicability)', () => {
    it('should return 200 with New Technical Institution details and route mapping', async () => {
      const newInst = APPLICATION_CATEGORIES_CATALOGUE.find(
        (c) => c.categoryCode === 'NEW_TECHNICAL_INSTITUTION'
      )!;

      const res = await request(app)
        .get(`/api/v1/application-categories/${newInst.id}`)
        .set('Cookie', [`access_token=${validAccessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.category).toBeDefined();

      const cat = res.body.data.category;
      expect(cat.id).toBe(newInst.id);
      expect(cat.categoryCode).toBe('NEW_TECHNICAL_INSTITUTION');
      expect(cat.applicableChapter).toBe('Chapter I');
      expect(cat.defaultWorkflowRoute).toBe('SCRUTINY_AND_EVC');
      expect(cat.requiresScrutiny).toBe(true);
      expect(cat.requiresEVC).toBe(true);
      expect(cat.regulatoryBasis).toContain('Chapter I');
    });

    it('should return 200 with Extension of Approval (EoA) details and fast-track route mapping', async () => {
      const eoa = APPLICATION_CATEGORIES_CATALOGUE.find(
        (c) => c.categoryCode === 'EXTENSION_OF_APPROVAL_EOA'
      )!;

      const res = await request(app)
        .get(`/api/v1/application-categories/${eoa.id}`)
        .set('Cookie', [`access_token=${validAccessToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.category).toBeDefined();

      const cat = res.body.data.category;
      expect(cat.id).toBe(eoa.id);
      expect(cat.categoryCode).toBe('EXTENSION_OF_APPROVAL_EOA');
      expect(cat.applicableChapter).toBe('Chapter II');
      expect(cat.defaultWorkflowRoute).toBe('SELF_DISCLOSURE_FAST_TRACK');
      expect(cat.requiresScrutiny).toBe(false);
      expect(cat.requiresEVC).toBe(false);
      expect(cat.regulatoryBasis).toContain('Chapter II');
    });

    it('should return 404 NOT_FOUND when categoryId is a valid UUID but not in the approved catalogue', async () => {
      const unknownUuid = '99999999-9999-4999-9999-999999999999';

      const res = await request(app)
        .get(`/api/v1/application-categories/${unknownUuid}`)
        .set('Cookie', [`access_token=${validAccessToken}`]);

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        error: {
          code: 'NOT_FOUND',
          message: 'Application category not found or not active in the current catalogue release'
        }
      });
    });
  });
});
