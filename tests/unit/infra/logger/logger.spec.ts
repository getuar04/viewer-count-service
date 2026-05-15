describe('logger', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('exports pino logger instance', () => {
    const { logger } = require('../../../../src/infra/logger/logger');
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
  });
});
