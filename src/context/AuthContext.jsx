// src/context/AuthContext.jsx
// Lightweight in-memory auth + patient profile context (no backend required)
import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(sessionStorage.getItem("ai_user")) || null; } catch { return null; }
    });
    const [profile, setProfile] = useState(() => {
        try { return JSON.parse(sessionStorage.getItem("ai_profile")) || null; } catch { return null; }
    });

    const login = (userData) => {
        setUser(userData);
        sessionStorage.setItem("ai_user", JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        setProfile(null);
        sessionStorage.removeItem("ai_user");
        sessionStorage.removeItem("ai_profile");
    };

    const saveProfile = (profileData) => {
        setProfile(profileData);
        sessionStorage.setItem("ai_profile", JSON.stringify(profileData));
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, profile, saveProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
