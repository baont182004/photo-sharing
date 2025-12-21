import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Photo from '../models/Photo.js';

const imagesDir = path.join(process.cwd(), 'images');
const COMMENT_FIELDS = '_id first_name last_name login_name';

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const isOwnerOrAdmin = (resourceUserId, user) =>
    !!user && (user.role === 'admin' || resourceUserId?.toString() === user._id);

function shapePhoto(doc) {
    if (!doc) return null;
    const p = doc.toObject ? doc.toObject() : doc;
    return {
        ...p,
        comments: (p.comments || []).map((c) => ({
            _id: c._id,
            comment: c.comment,
            date_time: c.date_time,
            user: c.user || c.user_id,
        })),
    };
}

async function fetchPhotoWithComments(photoId) {
    return Photo.findById(photoId)
        .populate('comments.user_id', COMMENT_FIELDS)
        .lean();
}

// GET /photosOfUser/:id
export async function getPhotosOfUser(req, res) {
    try {
        const photos = await Photo.find({ user_id: req.params.id })
            .sort({ date_time: -1 })
            .populate('comments.user_id', COMMENT_FIELDS)
            .lean();

        const shaped = photos.map((p) => shapePhoto(p));

        return res.status(200).json(shaped);
    } catch (err) {
        console.error('photosOfUser error:', err);
        return res.status(500).send('Server error');
    }
}



// POST /commentsOfPhoto/:photo_id
export async function addComment(req, res) {
    try {
        const { comment } = req.body || {};
        if (!comment || typeof comment !== 'string' || comment.trim() === '') {
            return res.status(400).send('Empty comment');
        }

        const photo = await Photo.findById(req.params.photo_id);
        if (!photo) return res.status(400).send('Photo not found');

        const userId = req.user?._id;
        if (!userId) return res.sendStatus(401);

        photo.comments.push({
            comment: comment.trim(),
            date_time: new Date(),
            user_id: userId,
        });

        await photo.save();

        const updated = await fetchPhotoWithComments(req.params.photo_id);
        return res.status(200).json(shapePhoto(updated));
    } catch (err) {
        console.error('addComment error:', err);
        return res.status(500).send('Server error');
    }
}

// Post /photos/new
export async function uploadNewPhoto(req, res) {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded');
        }
        const userId = req.user?._id;
        if (!userId) return res.sendStatus(401);

        const photo = await Photo.create({
            file_name: req.file.filename,
            date_time: new Date(),
            user_id: userId,
            comments: [],
        });

        return res.status(201).json(photo);
    } catch (err) {
        console.error('uploadNewPhoto error:', err);
        return res.status(500).send('Server error');
    }
}

// DELETE /photos/:id
export async function deletePhoto(req, res) {
    try {
        const photoId = req.params.id;
        if (!isValidObjectId(photoId)) {
            return res.status(400).json({ error: 'Invalid photo id' });
        }

        const photo = await Photo.findById(photoId);
        if (!photo) return res.status(404).json({ error: 'Photo not found' });

        if (!isOwnerOrAdmin(photo.user_id, req.user)) {
            return res.status(403).json({ error: 'Not allowed to delete this photo' });
        }

        await Photo.deleteOne({ _id: photoId });

        if (photo.file_name) {
            const filePath = path.join(imagesDir, photo.file_name);
            fs.promises.unlink(filePath).catch(() => { });
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('deletePhoto error:', err);
        return res.status(500).send('Server error');
    }
}

// PUT /commentsOfPhoto/:photo_id/:comment_id
export async function updateComment(req, res) {
    try {
        const { photo_id: photoId, comment_id: commentId } = req.params;
        if (!isValidObjectId(photoId) || !isValidObjectId(commentId)) {
            return res.status(400).json({ error: 'Invalid id' });
        }

        const { comment } = req.body || {};
        if (!comment || typeof comment !== 'string' || comment.trim() === '') {
            return res.status(400).json({ error: 'Empty comment' });
        }

        const photo = await Photo.findById(photoId);
        if (!photo) return res.status(404).json({ error: 'Photo not found' });

        const cmt = photo.comments.id(commentId);
        if (!cmt) return res.status(404).json({ error: 'Comment not found' });

        if (!isOwnerOrAdmin(cmt.user_id, req.user)) {
            return res.status(403).json({ error: 'Not allowed to edit this comment' });
        }

        cmt.comment = comment.trim();
        await photo.save();

        const updated = await fetchPhotoWithComments(photoId);
        return res.status(200).json(shapePhoto(updated));
    } catch (err) {
        console.error('updateComment error:', err);
        return res.status(500).send('Server error');
    }
}

// DELETE /commentsOfPhoto/:photo_id/:comment_id
export async function deleteComment(req, res) {
    try {
        const { photo_id: photoId, comment_id: commentId } = req.params;
        if (!isValidObjectId(photoId) || !isValidObjectId(commentId)) {
            return res.status(400).json({ error: 'Invalid id' });
        }

        const photo = await Photo.findById(photoId);
        if (!photo) return res.status(404).json({ error: 'Photo not found' });

        const cmt = photo.comments.id(commentId);
        if (!cmt) return res.status(404).json({ error: 'Comment not found' });

        if (!isOwnerOrAdmin(cmt.user_id, req.user)) {
            return res.status(403).json({ error: 'Not allowed to delete this comment' });
        }

        cmt.remove();
        await photo.save();

        const updated = await fetchPhotoWithComments(photoId);
        return res.status(200).json(shapePhoto(updated));
    } catch (err) {
        console.error('deleteComment error:', err);
        return res.status(500).send('Server error');
    }
}
