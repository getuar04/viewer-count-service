import { IViewerRepository } from '../ports';

export class JoinStream {
  constructor(private readonly repo: IViewerRepository) {}

  async execute(streamId: string, userId: string): Promise<void> {
    await this.repo.join(streamId, userId);
  }
}
