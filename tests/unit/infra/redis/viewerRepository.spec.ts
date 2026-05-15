jest.mock('../../../../src/infra/redis/redisClient', () => ({
  redisClient: {
    sAdd: jest.fn(),
    sRem: jest.fn(),
    incr: jest.fn(),
    decr: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    exists: jest.fn(),
  },
}));

jest.mock('../../../../src/infra/logger/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('../../../../src/infra/config/env', () => ({
  env: {
    jwtSecret: 'test-secret',
    redis: { host: 'localhost', port: 6379 },
    kafka: { broker: 'localhost:9092', groupId: 'test', topic: 'test' },
    port: 3000,
  },
}));

import { RedisViewerRepository } from '../../../../src/infra/redis/viewerRepository';
import { redisClient } from '../../../../src/infra/redis/redisClient';

const mockRedis = redisClient as jest.Mocked<typeof redisClient>;

describe('RedisViewerRepository', () => {
  const repo = new RedisViewerRepository();
  beforeEach(() => jest.clearAllMocks());

  describe('streamStarted', () => {
    it('should SET active stream key', async () => {
      (mockRedis.set as jest.Mock).mockResolvedValue('OK');
      await repo.streamStarted('stream-1');
      expect(mockRedis.set).toHaveBeenCalledWith('active_stream:stream-1', 'alive');
    });
  });

  describe('streamEnded', () => {
    it('should DEL all stream keys', async () => {
      (mockRedis.del as jest.Mock).mockResolvedValue(1);
      await repo.streamEnded('stream-1');
      expect(mockRedis.del).toHaveBeenCalledWith('active_stream:stream-1');
      expect(mockRedis.del).toHaveBeenCalledWith('stream:stream-1:viewer_count');
      expect(mockRedis.del).toHaveBeenCalledWith('stream:stream-1:viewers');
    });
  });

  describe('join', () => {
    it('should INCR and SETEX when user is new', async () => {
      (mockRedis.exists as jest.Mock).mockResolvedValue(1);
      (mockRedis.sAdd as jest.Mock).mockResolvedValue(1);
      (mockRedis.incr as jest.Mock).mockResolvedValue(1);
      (mockRedis.setEx as jest.Mock).mockResolvedValue('OK');
      await repo.join('stream-1', 'user-1');
      expect(mockRedis.sAdd).toHaveBeenCalledWith('stream:stream-1:viewers', 'user-1');
      expect(mockRedis.incr).toHaveBeenCalledWith('stream:stream-1:viewer_count');
    });

    it('should only SETEX when duplicate', async () => {
      (mockRedis.exists as jest.Mock).mockResolvedValue(1);
      (mockRedis.sAdd as jest.Mock).mockResolvedValue(0);
      (mockRedis.setEx as jest.Mock).mockResolvedValue('OK');
      await repo.join('stream-1', 'user-1');
      expect(mockRedis.incr).not.toHaveBeenCalled();
    });

    it('should throw when stream not active', async () => {
      (mockRedis.exists as jest.Mock).mockResolvedValue(0);
      await expect(repo.join('stream-1', 'user-1')).rejects.toThrow('Stream not active');
    });
  });

  describe('leave', () => {
    it('should DECR and DEL when user removed', async () => {
      (mockRedis.sRem as jest.Mock).mockResolvedValue(1);
      (mockRedis.decr as jest.Mock).mockResolvedValue(0);
      (mockRedis.del as jest.Mock).mockResolvedValue(1);
      await repo.leave('stream-1', 'user-1');
      expect(mockRedis.decr).toHaveBeenCalledWith('stream:stream-1:viewer_count');
    });

    it('should not DECR when user not found', async () => {
      (mockRedis.sRem as jest.Mock).mockResolvedValue(0);
      await repo.leave('stream-1', 'user-1');
      expect(mockRedis.decr).not.toHaveBeenCalled();
    });
  });

  describe('heartbeat', () => {
    it('should SETEX with correct TTL', async () => {
      (mockRedis.exists as jest.Mock).mockResolvedValue(1);
      (mockRedis.setEx as jest.Mock).mockResolvedValue('OK');
      await repo.heartbeat('stream-1', 'user-1');
      expect(mockRedis.setEx).toHaveBeenCalledWith('stream:stream-1:viewer:user-1', 60, 'alive');
    });

    it('should throw when heartbeat stream is not active', async () => {
      (mockRedis.exists as jest.Mock).mockResolvedValue(0);
      await expect(repo.heartbeat('stream-1', 'user-1')).rejects.toThrow('Stream not active');
    });
  });


  describe('isStreamActive', () => {
    it('should return true when stream exists', async () => {
      (mockRedis.exists as jest.Mock).mockResolvedValue(1);
      await expect(repo.isStreamActive('stream-1')).resolves.toBe(true);
    });

    it('should return false when stream does not exist', async () => {
      (mockRedis.exists as jest.Mock).mockResolvedValue(0);
      await expect(repo.isStreamActive('stream-1')).resolves.toBe(false);
    });
  });


  describe('getCount', () => {
    it('should return viewer count', async () => {
      (mockRedis.get as jest.Mock).mockResolvedValue('42');
      const count = await repo.getCount('stream-1');
      expect(count).toBe(42);
    });

    it('should return 0 when null', async () => {
      (mockRedis.get as jest.Mock).mockResolvedValue(null);
      const count = await repo.getCount('stream-1');
      expect(count).toBe(0);
    });
  });
});
