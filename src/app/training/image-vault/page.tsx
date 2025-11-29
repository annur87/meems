"use client";

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import {
    MajorEntry,
    PaoEntry,
    DigitPaoEntry,
    Palace,
    getImageVaultData,
    saveImageVaultData
} from '@/lib/firebase';
import { SAMPLE_MAJOR_SYSTEM, SAMPLE_PAO_SYSTEM, SAMPLE_PALACES } from '@/data/sampleImageVault';

type SystemType = 'major' | 'card-pao' | 'digit-pao' | 'palace';

const STORAGE_KEY = 'image_vault_data';

export default function ImageVault() {
    const [activeTab, setActiveTab] = useState<SystemType>('major');
    const [searchQuery, setSearchQuery] = useState('');

    // Major System
    const [majorSystem, setMajorSystem] = useState<MajorEntry[]>([]);
    const [editingMajor, setEditingMajor] = useState<string | null>(null);
    const [newMajorNumber, setNewMajorNumber] = useState('');
    const [newMajorImage, setNewMajorImage] = useState('');

    // Card PAO System
    const [cardPaoSystem, setCardPaoSystem] = useState<PaoEntry[]>([]);
    const [newCardPaoCard, setNewCardPaoCard] = useState('');
    const [newCardPaoPerson, setNewCardPaoPerson] = useState('');
    const [newCardPaoAction, setNewCardPaoAction] = useState('');
    const [newCardPaoObject, setNewCardPaoObject] = useState('');

    // Digit PAO System
    const [digitPaoSystem, setDigitPaoSystem] = useState<DigitPaoEntry[]>([]);
    const [newDigitPaoNumber, setNewDigitPaoNumber] = useState('');
    const [newDigitPaoPerson, setNewDigitPaoPerson] = useState('');
    const [newDigitPaoAction, setNewDigitPaoAction] = useState('');
    const [newDigitPaoObject, setNewDigitPaoObject] = useState('');

    // Memory Palaces
    const [palaces, setPalaces] = useState<Palace[]>([]);
    const [editingPalace, setEditingPalace] = useState<string | null>(null);
    const [newPalaceName, setNewPalaceName] = useState('');
    const [newLocation, setNewLocation] = useState('');

    // Drag and Drop State
    const [draggedItem, setDraggedItem] = useState<{ palaceId: string, index: number } | null>(null);
    const [dragOverItem, setDragOverItem] = useState<{ palaceId: string, index: number } | null>(null);

    // Quiz State
    const [quizMode, setQuizMode] = useState<'config' | 'active' | 'result' | null>(null);
    const [quizConfig, setQuizConfig] = useState({ count: 10, type: 'mixed' as 'digits' | 'words' | 'mixed', mode: 'untimed' as 'timed' | 'untimed' });
    const [quizQueue, setQuizQueue] = useState<MajorEntry[]>([]);
    const [currentQuizCard, setCurrentQuizCard] = useState<MajorEntry | null>(null);
    const [quizQuestionType, setQuizQuestionType] = useState<'digits' | 'words'>('digits');
    const [quizInput, setQuizInput] = useState('');
    const [quizStats, setQuizStats] = useState({ correct: 0, wrong: 0, startTime: 0, endTime: 0 });
    const [quizFeedback, setQuizFeedback] = useState<{ status: 'correct' | 'wrong' | null, message: string }>({ status: null, message: '' });
    const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
    const [cardStats, setCardStats] = useState<Map<string, { attempts: number, firstSeenTime: number, masteredTime: number }>>(new Map());
    const [currentCardStartTime, setCurrentCardStartTime] = useState(0);

    // Load from Firestore on mount
    useEffect(() => {
        const loadData = async () => {
            const data = await getImageVaultData();
            if (data) {
                setMajorSystem(data.majorSystem || []);
                setCardPaoSystem(data.paoSystem || []);
                setDigitPaoSystem(data.digitPaoSystem || []);
                setPalaces(data.palaces || []);
            } else {
                // Initialize with sample data if no cloud data exists (or handle empty state)
                // For now, we'll just leave them empty or rely on the bootstrap logic from TrainingHub
                // But if we want to be safe:
                setMajorSystem(SAMPLE_MAJOR_SYSTEM.map(entry => ({ ...entry, images: [...entry.images] })));
                // We don't load sample PAO here to avoid overwriting the bootstrapped data potentially
            }
        };

        loadData();
    }, []);

    // Save to Firestore whenever data changes (Debounced)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            saveImageVaultData({
                majorSystem,
                paoSystem: cardPaoSystem,
                digitPaoSystem,
                palaces
            });
        }, 1000); // 1 second debounce for cloud save

        return () => clearTimeout(timeoutId);
    }, [majorSystem, cardPaoSystem, digitPaoSystem, palaces]);

    // Major System Functions
    const addMajorEntry = () => {
        if (!newMajorNumber || !newMajorImage) return;

        const existing = majorSystem.find(e => e.number === newMajorNumber);
        if (existing) {
            // Add to existing number
            setMajorSystem(majorSystem.map(e =>
                e.number === newMajorNumber
                    ? { ...e, images: [...e.images, newMajorImage] }
                    : e
            ));
        } else {
            // Create new entry
            const newEntry: MajorEntry = {
                id: Date.now().toString(),
                number: newMajorNumber,
                images: [newMajorImage]
            };
            setMajorSystem([...majorSystem, newEntry].sort((a, b) => parseInt(a.number) - parseInt(b.number)));
        }

        setNewMajorNumber('');
        setNewMajorImage('');
    };

    const deleteMajorImage = (number: string, image: string) => {
        setMajorSystem(majorSystem.map(e => {
            if (e.number === number) {
                const newImages = e.images.filter(img => img !== image);
                return newImages.length > 0 ? { ...e, images: newImages } : null;
            }
            return e;
        }).filter(Boolean) as MajorEntry[]);
    };

    const deleteMajorEntry = (id: string) => {
        setMajorSystem(majorSystem.filter(e => e.id !== id));
    };

    // Card PAO System Functions
    const addCardPaoEntry = () => {
        if (!newCardPaoCard || !newCardPaoPerson) return;

        const newEntry: PaoEntry = {
            id: Date.now().toString(),
            card: newCardPaoCard.toUpperCase(),
            person: newCardPaoPerson,
            action: newCardPaoAction,
            object: newCardPaoObject
        };

        setCardPaoSystem([...cardPaoSystem, newEntry].sort((a, b) => a.card.localeCompare(b.card)));

        setNewCardPaoCard('');
        setNewCardPaoPerson('');
        setNewCardPaoAction('');
        setNewCardPaoObject('');
    };

    const updateCardPaoEntry = (id: string, field: keyof PaoEntry, value: string) => {
        setCardPaoSystem(cardPaoSystem.map(e =>
            e.id === id ? { ...e, [field]: value } : e
        ));
    };

    const deleteCardPaoEntry = (id: string) => {
        setCardPaoSystem(cardPaoSystem.filter(e => e.id !== id));
    };

    // Digit PAO System Functions
    const addDigitPaoEntry = () => {
        if (!newDigitPaoNumber || !newDigitPaoPerson) return;

        const newEntry: DigitPaoEntry = {
            id: Date.now().toString(),
            number: newDigitPaoNumber,
            person: newDigitPaoPerson,
            action: newDigitPaoAction,
            object: newDigitPaoObject
        };

        setDigitPaoSystem([...digitPaoSystem, newEntry].sort((a, b) => parseInt(a.number) - parseInt(b.number)));

        setNewDigitPaoNumber('');
        setNewDigitPaoPerson('');
        setNewDigitPaoAction('');
        setNewDigitPaoObject('');
    };

    const updateDigitPaoEntry = (id: string, field: keyof DigitPaoEntry, value: string) => {
        setDigitPaoSystem(digitPaoSystem.map(e =>
            e.id === id ? { ...e, [field]: value } : e
        ));
    };

    const deleteDigitPaoEntry = (id: string) => {
        setDigitPaoSystem(digitPaoSystem.filter(e => e.id !== id));
    };

    // Palace Functions
    const addPalace = () => {
        if (!newPalaceName) return;

        const newPalace: Palace = {
            id: Date.now().toString(),
            name: newPalaceName,
            locations: []
        };

        setPalaces([...palaces, newPalace]);
        setNewPalaceName('');
        setEditingPalace(newPalace.id);
    };

    const addLocation = (palaceId: string) => {
        if (!newLocation) return;

        setPalaces(palaces.map(p =>
            p.id === palaceId
                ? { ...p, locations: [...p.locations, newLocation] }
                : p
        ));

        setNewLocation('');
    };

    const deleteLocation = (palaceId: string, location: string) => {
        setPalaces(palaces.map(p =>
            p.id === palaceId
                ? { ...p, locations: p.locations.filter(l => l !== location) }
                : p
        ));
    };

    const moveLocation = (palaceId: string, index: number, direction: 'up' | 'down') => {
        setPalaces(palaces.map(p => {
            if (p.id === palaceId) {
                const newLocations = [...p.locations];
                const newIndex = direction === 'up' ? index - 1 : index + 1;

                if (newIndex >= 0 && newIndex < newLocations.length) {
                    [newLocations[index], newLocations[newIndex]] = [newLocations[newIndex], newLocations[index]];
                }

                return { ...p, locations: newLocations };
            }
            return p;
        }));
    };

    const deletePalace = (id: string) => {
        setPalaces(palaces.filter(p => p.id !== id));
        if (editingPalace === id) setEditingPalace(null);
    };

    const updatePalaceName = (id: string, name: string) => {
        setPalaces(palaces.map(p => p.id === id ? { ...p, name } : p));
    };

    // Drag and Drop Handlers
    const handleDragStart = (palaceId: string, index: number) => {
        setDraggedItem({ palaceId, index });
    };

    const handleDragEnter = (palaceId: string, index: number) => {
        setDragOverItem({ palaceId, index });
    };

    const handleDragEnd = () => {
        if (draggedItem && dragOverItem && draggedItem.palaceId === dragOverItem.palaceId) {
            const palace = palaces.find(p => p.id === draggedItem.palaceId);
            if (palace) {
                const newLocations = [...palace.locations];
                const draggedLocation = newLocations[draggedItem.index];
                newLocations.splice(draggedItem.index, 1);
                newLocations.splice(dragOverItem.index, 0, draggedLocation);

                setPalaces(palaces.map(p =>
                    p.id === draggedItem.palaceId ? { ...p, locations: newLocations } : p
                ));
            }
        }
        setDraggedItem(null);
        setDragOverItem(null);
    };

    // Search/Filter Functions
    const filteredMajor = majorSystem.filter(e =>
        e.number.includes(searchQuery) ||
        e.images.some(img => img.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredCardPao = cardPaoSystem.filter(e =>
        e.card.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.person.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.object.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredDigitPao = digitPaoSystem.filter(e =>
        e.number.includes(searchQuery) ||
        e.person.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.object.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredPalaces = palaces.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.locations.some(l => l.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Quiz Functions
    const toggleCardFlip = (id: string) => {
        const newFlipped = new Set(flippedCards);
        if (newFlipped.has(id)) newFlipped.delete(id);
        else newFlipped.add(id);
        setFlippedCards(newFlipped);
    };

    const startQuiz = () => {
        let pool = [...majorSystem];
        
        // For "All Cards" (999), we test BOTH directions: 100 cards × 2 = 200 questions
        if (quizConfig.count === 999) {
            // Create two copies: one for digits->words, one for words->digits
            const shuffled = pool.sort(() => 0.5 - Math.random());
            pool = [...shuffled, ...shuffled]; // 200 total questions
        } else if (quizConfig.count < pool.length) {
            pool = pool.sort(() => 0.5 - Math.random()).slice(0, quizConfig.count);
        } else {
            pool = pool.sort(() => 0.5 - Math.random());
        }
        
        setQuizQueue(pool);
        setQuizStats({ correct: 0, wrong: 0, startTime: Date.now(), endTime: 0 });
        setCardStats(new Map());
        setQuizMode('active');
        nextQuizCard(pool);
    };

    const nextQuizCard = (queue: MajorEntry[]) => {
        if (queue.length === 0) {
            setQuizStats(prev => ({ ...prev, endTime: Date.now() }));
            setQuizMode('result');
            return;
        }
        
        const nextCard = queue[0];
        setCurrentQuizCard(nextCard);
        setQuizInput('');
        setQuizFeedback({ status: null, message: '' });
        setCurrentCardStartTime(Date.now());
        
        // Initialize card stats if first time seeing this card
        const cardKey = nextCard.number;
        if (!cardStats.has(cardKey)) {
            setCardStats(prev => new Map(prev).set(cardKey, {
                attempts: 0,
                firstSeenTime: Date.now(),
                masteredTime: 0
            }));
        }
        
        if (quizConfig.type === 'mixed') {
            setQuizQuestionType(Math.random() > 0.5 ? 'digits' : 'words');
        } else {
            setQuizQuestionType(quizConfig.type);
        }
    };

    const handleQuizSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentQuizCard || quizFeedback.status) return;

        const answer = quizInput.trim().toLowerCase();
        let isCorrect = false;
        const targetNumber = currentQuizCard.number;
        // Use first image as primary, but check against all
        const targetWord = currentQuizCard.images?.[0] || '???'; 

        if (quizQuestionType === 'digits') {
            // Showed Digits, expect Word
            if (currentQuizCard.images?.some(img => img.toLowerCase() === answer)) isCorrect = true;
        } else {
            // Showed Word, expect Digits
            if (answer === targetNumber) isCorrect = true;
        }

        // Update card stats
        const cardKey = currentQuizCard.number;
        const stats = cardStats.get(cardKey);
        if (stats) {
            setCardStats(prev => new Map(prev).set(cardKey, {
                ...stats,
                attempts: stats.attempts + 1
            }));
        }

        if (isCorrect) {
            setQuizFeedback({ status: 'correct', message: 'Correct!' });
            setQuizStats(prev => ({ ...prev, correct: prev.correct + 1 }));
            
            // Mark as mastered
            if (stats && stats.masteredTime === 0) {
                setCardStats(prev => new Map(prev).set(cardKey, {
                    ...stats,
                    attempts: stats.attempts + 1,
                    masteredTime: Date.now()
                }));
            }
            
            setTimeout(() => {
                const newQueue = quizQueue.slice(1);
                setQuizQueue(newQueue);
                nextQuizCard(newQueue);
            }, 1000);
        } else {
            setQuizFeedback({ 
                status: 'wrong', 
                message: `Wrong! It was ${quizQuestionType === 'digits' ? targetWord : targetNumber}` 
            });
            setQuizStats(prev => ({ ...prev, wrong: prev.wrong + 1 }));
            
            setTimeout(() => {
                const newQueue = [...quizQueue.slice(1), currentQuizCard];
                setQuizQueue(newQueue);
                nextQuizCard(newQueue);
            }, 2500);
        }
    };

    return (
        <>
            <Header />
            <main className="container" style={{ maxWidth: '1200px' }}>

                <div style={{ marginBottom: '2rem' }}>
                    <Link href="/training" style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem', display: 'inline-block' }}>
                        ← Back to Training
                    </Link>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>The Image Vault</h1>
                            <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>Manage and organize your mnemonic systems</p>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.85rem', opacity: 0.7 }}>
                            <div style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>
                                <span style={{ marginRight: '0.5rem' }}>☁️</span>
                                Cloud Storage Active
                            </div>
                            <button 
                                onClick={async () => {
                                    if (confirm('This will overwrite your current data with the default sets. Are you sure?')) {
                                        const { digitPaoList } = await import('@/data/digit-pao');
                                        const { cardPaoList } = await import('@/data/card-pao');
                                        const { majorSystemList } = await import('@/data/major-system');
                                        
                                        const digitEntries = digitPaoList.map(p => ({ id: p.number, ...p }));
                                        const cardEntries = cardPaoList.map(p => ({ id: p.card, ...p }));
                                        
                                        const majorEntries = majorSystemList.map(m => ({
                                            id: m.number,
                                            number: m.number,
                                            images: [m.word]
                                        }));

                                        await saveImageVaultData({
                                            digitPaoSystem: digitEntries,
                                            paoSystem: cardEntries,
                                            majorSystem: majorEntries,
                                            palaces: [] // Keep palaces empty but initialized
                                        });
                                        
                                        // Reload
                                        const data = await getImageVaultData();
                                        if (data) {
                                            setDigitPaoSystem(data.digitPaoSystem || []);
                                            setCardPaoSystem(data.paoSystem || []);
                                            setMajorSystem(data.majorSystem || []);
                                            setPalaces(data.palaces || []);
                                        }
                                        alert('Data reset to defaults!');
                                    }
                                }}
                                style={{
                                    background: 'none',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '0.25rem',
                                    color: 'var(--foreground)',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem'
                                }}
                            >
                                ↺ Reset Defaults
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div style={{ marginBottom: '2rem' }}>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', maxWidth: '400px' }}
                    />
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => { setActiveTab('major'); setSearchQuery(''); }}
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
                        Major System ({majorSystem.length})
                    </button>
                    <button
                        onClick={() => { setActiveTab('card-pao'); setSearchQuery(''); }}
                        style={{
                            padding: '1rem 1.5rem',
                            background: 'none',
                            border: 'none',
                            color: activeTab === 'card-pao' ? 'var(--primary)' : 'var(--foreground)',
                            borderBottom: activeTab === 'card-pao' ? '2px solid var(--primary)' : 'none',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: activeTab === 'card-pao' ? 'bold' : 'normal'
                        }}
                    >
                        Card PAO ({cardPaoSystem.length})
                    </button>
                    <button
                        onClick={() => { setActiveTab('digit-pao'); setSearchQuery(''); }}
                        style={{
                            padding: '1rem 1.5rem',
                            background: 'none',
                            border: 'none',
                            color: activeTab === 'digit-pao' ? 'var(--primary)' : 'var(--foreground)',
                            borderBottom: activeTab === 'digit-pao' ? '2px solid var(--primary)' : 'none',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: activeTab === 'digit-pao' ? 'bold' : 'normal'
                        }}
                    >
                        Digit PAO ({digitPaoSystem.length})
                    </button>
                    <button
                        onClick={() => { setActiveTab('palace'); setSearchQuery(''); }}
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
                        Memory Palaces ({palaces.length})
                    </button>
                </div>

                {/* Major System Tab */}
                {activeTab === 'major' && (
                    <div className="animate-fade-in">
                        {/* Quiz Mode Overlay */}
                        {quizMode === 'config' && (
                            <div className="glass-panel" style={{ marginBottom: '2rem', padding: '2rem', textAlign: 'center' }}>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Major System Hardcore Quiz</h2>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem', maxWidth: '800px', margin: '0 auto 2rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Card Count</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {[5, 10, 50, 100, 200].map(n => (
                                                <button 
                                                    key={n}
                                                    onClick={() => setQuizConfig(c => ({ ...c, count: n }))}
                                                    className={`btn ${quizConfig.count === n ? 'btn-primary' : ''}`}
                                                    style={{ padding: '0.5rem', opacity: quizConfig.count === n ? 1 : 0.6 }}
                                                >
                                                    {n} Cards
                                                </button>
                                            ))}
                                            <button 
                                                onClick={() => setQuizConfig(c => ({ ...c, count: 999 }))}
                                                className={`btn ${quizConfig.count === 999 ? 'btn-primary' : ''}`}
                                                style={{ padding: '0.5rem', opacity: quizConfig.count === 999 ? 1 : 0.6 }}
                                            >
                                                All Cards
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Question Type</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <button 
                                                onClick={() => setQuizConfig(c => ({ ...c, type: 'digits' }))}
                                                className={`btn ${quizConfig.type === 'digits' ? 'btn-primary' : ''}`}
                                                style={{ padding: '0.5rem', opacity: quizConfig.type === 'digits' ? 1 : 0.6 }}
                                            >
                                                Digits → Word
                                            </button>
                                            <button 
                                                onClick={() => setQuizConfig(c => ({ ...c, type: 'words' }))}
                                                className={`btn ${quizConfig.type === 'words' ? 'btn-primary' : ''}`}
                                                style={{ padding: '0.5rem', opacity: quizConfig.type === 'words' ? 1 : 0.6 }}
                                            >
                                                Word → Digits
                                            </button>
                                            <button 
                                                onClick={() => setQuizConfig(c => ({ ...c, type: 'mixed' }))}
                                                className={`btn ${quizConfig.type === 'mixed' ? 'btn-primary' : ''}`}
                                                style={{ padding: '0.5rem', opacity: quizConfig.type === 'mixed' ? 1 : 0.6 }}
                                            >
                                                Mixed
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Mode</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <button 
                                                onClick={() => setQuizConfig(c => ({ ...c, mode: 'untimed' }))}
                                                className={`btn ${quizConfig.mode === 'untimed' ? 'btn-primary' : ''}`}
                                                style={{ padding: '0.5rem', opacity: quizConfig.mode === 'untimed' ? 1 : 0.6 }}
                                            >
                                                Untimed
                                            </button>
                                            <button 
                                                onClick={() => setQuizConfig(c => ({ ...c, mode: 'timed' }))}
                                                className={`btn ${quizConfig.mode === 'timed' ? 'btn-primary' : ''}`}
                                                style={{ padding: '0.5rem', opacity: quizConfig.mode === 'timed' ? 1 : 0.6 }}
                                            >
                                                Timed
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                    <button onClick={() => setQuizMode(null)} className="btn" style={{ background: 'rgba(255,255,255,0.1)' }}>Cancel</button>
                                    <button onClick={startQuiz} className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>Start Quiz</button>
                                </div>
                            </div>
                        )}

                        {quizMode === 'active' && currentQuizCard && (
                            <div className="glass-panel" style={{ marginBottom: '2rem', padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ marginBottom: '1rem', opacity: 0.7 }}>
                                    Remaining: {quizQueue.length} | Wrong Attempts: {quizStats.wrong}
                                </div>
                                
                                <div style={{ 
                                    fontSize: '4rem', 
                                    fontWeight: 'bold', 
                                    marginBottom: '2rem',
                                    color: 'var(--primary)',
                                    minHeight: '120px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                {quizQuestionType === 'digits' ? currentQuizCard.number : (currentQuizCard.images?.[0] || '???')}
                                </div>

                                <form onSubmit={handleQuizSubmit} style={{ width: '100%', maxWidth: '400px' }}>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder={quizQuestionType === 'digits' ? "Type the word..." : "Type the digits..."}
                                        value={quizInput}
                                        onChange={(e) => setQuizInput(e.target.value)}
                                        autoFocus
                                        disabled={!!quizFeedback.status}
                                        style={{ 
                                            textAlign: 'center', 
                                            fontSize: '1.5rem', 
                                            marginBottom: '1rem',
                                            borderColor: quizFeedback.status === 'correct' ? 'var(--success)' : quizFeedback.status === 'wrong' ? 'var(--error)' : undefined
                                        }}
                                    />
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary" 
                                        style={{ width: '100%' }}
                                        disabled={!!quizFeedback.status}
                                    >
                                        Submit
                                    </button>
                                </form>

                                {quizFeedback.status && (
                                    <div className="animate-fade-in" style={{ 
                                        marginTop: '2rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1rem',
                                        alignItems: 'center'
                                    }}>
                                        <div style={{ 
                                            fontSize: '1.2rem', 
                                            fontWeight: 'bold',
                                            color: quizFeedback.status === 'correct' ? 'var(--success)' : 'var(--error)'
                                        }}>
                                            {quizFeedback.status === 'correct' ? '✓ Correct!' : '✗ Wrong!'}
                                        </div>
                                        
                                        {quizFeedback.status === 'wrong' && currentQuizCard && (
                                            <div className="glass" style={{ 
                                                padding: '1.5rem 2rem',
                                                borderRadius: '1rem',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: '2px solid var(--error)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '1rem',
                                                alignItems: 'center',
                                                minWidth: '300px'
                                            }}>
                                                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                                    {currentQuizCard.number}
                                                </div>
                                                <div style={{ fontSize: '1rem', opacity: 0.7 }}>↕</div>
                                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>
                                                    {currentQuizCard.images?.[0] || '???'}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {quizMode === 'result' && (
                            <div className="glass-panel" style={{ marginBottom: '2rem', padding: '2rem' }}>
                                <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--success)', textAlign: 'center' }}>Quiz Complete!</h2>
                                <p style={{ fontSize: '1.2rem', marginBottom: '2rem', textAlign: 'center' }}>
                                    You successfully memorized {quizConfig.count === 999 ? `all ${majorSystem.length} cards (${majorSystem.length * 2} questions)` : `${quizConfig.count} cards`}.
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
                                    <div className="glass" style={{ padding: '1rem', textAlign: 'center' }}>
                                        <div style={{ opacity: 0.7, fontSize: '0.9rem' }}>Total Time</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                            {((quizStats.endTime - quizStats.startTime) / 1000).toFixed(1)}s
                                        </div>
                                    </div>
                                    <div className="glass" style={{ padding: '1rem', textAlign: 'center' }}>
                                        <div style={{ opacity: 0.7, fontSize: '0.9rem' }}>Total Attempts</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                            {quizStats.correct + quizStats.wrong}
                                        </div>
                                    </div>
                                    <div className="glass" style={{ padding: '1rem', textAlign: 'center' }}>
                                        <div style={{ opacity: 0.7, fontSize: '0.9rem' }}>Mistakes</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: quizStats.wrong > 0 ? 'var(--error)' : 'var(--success)' }}>
                                            {quizStats.wrong}
                                        </div>
                                    </div>
                                </div>

                                {/* Per-Card Stats */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', textAlign: 'center' }}>Per-Card Performance</h3>
                                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 100px 120px', gap: '0.5rem', padding: '0.5rem', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: 0, background: 'var(--background)', zIndex: 1 }}>
                                            <div>Number</div>
                                            <div>Word</div>
                                            <div>Attempts</div>
                                            <div>Time to Master</div>
                                        </div>
                                        {Array.from(cardStats.entries())
                                            .sort((a, b) => b[1].attempts - a[1].attempts)
                                            .map(([cardNum, stats]) => {
                                                const card = majorSystem.find(c => c.number === cardNum);
                                                const timeToMaster = stats.masteredTime > 0 
                                                    ? ((stats.masteredTime - stats.firstSeenTime) / 1000).toFixed(1)
                                                    : 'N/A';
                                                return (
                                                    <div key={cardNum} className="glass" style={{ display: 'grid', gridTemplateColumns: '80px 1fr 100px 120px', gap: '0.5rem', padding: '0.75rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                                        <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{cardNum}</div>
                                                        <div>{card?.images?.[0] || '???'}</div>
                                                        <div style={{ color: stats.attempts > 1 ? 'var(--error)' : 'var(--success)' }}>
                                                            {stats.attempts}
                                                        </div>
                                                        <div style={{ opacity: 0.8 }}>{timeToMaster}s</div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>

                                <div style={{ textAlign: 'center' }}>
                                    <button onClick={() => setQuizMode(null)} className="btn btn-primary">Back to Vault</button>
                                </div>
                            </div>
                        )}

                        {/* Default View: Card Grid */}
                        {!quizMode && (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.1rem' }}>Major System Cards</h3>
                                    <button 
                                        onClick={() => setQuizMode('config')}
                                        className="btn btn-primary"
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        <span>⚡</span> Start Hardcore Quiz
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
                                    {filteredMajor.map((entry) => (
                                        <div 
                                            key={entry.id} 
                                            onClick={() => toggleCardFlip(entry.id)}
                                            className="glass"
                                            style={{ 
                                                aspectRatio: '3/4', 
                                                cursor: 'pointer',
                                                perspective: '1000px',
                                                position: 'relative',
                                                padding: 0,
                                                overflow: 'visible'
                                            }}
                                        >
                                            <div style={{
                                                width: '100%', height: '100%',
                                                transition: 'transform 0.6s',
                                                transformStyle: 'preserve-3d',
                                                transform: flippedCards.has(entry.id) ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                                position: 'relative',
                                                borderRadius: '0.5rem'
                                            }}>
                                                {/* Front (Number) */}
                                                <div style={{
                                                    position: 'absolute', width: '100%', height: '100%',
                                                    backfaceVisibility: 'hidden',
                                                    WebkitBackfaceVisibility: 'hidden',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)',
                                                    background: 'rgba(30, 41, 59, 0.6)', 
                                                    borderRadius: '0.5rem',
                                                    border: '1px solid rgba(255,255,255,0.1)'
                                                }}>
                                                    {entry.number}
                                                </div>
                                                {/* Back (Word) */}
                                                <div style={{
                                                    position: 'absolute', width: '100%', height: '100%',
                                                    backfaceVisibility: 'hidden',
                                                    WebkitBackfaceVisibility: 'hidden',
                                                    transform: 'rotateY(180deg)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '1rem', fontWeight: 'bold', color: 'white',
                                                    background: 'var(--primary)', 
                                                    borderRadius: '0.5rem',
                                                    padding: '0.5rem', 
                                                    textAlign: 'center',
                                                    wordBreak: 'break-word'
                                                }}>
                                                    {entry.images?.[0] || '???'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {filteredMajor.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                                        No cards found.
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Card PAO System Tab */}
                {activeTab === 'card-pao' && (
                    <div className="animate-fade-in">
                        {/* Add New Entry */}
                        <div className="glass card" style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Add Card PAO Entry</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem', opacity: 0.7 }}>Card</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="AS"
                                        value={newCardPaoCard}
                                        onChange={(e) => setNewCardPaoCard(e.target.value.toUpperCase().slice(0, 2))}
                                        maxLength={2}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem', opacity: 0.7 }}>Person</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Albert Einstein"
                                        value={newCardPaoPerson}
                                        onChange={(e) => setNewCardPaoPerson(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem', opacity: 0.7 }}>Action</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Calculating"
                                        value={newCardPaoAction}
                                        onChange={(e) => setNewCardPaoAction(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem', opacity: 0.7 }}>Object</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Chalkboard"
                                        value={newCardPaoObject}
                                        onChange={(e) => setNewCardPaoObject(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addCardPaoEntry()}
                                    />
                                </div>
                                <button className="btn btn-primary" onClick={addCardPaoEntry}>
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Entries List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {filteredCardPao.length === 0 ? (
                                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
                                    {searchQuery ? 'No results found' : 'No Card PAO entries yet. Add your first one above!'}
                                </div>
                            ) : (
                                filteredCardPao.map((entry) => (
                                    <div key={entry.id} className="glass-panel" style={{ padding: '1rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr auto', gap: '1rem', alignItems: 'center' }}>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                                                {entry.card}
                                            </div>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={entry.person}
                                                onChange={(e) => updateCardPaoEntry(entry.id, 'person', e.target.value)}
                                                style={{ padding: '0.5rem' }}
                                            />
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={entry.action}
                                                onChange={(e) => updateCardPaoEntry(entry.id, 'action', e.target.value)}
                                                style={{ padding: '0.5rem' }}
                                            />
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={entry.object}
                                                onChange={(e) => updateCardPaoEntry(entry.id, 'object', e.target.value)}
                                                style={{ padding: '0.5rem' }}
                                            />
                                            <button
                                                onClick={() => deleteCardPaoEntry(entry.id)}
                                                style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '1.5rem' }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Digit PAO System Tab */}
                {activeTab === 'digit-pao' && (
                    <div className="animate-fade-in">
                        {/* Add New Entry */}
                        <div className="glass card" style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Add Digit PAO Entry</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem', opacity: 0.7 }}>Number</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="00"
                                        value={newDigitPaoNumber}
                                        onChange={(e) => setNewDigitPaoNumber(e.target.value.replace(/\D/g, '').slice(0, 2))}
                                        maxLength={2}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem', opacity: 0.7 }}>Person</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Person Name"
                                        value={newDigitPaoPerson}
                                        onChange={(e) => setNewDigitPaoPerson(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem', opacity: 0.7 }}>Action</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Doing something"
                                        value={newDigitPaoAction}
                                        onChange={(e) => setNewDigitPaoAction(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem', opacity: 0.7 }}>Object</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="With something"
                                        value={newDigitPaoObject}
                                        onChange={(e) => setNewDigitPaoObject(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addDigitPaoEntry()}
                                    />
                                </div>
                                <button className="btn btn-primary" onClick={addDigitPaoEntry}>
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Entries List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {filteredDigitPao.length === 0 ? (
                                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
                                    {searchQuery ? 'No results found' : 'No Digit PAO entries yet. Add your first one above!'}
                                </div>
                            ) : (
                                filteredDigitPao.map((entry) => (
                                    <div key={entry.id} className="glass-panel" style={{ padding: '1rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr auto', gap: '1rem', alignItems: 'center' }}>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                                                {entry.number}
                                            </div>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={entry.person}
                                                onChange={(e) => updateDigitPaoEntry(entry.id, 'person', e.target.value)}
                                                style={{ padding: '0.5rem' }}
                                            />
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={entry.action}
                                                onChange={(e) => updateDigitPaoEntry(entry.id, 'action', e.target.value)}
                                                style={{ padding: '0.5rem' }}
                                            />
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={entry.object}
                                                onChange={(e) => updateDigitPaoEntry(entry.id, 'object', e.target.value)}
                                                style={{ padding: '0.5rem' }}
                                            />
                                            <button
                                                onClick={() => deleteDigitPaoEntry(entry.id)}
                                                style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '1.5rem' }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Memory Palaces Tab */}
                {activeTab === 'palace' && (
                    <div className="animate-fade-in">
                        {/* Add New Palace */}
                        <div className="glass card" style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Add New Palace</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem', opacity: 0.7 }}>Palace Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="My Memory Palace"
                                        value={newPalaceName}
                                        onChange={(e) => setNewPalaceName(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addPalace()}
                                    />
                                </div>
                                <button className="btn btn-primary" onClick={addPalace}>
                                    Create Palace
                                </button>
                            </div>
                        </div>

                        {/* Palaces List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {filteredPalaces.length === 0 ? (
                                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
                                    {searchQuery ? 'No results found' : 'No palaces yet. Create your first one above!'}
                                </div>
                            ) : (
                                filteredPalaces.map((palace) => (
                                    <div key={palace.id} className="glass-panel" style={{ padding: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            {editingPalace === palace.id ? (
                                                <input
                                                    type="text"
                                                    className="input-field"
                                                    value={palace.name}
                                                    onChange={(e) => updatePalaceName(palace.id, e.target.value)}
                                                    onBlur={() => setEditingPalace(null)}
                                                    autoFocus
                                                    style={{ fontSize: '1.1rem', fontWeight: 'bold', maxWidth: '300px' }}
                                                />
                                            ) : (
                                                <h3
                                                    style={{ fontSize: '1.1rem', color: 'var(--accent)', cursor: 'pointer' }}
                                                    onClick={() => setEditingPalace(palace.id)}
                                                >
                                                    {palace.name} ({palace.locations.length} locations)
                                                </h3>
                                            )}
                                            <button
                                                onClick={() => deletePalace(palace.id)}
                                                style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.9rem' }}
                                            >
                                                Delete Palace
                                            </button>
                                        </div>

                                        {/* Add Location */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', marginBottom: '1rem' }}>
                                            <input
                                                type="text"
                                                className="input-field"
                                                placeholder="Add new location..."
                                                value={editingPalace === palace.id ? newLocation : ''}
                                                onChange={(e) => setNewLocation(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && addLocation(palace.id)}
                                                onFocus={() => setEditingPalace(palace.id)}
                                                style={{ padding: '0.5rem' }}
                                            />
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => addLocation(palace.id)}
                                                style={{ padding: '0.5rem 1rem' }}
                                            >
                                                Add
                                            </button>
                                        </div>

                                        {/* Locations List */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {palace.locations.map((location, idx) => {
                                                const isDragging = draggedItem?.palaceId === palace.id && draggedItem?.index === idx;
                                                const isDragOver = dragOverItem?.palaceId === palace.id && dragOverItem?.index === idx;

                                                return (
                                                    <div
                                                        key={idx}
                                                        draggable
                                                        onDragStart={() => handleDragStart(palace.id, idx)}
                                                        onDragEnter={() => handleDragEnter(palace.id, idx)}
                                                        onDragEnd={handleDragEnd}
                                                        onDragOver={(e) => e.preventDefault()}
                                                        style={{
                                                            padding: '0.75rem',
                                                            background: isDragOver ? 'rgba(99, 102, 241, 0.2)' : 'rgba(0,0,0,0.2)',
                                                            borderRadius: '0.5rem',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            cursor: 'grab',
                                                            opacity: isDragging ? 0.5 : 1,
                                                            border: isDragOver ? '2px solid var(--primary)' : '2px solid transparent',
                                                            transition: 'all 0.2s',
                                                            transform: isDragging ? 'scale(0.95)' : 'scale(1)'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!isDragging) {
                                                                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (!isDragOver) {
                                                                e.currentTarget.style.background = 'rgba(0,0,0,0.2)';
                                                            }
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                                            <span style={{
                                                                opacity: 0.5,
                                                                minWidth: '30px',
                                                                fontSize: '0.9rem',
                                                                fontWeight: 'bold'
                                                            }}>
                                                                {idx + 1}.
                                                            </span>
                                                            <span style={{
                                                                fontSize: '1.6rem',
                                                                opacity: 0.3,
                                                                cursor: 'grab',
                                                                userSelect: 'none'
                                                            }}>
                                                                ⋮⋮
                                                            </span>
                                                            <span style={{ flex: 1, fontSize: '1rem' }}>{location}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button
                                                                onClick={() => moveLocation(palace.id, idx, 'up')}
                                                                disabled={idx === 0}
                                                                style={{
                                                                    background: idx === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(99, 102, 241, 0.2)',
                                                                    border: 'none',
                                                                    borderRadius: '0.25rem',
                                                                    padding: '0.25rem 0.5rem',
                                                                    color: idx === 0 ? 'rgba(255,255,255,0.2)' : 'var(--primary)',
                                                                    cursor: idx === 0 ? 'not-allowed' : 'pointer',
                                                                    fontSize: '1.2rem',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    if (idx !== 0) {
                                                                        e.currentTarget.style.background = 'var(--primary)';
                                                                        e.currentTarget.style.color = 'white';
                                                                    }
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    if (idx !== 0) {
                                                                        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                                                                        e.currentTarget.style.color = 'var(--primary)';
                                                                    }
                                                                }}
                                                            >
                                                                ↑
                                                            </button>
                                                            <button
                                                                onClick={() => moveLocation(palace.id, idx, 'down')}
                                                                disabled={idx === palace.locations.length - 1}
                                                                style={{
                                                                    background: idx === palace.locations.length - 1 ? 'rgba(255,255,255,0.05)' : 'rgba(99, 102, 241, 0.2)',
                                                                    border: 'none',
                                                                    borderRadius: '0.25rem',
                                                                    padding: '0.25rem 0.5rem',
                                                                    color: idx === palace.locations.length - 1 ? 'rgba(255,255,255,0.2)' : 'var(--primary)',
                                                                    cursor: idx === palace.locations.length - 1 ? 'not-allowed' : 'pointer',
                                                                    fontSize: '1.2rem',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    if (idx !== palace.locations.length - 1) {
                                                                        e.currentTarget.style.background = 'var(--primary)';
                                                                        e.currentTarget.style.color = 'white';
                                                                    }
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    if (idx !== palace.locations.length - 1) {
                                                                        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                                                                        e.currentTarget.style.color = 'var(--primary)';
                                                                    }
                                                                }}
                                                            >
                                                                ↓
                                                            </button>
                                                            <button
                                                                onClick={() => deleteLocation(palace.id, location)}
                                                                style={{
                                                                    background: 'rgba(239, 68, 68, 0.2)',
                                                                    border: 'none',
                                                                    borderRadius: '0.25rem',
                                                                    padding: '0.25rem 0.5rem',
                                                                    color: 'var(--error)',
                                                                    cursor: 'pointer',
                                                                    fontSize: '1.2rem',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.background = 'var(--error)';
                                                                    e.currentTarget.style.color = 'white';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                                                    e.currentTarget.style.color = 'var(--error)';
                                                                }}
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {palace.locations.length === 0 && (
                                                <div style={{ padding: '1rem', textAlign: 'center', opacity: 0.5, fontSize: '0.9rem' }}>
                                                    No locations yet. Add your first one above!
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

            </main>
        </>
    );
}
