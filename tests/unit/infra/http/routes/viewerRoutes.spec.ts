jest.mock("kafkajs", () => ({
  Kafka: jest.fn().mockImplementation(() => ({
    producer: jest.fn().mockReturnValue({
      connect: jest.fn().mockResolvedValue(undefined),
      send: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
    }),
    consumer: jest.fn().mockReturnValue({
      connect: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn().mockResolvedValue(undefined),
      run: jest.fn().mockResolvedValue(undefined),
    }),
  })),
}));

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

  beforeEach(() => {
    jest.clearAllMocks();
    (mockRedis.get as jest.Mock).mockResolvedValue("1");
    (mockRedis.exists as jest.Mock).mockResolvedValue(1);
  });

  it("publishes ViewerJoined and returns accepted event response", async () => {
    const res = await request(app)
      .post("/streams/123/join")
      .set("Authorization", token);

    expect(res.status).toBe(202);
    expect(res.body).toEqual({
      streamId: "123",
      event: "ViewerJoined",
      status: "event published to Kafka",
      source: "kafka-event-published",
    });
  });

  it("publishes ViewerLeft and returns accepted event response", async () => {
    const res = await request(app)
      .post("/streams/123/leave")
      .set("Authorization", token);

    expect(res.status).toBe(202);
    expect(res.body).toEqual({
      streamId: "123",
      event: "ViewerLeft",
      status: "event published to Kafka",
      source: "kafka-event-published",
    });
  });

  it("publishes ViewerHeartbeat and returns accepted event response", async () => {
    const res = await request(app)
      .post("/streams/123/heartbeat")
      .set("Authorization", token);

    expect(res.status).toBe(202);
    expect(res.body).toEqual({
      streamId: "123",
      event: "ViewerHeartbeat",
      status: "event published to Kafka",
      source: "kafka-event-published",
    });
  });

  it("returns viewer count", async () => {
    (mockRedis.get as jest.Mock).mockResolvedValue("42");

    const res = await request(app)
      .get("/streams/123/viewers")
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      streamId: "123",
      viewerCount: 42,
    });
  });

  it("returns 404 for viewer count when stream is not active", async () => {
    (mockRedis.exists as jest.Mock).mockResolvedValue(0);

    const res = await request(app)
      .get("/streams/456/viewers")
      .set("Authorization", token);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      streamId: "456",
      message: "Stream is not valid",
    });
  });

  it("does not publish join when stream is not active", async () => {
    (mockRedis.exists as jest.Mock).mockResolvedValue(0);

    const res = await request(app)
      .post("/streams/456/join")
      .set("Authorization", token);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      streamId: "456",
      message: "Stream is not valid",
    });
  });

  it("does not publish heartbeat when stream is not active", async () => {
    (mockRedis.exists as jest.Mock).mockResolvedValue(0);

    const res = await request(app)
      .post("/streams/456/heartbeat")
      .set("Authorization", token);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      streamId: "456",
      message: "Stream is not valid",
    });
  });

  it("publishes valid dev trigger event", async () => {
    const body = { type: "ViewerJoined", streamId: "s1", userId: "u1" };

    const res = await request(app)
      .post("/dev/events/trigger")
      .set("Authorization", token)
      .send(body);

    expect(res.status).toBe(202);
    expect(res.body).toEqual({
      status: "event published to Kafka",
      event: {
        type: "ViewerJoined",
        streamId: "s1",
        userId: "u1",
      },
    });
  });

  it("should return swagger spec", async () => {
    const res = await request(app).get("/swagger.json");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/json");
  });

  it("rejects dev trigger event without valid type or streamId", async () => {
    const res = await request(app)
      .post("/dev/events/trigger")
      .set("Authorization", token)
      .send({ type: "Bad" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "Invalid event. Required: valid type and streamId.",
    );
    expect(res.body.validTypes).toContain("ViewerJoined");
  });

  it("rejects user event without userId", async () => {
    const res = await request(app)
      .post("/dev/events/trigger")
      .set("Authorization", token)
      .send({ type: "ViewerHeartbeat", streamId: "s1" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("ViewerHeartbeat requires userId");
  });

  it("requires token for protected endpoints", async () => {
    const responses = await Promise.all([
      request(app).post("/streams/123/join"),
      request(app).post("/streams/123/leave"),
      request(app).post("/streams/123/heartbeat"),
      request(app).post("/dev/events/trigger"),
      request(app).get("/streams/123/viewers"),
    ]);

    responses.forEach((res) => expect(res.status).toBe(401));
  });
});
