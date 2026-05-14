import { IViewerRepository } from '../ports';

export class StartStream {
  constructor(private readonly repo: IViewerRepository) {}

  async execute(streamId: string): Promise<void> {
    await this.repo.streamStarted(streamId);
  }
}
