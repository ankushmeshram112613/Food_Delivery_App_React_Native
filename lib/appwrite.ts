import {Account, Avatars, Client, Databases, ID, Query , Storage} from "react-native-appwrite";
import {CreateUserParams, GetMenuParams, MenuItem, SignInParams} from "@/type";
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
    bucketId: "69306ea2002af87301b9",
    userCollectionId: "users",
    categoryCollectionId: "categories",
    menuCollectionId: "menu",
    customizationCollectionId: "customization",
    orderCollectionId: "orders",
    menu_customizationsCollectionId: "menu_customizations",
};


export const client = new Client();

client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectID)
    .setPlatform(appwriteConfig.platform)

export const account = new Account(client);
export const databases = new Databases(client);
const avatars = new Avatars(client)
export  const storage = new Storage(client)

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
            newAccount.$id,
            {
                email,
                name,
                accountId: newAccount.$id,
                avatar: avatarUrl
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

        // Get the full user document from the database
        const userDoc = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal('accountId', currentUser.$id)]
        );

        if (!userDoc.documents.length) {
            throw new Error('User document not found');
        }

        return {
            ...currentUser,
            ...userDoc.documents[0]
        };
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
            ...currentAccount,
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

export const getMenu = async ({ category, query }: GetMenuParams): Promise<MenuItem[]> => {
    try {
        const queries: string[] = [];

        if(category) queries.push(Query.equal('categories', category));
        if(query) queries.push(Query.search('name', query));

        const menus = await databases.listDocuments<MenuItem>(
            appwriteConfig.databaseId,
            appwriteConfig.menuCollectionId,
            queries,
        )

        return menus.documents as unknown as MenuItem[];
    } catch (e) {
        throw new Error(e as string);
    }
}

export const getCategories = async () => {
    try {
        console.log('Fetching categories from collection: categories');
        console.log('Database ID:', appwriteConfig.databaseId);
        
        const categories = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.categoryCollectionId,
            [
                Query.orderAsc('name')
            ]
        );

        console.log('Successfully fetched categories:', categories.documents.length);
        
        // Transform the documents to match the Category type
        return categories.documents.map(doc => ({
            ...doc,
            name: doc.name || '',
            description: doc.description || ''
        }));
    } catch (e: any) {
        console.error('Error fetching categories:', {
            message: e.message,
            code: e.code,
            type: e.type
        });
        
        if (e.code === 404) {
            console.warn('Categories collection not found. Please run the seed function to initialize the database.');
        }
        
        // Return empty array to prevent app crash
        return [];
    }
};

export const signOut = async () => {
    try {
        await account.deleteSession('current');
    } catch (error) {
        console.error('Sign out error:', error);
        throw error;
    }
}

export const uploadFile = async (uri: string, name: string, type: string) => {
    const asset = {
        uri,
        name,
        type,
    };

    try {
        const uploadedFile = await storage.createFile(
            appwriteConfig.bucketId,
            ID.unique(),
            asset as any
        );
        return uploadedFile;
    } catch (error) {
        throw new Error(error as string);
    }
}

export const getFilePreview = async (fileId: string): Promise<string> => {
    try {
        const fileUrl = storage.getFileView(
            appwriteConfig.bucketId,
            fileId
        );
        return fileUrl.toString(); // Convert URL object to string
    } catch (error) {
        console.error('Error getting file preview:', error);
        throw new Error('Failed to get file preview');
    }
}

export const updateUser = async (userId: string, data: Partial<User>) => {
    try {
        return await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            userId,
            data
        );
    } catch (error) {
        throw new Error(error as string);
    }
}
