import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getToken, getUser } from "../../config/api";

export default function AdminProtectedRoute() {
    const token = getToken();
    const user = getUser();

    if (!token) return <Navigate to="/login" replace />;
    if (user?.role !== "admin") return <Navigate to="/" replace />;

    return <Outlet />;
}
