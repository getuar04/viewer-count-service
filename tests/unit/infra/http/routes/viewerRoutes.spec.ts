jest.mock("../../../../../src/infra/redis/redisClient", () => ({
  redisClient: {
    sAdd: jest.fn(),
    sRem: jest.fn(),
    incr: jest.fn(),
    decr: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    exists: jest.fn(),
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
import viewerRoutes from "../../../../../src/infra/http/routes/viewerRoutes";
import { redisClient } from "../../../../../src/infra/redis/redisClient";

const mockRedis = redisClient as jest.Mocked<typeof redisClient>;
const token = "Bearer valid-token";

describe("viewerRoutes", () => {
  const app = express();
  app.use(express.json());
  app.use(viewerRoutes);

  beforeEach(() => jest.clearAllMocks());

  describe("POST /streams/:streamId/start", () => {
    it("should return 200 when stream started", async () => {
      (mockRedis.set as jest.Mock).mockResolvedValue("OK");
      const res = await request(app)
        .post("/streams/123/start")
        .set("Authorization", token);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("status", "stream started");
    });

    it("should return 401 without token", async () => {
      const res = await request(app).post("/streams/123/start");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /streams/:streamId/end", () => {
    it("should return 200 when stream ended", async () => {
      (mockRedis.del as jest.Mock).mockResolvedValue(1);
      const res = await request(app)
        .post("/streams/123/end")
        .set("Authorization", token);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("status", "stream ended");
    });

    it("should return 401 without token", async () => {
      const res = await request(app).post("/streams/123/end");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /streams/:streamId/join", () => {
    it("should return 200 when user joins", async () => {
      (mockRedis.exists as jest.Mock).mockResolvedValue(1);
      (mockRedis.sAdd as jest.Mock).mockResolvedValue(1);
      (mockRedis.incr as jest.Mock).mockResolvedValue(1);
      (mockRedis.setEx as jest.Mock).mockResolvedValue("OK");
      (mockRedis.get as jest.Mock).mockResolvedValue("1");
      const res = await request(app)
        .post("/streams/123/join")
        .set("Authorization", token);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("viewerCount");
    });

    it("should return 401 without token", async () => {
      const res = await request(app).post("/streams/123/join");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /streams/:streamId/leave", () => {
    it("should return 200 when user leaves", async () => {
      (mockRedis.sRem as jest.Mock).mockResolvedValue(1);
      (mockRedis.decr as jest.Mock).mockResolvedValue(0);
      (mockRedis.del as jest.Mock).mockResolvedValue(1);
      (mockRedis.get as jest.Mock).mockResolvedValue("0");
      const res = await request(app)
        .post("/streams/123/leave")
        .set("Authorization", token);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("viewerCount");
    });

    it("should return 401 without token", async () => {
      const res = await request(app).post("/streams/123/leave");
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
