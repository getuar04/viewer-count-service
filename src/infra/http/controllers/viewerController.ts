import { Request, Response } from 'express';
import { JoinStream } from '../../../app/usecases/joinStream';
import { LeaveStream } from '../../../app/usecases/leaveStream';
import { GetViewerCount } from '../../../app/usecases/getViewerCount';
import { StartStream } from '../../../app/usecases/startStream';
import { EndStream } from '../../../app/usecases/endStream';
import { RedisViewerRepository } from '../../redis/viewerRepository';

const repo = new RedisViewerRepository();
const joinStream = new JoinStream(repo);
const leaveStream = new LeaveStream(repo);
const getViewerCount = new GetViewerCount(repo);
const startStream = new StartStream(repo);
const endStream = new EndStream(repo);

export const join = async (req: Request, res: Response): Promise<void> => {
  const { streamId } = req.params;
  const userId = req.userId!;
  await joinStream.execute(streamId, userId);
  const count = await getViewerCount.execute(streamId);
  res.json({ streamId, viewerCount: count });
};

export const leave = async (req: Request, res: Response): Promise<void> => {
  const { streamId } = req.params;
  const userId = req.userId!;
  await leaveStream.execute(streamId, userId);
  const count = await getViewerCount.execute(streamId);
  res.json({ streamId, viewerCount: count });
};

export const heartbeat = async (req: Request, res: Response): Promise<void> => {
  const { streamId } = req.params;
  const userId = req.userId!;
  await repo.heartbeat(streamId, userId);
  res.json({ streamId, status: 'ok' });
};

export const getViewers = async (req: Request, res: Response): Promise<void> => {
  const { streamId } = req.params;
  const count = await getViewerCount.execute(streamId);
  res.json({ streamId, viewerCount: count });
};

export const start = async (req: Request, res: Response): Promise<void> => {
  const { streamId } = req.params;
  await startStream.execute(streamId);
  res.json({ streamId, status: 'stream started' });
};

export const end = async (req: Request, res: Response): Promise<void> => {
  const { streamId } = req.params;
  await endStream.execute(streamId);
  res.json({ streamId, status: 'stream ended' });
};
