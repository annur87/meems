"use client";

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { saveGameResult } from '@/lib/firebase';

type GameState = 'setup' | 'playing' | 'result';
type Mode = 'blitz' | 'recall';

const SUITS = ['♠', '♥', '♣', '♦'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const generateDeck = () => {
    const deck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ suit, rank, id: `${rank}${suit}` });
        }
    }
    // Fisher-Yates Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

export default function CardBlitz() {
    const [gameState, setGameState] = useState<GameState>('setup');
    const [mode, setMode] = useState<Mode>('blitz');

    const [deck, setDeck] = useState<{ suit: string, rank: string, id: string }[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0);
    const [metronomeBpm, setMetronomeBpm] = useState(0); // 0 = off

    // Metronome Ref
    const audioContextRef = useRef<AudioContext | null>(null);
    const nextNoteTimeRef = useRef(0);
    const timerIDRef = useRef<number | null>(null);

    const startGame = (selectedMode: Mode) => {
        setMode(selectedMode);
        setDeck(generateDeck());
        setCurrentIndex(0);
        setGameState('playing');
        setStartTime(Date.now());

        if (metronomeBpm > 0) {
            startMetronome();
        }
    };

    const nextCard = () => {
        if (currentIndex < deck.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            endGame();
        }
    };

    const endGame = async () => {
        const end = Date.now();
        setEndTime(end);
        setGameState('result');
        stopMetronome();

        // Save Result
        const timeTaken = (end - startTime) / 1000;
        await saveGameResult({
            type: 'card-blitz',
            count: 52,
            correct: 52, // In blitz mode, you just go through them. We assume "completion" is success.
            total: 52,
            percentage: 100,
            memorizeTime: timeTaken,
            recallTime: 0,
        });
    };

    // Metronome Logic
    const startMetronome = () => {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContext();
        nextNoteTimeRef.current = audioContextRef.current.currentTime;
        scheduler();
    };

    const scheduler = () => {
        // while there are notes that will need to play before the next interval, 
        // schedule them and advance the pointer.
        const secondsPerBeat = 60.0 / metronomeBpm;
        while (nextNoteTimeRef.current < audioContextRef.current!.currentTime + 0.1) {
            playTone(nextNoteTimeRef.current);
            nextNoteTimeRef.current += secondsPerBeat;
        }
        timerIDRef.current = window.setTimeout(scheduler, 25.0);
    };

    const playTone = (time: number) => {
        const osc = audioContextRef.current!.createOscillator();
        const gain = audioContextRef.current!.createGain();
        osc.connect(gain);
        gain.connect(audioContextRef.current!.destination);
        osc.frequency.value = 800;
        gain.gain.value = 0.1;
        osc.start(time);
        osc.stop(time + 0.05);
    };

    const stopMetronome = () => {
        if (timerIDRef.current) clearTimeout(timerIDRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
    };

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameState === 'playing' && (e.code === 'Space' || e.code === 'ArrowRight')) {
                nextCard();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, currentIndex, deck]);

    // Cleanup
    useEffect(() => {
        return () => stopMetronome();
    }, []);

    const getCardColor = (suit: string) => {
        return (suit === '♥' || suit === '♦') ? 'text-red-500' : 'text-white';
    };

    return (
        <>
            <Header />
            <main className="container" style={{ maxWidth: '800px' }}>

                <div style={{ marginBottom: '2rem' }}>
                    <Link href="/training" style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem', display: 'inline-block' }}>
                        ← Back to Training
                    </Link>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Card Conversion Blitz</h1>
                </div>

                {gameState === 'setup' && (
                    <div className="glass card animate-fade-in">
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Configuration</h2>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Metronome (BPM)</label>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={metronomeBpm}
                                    onChange={(e) => setMetronomeBpm(parseInt(e.target.value) || 0)}
                                    placeholder="0 for off"
                                    style={{ maxWidth: '150px' }}
                                />
                                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Set to 0 to disable</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                            <button className="btn btn-primary" onClick={() => startGame('blitz')}>
                                Start Time Trial (Blitz)
                            </button>
                            {/* Placeholder for Recall Mode */}
                            <button className="btn btn-secondary" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                                Recall Mode (Coming Soon)
                            </button>
                        </div>

                        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Week 2 Challenge</h3>
                            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                                Target: Flip all 52 cards in under 60 seconds. <br />
                                Recommended Metronome: 60+ BPM.
                            </p>
                        </div>
                    </div>
                )}

                {gameState === 'playing' && (
                    <div className="animate-fade-in" style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div style={{ marginBottom: '1rem', fontSize: '1.2rem', opacity: 0.7 }}>
                            Card {currentIndex + 1} / 52
                        </div>

                        <div
                            className="glass"
                            onClick={nextCard}
                            style={{
                                width: '240px',
                                height: '360px',
                                margin: '0 auto 2rem',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                fontSize: '5rem',
                                borderRadius: '1rem',
                                cursor: 'pointer',
                                userSelect: 'none',
                                background: 'white',
                                color: deck[currentIndex].suit === '♥' || deck[currentIndex].suit === '♦' ? '#ef4444' : '#0f172a',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                position: 'relative'
                            }}
                        >
                            <div style={{ position: 'absolute', top: '1rem', left: '1rem', fontSize: '1.5rem', display: 'flex', flexDirection: 'column', lineHeight: '1' }}>
                                <span>{deck[currentIndex].rank}</span>
                                <span>{deck[currentIndex].suit}</span>
                            </div>

                            <div>{deck[currentIndex].suit}</div>

                            <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', fontSize: '1.5rem', display: 'flex', flexDirection: 'column', lineHeight: '1', transform: 'rotate(180deg)' }}>
                                <span>{deck[currentIndex].rank}</span>
                                <span>{deck[currentIndex].suit}</span>
                            </div>
                        </div>

                        <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>
                            Tap card or press Spacebar for next
                        </p>
                    </div>
                )}

                {gameState === 'result' && (
                    <div className="glass card animate-fade-in">
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>Blitz Complete</h2>

                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '4rem', fontWeight: 'bold', lineHeight: '1', marginBottom: '0.5rem' }}>
                                {((endTime - startTime) / 1000).toFixed(2)}s
                            </div>
                            <div style={{ fontSize: '1rem', opacity: 0.7 }}>Total Time</div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>Cards Per Minute</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                                    {(60 / ((endTime - startTime) / 1000 / 52)).toFixed(1)}
                                </div>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>Avg Time / Card</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                    {((endTime - startTime) / 1000 / 52).toFixed(2)}s
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setGameState('setup')}>
                                Try Again
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
