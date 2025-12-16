import { create } from 'zustand'
import { User } from '@/type' ;
import {getCurrentUser} from "@/lib/appwrite";


type AuthState = {
  isAuthenticated: boolean;
  user : User | null;
  isLoading: boolean;

  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setUser: (user: User | null) => void;
  setIsLoading: (isLoading: boolean) => void;

  fetchAuthenticatedUser    : () => Promise<void>;
}

const useAuthStore = create <AuthState>((set) => ({
   isAuthenticated: false,
    user : null,
    isLoading : false,

    setIsAuthenticated : (value) => set({isAuthenticated : value}),
    setUser : (user) => set({user}),
    setIsLoading : (value) => set({isLoading: value}),

    fetchAuthenticatedUser : async () => {
       set({isLoading : true})
        try {
            const appwriteUser = await getCurrentUser();

            if (appwriteUser) {
                // Map the Appwrite user to our User type
                const user: User = {
                    ...appwriteUser,
                    // Ensure all required fields are present
                    accountId: appwriteUser.$id || '',
                    // Use optional chaining for avatar since it might not exist
                    avatar: 'avatar' in appwriteUser ? (appwriteUser as any).avatar : null,
                    // Map any other fields as needed
                    name: appwriteUser.name || '',
                    email: appwriteUser.email || '',
                };
                
                set({ isAuthenticated: true, user });
            } else {
                set({ isAuthenticated: false, user: null });
            }
        } catch (e) {
            console.log('fetchAuthenticatedUser error', e);
            set({ isAuthenticated: false, user: null });
        } finally {
            set({ isLoading: false });
        }
    }
}))

export default useAuthStore;
