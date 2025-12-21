// src/pages/users/UserList.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    Divider,
    Box,
} from "@mui/material";
import useUserSummaries from "../../hooks/useUserSummaries";

export default function UserList() {
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
    const navigate = useNavigate();

    const { users, loading, getPhotoCount, getCommentCount } = useUserSummaries(debouncedSearchTerm);

    useEffect(() => {
        const timeId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 1000);
        return () => clearTimeout(timeId);
    }, [searchTerm]);

    const handleCommentBubbleClick = (e, userId) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/comments/${userId}`);
    };

    if (loading || !users) return <div>Loading...</div>;

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>
                Danh sách người dùng
            </Typography>

            <div>
                <input
                    type="text"
                    placeholder="Tìm kiếm theo tên..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "8px",
                        marginBottom: "16px",
                        boxSizing: "border-box",
                    }}
                />
            </div>

            <List>
                {users.map((user) => {
                    const photoCount = getPhotoCount(user._id);
                    const commentCount = getCommentCount(user._id);

                    return (
                        <React.Fragment key={user._id}>
                            <ListItem button component={Link} to={`/users/${user._id}`}>
                                <ListItemText
                                    primary={`${user.first_name} ${user.last_name}`}
                                />

                                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                    <Box
                                        sx={{
                                            px: 1,
                                            py: 0.3,
                                            borderRadius: 2,
                                            bgcolor: "success.main",
                                            color: "white",
                                            fontSize: 12,
                                            minWidth: 28,
                                            textAlign: "center",
                                        }}
                                        title="Photo count"
                                    >
                                        {photoCount}
                                    </Box>

                                    <Box
                                        sx={{
                                            px: 1,
                                            py: 0.3,
                                            borderRadius: 2,
                                            bgcolor: "error.main",
                                            color: "white",
                                            fontSize: 12,
                                            minWidth: 28,
                                            textAlign: "center",
                                            cursor: "pointer",
                                        }}
                                        title="Comment count (click)"
                                        onClick={(e) => handleCommentBubbleClick(e, user._id)}
                                    >
                                        {commentCount}
                                    </Box>
                                </Box>
                            </ListItem>
                            <Divider component="li" />
                        </React.Fragment>
                    );
                })}
            </List>
        </Paper>
    );
}
