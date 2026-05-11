import { Kafka } from 'kafkajs';
import { env } from '../config/env';
import { logger } from '../logger/logger';
import { ViewerEvent } from '../../domain/viewer';
import { JoinStream } from '../../app/usecases/joinStream';
import { LeaveStream } from '../../app/usecases/leaveStream';
import { RedisViewerRepository } from '../persistence/redisViewerRepository';

const kafka = new Kafka({ brokers: [env.kafka.broker] });
const consumer = kafka.consumer({ groupId: env.kafka.groupId });
const repo = new RedisViewerRepository();

const joinStream = new JoinStream(repo);
const leaveStream = new LeaveStream(repo);

export const startKafkaConsumer = async (): Promise<void> => {
  await consumer.connect();
  await consumer.subscribe({ topic: env.kafka.topic, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      const event: ViewerEvent = JSON.parse(message.value.toString());
      const { type, streamId, userId } = event;

      if (type === 'ViewerJoined') {
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
