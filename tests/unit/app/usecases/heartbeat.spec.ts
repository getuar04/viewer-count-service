import { IViewerRepository } from '../../../../src/app/ports';

const mockRepo: jest.Mocked<IViewerRepository> = {
  join: jest.fn(),
  leave: jest.fn(),
  heartbeat: jest.fn(),
  getCount: jest.fn(),
  isStreamActive: jest.fn(),
  streamStarted: jest.fn(),
  streamEnded: jest.fn(),
};

describe('Heartbeat', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should call repo.heartbeat with correct params', async () => {
    await mockRepo.heartbeat('stream-1', 'user-1');
    expect(mockRepo.heartbeat).toHaveBeenCalledWith('stream-1', 'user-1');
  });

  it('should call repo.heartbeat once', async () => {
    await mockRepo.heartbeat('stream-1', 'user-1');
    expect(mockRepo.heartbeat).toHaveBeenCalledTimes(1);
  });
});
