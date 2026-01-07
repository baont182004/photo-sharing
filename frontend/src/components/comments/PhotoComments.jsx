import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    Box,
    Button,
    IconButton,
    List,
    ListItem,
    Menu,
    MenuItem,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { formatDate } from "../../utils/format";
import ReactionButtons from "../reactions/ReactionButtons";
import ConfirmDialog from "../common/ConfirmDialog";
import useToastErrors from "../../hooks/useToastErrors";

function canModifyComment(comment, currentUser) {
    if (!currentUser?._id) return false;
    const ownerId =
        comment.user?._id ||
        comment.user_id?._id ||
        comment.user_id;
    return currentUser.role === "admin" || String(ownerId) === currentUser._id;
}

function formatRelativeTime(value) {
    if (!value) return "";
    const date = new Date(value);
    const diff = Date.now() - date.getTime();
    if (diff < 30000) return "vừa xong";
    const minutes = Math.round(diff / 60000);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.round(diff / 3600000);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.round(diff / 86400000);
    if (days < 7) return `${days} ngày trước`;
    const weeks = Math.round(days / 7);
    if (weeks < 5) return `${weeks} tuần trước`;
    if (days < 365) {
        const months = Math.round(days / 30);
        return `${months} tháng trước`;
    }
    const years = Math.floor(days / 365);
    return `${years} năm trước`;
}

function CommentHeader({ count }) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Bình luận ({count})
            </Typography>
        </Box>
    );
}

function CommentItem({
    comment,
    currentUser,
    isEditing,
    draftValue,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
    onDelete,
    onDraftChange,
    saving,
    deleting,
}) {
    const user = comment.user || comment.user_id;
    const canModify = canModifyComment(comment, currentUser);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const timeLabel = useMemo(() => formatRelativeTime(comment.date_time), [comment.date_time]);

    return (
        <ListItem
            disableGutters
            sx={{
                px: 0,
                py: 1.5,
                borderRadius: 2,
                "&:hover": { bgcolor: "action.hover" },
            }}
        >
            <Box sx={{ display: "flex", gap: 1.5, width: "100%" }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography component="div" sx={{ fontSize: 14, lineHeight: 1.5 }}>
                        <Box
                            component={Link}
                            to={user?._id ? `/users/${user._id}` : "#"}
                            sx={{
                                fontWeight: 600,
                                color: "text.primary",
                                textDecoration: "none",
                                mr: 0.5,
                            }}
                        >
                            {user?.first_name ? `${user.first_name} ${user.last_name}` : "Người dùng"}
                        </Box>
                        {isEditing ? null : (
                            <Box component="span" sx={{ color: "text.primary" }}>
                                {comment.comment}
                            </Box>
                        )}
                    </Typography>

                    {isEditing && (
                        <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                            <TextField
                                size="small"
                                value={draftValue ?? comment.comment}
                                onChange={(e) => onDraftChange(e.target.value)}
                                multiline
                                minRows={2}
                            />
                            <Box sx={{ display: "flex", gap: 1 }}>
                                <Button
                                    size="small"
                                    variant="contained"
                                    onClick={onSaveEdit}
                                    disabled={saving}
                                >
                                    Lưu
                                </Button>
                                <Button size="small" onClick={onCancelEdit} disabled={saving}>
                                    Hủy
                                </Button>
                            </Box>
                        </Box>
                    )}

                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 0.5 }}>
                        <Tooltip title={formatDate(comment.date_time)}>
                            <Typography variant="caption" color="text.secondary">
                                {timeLabel}
                            </Typography>
                        </Tooltip>
                        <Box sx={{ transform: "scale(0.9)", transformOrigin: "left center" }}>
                            <ReactionButtons
                                targetType="Comment"
                                targetId={comment._id}
                                initialLikeCount={comment.likeCount || 0}
                                initialDislikeCount={comment.dislikeCount || 0}
                                initialMyReaction={comment.myReaction || 0}
                            />
                        </Box>
                    </Box>
                </Box>

                {canModify && (
                    <Box sx={{ alignSelf: "flex-start" }}>
                        <IconButton
                            aria-label="Tùy chọn bình luận"
                            onClick={(e) => setMenuAnchor(e.currentTarget)}
                            sx={{ width: 40, height: 40 }}
                        >
                            <span style={{ fontSize: 18, lineHeight: 1 }}>⋯</span>
                        </IconButton>
                        <Menu
                            anchorEl={menuAnchor}
                            open={Boolean(menuAnchor)}
                            onClose={() => setMenuAnchor(null)}
                        >
                            <MenuItem
                                onClick={() => {
                                    setMenuAnchor(null);
                                    onStartEdit();
                                }}
                            >
                                Chỉnh sửa
                            </MenuItem>
                            <MenuItem
                                onClick={() => {
                                    setMenuAnchor(null);
                                    onDelete();
                                }}
                                disabled={deleting}
                            >
                                Xóa
                            </MenuItem>
                        </Menu>
                    </Box>
                )}
            </Box>
        </ListItem>
    );
}

export default function PhotoComments({
    photoId,
    comments,
    currentUser,
    onEditComment,
    onDeleteComment,
}) {
    const { showError, showSuccess } = useToastErrors();
    const [editing, setEditing] = useState({});
    const [drafts, setDrafts] = useState({});
    const [saving, setSaving] = useState({});
    const [deleting, setDeleting] = useState({});
    const [visibleCount, setVisibleCount] = useState(5);
    const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);

    const totalCount = comments?.length || 0;
    const visibleComments = (comments || []).slice(0, visibleCount);

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
            showError(err, "Không thể cập nhật bình luận.");
        } finally {
            setSaving((prev) => ({ ...prev, [commentId]: false }));
        }
    };

    const requestDeleteComment = (commentId) => {
        setConfirmingDeleteId(commentId);
    };

    const deleteComment = async (commentId) => {
        setDeleting((prev) => ({ ...prev, [commentId]: true }));
        try {
            await onDeleteComment?.(photoId, commentId);
            showSuccess("Đã xóa bình luận.");
        } catch (err) {
            showError(err, "Không thể xóa bình luận.");
        } finally {
            setDeleting((prev) => ({ ...prev, [commentId]: false }));
            setConfirmingDeleteId(null);
        }
    };

    return (
        <Box sx={{ mt: 2 }}>
            <CommentHeader count={totalCount} />
            {totalCount === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    Chưa có bình luận. Hãy là người đầu tiên bình luận.
                </Typography>
            ) : (
                <>
                    <List disablePadding>
                        {visibleComments.map((comment) => (
                            <CommentItem
                                key={comment._id}
                                comment={comment}
                                currentUser={currentUser}
                                isEditing={!!editing[comment._id]}
                                draftValue={drafts[comment._id]}
                                onStartEdit={() => startEdit(comment)}
                                onCancelEdit={() => cancelEdit(comment._id)}
                                onSaveEdit={() => saveComment(comment._id)}
                                onDelete={() => requestDeleteComment(comment._id)}
                                onDraftChange={(value) =>
                                    setDrafts((prev) => ({ ...prev, [comment._id]: value }))
                                }
                                saving={!!saving[comment._id]}
                                deleting={!!deleting[comment._id]}
                            />
                        ))}
                    </List>
                    {visibleCount < totalCount && (
                        <Button
                            variant="text"
                            onClick={() => setVisibleCount((prev) => prev + 5)}
                            sx={{ mt: 1 }}
                        >
                            Xem thêm bình luận
                        </Button>
                    )}
                </>
            )}
            <ConfirmDialog
                open={!!confirmingDeleteId}
                title="Xóa bình luận"
                description="Bạn có chắc muốn xóa bình luận này không?"
                confirmText="Xóa"
                cancelText="Hủy"
                loading={!!deleting[confirmingDeleteId]}
                onClose={() => setConfirmingDeleteId(null)}
                onConfirm={() => confirmingDeleteId && deleteComment(confirmingDeleteId)}
            />
        </Box>
    );
}
