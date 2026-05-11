export interface ViewerEvent {
  streamId: string;
  userId: string;
  timestamp: string;
  type: 'ViewerJoined' | 'ViewerLeft' | 'ViewerHeartbeat';
}
