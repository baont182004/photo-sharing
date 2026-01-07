// src/pages/public/Home.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, CardMedia, Paper, Skeleton, Tooltip, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { api, getUser, imageUrl } from "../../config/api";
import { API_PATHS } from "../../config/apiPaths";
import { formatDate } from "../../utils/format";
import ReactionButtons from "../../components/reactions/ReactionButtons";

function relativeTimeLabel(value) {
    if (!value) return "";
    const date = new Date(value);
    const diff = Date.now() - date.getTime();
    const minutes = Math.max(1, Math.round(diff / 60000));
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.round(diff / 3600000);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.round(diff / 86400000);
    if (days >= 365) {
        const years = Math.floor(days / 365);
        return `${years} năm trước`;
    }
    return `${days} ngày trước`;
}

function PostSkeleton() {
    return (
        <Paper sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
            <Skeleton variant="text" width="30%" />
            <Skeleton variant="text" width="20%" />
            <Skeleton variant="rectangular" height={420} sx={{ borderRadius: 2, my: 1 }} />
            <Skeleton variant="text" width="60%" />
        </Paper>
    );
}

function PostCard({ photo }) {
    const owner = photo.user_id;
    const timeLabel = useMemo(() => relativeTimeLabel(photo.date_time), [photo.date_time]);
    const caption = photo.description || "Ảnh chưa có mô tả.";

    return (
        <Paper
            sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: "background.paper",
                display: "flex",
                flexDirection: "column",
                gap: 1,
            }}
        >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                {owner?._id ? (
                    <Typography
                        component={Link}
                        to={`/users/${owner._id}`}
                        sx={{
                            fontSize: 17,
                            fontWeight: 600,
                            color: "text.primary",
                            textDecoration: "none",
                        }}
                    >
                        {owner.first_name} {owner.last_name}
                    </Typography>
                ) : (
                    <Typography sx={{ fontSize: 17, fontWeight: 600 }}>
                        Người dùng ẩn danh
                    </Typography>
                )}
                <Tooltip title={formatDate(photo.date_time)}>
                    <Typography variant="body2" color="text.secondary">
                        {timeLabel}
                    </Typography>
                </Tooltip>
            </Box>

            <CardMedia
                component="img"
                image={imageUrl(photo.imageUrlOptimized || photo.imageUrl)}
                alt={caption}
                loading="lazy"
                decoding="async"
                sx={{
                    width: "100%",
                    height: { xs: 260, sm: 360, md: 420 },
                    objectFit: "contain",
                    borderRadius: 2,
                    bgcolor: "grey.100",
                }}
            />

            <Typography variant="body1" sx={{ fontSize: 16 }}>
                <b>Mô tả:</b> {caption}
            </Typography>

            <ReactionButtons
                targetType="Photo"
                targetId={photo._id}
                initialLikeCount={photo.likeCount || 0}
                initialDislikeCount={photo.dislikeCount || 0}
                initialMyReaction={photo.myReaction || 0}
            />
        </Paper>
    );
}

export default function Home() {
    const [user, setUser] = useState(getUser());
    const [items, setItems] = useState([]);
    const [nextCursor, setNextCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");
    const sentinelRef = useRef(null);
    const fetchingRef = useRef(false);
    const cursorRef = useRef(null);

    useEffect(() => {
        const onAuthChange = () => setUser(getUser());
        window.addEventListener("authchange", onAuthChange);
        return () => window.removeEventListener("authchange", onAuthChange);
    }, []);

    const loadFeed = useCallback(
        async (mode = "initial") => {
            if (!user || fetchingRef.current) return;
            fetchingRef.current = true;
            setError("");
            if (mode === "initial") setLoading(true);
            if (mode === "more") setLoadingMore(true);

            try {
                const params = new URLSearchParams();
                params.set("limit", "12");
                if (mode === "more" && cursorRef.current) {
                    params.set("cursor", cursorRef.current);
                }

                const data = await api.get(API_PATHS.photos.recent(params));
                const newItems = data?.items || [];
                setItems((prev) => (mode === "more" ? [...prev, ...newItems] : newItems));
                setNextCursor(data?.nextCursor || null);
                setHasMore(!!data?.hasMore);
            } catch (err) {
                setError(err.message || "Không thể tải ảnh gần đây.");
            } finally {
                if (mode === "initial") setLoading(false);
                if (mode === "more") setLoadingMore(false);
                fetchingRef.current = false;
            }
        },
        [user]
    );

    useEffect(() => {
        setItems([]);
        setNextCursor(null);
        setHasMore(true);
        setError("");
        if (user?._id) {
            loadFeed("initial");
        }
    }, [user?._id, loadFeed]);

    useEffect(() => {
        cursorRef.current = nextCursor;
    }, [nextCursor]);

    useEffect(() => {
        if (!user || !hasMore || loadingMore) return;
        const el = sentinelRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry.isIntersecting) {
                    loadFeed("more");
                }
            },
            { rootMargin: "200px" }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, loadingMore, loadFeed, user]);

    return (
        <Box
            sx={{
                backgroundColor: (theme) =>
                    theme.palette.mode === "dark" ? theme.palette.background.default : "#fafafa",
                minHeight: "calc(100vh - 120px)",
                py: 3,
            }}
        >
            <Box sx={{ maxWidth: 600, mx: "auto", px: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                {!user ? (
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            textAlign: "center",
                        }}
                    >
                        <Typography variant="h6" sx={{ mb: 1 }}>
                            Đăng nhập để xem bảng tin
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 2 }}>
                            Sau khi đăng nhập, bạn sẽ thấy ảnh mới nhất từ bạn bè.
                        </Typography>
                        <Button variant="contained" component={Link} to="/loginregister">
                            Đăng nhập ngay
                        </Button>
                    </Paper>
                ) : (
                    <>
                        {error && (
                            <Paper
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    border: "1px solid",
                                    borderColor: "divider",
                                }}
                            >
                                <Typography color="error" sx={{ mb: 1 }}>
                                    Không thể tải ảnh gần đây. Hãy kiểm tra kết nối và thử lại.
                                </Typography>
                                <Button variant="outlined" onClick={() => loadFeed("initial")}>
                                    Thử lại
                                </Button>
                            </Paper>
                        )}

                        {loading && (
                            <>
                                <PostSkeleton />
                                <PostSkeleton />
                            </>
                        )}

                        {!loading && items.length === 0 && (
                            <Paper
                                sx={{
                                    p: 3,
                                    borderRadius: 2,
                                    border: "1px solid",
                                    borderColor: "divider",
                                    textAlign: "center",
                                }}
                            >
                                <Typography variant="h6" sx={{ mb: 1 }}>
                                    Chưa có bài đăng nào
                                </Typography>
                                <Typography color="text.secondary" sx={{ mb: 2 }}>
                                    Hãy khám phá người dùng để bắt đầu kết nối.
                                </Typography>
                                <Button variant="contained" component={Link} to="/users">
                                    Khám phá
                                </Button>
                            </Paper>
                        )}

                        {items.map((photo) => (
                            <PostCard key={photo._id} photo={photo} />
                        ))}

                        <Box ref={sentinelRef} />

                        {loadingMore && <PostSkeleton />}
                    </>
                )}
            </Box>
        </Box>
    );
}
