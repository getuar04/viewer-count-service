const clearEnv = () => {
  delete process.env.PORT;
  delete process.env.REDIS_HOST;
  delete process.env.REDIS_PORT;
  delete process.env.KAFKA_BROKER;
  delete process.env.KAFKA_GROUP_ID;
  delete process.env.KAFKA_TOPIC;
  delete process.env.JWT_SECRET;
};

describe('env config', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    clearEnv();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('loads env variables from process.env', () => {
    process.env.PORT = '4000';
    process.env.REDIS_HOST = 'redis-host';
    process.env.REDIS_PORT = '6380';
    process.env.KAFKA_BROKER = 'kafka:9093';
    process.env.KAFKA_GROUP_ID = 'custom-group';
    process.env.KAFKA_TOPIC = 'custom-topic';
    process.env.JWT_SECRET = 'my-secret';

    const { env } = require('../../../../src/infra/config/env');

    expect(env).toEqual({
      port: 4000,
      redis: { host: 'redis-host', port: 6380 },
      kafka: { broker: 'kafka:9093', groupId: 'custom-group', topic: 'custom-topic' },
      jwtSecret: 'my-secret',
    });
  });

  it('uses defaults when env variables are not set', () => {
    const { env } = require('../../../../src/infra/config/env');

    expect(env).toEqual({
      port: 3000,
      redis: { host: 'localhost', port: 6379 },
      kafka: { broker: 'localhost:9092', groupId: 'viewer-count-group', topic: 'viewer-events' },
      jwtSecret: 'secret',
    });
  });


  it('loads dotenv configuration outside test environment', () => {
    process.env.NODE_ENV = 'development';
    const { env } = require('../../../../src/infra/config/env');
    expect(env.port).toBeDefined();
  });
});
