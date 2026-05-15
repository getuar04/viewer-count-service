const mockListen = jest.fn((_port: number, cb: Function) => cb());
const mockConnectRedis = jest.fn().mockResolvedValue(undefined);
const mockStartKafkaConsumer = jest.fn().mockResolvedValue(undefined);
const mockStartKeyspaceListener = jest.fn().mockResolvedValue(undefined);
const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

jest.mock('../../src/infra/redis/redisClient', () => ({
  redisClient: { ping: jest.fn() },
  connectRedis: mockConnectRedis,
}));

jest.mock('../../src/infra/kafka/kafkaConsumer', () => ({
  startKafkaConsumer: mockStartKafkaConsumer,
}));

jest.mock('../../src/infra/redis/redisSubscriber', () => ({
  startKeyspaceListener: mockStartKeyspaceListener,
}));

jest.mock('../../src/infra/logger/logger', () => ({ logger: mockLogger }));

jest.mock('../../src/infra/config/env', () => ({
  env: {
    jwtSecret: 'test-secret',
    redis: { host: 'localhost', port: 6379 },
    kafka: { broker: 'localhost:9092', groupId: 'test', topic: 'test' },
    port: 3000,
  },
}));

jest.mock('../../src/app', () => ({ __esModule: true, default: { listen: mockListen } }));

describe('index bootstrap', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    exitSpy.mockRestore();
  });

  it('bootstraps redis, keyspace listener, kafka consumer and HTTP server', async () => {
    const { bootstrap } = require('../../src/index');

    await bootstrap();

    expect(mockConnectRedis).toHaveBeenCalled();
    expect(mockStartKeyspaceListener).toHaveBeenCalled();
    expect(mockStartKafkaConsumer).toHaveBeenCalled();
    expect(mockListen).toHaveBeenCalledWith(3000, expect.any(Function));
    expect(mockLogger.info).toHaveBeenCalledWith('Viewer Count Service running on port 3000');
  });

  it('logs and exits when start bootstrap fails', async () => {
    mockConnectRedis.mockRejectedValueOnce(new Error('redis down'));
    const { start } = require('../../src/index');

    start();
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockLogger.error).toHaveBeenCalledWith(expect.any(Object), 'Failed to start service');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });


  it('auto-starts outside test environment', async () => {
    process.env.NODE_ENV = 'development';
    require('../../src/index');
    await new Promise((resolve) => setImmediate(resolve));
    expect(mockConnectRedis).toHaveBeenCalled();
  });
});
