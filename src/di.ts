import { RedisViewerRepository } from './infra/redis/viewerRepository';
import { JoinStream } from './app/usecases/joinStream';
import { LeaveStream } from './app/usecases/leaveStream';
import { GetViewerCount } from './app/usecases/getViewerCount';
import { StartStream } from './app/usecases/startStream';
import { EndStream } from './app/usecases/endStream';

const repo = new RedisViewerRepository();

export const joinStream = new JoinStream(repo);
export const leaveStream = new LeaveStream(repo);
export const getViewerCount = new GetViewerCount(repo);
export const startStream = new StartStream(repo);
export const endStream = new EndStream(repo);
