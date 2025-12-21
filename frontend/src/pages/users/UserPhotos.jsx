// src/pages/users/UserPhotos.jsx
import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
    Typography,
    Paper,
    CardMedia,
    TextField,
    Button,
    Box,
} from "@mui/material";
import { api, getUser, imageUrl } from "../../config/api";
import PhotoComments from "../../components/comments/PhotoComments";
import { formatDate } from "../../utils/format";

export default function UserPhotos() {
    const { userId } = useParams();
    const me = getUser();

    const [photos, setPhotos] = useState(null);
    const [draft, setDraft] = useState({});
    const [submitting, setSubmitting] = useState({});
    const [deleting, setDeleting] = useState({});

    const normalizePhoto = useCallback((p) => ({
        ...p,
        comments: p?.comments || [],
    }), []);

    const upsertPhoto = useCallback((photo) =>
        setPhotos((prev) => {
            const normalized = normalizePhoto(photo);
            const list = prev || [];
            const idx = list.findIndex((p) => p._id === normalized._id);
            if (idx >= 0) {
                const next = [...list];
                next[idx] = normalized;
                return next;
            }
            return [normalized, ...list];
        }), [normalizePhoto]);

    useEffect(() => {
        let alive = true;

        (async () => {
            const data = await api.get(`/photosOfUser/${userId}`);
            if (alive) setPhotos(data);
        })();

        return () => {
            alive = false;
        };
    }, [userId]);

    useEffect(() => {
        const handleUploaded = (e) => {
            const photo = e.detail;
            if (!photo) return;
            const ownerId = photo.user_id?._id || photo.user_id;
            if (String(ownerId) !== String(userId)) return;
            upsertPhoto(photo);
        };
        window.addEventListener("photouploaded", handleUploaded);
        return () => window.removeEventListener("photouploaded", handleUploaded);
    }, [upsertPhoto, userId]);

    const onChangeDraft = (photoId) => (e) =>
        setDraft((p) => ({ ...p, [photoId]: e.target.value }));

    const submitComment = async (photoId) => {
        const text = (draft[photoId] || "").trim();
        if (!text) return;

        setSubmitting((p) => ({ ...p, [photoId]: true }));
        try {
            const updatedPhoto = await api.post(`/commentsOfPhoto/${photoId}`, {
                comment: text,
            });

            setPhotos((prev) =>
                (prev || []).map((p) => (p._id === photoId ? updatedPhoto : p))
            );

            setDraft((p) => ({ ...p, [photoId]: "" }));
        } catch (e) {
            alert(e.message);
        } finally {
            setSubmitting((p) => ({ ...p, [photoId]: false }));
        }
    };

    const updatePhotoInState = (updatedPhoto) => upsertPhoto(updatedPhoto);

    const canDelete = (photo) => {
        if (!me) return false;
        const ownerId = photo.user_id?._id || photo.user_id;
        return me.role === "admin" || String(ownerId) === me._id;
    };

    const handleDeletePhoto = async (photoId) => {
        if (!window.confirm("Delete this photo?")) return;
        setDeleting((p) => ({ ...p, [photoId]: true }));
        try {
            await api.del(`/photos/${photoId}`);
            setPhotos((prev) => (prev || []).filter((p) => p._id !== photoId));
        } catch (e) {
            alert(e.message);
        } finally {
            setDeleting((p) => ({ ...p, [photoId]: false }));
        }
    };

    const handleEditComment = async (photoId, commentId, text) => {
        const updatedPhoto = await api.put(`/commentsOfPhoto/${photoId}/${commentId}`, {
            comment: text,
        });
        updatePhotoInState(updatedPhoto);
    };

    const handleDeleteComment = async (photoId, commentId) => {
        const updatedPhoto = await api.del(`/commentsOfPhoto/${photoId}/${commentId}`);
        updatePhotoInState(updatedPhoto);
    };

    if (!photos) return <div>Loading...</div>;

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {photos.map((photo) => (
                <Paper key={photo._id} sx={{ p: 2, maxWidth: 720, mx: "auto" }}>
                    <CardMedia
                        component="img"
                        image={imageUrl(photo.file_name)}
                        alt={photo.file_name}
                        sx={{
                            width: "100%",
                            height: { xs: 240, sm: 360, md: 480 },
                            objectFit: "contain",
                            borderRadius: 2,
                            bgcolor: "grey.100",
                        }}
                    />

                    {canDelete(photo) && (
                        <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-end" }}>
                            <Button
                                size="small"
                                color="error"
                                onClick={() => handleDeletePhoto(photo._id)}
                                disabled={!!deleting[photo._id]}
                            >
                                Xóa
                            </Button>
                        </Box>
                    )}

                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        {formatDate(photo.date_time)}
                    </Typography>

                    <PhotoComments
                        photoId={photo._id}
                        comments={photo.comments}
                        currentUser={me}
                        onEditComment={handleEditComment}
                        onDeleteComment={handleDeleteComment}
                    />

                    {/* Add comment */}
                    {me && (
                        <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Viết bình luận..."
                                value={draft[photo._id] || ""}
                                onChange={onChangeDraft(photo._id)}
                            />
                            <Button
                                variant="contained"
                                onClick={() => submitComment(photo._id)}
                                disabled={!!submitting[photo._id]}
                            >
                                Đăng
                            </Button>
                        </Box>
                    )}
                </Paper>
            ))}
        </Box>
    );
}
