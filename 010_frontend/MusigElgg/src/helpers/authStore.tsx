import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================
export type UserRole = 'Admin' | 'Member' | 'Public';

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    registerName?: string;
    avatarUrl?: string;
}

interface LoginResponse {
    token: string;
    user: User;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    loginWithPasskey: () => Promise<boolean>;
    logout: () => void;
    canAccess: (feature: 'music' | 'tasks' | 'events' | 'admin') => boolean;
}

// ============================================================================
// Context
// ============================================================================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize state from localStorage on mount
    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('user');
            const token = localStorage.getItem('jwt');
            if (storedUser && token) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error('Failed to parse user from localStorage', error);
            localStorage.removeItem('user');
            localStorage.removeItem('jwt');

            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const login = async (email: string, password: string): Promise<boolean> => {
        setIsLoading(true);
        try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5141';
            const response = await fetch(`${baseUrl}/api/Auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                return false;
            }

            const data: LoginResponse = await response.json();

            // Persist
            localStorage.setItem('jwt', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            setUser(data.user);
            return true;
        } catch (error) {
            console.error('Login error', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithPasskey = async (): Promise<boolean> => {
        // Stub for future implementation
        console.warn('Passkey login not implemented yet.');
        return false;
    };

    const logout = () => {
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
        setUser(null);
    };

    const canAccess = (feature: 'music' | 'tasks' | 'events' | 'admin'): boolean => {
        if (!user) return false;

        switch (feature) {
            case 'admin':
                return user.role === 'Admin';
            case 'music':
            case 'tasks':
            case 'events':
                return user.role === 'Admin' || user.role === 'Member';
            default:
                return false;
        }
    };

    const authValue: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithPasskey,
        logout,
        canAccess,
    };

    return (
        <AuthContext.Provider value= { authValue } >
        { children }
        </AuthContext.Provider>
    );
}

// ============================================================================
// Hooks
// ============================================================================
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
