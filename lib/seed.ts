import { ID } from "react-native-appwrite";
import { appwriteConfig, databases, storage } from "./appwrite";
import dummyData from "./data";
import { Permission, Role } from "react-native-appwrite";

interface Category {
    name: string;
    description: string;
}

interface Customization {
    name: string;
    price: number;
    type: "topping" | "side" | "size" | "crust" | string; // extend as needed
}

interface MenuItem {
    name: string;
    description: string;
    image_url: string;
    price: number;
    rating: number;
    calories: number;
    protein: number;
    category_name: string;
    customizations: string[]; // list of customization names
}

interface DummyData {
    categories: Category[];
    customizations: Customization[];
    menu: MenuItem[];
}

// ensure dummyData has correct shape
const data = dummyData as DummyData;

async function ensureCollectionExists(collectionId: string): Promise<void> {
    try {
        // Try to list documents to see if the collection exists
        await databases.listDocuments(appwriteConfig.databaseId, collectionId);
    } catch (error: any) {
        if (error.code === 404) {
            // Collection doesn't exist
            console.error(`Collection ${collectionId} does not exist. Please run the server-side seed script first.`);
            throw new Error(`Collection ${collectionId} not found. Run: npm run seed:server`);
        } else {
            throw error;
        }
    }
}

async function clearAll(collectionId: string): Promise<void> {
    try {
        const list = await databases.listDocuments(
            appwriteConfig.databaseId,
            collectionId
        );

        await Promise.all(
            list.documents.map((doc) =>
                databases.deleteDocument(appwriteConfig.databaseId, collectionId, doc.$id)
            )
        );
    } catch (error: any) {
        if (error.code === 404) {
            console.log(`Collection ${collectionId} doesn't exist yet, skipping clear`);
        } else {
            throw error;
        }
    }
}

async function clearStorage(): Promise<void> {
    const list = await storage.listFiles(appwriteConfig.bucketId);

    await Promise.all(
        list.files.map((file) =>
            storage.deleteFile(appwriteConfig.bucketId, file.$id)
        )
    );
}

async function uploadImageToStorage(imageUrl: string) {
    try {
        console.log(`Processing image from: ${imageUrl}`);
        
        // For now, return the original URL directly
        // TODO: Implement actual Appwrite storage upload when backend is configured
        console.log(`Using original image URL (Appwrite storage not yet configured)`);
        return imageUrl;
        
        /* Commented out until Appwrite storage is properly configured
        const response = await fetch(imageUrl, { timeout: 15000 });
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        const blob = await response.blob();
        console.log(`Image fetched successfully, size: ${blob.size} bytes`);

        const fileObj = {
            name: imageUrl.split("/").pop() || `file-${Date.now()}.jpg`,
            type: blob.type,
            size: blob.size,
            uri: imageUrl,
        };

        console.log(`Uploading file to Appwrite storage...`);
        const file = await storage.createFile(
            appwriteConfig.bucketId,
            ID.unique(),
            fileObj
        );
        console.log(`File uploaded successfully with ID: ${file.$id}`);

        const fileUrl = storage.getFileViewURL(appwriteConfig.bucketId, file.$id);
        console.log(`File URL: ${fileUrl}`);
        return fileUrl;
        */
    } catch (error) {
        console.error(`Error uploading image ${imageUrl}:`, error);
        throw error;
    }
}

async function seed(): Promise<void> {
    try {
        console.log('🚀 Starting seed process...');
        
        // 0. Ensure all collections exist
        console.log('📋 Ensuring collections exist...');
        await ensureCollectionExists(appwriteConfig.categoryCollectionId);
        await ensureCollectionExists(appwriteConfig.customizationCollectionId);
        await ensureCollectionExists(appwriteConfig.menuCollectionId);
        await ensureCollectionExists(appwriteConfig.menu_customizationsCollectionId);
        console.log('✓ All collections verified');
        
        // 1. Clear all
        console.log('🧹 Clearing existing data...');
        await clearAll(appwriteConfig.categoryCollectionId);
        console.log('✓ Cleared categories');
        await clearAll(appwriteConfig.customizationCollectionId);
        console.log('✓ Cleared customizations');
        await clearAll(appwriteConfig.menuCollectionId);
        console.log('✓ Cleared menu items');
        await clearAll(appwriteConfig.menu_customizationsCollectionId);
        console.log('✓ Cleared menu customizations');
        await clearStorage();
        console.log('✓ Cleared storage');

        // 2. Create Categories
        console.log('📝 Creating categories...');
        const categoryMap: Record<string, string> = {};
        for (const cat of data.categories) {
            const doc = await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.categoryCollectionId,
                ID.unique(),
                cat
            );
            categoryMap[cat.name] = doc.$id;
        }
        console.log(`✓ Created ${data.categories.length} categories`);

        // 3. Create Customizations
        console.log('🔧 Creating customizations...');
        const customizationMap: Record<string, string> = {};
        for (const cus of data.customizations) {
            const doc = await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.customizationCollectionId,
                ID.unique(),
                {
                    name: cus.name,
                    price: cus.price,
                    type: cus.type,
                }
            );
            customizationMap[cus.name] = doc.$id;
        }
        console.log(`✓ Created ${data.customizations.length} customizations`);

        // 4. Create Menu Items
        console.log('🍽️  Creating menu items...');
        const menuMap: Record<string, string> = {};
        for (const item of data.menu) {
            console.log(`Processing: ${item.name}`);
            const uploadedImage = await uploadImageToStorage(item.image_url);

            const doc = await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.menuCollectionId,
                ID.unique(),
                {
                    name: item.name,
                    description: item.description,
                    image_url: uploadedImage,
                    price: item.price,
                    rating: item.rating,
                    calories: item.calories,
                    protein: item.protein,
                }
            );

            menuMap[item.name] = doc.$id;

            // 5. Create menu_customizations
            for (const cusName of item.customizations) {
                await databases.createDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.menu_customizationsCollectionId,
                    ID.unique(),
                    {
                        menu: doc.$id,
                        customization: customizationMap[cusName],
                    }
                );
            }
        }

        console.log("✅ Seeding complete.");
    } catch (error) {
        console.error('❌ Seed failed:', error);
        throw error;
    }
}

export default seed;