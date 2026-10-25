import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('GET /api/health', () => {
  it('should return 200 OK with valid health status metadata and no leaked environment details', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptimeSeconds');
    expect(response.body).toHaveProperty('version');

    // Ensure environment, database, and sensitive internal details are NOT exposed
    expect(response.body).not.toHaveProperty('environment');
    expect(response.body).not.toHaveProperty('NODE_ENV');
    expect(response.body).not.toHaveProperty('database');
    expect(response.body).not.toHaveProperty('DATABASE_URL');
  });

  it('should return 404 with structured error response for unmapped endpoints', async () => {
    const response = await request(app).get('/api/unmapped-endpoint');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
    expect(response.body.error.message).toContain('/api/unmapped-endpoint');
  });

  it('should return 400 when receiving malformed JSON payload', async () => {
    const response = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"invalidJson": true,');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code', 'MALFORMED_JSON');
  });
});
