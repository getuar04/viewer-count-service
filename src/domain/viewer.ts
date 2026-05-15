export type ViewerEventType =
  | 'ViewerJoined'
  | 'ViewerLeft'
  | 'ViewerHeartbeat'
  | 'StreamStarted'
  | 'StreamEnded';

export interface ViewerEvent {
  type: ViewerEventType;
  streamId: string;
  userId?: string;
  creatorId?: string;
  timestamp?: string;
}
