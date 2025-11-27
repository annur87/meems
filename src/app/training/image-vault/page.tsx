"use client";

import { useState } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';

type SystemType = 'major' | 'pao' | 'palace';
type DrillMode = 'number-to-image' | 'image-to-number' | 'card-to-pao' | 'pao-to-card';

export default function ImageVault() {
    const [activeTab, setActiveTab] = useState<SystemType>('major');
    const [drillMode, setDrillMode] = useState<DrillMode>('number-to-image');

    // Drill State
    const [drillActive, setDrillActive] = useState(false);
    const [currentPrompt, setCurrentPrompt] = useState('');
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
    const [score, setScore] = useState({ correct: 0, total: 0 });

    // Sample data - in a real app, this would be stored in localStorage or Firebase
    const [majorSystem, setMajorSystem] = useState<{ [key: string]: string }>({
        '00': 'Sauce', '01': 'Suit', '02': 'Sun', '03': 'Sum',
        '10': 'Toes', '11': 'Toad', '12': 'Tin', '13': 'Tomb',
        '20': 'Nose', '21': 'Net', '22': 'Nun', '23': 'Name',
        // Add more as needed
    });

    const [paoSystem, setPaoSystem] = useState<{ [key: string]: { person: string; action: string; object: string } }>({
        'AS': { person: 'Albert Einstein', action: 'Calculating', object: 'Chalkboard' },
        '2H': { person: 'Harry Potter', action: 'Casting', object: 'Wand' },
        'KC': { person: 'King Kong', action: 'Climbing', object: 'Building' },
        // Add more as needed
    });

    const [palaces, setPalaces] = useState<{ name: string; locations: string[] }[]>([
        { name: 'Home Journey', locations: ['Front Door', 'Hallway', 'Living Room', 'Kitchen', 'Bedroom'] },
        { name: 'Office Route', locations: ['Parking Lot', 'Elevator', 'Reception', 'Desk', 'Conference Room'] },
    ]);

    const startDrill = () => {
        setDrillActive(true);
        setScore({ correct: 0, total: 0 });
        setFeedback(null);
        generateNewPrompt();
    };

    const generateNewPrompt = () => {
        setUserAnswer('');
        setFeedback(null);

        if (drillMode === 'number-to-image') {
            const numbers = Object.keys(majorSystem);
            const randomNum = numbers[Math.floor(Math.random() * numbers.length)];
            setCurrentPrompt(randomNum);
        } else if (drillMode === 'card-to-pao') {
            const cards = Object.keys(paoSystem);
            const randomCard = cards[Math.floor(Math.random() * cards.length)];
            setCurrentPrompt(randomCard);
        }
    };

    const checkAnswer = () => {
        let correct = false;
        let message = '';

        if (drillMode === 'number-to-image') {
            const expected = majorSystem[currentPrompt]?.toLowerCase();
            const answer = userAnswer.trim().toLowerCase();
            correct = expected === answer;
            message = correct ? '✓ Correct!' : `✗ Expected: ${majorSystem[currentPrompt]}`;
        } else if (drillMode === 'card-to-pao') {
            const expected = paoSystem[currentPrompt];
            const answer = userAnswer.trim().toLowerCase();
            const combinedExpected = `${expected.person} ${expected.action} ${expected.object}`.toLowerCase();
            correct = combinedExpected.includes(answer) || answer.includes(expected.person.toLowerCase());
            message = correct ? '✓ Correct!' : `✗ Expected: ${expected.person} - ${expected.action} - ${expected.object}`;
        }

        setFeedback({ correct, message });
        setScore(prev => ({ correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 }));

        // Auto-advance after 1.5s
        setTimeout(() => {
            generateNewPrompt();
        }, 1500);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && userAnswer.trim()) {
            checkAnswer();
        }
    };

    return (
        <>
            <Header />
            <main className="container" style={{ maxWidth: '1000px' }}>

                <div style={{ marginBottom: '2rem' }}>
                    <Link href="/training" style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem', display: 'inline-block' }}>
                        ← Back to Training
                    </Link>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>The Image Vault</h1>
                    <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>Manage and drill your mnemonic systems</p>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <button
                        onClick={() => setActiveTab('major')}
                        style={{
                            padding: '1rem 1.5rem',
                            background: 'none',
                            border: 'none',
                            color: activeTab === 'major' ? 'var(--primary)' : 'var(--foreground)',
                            borderBottom: activeTab === 'major' ? '2px solid var(--primary)' : 'none',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: activeTab === 'major' ? 'bold' : 'normal'
                        }}
                    >
                        Major System
                    </button>
                    <button
                        onClick={() => setActiveTab('pao')}
                        style={{
                            padding: '1rem 1.5rem',
                            background: 'none',
                            border: 'none',
                            color: activeTab === 'pao' ? 'var(--primary)' : 'var(--foreground)',
                            borderBottom: activeTab === 'pao' ? '2px solid var(--primary)' : 'none',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: activeTab === 'pao' ? 'bold' : 'normal'
                        }}
                    >
                        PAO System
                    </button>
                    <button
                        onClick={() => setActiveTab('palace')}
                        style={{
                            padding: '1rem 1.5rem',
                            background: 'none',
                            border: 'none',
                            color: activeTab === 'palace' ? 'var(--primary)' : 'var(--foreground)',
                            borderBottom: activeTab === 'palace' ? '2px solid var(--primary)' : 'none',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: activeTab === 'palace' ? 'bold' : 'normal'
                        }}
                    >
                        Memory Palaces
                    </button>
                </div>

                {/* Major System Tab */}
                {activeTab === 'major' && (
                    <div className="animate-fade-in">
                        {!drillActive ? (
                            <div className="glass card">
                                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Major System</h2>
                                <p style={{ opacity: 0.8, marginBottom: '2rem' }}>
                                    The Major System converts numbers into consonant sounds, which you then turn into memorable words.
                                </p>

                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Your System ({Object.keys(majorSystem).length} entries)</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', padding: '0.5rem' }}>
                                        {Object.entries(majorSystem).map(([num, word]) => (
                                            <div key={num} className="glass-panel" style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{num}</div>
                                                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>{word}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button className="btn btn-primary" onClick={startDrill}>
                                    Start Drill
                                </button>
                            </div>
                        ) : (
                            <div className="glass card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                    <h2 style={{ fontSize: '1.2rem' }}>Major System Drill</h2>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                        Score: {score.correct} / {score.total}
                                        {score.total > 0 && (
                                            <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem', opacity: 0.7 }}>
                                                ({Math.round((score.correct / score.total) * 100)}%)
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                                    <div style={{ fontSize: '0.9rem', opacity: 0.6, marginBottom: '1rem' }}>What image do you use for:</div>
                                    <div style={{ fontSize: '4rem', fontWeight: 'bold', marginBottom: '2rem', color: 'var(--primary)' }}>
                                        {currentPrompt}
                                    </div>

                                    <input
                                        type="text"
                                        className="input-field"
                                        style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center', fontSize: '1.2rem' }}
                                        value={userAnswer}
                                        onChange={(e) => setUserAnswer(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Type your answer..."
                                        autoFocus
                                    />

                                    {feedback && (
                                        <div style={{
                                            marginTop: '1.5rem',
                                            padding: '1rem',
                                            borderRadius: '0.5rem',
                                            background: feedback.correct ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                            color: feedback.correct ? 'var(--success)' : 'var(--error)',
                                            fontSize: '1.1rem'
                                        }}>
                                            {feedback.message}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDrillActive(false)}>
                                        Stop Drill
                                    </button>
                                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={checkAnswer} disabled={!userAnswer.trim()}>
                                        Check Answer
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* PAO System Tab */}
                {activeTab === 'pao' && (
                    <div className="animate-fade-in">
                        <div className="glass card">
                            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>PAO System</h2>
                            <p style={{ opacity: 0.8, marginBottom: '2rem' }}>
                                Person-Action-Object system for playing cards. Each card maps to a unique PAO combination.
                            </p>

                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Your System ({Object.keys(paoSystem).length} cards)</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto', padding: '0.5rem' }}>
                                    {Object.entries(paoSystem).map(([card, pao]) => (
                                        <div key={card} className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent)', minWidth: '50px' }}>{card}</div>
                                            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Person</div>
                                                    <div>{pao.person}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Action</div>
                                                    <div>{pao.action}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Object</div>
                                                    <div>{pao.object}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ background: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.3)', padding: '1rem', borderRadius: '0.5rem' }}>
                                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                                    💡 <strong>Tip:</strong> Build your full 52-card PAO system outside this app, then use the Card Blitz game to drill your conversions.
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Memory Palaces Tab */}
                {activeTab === 'palace' && (
                    <div className="animate-fade-in">
                        <div className="glass card">
                            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Memory Palaces</h2>
                            <p style={{ opacity: 0.8, marginBottom: '2rem' }}>
                                Organize your mental journeys and locations for the Method of Loci.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {palaces.map((palace, idx) => (
                                    <div key={idx} className="glass-panel" style={{ padding: '1.5rem' }}>
                                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--accent)' }}>
                                            {palace.name}
                                        </h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem' }}>
                                            {palace.locations.map((location, locIdx) => (
                                                <div key={locIdx} style={{
                                                    padding: '0.5rem',
                                                    background: 'rgba(0,0,0,0.2)',
                                                    borderRadius: '0.25rem',
                                                    fontSize: '0.85rem',
                                                    textAlign: 'center'
                                                }}>
                                                    <span style={{ opacity: 0.5, marginRight: '0.25rem' }}>{locIdx + 1}.</span>
                                                    {location}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '2rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--primary)', padding: '1rem', borderRadius: '0.5rem' }}>
                                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                                    💡 <strong>Tip:</strong> Create your palaces from familiar places. Walk through them mentally to ensure you can recall each location in order.
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </>
    );
}
