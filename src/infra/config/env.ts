import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 3000,
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
  },
  kafka: {
    broker: process.env.KAFKA_BROKER || "localhost:9092",
    groupId: process.env.KAFKA_GROUP_ID || "viewer-count-group",
    topic: process.env.KAFKA_TOPIC || "viewer-events",
  },
  jwtSecret:
    process.env.JWT_SECRET ||
    "657928478954RUHD879YHN38R7Y9UJD3HY6R87HIDY3H879UEJH7389RYUN487EY9RHID3879HD387WIHSDNBYU3R87EY3879HD2UY3R7hdubuy3d7dh398ndyx3edhuy87diu",
};
