import app from "./app";
import { env } from "./infra/config/env";
import { connectRedis } from "./infra/redis/redisClient";
import { startKafkaConsumer } from "./infra/kafka/kafkaConsumer";
import { startKeyspaceListener } from "./infra/redis/redisSubscriber";
import { logger } from "./infra/logger/logger";

const bootstrap = async (): Promise<void> => {
  await connectRedis();
  await startKeyspaceListener();
  await startKafkaConsumer();

  app.listen(env.port, () => {
    logger.info(`Viewer Count Service running on port ${env.port}`);
  });
};

bootstrap().catch((err) => {
  logger.error({ err }, "Failed to start service");
  process.exit(1);
});
