// src/pages/users/UserComments.jsx
import React, { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
    Typography,
    Paper,
    Card,
    CardContent,
    CardMedia,
    Box,
    Divider,
} from "@mui/material";
import { api, imageUrl } from "../../config/api";
import { formatDate } from "../../utils/format";

export default function UserComments() {
    const { userId } = useParams();
    const [user, setUser] = useState(null);
    const [userComments, setUserComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchPhotosForUsers = useCallback(async (users) => {
        const results = await Promise.allSettled(
            (users || []).map((u) => api.get(`/photosOfUser/${u._id}`))
        );
        return results.flatMap((res) =>
            res.status === "fulfilled" && Array.isArray(res.value) ? res.value : []
        );
    }, []);

    const collectUserComments = useCallback(
        (photos) =>
            (photos || [])
                .flatMap((photo) =>
                    (photo.comments || [])
                        .filter((c) => String(c.user?._id || c.user_id) === String(userId))
                        .map((c) => ({ ...c, photo }))
                )
                .sort((a, b) => new Date(b.date_time) - new Date(a.date_time)),
        [userId]
    );

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                setLoading(true);
                setError("");

                const [userData, users] = await Promise.all([
                    api.get(`/user/${userId}`),
                    api.get(`/user/list`),
                ]);
                if (!alive) return;
                setUser(userData);

                const photos = await fetchPhotosForUsers(users);
                if (!alive) return;

                setUserComments(collectUserComments(photos));
            } catch (err) {
                if (!alive) return;
                setError(err?.message || "Failed to load comments");
                setUser(null);
                setUserComments([]);
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [userId, collectUserComments, fetchPhotosForUsers]);

    if (loading) return <div>Đang tải...</div>;
    if (error) return <div>{error}</div>;
    if (!user) return <div>Không tìm thấy người dùng.</div>;

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h4" gutterBottom>
                Bình luận của {user.first_name} {user.last_name}
            </Typography>

            {userComments.length === 0 ? (
                <Typography variant="body1" color="text.secondary">
                    Người dùng này chưa có bình luận nào.
                </Typography>
            ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {userComments.map((comment) => (
                        <Card key={comment._id} sx={{ display: "flex" }}>
                            <Link to={`/photos/${comment.photo.user_id}`} style={{ display: "block" }}>
                                <CardMedia
                                    component="img"
                                    image={imageUrl(comment.photo.file_name)}
                                    alt={comment.photo.file_name}
                                    sx={{ width: 180, height: 120, objectFit: "cover" }}
                                />
                            </Link>

                            <CardContent sx={{ flexGrow: 1 }}>
                                <Link to={`/photos/${comment.photo.user_id}`} style={{ textDecoration: "none" }}>
                                    <Typography variant="body1" sx={{ color: "text.primary" }}>
                                        {comment.comment}
                                    </Typography>
                                </Link>

                                <Divider sx={{ my: 1 }} />

                                <Typography variant="caption" color="text.secondary" display="block">
                                    Bình luận vào: {formatDate(comment.date_time)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    Ảnh chụp vào: {formatDate(comment.photo.date_time)}
                                </Typography>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}
        </Paper>
    );
}
