import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, query, orderBy, getDocs, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export interface GameResult {
    type: 'digit' | 'word' | 'number-wall' | 'card-blitz' | 'binary-surge' | 'spoken-numbers' | 'names-gauntlet' | 'word-palace' | 'decathlon' | 'abstract-matrix' | 'multilingual-list' | 'instant-visualization' | 'sensory-walkthrough' | 'system-checker' | 'philosophical-attribution' | 'n-back' | 'quick-math' | 'card-sequence' | 'names-international' | 'image-sequence' | 'visualization-latency' | 'urban-locus-tracer';
    count: number;
    correct: number;
    total: number;
    percentage: number;
    memorizeTime: number;
    recallTime: number;
    timestamp: number;
    date: string;
}

// Image Vault Data Structures
export interface MajorEntry {
    id: string;
    number: string;
    images: string[];
}

export interface PaoEntry {
    id: string;
    card: string;
    person: string;
    action: string;
    object: string;
}

export interface Palace {
    id: string;
    name: string;
    locations: string[];
}

export interface Landmark {
    id: string;
    name: string;
    type: string; // e.g., "school", "hospital", "restaurant", etc.
    lat: number;
    lng: number;
    createdAt: number;
    verified?: boolean;
}

export interface ImageVaultData {
    majorSystem: MajorEntry[];
    paoSystem: PaoEntry[];
    digitPaoSystem: DigitPaoEntry[];
    palaces: Palace[];
    lastUpdated: number;
}

export interface DigitPaoEntry {
    id: string;
    number: string;
    person: string;
    action: string;
    object: string;
}

// Game Results Functions
export const saveGameResult = async (result: Omit<GameResult, 'timestamp' | 'date'>) => {
    try {
        if (!firebaseConfig.apiKey) {
            console.warn("Firebase config missing. Results not saved.");
            return false;
        }

        const now = new Date();
        const data: GameResult = {
            ...result,
            timestamp: now.getTime(),
            date: now.toISOString().split('T')[0]
        };
        await addDoc(collection(db, "game_results"), data);
        return true;
    } catch (e) {
        console.error("Error adding document: ", e);
        return false;
    }
};

export const getGameResults = async () => {
    try {
        if (!firebaseConfig.apiKey) {
            return [];
        }
        // Order by timestamp descending for better performance (most recent first)
        // We can reverse if needed, but typically we want recent data first
        const q = query(collection(db, "game_results"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        // Reverse to get chronological order (oldest first) for charts
        return querySnapshot.docs.map(doc => doc.data() as GameResult).reverse();
    } catch (e) {
        console.error("Error getting documents: ", e);
        return [];
    }
};

// ===== LANDMARKS =====

export const saveLandmark = async (userId: string, landmark: Omit<Landmark, 'id'>) => {
    try {
        const landmarksRef = collection(db, 'landmarks', userId, 'entries');
        const docRef = await addDoc(landmarksRef, {
            ...landmark,
            verified: landmark.verified ?? false,
            createdAt: Date.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving landmark:', error);
        throw error;
    }
};

export const getLandmarks = async (userId: string): Promise<Landmark[]> => {
    try {
        const landmarksRef = collection(db, 'landmarks', userId, 'entries');
        const q = query(landmarksRef, orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Landmark));
    } catch (error) {
        console.error('Error getting landmarks:', error);
        throw error;
    }
};

export const deleteLandmark = async (userId: string, landmarkId: string) => {
    try {
        const landmarkRef = doc(db, 'landmarks', userId, 'entries', landmarkId);
        await deleteDoc(landmarkRef);
    } catch (error) {
        console.error('Error deleting landmark:', error);
        throw error;
    }
};

export const updateLandmark = async (userId: string, landmarkId: string, updates: Partial<Omit<Landmark, 'id'>>) => {
    try {
        const landmarkRef = doc(db, 'landmarks', userId, 'entries', landmarkId);
        await setDoc(landmarkRef, updates, { merge: true });
    } catch (error) {
        console.error('Error updating landmark:', error);
        throw error;
    }
};

// Image Vault Functions
const USER_ID = 'default_user'; // In a real app, this would be the authenticated user's ID

export const saveImageVaultData = async (data: Partial<ImageVaultData>) => {
    try {
        if (!firebaseConfig.apiKey) {
            console.warn("Firebase config missing. Data not saved.");
            return false;
        }

        const docRef = doc(db, "image_vault", USER_ID);
        const existingDoc = await getDoc(docRef);

        const updatedData: ImageVaultData = {
            majorSystem: [],
            paoSystem: [],
            digitPaoSystem: [],
            palaces: [],
            lastUpdated: Date.now(),
            ...(existingDoc.exists() ? existingDoc.data() as ImageVaultData : {}),
            ...data
        };

        await setDoc(docRef, updatedData);
        return true;
    } catch (e) {
        console.error("Error saving Image Vault data: ", e);
        return false;
    }
};

export const getImageVaultData = async (): Promise<ImageVaultData | null> => {
    try {
        if (!firebaseConfig.apiKey) {
            return null;
        }

        const docRef = doc(db, "image_vault", USER_ID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as ImageVaultData;
            return {
                majorSystem: data.majorSystem || [],
                paoSystem: data.paoSystem || [],
                digitPaoSystem: data.digitPaoSystem || [],
                palaces: data.palaces || [],
                lastUpdated: data.lastUpdated
            };
        } else {
            return null;
        }
    } catch (e) {
        console.error("Error getting Image Vault data: ", e);
        return null;
    }
};

export const bootstrapDigitPaoSystem = async (defaultData: DigitPaoEntry[]) => {
    try {
        const currentData = await getImageVaultData();
        
        const updates: Partial<ImageVaultData> = {};
        let needsUpdate = false;

        // Bootstrap Digit PAO if missing
        if (!currentData || !currentData.digitPaoSystem || currentData.digitPaoSystem.length === 0) {
            updates.digitPaoSystem = defaultData;
            needsUpdate = true;
        }

        if (needsUpdate) {
            await saveImageVaultData(updates);
            console.log("Digit PAO system bootstrapped successfully.");
            return true;
        }
        return false;
    } catch (e) {
        console.error("Error bootstrapping Digit PAO system:", e);
        return false;
    }
};

export const bootstrapCardPaoSystem = async (defaultData: PaoEntry[]) => {
    try {
        const currentData = await getImageVaultData();
        // If no data exists, or if paoSystem is empty/missing, we bootstrap
        if (!currentData || !currentData.paoSystem || currentData.paoSystem.length === 0) {
            await saveImageVaultData({
                paoSystem: defaultData
            });
            console.log("Card PAO system bootstrapped successfully.");
            return true;
        }
        return false;
    } catch (e) {
        console.error("Error bootstrapping Card PAO system:", e);
        return false;
    }
};

export const bootstrapMajorSystem = async (defaultData: MajorEntry[]) => {
    try {
        const currentData = await getImageVaultData();
        // If no data exists, or if majorSystem is empty/missing, we bootstrap
        if (!currentData || !currentData.majorSystem || currentData.majorSystem.length === 0) {
            await saveImageVaultData({
                majorSystem: defaultData
            });
            console.log("Major System bootstrapped successfully.");
            return true;
        }
        return false;
    } catch (e) {
        console.error("Error bootstrapping Major System:", e);
        return false;
    }
};
