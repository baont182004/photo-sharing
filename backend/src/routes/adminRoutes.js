import express from 'express';
import { login, logout } from '../controllers/authController.js';
import { getAdminUsers } from '../controllers/adminController.js';
import { verifyAdmin } from '../middlewares/auth.js';
import adminStatsRoutes from './adminStatsRoutes.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/users', verifyAdmin, getAdminUsers);
router.use('/stats', verifyAdmin, adminStatsRoutes);

export default router;
