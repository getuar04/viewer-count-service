export interface ViewerEvent {
  type: 'ViewerJoined' | 'ViewerLeft' | 'ViewerHeartbeat' | 'StreamStarted' | 'StreamEnded';
  streamId: string;
  userId: string;
  timestamp: string;
}
