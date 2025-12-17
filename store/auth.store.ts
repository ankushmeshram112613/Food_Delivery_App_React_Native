import { create } from 'zustand'
import { User } from '@/type';
import { getCurrentUser, signIn } from "@/lib/appwrite";

type AuthState = {
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;
    error: string | null;
    setIsAuthenticated: (isAuthenticated: boolean) => void;
    setUser: (user: User | null) => void;
    setIsLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
    fetchAuthenticatedUser: () => Promise<void>;
    clearAuth: () => void;
    signIn: (credentials: { email: string; password: string }) => Promise<void>;
}

const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: false,
    user: null,
    isLoading: false,
    error: null,

    setIsAuthenticated: (value) => set({ isAuthenticated: value }),
    setUser: (user) => set({ user }),
    setIsLoading: (value) => set({ isLoading: value }),
    setError: (error) => set({ error }),

    clearAuth: () => set({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null
    }),

    signIn: async ({ email, password }) => {
        set({ isLoading: true, error: null });
        
        try {
            await signIn({ email, password });
            await useAuthStore.getState().fetchAuthenticatedUser();
        } catch (error: any) {
            set({ 
                error: error.message || 'Failed to sign in',
                isAuthenticated: false,
                user: null
            });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    fetchAuthenticatedUser: async () => {
        set({ isLoading: true, error: null });
        console.log('fetchAuthenticatedUser started');

        try {
            const user = await getCurrentUser();
            console.log('fetchAuthenticatedUser result:', user);

            if (user) {
                set({
                    isAuthenticated: true,
                    user,
                    error: null
                });
            } else {
                set({
                    isAuthenticated: false,
                    user: null,
                    error: 'No user session found'
                });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user';
            console.error('fetchAuthenticatedUser error:', error);
            set({
                isAuthenticated: false,
                user: null,
                error: errorMessage
            });
        } finally {
            set({ isLoading: false });
        }
    }
}));

export default useAuthStore;