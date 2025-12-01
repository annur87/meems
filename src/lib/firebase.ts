import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, query, orderBy, getDocs, doc, setDoc, getDoc, deleteDoc, where } from "firebase/firestore";

// ... existing code ...

export const getCardHistory = async (
    cardNumber: string,
    userId: string = USER_ID,
    timeFilter?: '1d' | '1w' | '1m' | '1y' | 'all'
): Promise<CardAttempt[]> => {
    try {
        if (!firebaseConfig.apiKey) {
            return [];
        }

        const attemptsRef = collection(db, 'major_system_attempts', userId, 'attempts');
        // Fetch by card number, sort in memory to avoid index requirement issues
        const q = query(attemptsRef, where('cardNumber', '==', cardNumber));
        
        const snapshot = await getDocs(q);
        let attempts = snapshot.docs.map(doc => doc.data() as CardAttempt);
        
        // Sort by timestamp ascending
        attempts.sort((a, b) => a.timestamp - b.timestamp);
        
        // Filter by time
        if (timeFilter && timeFilter !== 'all') {
            const now = Date.now();
            let cutoff = 0;
            if (timeFilter === '1d') cutoff = now - 24 * 60 * 60 * 1000;
            else if (timeFilter === '1w') cutoff = now - 7 * 24 * 60 * 60 * 1000;
            else if (timeFilter === '1m') cutoff = now - 30 * 24 * 60 * 60 * 1000;
            else if (timeFilter === '1y') cutoff = now - 365 * 24 * 60 * 60 * 1000;
            
            attempts = attempts.filter(a => a.timestamp >= cutoff);
        }
        
        return attempts;
    } catch (error) {
        console.error('Error fetching card history:', error);
        return [];
    }
};

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

// ===== TRAINING FAVORITES =====

export const getFavorites = async (userId: string = USER_ID): Promise<string[]> => {
    try {
        if (!firebaseConfig.apiKey) {
            return [];
        }
        const docRef = doc(db, 'training_favorites', userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            return data.favorites || [];
        }
        return [];
    } catch (error) {
        console.error('Error loading favorites:', error);
        return [];
    }
};

export const saveFavorites = async (favorites: string[], userId: string = USER_ID): Promise<boolean> => {
    try {
        if (!firebaseConfig.apiKey) {
            console.warn("Firebase config missing. Favorites not saved.");
            return false;
        }
        const docRef = doc(db, 'training_favorites', userId);
        await setDoc(docRef, {
            favorites,
            lastUpdated: Date.now()
        });
        return true;
    } catch (error) {
        console.error('Error saving favorites:', error);
        return false;
    }
};

// ===== MAJOR SYSTEM CARD STATISTICS =====

export interface CardAttempt {
    cardNumber: string;
    isCorrect: boolean;
    responseTime: number; // milliseconds
    timestamp: number;
    questionType: 'digits' | 'words'; // which direction was tested
}

export interface CardStats {
    cardNumber: string;
    totalAttempts: number;
    mistakes: number;
    averageTime: number; // milliseconds
    lastAttempt: number;
    performanceScore: number; // 0-100, higher is better
}

export const saveCardAttempt = async (attempt: CardAttempt, userId: string = USER_ID): Promise<boolean> => {
    try {
        if (!firebaseConfig.apiKey) {
            console.warn("Firebase config missing. Card attempt not saved.");
            return false;
        }
        
        const attemptsRef = collection(db, 'major_system_attempts', userId, 'attempts');
        await addDoc(attemptsRef, attempt);
        return true;
    } catch (error) {
        console.error('Error saving card attempt:', error);
        return false;
    }
};

export const getCardStats = async (
    userId: string = USER_ID, 
    timeFilter?: '1d' | '1w' | '1m' | '1y' | 'all'
): Promise<Map<string, CardStats>> => {
    try {
        if (!firebaseConfig.apiKey) {
            return new Map();
        }

        const attemptsRef = collection(db, 'major_system_attempts', userId, 'attempts');
        let q = query(attemptsRef, orderBy('timestamp', 'desc'));

        // Apply time filter
        if (timeFilter && timeFilter !== 'all') {
            const now = Date.now();
            const timeRanges = {
                '1d': 24 * 60 * 60 * 1000,
                '1w': 7 * 24 * 60 * 60 * 1000,
                '1m': 30 * 24 * 60 * 60 * 1000,
                '1y': 365 * 24 * 60 * 60 * 1000
            };
            const cutoff = now - timeRanges[timeFilter];
            // Note: Firestore query requires an index for this
            // For now, we'll filter in memory
        }

        const snapshot = await getDocs(q);
        const attempts: CardAttempt[] = snapshot.docs.map(doc => doc.data() as CardAttempt);

        // Apply time filter in memory if needed
        const filteredAttempts = timeFilter && timeFilter !== 'all' 
            ? attempts.filter(a => {
                const now = Date.now();
                const timeRanges = {
                    '1d': 24 * 60 * 60 * 1000,
                    '1w': 7 * 24 * 60 * 60 * 1000,
                    '1m': 30 * 24 * 60 * 60 * 1000,
                    '1y': 365 * 24 * 60 * 60 * 1000
                };
                return a.timestamp >= (now - timeRanges[timeFilter]);
            })
            : attempts;

        // Calculate stats per card
        const statsMap = new Map<string, CardStats>();
        
        filteredAttempts.forEach(attempt => {
            const existing = statsMap.get(attempt.cardNumber);
            
            if (existing) {
                const newTotal = existing.totalAttempts + 1;
                const newMistakes = existing.mistakes + (attempt.isCorrect ? 0 : 1);
                const newAvgTime = ((existing.averageTime * existing.totalAttempts) + attempt.responseTime) / newTotal;
                
                statsMap.set(attempt.cardNumber, {
                    cardNumber: attempt.cardNumber,
                    totalAttempts: newTotal,
                    mistakes: newMistakes,
                    averageTime: newAvgTime,
                    lastAttempt: Math.max(existing.lastAttempt, attempt.timestamp),
                    performanceScore: calculatePerformanceScore(newTotal, newMistakes, newAvgTime)
                });
            } else {
                statsMap.set(attempt.cardNumber, {
                    cardNumber: attempt.cardNumber,
                    totalAttempts: 1,
                    mistakes: attempt.isCorrect ? 0 : 1,
                    averageTime: attempt.responseTime,
                    lastAttempt: attempt.timestamp,
                    performanceScore: calculatePerformanceScore(1, attempt.isCorrect ? 0 : 1, attempt.responseTime)
                });
            }
        });

        return statsMap;
    } catch (error) {
        console.error('Error getting card stats:', error);
        return new Map();
    }
};

// Calculate performance score (0-100, higher is better)
// Factors: accuracy (70%), speed (30%)
const calculatePerformanceScore = (totalAttempts: number, mistakes: number, avgTime: number): number => {
    if (totalAttempts === 0) return 50; // neutral score for no data
    
    const accuracy = ((totalAttempts - mistakes) / totalAttempts) * 100;
    
    // Speed score: faster is better, normalize to 0-100
    // Assume 5 seconds is perfect (100), 15 seconds is poor (0)
    const avgTimeSeconds = avgTime / 1000;
    const speedScore = Math.max(0, Math.min(100, 100 - ((avgTimeSeconds - 5) / 10) * 100));
    
    // Weighted combination: 70% accuracy, 30% speed
    const score = (accuracy * 0.7) + (speedScore * 0.3);
    
    return Math.round(score);
};

export const getCardPerformanceColor = (stats: CardStats | undefined): string => {
    if (!stats || stats.totalAttempts === 0) {
        return 'rgba(100, 116, 139, 0.15)'; // faint gray for no data
    }
    
    const score = stats.performanceScore;
    
    // Cyan-Green: 75-100 (well memorized) - Teal/Cyan-Green
    if (score >= 75) {
        return 'rgba(20, 184, 166, 0.35)'; // Teal 500
    }
    // Orange: 50-74 (medium) - Orange 500
    else if (score >= 50) {
        return 'rgba(249, 115, 22, 0.35)'; // Orange 500
    }
    // Violet-Red: 0-49 (difficult) - Fuchsia/Purple-Red
    else {
        return 'rgba(217, 70, 239, 0.35)'; // Fuchsia 500
    }
};

// ===== MEMORY PALACE STATISTICS =====

export interface PalaceItemStat {
    locationIndex: number;
    word: string;
    isCorrect: boolean;
    recallTime: number; // milliseconds
}

export interface PalaceAttempt {
    palaceId: string;
    timestamp: number;
    totalWords: number;
    correctCount: number;
    memorizeTime: number; // milliseconds
    recallTime: number; // milliseconds
    turns: number;
    isTimed: boolean;
    itemStats: PalaceItemStat[];
}

export interface PalaceLocationStat {
    timesUsed: number;
    timesFailed: number;
    avgRetrievalTime: number;
}

export interface PalaceStats {
    palaceId: string;
    totalDrills: number;
    avgSuccessRate: number;
    avgRecallTime: number; // per item
    locationStats: Record<number, PalaceLocationStat>;
}

export const savePalaceAttempt = async (attempt: PalaceAttempt, userId: string = USER_ID): Promise<boolean> => {
    try {
        if (!firebaseConfig.apiKey) return false;
        
        const attemptsRef = collection(db, 'memory_palace_attempts', userId, 'attempts');
        await addDoc(attemptsRef, attempt);
        return true;
    } catch (error) {
        console.error('Error saving palace attempt:', error);
        return false;
    }
};

export const getPalaceStats = async (palaceId: string, userId: string = USER_ID): Promise<PalaceStats> => {
    try {
        if (!firebaseConfig.apiKey) {
            return {
                palaceId,
                totalDrills: 0,
                avgSuccessRate: 0,
                avgRecallTime: 0,
                locationStats: {}
            };
        }

        const attemptsRef = collection(db, 'memory_palace_attempts', userId, 'attempts');
        const q = query(attemptsRef, where('palaceId', '==', palaceId));
        const snapshot = await getDocs(q);
        
        const attempts = snapshot.docs.map(doc => doc.data() as PalaceAttempt);
        
        if (attempts.length === 0) {
            return {
                palaceId,
                totalDrills: 0,
                avgSuccessRate: 0,
                avgRecallTime: 0,
                locationStats: {}
            };
        }

        let totalSuccessRate = 0;
        let totalRecallTime = 0;
        let totalItems = 0;
        const locationStats: Record<number, PalaceLocationStat> = {};

        attempts.forEach(attempt => {
            const successRate = (attempt.correctCount / attempt.totalWords) * 100;
            totalSuccessRate += successRate;
            
            attempt.itemStats.forEach(item => {
                totalRecallTime += item.recallTime;
                totalItems++;

                if (!locationStats[item.locationIndex]) {
                    locationStats[item.locationIndex] = {
                        timesUsed: 0,
                        timesFailed: 0,
                        avgRetrievalTime: 0
                    };
                }

                const locStat = locationStats[item.locationIndex];
                const totalLocTime = (locStat.avgRetrievalTime * locStat.timesUsed) + item.recallTime;
                
                locStat.timesUsed++;
                if (!item.isCorrect) locStat.timesFailed++;
                locStat.avgRetrievalTime = totalLocTime / locStat.timesUsed;
            });
        });

        return {
            palaceId,
            totalDrills: attempts.length,
            avgSuccessRate: totalSuccessRate / attempts.length,
            avgRecallTime: totalItems > 0 ? totalRecallTime / totalItems : 0,
            locationStats
        };
    } catch (error) {
        console.error('Error fetching palace stats:', error);
        return {
            palaceId,
            totalDrills: 0,
            avgSuccessRate: 0,
            avgRecallTime: 0,
            locationStats: {}
        };
    }
};
