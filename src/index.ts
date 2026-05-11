import app from './app';
import { env } from './infra/config/env';
import { connectRedis } from './infra/cache/redisClient';
import { startKeyspaceListener } from './infra/cache/redisSubscriber';
import { startKafkaConsumer } from './infra/messaging/kafkaConsumer';
import { logger } from './infra/logger/logger';

const bootstrap = async (): Promise<void> => {
  await connectRedis();
  await startKeyspaceListener();
  await startKafkaConsumer();

  app.listen(env.port, () => {
    logger.info(`Viewer Count Service running on port ${env.port}`);
  });
};

bootstrap().catch((err) => {
  logger.error({ err }, 'Failed to start service');
  process.exit(1);
});
