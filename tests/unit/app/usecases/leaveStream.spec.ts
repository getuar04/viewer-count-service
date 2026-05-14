import { LeaveStream } from '../../../../src/app/usecases/leaveStream';
import { IViewerRepository } from '../../../../src/app/ports';

const mockRepo: jest.Mocked<IViewerRepository> = {
  join: jest.fn(),
  leave: jest.fn(),
  heartbeat: jest.fn(),
  getCount: jest.fn(),
  streamStarted: jest.fn(),
  streamEnded: jest.fn(),
};

describe('LeaveStream', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should call repo.leave with correct params', async () => {
    const usecase = new LeaveStream(mockRepo);
    await usecase.execute('stream-1', 'user-1');
    expect(mockRepo.leave).toHaveBeenCalledWith('stream-1', 'user-1');
  });

  it('should call repo.leave once', async () => {
    const usecase = new LeaveStream(mockRepo);
    await usecase.execute('stream-1', 'user-1');
    expect(mockRepo.leave).toHaveBeenCalledTimes(1);
  });
});
