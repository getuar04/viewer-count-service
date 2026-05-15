import { Request, Response } from "express";
import { GetViewerCount } from "../../../app/usecases/getViewerCount";
import { RedisViewerRepository } from "../../redis/viewerRepository";
import { Kafka } from "kafkajs";
import { env } from "../../config/env";
import { logger } from "../../logger/logger";
import { ViewerEvent, ViewerEventType } from "../../../domain/viewer";

const kafka = new Kafka({ brokers: [env.kafka.broker] });
const producer = kafka.producer();

let producerConnected = false;

const repo = new RedisViewerRepository();
const getViewerCount = new GetViewerCount(repo);

const validTypes: ViewerEventType[] = [
  "StreamStarted",
  "StreamEnded",
  "ViewerJoined",
  "ViewerLeft",
  "ViewerHeartbeat",
];

const userEventTypes: ViewerEventType[] = [
  "ViewerJoined",
  "ViewerLeft",
  "ViewerHeartbeat",
];

const getProducer = async () => {
  if (!producerConnected) {
    await producer.connect();
    producerConnected = true;
  }

  return producer;
};

const publishViewerEvent = async (event: ViewerEvent): Promise<void> => {
  const kafkaProducer = await getProducer();

  await kafkaProducer.send({
    topic: env.kafka.topic,
    messages: [
      {
        value: JSON.stringify({
          ...event,
          timestamp: new Date().toISOString(),
        }),
      },
    ],
  });

  logger.info(event, "Published viewer event");
};

const ensureActiveStream = async (
  streamId: string,
  res: Response,
): Promise<boolean> => {
  const isActive = await repo.isStreamActive(streamId);

  if (!isActive) {
    res.status(404).json({
      streamId,
      message: "Stream is not valid",
    });

    return false;
  }

  return true;
};

const publishEventAndReturnAccepted = async (
  res: Response,
  event: ViewerEvent,
  source = "kafka-event-published",
): Promise<void> => {
  if (!(await ensureActiveStream(event.streamId, res))) return;

  await publishViewerEvent(event);

  res.status(202).json({
    streamId: event.streamId,
    event: event.type,
    status: "event published to Kafka",
    source,
  });
};

const requireValidEvent = (event: Partial<ViewerEvent>) => {
  if (!event.type || !validTypes.includes(event.type) || !event.streamId) {
    return {
      valid: false,
      message: "Invalid event. Required: valid type and streamId.",
    };
  }

  if (userEventTypes.includes(event.type) && !event.userId) {
    return {
      valid: false,
      message: `${event.type} requires userId`,
    };
  }

  return { valid: true };
};

export const join = async (req: Request, res: Response): Promise<void> => {
  await publishEventAndReturnAccepted(res, {
    type: "ViewerJoined",
    streamId: req.params.streamId,
    userId: req.userId!,
  });
};

export const leave = async (req: Request, res: Response): Promise<void> => {
  await publishEventAndReturnAccepted(res, {
    type: "ViewerLeft",
    streamId: req.params.streamId,
    userId: req.userId!,
  });
};

export const heartbeat = async (req: Request, res: Response): Promise<void> => {
  const { streamId } = req.params;

  if (!(await ensureActiveStream(streamId, res))) return;

  await publishViewerEvent({
    type: "ViewerHeartbeat",
    streamId,
    userId: req.userId!,
  });

  res.status(202).json({
    streamId,
    event: "ViewerHeartbeat",
    status: "event published to Kafka",
    source: "kafka-event-published",
  });
};

export const getViewers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { streamId } = req.params;

  if (!(await ensureActiveStream(streamId, res))) return;

  const count = await getViewerCount.execute(streamId);

  res.json({
    streamId,
    viewerCount: count,
  });
};

// Dev-only generic trigger for Postman/Kafka flow testing.
// Example body: { "type": "ViewerJoined", "streamId": "s1", "userId": "u1" }
export const triggerEvent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const event = req.body as Partial<ViewerEvent>;
  const validation = requireValidEvent(event);

  if (!validation.valid) {
    res.status(400).json({
      message: validation.message,
      validTypes,
    });

    return;
  }

  const viewerEvent = event as ViewerEvent;

  await publishViewerEvent(viewerEvent);

  res.status(202).json({
    status: "event published to Kafka",
    event: {
      type: viewerEvent.type,
      streamId: viewerEvent.streamId,
      userId: viewerEvent.userId,
      creatorId: viewerEvent.creatorId,
    },
  });
};
