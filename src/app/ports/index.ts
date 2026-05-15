export interface IViewerRepository {
  join(streamId: string, userId: string): Promise<void>;
  leave(streamId: string, userId: string): Promise<void>;
  heartbeat(streamId: string, userId: string): Promise<void>;
  getCount(streamId: string): Promise<number>;
  isStreamActive(streamId: string): Promise<boolean>;
  streamStarted(streamId: string): Promise<void>;
  streamEnded(streamId: string): Promise<void>;
}
