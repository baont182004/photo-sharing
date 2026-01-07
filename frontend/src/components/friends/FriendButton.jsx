// src/components/friends/FriendButton.jsx
import React, { useCallback, useEffect, useState } from "react";
import { Button, CircularProgress, Stack, Typography } from "@mui/material";
import { api, getUser } from "../../config/api";
import { API_PATHS } from "../../config/apiPaths";

const STATUS = {
    NONE: "NONE",
    OUTGOING_PENDING: "OUTGOING_PENDING",
    INCOMING_PENDING: "INCOMING_PENDING",
    FRIENDS: "FRIENDS",
};

export default function FriendButton({ userId, sx }) {
    const me = getUser();
    const [status, setStatus] = useState(null);
    const [requestId, setRequestId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchStatus = useCallback(async () => {
        if (!userId || !me?._id) return;
        setLoading(true);
        setError("");
        try {
            const data = await api.get(API_PATHS.friends.status(userId));
            setStatus(data.status);
            setRequestId(data.requestId || null);
        } catch (err) {
            setError(err.message || "Không thể tải trạng thái.");
        } finally {
            setLoading(false);
        }
    }, [userId, me?._id]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    useEffect(() => {
        if (!userId || !me?._id) return undefined;
        const handleChanged = () => {
            fetchStatus();
        };
        window.addEventListener("friends:changed", handleChanged);
        return () => window.removeEventListener("friends:changed", handleChanged);
    }, [fetchStatus, userId, me?._id]);

    if (!userId || !me?._id || String(me._id) === String(userId)) {
        return null;
    }

    const handleAction = async (action) => {
        setLoading(true);
        setError("");
        try {
            await action();
            await fetchStatus();
        } catch (err) {
            setError(err.message || "Đã xảy ra lỗi.");
        } finally {
            setLoading(false);
        }
    };

    const renderButtons = () => {
        if (loading && !status) {
            return <CircularProgress size={20} />;
        }

        switch (status) {
            case STATUS.OUTGOING_PENDING:
                return (
                    <Button
                        variant="outlined"
                        color="warning"
                        disabled={loading || !requestId}
                        onClick={() =>
                            handleAction(() =>
                                api.del(API_PATHS.friends.requestCancel(requestId))
                            )
                        }
                    >
                        Hủy lời mời
                    </Button>
                );
            case STATUS.INCOMING_PENDING:
                return (
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="contained"
                            disabled={loading || !requestId}
                            onClick={() =>
                                handleAction(() =>
                                    api.post(API_PATHS.friends.requestAccept(requestId), {})
                                )
                            }
                        >
                            Chấp nhận
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            disabled={loading || !requestId}
                            onClick={() =>
                                handleAction(() =>
                                    api.post(API_PATHS.friends.requestDecline(requestId), {})
                                )
                            }
                        >
                            Từ chối
                        </Button>
                    </Stack>
                );
            case STATUS.FRIENDS:
                return (
                    <Button
                        variant="outlined"
                        color="error"
                        disabled={loading}
                        onClick={() =>
                            handleAction(() =>
                                api.del(API_PATHS.friends.unfriend(userId))
                            )
                        }
                    >
                        Hủy kết bạn
                    </Button>
                );
            case STATUS.NONE:
            default:
                return (
                    <Button
                        variant="contained"
                        disabled={loading}
                        onClick={() =>
                            handleAction(() =>
                                api.post(API_PATHS.friends.requestSend(userId), {})
                            )
                        }
                    >
                        Gửi kết bạn
                    </Button>
                );
        }
    };

    return (
        <Stack spacing={1} sx={{ mt: 2, ...sx }}>
            {renderButtons()}
            {error && (
                <Typography color="error" variant="body2">
                    {error}
                </Typography>
            )}
        </Stack>
    );
}
