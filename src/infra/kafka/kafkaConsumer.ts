import { Kafka } from 'kafkajs';
import { env } from '../config/env';
import { logger } from '../logger/logger';
import { ViewerEvent } from '../../domain/viewer';
import { RedisViewerRepository } from '../redis/viewerRepository';
import { JoinStream } from '../../app/usecases/joinStream';
import { LeaveStream } from '../../app/usecases/leaveStream';
import { StartStream } from '../../app/usecases/startStream';
import { EndStream } from '../../app/usecases/endStream';

const kafka = new Kafka({ brokers: [env.kafka.broker] });
const consumer = kafka.consumer({ groupId: env.kafka.groupId });
const repo = new RedisViewerRepository();

const joinStream = new JoinStream(repo);
const leaveStream = new LeaveStream(repo);
const startStream = new StartStream(repo);
const endStream = new EndStream(repo);

export const processViewerEvent = async (event: ViewerEvent): Promise<void> => {
  const { type, streamId, userId, creatorId } = event;

  if (!type || !streamId) {
    logger.warn({ event }, 'Invalid Kafka event - missing type or streamId');
    return;
  }

  switch (type) {
    case 'StreamStarted':
      await startStream.execute(streamId);
      break;

    case 'StreamEnded':
      await endStream.execute(streamId);
      break;

    case 'ViewerJoined':
      if (!userId) {
        logger.warn({ event }, 'Invalid ViewerJoined event - missing userId');
        return;
      }
      await joinStream.execute(streamId, userId);
      break;

    case 'ViewerLeft':
      if (!userId) {
        logger.warn({ event }, 'Invalid ViewerLeft event - missing userId');
        return;
      }
      await leaveStream.execute(streamId, userId);
      break;

    case 'ViewerHeartbeat':
      if (!userId) {
        logger.warn({ event }, 'Invalid ViewerHeartbeat event - missing userId');
        return;
      }
      await repo.heartbeat(streamId, userId);
      break;

    default:
      logger.warn({ event }, 'Unknown Kafka event type');
      return;
  }

  logger.info({ type, streamId, userId, creatorId }, 'Event processed');
};

export const startKafkaConsumer = async (): Promise<void> => {
  await consumer.connect();
  await consumer.subscribe({ topic: env.kafka.topic, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      try {
        const event: ViewerEvent = JSON.parse(message.value.toString());
        await processViewerEvent(event);
      } catch (error) {
        logger.error({ error }, 'Failed to process Kafka event');
      }
    },
  });

  logger.info('Kafka consumer started');
};
