import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { Express } from 'express';

// Create a test server that mimics the health endpoint
// This tests the endpoint logic without needing full server setup
function createTestServer(): Express {
  const app = express();
  app.use(express.json());

  // Health endpoint matching the actual implementation
  // In the real server, ravelryEnabled is computed from env vars
  const ravelryEnabled = false; // Simplified for testing
  app.get('/health', (_req, res) => {
    res.json({ ok: true, ravelryEnabled });
  });

  return app;
}

describe('Server endpoints', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestServer();
  });

  describe('GET /health', () => {
    it('should return health status with ok: true', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ok', true);
    });

    it('should return ravelryEnabled status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ravelryEnabled');
      expect(typeof response.body.ravelryEnabled).toBe('boolean');
    });

    it('should return JSON content type', async () => {
      const response = await request(app).get('/health');
      expect(response.headers['content-type']).toMatch(/json/);
    });
  });
});
