import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, query, orderBy, getDocs } from "firebase/firestore";

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
    type: 'digit' | 'word' | 'number-wall' | 'card-blitz' | 'binary-surge' | 'spoken-numbers' | 'names-gauntlet' | 'word-palace' | 'decathlon' | 'abstract-matrix' | 'multilingual-list';
    count: number;
    correct: number;
    total: number;
    percentage: number;
    memorizeTime: number;
    recallTime: number;
    timestamp: number;
    date: string;
}

export const saveGameResult = async (result: Omit<GameResult, 'timestamp' | 'date'>) => {
    try {
        // Check if config is present, otherwise warn and skip
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
