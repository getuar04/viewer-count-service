import { IViewerRepository } from '../ports';

export class EndStream {
  constructor(private readonly repo: IViewerRepository) {}

  async execute(streamId: string): Promise<void> {
    await this.repo.streamEnded(streamId);
  }
}
