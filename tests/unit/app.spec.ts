jest.mock("../../src/infra/redis/redisClient", () => ({
  redisClient: { ping: jest.fn().mockResolvedValue("PONG") },
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

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn().mockReturnValue({ userId: "123" }),
}));

import request from "supertest";
import app from "../../src/app";

describe("app", () => {
  it("should have health route", async () => {
    const { redisClient } = require("../../src/infra/redis/redisClient");
    (redisClient.ping as jest.Mock).mockResolvedValue("PONG");

    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
  });

  it("should return 401 on protected route without token", async () => {
    const res = await request(app).get("/streams/123/viewers");
    expect(res.status).toBe(401);
  });
});
