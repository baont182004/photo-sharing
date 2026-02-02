import express from 'express';
import { verifyToken } from '../middlewares/auth.js';
import {
    register,
    getUserList,
    getUserById,
    getMe,
    updateMe,
    getMyStats,
    searchUsersByName,
    updateAvatar,
} from '../controllers/userController.js';
import { upload } from '../services/uploadService.js';
import { validateImageUpload } from '../middlewares/validateImageUpload.js';

const router = express.Router();

router.post('/', register);

router.use(verifyToken);

router.get('/list', getUserList);
router.get('/search', searchUsersByName);
router.get('/me', getMe);
router.put('/me', updateMe);
router.get('/me/stats', getMyStats);
router.put('/me/avatar', upload.single('avatar'), validateImageUpload, updateAvatar);
router.get('/:id', getUserById);

export default router;
