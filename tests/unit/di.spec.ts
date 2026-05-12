jest.mock("../../src/infra/cache/redisClient", () => ({
  redisClient: {
    sAdd: jest.fn(),
    sRem: jest.fn(),
    incr: jest.fn(),
    decr: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    get: jest.fn(),
  },
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

import { joinStream, leaveStream, getViewerCount } from "../../src/di";

describe("di", () => {
  it("should export joinStream", () => {
    expect(joinStream).toBeDefined();
  });

  it("should export leaveStream", () => {
    expect(leaveStream).toBeDefined();
  });

  it("should export getViewerCount", () => {
    expect(getViewerCount).toBeDefined();
  });
});
