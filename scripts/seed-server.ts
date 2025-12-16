import { Client, Databases, ID, Permission, Role } from "react-native-appwrite";
// @ts-ignore
const dummyData = require("../lib/data").default;

interface Category {
    name: string;
    description: string;
}

interface Customization {
    name: string;
    price: number;
    type: "topping" | "side" | "size" | "crust" | string;
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
    customizations: string[];
}

interface DummyData {
    categories: Category[];
    customizations: Customization[];
    menu: MenuItem[];
}

const data = dummyData as DummyData;

const appwriteConfig = {
    endpoint: process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1",
    projectID: process.env.APPWRITE_PROJECT_ID || "",
    apiKey: process.env.APPWRITE_API_KEY || "",
    databaseId: "692a9ab40026a0f4194e",
    categoryCollectionId: "categories",
    menuCollectionId: "menu",
    customizationCollectionId: "customization",
    menu_customizationsCollectionId: "menu_customizations",
};

const client = new Client()
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectID);

// For server-side scripts, we'll use the API key in the headers
const databases = new Databases(client);

// Set the API key in the client's headers
client.headers = {
    ...client.headers,
    'X-Appwrite-Key': appwriteConfig.apiKey,
};

async function createCollectionIfNotExists(
    collectionId: string,
    collectionName: string,
    attributes: any[] = []
): Promise<void> {
    try {
        // In react-native-appwrite, we'll just try to list the collection
        // If it doesn't exist, it will throw an error
        await databases.listDocuments(appwriteConfig.databaseId, collectionId);
        console.log(`✓ Collection ${collectionId} already exists`);
    } catch (error: any) {
        if (error.code === 404 || error.code === 401) {
            console.log(`Collection ${collectionId} doesn't exist or access denied.`);
            console.log('Note: You need to create collections manually in the Appwrite console.');
            console.log('Please create these collections in your Appwrite project:');
            console.log(`- ${collectionId} (${collectionName})`);
            console.log('Then run this script again.');
            process.exit(1);
        } else {
            console.error(`Error checking collection ${collectionId}:`, error);
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
            list.documents.map((doc: { $id: string }) =>
                databases.deleteDocument(appwriteConfig.databaseId, collectionId, doc.$id)
            )
        );
        console.log(`✓ Cleared ${collectionId}`);
    } catch (error: any) {
        if (error.code === 404 || error.code === 401) {
            console.log(`Collection ${collectionId} doesn't exist or access denied, skipping clear`);
        } else {
            console.error(`Error clearing collection ${collectionId}:`, error);
            throw error;
        }
    }
}

async function seed(): Promise<void> {
    try {
        console.log("🚀 Starting server-side seed process...");

        // 0. Ensure all collections exist
        console.log("📋 Ensuring collections exist...");
        await createCollectionIfNotExists(
            appwriteConfig.categoryCollectionId,
            "Categories"
        );
        await createCollectionIfNotExists(
            appwriteConfig.customizationCollectionId,
            "Customizations"
        );
        await createCollectionIfNotExists(
            appwriteConfig.menuCollectionId,
            "Menu"
        );
        await createCollectionIfNotExists(
            appwriteConfig.menu_customizationsCollectionId,
            "Menu Customizations"
        );
        console.log("✓ All collections verified");

        // 1. Clear all
        console.log("🧹 Clearing existing data...");
        await clearAll(appwriteConfig.categoryCollectionId);
        await clearAll(appwriteConfig.customizationCollectionId);
        await clearAll(appwriteConfig.menuCollectionId);
        await clearAll(appwriteConfig.menu_customizationsCollectionId);

        // 2. Create Categories
        console.log("📝 Creating categories...");
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
        console.log("🔧 Creating customizations...");
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
        console.log("🍽️  Creating menu items...");
        const menuMap: Record<string, string> = {};
        for (const item of data.menu) {
            console.log(`Processing: ${item.name}`);

            const doc = await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.menuCollectionId,
                ID.unique(),
                {
                    name: item.name,
                    description: item.description,
                    image_url: item.image_url,
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
        console.error("❌ Seed failed:", error);
        throw error;
    }
}

seed().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
