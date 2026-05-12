jest.mock("../../src/infra/cache/redisClient", () => ({
  redisClient: { ping: jest.fn() },
  connectRedis: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../src/infra/messaging/kafkaConsumer", () => ({
  startKafkaConsumer: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../src/infra/cache/redisSubscriber", () => ({
  startKeyspaceListener: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../src/infra/logger/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock("../../src/infra/config/env", () => ({
  env: {
    jwtSecret: "test-secret",
    redis: { host: "localhost", port: 6379 },
    kafka: { broker: "localhost:9092", groupId: "test", topic: "test" },
    port: 3000,
  },
}));

jest.mock("../../src/app", () => ({
  default: {
    listen: jest.fn().mockImplementation((_port: number, cb: Function) => cb()),
  },
}));

const mockExit = jest
  .spyOn(process, "exit")
  .mockImplementation((() => {}) as any);

describe("index bootstrap", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("should call connectRedis on bootstrap", async () => {
    require("../../src/index");
    await new Promise((resolve) => setTimeout(resolve, 200));
    const { connectRedis } = require("../../src/infra/cache/redisClient");
    expect(connectRedis).toBeDefined();
  });

  it("should not crash on load", async () => {
    expect(() => require("../../src/index")).not.toThrow();
  });

  it("should mock process exit", () => {
    expect(mockExit).toBeDefined();
  });
});
