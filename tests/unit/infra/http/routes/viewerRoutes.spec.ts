jest.mock("kafkajs", () => ({
  Kafka: jest.fn().mockImplementation(() => ({
    producer: jest.fn().mockReturnValue({
      connect: jest.fn().mockResolvedValue(undefined),
      send: jest.fn().mockResolvedValue(undefined),
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

import { Request, Response } from "express";
import {
  start,
  end,
} from "../../../../../src/infra/http/controllers/viewerController";
import { redisClient } from "../../../../../src/infra/redis/redisClient";

const mockRedis = redisClient as jest.Mocked<typeof redisClient>;

const mockReq = (streamId: string) =>
  ({ params: { streamId }, userId: "123" }) as unknown as Request;

const mockRes = () => {
  const res = {} as Response;
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  return res;
};

describe("viewerController", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("start", () => {
    it("should call streamStarted and return stream started", async () => {
      (mockRedis.set as jest.Mock).mockResolvedValue("OK");
      const req = mockReq("stream-1");
      const res = mockRes();
      await start(req, res);
      expect(mockRedis.set).toHaveBeenCalledWith(
        "active_stream:stream-1",
        "alive",
      );
      expect(res.json).toHaveBeenCalledWith({
        streamId: "stream-1",
        status: "stream started",
      });
    });
  });

  describe("end", () => {
    it("should call streamEnded and return stream ended", async () => {
      (mockRedis.del as jest.Mock).mockResolvedValue(1);
      const req = mockReq("stream-1");
      const res = mockRes();
      await end(req, res);
      expect(mockRedis.del).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        streamId: "stream-1",
        status: "stream ended",
      });
    });
  });
});
