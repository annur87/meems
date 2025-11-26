"use client";

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { useWords } from '@/hooks/useWords';
import { Word } from '@/types';

export default function Practice() {
    const { words, loading } = useWords();
    const [currentWord, setCurrentWord] = useState<Word | null>(null);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        if (words.length > 0 && !currentWord) {
            pickRandomWord();
        }
    }, [words]);

    const pickRandomWord = () => {
        if (words.length === 0) return;
        const randomIndex = Math.floor(Math.random() * words.length);
        setCurrentWord(words[randomIndex]);
        setIsFlipped(false);
    };

    const handleNext = () => {
        pickRandomWord();
    };

    if (loading) return <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>Loading...</div>;

    return (
        <>
            <Header />
            <main className="container" style={{ justifyContent: 'center', minHeight: '80vh' }}>
                {words.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                        <p>Add some words to your vault first!</p>
                    </div>
                ) : (
                    <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
                        <div
                            className="glass"
                            style={{
                                minHeight: '300px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                padding: '2rem',
                                borderRadius: '1.5rem',
                                textAlign: 'center',
                                transition: 'transform 0.6s',
                                transformStyle: 'preserve-3d',
                                position: 'relative',
                                marginBottom: '2rem'
                            }}
                            onClick={() => setIsFlipped(!isFlipped)}
                        >
                            {!isFlipped ? (
                                <div>
                                    <p style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#94a3b8', marginBottom: '1rem' }}>Word</p>
                                    <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{currentWord?.term}</h2>
                                    <p style={{ marginTop: '2rem', fontSize: '0.8rem', opacity: 0.5 }}>(Tap to reveal definition)</p>
                                </div>
                            ) : (
                                <div className="animate-fade-in">
                                    <p style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#94a3b8', marginBottom: '1rem' }}>Definition</p>
                                    <p style={{ fontSize: '1.25rem', lineHeight: '1.6' }}>{currentWord?.definition}</p>
                                    {currentWord?.example && (
                                        <p style={{ marginTop: '1.5rem', fontStyle: 'italic', color: '#cbd5e1' }}>"{currentWord.example}"</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button onClick={handleNext} className="btn btn-primary" style={{ width: '100%' }}>
                                Next Word
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}
