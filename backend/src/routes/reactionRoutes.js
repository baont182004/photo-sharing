import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { reactToPhoto, reactToComment } from "../controllers/reactionController.js";

const router = express.Router();

router.use(verifyToken);

const reactionLimiter = rateLimit({ windowMs: 60_000, max: 40 });

router.put("/photos/:photoId/reaction", reactionLimiter, reactToPhoto);
router.put("/comments/:commentId/reaction", reactionLimiter, reactToComment);

export default router;
