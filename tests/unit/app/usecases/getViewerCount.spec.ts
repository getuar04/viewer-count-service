import { GetViewerCount } from '../../../../src/app/usecases/getViewerCount';
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

describe('GetViewerCount', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return viewer count', async () => {
    mockRepo.getCount.mockResolvedValue(42);
    const usecase = new GetViewerCount(mockRepo);
    const count = await usecase.execute('stream-1');
    expect(count).toBe(42);
    expect(mockRepo.getCount).toHaveBeenCalledWith('stream-1');
  });

  it('should return 0 when no viewers', async () => {
    mockRepo.getCount.mockResolvedValue(0);
    const usecase = new GetViewerCount(mockRepo);
    const count = await usecase.execute('stream-1');
    expect(count).toBe(0);
  });
});
