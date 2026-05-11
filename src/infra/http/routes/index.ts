import { Router, Request, Response } from "express";
import { GetViewerCount } from "../../../app/usecases/getViewerCount";
import { JoinStream } from "../../../app/usecases/joinStream";
import { LeaveStream } from "../../../app/usecases/leaveStream";
import { RedisViewerRepository } from "../../persistence/redisViewerRepository";
import { authMiddleware } from "../middlewares/auth";

const router = Router();
const repo = new RedisViewerRepository();
const getViewerCount = new GetViewerCount(repo);
const joinStream = new JoinStream(repo);
const leaveStream = new LeaveStream(repo);

router.post(
  "/streams/:streamId/join",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { streamId } = req.params;
    const { userId } = req.body;
    await joinStream.execute(streamId, userId);
    const count = await getViewerCount.execute(streamId);
    res.json({ streamId, viewerCount: count });
  },
);

router.post(
  "/streams/:streamId/leave",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { streamId } = req.params;
    const { userId } = req.body;
    await leaveStream.execute(streamId, userId);
    const count = await getViewerCount.execute(streamId);
    res.json({ streamId, viewerCount: count });
  },
);

router.get(
  "/streams/:streamId/viewers",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { streamId } = req.params;
    const count = await getViewerCount.execute(streamId);
    res.json({ streamId, viewerCount: count });
  },
);

export default router;
