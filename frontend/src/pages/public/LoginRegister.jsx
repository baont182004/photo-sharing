// src/pages/public/LoginRegister.jsx
import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Paper, TextField, Typography } from "@mui/material";
import { api, refreshMe, setAuth, API_URL } from "../../config/api";
import { API_PATHS } from "../../config/apiPaths";

const emptyRegister = {
    first_name: "",
    last_name: "",
    login_name: "",
    password: "",
    location: "",
    occupation: "",
    description: "",
};

export default function LoginRegister() {
    const nav = useNavigate();
    const loc = useLocation();

    const [loginForm, setLoginForm] = useState({ login_name: "", password: "" });
    const [loginErr, setLoginErr] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);

    const [reg, setReg] = useState(emptyRegister);
    const [regPassword2, setRegPassword2] = useState("");
    const [regErr, setRegErr] = useState("");
    const [regOk, setRegOk] = useState("");
    const [regLoading, setRegLoading] = useState(false);
    const [showRegister, setShowRegister] = useState(false);

    const passwordsMatch = useMemo(() => {
        if (!reg.password && !regPassword2) return true;
        return reg.password === regPassword2;
    }, [reg.password, regPassword2]);

    const onLoginChange = (key) => (e) =>
        setLoginForm((p) => ({ ...p, [key]: e.target.value }));

    const onRegChange = (key) => (e) =>
        setReg((p) => ({ ...p, [key]: e.target.value }));

    const onLogin = async (e) => {
        e.preventDefault();
        setLoginErr("");
        setLoginLoading(true);

        try {
            const data = await api.post(API_PATHS.admin.login(), {
                login_name: loginForm.login_name,
                password: loginForm.password,
            });
            setAuth({ user: data.user });
            await refreshMe();
            const goBack = loc.state?.from;
            nav(goBack || `/users/${data.user._id}`);
        } catch (err) {
            setLoginErr(err.message);
        } finally {
            setLoginLoading(false);
        }
    };

    const onRegister = async (e) => {
        e.preventDefault();
        setRegErr("");
        setRegOk("");

        if (!passwordsMatch) {
            setRegErr("Mật khẩu không khớp.");
            return;
        }

        setRegLoading(true);
        try {
            const { login_name, password, first_name, last_name, location, description, occupation } = reg;

            await api.post(API_PATHS.user.register(), {
                login_name,
                password,
                first_name,
                last_name,
                location,
                description,
                occupation,
            });

            setRegOk("Đăng ký thành công! Bạn có thể đăng nhập ngay.");
            setReg(emptyRegister);
            setRegPassword2("");
            setShowRegister(false);

            setLoginForm({ login_name, password: "" });
        } catch (err) {
            setRegErr(err.message);
        } finally {
            setRegLoading(false);
        }
    };

    return (
        <Paper sx={{ p: 4, maxWidth: 900, mx: "auto" }}>
            <Typography variant="h5" gutterBottom textAlign="center">
                Đăng nhập
            </Typography>

            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    alignItems: "center",
                }}
            >
                <Box
                    component="form"
                    onSubmit={onLogin}
                    sx={{
                        width: "100%",
                        maxWidth: 480,
                        p: 3,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                        boxShadow: 1,
                    }}
                >
                    <Typography variant="h6">Đăng nhập</Typography>

                    {loginErr && (
                        <Alert severity="error" sx={{ mt: 1 }} id="login-error">
                            {loginErr}
                        </Alert>
                    )}

                    <TextField
                        label="Tên đăng nhập"
                        value={loginForm.login_name}
                        onChange={onLoginChange("login_name")}
                        fullWidth
                        margin="normal"
                        error={!!loginErr}
                        aria-describedby={loginErr ? "login-error" : undefined}
                    />
                    <TextField
                        label="Mật khẩu"
                        type="password"
                        value={loginForm.password}
                        onChange={onLoginChange("password")}
                        fullWidth
                        margin="normal"
                        error={!!loginErr}
                        aria-describedby={loginErr ? "login-error" : undefined}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        sx={{ mt: 1 }}
                        disabled={loginLoading}
                        fullWidth
                    >
                        {loginLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                    </Button>
                    <Button
                        type="button"
                        variant="outlined"
                        sx={{ mt: 1 }}
                        onClick={() => {
                            window.location.href = `${API_URL}/api/auth/github`;
                        }}
                        fullWidth
                    >
                        Continue with GitHub
                    </Button>

                    <Button
                        type="button"
                        variant="text"
                        sx={{ mt: 1 }}
                        onClick={() => setShowRegister(true)}
                        fullWidth
                    >
                        Chưa có tài khoản? Đăng ký
                    </Button>
                </Box>

                {showRegister && (
                    <Box
                        component="form"
                        onSubmit={onRegister}
                        sx={{
                            width: "100%",
                            maxWidth: 760,
                            p: 3,
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 2,
                            boxShadow: 1,
                            bgcolor: "background.paper",
                        }}
                    >
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Typography variant="h6">Đăng ký</Typography>
                            <Button type="button" onClick={() => setShowRegister(false)}>
                                Hủy
                            </Button>
                        </Box>

                        {regErr && (
                            <Alert severity="error" sx={{ mt: 1 }} id="register-error">
                                {regErr}
                            </Alert>
                        )}
                        {regOk && (
                            <Alert severity="success" sx={{ mt: 1 }} id="register-success">
                                {regOk}
                            </Alert>
                        )}

                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mt: 1 }}>
                            <TextField
                                label="Họ và tên đệm"
                                value={reg.first_name}
                                onChange={onRegChange("first_name")}
                                error={!!regErr}
                                aria-describedby={regErr ? "register-error" : undefined}
                            />
                            <TextField
                                label="Tên"
                                value={reg.last_name}
                                onChange={onRegChange("last_name")}
                                error={!!regErr}
                                aria-describedby={regErr ? "register-error" : undefined}
                            />
                            <TextField
                                label="Tên đăng nhập"
                                value={reg.login_name}
                                onChange={onRegChange("login_name")}
                                error={!!regErr}
                                aria-describedby={regErr ? "register-error" : undefined}
                            />
                            <TextField
                                label="Mật khẩu"
                                type="password"
                                value={reg.password}
                                onChange={onRegChange("password")}
                                error={!!regErr}
                                aria-describedby={regErr ? "register-error" : undefined}
                            />
                            <TextField
                                label="Xác nhận mật khẩu"
                                type="password"
                                value={regPassword2}
                                onChange={(e) => setRegPassword2(e.target.value)}
                                error={!passwordsMatch}
                                helperText={!passwordsMatch ? "Mật khẩu phải khớp." : " "}
                            />
                            <TextField
                                label="Địa chỉ"
                                value={reg.location}
                                onChange={onRegChange("location")}
                                error={!!regErr}
                                aria-describedby={regErr ? "register-error" : undefined}
                            />
                            <TextField
                                label="Nghề nghiệp"
                                value={reg.occupation}
                                onChange={onRegChange("occupation")}
                                error={!!regErr}
                                aria-describedby={regErr ? "register-error" : undefined}
                            />
                        </Box>

                        <TextField
                            label="Mô tả"
                            value={reg.description}
                            onChange={onRegChange("description")}
                            fullWidth
                            margin="normal"
                            multiline
                            minRows={3}
                            error={!!regErr}
                            aria-describedby={regErr ? "register-error" : undefined}
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            sx={{ mt: 1 }}
                            disabled={regLoading || !passwordsMatch}
                            fullWidth
                        >
                            {regLoading ? "Đang đăng ký..." : "Đăng ký"}
                        </Button>
                    </Box>
                )}
            </Box>
        </Paper>
    );
}
