import { StartStream } from '../../../../src/app/usecases/startStream';
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

describe('StartStream', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should call repo.streamStarted with correct params', async () => {
    const usecase = new StartStream(mockRepo);
    await usecase.execute('stream-1');
    expect(mockRepo.streamStarted).toHaveBeenCalledWith('stream-1');
  });
});
