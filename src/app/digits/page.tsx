"use client";

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';

type GameState = 'config' | 'memorize' | 'recall' | 'result';

export default function DigitMemorization() {
    const [gameState, setGameState] = useState<GameState>('config');
    const [digitCount, setDigitCount] = useState(10);
    const [generatedDigits, setGeneratedDigits] = useState('');
    const [userInput, setUserInput] = useState('');

    const [memorizeStartTime, setMemorizeStartTime] = useState(0);
    const [memorizeDuration, setMemorizeDuration] = useState(0);
    const [recallStartTime, setRecallStartTime] = useState(0);
    const [recallDuration, setRecallDuration] = useState(0);

    const inputRef = useRef<HTMLTextAreaElement>(null);

    const startMemorization = () => {
        let digits = '';
        for (let i = 0; i < digitCount; i++) {
            digits += Math.floor(Math.random() * 10).toString();
        }
        setGeneratedDigits(digits);
        setGameState('memorize');
        setMemorizeStartTime(Date.now());
    };

    const startRecall = () => {
        const now = Date.now();
        setMemorizeDuration(now - memorizeStartTime);
        setGameState('recall');
        setRecallStartTime(now);
        setUserInput('');
        // Focus input on next render
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const finishGame = () => {
        const now = Date.now();
        setRecallDuration(now - recallStartTime);
        setGameState('result');
    };

    const resetGame = () => {
        setGameState('config');
        setGeneratedDigits('');
        setUserInput('');
        setMemorizeDuration(0);
        setRecallDuration(0);
    };

    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };

    const calculateScore = () => {
        let correct = 0;
        const total = generatedDigits.length;
        const comparison = [];

        for (let i = 0; i < total; i++) {
            const target = generatedDigits[i];
            const input = userInput[i] || '';
            const isCorrect = target === input;
            if (isCorrect) correct++;
            comparison.push({ target, input, isCorrect });
        }

        return { correct, total, percentage: (correct / total) * 100, comparison };
    };

    return (
        <>
            <Header />
            <main className="container" style={{ alignItems: 'center' }}>
                <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', padding: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem', textAlign: 'center', background: 'linear-gradient(to right, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Digit Memorization
                    </h1>

                    {gameState === 'config' && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ width: '100%', maxWidth: '400px' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>
                                    Number of Digits (10 - 1000)
                                </label>
                                <input
                                    type="number"
                                    min="10"
                                    max="1000"
                                    value={digitCount}
                                    onChange={(e) => setDigitCount(Math.max(10, Math.min(1000, parseInt(e.target.value) || 10)))}
                                    className="input-field"
                                    style={{ textAlign: 'center', fontSize: '1.2rem' }}
                                />
                            </div>
                            <button onClick={startMemorization} className="btn btn-primary" style={{ width: '100%', maxWidth: '400px' }}>
                                Start Memorization
                            </button>
                        </div>
                    )}

                    {gameState === 'memorize' && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <p style={{ marginBottom: '1rem', color: '#cbd5e1' }}>Memorize these digits:</p>
                            <div className="glass" style={{
                                padding: '1.5rem',
                                borderRadius: '1rem',
                                marginBottom: '2rem',
                                fontFamily: 'monospace',
                                fontSize: '1.5rem',
                                letterSpacing: '0.2em',
                                lineHeight: '1.8',
                                wordBreak: 'break-all',
                                width: '100%',
                                maxHeight: '400px',
                                overflowY: 'auto'
                            }}>
                                {generatedDigits}
                            </div>
                            <button onClick={startRecall} className="btn btn-primary" style={{ width: '100%', maxWidth: '400px' }}>
                                I'm Ready (Stop Timer)
                            </button>
                        </div>
                    )}

                    {gameState === 'recall' && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                            <p style={{ marginBottom: '1rem', color: '#cbd5e1' }}>Enter the digits you memorized:</p>
                            <textarea
                                ref={inputRef}
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                className="input-field"
                                style={{
                                    minHeight: '200px',
                                    fontFamily: 'monospace',
                                    fontSize: '1.5rem',
                                    letterSpacing: '0.2em',
                                    marginBottom: '2rem'
                                }}
                                placeholder="Type digits here..."
                            />
                            <button onClick={finishGame} className="btn btn-primary" style={{ width: '100%', maxWidth: '400px' }}>
                                Finish & Check
                            </button>
                        </div>
                    )}

                    {gameState === 'result' && (
                        <div className="animate-fade-in" style={{ width: '100%' }}>
                            {(() => {
                                const { correct, total, percentage, comparison } = calculateScore();
                                return (
                                    <>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                                            <div className="glass" style={{ padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>Accuracy</div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: percentage === 100 ? 'var(--success)' : 'var(--primary)' }}>
                                                    {percentage.toFixed(1)}%
                                                </div>
                                                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{correct} / {total}</div>
                                            </div>
                                            <div className="glass" style={{ padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>Memorize Time</div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatTime(memorizeDuration)}</div>
                                            </div>
                                            <div className="glass" style={{ padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>Recall Time</div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatTime(recallDuration)}</div>
                                            </div>
                                        </div>

                                        <h3 style={{ marginBottom: '1rem', color: '#cbd5e1' }}>Detailed Results:</h3>
                                        <div className="glass" style={{
                                            padding: '1.5rem',
                                            borderRadius: '1rem',
                                            marginBottom: '2rem',
                                            fontFamily: 'monospace',
                                            fontSize: '1.2rem',
                                            letterSpacing: '0.1em',
                                            lineHeight: '1.8',
                                            wordBreak: 'break-all',
                                            maxHeight: '400px',
                                            overflowY: 'auto'
                                        }}>
                                            {comparison.map((item, idx) => (
                                                <span key={idx} style={{
                                                    color: item.isCorrect ? 'var(--success)' : 'var(--error)',
                                                    textDecoration: item.isCorrect ? 'none' : 'underline'
                                                }}>
                                                    {item.input || '_'}
                                                    {!item.isCorrect && <span style={{ fontSize: '0.8em', opacity: 0.5, marginLeft: '2px' }}>({item.target})</span>}
                                                    {' '}
                                                </span>
                                            ))}
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                            <button onClick={resetGame} className="btn btn-primary" style={{ width: '100%', maxWidth: '400px' }}>
                                                Try Again
                                            </button>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
