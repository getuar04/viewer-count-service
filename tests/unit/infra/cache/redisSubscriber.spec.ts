const mockSubscriberClient = {
  connect: jest.fn().mockResolvedValue(undefined),
  pSubscribe: jest.fn().mockResolvedValue(undefined),
};

jest.mock("../../../../src/infra/cache/redisClient", () => ({
  redisClient: {
    sAdd: jest.fn().mockResolvedValue(1),
    sRem: jest.fn().mockResolvedValue(1),
    sIsMember: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
    decr: jest.fn().mockResolvedValue(0),
    setEx: jest.fn().mockResolvedValue("OK"),
    del: jest.fn().mockResolvedValue(1),
    get: jest.fn().mockResolvedValue("1"),
  },
}));

jest.mock("redis", () => ({
  createClient: jest.fn().mockReturnValue(mockSubscriberClient),
}));

jest.mock("../../../../src/infra/config/env", () => ({
  env: {
    jwtSecret: "test-secret",
    redis: { host: "localhost", port: 6379 },
    kafka: { broker: "localhost:9092", groupId: "test", topic: "test" },
    port: 3000,
  },
}));

jest.mock("../../../../src/infra/logger/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { startKeyspaceListener } from "../../../../src/infra/cache/redisSubscriber";

describe("redisSubscriber", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should connect subscriber client", async () => {
    await startKeyspaceListener();
    expect(mockSubscriberClient.connect).toHaveBeenCalled();
  });

  it("should subscribe to keyspace events", async () => {
    await startKeyspaceListener();
    expect(mockSubscriberClient.pSubscribe).toHaveBeenCalledWith(
      "__keyevent@0__:expired",
      expect.any(Function),
    );
  });

  it("should handle expired viewer key and remove from set", async () => {
    const { redisClient } = require("../../../../src/infra/cache/redisClient");

    mockSubscriberClient.pSubscribe.mockImplementation(
      async (_pattern: string, callback: Function) => {
        await callback("stream:stream-1:viewer:user-1");
      },
    );

    await startKeyspaceListener();
    expect(redisClient.sRem).toHaveBeenCalled();
  });

  it("should ignore non-viewer expired keys", async () => {
    const { redisClient } = require("../../../../src/infra/cache/redisClient");

    mockSubscriberClient.pSubscribe.mockImplementation(
      async (_pattern: string, callback: Function) => {
        await callback("some:other:key");
      },
    );

    await startKeyspaceListener();
    expect(redisClient.sRem).not.toHaveBeenCalled();
  });
});
