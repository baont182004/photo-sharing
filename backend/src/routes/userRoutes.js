import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import {
    register,
    getUserList,
    getUserById,
    getMyStats,
    searchUsersByName,
} from '../controllers/userController.js';

const router = express.Router();

router.post('/', register);

router.use(verifyToken);

router.get('/list', getUserList);
router.get('/search', searchUsersByName);
router.get('/me/stats', getMyStats);
router.get('/:id', getUserById);

export default router;
