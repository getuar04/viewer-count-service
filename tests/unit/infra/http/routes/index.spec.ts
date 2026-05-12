jest.mock("../../../../../src/infra/cache/redisClient", () => ({
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

jest.mock("../../../../../src/infra/logger/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock("../../../../../src/infra/config/env", () => ({
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

import express from "express";
import request from "supertest";
import router from "../../../../../src/infra/http/routes/index";
import { redisClient } from "../../../../../src/infra/cache/redisClient";

const mockRedis = redisClient as jest.Mocked<typeof redisClient>;

describe("Routes", () => {
  const app = express();
  app.use(express.json());
  app.use(router);

  const token = "Bearer valid-token";

  beforeEach(() => jest.clearAllMocks());

  describe("POST /streams/:streamId/join", () => {
    it("should return 200 with viewerCount when user joins", async () => {
      (mockRedis.sAdd as jest.Mock).mockResolvedValue(1);
      (mockRedis.incr as jest.Mock).mockResolvedValue(1);
      (mockRedis.setEx as jest.Mock).mockResolvedValue("OK");
      (mockRedis.get as jest.Mock).mockResolvedValue("1");

      const res = await request(app)
        .post("/streams/123/join")
        .set("Authorization", token)
        .send({ userId: "user-1" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("viewerCount");
      expect(res.body).toHaveProperty("streamId", "123");
    });

    it("should return 401 without token", async () => {
      const res = await request(app)
        .post("/streams/123/join")
        .send({ userId: "user-1" });

      expect(res.status).toBe(401);
    });
  });

  describe("POST /streams/:streamId/leave", () => {
    it("should return 200 with viewerCount when user leaves", async () => {
      (mockRedis.sRem as jest.Mock).mockResolvedValue(1);
      (mockRedis.decr as jest.Mock).mockResolvedValue(0);
      (mockRedis.del as jest.Mock).mockResolvedValue(1);
      (mockRedis.get as jest.Mock).mockResolvedValue("0");

      const res = await request(app)
        .post("/streams/123/leave")
        .set("Authorization", token)
        .send({ userId: "user-1" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("viewerCount");
    });

    it("should return 401 without token", async () => {
      const res = await request(app)
        .post("/streams/123/leave")
        .send({ userId: "user-1" });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /streams/:streamId/viewers", () => {
    it("should return viewer count", async () => {
      (mockRedis.get as jest.Mock).mockResolvedValue("42");

      const res = await request(app)
        .get("/streams/123/viewers")
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ streamId: "123", viewerCount: 42 });
    });

    it("should return 401 without token", async () => {
      const res = await request(app).get("/streams/123/viewers");

      expect(res.status).toBe(401);
    });
  });
});
