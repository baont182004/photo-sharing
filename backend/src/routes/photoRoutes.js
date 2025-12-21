import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import crypto from 'crypto';

import { verifyToken } from '../middleware/verifyToken.js';
import {
    uploadNewPhoto,
    getPhotosOfUser,
    addComment,
    deletePhoto,
    updateComment,
    deleteComment,
} from '../controllers/photoController.js';


const router = express.Router();

const imagesDir = path.join(process.cwd(), 'images');
fs.mkdirSync(imagesDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, imagesDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.jpg';
        const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
        cb(null, name);
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype?.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    },
});

router.use(verifyToken);
router.post('/photos/new', upload.single('uploadedphoto'), uploadNewPhoto);
router.get('/photosOfUser/:id', getPhotosOfUser);
router.post('/commentsOfPhoto/:photo_id', addComment);
router.put('/commentsOfPhoto/:photo_id/:comment_id', updateComment);
router.delete('/commentsOfPhoto/:photo_id/:comment_id', deleteComment);
router.delete('/photos/:id', deletePhoto);

export default router;
