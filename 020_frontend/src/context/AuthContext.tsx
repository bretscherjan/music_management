import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authService } from '@/services/authService';
import type { User, LoginDto } from '@/types';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (credentials: LoginDto) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        try {
            if (authService.isAuthenticated()) {
                const userData = await authService.getMe();
                setUser(userData);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Failed to refresh user:', error);
            setUser(null);
            authService.logout();
        }
    }, []);

    useEffect(() => {
        const initAuth = async () => {
            setIsLoading(true);
            await refreshUser();
            setIsLoading(false);
        };
        initAuth();
    }, [refreshUser]);

    const login = async (credentials: LoginDto) => {
        const response = await authService.login(credentials);
        authService.setToken(response.token);
        setUser(response.user);
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Convenience hooks
export function useUser(): User | null {
    return useAuth().user;
}

export function useIsAdmin(): boolean {
    const { user } = useAuth();
    return user?.role === 'admin';
}

export function useIsAuthenticated(): boolean {
    return useAuth().isAuthenticated;
}

export function useCurrentRegisterId(): number | null {
    const { user } = useAuth();
    return user?.registerId ?? null;
}

export default AuthContext;
