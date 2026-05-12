jest.mock('../../../../src/infra/cache/redisClient', () => ({
  redisClient: {
    sAdd: jest.fn(),
    sRem: jest.fn(),
    sIsMember: jest.fn(),
    incr: jest.fn(),
    decr: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    get: jest.fn(),
  },
}));

jest.mock('../../../../src/infra/logger/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('../../../../src/infra/config/env', () => ({
  env: {
    redis: { host: 'localhost', port: 6379 },
    kafka: { broker: 'localhost:9092', groupId: 'test', topic: 'test' },
    port: 3000,
    jwtSecret: 'test-secret',
  },
}));

import { RedisViewerRepository } from '../../../../src/infra/persistence/redisViewerRepository';
import { redisClient } from '../../../../src/infra/cache/redisClient';

const mockRedis = redisClient as jest.Mocked<typeof redisClient>;

describe('RedisViewerRepository', () => {
  const repo = new RedisViewerRepository();

  beforeEach(() => jest.clearAllMocks());

  describe('join', () => {
    it('should INCR and SETEX when user is new', async () => {
      (mockRedis.sAdd as jest.Mock).mockResolvedValue(1);
      (mockRedis.incr as jest.Mock).mockResolvedValue(1);
      (mockRedis.setEx as jest.Mock).mockResolvedValue('OK');

      await repo.join('stream-1', 'user-1');

      expect(mockRedis.sAdd).toHaveBeenCalledWith('stream:stream-1:viewers', 'user-1');
      expect(mockRedis.incr).toHaveBeenCalledWith('stream:stream-1:viewer_count');
      expect(mockRedis.setEx).toHaveBeenCalledWith('stream:stream-1:viewer:user-1', 60, 'alive');
    });

    it('should only SETEX when user is duplicate', async () => {
      (mockRedis.sAdd as jest.Mock).mockResolvedValue(0);
      (mockRedis.setEx as jest.Mock).mockResolvedValue('OK');

      await repo.join('stream-1', 'user-1');

      expect(mockRedis.incr).not.toHaveBeenCalled();
      expect(mockRedis.setEx).toHaveBeenCalled();
    });
  });

  describe('leave', () => {
    it('should DECR and DEL when user is removed', async () => {
      (mockRedis.sRem as jest.Mock).mockResolvedValue(1);
      (mockRedis.decr as jest.Mock).mockResolvedValue(0);
      (mockRedis.del as jest.Mock).mockResolvedValue(1);

      await repo.leave('stream-1', 'user-1');

      expect(mockRedis.sRem).toHaveBeenCalledWith('stream:stream-1:viewers', 'user-1');
      expect(mockRedis.decr).toHaveBeenCalledWith('stream:stream-1:viewer_count');
      expect(mockRedis.del).toHaveBeenCalledWith('stream:stream-1:viewer:user-1');
    });

    it('should not DECR when user not found', async () => {
      (mockRedis.sRem as jest.Mock).mockResolvedValue(0);

      await repo.leave('stream-1', 'user-1');

      expect(mockRedis.decr).not.toHaveBeenCalled();
    });
  });

  describe('heartbeat', () => {
    it('should SETEX with correct TTL', async () => {
      (mockRedis.setEx as jest.Mock).mockResolvedValue('OK');

      await repo.heartbeat('stream-1', 'user-1');

      expect(mockRedis.setEx).toHaveBeenCalledWith('stream:stream-1:viewer:user-1', 60, 'alive');
    });
  });

  describe('getCount', () => {
    it('should return viewer count', async () => {
      (mockRedis.get as jest.Mock).mockResolvedValue('42');

      const count = await repo.getCount('stream-1');

      expect(count).toBe(42);
    });

    it('should return 0 when no count exists', async () => {
      (mockRedis.get as jest.Mock).mockResolvedValue(null);

      const count = await repo.getCount('stream-1');

      expect(count).toBe(0);
    });
  });
});
