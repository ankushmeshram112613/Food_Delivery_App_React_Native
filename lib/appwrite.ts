import {Account, Avatars, Client, Databases, ID, Query} from "react-native-appwrite";
import {CreateUserParams, SignInParams} from "@/type";
import {data} from "browserslist";
// import SignIn from "@/app/(auth)/sign-in";
import {User} from "@/type";

if (!process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || !process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || !process.env.EXPO_PUBLIC_APPWRITE_PROJECT_NAME) {
    throw new Error('Missing required environment variables for Appwrite configuration');
}

export const appwriteConfig = {
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT as string,
    projectID: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID as string,
    platform: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_NAME as string,
    databaseId: "692a9ab40026a0f4194e",
    userCollectionId: "users",
};


export const client = new Client();

client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectID)
    .setPlatform(appwriteConfig.platform)

export const account = new Account(client);
export const databases = new Databases(client);
const avatars = new Avatars(client)

export const creatUser = async ({email, password, name}: CreateUserParams) => {
    try {
        // First, check if there's an active session and end it
        try {
            await account.deleteSession('current');
        } catch (sessionError) {
            // Ignore if there's no active session
            console.log('No active session to delete');
        }

        // Create the new account
        const newAccount = await account.create(ID.unique(), email, password, name);
        if (!newAccount) throw new Error('Failed to create account');

        // Create avatar URL
        const avatarUrl = avatars.getInitialsURL(name);

        // Create user document in database
        return await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            {
                email,
                name,
                accountId: newAccount.$id,
                avetar: avatarUrl  // Changed from 'avatar' to 'avetar' to match database schema
            }
        );
    } catch (error) {
        console.error('Error in creatUser:', error);
        throw error instanceof Error ? error : new Error('An unknown error occurred');
    }
}


export const signIn = async ({email, password}: SignInParams) => {
    try {
        // Delete any existing session first
        try {
            await account.deleteSession('current');
        } catch (sessionError) {
            console.log('No active session to delete');
        }

        // Create new session
        const session = await account.createEmailPasswordSession(email, password);

        if (!session) {
            throw new Error('Failed to create session');
        }

        // Get the current user to verify authentication
        const currentUser = await account.get();

        if (!currentUser) {
            throw new Error('Failed to authenticate user');
        }

        return currentUser;
    } catch (error) {
        console.error('Sign in error:', error);
        // Make sure to clear any partial session on error
        try {
            await account.deleteSession('current');
        } catch (e) {
            console.log('Error cleaning up session:', e);
        }
        throw error instanceof Error ? error : new Error('Failed to sign in');
    }
}


export const getCurrentUser = async () => {
    try {
        // First check if we have a valid session
        try {
            const session = await account.getSession('current');
            if (!session) return null;
        } catch (error) {
            console.log('No valid session found');
            return null;
        }

        // If we have a session, get the user
        const currentAccount = await account.get();
        if (!currentAccount) return null;

        // Get user document from database
        const userData = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal('accountId', currentAccount.$id)]
        );

        if (!userData.documents.length) {
            throw new Error('User document not found');
        }

        return {
            id: currentAccount.$id,
            name: currentAccount.name,
            email: currentAccount.email,
            ...userData.documents[0]
        };
    } catch (error) {
        console.error('Error in getCurrentUser:', error);
        // Clear the session if there's an error
        try {
            await account.deleteSession('current');
        } catch (e) {
            console.log('Error deleting session:', e);
        }
        return null;
    }
}