// src/pages/public/NoMatch.jsx
import React from "react";
import { Paper, Typography } from "@mui/material";

export default function NoMatch() {
    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                404 - Not Found
            </Typography>
            <Typography>Đường dẫn không tồn tại.</Typography>
        </Paper>
    );
}
