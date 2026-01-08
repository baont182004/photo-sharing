import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getUser } from "../../config/api";

export default function AdminProtectedRoute() {
    const user = getUser();

    if (!user?._id) return <Navigate to="/login" replace />;
    if (user?.role !== "admin") return <Navigate to="/" replace />;

    return <Outlet />;
}
