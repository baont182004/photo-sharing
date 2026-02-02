// src/pages/protected/Profile.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Box,
    Button,
    CardMedia,
    Divider,
    Paper,
    TextField,
    Typography,
    Avatar,
} from "@mui/material";
import { api, getUser, imageUrl, refreshMe, uploadAvatar } from "../../config/api";
import { API_PATHS } from "../../config/apiPaths";
import PhotoComments from "../../components/comments/PhotoComments";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { formatDate } from "../../utils/format";
import ReactionButtons from "../../components/reactions/ReactionButtons";
import useToastErrors from "../../hooks/useToastErrors";
import usePhotos from "../../hooks/usePhotos";

export default function Profile() {
    const authUser = getUser();
    const { showError, showSuccess } = useToastErrors();
    const [detail, setDetail] = useState(null);
    const { photos, setPhotos, upsert, remove } = usePhotos(null);
    const [stats, setStats] = useState(null);
    const [deleting, setDeleting] = useState({});
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [editingDesc, setEditingDesc] = useState({});
    const [descDrafts, setDescDrafts] = useState({});
    const [savingDesc, setSavingDesc] = useState({});
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileDraft, setProfileDraft] = useState({});
    const [savingProfile, setSavingProfile] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const avatarInputRef = useRef(null);

    const normalizePhoto = useCallback(
        (p) => ({
            ...p,
            comments: p?.comments || [],
        }),
        []
    );

    const upsertPhoto = useCallback(
        (photo) => upsert(normalizePhoto(photo)),
        [normalizePhoto, upsert]
    );

    useEffect(() => {
        let alive = true;
        if (!authUser?._id) return;

        (async () => {
            try {
                const u = await api.get(API_PATHS.user.byId(authUser._id));
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
                const data = await api.get(API_PATHS.photos.ofUser(authUser._id));
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
                const data = await api.get(API_PATHS.user.meStats());
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

    const handlePickAvatar = () => avatarInputRef.current?.click();

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showError(null, "Ảnh đại diện phải nhỏ hơn 5MB.");
            return;
        }

        setAvatarUploading(true);
        try {
            await uploadAvatar(file);
            const me = await refreshMe();
            if (me?._id) {
                const updated = await api.get(API_PATHS.user.byId(me._id));
                setDetail(updated);
            }
            showSuccess("Đã cập nhật ảnh đại diện.");
        } catch (err) {
            showError(err, "Không thể cập nhật ảnh đại diện.");
        } finally {
            setAvatarUploading(false);
        }
    };

    const startEditProfile = () => {
        if (!detail) return;
        setProfileDraft({
            ...(isOAuthUser
                ? {}
                : {
                      first_name: detail.first_name || "",
                      last_name: detail.last_name || "",
                  }),
            location: detail.location || "",
            occupation: detail.occupation || "",
            description: detail.description || "",
        });
        setEditingProfile(true);
    };

    const cancelEditProfile = () => {
        setEditingProfile(false);
        setProfileDraft({});
    };

    const handleProfileFieldChange = (field) => (e) => {
        setProfileDraft((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const saveProfile = async () => {
        const firstName = (profileDraft.first_name || "").trim();
        const lastName = (profileDraft.last_name || "").trim();
        if (!isOAuthUser && (!firstName || !lastName)) {
            showError(null, "Họ và tên là bắt buộc.");
            return;
        }

        setSavingProfile(true);
        try {
            const payload = {
                ...(isOAuthUser
                    ? {}
                    : {
                          first_name: firstName,
                          last_name: lastName,
                      }),
                location: (profileDraft.location || "").trim(),
                occupation: (profileDraft.occupation || "").trim(),
                description: (profileDraft.description || "").trim(),
            };
            const updated = await api.put(API_PATHS.user.me(), payload);
            setDetail(updated);
            await refreshMe();
            showSuccess("Đã cập nhật hồ sơ.");
            setEditingProfile(false);
        } catch (err) {
            showError(err, "Không thể cập nhật hồ sơ.");
        } finally {
            setSavingProfile(false);
        }
    };

    const updatePhotoInState = (updatedPhoto) =>
        upsert(normalizePhoto(updatedPhoto));

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
            await api.del(API_PATHS.photos.byId(photoId));
            remove(photoId);
            showSuccess("Đã xóa ảnh.");
        } catch (e) {
            showError(e, "Xóa ảnh thất bại.");
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
            const updatedPhoto = await api.put(API_PATHS.photos.byId(photoId), { description });
            updatePhotoInState(updatedPhoto);
            cancelEditDescription(photoId);
        } catch (e) {
            showError(e, "Không thể cập nhật mô tả ảnh.");
        } finally {
            setSavingDesc((prev) => ({ ...prev, [photoId]: false }));
        }
    };

    const handleEditComment = async (photoId, commentId, text) => {
        const updatedPhoto = await api.put(API_PATHS.comments.byId(photoId, commentId), {
            comment: text,
        });
        updatePhotoInState(updatedPhoto);
    };

    const handleDeleteComment = async (photoId, commentId) => {
        const updatedPhoto = await api.del(API_PATHS.comments.byId(photoId, commentId));
        updatePhotoInState(updatedPhoto);
    };

    if (!authUser?._id) {
        return <Typography>Đăng nhập để xem hồ sơ của bạn.</Typography>;
    }
    const displayName =
        detail?.display_name ||
        authUser?.display_name ||
        `${authUser?.first_name || ""} ${authUser?.last_name || ""}`.trim() ||
        "User";
    const handleText = detail?.handle || authUser?.handle || "";
    const authProvider = detail?.auth_provider || authUser?.auth_provider || "local";
    const isOAuthUser = authProvider !== "local" && authProvider !== "admin";

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2 }}>
                <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                    <Avatar
                        src={detail?.avatar_url || authUser?.avatar_url || ""}
                        alt={displayName}
                        sx={{ width: 72, height: 72 }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h5" gutterBottom>
                            Hồ sơ của bạn
                        </Typography>
                        <Typography variant="subtitle1">
                            Xin chào <b>{displayName}</b>{" "}
                            ({authUser?.role === "admin" ? "quản trị" : "người dùng"})
                        </Typography>
                        {handleText && (
                            <Typography variant="body2" color="text.secondary">
                                @{handleText}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: "auto" }}>
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={handleAvatarChange}
                            aria-label="Chọn ảnh đại diện"
                        />
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handlePickAvatar}
                            disabled={avatarUploading}
                        >
                            {avatarUploading ? "Đang cập nhật..." : "Đổi ảnh đại diện"}
                        </Button>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={startEditProfile}
                            disabled={!detail || editingProfile}
                        >
                            Chỉnh sửa hồ sơ
                        </Button>
                    </Box>
                </Box>

                {detail && !editingProfile && (
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
                        {!isOAuthUser && (
                            <Typography>Tên đăng nhập: {detail.login_name}</Typography>
                        )}
                    </Box>
                )}

                {detail && editingProfile && (
                    <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                        {!isOAuthUser && (
                            <>
                                <TextField
                                    label="Họ"
                                    size="small"
                                    value={profileDraft.first_name || ""}
                                    onChange={handleProfileFieldChange("first_name")}
                                    required
                                />
                                <TextField
                                    label="Tên"
                                    size="small"
                                    value={profileDraft.last_name || ""}
                                    onChange={handleProfileFieldChange("last_name")}
                                    required
                                />
                            </>
                        )}
                        <TextField
                            label="Địa chỉ"
                            size="small"
                            value={profileDraft.location || ""}
                            onChange={handleProfileFieldChange("location")}
                        />
                        <TextField
                            label="Nghề nghiệp"
                            size="small"
                            value={profileDraft.occupation || ""}
                            onChange={handleProfileFieldChange("occupation")}
                        />
                        <TextField
                            label="Mô tả"
                            size="small"
                            value={profileDraft.description || ""}
                            onChange={handleProfileFieldChange("description")}
                            multiline
                            minRows={2}
                            sx={{ gridColumn: { xs: "1 / -1", sm: "1 / -1" } }}
                        />
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <Button
                                variant="contained"
                                onClick={saveProfile}
                                disabled={savingProfile}
                            >
                                {savingProfile ? "Đang lưu..." : "Lưu"}
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={cancelEditProfile}
                                disabled={savingProfile}
                            >
                                Hủy
                            </Button>
                        </Box>
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
                            image={imageUrl(photo.imageUrlOptimized || photo.imageUrl)}
                            alt={photo.publicId || "photo"}
                            loading="lazy"
                            decoding="async"
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
