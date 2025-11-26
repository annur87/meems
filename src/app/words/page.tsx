"use client";

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import wordList from '@/data/words.json';

type GameState = 'config' | 'memorize' | 'recall' | 'result';

export default function WordMemorization() {
    const [gameState, setGameState] = useState<GameState>('config');
    const [wordCount, setWordCount] = useState(10);
    const [generatedWords, setGeneratedWords] = useState<string[]>([]);
    const [userInput, setUserInput] = useState('');

    const [memorizeStartTime, setMemorizeStartTime] = useState(0);
    const [memorizeDuration, setMemorizeDuration] = useState(0);
    const [recallStartTime, setRecallStartTime] = useState(0);
    const [recallDuration, setRecallDuration] = useState(0);

    const inputRef = useRef<HTMLTextAreaElement>(null);

    const startMemorization = () => {
        const shuffled = [...wordList].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, wordCount);
        setGeneratedWords(selected);
        setGameState('memorize');
        setMemorizeStartTime(Date.now());
    };

    const startRecall = () => {
        const now = Date.now();
        setMemorizeDuration(now - memorizeStartTime);
        setGameState('recall');
        setRecallStartTime(now);
        setUserInput('');
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const finishGame = () => {
        const now = Date.now();
        setRecallDuration(now - recallStartTime);
        setGameState('result');
    };

    const resetGame = () => {
        setGameState('config');
        setGeneratedWords([]);
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
        // Split user input by whitespace, comma, or newline
        const inputWords = userInput.trim().split(/[\s,]+/).filter(w => w.length > 0).map(w => w.toLowerCase());
        const targetWords = generatedWords.map(w => w.toLowerCase());

        let correct = 0;
        const total = targetWords.length;
        const comparison = [];

        for (let i = 0; i < total; i++) {
            const target = targetWords[i];
            const input = inputWords[i] || '';
            const isCorrect = target === input;
            if (isCorrect) correct++;
            comparison.push({ target, input, isCorrect });
        }

        // Check for extra words
        for (let i = total; i < inputWords.length; i++) {
            comparison.push({ target: '', input: inputWords[i], isCorrect: false });
        }

        return { correct, total, percentage: (correct / total) * 100, comparison };
    };

    return (
        <>
            <Header />
            <main className="container" style={{ alignItems: 'center' }}>
                <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', padding: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem', textAlign: 'center', background: 'linear-gradient(to right, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Word Memorization
                    </h1>

                    {gameState === 'config' && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ width: '100%', maxWidth: '400px' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>
                                    Number of Words (5 - 100)
                                </label>
                                <input
                                    type="number"
                                    min="5"
                                    max="100"
                                    value={wordCount}
                                    onChange={(e) => setWordCount(Math.max(5, Math.min(100, parseInt(e.target.value) || 5)))}
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
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                            <p style={{ marginBottom: '1rem', color: '#cbd5e1' }}>Memorize these words in order:</p>
                            <div className="glass" style={{
                                padding: '1.5rem',
                                borderRadius: '1rem',
                                marginBottom: '2rem',
                                fontSize: '1.2rem',
                                lineHeight: '1.8',
                                width: '100%',
                                maxHeight: '400px',
                                overflowY: 'auto',
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '0.5rem',
                                justifyContent: 'center'
                            }}>
                                {generatedWords.map((word, idx) => (
                                    <span key={idx} style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.6rem', borderRadius: '0.4rem' }}>
                                        {word}
                                    </span>
                                ))}
                            </div>
                            <button onClick={startRecall} className="btn btn-primary" style={{ width: '100%', maxWidth: '400px' }}>
                                I'm Ready (Stop Timer)
                            </button>
                        </div>
                    )}

                    {gameState === 'recall' && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                            <p style={{ marginBottom: '1rem', color: '#cbd5e1' }}>Enter the words you memorized (separated by space or newline):</p>
                            <textarea
                                ref={inputRef}
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                className="input-field"
                                style={{
                                    minHeight: '200px',
                                    fontSize: '1.2rem',
                                    marginBottom: '2rem'
                                }}
                                placeholder="Type words here..."
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
                                            fontSize: '1.1rem',
                                            lineHeight: '1.8',
                                            maxHeight: '400px',
                                            overflowY: 'auto'
                                        }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                                <div>Your Input</div>
                                                <div>Correct Word</div>
                                            </div>
                                            {comparison.map((item, idx) => (
                                                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.5rem', color: item.isCorrect ? 'var(--success)' : 'var(--error)' }}>
                                                    <div>{item.input || <span style={{ opacity: 0.3 }}>(empty)</span>}</div>
                                                    <div style={{ color: 'var(--foreground)', opacity: item.isCorrect ? 0.5 : 1 }}>{item.target}</div>
                                                </div>
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
