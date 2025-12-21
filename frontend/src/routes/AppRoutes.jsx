// src/routes/AppRoutes.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";

import Home from "../pages/public/Home";
import LoginRegister from "../pages/public/LoginRegister";

import NoMatch from "../pages/public/NoMatch";

import Profile from "../pages/protected/Profile";

import AdminDashboard from "../pages/admin/AdminDashboard";

import UserList from "../pages/users/UserList";
import UserDetail from "../pages/users/UserDetail";
import UserPhotos from "../pages/users/UserPhotos";
import UserComments from "../pages/users/UserComments";

import ProtectedRoute from "../components/routes/ProtectedRoute";
import AdminProtectedRoute from "../components/routes/AdminProtectedRoute";

export default function AppRoutes() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                <Route path="/" element={<Home />} />

                <Route path="/loginregister" element={<LoginRegister />} />

                <Route element={<ProtectedRoute />}>
                    <Route path="/users" element={<UserList />} />
                    <Route path="/users/:userId" element={<UserDetail />} />
                    <Route path="/photos/:userId" element={<UserPhotos />} />
                    <Route path="/comments/:userId" element={<UserComments />} />

                    <Route path="/profile" element={<Profile />} />
                </Route>

                <Route element={<AdminProtectedRoute />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                </Route>

                <Route path="*" element={<NoMatch />} />
            </Route>
        </Routes>
    );
}
