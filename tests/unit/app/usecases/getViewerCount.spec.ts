import { GetViewerCount } from '../../../../src/app/usecases/getViewerCount';
import { IViewerRepository } from '../../../../src/app/ports';

const mockRepo: jest.Mocked<IViewerRepository> = {
  join: jest.fn(),
  leave: jest.fn(),
  heartbeat: jest.fn(),
  getCount: jest.fn().mockResolvedValue(42),
};

describe('GetViewerCount', () => {
  it('should return viewer count for a stream', async () => {
    const usecase = new GetViewerCount(mockRepo);
    const count = await usecase.execute('stream-1');
    expect(count).toBe(42);
    expect(mockRepo.getCount).toHaveBeenCalledWith('stream-1');
  });
});
