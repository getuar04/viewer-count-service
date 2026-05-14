import { redisClient } from './redisClient';
import { IViewerRepository } from '../../app/ports';
import { logger } from '../logger/logger';

const HEARTBEAT_TTL = 60;

export class RedisViewerRepository implements IViewerRepository {
  private viewersKey(streamId: string) {
    return `stream:${streamId}:viewers`;
  }

  private countKey(streamId: string) {
    return `stream:${streamId}:viewer_count`;
  }

  private heartbeatKey(streamId: string, userId: string) {
    return `stream:${streamId}:viewer:${userId}`;
  }

  private activeStreamKey(streamId: string) {
    return `active_stream:${streamId}`;
  }

  async streamStarted(streamId: string): Promise<void> {
    await redisClient.set(this.activeStreamKey(streamId), 'alive');
    logger.info({ streamId }, 'Stream started');
  }

  async streamEnded(streamId: string): Promise<void> {
    await redisClient.del(this.activeStreamKey(streamId));
    await redisClient.del(this.countKey(streamId));
    await redisClient.del(this.viewersKey(streamId));
    logger.info({ streamId }, 'Stream ended');
  }

  async join(streamId: string, userId: string): Promise<void> {
    const isActive = await redisClient.exists(this.activeStreamKey(streamId));
    if (!isActive) {
      logger.warn({ streamId, userId }, 'Join rejected - stream not active');
      throw new Error('Stream not active');
    }
    const added = await redisClient.sAdd(this.viewersKey(streamId), userId);
    if (added === 1) {
      await redisClient.incr(this.countKey(streamId));
      logger.info({ streamId, userId }, 'Viewer joined');
    }
    await redisClient.setEx(this.heartbeatKey(streamId, userId), HEARTBEAT_TTL, 'alive');
  }

  async leave(streamId: string, userId: string): Promise<void> {
    const removed = await redisClient.sRem(this.viewersKey(streamId), userId);
    if (removed === 1) {
      await redisClient.decr(this.countKey(streamId));
      await redisClient.del(this.heartbeatKey(streamId, userId));
      logger.info({ streamId, userId }, 'Viewer left');
    }
  }

  async heartbeat(streamId: string, userId: string): Promise<void> {
    await redisClient.setEx(this.heartbeatKey(streamId, userId), HEARTBEAT_TTL, 'alive');
    logger.info({ streamId, userId }, 'Heartbeat received');
  }

  async getCount(streamId: string): Promise<number> {
    const count = await redisClient.get(this.countKey(streamId));
    return count ? parseInt(count, 10) : 0;
  }
}
