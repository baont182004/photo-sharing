// src/components/routes/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getToken } from "../../config/api";

export default function ProtectedRoute() {
    const token = getToken();
    const location = useLocation();

    if (!token) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }
    return <Outlet />;
}
