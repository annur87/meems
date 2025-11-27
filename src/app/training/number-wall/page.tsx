"use client";

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { saveGameResult } from '@/lib/firebase';

type GameState = 'setup' | 'memorize' | 'recall' | 'result';

export default function NumberWall() {
    const [gameState, setGameState] = useState<GameState>('setup');

    // Settings
    const [digitCount, setDigitCount] = useState(100);
    const [timeLimit, setTimeLimit] = useState(300); // seconds
    const [groupSize, setGroupSize] = useState(5); // 5 or 10

    // Game Data
    const [digits, setDigits] = useState<string>("");
    const [userInput, setUserInput] = useState<string>("");
    const [startTime, setStartTime] = useState<number>(0);
    const [endTime, setEndTime] = useState<number>(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSavingResult, setIsSavingResult] = useState(false);

    // Timer Ref
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const generateDigits = (count: number) => {
        let result = "";
        for (let i = 0; i < count; i++) {
            result += Math.floor(Math.random() * 10).toString();
        }
        return result;
    };

    const startWeek1Challenge = () => {
        setDigitCount(150);
        setTimeLimit(600); // 10 minutes
        setGroupSize(10); // Standard comp grouping often 10, or user pref. Let's stick to 5 or 10.
        startGame(150, 600);
    };

    const clampDigitCount = (value: number) => {
        if (!Number.isFinite(value)) return 5;
        return Math.max(5, Math.min(1000, Math.floor(value)));
    };

    const clampTimeLimit = (value: number) => {
        if (!Number.isFinite(value)) return 60;
        return Math.max(30, Math.min(3600, Math.floor(value)));
    };

    const startGame = (count = digitCount, time = timeLimit) => {
        const sanitizedCount = clampDigitCount(count);
        const sanitizedTime = clampTimeLimit(time);

        if (sanitizedCount !== digitCount) setDigitCount(sanitizedCount);
        if (sanitizedTime !== timeLimit) setTimeLimit(sanitizedTime);

        const newDigits = generateDigits(sanitizedCount);
        setDigits(newDigits);
        setTimeLeft(sanitizedTime);
        setGameState('memorize');
        setStartTime(Date.now());
        setEndTime(0);
        setUserInput("");
    };

    const finishMemorization = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setEndTime(Date.now());
        setGameState('recall');
    };

    const submitRecall = async () => {
        if (!digits.length || isSavingResult) {
            console.warn('Tried to submit recall without generated digits.');
            if (!digits.length) setGameState('setup');
            return;
        }

        const correctCount = calculateScore();
        const memorizeEnd = endTime || Date.now();
        const memorizeStart = startTime || memorizeEnd;
        const memorizeTimeSeconds = Math.max(0, Math.floor((memorizeEnd - memorizeStart) / 1000));
        const percentage = digits.length ? Math.round((correctCount / digits.length) * 100) : 0;

        setEndTime(memorizeEnd);
        setIsSavingResult(true);
        setGameState('result');

        try {
            await saveGameResult({
                type: 'number-wall',
                count: digitCount,
                correct: correctCount,
                total: digits.length,
                percentage,
                memorizeTime: memorizeTimeSeconds,
                recallTime: 0, // We aren't tracking recall time strictly yet, or we could add it
            });
        } catch (error) {
            console.error('Failed to save Number Wall result:', error);
        } finally {
            setIsSavingResult(false);
        }
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

    // Formatting for display
    const formatDigits = (allDigits: string, group: number) => {
        const chunks = [];
        for (let i = 0; i < allDigits.length; i += group) {
            chunks.push(allDigits.slice(i, i + group));
        }
        return chunks;
    };

    // Scoring Logic
    const calculateScore = () => {
        let correctCount = 0;
        const cleanInput = userInput.replace(/\s/g, '');
        const cleanActual = digits;

        for (let i = 0; i < cleanActual.length; i++) {
            if (i < cleanInput.length && cleanInput[i] === cleanActual[i]) {
                correctCount++;
            } else {
                break; // Stop at first error for standard memory sports scoring (often) or just count correct? 
                // User prompt: "Score is based on the number of correct digits before the first error."
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
            <main className="container" style={{ maxWidth: '800px' }}>

                {/* Header / Breadcrumbs */}
                <div style={{ marginBottom: '2rem' }}>
                    <Link href="/training" style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem', display: 'inline-block' }}>
                        ← Back to Training
                    </Link>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>The Number Wall</h1>
                </div>

                {/* SETUP SCREEN */}
                {gameState === 'setup' && (
                    <div className="glass card animate-fade-in">
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Configuration</h2>

                        <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Digit Count</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={digitCount}
                                    min={5}
                                    max={1000}
                                    onChange={(e) => {
                                        const nextValue = parseInt(e.target.value, 10);
                                        setDigitCount(Number.isNaN(nextValue) ? 0 : nextValue);
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Time Limit (Seconds)</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={timeLimit}
                                    min={30}
                                    max={3600}
                                    onChange={(e) => {
                                        const nextValue = parseInt(e.target.value, 10);
                                        setTimeLimit(Number.isNaN(nextValue) ? 0 : nextValue);
                                    }}
                                />
                                <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.25rem' }}>
                                    {Math.floor(timeLimit / 60)} minutes {timeLimit % 60} seconds
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Group Size</label>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        className={`btn ${groupSize === 5 ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setGroupSize(5)}
                                        style={{ flex: 1 }}
                                    >
                                        5 Digits
                                    </button>
                                    <button
                                        className={`btn ${groupSize === 10 ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setGroupSize(10)}
                                        style={{ flex: 1 }}
                                    >
                                        10 Digits
                                    </button>
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
                                    <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>Week 1 Challenge</h3>
                                    <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>150 Digits • 10 Minutes</p>
                                </div>
                                <button className="btn btn-secondary" onClick={startWeek1Challenge} style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                                    Start Challenge
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MEMORIZE SCREEN */}
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

                        <div className="glass card" style={{ minHeight: '300px', fontSize: '1.5rem', lineHeight: '2', letterSpacing: '2px', fontFamily: 'monospace' }}>
                            {formatDigits(digits, groupSize).map((chunk, idx) => (
                                <span key={idx} style={{ marginRight: '1.5rem', display: 'inline-block' }}>
                                    {chunk}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* RECALL SCREEN */}
                {gameState === 'recall' && (
                    <div className="animate-fade-in">
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Recall Phase</h2>
                            <p style={{ opacity: 0.7 }}>Type the digits you remember.</p>
                        </div>

                        <textarea
                            className="input-field"
                            style={{ minHeight: '300px', fontFamily: 'monospace', fontSize: '1.2rem', letterSpacing: '1px' }}
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Enter digits here..."
                            autoFocus
                        />

                        <div style={{ marginTop: '1.5rem' }}>
                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={submitRecall}>
                                Submit Recall
                            </button>
                        </div>
                    </div>
                )}

                {/* RESULT SCREEN */}
                {gameState === 'result' && (
                    <div className="glass card animate-fade-in">
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>Results</h2>
                        {isSavingResult && (
                            <p style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '0.9rem', opacity: 0.7 }}>
                                Saving result…
                            </p>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>Score</div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>
                                    {calculateScore()} / {digits.length}
                                </div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Correct digits before first error</div>
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
                            <div style={{ fontFamily: 'monospace', fontSize: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '0.5rem', overflowX: 'auto' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '0.25rem' }}>Original:</div>
                                    <div style={{ letterSpacing: '1px', wordBreak: 'break-all' }}>{digits}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '0.25rem' }}>Your Recall:</div>
                                    <div style={{ letterSpacing: '1px', wordBreak: 'break-all' }}>
                                        {userInput.split('').map((char, i) => {
                                            const isCorrect = i < digits.length && char === digits[i];
                                            // If we are past the first error, everything else is technically "void" in strict scoring, 
                                            // but let's just highlight matches vs mismatches for feedback.
                                            // Actually, let's highlight the first error specifically.

                                            let color = 'inherit';
                                            if (i >= digits.length) color = 'var(--error)';
                                            else if (char === digits[i]) color = 'var(--success)';
                                            else color = 'var(--error)';

                                            return <span key={i} style={{ color }}>{char}</span>;
                                        })}
                                    </div>
                                </div>
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
