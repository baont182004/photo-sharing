// src/components/routes/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getUser } from "../../config/api";

export default function ProtectedRoute() {
    const user = getUser();
    const location = useLocation();

    if (!user?._id) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }
    return <Outlet />;
}
