import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authService } from '@/services/authService';
import socketService from '@/services/socketService';
import { fcmPushService } from '@/services/fcmPushService';
import { storage } from '@/lib/storage';
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
                // Ensure WebSocket is connected for presence tracking
                const token = authService.getToken();
                if (token && !socketService.isConnected()) {
                    socketService.connect(token).catch(err =>
                        console.warn('WebSocket connection failed:', err)
                    );
                }
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
            // On native: pre-populate the synchronous cache from Capacitor Preferences
            // so that authService.getToken() / isAuthenticated() work correctly.
            await storage.initFromPreferences(['accessToken', 'refreshToken']);
            await refreshUser();
            setIsLoading(false);
        };
        initAuth();
    }, [refreshUser]);

    const login = async (credentials: LoginDto) => {
        const response = await authService.login(credentials);
        authService.setToken(response.token);
        if (response.refreshToken) {
            authService.setRefreshToken(response.refreshToken);
        }
        setUser(response.user);
        // Connect WebSocket for presence tracking
        socketService.connect(response.token).catch(err =>
            console.warn('WebSocket connection failed:', err)
        );
        // Register FCM token on native app (fire-and-forget)
        fcmPushService.registerAndSendToken().catch(err =>
            console.warn('[FCM] Token registration failed:', err)
        );
    };

    const logout = () => {
        fcmPushService.removeAllListeners().catch(() => {});
        socketService.disconnect();
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

export function useCan(): (permission: string) => boolean {
    const { user } = useAuth();
    
    return useCallback((permission: string) => {
        if (!user) return false;
        
        // Admins have all permissions
        if (user.role === 'admin') return true;
        
        // Check explicit permissions
        const hasExplicitPermission = user.permissions?.some(
            p => p.permission.key === permission
        );

        return Boolean(hasExplicitPermission);
    }, [user]);
}

export function useIsAuthenticated(): boolean {
    return useAuth().isAuthenticated;
}

export function useCurrentRegisterId(): number | null {
    const { user } = useAuth();
    return user?.registerId ?? null;
}

export default AuthContext;
