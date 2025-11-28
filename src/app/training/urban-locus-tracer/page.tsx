"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { saveGameResult } from '@/lib/firebase';
import wordList from '@/data/words.json';
import RealMap from '@/components/RealMap';
import { dhakaLandmarks } from '@/data/dhaka-landmarks';

// --- Types ---

type GamePhase = 'setup' | 'encode' | 'recall-select' | 'recall-identify' | 'mental-walk' | 'result';
type MapMode = 'abstract' | 'real';
type GameMode = 'standard' | 'landmark-recall';

interface Locus {
    id: number;
    x: number; // percentage 0-100 (Abstract) or lat (Real)
    y: number; // percentage 0-100 (Abstract) or lng (Real)
    data: string;
    type: 'word' | 'number' | 'landmark';
    title?: string; // For Real Map landmarks
}

interface WalkResult {
    fromId: number;
    toId: number;
    time: number;
}

interface RecallResult {
    locusId: number;
    correctData: string;
    inputData?: string;
    clickedLocusId?: number;
    isCorrect: boolean;
    type: 'data-to-loc' | 'loc-to-data';
}

// --- Constants ---

const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;
const POINT_RADIUS = 8;
const HIT_RADIUS = 20;

const levenshtein = (a: string, b: string): number => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

const isFuzzyMatch = (input: string, target: string): boolean => {
    const cleanInput = input.trim().toLowerCase();
    const cleanTarget = target.trim().toLowerCase();
    if (cleanInput === cleanTarget) return true;
    
    // Allow 1 error per 5 characters, max 3 errors
    const maxErrors = Math.min(3, Math.floor(cleanTarget.length / 5) + 1);
    const distance = levenshtein(cleanInput, cleanTarget);
    return distance <= maxErrors;
};

// --- Helper Functions ---

const generateAbstractLoci = (count: number): Locus[] => {
    const loci: Locus[] = [];
    const minDistance = 10; 

    for (let i = 0; i < count; i++) {
        let attempts = 0;
        let valid = false;
        let x = 0, y = 0;

        while (!valid && attempts < 100) {
            x = 5 + Math.random() * 90;
            y = 5 + Math.random() * 90;
            
            valid = true;
            for (const l of loci) {
                const dx = l.x - x;
                const dy = l.y - y;
                if (Math.sqrt(dx*dx + dy*dy) < minDistance) {
                    valid = false;
                    break;
                }
            }
            attempts++;
        }

        const isWord = Math.random() > 0.3;
        let data = isWord ? wordList[Math.floor(Math.random() * wordList.length)] : Math.floor(Math.random() * 100).toString().padStart(2, '0');

        loci.push({
            id: i,
            x,
            y,
            data,
            type: isWord ? 'word' : 'number'
        });
    }
    return loci;
};

// --- Component ---

export default function UrbanLocusTracer() {
    // Settings
    const [locusCount, setLocusCount] = useState(20);
    const [timeLimit, setTimeLimit] = useState(300);
    const [mapMode, setMapMode] = useState<MapMode>('abstract');
    const [gameMode, setGameMode] = useState<GameMode>('standard');
    
    // Real Map Settings
    const [cityQuery, setCityQuery] = useState('Dhaka');
    const [cityCenter, setCityCenter] = useState<[number, number]>([23.8103, 90.4125]); // Dhaka center
    const [cityZoom, setCityZoom] = useState(12);
    const [isLoadingCity, setIsLoadingCity] = useState(false);
    const [realLandmarks, setRealLandmarks] = useState<any[]>([]);

    // State
    const [phase, setPhase] = useState<GamePhase>('setup');
    const [loci, setLoci] = useState<Locus[]>([]);
    const [timeLeft, setTimeLeft] = useState(0);
    
    // Interaction State
    const [selectedLocusId, setSelectedLocusId] = useState<number | null>(null);
    const [hoveredLocusId, setHoveredLocusId] = useState<number | null>(null);
    
    // Recall State
    const [recallQueue, setRecallQueue] = useState<Locus[]>([]);
    const [currentRecallItem, setCurrentRecallItem] = useState<Locus | null>(null);
    const [recallType, setRecallType] = useState<'data-to-loc' | 'loc-to-data'>('loc-to-data');
    const [recallInput, setRecallInput] = useState('');
    const [recallResults, setRecallResults] = useState<RecallResult[]>([]);

    // Mental Walk State
    const [walkStartNode, setWalkStartNode] = useState<Locus | null>(null);
    const [walkEndNode, setWalkEndNode] = useState<Locus | null>(null);
    const [walkStartTime, setWalkStartTime] = useState(0);
    const [walkResults, setWalkResults] = useState<WalkResult[]>([]);
    const [walkCount, setWalkCount] = useState(0);
    const MAX_WALKS = 5;

    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(0);

    // --- Real Map Logic ---

    const searchCity = async () => {        setIsLoadingCity(true);
        try {
            // Use hardcoded Dhaka landmarks
            if (cityQuery.toLowerCase().includes('dhaka') || cityQuery.toLowerCase().includes('bangladesh')) {
                setCityCenter([23.8103, 90.4125]);
                setCityZoom(12);
                
                // Convert Dhaka landmarks to the format expected by the game
                const formattedLandmarks = dhakaLandmarks.map(landmark => ({
                    lat: landmark.lat,
                    lon: landmark.lng,
                    tags: { name: landmark.name }
                }));
                
                setRealLandmarks(formattedLandmarks);
                setIsLoadingCity(false);
                return;
            }
            
            // Fallback to Nominatim + Overpass for other cities
            const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityQuery)}&format=json&limit=1`);
            const nomData = await nomRes.json();
            
            if (!nomData || nomData.length === 0) {
                alert("City not found");
                setIsLoadingCity(false);
                return;
            }

            const lat = parseFloat(nomData[0].lat);
            const lon = parseFloat(nomData[0].lon);
            setCityCenter([lat, lon]);

            // 2. Fetch Landmarks (Overpass)
            // 2. Fetch Landmarks (Overpass)
            // Broadened query: larger radius (5000m), more types, limit 50
            const overpassQuery = `
                [out:json][timeout:15];
                (
                  node["tourism"="attraction"](around:5000,${lat},${lon});
                  node["amenity"="place_of_worship"](around:5000,${lat},${lon});
                  node["historic"="memorial"](around:5000,${lat},${lon});
                  node["leisure"="park"](around:5000,${lat},${lon});
                  node["amenity"="university"](around:5000,${lat},${lon});
                  node["amenity"="hospital"](around:5000,${lat},${lon});
                  node["shop"="mall"](around:5000,${lat},${lon});
                  node["amenity"="school"](around:5000,${lat},${lon});
                  node["amenity"="college"](around:5000,${lat},${lon});
                  node["office"="government"](around:5000,${lat},${lon});
                  node["building"="public"](around:5000,${lat},${lon});
                );
                out body 50;
            `;
            
            const overpassRes = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`);
            const overpassData = await overpassRes.json();
            
            if (overpassData.elements && overpassData.elements.length > 0) {
                // Filter out items without names and deduplicate by name
                const validElements = overpassData.elements.filter((e: any) => e.tags && e.tags.name);
                const uniqueLandmarks = Array.from(new Map(validElements.map((item: any) => [item.tags.name, item])).values());
                setRealLandmarks(uniqueLandmarks);
            } else {
                // Fallback if no landmarks found
                setRealLandmarks([]);
                alert("No automatic landmarks found. You can click on the map to add them manually.");
            }

        } catch (e) {
            console.error(e);
            alert("Failed to load city data");
        } finally {
            setIsLoadingCity(false);
        }
    };

    const generateRealLoci = (count: number): Locus[] => {
        if (realLandmarks.length === 0) return [];
        
        // Shuffle landmarks
        const shuffled = [...realLandmarks].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(count, shuffled.length));
        
        return selected.map((landmark, i) => {
            let data = '';
            let type: 'word' | 'number' | 'landmark' = 'word';

            if (gameMode === 'landmark-recall') {
                data = landmark.tags.name;
                type = 'landmark';
            } else {
                const isWord = Math.random() > 0.3;
                data = isWord ? wordList[Math.floor(Math.random() * wordList.length)] : Math.floor(Math.random() * 100).toString().padStart(2, '0');
                type = isWord ? 'word' : 'number';
            }
            
            return {
                id: i,
                x: landmark.lat, // Using x/y as lat/lng for Real Mode
                y: landmark.lon,
                data,
                type,
                title: landmark.tags.name
            };
        });
    };

    // --- Abstract Map Drawing ---

    const drawMap = useCallback((ctx: CanvasRenderingContext2D) => {
        // ... (Same as before)
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        for (let i = 50; i < MAP_WIDTH; i += 60 + Math.random() * 40) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, MAP_HEIGHT); ctx.stroke();
        }
        for (let i = 50; i < MAP_HEIGHT; i += 60 + Math.random() * 40) {
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(MAP_WIDTH, i); ctx.stroke();
        }
        ctx.fillStyle = '#0f172a';
        ctx.beginPath(); ctx.arc(MAP_WIDTH * 0.7, MAP_HEIGHT * 0.3, 80, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.rect(MAP_WIDTH * 0.2, MAP_HEIGHT * 0.6, 100, 120); ctx.fill();
    }, []);

    const renderAbstract = useCallback(() => {
        if (mapMode === 'real') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        drawMap(ctx);

        const showAllPoints = phase === 'encode' || phase === 'recall-select' || phase === 'result';
        const showDataOnHover = phase === 'encode' || phase === 'result';

        if (showAllPoints) {
            loci.forEach(locus => {
                const cx = (locus.x / 100) * MAP_WIDTH;
                const cy = (locus.y / 100) * MAP_HEIGHT;
                const isSelected = selectedLocusId === locus.id;
                const isHovered = hoveredLocusId === locus.id;
                
                ctx.beginPath();
                ctx.arc(cx, cy, isSelected || isHovered ? POINT_RADIUS * 1.5 : POINT_RADIUS, 0, Math.PI * 2);
                ctx.fillStyle = isSelected ? '#f472b6' : (isHovered ? '#60a5fa' : '#38bdf8');
                ctx.fill();
                
                if (isSelected || isHovered) {
                    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
                }

                if (showDataOnHover && (isSelected || isHovered || phase === 'result')) {
                    ctx.fillStyle = 'rgba(0,0,0,0.8)';
                    ctx.fillRect(cx + 10, cy - 15, ctx.measureText(locus.data).width + 10, 24);
                    ctx.fillStyle = '#fff';
                    ctx.font = '14px sans-serif';
                    ctx.fillText(locus.data, cx + 15, cy + 2);
                }
            });
        }

        if (phase === 'recall-identify' && currentRecallItem) {
            const cx = (currentRecallItem.x / 100) * MAP_WIDTH;
            const cy = (currentRecallItem.y / 100) * MAP_HEIGHT;
            ctx.beginPath(); ctx.arc(cx, cy, POINT_RADIUS * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = '#f472b6'; ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        }

        if (phase === 'mental-walk' && walkStartNode && walkEndNode) {
            const sx = (walkStartNode.x / 100) * MAP_WIDTH;
            const sy = (walkStartNode.y / 100) * MAP_HEIGHT;
            ctx.beginPath(); ctx.arc(sx, sy, POINT_RADIUS * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = '#22c55e'; ctx.fill();
            ctx.fillStyle = '#fff'; ctx.fillText("START", sx + 15, sy);

            const ex = (walkEndNode.x / 100) * MAP_WIDTH;
            const ey = (walkEndNode.y / 100) * MAP_HEIGHT;
            ctx.beginPath(); ctx.arc(ex, ey, POINT_RADIUS * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ef4444'; ctx.fill();
            ctx.fillStyle = '#fff'; ctx.fillText("END", ex + 15, ey);
        }
    }, [loci, phase, selectedLocusId, hoveredLocusId, currentRecallItem, walkStartNode, walkEndNode, drawMap, mapMode]);

    useEffect(() => {
        renderAbstract();
    }, [renderAbstract]);

    // --- Interaction ---

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (mapMode === 'real') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;

        let clickedId: number | null = null;
        for (const locus of loci) {
            const lx = (locus.x / 100) * MAP_WIDTH;
            const ly = (locus.y / 100) * MAP_HEIGHT;
            if (Math.sqrt(Math.pow(clickX - lx, 2) + Math.pow(clickY - ly, 2)) <= HIT_RADIUS) {
                clickedId = locus.id;
                break;
            }
        }

        if (phase === 'encode') setSelectedLocusId(clickedId);
        else if (phase === 'recall-select' && clickedId !== null) handleRecallSelection(clickedId);
    };

    const handleRealMapClick = (lat: number, lng: number) => {
        if (phase === 'setup' && mapMode === 'real') {
            // Allow manual addition in setup phase
            const newLandmark = {
                lat,
                lon: lng,
                tags: { name: `Custom Location ${realLandmarks.length + 1}` }
            };
            setRealLandmarks(prev => [...prev, newLandmark]);
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (mapMode === 'real' || (phase !== 'encode' && phase !== 'recall-select' && phase !== 'result')) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        let foundId: number | null = null;
        for (const locus of loci) {
            const lx = (locus.x / 100) * MAP_WIDTH;
            const ly = (locus.y / 100) * MAP_HEIGHT;
            if (Math.sqrt(Math.pow(mouseX - lx, 2) + Math.pow(mouseY - ly, 2)) <= HIT_RADIUS) {
                foundId = locus.id;
                break;
            }
        }
        setHoveredLocusId(foundId);
    };

    // --- Game Logic ---

    const startEncoding = () => {
        let newLoci: Locus[] = [];
        if (mapMode === 'real') {
            if (realLandmarks.length === 0) {
                alert("Please search for a city first to load landmarks.");
                return;
            }
            newLoci = generateRealLoci(locusCount);
        } else {
            newLoci = generateAbstractLoci(locusCount);
        }
        
        setLoci(newLoci);
        setPhase('encode');
        setTimeLeft(timeLimit);
        startTimeRef.current = Date.now();
        
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    startRecall();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const startRecall = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        const queue = [...loci].sort(() => Math.random() - 0.5);
        setRecallQueue(queue);
        setRecallResults([]);
        nextRecallItem(queue, []);
    };

    const nextRecallItem = (queue: Locus[], currentResults: RecallResult[]) => {
        if (queue.length === 0) {
            startMentalWalkPhase();
            return;
        }
        const item = queue[0];
        setRecallQueue(queue.slice(1));
        setCurrentRecallItem(item);
        
        let type: 'data-to-loc' | 'loc-to-data' = 'loc-to-data';
        if (gameMode === 'landmark-recall') {
            // In landmark recall, we primarily want "Find X on map" (data-to-loc)
            // But occasionally mixing it up is fine. Let's bias heavily towards data-to-loc.
            type = Math.random() > 0.2 ? 'data-to-loc' : 'loc-to-data';
        } else {
            type = Math.random() > 0.5 ? 'data-to-loc' : 'loc-to-data';
        }

        setRecallType(type);
        setRecallInput('');
        setPhase(type === 'data-to-loc' ? 'recall-select' : 'recall-identify');
    };

    const handleRecallSelection = (clickedId: number) => {
        if (!currentRecallItem) return;
        const isCorrect = clickedId === currentRecallItem.id;
        const newResults = [...recallResults, {
            locusId: currentRecallItem.id,
            correctData: currentRecallItem.data,
            clickedLocusId: clickedId,
            isCorrect,
            type: 'data-to-loc' as const
        }];
        setRecallResults(newResults);
        nextRecallItem(recallQueue, newResults);
    };

    const submitRecallInput = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!currentRecallItem) return;
        
        let isCorrect = false;
        if (gameMode === 'landmark-recall') {
            isCorrect = isFuzzyMatch(recallInput, currentRecallItem.data);
        } else {
            isCorrect = recallInput.trim().toLowerCase() === currentRecallItem.data.toLowerCase();
        }

        const newResults = [...recallResults, {
            locusId: currentRecallItem.id,
            correctData: currentRecallItem.data,
            inputData: recallInput,
            isCorrect,
            type: 'loc-to-data' as const
        }];
        setRecallResults(newResults);
        nextRecallItem(recallQueue, newResults);
    };

    const startMentalWalkPhase = () => {
        setPhase('mental-walk');
        setWalkCount(0);
        setWalkResults([]);
        nextWalk();
    };

    const nextWalk = () => {
        if (walkCount >= MAX_WALKS) {
            finishGame();
            return;
        }
        const idx1 = Math.floor(Math.random() * loci.length);
        let idx2 = Math.floor(Math.random() * loci.length);
        while (idx2 === idx1) idx2 = Math.floor(Math.random() * loci.length);
        setWalkStartNode(loci[idx1]);
        setWalkEndNode(loci[idx2]);
        setWalkStartTime(Date.now());
        setWalkCount(prev => prev + 1);
    };

    const completeWalk = () => {
        if (!walkStartNode || !walkEndNode) return;
        const duration = (Date.now() - walkStartTime) / 1000;
        setWalkResults(prev => [...prev, { fromId: walkStartNode.id, toId: walkEndNode.id, time: duration }]);
        nextWalk();
    };

    const finishGame = async () => {
        setPhase('result');
        const correctCount = recallResults.filter(r => r.isCorrect).length;
        const totalRecall = recallResults.length;
        const accuracy = totalRecall > 0 ? Math.round((correctCount / totalRecall) * 100) : 0;
        try {
            await saveGameResult({
                type: 'urban-locus-tracer',
                count: loci.length,
                correct: correctCount,
                total: totalRecall,
                percentage: accuracy,
                memorizeTime: timeLimit - timeLeft,
                recallTime: 0,
            });
        } catch (error) {
            console.error(error);
        }
    };

    // --- Render ---

    return (
        <>
            <Header />
            <main className="container" style={{ maxWidth: '1000px' }}>
                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <Link href="/training" style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem', display: 'inline-block' }}>
                            ← Back to Training
                        </Link>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Urban Locus Tracer</h1>
                    </div>
                    {phase === 'encode' && (
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: timeLeft < 60 ? 'var(--error)' : 'var(--foreground)' }}>
                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </div>
                    )}
                </div>

                {phase === 'setup' && (
                    <div className="glass card animate-fade-in" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Mission Briefing</h2>
                        
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Map Mode</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className={`btn ${mapMode === 'abstract' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMapMode('abstract')} style={{ flex: 1 }}>Abstract City</button>
                                <button className={`btn ${mapMode === 'real' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMapMode('real')} style={{ flex: 1 }}>Real City</button>
                            </div>
                        </div>

                        {mapMode === 'real' && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Game Mode</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className={`btn ${gameMode === 'standard' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setGameMode('standard')} style={{ flex: 1 }}>Standard (Loci)</button>
                                    <button className={`btn ${gameMode === 'landmark-recall' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setGameMode('landmark-recall')} style={{ flex: 1 }}>Landmark Recall</button>
                                </div>
                                {gameMode === 'landmark-recall' && (
                                    <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>
                                        Memorize the actual names of landmarks. During recall, names will be blurred.
                                    </div>
                                )}
                            </div>
                        )}

                        {mapMode === 'real' && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Target City</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input 
                                        type="text" 
                                        className="input-field" 
                                        value={cityQuery} 
                                        onChange={(e) => setCityQuery(e.target.value)}
                                        placeholder="e.g. London, Tokyo"
                                    />
                                    <button className="btn btn-secondary" onClick={searchCity} disabled={isLoadingCity}>
                                        {isLoadingCity ? '...' : 'Load'}
                                    </button>
                                </div>
                                {realLandmarks.length > 0 && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '0.5rem' }}>
                                        {realLandmarks.length} landmarks found.
                                    </div>
                                )}
                                <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>
                                    Tip: Click on the map to manually add more locations.
                                </div>
                            </div>
                        )}
                        
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Number of Locations</label>
                            <input 
                                type="number" 
                                className="input-field" 
                                value={locusCount} 
                                onChange={(e) => setLocusCount(Math.max(5, Math.min(50, parseInt(e.target.value) || 5)))}
                            />
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Encoding Time (Seconds)</label>
                            <input 
                                type="number" 
                                className="input-field" 
                                value={timeLimit} 
                                onChange={(e) => setTimeLimit(Math.max(30, parseInt(e.target.value) || 30))}
                            />
                        </div>

                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={startEncoding}>
                            Initialize Map
                        </button>
                    </div>
                )}

                <div style={{ display: phase === 'setup' ? 'none' : 'flex', gap: '2rem', flexDirection: 'column' }}>
                    
                    {/* Game Area Container */}
                    <div style={{ display: 'flex', gap: '1rem', height: '600px' }}>
                        
                        {/* Map Area */}
                        <div style={{ position: 'relative', flex: 1, height: '100%', minWidth: 0 }}>
                            {mapMode === 'abstract' ? (
                                <canvas
                                    ref={canvasRef}
                                    width={MAP_WIDTH}
                                    height={MAP_HEIGHT}
                                    onClick={handleCanvasClick}
                                    onMouseMove={handleMouseMove}
                                    style={{
                                        borderRadius: '1rem',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                        cursor: (phase === 'encode' || phase === 'recall-select') ? 'pointer' : 'default',
                                        width: '100%',
                                        height: '100%',
                                        background: '#1e293b',
                                        objectFit: 'contain'
                                    }}
                                />
                            ) : (
                                <RealMap 
                                    center={cityCenter}
                                    zoom={cityZoom}
                                    markers={loci.map(l => {
                                        // Determine color/popup based on phase
                                        let color = '#3b82f6';
                                        let popup = undefined;
                                        let title = l.title;
                                        let label = undefined;
                                        let isBlurred = false;

                                        if (gameMode === 'landmark-recall') {
                                            label = l.data;
                                            // Blur logic: Blur in recall phases
                                            if (phase === 'recall-select' || phase === 'recall-identify') {
                                                isBlurred = true;
                                            }
                                            // Highlight selected in encode
                                            if (phase === 'encode' && selectedLocusId === l.id) {
                                                color = '#f472b6';
                                            }
                                        }

                                        if (phase === 'encode') {
                                            popup = `<b>${l.title}</b><br/>${l.data}`;
                                        } else if (phase === 'recall-select') {
                                            // No popup, just location
                                        } else if (phase === 'recall-identify') {
                                            if (currentRecallItem?.id === l.id) {
                                                color = '#f472b6'; // Highlight target
                                            }
                                        } else if (phase === 'mental-walk') {
                                            if (walkStartNode?.id === l.id) {
                                                color = '#22c55e';
                                                title = "START";
                                            } else if (walkEndNode?.id === l.id) {
                                                color = '#ef4444';
                                                title = "END";
                                            }
                                        }

                                        return {
                                            id: l.id,
                                            lat: l.x,
                                            lng: l.y,
                                            title: title,
                                            color: color,
                                            popup: popup,
                                            label: label,
                                            isBlurred: isBlurred
                                        };
                                    })}
                                    onMarkerClick={(id) => {
                                        if (phase === 'encode') {
                                            setSelectedLocusId(id);
                                        } else if (phase === 'recall-select') {
                                            handleRecallSelection(id);
                                        } else if (phase === 'recall-identify' && gameMode === 'landmark-recall') {
                                            // In landmark recall, clicking a blurred label could focus the input?
                                            // Or maybe we just let them type.
                                        }
                                    }}
                                    onMapClick={handleRealMapClick}
                                />
                            )}
                            
                            {/* Overlay UI for Abstract Mode */}
                            {mapMode === 'abstract' && phase === 'encode' && selectedLocusId !== null && (
                                <div className="glass" style={{ 
                                    position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
                                    padding: '1rem 2rem', borderRadius: '2rem', pointerEvents: 'none'
                                }}>
                                    <span style={{ opacity: 0.7, marginRight: '0.5rem' }}>Locus #{selectedLocusId + 1}:</span>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                        {loci.find(l => l.id === selectedLocusId)?.data}
                                    </span>
                                </div>
                            )}

                            {phase === 'encode' && (
                                <button 
                                    className="btn btn-primary"
                                    style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000 }}
                                    onClick={startRecall}
                                >
                                    Finish Encoding
                                </button>
                            )}
                        </div>

                        {/* Sidebar List (Encode Phase Only) */}
                        {phase === 'encode' && gameMode === 'landmark-recall' && (
                            <div className="glass card" style={{ width: '300px', overflowY: 'auto', padding: '1rem' }}>
                                <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>Landmarks to Memorize</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {loci.map(l => (
                                        <div 
                                            key={l.id}
                                            onClick={() => setSelectedLocusId(l.id)}
                                            style={{
                                                padding: '0.75rem',
                                                borderRadius: '0.5rem',
                                                background: selectedLocusId === l.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                                border: selectedLocusId === l.id ? '1px solid #3b82f6' : '1px solid transparent',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{l.data}</div>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Locus #{l.id + 1}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Interaction Panel */}
                    <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                        
                        {phase === 'recall-select' && currentRecallItem && (
                            <div className="glass card animate-fade-in" style={{ textAlign: 'center', padding: '2rem' }}>
                                <h3 style={{ marginBottom: '1rem', opacity: 0.7 }}>Where was this item located?</h3>
                                <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                                    {currentRecallItem.data}
                                </div>
                                <p style={{ color: '#94a3b8' }}>Click the correct location on the map.</p>
                            </div>
                        )}

                        {phase === 'recall-identify' && currentRecallItem && (
                            <div className="glass card animate-fade-in" style={{ textAlign: 'center', padding: '2rem' }}>
                                <h3 style={{ marginBottom: '1rem', opacity: 0.7 }}>What was at the highlighted location?</h3>
                                {mapMode === 'real' && <p style={{marginBottom: '1rem', fontStyle: 'italic'}}>{currentRecallItem.title}</p>}
                                <form onSubmit={submitRecallInput}>
                                    <input
                                        autoFocus
                                        type="text"
                                        className="input-field"
                                        value={recallInput}
                                        onChange={(e) => setRecallInput(e.target.value)}
                                        placeholder="Type word or number..."
                                        style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: '1rem', maxWidth: '400px' }}
                                    />
                                    <button type="submit" className="btn btn-primary" style={{ display: 'block', margin: '0 auto', minWidth: '200px' }}>
                                        Submit
                                    </button>
                                </form>
                            </div>
                        )}

                        {phase === 'mental-walk' && (
                            <div className="glass card animate-fade-in" style={{ textAlign: 'center', padding: '2rem' }}>
                                <h3 style={{ marginBottom: '1rem' }}>Mental Walk Drill ({walkCount}/{MAX_WALKS})</h3>
                                <p style={{ marginBottom: '2rem', fontSize: '1.1rem' }}>
                                    Visualize the path from <strong style={{ color: '#22c55e' }}>START</strong> to <strong style={{ color: '#ef4444' }}>END</strong>.
                                    <br/>
                                    See the streets, the turns, and the distance.
                                </p>
                                <button className="btn btn-primary" onClick={completeWalk} style={{ minWidth: '240px', fontSize: '1.2rem', padding: '1rem 2rem' }}>
                                    Walk Completed
                                </button>
                            </div>
                        )}

                        {phase === 'result' && (
                            <div className="glass card animate-fade-in" style={{ padding: '2rem' }}>
                                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Mission Report</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                                    <div className="glass" style={{ padding: '1rem', borderRadius: '0.75rem', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>Recall Accuracy</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                                            {Math.round((recallResults.filter(r => r.isCorrect).length / recallResults.length) * 100)}%
                                        </div>
                                    </div>
                                    <div className="glass" style={{ padding: '1rem', borderRadius: '0.75rem', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>Avg Walk Time</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                                            {(walkResults.reduce((a, b) => a + b.time, 0) / walkResults.length).toFixed(1)}s
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setPhase('setup')}>
                                        New Mission
                                    </button>
                                    <Link href="/training" className="btn btn-primary" style={{ flex: 1 }}>
                                        Back to Hub
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}
