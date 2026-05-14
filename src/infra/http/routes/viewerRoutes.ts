import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import * as viewerController from '../controllers/viewerController';

const router = Router();

router.post('/streams/:streamId/start', authMiddleware, viewerController.start);
router.post('/streams/:streamId/end', authMiddleware, viewerController.end);
router.post('/streams/:streamId/join', authMiddleware, viewerController.join);
router.post('/streams/:streamId/leave', authMiddleware, viewerController.leave);
router.post('/streams/:streamId/heartbeat', authMiddleware, viewerController.heartbeat);
router.get('/streams/:streamId/viewers', authMiddleware, viewerController.getViewers);

export default router;
