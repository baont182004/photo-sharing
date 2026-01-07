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
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { formatDate } from "../../utils/format";
import ReactionButtons from "../../components/reactions/ReactionButtons";

export default function UserPhotos() {
    const { userId } = useParams();
    const me = getUser();

    const [photos, setPhotos] = useState(null);
    const [draft, setDraft] = useState({});
    const [submitting, setSubmitting] = useState({});
    const [deleting, setDeleting] = useState({});
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [editingDesc, setEditingDesc] = useState({});
    const [descDrafts, setDescDrafts] = useState({});
    const [savingDesc, setSavingDesc] = useState({});

    const normalizePhoto = useCallback(
        (p) => ({
            ...p,
            comments: p?.comments || [],
        }),
        []
    );

    const upsertPhoto = useCallback(
        (photo) =>
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
            }),
        [normalizePhoto]
    );

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
            alert(e.message || "Không thể gửi bình luận.");
        } finally {
            setSubmitting((p) => ({ ...p, [photoId]: false }));
        }
    };

    const updatePhotoInState = (updatedPhoto) => upsertPhoto(updatedPhoto);

    const canDeletePhoto = (photo) => {
        if (!me) return false;
        const ownerId = photo.user_id?._id || photo.user_id;
        return me.role === "admin" || String(ownerId) === me._id;
    };
    const canEditDescription = (photo) => {
        if (!me) return false;
        const ownerId = photo.user_id?._id || photo.user_id;
        return String(ownerId) === me._id;
    };

    const requestDeletePhoto = (photoId) => {
        setConfirmDeleteId(photoId);
    };

    const handleDeletePhoto = async (photoId) => {
        setDeleting((p) => ({ ...p, [photoId]: true }));
        try {
            await api.del(`/photos/${photoId}`);
            setPhotos((prev) => (prev || []).filter((p) => p._id !== photoId));
            alert("Đã xóa ảnh.");
        } catch (e) {
            alert(e.message || "Xóa ảnh thất bại.");
        } finally {
            setDeleting((p) => ({ ...p, [photoId]: false }));
            setConfirmDeleteId(null);
        }
    };

    const startEditDescription = (photo) => {
        setEditingDesc((prev) => ({ ...prev, [photo._id]: true }));
        setDescDrafts((prev) => ({ ...prev, [photo._id]: photo.description || "" }));
    };

    const cancelEditDescription = (photoId) => {
        setEditingDesc((prev) => {
            const next = { ...prev };
            delete next[photoId];
            return next;
        });
        setDescDrafts((prev) => {
            const next = { ...prev };
            delete next[photoId];
            return next;
        });
    };

    const saveDescription = async (photoId) => {
        const description = (descDrafts[photoId] || "").trim();
        setSavingDesc((prev) => ({ ...prev, [photoId]: true }));
        try {
            const updatedPhoto = await api.put(`/photos/${photoId}`, { description });
            updatePhotoInState(updatedPhoto);
            cancelEditDescription(photoId);
        } catch (e) {
            alert(e.message || "Không thể cập nhật mô tả ảnh.");
        } finally {
            setSavingDesc((prev) => ({ ...prev, [photoId]: false }));
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

    if (!photos) return <div>Đang tải ảnh...</div>;

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {photos.map((photo) => (
                <Paper key={photo._id} sx={{ p: 2, maxWidth: 720, mx: "auto" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="caption" display="block">
                            {formatDate(photo.date_time)}
                        </Typography>
                        {(canEditDescription(photo) || canDeletePhoto(photo)) && (
                            <Box sx={{ display: "flex", gap: 1 }}>
                                {canEditDescription(photo) && (
                                    <Button
                                        size="small"
                                        variant="text"
                                        onClick={() => startEditDescription(photo)}
                                        disabled={!!editingDesc[photo._id]}
                                    >
                                        Chỉnh sửa mô tả
                                    </Button>
                                )}
                                {canDeletePhoto(photo) && (
                                    <Button
                                        size="small"
                                        color="error"
                                        variant="outlined"
                                        onClick={() => requestDeletePhoto(photo._id)}
                                        disabled={!!deleting[photo._id]}
                                    >
                                        Xóa ảnh
                                    </Button>
                                )}
                            </Box>
                        )}
                    </Box>

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
                            mt: 1,
                        }}
                    />

                    {editingDesc[photo._id] ? (
                        <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                            <TextField
                                size="small"
                                label="Mô tả ảnh"
                                value={descDrafts[photo._id] || ""}
                                onChange={(e) =>
                                    setDescDrafts((prev) => ({
                                        ...prev,
                                        [photo._id]: e.target.value,
                                    }))
                                }
                                multiline
                                minRows={2}
                            />
                            <Box sx={{ display: "flex", gap: 1 }}>
                                <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => saveDescription(photo._id)}
                                    disabled={!!savingDesc[photo._id]}
                                >
                                    Lưu mô tả
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => cancelEditDescription(photo._id)}
                                    disabled={!!savingDesc[photo._id]}
                                >
                                    Hủy
                                </Button>
                            </Box>
                        </Box>
                    ) : (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            <b>Mô tả:</b> {photo.description ? photo.description : "Ảnh chưa có mô tả."}
                        </Typography>
                    )}

                    <ReactionButtons
                        targetType="Photo"
                        targetId={photo._id}
                        initialLikeCount={photo.likeCount || 0}
                        initialDislikeCount={photo.dislikeCount || 0}
                        initialMyReaction={photo.myReaction || 0}
                    />

                    <PhotoComments
                        photoId={photo._id}
                        comments={photo.comments}
                        currentUser={me}
                        onEditComment={handleEditComment}
                        onDeleteComment={handleDeleteComment}
                    />

                    {me && (
                        <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Viết bình luận cho ảnh này..."
                                value={draft[photo._id] || ""}
                                onChange={onChangeDraft(photo._id)}
                            />
                            <Button
                                variant="contained"
                                onClick={() => submitComment(photo._id)}
                                disabled={!!submitting[photo._id]}
                            >
                                Gửi
                            </Button>
                        </Box>
                    )}
                </Paper>
            ))}

            <ConfirmDialog
                open={!!confirmDeleteId}
                title="Xóa ảnh"
                description="Bạn có chắc muốn xóa ảnh này không?"
                confirmText="Xóa"
                cancelText="Hủy"
                loading={!!deleting[confirmDeleteId]}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => confirmDeleteId && handleDeletePhoto(confirmDeleteId)}
            />
        </Box>
    );
}
