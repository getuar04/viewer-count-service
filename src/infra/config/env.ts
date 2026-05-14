import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 3000,
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  },
  kafka: {
    broker: process.env.KAFKA_BROKER || 'localhost:9092',
    groupId: process.env.KAFKA_GROUP_ID || 'viewer-count-group',
    topic: process.env.KAFKA_TOPIC || 'viewer-events',
  },
  jwtSecret: process.env.JWT_SECRET ?? 'secret',
};
