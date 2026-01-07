// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    CircularProgress,
    Divider,
    Grid,
    Paper,
    Tab,
    Tabs,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import { Link, useSearchParams } from "react-router-dom";
import { api, getUser } from "../../config/api";
import { API_PATHS } from "../../config/apiPaths";

function formatDateLocal(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function RangeSelector({ from, to, preset, onPreset, onChange }) {
    return (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
            <Button
                size="small"
                variant={preset === 7 ? "contained" : "outlined"}
                onClick={() => onPreset(7)}
            >
                7 ngày
            </Button>
            <Button
                size="small"
                variant={preset === 30 ? "contained" : "outlined"}
                onClick={() => onPreset(30)}
            >
                30 ngày
            </Button>
            <Button
                size="small"
                variant={preset === 90 ? "contained" : "outlined"}
                onClick={() => onPreset(90)}
            >
                90 ngày
            </Button>
            <TextField
                size="small"
                type="date"
                label="Từ"
                value={from}
                onChange={(e) => onChange(e.target.value, to, null)}
                InputLabelProps={{ shrink: true }}
            />
            <TextField
                size="small"
                type="date"
                label="Đến"
                value={to}
                onChange={(e) => onChange(from, e.target.value, null)}
                InputLabelProps={{ shrink: true }}
            />
        </Box>
    );
}

function StatCard({ title, value, sub }) {
    return (
        <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="caption" color="text.secondary">
                {title}
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.5 }}>
                {value}
            </Typography>
            {sub && (
                <Typography variant="body2" color="text.secondary">
                    {sub}
                </Typography>
            )}
        </Paper>
    );
}

function SectionHeader({ title, subtitle, action }) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Box sx={{ flex: 1 }}>
                <Typography variant="h6">{title}</Typography>
                {subtitle && (
                    <Typography variant="body2" color="text.secondary">
                        {subtitle}
                    </Typography>
                )}
            </Box>
            {action}
        </Box>
    );
}

export default function AdminDashboard() {
    const me = getUser();
    const [tab, setTab] = useState(0);
    const [searchParams, setSearchParams] = useSearchParams();
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsError, setStatsError] = useState("");
    const [overview, setOverview] = useState(null);
    const [leaderboards, setLeaderboards] = useState({});

    const today = useMemo(() => new Date(), []);
    const [from, setFrom] = useState(formatDateLocal(new Date(today.getTime() - 29 * 86400000)));
    const [to, setTo] = useState(formatDateLocal(today));
    const [preset, setPreset] = useState(30);

    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [usersError, setUsersError] = useState("");

    const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

    useEffect(() => {
        const tabParam = searchParams.get("tab");
        if (tabParam === "users") setTab(1);
        else setTab(0);
    }, [searchParams]);

    useEffect(() => {
        const timeId = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 500);
        return () => clearTimeout(timeId);
    }, [search]);

    const updateRange = (nextFrom, nextTo, nextPreset) => {
        setFrom(nextFrom);
        setTo(nextTo);
        setPreset(nextPreset);
    };

    const applyPreset = (days) => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - (days - 1));
        updateRange(formatDateLocal(start), formatDateLocal(end), days);
    };

    useEffect(() => {
        let alive = true;
        (async () => {
            if (tab !== 1) return;
            setLoadingUsers(true);
            setUsersError("");
            try {
                const params = new URLSearchParams();
                params.set("page", String(page));
                params.set("limit", String(limit));
                if (debouncedSearch) params.set("search", debouncedSearch);
                const data = await api.get(API_PATHS.admin.users(params));
                if (!alive) return;
                setUsers(data.items || []);
                setTotal(data.total || 0);
            } catch (err) {
                if (alive) setUsersError(err.message || "Không thể tải danh sách người dùng.");
            } finally {
                if (alive) setLoadingUsers(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [tab, page, limit, debouncedSearch]);

    useEffect(() => {
        let alive = true;
        (async () => {
            setStatsLoading(true);
            setStatsError("");
            try {
                const qs = new URLSearchParams({ from, to }).toString();
                const [
                    overviewRes,
                    topPhotosUsers,
                    topCommentsUsers,
                    topReactionsUsers,
                    topFriendsUsers,
                    topActiveUsers,
                ] = await Promise.all([
                    api.get(API_PATHS.admin.statsOverview(qs)),
                    api.get(API_PATHS.admin.statsLeaderboard("users_photos", qs)),
                    api.get(API_PATHS.admin.statsLeaderboard("users_comments", qs)),
                    api.get(API_PATHS.admin.statsLeaderboard("users_reactions_received", qs)),
                    api.get(API_PATHS.admin.statsLeaderboard("users_friends", qs)),
                    api.get(API_PATHS.admin.statsLeaderboard("users_active", qs)),
                ]);

                if (!alive) return;
                setOverview(overviewRes);
                setLeaderboards({
                    usersPhotos: topPhotosUsers.items || [],
                    usersComments: topCommentsUsers.items || [],
                    usersReactions: topReactionsUsers.items || [],
                    usersFriends: topFriendsUsers.items || [],
                    usersActive: topActiveUsers.items || [],
                });
            } catch (err) {
                if (alive) setStatsError(err.message || "Không thể tải thống kê.");
            } finally {
                if (alive) setStatsLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [from, to]);

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2, mb: 3 }}>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h5">Bảng điều khiển quản trị</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Xin chào <b>{me?.first_name} {me?.last_name}</b>
                    </Typography>
                </Box>
                <RangeSelector
                    from={from}
                    to={to}
                    preset={preset}
                    onPreset={applyPreset}
                    onChange={updateRange}
                />
            </Box>

            {statsError && (
                <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                    {statsError}
                </Typography>
            )}

            <Tabs
                value={tab}
                onChange={(_, next) => {
                    setTab(next);
                    if (next === 1) setSearchParams({ tab: "users" }, { replace: true });
                    else setSearchParams({}, { replace: true });
                }}
                sx={{ mb: 3 }}
            >
                <Tab label="Tổng quan" />
                <Tab label="Người dùng" />
            </Tabs>

            {tab === 0 && (
                <>
                    <SectionHeader
                        title="KPI tổng quan"
                        subtitle="Tổng dữ liệu và tăng trưởng theo giai đoạn đã chọn"
                    />
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard title="Tổng người dùng" value={overview?.totals?.users ?? 0} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard title="Tổng ảnh" value={overview?.totals?.photos ?? 0} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard title="Tổng bình luận" value={overview?.totals?.comments ?? 0} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Tổng phản ứng"
                                value={overview?.totals?.reactions?.total ?? 0}
                                sub={`👍 ${overview?.totals?.reactions?.likeCount ?? 0} · 👎 ${overview?.totals?.reactions?.dislikeCount ?? 0}`}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard title="Tổng bạn bè" value={overview?.totals?.friendships ?? 0} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Người dùng mới"
                                value={overview?.newCounts?.users?.last7d ?? 0}
                                sub={`24h: ${overview?.newCounts?.users?.last24h ?? 0} · 30d: ${overview?.newCounts?.users?.last30d ?? 0}`}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Ảnh mới"
                                value={overview?.newCounts?.photos?.last7d ?? 0}
                                sub={`24h: ${overview?.newCounts?.photos?.last24h ?? 0} · 30d: ${overview?.newCounts?.photos?.last30d ?? 0}`}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Bình luận mới"
                                value={overview?.newCounts?.comments?.last7d ?? 0}
                                sub={`24h: ${overview?.newCounts?.comments?.last24h ?? 0} · 30d: ${overview?.newCounts?.comments?.last30d ?? 0}`}
                            />
                        </Grid>
                    </Grid>

                    {statsLoading && (
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 3 }}>
                            <CircularProgress size={18} />
                            <Typography variant="body2">Đang tải dữ liệu...</Typography>
                        </Box>
                    )}

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2 }}>
                                <SectionHeader title="Top người dùng" />
                                <Divider sx={{ mb: 2 }} />
                                <Typography variant="subtitle2">Theo ảnh</Typography>
                                {leaderboards.usersPhotos?.length ? (
                                    leaderboards.usersPhotos.map((row, idx) => (
                                        <Box
                                            key={row.user?._id || idx}
                                            sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}
                                        >
                                            <Typography variant="body2">
                                                {row.user?.first_name} {row.user?.last_name}
                                            </Typography>
                                            <Typography variant="body2">{row.count}</Typography>
                                        </Box>
                                    ))
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        Không có dữ liệu
                                    </Typography>
                                )}

                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle2">Theo bình luận</Typography>
                                {leaderboards.usersComments?.length ? (
                                    leaderboards.usersComments.map((row, idx) => (
                                        <Box
                                            key={row.user?._id || idx}
                                            sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}
                                        >
                                            <Typography variant="body2">
                                                {row.user?.first_name} {row.user?.last_name}
                                            </Typography>
                                            <Typography variant="body2">{row.count}</Typography>
                                        </Box>
                                    ))
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        Không có dữ liệu
                                    </Typography>
                                )}
                            </Paper>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2 }}>
                                <SectionHeader title="Hoạt động nổi bật" />
                                <Divider sx={{ mb: 2 }} />
                                <Typography variant="subtitle2">Phản ứng nhận được</Typography>
                                {leaderboards.usersReactions?.length ? (
                                    leaderboards.usersReactions.map((row, idx) => (
                                        <Box
                                            key={row.user?._id || idx}
                                            sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}
                                        >
                                            <Typography variant="body2">
                                                {row.user?.first_name} {row.user?.last_name}
                                            </Typography>
                                            <Typography variant="body2">{row.count}</Typography>
                                        </Box>
                                    ))
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        Không có dữ liệu
                                    </Typography>
                                )}

                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle2">Người dùng tích cực</Typography>
                                {leaderboards.usersActive?.length ? (
                                    leaderboards.usersActive.map((row, idx) => (
                                        <Box
                                            key={row.user?._id || idx}
                                            sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}
                                        >
                                            <Typography variant="body2">
                                                {row.user?.first_name} {row.user?.last_name}
                                            </Typography>
                                            <Typography variant="body2">{row.count}</Typography>
                                        </Box>
                                    ))
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        Không có dữ liệu
                                    </Typography>
                                )}
                            </Paper>
                        </Grid>
                    </Grid>
                </>
            )}

            {tab === 1 && (
                <>
                    <SectionHeader
                        title="Danh sách người dùng"
                        subtitle="Tìm kiếm và theo dõi hoạt động"
                    />
                    <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
                        <TextField
                            size="small"
                            fullWidth
                            placeholder="Tìm kiếm theo tên hoặc tài khoản..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Button
                            variant="outlined"
                            onClick={() => {
                                setSearch("");
                                setDebouncedSearch("");
                                setPage(1);
                            }}
                        >
                            Xóa
                        </Button>
                    </Box>

                    {usersError && (
                        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                            {usersError}
                        </Typography>
                    )}

                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Tên hiển thị</TableCell>
                                <TableCell>Tài khoản</TableCell>
                                <TableCell>Vai trò</TableCell>
                                <TableCell align="right">Ảnh</TableCell>
                                <TableCell align="right">Bình luận</TableCell>
                                <TableCell align="right">Bạn bè</TableCell>
                                <TableCell align="right">Thao tác</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loadingUsers && (
                                <TableRow>
                                    <TableCell colSpan={7}>
                                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                            <CircularProgress size={18} />
                                            <Typography variant="body2">Đang tải...</Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            )}
                            {!loadingUsers && users.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7}>
                                        <Typography variant="body2">
                                            Không có người dùng phù hợp.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                            {!loadingUsers &&
                                users.map((u) => (
                                    <TableRow key={u._id} hover>
                                        <TableCell>{u.first_name} {u.last_name}</TableCell>
                                        <TableCell>{u.login_name}</TableCell>
                                        <TableCell>
                                            {u.role === "admin" ? "quản trị" : "người dùng"}
                                        </TableCell>
                                        <TableCell align="right">{u.photoCount ?? 0}</TableCell>
                                        <TableCell align="right">{u.commentCount ?? 0}</TableCell>
                                        <TableCell align="right">{u.friendCount ?? 0}</TableCell>
                                        <TableCell align="right">
                                            <Button
                                                size="small"
                                                component={Link}
                                                to={`/users/${u._id}`}
                                            >
                                                Xem
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>

                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
                        <Typography variant="body2">
                            Trang {page} / {totalPages} • Tổng {total} người dùng
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <Button
                                variant="outlined"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                Trước
                            </Button>
                            <Button
                                variant="outlined"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            >
                                Sau
                            </Button>
                        </Box>
                    </Box>
                </>
            )}
        </Paper>
    );
}
