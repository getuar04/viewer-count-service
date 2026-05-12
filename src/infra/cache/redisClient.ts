import { createClient } from 'redis';
import { env } from '../../infra/config/env';
import { logger } from '../logger/logger';

export const redisClient = createClient({
  socket: {
    host: env.redis.host,
    port: env.redis.port,
  },
});

export const connectRedis = async (): Promise<void> => {
  redisClient.on('error', (err) => logger.error({ err }, 'Redis error'));
  await redisClient.connect();
  logger.info('Redis connected');
};
