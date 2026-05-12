import { JoinStream } from '../../../../src/app/usecases/joinStream';
import { IViewerRepository } from '../../../../src/app/ports';

const mockRepo: jest.Mocked<IViewerRepository> = {
  join: jest.fn(),
  leave: jest.fn(),
  heartbeat: jest.fn(),
  getCount: jest.fn(),
};

describe('JoinStream', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should call repo.join with correct params', async () => {
    const usecase = new JoinStream(mockRepo);
    await usecase.execute('stream-1', 'user-1');
    expect(mockRepo.join).toHaveBeenCalledWith('stream-1', 'user-1');
  });

  it('should call repo.join once', async () => {
    const usecase = new JoinStream(mockRepo);
    await usecase.execute('stream-1', 'user-1');
    expect(mockRepo.join).toHaveBeenCalledTimes(1);
  });
});
