const mockConsumer = {
  connect: jest.fn().mockResolvedValue(undefined),
  subscribe: jest.fn().mockResolvedValue(undefined),
  run: jest.fn().mockResolvedValue(undefined),
};

const mockKafka = {
  consumer: jest.fn().mockReturnValue(mockConsumer),
};

jest.mock("kafkajs", () => ({
  Kafka: jest.fn().mockImplementation(() => mockKafka),
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

jest.mock("../../../../src/infra/cache/redisClient", () => ({
  redisClient: {
    sAdd: jest.fn().mockResolvedValue(1),
    sRem: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
    decr: jest.fn().mockResolvedValue(0),
    setEx: jest.fn().mockResolvedValue("OK"),
    del: jest.fn().mockResolvedValue(1),
    get: jest.fn().mockResolvedValue("1"),
  },
}));

import { startKafkaConsumer } from "../../../../src/infra/messaging/kafkaConsumer";

describe("kafkaConsumer", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should connect consumer", async () => {
    await startKafkaConsumer();
    expect(mockConsumer.connect).toHaveBeenCalled();
  });

  it("should subscribe to correct topic", async () => {
    await startKafkaConsumer();
    expect(mockConsumer.subscribe).toHaveBeenCalledWith({
      topic: "viewer-events",
      fromBeginning: false,
    });
  });

  it("should start running consumer", async () => {
    await startKafkaConsumer();
    expect(mockConsumer.run).toHaveBeenCalled();
  });

  it("should process ViewerJoined event", async () => {
    const { redisClient } = require("../../../../src/infra/cache/redisClient");

    mockConsumer.run.mockImplementation(async ({ eachMessage }: any) => {
      await eachMessage({
        message: {
          value: Buffer.from(
            JSON.stringify({
              type: "ViewerJoined",
              streamId: "stream-1",
              userId: "user-1",
              timestamp: "2026-05-11T12:00:00Z",
            }),
          ),
        },
      });
    });

    await startKafkaConsumer();
    expect(redisClient.sAdd).toHaveBeenCalled();
  });

  it("should process ViewerLeft event", async () => {
    const { redisClient } = require("../../../../src/infra/cache/redisClient");

    mockConsumer.run.mockImplementation(async ({ eachMessage }: any) => {
      await eachMessage({
        message: {
          value: Buffer.from(
            JSON.stringify({
              type: "ViewerLeft",
              streamId: "stream-1",
              userId: "user-1",
              timestamp: "2026-05-11T12:00:00Z",
            }),
          ),
        },
      });
    });

    await startKafkaConsumer();
    expect(redisClient.sRem).toHaveBeenCalled();
  });

  it("should process ViewerHeartbeat event", async () => {
    const { redisClient } = require("../../../../src/infra/cache/redisClient");

    mockConsumer.run.mockImplementation(async ({ eachMessage }: any) => {
      await eachMessage({
        message: {
          value: Buffer.from(
            JSON.stringify({
              type: "ViewerHeartbeat",
              streamId: "stream-1",
              userId: "user-1",
              timestamp: "2026-05-11T12:00:00Z",
            }),
          ),
        },
      });
    });

    await startKafkaConsumer();
    expect(redisClient.setEx).toHaveBeenCalled();
  });

  it("should ignore message with no value", async () => {
    const { redisClient } = require("../../../../src/infra/cache/redisClient");

    mockConsumer.run.mockImplementation(async ({ eachMessage }: any) => {
      await eachMessage({ message: { value: null } });
    });

    await startKafkaConsumer();
    expect(redisClient.sAdd).not.toHaveBeenCalled();
  });
});
