import express from 'express';
import { verifyToken } from '../middlewares/auth.js';
import {
    register,
    getUserList,
    getUserById,
    getMe,
    getMyStats,
    searchUsersByName,
} from '../controllers/userController.js';

const router = express.Router();

router.post('/', register);

router.use(verifyToken);

router.get('/list', getUserList);
router.get('/search', searchUsersByName);
router.get('/me', getMe);
router.get('/me/stats', getMyStats);
router.get('/:id', getUserById);

export default router;
