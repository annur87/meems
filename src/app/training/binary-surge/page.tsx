"use client";

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { saveGameResult } from '@/lib/firebase';

type GameState = 'setup' | 'memorize' | 'recall' | 'result';

export default function BinarySurge() {
    const [gameState, setGameState] = useState<GameState>('setup');

    // Settings
    const [digitCount, setDigitCount] = useState(120); // Divisible by 3 and 6 usually
    const [timeLimit, setTimeLimit] = useState(300); // seconds
    const [groupSize, setGroupSize] = useState(3); // Standard is 3 for binary

    // Game Data
    const [binaryData, setBinaryData] = useState<string>("");
    const [userInput, setUserInput] = useState<string>("");
    const [startTime, setStartTime] = useState<number>(0);
    const [endTime, setEndTime] = useState<number>(0);
    const [timeLeft, setTimeLeft] = useState(0);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const generateBinary = (count: number) => {
        let result = "";
        for (let i = 0; i < count; i++) {
            result += Math.random() > 0.5 ? "1" : "0";
        }
        return result;
    };

    const startWeek4Challenge = () => {
        // 25 lines of ? Usually 30 digits per line in competition? 
        // User said "25-line Binary Challenge (125 digits)". 
        // 125 / 25 = 5 digits per line? That's very short. 
        // Standard binary row is often 30 digits. 
        // Let's stick to the user's explicit "125 digits" request.
        setDigitCount(125);
        setTimeLimit(300); // 5 minutes is standard for "Speed Binary" but usually for much more data. 
        // Let's set a reasonable time or keep user default. 
        // We'll just set the count and let them adjust time if needed, or set 5 mins.
        setTimeLimit(300);
        setGroupSize(3);
        startGame(125, 300);
    };

    const startGame = (count = digitCount, time = timeLimit) => {
        const newBinary = generateBinary(count);
        setBinaryData(newBinary);
        setTimeLeft(time);
        setGameState('memorize');
        setStartTime(Date.now());
        setUserInput("");
    };

    const finishMemorization = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setEndTime(Date.now());
        setGameState('recall');
    };

    const submitRecall = async () => {
        const correctCount = calculateScore();
        const memorizeTimeSeconds = Math.floor((endTime - startTime) / 1000);

        await saveGameResult({
            type: 'binary-surge',
            count: digitCount,
            correct: correctCount,
            total: binaryData.length,
            percentage: Math.round((correctCount / binaryData.length) * 100),
            memorizeTime: memorizeTimeSeconds,
            recallTime: 0,
        });

        setGameState('result');
    };

    // Timer Logic
    useEffect(() => {
        if (gameState === 'memorize' && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        finishMemorization();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [gameState]);

    // Formatting
    const formatBinary = (data: string, group: number) => {
        // We want to display in a grid.
        // Let's just chunk it by group size for now.
        const chunks = [];
        for (let i = 0; i < data.length; i += group) {
            chunks.push(data.slice(i, i + group));
        }
        return chunks;
    };

    const calculateScore = () => {
        // Standard binary scoring: 
        // Usually per row. If a row has an error, the row is 0. 
        // But for this app, let's stick to the "correct digits before first error" or just raw correct count?
        // User prompt for Number Wall was "correct digits before first error".
        // Let's stick to that consistency for "Surge" unless specified. 
        // Actually, binary is often scored: 30 points per correct row, 15 for half row.
        // Let's simplify: Raw correct comparison for now, or "First Error" rule.
        // "First Error" is very harsh for binary. 
        // Let's do simple character matching for now to be encouraging, but maybe highlight the first error.

        let correctCount = 0;
        const cleanInput = userInput.replace(/[^01]/g, ''); // Remove non-binary chars
        const cleanActual = binaryData;

        for (let i = 0; i < cleanActual.length; i++) {
            if (i < cleanInput.length && cleanInput[i] === cleanActual[i]) {
                correctCount++;
            }
        }
        return correctCount;
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <>
            <Header />
            <main className="container" style={{ maxWidth: '900px' }}>

                <div style={{ marginBottom: '2rem' }}>
                    <Link href="/training" style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem', display: 'inline-block' }}>
                        ← Back to Training
                    </Link>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Binary Code Surge</h1>
                </div>

                {gameState === 'setup' && (
                    <div className="glass card animate-fade-in">
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Configuration</h2>

                        <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Total Digits</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={digitCount}
                                    onChange={(e) => setDigitCount(parseInt(e.target.value) || 0)}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Time Limit (Seconds)</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={timeLimit}
                                    onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Grouping</label>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button className={`btn ${groupSize === 3 ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setGroupSize(3)} style={{ flex: 1 }}>3 Digits</button>
                                    <button className={`btn ${groupSize === 6 ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setGroupSize(6)} style={{ flex: 1 }}>6 Digits</button>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                            <button className="btn btn-primary" onClick={() => startGame()}>
                                Start Custom Game
                            </button>

                            <div style={{ borderTop: '1px solid var(--glass-border)', margin: '1rem 0' }}></div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>Week 4 Challenge</h3>
                                    <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>125 Digits • 5 Minutes</p>
                                </div>
                                <button className="btn btn-secondary" onClick={startWeek4Challenge} style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                                    Start Challenge
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {gameState === 'memorize' && (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: timeLeft < 60 ? 'var(--error)' : 'var(--foreground)' }}>
                                Time Left: {formatTime(timeLeft)}
                            </div>
                            <button className="btn btn-primary" onClick={finishMemorization}>
                                Done Memorizing
                            </button>
                        </div>

                        <div className="glass card" style={{
                            minHeight: '300px',
                            fontFamily: 'monospace',
                            fontSize: '1.5rem',
                            lineHeight: '1.8',
                            letterSpacing: '1px',
                            wordBreak: 'break-all'
                        }}>
                            {formatBinary(binaryData, groupSize).map((chunk, idx) => (
                                <span key={idx} style={{ marginRight: '1rem', display: 'inline-block', color: idx % 2 === 0 ? '#fff' : '#cbd5e1' }}>
                                    {chunk}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {gameState === 'recall' && (
                    <div className="animate-fade-in">
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Recall Phase</h2>
                            <p style={{ opacity: 0.7 }}>Enter the binary sequence.</p>
                        </div>

                        <textarea
                            className="input-field"
                            style={{ minHeight: '300px', fontFamily: 'monospace', fontSize: '1.2rem', letterSpacing: '1px' }}
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value.replace(/[^01\s]/g, ''))}
                            placeholder="010 110..."
                            autoFocus
                        />

                        <div style={{ marginTop: '1.5rem' }}>
                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={submitRecall}>
                                Submit Recall
                            </button>
                        </div>
                    </div>
                )}

                {gameState === 'result' && (
                    <div className="glass card animate-fade-in">
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>Results</h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>Score</div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>
                                    {calculateScore()} / {binaryData.length}
                                </div>
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>Memorization Time</div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                                    {formatTime(Math.floor((endTime - startTime) / 1000))}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Comparison</h3>
                            <div style={{ fontFamily: 'monospace', fontSize: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '0.5rem', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                {binaryData.split('').map((char, i) => {
                                    const userChar = userInput.replace(/[^01]/g, '')[i];
                                    let color = 'inherit';
                                    if (!userChar) color = 'var(--foreground)'; // Not typed yet
                                    else if (userChar === char) color = 'var(--success)';
                                    else color = 'var(--error)';

                                    return <span key={i} style={{ color }}>{char}</span>;
                                })}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setGameState('setup')}>
                                New Game
                            </button>
                            <Link href="/training" className="btn btn-primary" style={{ flex: 1 }}>
                                Back to Hub
                            </Link>
                        </div>
                    </div>
                )}

            </main>
        </>
    );
}
