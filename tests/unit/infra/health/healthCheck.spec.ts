jest.mock('../../../../src/infra/redis/redisClient', () => ({
  redisClient: { ping: jest.fn() },
}));

jest.mock('../../../../src/infra/config/env', () => ({
  env: {
    jwtSecret: 'test-secret',
    redis: { host: 'localhost', port: 6379 },
    kafka: { broker: 'localhost:9092', groupId: 'test', topic: 'test' },
    port: 3000,
  },
}));

import express from 'express';
import request from 'supertest';
import healthRouter from '../../../../src/infra/health/healthCheck';
import { redisClient } from '../../../../src/infra/redis/redisClient';

const mockPing = redisClient.ping as jest.Mock;

describe('healthCheck', () => {
  const app = express();
  app.use(healthRouter);
  beforeEach(() => jest.clearAllMocks());

  it('should return 200 when redis connected', async () => {
    mockPing.mockResolvedValue('PONG');
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', redis: 'connected' });
  });

  it('should return 503 when redis disconnected', async () => {
    mockPing.mockRejectedValue(new Error('Connection refused'));
    const res = await request(app).get('/health');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: 'error', redis: 'disconnected' });
  });
});
