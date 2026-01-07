// src/pages/friends/FriendRequestsPage.jsx
import React, { useEffect, useState } from "react";
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

export default function FriendRequestsPage() {
    const me = getUser();
    const [tab, setTab] = useState(0);
    const [incoming, setIncoming] = useState([]);
    const [outgoing, setOutgoing] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadIncoming = async () => {
        const data = await api.get("/api/friends/requests/incoming?limit=50&skip=0");
        setIncoming(data.items || []);
    };

    const loadOutgoing = async () => {
        const data = await api.get("/api/friends/requests/outgoing?limit=50&skip=0");
        setOutgoing(data.items || []);
    };

    useEffect(() => {
        let alive = true;
        (async () => {
            if (alive) {
                setLoading(true);
                setError("");
            }
            try {
                if (tab === 0) await loadIncoming();
                else await loadOutgoing();
            } catch (err) {
                if (alive) setError(err.message || "Không thể tải dữ liệu.");
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [tab]);

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>
                Lời mời kết bạn
            </Typography>

            {error && (
                <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                    {error}
                </Typography>
            )}

            <Tabs value={tab} onChange={(_, next) => setTab(next)} sx={{ mb: 2 }}>
                <Tab label="Đến" />
                <Tab label="Đã gửi" />
            </Tabs>

            {loading && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                    <CircularProgress size={18} />
                    <Typography variant="body2">Đang tải...</Typography>
                </Box>
            )}

            {tab === 0 ? (
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
                                                await api.post(
                                                    `/api/friends/requests/${req._id}/accept`,
                                                    {}
                                                );
                                                setIncoming((prev) =>
                                                    prev.filter((r) => r._id !== req._id)
                                                );
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
                                                await api.post(
                                                    `/api/friends/requests/${req._id}/decline`,
                                                    {}
                                                );
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
            ) : (
                <List>
                    {outgoing.length === 0 && (
                        <Typography>Không có lời mời đã gửi.</Typography>
                    )}
                    {outgoing.map((req) => (
                        <ListItem
                            key={req._id}
                            secondaryAction={
                                <Button
                                    variant="outlined"
                                    color="warning"
                                    onClick={async () => {
                                        try {
                                            await api.del(`/api/friends/requests/${req._id}`);
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
                            }
                        >
                            <ListItemText
                                primary={`${req.to?.first_name || ""} ${req.to?.last_name || ""}`}
                                secondary={me?.role === "admin" ? req.to?.login_name : null}
                            />
                            {req.to?._id && (
                                <Button component={Link} to={`/users/${req.to._id}`} variant="text">
                                    Xem hồ sơ
                                </Button>
                            )}
                        </ListItem>
                    ))}
                </List>
            )}
        </Paper>
    );
}
