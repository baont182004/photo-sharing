// src/pages/protected/Profile.jsx
import React, { useCallback, useEffect, useState } from "react";
import {
    Box,
    Button,
    CardMedia,
    Divider,
    Paper,
    TextField,
    Typography,
} from "@mui/material";
import { api, getUser, imageUrl } from "../../config/api";
import PhotoComments from "../../components/comments/PhotoComments";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { formatDate } from "../../utils/format";
import ReactionButtons from "../../components/reactions/ReactionButtons";

export default function Profile() {
    const authUser = getUser();
    const [detail, setDetail] = useState(null);
    const [photos, setPhotos] = useState(null);
    const [stats, setStats] = useState(null);
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
        if (!authUser?._id) return;

        (async () => {
            try {
                const u = await api.get(`/user/${authUser._id}`);
                if (alive) setDetail(u);
            } catch {
                if (alive) setDetail(null);
            }
        })();

        return () => {
            alive = false;
        };
    }, [authUser?._id]);

    useEffect(() => {
        let alive = true;
        if (!authUser?._id) return;

        (async () => {
            try {
                const data = await api.get(`/photosOfUser/${authUser._id}`);
                if (alive) setPhotos(data);
            } catch {
                if (alive) setPhotos([]);
            }
        })();

        return () => {
            alive = false;
        };
    }, [authUser?._id]);

    useEffect(() => {
        let alive = true;
        if (!authUser?._id) return;

        (async () => {
            try {
                const data = await api.get("/user/me/stats");
                if (alive) setStats(data);
            } catch {
                if (alive) setStats(null);
            }
        })();

        return () => {
            alive = false;
        };
    }, [authUser?._id]);

    useEffect(() => {
        if (!authUser?._id) return undefined;

        const handleUploaded = (e) => {
            const photo = e.detail;
            if (!photo) return;
            const ownerId = photo.user_id?._id || photo.user_id;
            if (String(ownerId) !== String(authUser._id)) return;
            upsertPhoto(photo);
        };

        window.addEventListener("photouploaded", handleUploaded);
        return () => window.removeEventListener("photouploaded", handleUploaded);
    }, [authUser?._id, upsertPhoto]);

    const canDeletePhoto = (photo) => {
        if (!authUser?._id) return false;
        const ownerId = photo.user_id?._id || photo.user_id;
        return authUser.role === "admin" || String(ownerId) === authUser._id;
    };
    const canEditDescription = (photo) => {
        if (!authUser?._id) return false;
        const ownerId = photo.user_id?._id || photo.user_id;
        return String(ownerId) === authUser._id;
    };

    const updatePhotoInState = (updatedPhoto) => upsertPhoto(updatedPhoto);

    const handlePhotoReaction = useCallback((photoId, nextState, prevState) => {
        setPhotos((prev) =>
            (prev || []).map((p) =>
                p._id === photoId
                    ? {
                          ...p,
                          likeCount: nextState.likeCount,
                          dislikeCount: nextState.dislikeCount,
                          myReaction: nextState.myReaction,
                      }
                    : p
            )
        );

        setStats((prevStats) => {
            if (!prevStats) return prevStats;
            const likeDelta =
                (nextState.likeCount ?? 0) - (prevState?.likeCount ?? 0);
            const dislikeDelta =
                (nextState.dislikeCount ?? 0) - (prevState?.dislikeCount ?? 0);
            const totalLikes = Math.max(
                0,
                (prevStats.totalLikes ?? 0) + likeDelta
            );
            const totalDislikes = Math.max(
                0,
                (prevStats.totalDislikes ?? 0) + dislikeDelta
            );
            return {
                ...prevStats,
                totalLikes,
                totalDislikes,
                totalReactions: totalLikes + totalDislikes,
            };
        });
    }, []);

    const requestDelete = (photoId) => {
        setConfirmDeleteId(photoId);
    };

    const handleDelete = async (photoId) => {
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

    if (!authUser?._id) {
        return <Typography>Đăng nhập để xem hồ sơ của bạn.</Typography>;
    }

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2 }}>
                <Typography variant="h5" gutterBottom>
                    Hồ sơ của bạn
                </Typography>

                <Typography variant="subtitle1">
                    Xin chào{" "}
                    <b>
                        {authUser?.first_name} {authUser?.last_name}
                    </b>{" "}
                    ({authUser?.role === "admin" ? "quản trị" : "người dùng"})
                </Typography>

                {detail && (
                    <Box
                        sx={{
                            mt: 2,
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                            gap: 1.5,
                        }}
                    >
                        <Typography>Địa chỉ: {detail.location || "—"}</Typography>
                        <Typography>Nghề nghiệp: {detail.occupation || "—"}</Typography>
                        <Typography>Mô tả: {detail.description || "—"}</Typography>
                        <Typography>Tên đăng nhập: {detail.login_name}</Typography>
                    </Box>
                )}

                {stats && (
                    <>
                        <Divider sx={{ my: 2 }} />
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "repeat(2, minmax(0, 1fr))",
                                    md: "repeat(4, minmax(0, 1fr))",
                                },
                                gap: 1.5,
                            }}
                        >
                            <Paper sx={{ p: 1.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Bạn bè
                                </Typography>
                                <Typography variant="h6">{stats.friendCount ?? 0}</Typography>
                            </Paper>
                            <Paper sx={{ p: 1.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Ảnh đã đăng
                                </Typography>
                                <Typography variant="h6">{stats.photoCount ?? 0}</Typography>
                            </Paper>
                            <Paper sx={{ p: 1.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Lượt thích
                                </Typography>
                                <Typography variant="h6">{stats.totalLikes ?? 0}</Typography>
                            </Paper>
                            <Paper sx={{ p: 1.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Lượt không thích
                                </Typography>
                                <Typography variant="h6">{stats.totalDislikes ?? 0}</Typography>
                            </Paper>
                        </Box>
                    </>
                )}
            </Paper>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
                <Typography variant="h6" sx={{ alignSelf: "flex-start" }}>
                    Ảnh của bạn
                </Typography>
                {photos === null && <Typography>Đang tải ảnh...</Typography>}
                {photos?.length === 0 && <Typography>Chưa có ảnh nào.</Typography>}

                {photos?.map((photo) => (
                    <Paper
                        key={photo._id}
                        sx={{
                            p: 2,
                            borderRadius: 3,
                            boxShadow: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                            width: "100%",
                            maxWidth: 780,
                        }}
                    >
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Typography variant="caption">{formatDate(photo.date_time)}</Typography>
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
                                            onClick={() => requestDelete(photo._id)}
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
                                height: { xs: 260, sm: 340, md: 420 },
                                objectFit: "contain",
                                borderRadius: 2,
                                bgcolor: "grey.100",
                            }}
                        />

                        {editingDesc[photo._id] ? (
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
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
                            <Typography variant="body2">
                                <b>Mô tả ảnh:</b>{" "}
                                {photo.description ? photo.description : "Chưa có mô tả."}
                            </Typography>
                        )}

                        <ReactionButtons
                            targetType="Photo"
                            targetId={photo._id}
                            initialLikeCount={photo.likeCount || 0}
                            initialDislikeCount={photo.dislikeCount || 0}
                            initialMyReaction={photo.myReaction || 0}
                            onChange={(nextState, prevState) =>
                                handlePhotoReaction(photo._id, nextState, prevState)
                            }
                        />

                        <PhotoComments
                            photoId={photo._id}
                            comments={photo.comments}
                            currentUser={authUser}
                            onEditComment={handleEditComment}
                            onDeleteComment={handleDeleteComment}
                        />
                    </Paper>
                ))}
            </Box>

            <ConfirmDialog
                open={!!confirmDeleteId}
                title="Xóa ảnh"
                description="Bạn có chắc muốn xóa ảnh này không?"
                confirmText="Xóa"
                cancelText="Hủy"
                loading={!!deleting[confirmDeleteId]}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
            />
        </Box>
    );
}
