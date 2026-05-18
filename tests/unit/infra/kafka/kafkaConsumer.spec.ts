/// <reference types="jest" />

const mockConsumer = {
  connect: jest.fn().mockResolvedValue(undefined),
  subscribe: jest.fn().mockResolvedValue(undefined),
  run: jest.fn().mockResolvedValue(undefined),
};

jest.mock("kafkajs", () => ({
  Kafka: jest.fn().mockImplementation(() => ({
    consumer: jest.fn().mockReturnValue(mockConsumer),
  })),
}));

jest.mock("../../../../src/infra/config/env", () => ({
  env: {
    jwtSecret: "test-secret",
    redis: { host: "localhost", port: 6379 },
    kafka: {
      broker: "localhost:9092",
      groupId: "viewer-count-group",
      topic: "viewer-events",
    },
    port: 3000,
  },
}));

jest.mock("../../../../src/infra/logger/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock("../../../../src/infra/redis/redisClient", () => ({
  redisClient: {
    sAdd: jest.fn().mockResolvedValue(1),
    sRem: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
    decr: jest.fn().mockResolvedValue(0),
    setEx: jest.fn().mockResolvedValue("OK"),
    del: jest.fn().mockResolvedValue(1),
    get: jest.fn().mockResolvedValue("1"),
    set: jest.fn().mockResolvedValue("OK"),
    exists: jest.fn().mockResolvedValue(1),
  },
}));

import {
  processViewerEvent,
  startKafkaConsumer,
} from "../../../../src/infra/kafka/kafkaConsumer";
import { redisClient } from "../../../../src/infra/redis/redisClient";
import { logger } from "../../../../src/infra/logger/logger";

const mockRedis = redisClient as jest.Mocked<typeof redisClient>;

const runConsumerWith = async (value: Buffer | null) => {
  mockConsumer.run.mockImplementationOnce(async ({ eachMessage }: any) => {
    await eachMessage({ message: { value } });
  });
  await startKafkaConsumer();
};

describe("kafkaConsumer", () => {
  beforeEach(() => jest.clearAllMocks());

  it("connects, subscribes and starts running consumer", async () => {
    await startKafkaConsumer();
    expect(mockConsumer.connect).toHaveBeenCalled();
    expect(mockConsumer.subscribe).toHaveBeenCalledWith({
      topic: "viewer-events",
      fromBeginning: false,
    });
    expect(mockConsumer.run).toHaveBeenCalled();
  });

  it("ignores null message value", async () => {
    await runConsumerWith(null);
    expect(mockRedis.sAdd).not.toHaveBeenCalled();
  });

  it("logs malformed JSON messages", async () => {
    await runConsumerWith(Buffer.from("{bad-json"));
    expect(logger.error).toHaveBeenCalled();
  });

  it("parses and processes valid Kafka messages from consumer runner", async () => {
    await runConsumerWith(
      Buffer.from(
        JSON.stringify({
          type: "ViewerHeartbeat",
          streamId: "s1",
          userId: "u1",
        }),
      ),
    );
    expect(mockRedis.setEx).toHaveBeenCalled();
  });

  it("processes StreamStarted", async () => {
    await processViewerEvent({ type: "StreamStarted", streamId: "s1" });
    expect(mockRedis.set).toHaveBeenCalledWith("active_stream:s1", "alive");
  });

  it("processes StreamEnded", async () => {
    await processViewerEvent({ type: "StreamEnded", streamId: "s1" });
    expect(mockRedis.del).toHaveBeenCalled();
  });

  it("processes ViewerJoined", async () => {
    await processViewerEvent({
      type: "ViewerJoined",
      streamId: "s1",
      userId: "u1",
    });
    expect(mockRedis.sAdd).toHaveBeenCalled();
  });

  it("processes ViewerLeft", async () => {
    await processViewerEvent({
      type: "ViewerLeft",
      streamId: "s1",
      userId: "u1",
    });
    expect(mockRedis.sRem).toHaveBeenCalled();
  });

  it("processes ViewerHeartbeat", async () => {
    await processViewerEvent({
      type: "ViewerHeartbeat",
      streamId: "s1",
      userId: "u1",
    });
    expect(mockRedis.setEx).toHaveBeenCalled();
  });

  it("rejects event without type or streamId", async () => {
    await processViewerEvent({ type: "" as any, streamId: "" });
    expect(logger.warn).toHaveBeenCalledWith(
      expect.any(Object),
      "Invalid Kafka event - missing type or streamId",
    );
  });

  it("rejects ViewerJoined without userId", async () => {
    await processViewerEvent({ type: "ViewerJoined", streamId: "s1" });
    expect(logger.warn).toHaveBeenCalledWith(
      expect.any(Object),
      "ViewerJoined requires userId",
    );
  });

  it("rejects ViewerLeft without userId", async () => {
    await processViewerEvent({ type: "ViewerLeft", streamId: "s1" });
    expect(logger.warn).toHaveBeenCalledWith(
      expect.any(Object),
      "ViewerLeft requires userId",
    );
  });

  it("rejects ViewerHeartbeat without userId", async () => {
    await processViewerEvent({ type: "ViewerHeartbeat", streamId: "s1" });
    expect(logger.warn).toHaveBeenCalledWith(
      expect.any(Object),
      "ViewerHeartbeat requires userId",
    );
  });

  it("rejects unknown event types", async () => {
    await processViewerEvent({ type: "Unknown" as any, streamId: "s1" });
    expect(logger.warn).toHaveBeenCalledWith(
      expect.any(Object),
      "Unknown Kafka event type",
    );
  });
});
