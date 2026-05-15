const mockClient = {
  on: jest.fn(),
  connect: jest.fn().mockResolvedValue(undefined),
};

jest.mock("redis", () => ({
  createClient: jest.fn().mockReturnValue(mockClient),
}));

jest.mock("../../../../src/infra/config/env", () => ({
  env: {
    jwtSecret: "test-secret",
    redis: { host: "localhost", port: 6379 },
    kafka: { broker: "localhost:9092", groupId: "test", topic: "test" },
    port: 3000,
  },
}));

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

jest.mock("../../../../src/infra/logger/logger", () => ({
  logger: mockLogger,
}));

import { connectRedis } from "../../../../src/infra/redis/redisClient";

describe("redisClient", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should connect to redis", async () => {
    await connectRedis();
    expect(mockClient.connect).toHaveBeenCalled();
  });

  it("should register error handler", async () => {
    await connectRedis();
    expect(mockClient.on).toHaveBeenCalledWith("error", expect.any(Function));
  });


  it("should log redis errors from registered handler", async () => {
    await connectRedis();
    const errorHandler = mockClient.on.mock.calls.find(([event]) => event === "error")?.[1];
    const err = new Error("redis failed");
    errorHandler(err);
    expect(mockLogger.error).toHaveBeenCalledWith({ err }, "Redis error");
  });
});
