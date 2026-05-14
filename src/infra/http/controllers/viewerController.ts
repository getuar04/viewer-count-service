import { Request, Response } from 'express';
import { GetViewerCount } from '../../../app/usecases/getViewerCount';
import { StartStream } from '../../../app/usecases/startStream';
import { EndStream } from '../../../app/usecases/endStream';
import { RedisViewerRepository } from '../../redis/viewerRepository';
import { Kafka } from 'kafkajs';
import { env } from '../../config/env';
import { logger } from '../../logger/logger';

const kafka = new Kafka({ brokers: [env.kafka.broker] });
const producer = kafka.producer();
let producerConnected = false;

const getProducer = async () => {
  if (!producerConnected) {
    await producer.connect();
    producerConnected = true;
  }
  return producer;
};

const repo = new RedisViewerRepository();
const getViewerCount = new GetViewerCount(repo);
const startStream = new StartStream(repo);
const endStream = new EndStream(repo);

export const join = async (req: Request, res: Response): Promise<void> => {
  const { streamId } = req.params;
  const userId = req.userId!;
  const p = await getProducer();
  await p.send({
    topic: env.kafka.topic,
    messages: [{ value: JSON.stringify({ type: 'ViewerJoined', streamId, userId, timestamp: new Date().toISOString() }) }],
  });
  logger.info({ streamId, userId }, 'Published ViewerJoined');
  const count = await getViewerCount.execute(streamId);
  res.json({ streamId, viewerCount: count });
};

export const leave = async (req: Request, res: Response): Promise<void> => {
  const { streamId } = req.params;
  const userId = req.userId!;
  const p = await getProducer();
  await p.send({
    topic: env.kafka.topic,
    messages: [{ value: JSON.stringify({ type: 'ViewerLeft', streamId, userId, timestamp: new Date().toISOString() }) }],
  });
  logger.info({ streamId, userId }, 'Published ViewerLeft');
  const count = await getViewerCount.execute(streamId);
  res.json({ streamId, viewerCount: count });
};

export const heartbeat = async (req: Request, res: Response): Promise<void> => {
  const { streamId } = req.params;
  const userId = req.userId!;
  const p = await getProducer();
  await p.send({
    topic: env.kafka.topic,
    messages: [{ value: JSON.stringify({ type: 'ViewerHeartbeat', streamId, userId, timestamp: new Date().toISOString() }) }],
  });
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