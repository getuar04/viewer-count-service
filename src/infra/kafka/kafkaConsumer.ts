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

export const startKafkaConsumer = async (): Promise<void> => {
  await consumer.connect();
  await consumer.subscribe({ topic: env.kafka.topic, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      const event: ViewerEvent = JSON.parse(message.value.toString());
      const { type, streamId, userId } = event;

      if (type === 'StreamStarted') {
        await startStream.execute(streamId);
      } else if (type === 'StreamEnded') {
        await endStream.execute(streamId);
      } else if (type === 'ViewerJoined') {
        await joinStream.execute(streamId, userId);
      } else if (type === 'ViewerLeft') {
        await leaveStream.execute(streamId, userId);
      } else if (type === 'ViewerHeartbeat') {
        await repo.heartbeat(streamId, userId);
      }

      logger.info({ type, streamId, userId }, 'Event processed');
    },
  });

  logger.info('Kafka consumer started');
};
