import React, { createContext, useContext, useState, useEffect } from 'react';
import { Client } from '../api/web-api-client';
import type { LoginDto, UserDetailDto } from '../api/web-api-client';

interface AuthContextType {
    user: UserDetailDto | null;
    isAuthenticated: boolean;
    login: (data: LoginDto) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const client = new Client("");

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<UserDetailDto | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const userData = await client.me();
                setUser(userData);
            } catch (error) {
                console.error("Auth check failed", error);
                localStorage.removeItem('access_token');
            }
        }
        setIsLoading(false);
    };

    const login = async (data: LoginDto) => {
        const response = await client.login(data);
        if (response && response.accessToken) {
            localStorage.setItem('access_token', response.accessToken);
            await checkAuth();
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
