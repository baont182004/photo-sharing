// src/pages/users/UserDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Typography, Paper, Button, Box, Avatar } from "@mui/material";
import { api, getUser, imageUrl } from "../../config/api";
import { API_PATHS } from "../../config/apiPaths";
import FriendButton from "../../components/friends/FriendButton";

export default function UserDetail() {
    const { userId } = useParams();
    const [user, setUser] = useState(null);
    const [photos, setPhotos] = useState([]);
    const [photoLoading, setPhotoLoading] = useState(true);
    const [photoError, setPhotoError] = useState("");
    const me = getUser();

    useEffect(() => {
        let alive = true;

        (async () => {
            const data = await api.get(API_PATHS.user.byId(userId));
            if (alive) setUser(data);
        })();

        return () => {
            alive = false;
        };
    }, [userId]);

    useEffect(() => {
        let alive = true;
        setPhotoLoading(true);
        setPhotoError("");

        (async () => {
            try {
                const data = await api.get(API_PATHS.photos.ofUser(userId));
                if (alive) setPhotos(data || []);
            } catch (err) {
                if (alive) {
                    setPhotos([]);
                    setPhotoError(err.message || "Không thể tải ảnh.");
                }
            } finally {
                if (alive) setPhotoLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [userId]);

    if (!user) return <div>Đang tải hồ sơ người dùng...</div>;
    const displayName =
        user.display_name ||
        `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
        "User";
    const handleText = user.handle || user.login_name || "";

    return (
        <Paper sx={{ p: 2 }}>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    gap: 2,
                    alignItems: "flex-start",
                }}
            >
                <Box sx={{ flex: 1, minWidth: 0, display: "flex", gap: 2, alignItems: "center" }}>
                    <Avatar
                        src={user.avatar_url || ""}
                        alt={displayName}
                        sx={{ width: 72, height: 72 }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h4" gutterBottom>
                            {displayName}
                        </Typography>
                        {handleText && (
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                @{handleText}
                            </Typography>
                        )}
                        <Typography>Địa chỉ: {user.location || "Chưa cập nhật"}</Typography>
                        <Typography>Nghề nghiệp: {user.occupation || "Chưa cập nhật"}</Typography>
                        <Typography>Mô tả: {user.description || "Chưa cập nhật"}</Typography>
                    </Box>
                </Box>

                <Box
                    sx={{
                        minWidth: { md: 220 },
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                    }}
                >
                    {me && (
                        <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                                Kết nối nhanh
                            </Typography>
                            <FriendButton userId={user._id} sx={{ mt: 0 }} />
                        </Box>
                    )}
                    <Button
                        variant="outlined"
                        size="small"
                        component={Link}
                        to={`/photos/${user._id}`}
                    >
                        Xem ảnh
                    </Button>
                </Box>
            </Box>

            <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                    Ảnh đã đăng
                </Typography>

                {photoLoading && <Typography>Đang tải ảnh...</Typography>}
                {!photoLoading && photoError && (
                    <Typography color="error" variant="body2">
                        {photoError}
                    </Typography>
                )}

                {!photoLoading && !photoError && photos.length === 0 && (
                    <Typography>Chưa có ảnh.</Typography>
                )}

                {!photoLoading && photos.length > 0 && (
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fill, minmax(140px, 1fr))",
                            gap: 1,
                        }}
                    >
                        {photos.map((photo) => (
                            <Box
                                key={photo._id}
                                sx={{
                                    width: "100%",
                                    aspectRatio: "1 / 1",
                                    overflow: "hidden",
                                    borderRadius: 1,
                                    bgcolor: "grey.100",
                                }}
                            >
                                <img
                                    src={imageUrl(photo.imageUrlOptimized || photo.imageUrl)}
                                    alt={photo.publicId || "photo"}
                                    loading="lazy"
                                    decoding="async"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
        </Paper>
    );
}
