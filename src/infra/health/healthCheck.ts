import { Router, Request, Response } from 'express';
import { redisClient } from '../redis/redisClient';

const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
  try {
    await redisClient.ping();
    res.json({ status: 'ok', redis: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', redis: 'disconnected' });
  }
});

export default router;
