// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { Paper, Typography, List, ListItem, ListItemText } from "@mui/material";
import { api, getUser } from "../../config/api";

export default function AdminDashboard() {
    const me = getUser();
    const [users, setUsers] = useState(null);

    useEffect(() => {
        let alive = true;
        (async () => {
            const data = await api.get("/user/list");
            if (alive) setUsers(data);
        })();
        return () => { alive = false; };
    }, []);

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                Trang làm việc của Admin
            </Typography>

            <Typography sx={{ mb: 2 }}>
                Admin: <b>{me?.first_name} {me?.last_name}</b>
            </Typography>

            <Typography variant="h6" gutterBottom>
                Người dùng (xem trước)
            </Typography>

            {!users ? (
                <div>Đang tải...</div>
            ) : (
                <List>
                    {users.slice(0, 10).map((u) => (
                        <ListItem key={u._id} divider>
                            <ListItemText primary={`${u.first_name} ${u.last_name}`} secondary={u._id} />
                        </ListItem>
                    ))}
                </List>
            )}
        </Paper>
    );
}
