import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { authApi } from '@/lib/api';
import type { User } from '@/types';

interface AuthContextValue {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    setUser: (user: User | null) => void;
    refetch: () => Promise<unknown>;
    logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['auth', 'user'],
        queryFn: async () => {
            try {
                return await authApi.user();
            } catch (error) {
                if (error instanceof AxiosError && error.response?.status === 401) {
                    return null;
                }
                throw error;
            }
        },
        retry: false,
        staleTime: 1000 * 60 * 5,
    });

    const setUser = React.useCallback(
        (user: User | null) => {
            queryClient.setQueryData(['auth', 'user'], user);
        },
        [queryClient],
    );

    const logout = React.useCallback(async () => {
        await authApi.logout();
        queryClient.setQueryData(['auth', 'user'], null);
        queryClient.clear();
    }, [queryClient]);

    const value = React.useMemo<AuthContextValue>(
        () => ({
            user: data ?? null,
            isLoading,
            isAuthenticated: !!data,
            setUser,
            refetch,
            logout,
        }),
        [data, isLoading, setUser, refetch, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = React.useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
