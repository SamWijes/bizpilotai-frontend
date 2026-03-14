import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [business, setBusiness] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restore session on page reload
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const saved = localStorage.getItem('bizUser');
        const savedBiz = localStorage.getItem('bizBusiness');
        if (token && saved) {
            setUser(JSON.parse(saved));
            if (savedBiz) setBusiness(JSON.parse(savedBiz));
        }
        setLoading(false);
    }, []);

    const login = useCallback(async (credentials) => {
        const { data } = await authAPI.login(credentials);
        const { accessToken, refreshToken, user: u, business: b } = data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('bizUser', JSON.stringify(u));
        if (b) localStorage.setItem('bizBusiness', JSON.stringify(b));
        setUser(u);
        setBusiness(b);
        return { user: u, business: b };
    }, []);

    const register = useCallback(async (payload) => {
        const { data } = await authAPI.register(payload);
        const { accessToken, refreshToken, user: u, business: b } = data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('bizUser', JSON.stringify(u));
        if (b) localStorage.setItem('bizBusiness', JSON.stringify(b));
        setUser(u);
        setBusiness(b);
    }, []);

    const logout = useCallback(async () => {
        try { await authAPI.logout(); } catch { /* ignore */ }
        localStorage.clear();
        setUser(null);
        setBusiness(null);
    }, []);

    const isAdmin = user?.role === 'ADMIN';
    const isOwner = user?.role === 'OWNER';

    return (
        <AuthContext.Provider value={{ user, business, loading, login, register, logout, isAdmin, isOwner }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};
