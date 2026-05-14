import { createClient } from 'redis';
import { env } from '../config/env';
import { logger } from '../logger/logger';
import { RedisViewerRepository } from '../redis/viewerRepository';

const repo = new RedisViewerRepository();

export const startKeyspaceListener = async (): Promise<void> => {
  const subscriber = createClient({
    socket: {
      host: env.redis.host,
      port: env.redis.port,
    },
  });

  await subscriber.connect();

  await subscriber.pSubscribe('__keyevent@0__:expired', async (key: string) => {
    const match = key.match(/^stream:(.+):viewer:(.+)$/);
    if (!match) return;

    const streamId = match[1];
    const userId = match[2];

    logger.warn({ streamId, userId }, 'Ghost user detected - TTL expired');
    await repo.leave(streamId, userId);
  });

  logger.info('Redis keyspace listener started');
};
