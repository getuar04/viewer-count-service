import { IViewerRepository } from '../ports';

export class GetViewerCount {
  constructor(private readonly repo: IViewerRepository) {}

  async execute(streamId: string): Promise<number> {
    return this.repo.getCount(streamId);
  }
}
