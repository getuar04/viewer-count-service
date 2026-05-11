import { IViewerRepository } from '../ports';

export class LeaveStream {
  constructor(private readonly repo: IViewerRepository) {}

  async execute(streamId: string, userId: string): Promise<void> {
    await this.repo.leave(streamId, userId);
  }
}
