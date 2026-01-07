import React, { useMemo, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme, useMediaQuery } from "@mui/material";
import AppRoutes from "./routes/AppRoutes";
import { ThemeModeContext } from "./context/ThemeModeContext";

export default function App() {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const [mode, setMode] = useState(() => {
    const stored = localStorage.getItem("themeMode");
    if (stored === "light" || stored === "dark") return stored;
    return prefersDark ? "dark" : "light";
  });

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === "dark" ? "#64b5f6" : "#1976d2",
          },
          secondary: {
            main: mode === "dark" ? "#ffb74d" : "#ff9800",
          },
          background: {
            default: mode === "dark" ? "#0f172a" : "#f6f7fb",
            paper: mode === "dark" ? "#111827" : "#ffffff",
          },
          text: {
            primary: mode === "dark" ? "#e5e7eb" : "#111827",
            secondary: mode === "dark" ? "#cbd5f5" : "#4b5563",
          },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              "*:focus-visible": {
                outline: mode === "dark" ? "2px solid #93c5fd" : "2px solid #2563eb",
                outlineOffset: 2,
              },
            },
          },
          MuiButtonBase: {
            styleOverrides: {
              root: {
                "&.Mui-focusVisible": {
                  outline: mode === "dark" ? "2px solid #93c5fd" : "2px solid #2563eb",
                  outlineOffset: 2,
                },
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: "none",
              },
            },
          },
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: mode === "dark" ? "#93c5fd" : "#2563eb",
                  borderWidth: 2,
                },
              },
            },
          },
        },
      }),
    [mode]
  );

  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("themeMode", next);
      return next;
    });
  };

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}
