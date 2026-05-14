import { EndStream } from '../../../../src/app/usecases/endStream';
import { IViewerRepository } from '../../../../src/app/ports';

const mockRepo: jest.Mocked<IViewerRepository> = {
  join: jest.fn(),
  leave: jest.fn(),
  heartbeat: jest.fn(),
  getCount: jest.fn(),
  streamStarted: jest.fn(),
  streamEnded: jest.fn(),
};

describe('EndStream', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should call repo.streamEnded with correct params', async () => {
    const usecase = new EndStream(mockRepo);
    await usecase.execute('stream-1');
    expect(mockRepo.streamEnded).toHaveBeenCalledWith('stream-1');
  });
});
