"use client";

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { saveGameResult } from '@/lib/firebase';

type GameState = 'setup' | 'playing' | 'recall' | 'result';

export default function SpokenNumbers() {
    const [gameState, setGameState] = useState<GameState>('setup');

    // Settings
    const [digitCount, setDigitCount] = useState(50);
    const [pace, setPace] = useState(1.0); // seconds per item
    const [groupSize, setGroupSize] = useState(2); // 1 digit or 2 digits (pair) per spoken item

    // Game Data
    const [digits, setDigits] = useState<string>("");
    const [userInput, setUserInput] = useState<string>("");
    const [currentIndex, setCurrentIndex] = useState(0); // Index of *group* being spoken

    const synthRef = useRef<SpeechSynthesis | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            synthRef.current = window.speechSynthesis;
        }
        return () => {
            stopSpeaking();
        };
    }, []);

    const generateDigits = (count: number) => {
        let result = "";
        for (let i = 0; i < count; i++) {
            result += Math.floor(Math.random() * 10).toString();
        }
        return result;
    };

    const startWeek5Challenge = () => {
        setDigitCount(50);
        setPace(1.0); // 1 second per pair
        setGroupSize(2);
        startGame(50, 1.0, 2);
    };

    const startGame = (count = digitCount, speed = pace, group = groupSize) => {
        const newDigits = generateDigits(count);
        setDigits(newDigits);
        setUserInput("");
        setCurrentIndex(0);
        setGameState('playing');

        // Start Speaking Sequence
        speakSequence(newDigits, speed, group);
    };

    const speakSequence = (sequence: string, speed: number, group: number) => {
        if (!synthRef.current) return;

        // Split into groups
        const chunks: string[] = [];
        for (let i = 0; i < sequence.length; i += group) {
            chunks.push(sequence.slice(i, i + group));
        }

        let i = 0;
        // Initial delay
        setTimeout(() => {
            intervalRef.current = setInterval(() => {
                if (i >= chunks.length) {
                    stopSpeaking();
                    setGameState('recall');
                    return;
                }

                setCurrentIndex(i);
                const text = chunks[i].split('').join(' '); // "3 7" instead of "thirty seven" usually? 
                // Memory sports usually read digits individually "three seven" even if paired.
                // Let's ensure clear digit reading.

                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 1.2; // Slightly faster base rate to fit in the interval if needed
                // Adjust rate based on pace? 
                // Actually, we are controlling the interval manually, so we just need the utterance to finish before the next one.
                // 1 second is plenty for 2 digits.

                synthRef.current?.speak(utterance);
                i++;
            }, speed * 1000);
        }, 1000); // 1s start delay
    };

    const stopSpeaking = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (synthRef.current) synthRef.current.cancel();
    };

    const submitRecall = async () => {
        const correctCount = calculateScore();

        await saveGameResult({
            type: 'spoken-numbers',
            count: digitCount,
            correct: correctCount,
            total: digits.length,
            percentage: Math.round((correctCount / digits.length) * 100),
            memorizeTime: digitCount / groupSize * pace, // Approximate duration
            recallTime: 0,
        });

        setGameState('result');
    };

    const calculateScore = () => {
        let correctCount = 0;
        const cleanInput = userInput.replace(/\s/g, '');
        const cleanActual = digits;

        for (let i = 0; i < cleanActual.length; i++) {
            if (i < cleanInput.length && cleanInput[i] === cleanActual[i]) {
                correctCount++;
            } else {
                // Stop at first error? Or count total?
                // Spoken numbers is usually "Sudden Death" (stop at first error).
                // Let's stick to total correct for training encouragement, but maybe highlight first error.
                // Actually, let's just count matching characters for now.
                // But for consistency with "Number Wall", we might want to be strict.
                // Let's just do raw correct count.
            }
        }
        // Actually, let's do raw match count for simplicity in this MVP.
        let matches = 0;
        for (let i = 0; i < cleanActual.length; i++) {
            if (i < cleanInput.length && cleanInput[i] === cleanActual[i]) matches++;
        }
        return matches;
    };

    return (
        <>
            <Header />
            <main className="container" style={{ maxWidth: '800px' }}>

                <div style={{ marginBottom: '2rem' }}>
                    <Link href="/training" style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem', display: 'inline-block' }}>
                        ← Back to Training
                    </Link>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Spoken Number Terror</h1>
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
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Pace (Seconds per Group)</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    step="0.1"
                                    value={pace}
                                    onChange={(e) => setPace(parseFloat(e.target.value) || 1)}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Grouping</label>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button className={`btn ${groupSize === 1 ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setGroupSize(1)} style={{ flex: 1 }}>1 Digit</button>
                                    <button className={`btn ${groupSize === 2 ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setGroupSize(2)} style={{ flex: 1 }}>2 Digits</button>
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
                                    <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>Week 5 Challenge</h3>
                                    <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>50 Digits • 1.0s / Pair</p>
                                </div>
                                <button className="btn btn-secondary" onClick={startWeek5Challenge} style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                                    Start Challenge
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {gameState === 'playing' && (
                    <div className="animate-fade-in" style={{ textAlign: 'center', padding: '4rem 0' }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '2rem', opacity: 0.7 }}>
                            Listen carefully...
                        </div>

                        <div className="glass" style={{
                            width: '150px',
                            height: '150px',
                            margin: '0 auto',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--primary)',
                            boxShadow: '0 0 50px var(--primary-hover)'
                        }}>
                            <div style={{ fontSize: '3rem' }}>🔊</div>
                        </div>

                        <div style={{ marginTop: '2rem', fontSize: '1rem', opacity: 0.5 }}>
                            Group {currentIndex + 1} / {Math.ceil(digitCount / groupSize)}
                        </div>

                        <button className="btn btn-secondary" style={{ marginTop: '2rem' }} onClick={() => { stopSpeaking(); setGameState('setup'); }}>
                            Cancel
                        </button>
                    </div>
                )}

                {gameState === 'recall' && (
                    <div className="animate-fade-in">
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Recall Phase</h2>
                            <p style={{ opacity: 0.7 }}>Enter the digits you heard.</p>
                        </div>

                        <textarea
                            className="input-field"
                            style={{ minHeight: '300px', fontFamily: 'monospace', fontSize: '1.2rem', letterSpacing: '1px' }}
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Enter digits..."
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
                                    {calculateScore()} / {digits.length}
                                </div>
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>Pace</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                    {pace}s / {groupSize}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Comparison</h3>
                            <div style={{ fontFamily: 'monospace', fontSize: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '0.5rem', overflowX: 'auto', wordBreak: 'break-all' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>Actual:</div>
                                    <div>{digits}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>You:</div>
                                    <div>
                                        {userInput.replace(/\s/g, '').split('').map((char, i) => {
                                            const isCorrect = i < digits.length && char === digits[i];
                                            return <span key={i} style={{ color: isCorrect ? 'var(--success)' : 'var(--error)' }}>{char}</span>
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
