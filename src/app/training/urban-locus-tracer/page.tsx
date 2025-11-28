"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { saveGameResult } from '@/lib/firebase';
import wordList from '@/data/words.json';

// --- Types ---

type GamePhase = 'setup' | 'encode' | 'recall-select' | 'recall-identify' | 'mental-walk' | 'result';

interface Locus {
    id: number;
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    data: string;
    type: 'word' | 'number';
}

interface WalkResult {
    fromId: number;
    toId: number;
    time: number;
}

interface RecallResult {
    locusId: number;
    correctData: string;
    inputData?: string; // For 'identify' type recall
    clickedLocusId?: number; // For 'select' type recall
    isCorrect: boolean;
    type: 'data-to-loc' | 'loc-to-data';
}

// --- Constants ---

const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;
const POINT_RADIUS = 8;
const HIT_RADIUS = 20;

// --- Helper Functions ---

const generateLoci = (count: number): Locus[] => {
    const loci: Locus[] = [];
    const minDistance = 10; // minimum distance between points in %

    for (let i = 0; i < count; i++) {
        let attempts = 0;
        let valid = false;
        let x = 0, y = 0;

        while (!valid && attempts < 100) {
            x = 5 + Math.random() * 90;
            y = 5 + Math.random() * 90;
            
            // Check distance from existing
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

        // Assign Data
        const isWord = Math.random() > 0.3;
        let data = '';
        if (isWord) {
            data = wordList[Math.floor(Math.random() * wordList.length)];
        } else {
            data = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        }

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
    const [timeLimit, setTimeLimit] = useState(300); // 5 minutes total for encoding

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

    // --- Map Drawing ---

    const drawMap = useCallback((ctx: CanvasRenderingContext2D) => {
        // Clear
        ctx.fillStyle = '#1e293b'; // Slate-800
        ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

        // Draw "Streets" (Random Grid)
        ctx.strokeStyle = '#334155'; // Slate-700
        ctx.lineWidth = 2;
        
        // Seeded random for consistent map in session? 
        // For now just random lines that look like a city
        // We'll use a simple grid with some irregularities
        
        // Vertical streets
        for (let i = 50; i < MAP_WIDTH; i += 60 + Math.random() * 40) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, MAP_HEIGHT);
            ctx.stroke();
        }
        // Horizontal streets
        for (let i = 50; i < MAP_HEIGHT; i += 60 + Math.random() * 40) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(MAP_WIDTH, i);
            ctx.stroke();
        }

        // Draw Parks/Water (Random Blobs)
        ctx.fillStyle = '#0f172a'; // Slate-900 (Water/Park)
        ctx.beginPath();
        ctx.arc(MAP_WIDTH * 0.7, MAP_HEIGHT * 0.3, 80, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.rect(MAP_WIDTH * 0.2, MAP_HEIGHT * 0.6, 100, 120);
        ctx.fill();

    }, []);

    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw Base Map
        drawMap(ctx);

        // Draw Loci
        // In 'recall-select' (Data -> Loc), we show points but no data.
        // In 'recall-identify' (Loc -> Data), we show ONE point highlighted.
        // In 'mental-walk', we show TWO points highlighted.
        
        const showAllPoints = phase === 'encode' || phase === 'recall-select' || phase === 'result';
        const showDataOnHover = phase === 'encode' || phase === 'result';

        if (showAllPoints) {
            loci.forEach(locus => {
                const cx = (locus.x / 100) * MAP_WIDTH;
                const cy = (locus.y / 100) * MAP_HEIGHT;

                // Highlight logic
                const isSelected = selectedLocusId === locus.id;
                const isHovered = hoveredLocusId === locus.id;
                
                ctx.beginPath();
                ctx.arc(cx, cy, isSelected || isHovered ? POINT_RADIUS * 1.5 : POINT_RADIUS, 0, Math.PI * 2);
                
                if (phase === 'result') {
                    // Color by correctness?
                    // Complex to map back, just keep standard for now
                    ctx.fillStyle = '#38bdf8';
                } else {
                    ctx.fillStyle = isSelected ? '#f472b6' : (isHovered ? '#60a5fa' : '#38bdf8');
                }
                ctx.fill();
                
                // Selection Ring
                if (isSelected || isHovered) {
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }

                // Show Data Label
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
            // Show only the target locus
            const cx = (currentRecallItem.x / 100) * MAP_WIDTH;
            const cy = (currentRecallItem.y / 100) * MAP_HEIGHT;
            
            ctx.beginPath();
            ctx.arc(cx, cy, POINT_RADIUS * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = '#f472b6'; // Pink highlight
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        if (phase === 'mental-walk' && walkStartNode && walkEndNode) {
            // Draw Start
            const sx = (walkStartNode.x / 100) * MAP_WIDTH;
            const sy = (walkStartNode.y / 100) * MAP_HEIGHT;
            ctx.beginPath();
            ctx.arc(sx, sy, POINT_RADIUS * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = '#22c55e'; // Green
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.fillText("START", sx + 15, sy);

            // Draw End
            const ex = (walkEndNode.x / 100) * MAP_WIDTH;
            const ey = (walkEndNode.y / 100) * MAP_HEIGHT;
            ctx.beginPath();
            ctx.arc(ex, ey, POINT_RADIUS * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ef4444'; // Red
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.fillText("END", ex + 15, ey);
        }

    }, [loci, phase, selectedLocusId, hoveredLocusId, currentRecallItem, walkStartNode, walkEndNode, drawMap]);

    useEffect(() => {
        render();
    }, [render]);

    // --- Interaction ---

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;

        // Find clicked locus
        let clickedId: number | null = null;
        for (const locus of loci) {
            const lx = (locus.x / 100) * MAP_WIDTH;
            const ly = (locus.y / 100) * MAP_HEIGHT;
            const dist = Math.sqrt(Math.pow(clickX - lx, 2) + Math.pow(clickY - ly, 2));
            
            if (dist <= HIT_RADIUS) {
                clickedId = locus.id;
                break;
            }
        }

        if (phase === 'encode') {
            setSelectedLocusId(clickedId);
        } else if (phase === 'recall-select' && clickedId !== null) {
            handleRecallSelection(clickedId);
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (phase !== 'encode' && phase !== 'recall-select' && phase !== 'result') return;

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
            const dist = Math.sqrt(Math.pow(mouseX - lx, 2) + Math.pow(mouseY - ly, 2));
            
            if (dist <= HIT_RADIUS) {
                foundId = locus.id;
                break;
            }
        }
        setHoveredLocusId(foundId);
    };

    // --- Game Logic ---

    const startEncoding = () => {
        const newLoci = generateLoci(locusCount);
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
        
        // Prepare recall queue (randomized)
        const queue = [...loci].sort(() => Math.random() - 0.5);
        setRecallQueue(queue);
        setRecallResults([]);
        nextRecallItem(queue, []);
    };

    const nextRecallItem = (queue: Locus[], currentResults: RecallResult[]) => {
        if (queue.length === 0) {
            // Recall finished, start Mental Walk
            startMentalWalkPhase();
            return;
        }

        const item = queue[0];
        const remaining = queue.slice(1);
        setRecallQueue(remaining);
        setCurrentRecallItem(item);
        
        // Randomly decide recall type: Data->Loc or Loc->Data
        const type = Math.random() > 0.5 ? 'data-to-loc' : 'loc-to-data';
        setRecallType(type);
        setRecallInput('');
        
        if (type === 'data-to-loc') {
            setPhase('recall-select');
        } else {
            setPhase('recall-identify');
        }
    };

    const handleRecallSelection = (clickedId: number) => {
        if (!currentRecallItem) return;

        const isCorrect = clickedId === currentRecallItem.id;
        const result: RecallResult = {
            locusId: currentRecallItem.id,
            correctData: currentRecallItem.data,
            clickedLocusId: clickedId,
            isCorrect,
            type: 'data-to-loc'
        };

        const newResults = [...recallResults, result];
        setRecallResults(newResults);
        
        // Brief delay or immediate? Immediate for flow.
        nextRecallItem(recallQueue, newResults);
    };

    const submitRecallInput = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!currentRecallItem) return;

        const isCorrect = recallInput.trim().toLowerCase() === currentRecallItem.data.toLowerCase();
        const result: RecallResult = {
            locusId: currentRecallItem.id,
            correctData: currentRecallItem.data,
            inputData: recallInput,
            isCorrect,
            type: 'loc-to-data'
        };

        const newResults = [...recallResults, result];
        setRecallResults(newResults);
        nextRecallItem(recallQueue, newResults);
    };

    // --- Mental Walk Logic ---

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

        // Pick two random distinct loci
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
        
        setWalkResults(prev => [...prev, {
            fromId: walkStartNode.id,
            toId: walkEndNode.id,
            time: duration
        }]);

        nextWalk();
    };

    const finishGame = async () => {
        setPhase('result');
        
        // Calculate Stats
        const correctCount = recallResults.filter(r => r.isCorrect).length;
        const totalRecall = recallResults.length;
        const accuracy = totalRecall > 0 ? Math.round((correctCount / totalRecall) * 100) : 0;
        
        const avgWalkTime = walkResults.length 
            ? walkResults.reduce((sum, w) => sum + w.time, 0) / walkResults.length 
            : 0;

        // Save
        try {
            await saveGameResult({
                type: 'urban-locus-tracer',
                count: loci.length,
                correct: correctCount,
                total: totalRecall,
                percentage: accuracy,
                memorizeTime: timeLimit - timeLeft, // Approx
                recallTime: 0, // Not tracked separately per item
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
                        <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
                            You will be dropped into a random city sector. 
                            Identify the marked locations and encode the data found there.
                            You will then be tested on your ability to recall data by location, and locate data by name.
                            Finally, you will perform rapid "Mental Walks" between locations.
                        </p>
                        
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
                    
                    {/* Game Area */}
                    <div style={{ position: 'relative', margin: '0 auto' }}>
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
                                maxWidth: '100%',
                                height: 'auto',
                                background: '#1e293b'
                            }}
                        />
                        
                        {/* Overlay UI for Phases */}
                        {phase === 'encode' && selectedLocusId !== null && (
                            <div className="glass" style={{ 
                                position: 'absolute', 
                                bottom: '20px', 
                                left: '50%', 
                                transform: 'translateX(-50%)',
                                padding: '1rem 2rem',
                                borderRadius: '2rem',
                                pointerEvents: 'none'
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
                                style={{ position: 'absolute', top: '20px', right: '20px' }}
                                onClick={startRecall}
                            >
                                Finish Encoding
                            </button>
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
