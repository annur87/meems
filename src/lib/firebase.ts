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
    type: 'digit' | 'word' | 'number-wall' | 'card-blitz' | 'binary-surge' | 'spoken-numbers' | 'names-gauntlet' | 'word-palace' | 'decathlon' | 'abstract-matrix' | 'multilingual-list' | 'instant-visualization' | 'sensory-walkthrough' | 'system-checker';
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

export interface ImageVaultData {
    majorSystem: MajorEntry[];
    paoSystem: PaoEntry[];
    palaces: Palace[];
    lastUpdated: number;
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
        const q = query(collection(db, "game_results"), orderBy("timestamp", "asc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as GameResult);
    } catch (e) {
        console.error("Error getting documents: ", e);
        return [];
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
            majorSystem: data.majorSystem || [],
            paoSystem: data.paoSystem || [],
            palaces: data.palaces || [],
            lastUpdated: Date.now(),
            ...(existingDoc.exists() ? existingDoc.data() : {}),
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
            return docSnap.data() as ImageVaultData;
        }
        return null;
    } catch (e) {
        console.error("Error getting Image Vault data: ", e);
        return null;
    }
};
