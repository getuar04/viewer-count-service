describe("env config", () => {
  beforeEach(() => jest.resetModules());

  it("should load env variables", () => {
    process.env.PORT = "4000";
    process.env.REDIS_HOST = "redis-host";
    process.env.REDIS_PORT = "6380";
    process.env.KAFKA_BROKER = "kafka:9093";
    process.env.KAFKA_GROUP_ID = "test-group";
    process.env.KAFKA_TOPIC = "test-topic";
    process.env.JWT_SECRET = "my-secret";

    const { env } = require("../../../../src/infra/config/env");

    expect(env.port).toBe(4000);
    expect(env.redis.host).toBe("redis-host");
    expect(env.redis.port).toBe(6380);
    expect(env.kafka.broker).toBe("kafka:9093");
    expect(env.jwtSecret).toBe("my-secret");
  });

  it("should use default values when env vars not set", () => {
    delete process.env.PORT;
    delete process.env.REDIS_HOST;
    delete process.env.JWT_SECRET;

    const { env } = require("../../../../src/infra/config/env");

    expect(env.port).toBe(3000);
    expect(env.redis.host).toBe("localhost");
    expect(env.jwtSecret).toBeDefined();
  });
});
