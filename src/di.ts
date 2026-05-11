import { RedisViewerRepository } from './infra/persistence/redisViewerRepository';
import { JoinStream } from './app/usecases/joinStream';
import { LeaveStream } from './app/usecases/leaveStream';
import { GetViewerCount } from './app/usecases/getViewerCount';

const repo = new RedisViewerRepository();

export const joinStream = new JoinStream(repo);
export const leaveStream = new LeaveStream(repo);
export const getViewerCount = new GetViewerCount(repo);
