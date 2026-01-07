// src/pages/friends/FriendsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    Paper,
    Tab,
    Tabs,
    Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import { api, getUser } from "../../config/api";
import { API_PATHS } from "../../config/apiPaths";

export default function FriendsPage() {
    const me = getUser();
    const [tab, setTab] = useState(0);
    const [friends, setFriends] = useState([]);
    const [incoming, setIncoming] = useState([]);
    const [outgoing, setOutgoing] = useState([]);
    const [loadingByTab, setLoadingByTab] = useState({ 0: false, 1: false, 2: false });
    const [loadedTabs, setLoadedTabs] = useState({ 0: false, 1: false, 2: false });
    const [error, setError] = useState("");

    const activeLoading = useMemo(() => loadingByTab[tab], [loadingByTab, tab]);

    const loadFriends = async () => {
        const data = await api.get(API_PATHS.friends.list(50, 0));
        setFriends(data.items || []);
    };

    const loadIncoming = async () => {
        const data = await api.get(API_PATHS.friends.requestsIncoming(50, 0));
        setIncoming(data.items || []);
    };

    const loadOutgoing = async () => {
        const data = await api.get(API_PATHS.friends.requestsOutgoing(50, 0));
        setOutgoing(data.items || []);
    };

    const addFriend = (user) => {
        if (!user?._id) return;
        setFriends((prev) => {
            const list = prev || [];
            if (list.some((u) => u._id === user._id)) return list;
            return [user, ...list];
        });
    };

    useEffect(() => {
        let alive = true;

        (async () => {
            if (loadedTabs[tab]) return;
            setLoadingByTab((prev) => ({ ...prev, [tab]: true }));
            setError("");
            try {
                if (tab === 0) await loadFriends();
                if (tab === 1) await loadIncoming();
                if (tab === 2) await loadOutgoing();
                if (alive) setLoadedTabs((prev) => ({ ...prev, [tab]: true }));
            } catch (err) {
                if (alive) setError(err.message || "Không thể tải dữ liệu.");
            } finally {
                if (alive) setLoadingByTab((prev) => ({ ...prev, [tab]: false }));
            }
        })();

        return () => {
            alive = false;
        };
    }, [tab, loadedTabs]);

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>
                Bạn bè
            </Typography>

            {error && (
                <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                    {error}
                </Typography>
            )}

            <Tabs value={tab} onChange={(_, next) => setTab(next)} sx={{ mb: 2 }}>
                <Tab label="Danh sách" />
                <Tab label="Lời mời đến" />
                <Tab label="Đã gửi" />
            </Tabs>

            {activeLoading && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                    <CircularProgress size={18} />
                    <Typography variant="body2">Đang tải...</Typography>
                </Box>
            )}

            {tab === 0 && (
                <>
                    {friends.length === 0 ? (
                        <Typography>Chưa có bạn bè.</Typography>
                    ) : (
                        <List>
                            {friends.map((friend) => (
                                <ListItem
                                    key={friend._id}
                                    secondaryAction={
                                        <Box sx={{ display: "flex", gap: 1 }}>
                                            <Button component={Link} to={`/users/${friend._id}`} variant="text">
                                                Xem hồ sơ
                                            </Button>
                                            <Button
                                                color="error"
                                                variant="outlined"
                                                onClick={async () => {
                                                    try {
                                                        await api.del(API_PATHS.friends.unfriend(friend._id));
                                                        setFriends((prev) =>
                                                            prev.filter((u) => u._id !== friend._id)
                                                        );
                                                    } catch (err) {
                                                        setError(err.message || "Không thể hủy kết bạn.");
                                                    }
                                                }}
                                            >
                                                Hủy kết bạn
                                            </Button>
                                        </Box>
                                    }
                                >
                                    <ListItemText
                                        primary={`${friend.first_name} ${friend.last_name}`}
                                        secondary={me?.role === "admin" ? friend.login_name : null}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </>
            )}

            {tab === 1 && (
                <List>
                    {incoming.length === 0 && (
                        <Typography>Không có lời mời đến.</Typography>
                    )}
                    {incoming.map((req) => (
                        <ListItem
                            key={req._id}
                            secondaryAction={
                                <Box sx={{ display: "flex", gap: 1 }}>
                                    {req.from?._id && (
                                        <Button component={Link} to={`/users/${req.from._id}`} variant="text">
                                            Xem hồ sơ
                                        </Button>
                                    )}
                                    <Button
                                        variant="contained"
                                        onClick={async () => {
                                            try {
                                                await api.post(API_PATHS.friends.requestAccept(req._id), {});
                                                setIncoming((prev) =>
                                                    prev.filter((r) => r._id !== req._id)
                                                );
                                                addFriend(req.from);
                                                window.dispatchEvent(new Event("friends:changed"));
                                            } catch (err) {
                                                setError(err.message || "Không thể chấp nhận.");
                                            }
                                        }}
                                    >
                                        Chấp nhận
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        onClick={async () => {
                                            try {
                                                await api.post(API_PATHS.friends.requestDecline(req._id), {});
                                                setIncoming((prev) =>
                                                    prev.filter((r) => r._id !== req._id)
                                                );
                                                window.dispatchEvent(new Event("friends:changed"));
                                            } catch (err) {
                                                setError(err.message || "Không thể từ chối.");
                                            }
                                        }}
                                    >
                                        Từ chối
                                    </Button>
                                </Box>
                            }
                        >
                            <ListItemText
                                primary={`${req.from?.first_name || ""} ${req.from?.last_name || ""}`}
                                secondary={me?.role === "admin" ? req.from?.login_name : null}
                            />
                        </ListItem>
                    ))}
                </List>
            )}

            {tab === 2 && (
                <List>
                    {outgoing.length === 0 && (
                        <Typography>Không có lời mời đã gửi.</Typography>
                    )}
                    {outgoing.map((req) => (
                        <ListItem
                            key={req._id}
                            secondaryAction={
                                <Box sx={{ display: "flex", gap: 1 }}>
                                    {req.to?._id && (
                                        <Button component={Link} to={`/users/${req.to._id}`} variant="text">
                                            Xem hồ sơ
                                        </Button>
                                    )}
                                    <Button
                                        variant="outlined"
                                        color="warning"
                                        onClick={async () => {
                                            try {
                                            await api.del(API_PATHS.friends.requestCancel(req._id));
                                                setOutgoing((prev) =>
                                                    prev.filter((r) => r._id !== req._id)
                                                );
                                            } catch (err) {
                                                setError(err.message || "Không thể hủy lời mời.");
                                            }
                                        }}
                                    >
                                        Hủy
                                    </Button>
                                </Box>
                            }
                        >
                            <ListItemText
                                primary={`${req.to?.first_name || ""} ${req.to?.last_name || ""}`}
                                secondary={me?.role === "admin" ? req.to?.login_name : null}
                            />
                        </ListItem>
                    ))}
                </List>
            )}
        </Paper>
    );
}
