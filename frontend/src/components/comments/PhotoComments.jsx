import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
    Box,
    Button,
    Divider,
    List,
    ListItem,
    ListItemText,
    TextField,
    Typography,
} from "@mui/material";
import { formatDate } from "../../utils/format";

function canModifyComment(comment, currentUser) {
    if (!currentUser?._id) return false;
    const ownerId =
        comment.user?._id ||
        comment.user_id?._id ||
        comment.user_id;
    return currentUser.role === "admin" || String(ownerId) === currentUser._id;
}

export default function PhotoComments({
    photoId,
    comments,
    currentUser,
    onEditComment,
    onDeleteComment,
}) {
    const [editing, setEditing] = useState({});
    const [drafts, setDrafts] = useState({});
    const [saving, setSaving] = useState({});
    const [deleting, setDeleting] = useState({});

    if (!comments || comments.length === 0) return null;

    const startEdit = (comment) => {
        setEditing((prev) => ({ ...prev, [comment._id]: true }));
        setDrafts((prev) => ({ ...prev, [comment._id]: comment.comment || "" }));
    };

    const cancelEdit = (commentId) => {
        setEditing((prev) => {
            const next = { ...prev };
            delete next[commentId];
            return next;
        });
        setDrafts((prev) => {
            const next = { ...prev };
            delete next[commentId];
            return next;
        });
    };

    const saveComment = async (commentId) => {
        const text = (drafts[commentId] || "").trim();
        if (!text) return;
        setSaving((prev) => ({ ...prev, [commentId]: true }));
        try {
            await onEditComment?.(photoId, commentId, text);
            cancelEdit(commentId);
        } catch (err) {
            alert(err?.message || "Failed to update comment");
        } finally {
            setSaving((prev) => ({ ...prev, [commentId]: false }));
        }
    };

    const deleteComment = async (commentId) => {
        if (!window.confirm("Delete this comment?")) return;
        setDeleting((prev) => ({ ...prev, [commentId]: true }));
        try {
            await onDeleteComment?.(photoId, commentId);
        } catch (err) {
            alert(err?.message || "Failed to delete comment");
        } finally {
            setDeleting((prev) => ({ ...prev, [commentId]: false }));
        }
    };

    return (
        <List sx={{ mt: 1 }}>
            {comments.map((comment) => {
                const user = comment.user || comment.user_id;
                const editable = !!editing[comment._id];
                const canModify = canModifyComment(comment, currentUser);

                return (
                    <React.Fragment key={comment._id}>
                        <ListItem alignItems="flex-start" disableGutters>
                            <ListItemText
                                primary={
                                    user?._id ? (
                                        <Link to={`/users/${user._id}`}>
                                            {user.first_name} {user.last_name}
                                        </Link>
                                    ) : (
                                        "Unknown user"
                                    )
                                }
                                secondary={
                                    <Box sx={{ position: "relative", pr: 14 }}>
                                        <Typography variant="caption" display="block">
                                            {formatDate(comment.date_time)}
                                        </Typography>

                                        {canModify && !editable && (
                                            <Box
                                                sx={{
                                                    position: "absolute",
                                                    top: 0,
                                                    right: 0,
                                                    display: "flex",
                                                    gap: 1,
                                                }}
                                            >
                                                <Button size="small" variant="text" onClick={() => startEdit(comment)}>
                                                    Sửa
                                                </Button>
                                                <Button
                                                    size="small"
                                                    color="error"
                                                    variant="text"
                                                    onClick={() => deleteComment(comment._id)}
                                                    disabled={!!deleting[comment._id]}
                                                >
                                                    Xóa
                                                </Button>
                                            </Box>
                                        )}

                                        {editable ? (
                                            <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                                                <TextField
                                                    size="small"
                                                    value={drafts[comment._id] ?? comment.comment}
                                                    onChange={(e) =>
                                                        setDrafts((prev) => ({
                                                            ...prev,
                                                            [comment._id]: e.target.value,
                                                        }))
                                                    }
                                                />
                                                <Box sx={{ display: "flex", gap: 1 }}>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        onClick={() => saveComment(comment._id)}
                                                        disabled={!!saving[comment._id]}
                                                    >
                                                        Lưu
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        onClick={() => cancelEdit(comment._id)}
                                                        disabled={!!saving[comment._id]}
                                                    >
                                                        Hủy
                                                    </Button>
                                                </Box>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                                                {comment.comment}
                                            </Typography>
                                        )}
                                    </Box>
                                }
                            />
                        </ListItem>
                        <Divider component="li" />
                    </React.Fragment>
                );
            })}
        </List>
    );
}
