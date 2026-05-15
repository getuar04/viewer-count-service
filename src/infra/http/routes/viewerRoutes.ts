import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import * as viewerController from "../controllers/viewerController";
import { swaggerSpec } from "../swagger";

const router = Router();

router.post("/streams/:streamId/join", authMiddleware, viewerController.join);
router.post("/streams/:streamId/leave", authMiddleware, viewerController.leave);
router.post(
  "/streams/:streamId/heartbeat",
  authMiddleware,
  viewerController.heartbeat,
);

router.post(
  "/dev/events/trigger",
  authMiddleware,
  viewerController.triggerEvent,
);

router.get(
  "/streams/:streamId/viewers",
  authMiddleware,
  viewerController.getViewers,
);

router.get("/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

export default router;
