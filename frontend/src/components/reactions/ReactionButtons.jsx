// src/components/reactions/ReactionButtons.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Button, Stack, Typography } from "@mui/material";
import { api } from "../../config/api";
import { API_PATHS } from "../../config/apiPaths";

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function applyToggle(prev, requested) {
    const next = { ...prev };

    if (requested === 0) {
        if (prev.myReaction === 1) next.likeCount -= 1;
        if (prev.myReaction === -1) next.dislikeCount -= 1;
        next.myReaction = 0;
        return next;
    }

    if (prev.myReaction === requested) {
        if (requested === 1) next.likeCount -= 1;
        if (requested === -1) next.dislikeCount -= 1;
        next.myReaction = 0;
        return next;
    }

    if (prev.myReaction === 1) next.likeCount -= 1;
    if (prev.myReaction === -1) next.dislikeCount -= 1;
    if (requested === 1) next.likeCount += 1;
    if (requested === -1) next.dislikeCount += 1;

    next.myReaction = requested;
    return next;
}

export default function ReactionButtons({
    targetType,
    targetId,
    initialLikeCount = 0,
    initialDislikeCount = 0,
    initialMyReaction = 0,
    onChange,
}) {
    const targetLabel = useMemo(
        () => (targetType === "Comment" ? "bình luận" : "ảnh"),
        [targetType]
    );

    const [state, setState] = useState({
        likeCount: toNumber(initialLikeCount),
        dislikeCount: toNumber(initialDislikeCount),
        myReaction: toNumber(initialMyReaction),
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setState({
            likeCount: toNumber(initialLikeCount),
            dislikeCount: toNumber(initialDislikeCount),
            myReaction: toNumber(initialMyReaction),
        });
    }, [initialLikeCount, initialDislikeCount, initialMyReaction]);

    const sendReaction = async (value) => {
        if (!targetId || loading) return;
        const prevSnapshot = { ...state };
        setError("");
        setLoading(true);

        setState((prevState) => {
            const optimistic = applyToggle(
                {
                    likeCount: toNumber(prevState.likeCount),
                    dislikeCount: toNumber(prevState.dislikeCount),
                    myReaction: toNumber(prevState.myReaction),
                },
                value
            );
            return optimistic;
        });

        try {
            const path =
                targetType === "Comment"
                    ? API_PATHS.reactions.comment(targetId)
                    : API_PATHS.reactions.photo(targetId);
            const result = await api.put(path, { value });
            const nextState = {
                likeCount: toNumber(result.likeCount, prevSnapshot.likeCount),
                dislikeCount: toNumber(result.dislikeCount, prevSnapshot.dislikeCount),
                myReaction: toNumber(result.myReaction, prevSnapshot.myReaction),
            };
            setState(nextState);
            if (onChange) onChange(nextState, prevSnapshot);
        } catch (err) {
            setState(prevSnapshot);
            setError(err.message || "Không thể cập nhật phản ứng.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Stack spacing={0.5} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
                <Button
                    size="small"
                    variant={state.myReaction === 1 ? "contained" : "outlined"}
                    color="primary"
                    onClick={() => sendReaction(1)}
                    disabled={loading}
                    aria-pressed={state.myReaction === 1}
                    aria-label={`Thích ${targetLabel}`}
                >
                    👍 Thích ({state.likeCount})
                </Button>
                <Button
                    size="small"
                    color="error"
                    variant={state.myReaction === -1 ? "contained" : "outlined"}
                    onClick={() => sendReaction(-1)}
                    disabled={loading}
                    aria-pressed={state.myReaction === -1}
                    aria-label={`Không thích ${targetLabel}`}
                >
                    👎 Không thích ({state.dislikeCount})
                </Button>
            </Stack>
            {error && (
                <Typography variant="caption" color="error">
                    {error}
                </Typography>
            )}
        </Stack>
    );
}
