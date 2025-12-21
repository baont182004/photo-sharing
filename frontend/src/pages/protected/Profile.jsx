// src/pages/protected/Profile.jsx
import React, { useCallback, useEffect, useState } from "react";
import {
    Paper,
    Typography,
    Box,
    CardMedia,
    Button,
} from "@mui/material";
import { api, getUser, imageUrl } from "../../config/api";
import PhotoComments from "../../components/comments/PhotoComments";
import { formatDate } from "../../utils/format";

export default function Profile() {
    const authUser = getUser();
    const [detail, setDetail] = useState(null);
    const [photos, setPhotos] = useState(null);
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

    const canDelete = (photo) => {
        if (!authUser?._id) return false;
        const ownerId = photo.user_id?._id || photo.user_id;
        return authUser.role === "admin" || String(ownerId) === authUser._id;
    };

    const updatePhotoInState = (updatedPhoto) => upsertPhoto(updatedPhoto);

    const handleDelete = async (photoId) => {
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
                    Xin chào,&nbsp;
                    <b>
                        {authUser?.first_name} {authUser?.last_name}
                    </b>{" "}
                    ({authUser?.role || "user"})
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
            </Paper>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
                <Typography variant="h6" sx={{ alignSelf: "flex-start" }}>
                    Dòng ảnh của bạn
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
                            {canDelete(photo) && (
                                <Button
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    onClick={() => handleDelete(photo._id)}
                                    disabled={!!deleting[photo._id]}
                                >
                                    Xóa
                                </Button>
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
        </Box>
    );
}
