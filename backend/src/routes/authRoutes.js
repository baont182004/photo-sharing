import express from 'express';
import { logout, logoutAll, refresh, getMe } from '../controllers/authController.js';
import { startGithubAuth, githubCallback } from '../controllers/oauthController.js';
import { verifyToken } from '../middlewares/auth.js';
import { rateLimit } from '../middlewares/rateLimit.js';

const router = express.Router();
const refreshLimiter = rateLimit({ windowMs: 60_000, max: 10 });

router.post('/refresh', refreshLimiter, refresh);
router.post('/logout', logout);
router.post('/logout-all', verifyToken, logoutAll);
router.get('/me', verifyToken, getMe);
router.get('/github', startGithubAuth);
router.get('/github/callback', githubCallback);

export default router;
