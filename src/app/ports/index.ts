export interface IViewerRepository {
  join(streamId: string, userId: string): Promise<void>;
  leave(streamId: string, userId: string): Promise<void>;
  heartbeat(streamId: string, userId: string): Promise<void>;
  getCount(streamId: string): Promise<number>;
}
