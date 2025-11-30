"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { MajorEntry, PaoEntry, getImageVaultData, saveGameResult, saveCardAttempt, CardAttempt } from '@/lib/firebase';
import { SAMPLE_MAJOR_SYSTEM, SAMPLE_PAO_SYSTEM } from '@/data/sampleImageVault';

type GameState = 'loading' | 'setup' | 'running' | 'result';
type PoolType = 'mixed' | 'numbers' | 'cards' | 'major-mastery';
type QuestionCategory = 'major-image' | 'major-reverse' | 'pao-person' | 'pao-action' | 'pao-object';

interface DrillQuestion {
    id: string;
    prompt: string;
    answer: string;
    category: QuestionCategory;
    source: string;
}

interface DrillResponse {
    question: DrillQuestion;
    given: string;
    isCorrect: boolean;
    duration: number;
}

const questionLabels: Record<QuestionCategory, string> = {
    'major-image': 'Major: Number → Word',
    'major-reverse': 'Major: Word → Number',
    'pao-person': 'PAO Person',
    'pao-action': 'PAO Action',
    'pao-object': 'PAO Object',
};

const normalize = (value: string) => value.trim().toLowerCase();

const buildQuestionFromMajor = (entry: MajorEntry, reverse: boolean = false): DrillQuestion | null => {
    if (!entry.images || entry.images.length === 0) return null;
    if (reverse) {
        return {
            id: `major-rev-${entry.id}`,
            prompt: `What is the number for "${entry.images[0]}"?`,
            answer: entry.number,
            category: 'major-reverse',
            source: entry.images[0],
        };
    }
    return {
        id: `major-${entry.id}`,
        prompt: `What is the word for ${entry.number}?`,
        answer: entry.images[0],
        category: 'major-image',
        source: entry.number,
    };
};

const buildQuestionFromPao = (entry: PaoEntry, category: QuestionCategory): DrillQuestion | null => {
    let answer = '';
    let prompt = '';
    switch (category) {
        case 'pao-person':
            answer = entry.person;
            prompt = `Who is assigned to ${entry.card}?`;
            break;
        case 'pao-action':
            answer = entry.action;
            prompt = `What is the action for ${entry.card}?`;
            break;
        case 'pao-object':
            answer = entry.object;
            prompt = `What is the object for ${entry.card}?`;
            break;
    }
    if (!answer) return null;
    return {
        id: `${category}-${entry.id}`,
        prompt,
        answer,
        category,
        source: entry.card,
    };
};

export default function SystemComponentChecker() {
    const [gameState, setGameState] = useState<GameState>('loading');
    const [majorSystem, setMajorSystem] = useState<MajorEntry[]>([]);
    const [paoSystem, setPaoSystem] = useState<PaoEntry[]>([]);

    const [poolType, setPoolType] = useState<PoolType>('major-mastery'); // Default to major-mastery as per recent context
    const [majorSubMode, setMajorSubMode] = useState<'mixed' | 'num-to-word' | 'word-to-num'>('mixed');
    const [isTimed, setIsTimed] = useState(false);
    const [questionCount, setQuestionCount] = useState(25);
    const [timeLimit, setTimeLimit] = useState(60);

    const [questions, setQuestions] = useState<DrillQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [responses, setResponses] = useState<DrillResponse[]>([]);
    const [timer, setTimer] = useState(timeLimit);
    const [stats, setStats] = useState<{ correct: number; total: number; accuracy: number; avgTime: number } | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const questionStartRef = useRef<number>(0);
    const sessionStartRef = useRef<number>(0);
    const responsesRef = useRef<DrillResponse[]>([]);

    useEffect(() => {
        const loadData = async () => {
            const data = await getImageVaultData();
            if (data) {
                setMajorSystem(data.majorSystem?.length ? data.majorSystem : SAMPLE_MAJOR_SYSTEM);
                setPaoSystem(data.paoSystem?.length ? data.paoSystem : SAMPLE_PAO_SYSTEM);
            } else {
                setMajorSystem(SAMPLE_MAJOR_SYSTEM);
                setPaoSystem(SAMPLE_PAO_SYSTEM);
            }
            setGameState('setup');
        };
        loadData();
    }, []);

    const finalizeSession = useCallback(async (overrideResponses?: DrillResponse[]) => {
        if (timerRef.current) clearInterval(timerRef.current);
        const finalResponses = overrideResponses ?? responsesRef.current;
        const totalTime = (Date.now() - sessionStartRef.current) / 1000;
        const total = questions.length || finalResponses.length;
        const correct = finalResponses.filter((resp) => resp.isCorrect).length;
        const accuracy = total ? Math.round((correct / total) * 100) : 0;
        const avgTime = finalResponses.length
            ? finalResponses.reduce((sum, resp) => sum + resp.duration, 0) / finalResponses.length
            : 0;
        setStats({ correct, total, accuracy, avgTime });
        setGameState('result');

        if (total > 0) {
            try {
                await saveGameResult({
                    type: 'system-checker',
                    count: total,
                    correct,
                    total,
                    percentage: accuracy,
                    memorizeTime: totalTime,
                    recallTime: 0,
                });
            } catch (error) {
                console.error('Failed to save System Checker result:', error);
            }
        }
    }, [questions.length]);

    useEffect(() => {
        if (gameState !== 'running') return;
        
        if (isTimed) {
            setTimer(timeLimit);
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        finalizeSession();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            // Untimed mode: just track elapsed time for final stats
            // We can use sessionStartRef to calculate total time at the end
            setTimer(0); // Optional: use timer to show elapsed time if desired
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [gameState, timeLimit, finalizeSession]);

    const generateQuestions = () => {
        const generated: DrillQuestion[] = [];
        const availableMajor = majorSystem.filter((entry) => entry.images?.length);
        const availablePao = paoSystem.filter((entry) => entry.person || entry.action || entry.object);
        const usedIds = new Set<string>(); // Track used entries to avoid duplicates

        const pools: QuestionCategory[] =
            poolType === 'mixed'
                ? ['major-image', 'pao-person', 'pao-action', 'pao-object']
                : poolType === 'numbers'
                    ? ['major-image']
                    : poolType === 'major-mastery'
                        ? majorSubMode === 'mixed' 
                            ? ['major-image', 'major-reverse']
                            : majorSubMode === 'num-to-word'
                                ? ['major-image']
                                : ['major-reverse']
                        : ['pao-person', 'pao-action', 'pao-object'];

        // For major-mastery, create a pool of all possible questions first
        if (poolType === 'major-mastery') {
            const allQuestions: DrillQuestion[] = [];
            
            if (majorSubMode === 'mixed' || majorSubMode === 'num-to-word') {
                availableMajor.forEach(entry => {
                    const q = buildQuestionFromMajor(entry, false);
                    if (q) allQuestions.push(q);
                });
            }
            
            if (majorSubMode === 'mixed' || majorSubMode === 'word-to-num') {
                availableMajor.forEach(entry => {
                    const q = buildQuestionFromMajor(entry, true);
                    if (q) allQuestions.push(q);
                });
            }
            
            // Shuffle and take the requested count
            const shuffled = allQuestions.sort(() => Math.random() - 0.5);
            return shuffled.slice(0, Math.min(questionCount, shuffled.length));
        }

        // For other modes, use the existing logic with duplicate prevention
        let attempts = 0;
        const maxAttempts = questionCount * 10; // Prevent infinite loops

        while (generated.length < questionCount && attempts < maxAttempts) {
            attempts++;
            const category = pools[Math.floor(Math.random() * pools.length)];
            let question: DrillQuestion | null = null;

            if ((category === 'major-image' || category === 'major-reverse') && availableMajor.length) {
                const entry = availableMajor[Math.floor(Math.random() * availableMajor.length)];
                const uniqueKey = `${category}-${entry.id}`;
                
                if (!usedIds.has(uniqueKey)) {
                    question = buildQuestionFromMajor(entry, category === 'major-reverse');
                    if (question) {
                        usedIds.add(uniqueKey);
                    }
                }
            } else if (category !== 'major-image' && category !== 'major-reverse' && availablePao.length) {
                const entry = availablePao[Math.floor(Math.random() * availablePao.length)];
                const uniqueKey = `${category}-${entry.id}`;
                
                if (!usedIds.has(uniqueKey)) {
                    question = buildQuestionFromPao(entry, category);
                    if (question) {
                        usedIds.add(uniqueKey);
                    }
                }
            }

            if (question) {
                generated.push({ ...question, id: `${question.id}-${generated.length}-${Date.now()}` });
            }
        }

        return generated;
    };

    const startSession = () => {
        const generated = generateQuestions();
        if (!generated.length) {
            alert('Need more data in Image Vault before running this drill.');
            return;
        }
        setQuestions(generated);
        setCurrentIndex(0);
        setResponses([]);
        responsesRef.current = [];
        setAnswer('');
        setStats(null);
        setStats(null);
        setTimer(isTimed ? timeLimit : 0);
        setGameState('running');
        questionStartRef.current = Date.now();
        sessionStartRef.current = Date.now();
    };

    const handleSubmit = async (skip = false) => {
        const currentQuestion = questions[currentIndex];
        if (!currentQuestion) return;
        const duration = (Date.now() - questionStartRef.current) / 1000;
        const sanitized = skip ? '' : answer;
        const isCorrect = !skip && normalize(sanitized) === normalize(currentQuestion.answer);

        // Save card stats if this is a Major System question
        if (currentQuestion.category === 'major-image' || currentQuestion.category === 'major-reverse') {
            // Extract card number from source or answer depending on question type
            let cardNumber = '';
            let questionType: 'digits' | 'words' = 'digits';

            if (currentQuestion.category === 'major-image') {
                // Prompt: "What is the word for {number}?" -> Source is number
                cardNumber = currentQuestion.source;
                questionType = 'digits';
            } else {
                // Prompt: "What is the number for {word}?" -> Answer is number
                cardNumber = currentQuestion.answer;
                questionType = 'words';
            }

            const attempt: CardAttempt = {
                cardNumber,
                isCorrect,
                responseTime: duration * 1000, // Convert to ms
                timestamp: Date.now(),
                questionType
            };
            
            // Fire and forget - don't await to keep UI snappy
            saveCardAttempt(attempt).catch(err => console.error("Failed to save card attempt:", err));
        }

        const newResponse: DrillResponse = {
            question: currentQuestion,
            given: sanitized.trim(),
            isCorrect,
            duration,
        };
        const updatedResponses = [...responsesRef.current, newResponse];
        responsesRef.current = updatedResponses;
        setResponses(updatedResponses);
        setAnswer('');
        questionStartRef.current = Date.now();

        if (currentIndex >= questions.length - 1) {
            finalizeSession(updatedResponses);
        } else {
            setCurrentIndex((prev) => prev + 1);
        }
    };

    const reset = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setGameState('setup');
        setQuestions([]);
        setResponses([]);
        responsesRef.current = [];
        setAnswer('');
        setStats(null);
    };

    if (gameState === 'loading') {
        return (
            <>
                <Header />
                <main className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
                    Loading systems...
                </main>
            </>
        );
    }

    const currentQuestion = questions[currentIndex];

    return (
        <>
            <Header />
            <main className="container" style={{ maxWidth: '900px', padding: '1rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <Link href="/training" style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem', display: 'inline-block' }}>
                        ← Back to Training
                    </Link>
                    <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold' }}>System Component Checker</h1>
                    <p style={{ color: '#94a3b8', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
                        Rapid-fire integrity drill for your Major and PAO systems.
                    </p>
                </div>

                    {gameState === 'setup' && (
                        <div className="glass card animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Question Pool</label>
                                <select className="input-field" value={poolType} onChange={(e) => setPoolType(e.target.value as PoolType)}>
                                    <option value="major-mastery">Major System Mastery (00-99 Mix)</option>
                                    <option value="mixed">Mixed (Numbers + Cards)</option>
                                    <option value="numbers">Numbers Only (Major)</option>
                                    <option value="cards">Cards Only (PAO)</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                                {poolType === 'major-mastery' && (
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Direction</label>
                                        <select className="input-field" value={majorSubMode} onChange={(e) => setMajorSubMode(e.target.value as any)}>
                                            <option value="mixed">Mixed (Both Ways)</option>
                                            <option value="num-to-word">Number → Word</option>
                                            <option value="word-to-num">Word → Number</option>
                                        </select>
                                    </div>
                                )}
                                
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Questions</label>
                                    <input
                                        type="number"
                                        min={10}
                                        max={200}
                                        className="input-field"
                                        value={questionCount}
                                        onChange={(e) => setQuestionCount(Math.max(10, Math.min(200, parseInt(e.target.value, 10) || 10)))}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Timer Mode</label>
                                    <select className="input-field" value={isTimed ? 'timed' : 'untimed'} onChange={(e) => setIsTimed(e.target.value === 'timed')}>
                                        <option value="untimed">Untimed (Stress Free)</option>
                                        <option value="timed">Timed Challenge</option>
                                    </select>
                                </div>

                                {isTimed && (
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Time Limit (s)</label>
                                        <input
                                            type="number"
                                            min={30}
                                            max={600}
                                            className="input-field"
                                            value={timeLimit}
                                            onChange={(e) => setTimeLimit(Math.max(30, Math.min(600, parseInt(e.target.value, 10) || 60)))}
                                        />
                                    </div>
                                )}
                            </div>

                            <div style={{ background: 'rgba(15,23,42,0.6)', padding: '1rem', borderRadius: '0.75rem' }}>
                                <h3 style={{ margin: 0, color: '#cbd5e1' }}>Challenge Goal</h3>
                                <p style={{ margin: '0.5rem 0 0', color: '#94a3b8' }}>
                                    Hit 50 mixed queries in 60 seconds with ≥95% accuracy.
                                </p>
                            </div>

                            <button className="btn btn-primary" onClick={startSession} style={{ alignSelf: 'center', minWidth: '240px' }}>
                                Start Rapid Fire
                            </button>
                        </div>
                    )}

                {gameState === 'running' && currentQuestion && (
                    <div className="glass card animate-fade-in" style={{ 
                        padding: '1rem', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '1rem',
                        minHeight: 'calc(100vh - 200px)',
                        maxWidth: '600px',
                        margin: '0 auto'
                    }}>
                        {/* Header Stats */}
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            padding: '0.5rem',
                            borderBottom: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <div style={{ fontSize: '1rem', fontWeight: '600', opacity: 0.8 }}>
                                {currentIndex + 1} / {questions.length}
                            </div>
                            <div style={{ 
                                fontSize: '1.2rem', 
                                fontWeight: 'bold', 
                                color: isTimed && timer <= 10 ? 'var(--error)' : 'var(--success)' 
                            }}>
                                {isTimed ? `${timer}s` : '∞'}
                            </div>
                        </div>

                        {/* Question */}
                        <div style={{ 
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            textAlign: 'center',
                            padding: '2rem 1rem',
                            gap: '1rem'
                        }}>
                            <div style={{ 
                                fontSize: '0.85rem', 
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                opacity: 0.6,
                                fontWeight: '600'
                            }}>
                                {questionLabels[currentQuestion.category]}
                            </div>
                            <div style={{ 
                                fontSize: 'clamp(1.2rem, 4vw, 2rem)', 
                                fontWeight: 'bold',
                                lineHeight: '1.3'
                            }}>
                                {currentQuestion.prompt}
                            </div>
                        </div>

                        {/* Input */}
                        <input
                            className="input-field"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Your answer"
                            autoCapitalize="none"
                            autoComplete="off"
                            autoCorrect="off"
                            inputMode={currentQuestion.category === 'major-reverse' ? 'numeric' : 'text'}
                            pattern={currentQuestion.category === 'major-reverse' ? '[0-9]*' : undefined}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSubmit(false);
                                }
                            }}
                            style={{
                                fontSize: '1.5rem',
                                textAlign: 'center',
                                padding: '1rem',
                                fontWeight: '600'
                            }}
                            autoFocus
                        />

                        {/* Virtual Keyboard for Numbers (Only show for numeric answers) */}
                        {currentQuestion.category === 'major-reverse' && (
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(3, 1fr)', 
                                gap: '0.5rem',
                                marginTop: '0.5rem'
                            }}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setAnswer(prev => prev + num)}
                                        style={{
                                            padding: '1rem',
                                            fontSize: '1.5rem',
                                            fontWeight: 'bold',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '0.5rem',
                                            color: '#fff',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseDown={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                                            e.currentTarget.style.transform = 'scale(0.95)';
                                        }}
                                        onMouseUp={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                    >
                                        {num}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setAnswer(prev => prev.slice(0, -1))}
                                    style={{
                                        padding: '1rem',
                                        fontSize: '1.5rem',
                                        fontWeight: 'bold',
                                        background: 'rgba(239, 68, 68, 0.2)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: '0.5rem',
                                        color: '#f87171',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseDown={(e) => {
                                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                                        e.currentTarget.style.transform = 'scale(0.95)';
                                    }}
                                    onMouseUp={(e) => {
                                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                >
                                    ⌫
                                </button>
                                <button
                                    onClick={() => setAnswer(prev => prev + '0')}
                                    style={{
                                        padding: '1rem',
                                        fontSize: '1.5rem',
                                        fontWeight: 'bold',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '0.5rem',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseDown={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                                        e.currentTarget.style.transform = 'scale(0.95)';
                                    }}
                                    onMouseUp={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                >
                                    0
                                </button>
                                <button
                                    onClick={() => setAnswer('')}
                                    style={{
                                        padding: '1rem',
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        background: 'rgba(251, 191, 36, 0.2)',
                                        border: '1px solid rgba(251, 191, 36, 0.3)',
                                        borderRadius: '0.5rem',
                                        color: '#fbbf24',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseDown={(e) => {
                                        e.currentTarget.style.background = 'rgba(251, 191, 36, 0.3)';
                                        e.currentTarget.style.transform = 'scale(0.95)';
                                    }}
                                    onMouseUp={(e) => {
                                        e.currentTarget.style.background = 'rgba(251, 191, 36, 0.2)';
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(251, 191, 36, 0.2)';
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                >
                                    Clear
                                </button>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button 
                                className="btn btn-primary" 
                                onClick={() => handleSubmit(false)}
                                style={{
                                    padding: '1rem',
                                    fontSize: '1.1rem',
                                    fontWeight: 'bold'
                                }}
                            >
                                Submit ✓
                            </button>
                            <button 
                                className="btn btn-secondary" 
                                onClick={() => handleSubmit(true)}
                                style={{
                                    padding: '1rem',
                                    fontSize: '1rem'
                                }}
                            >
                                Skip
                            </button>
                        </div>
                    </div>
                )}

                {gameState === 'result' && stats && (
                    <div className="glass card animate-fade-in" style={{ padding: '2rem' }}>
                        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Integrity Report</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div className="glass" style={{ padding: '1rem', borderRadius: '0.75rem' }}>
                                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Accuracy</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: stats.accuracy >= 95 ? 'var(--success)' : 'var(--accent)' }}>
                                    {stats.accuracy}%
                                </div>
                                <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                                    {stats.correct} / {stats.total}
                                </div>
                            </div>
                            <div className="glass" style={{ padding: '1rem', borderRadius: '0.75rem' }}>
                                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Average Response</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                                    {stats.avgTime.toFixed(2)} s
                                </div>
                            </div>
                        </div>

                        {/* Detailed Breakdown for Major Mastery */}
                        {poolType === 'major-mastery' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div className="glass" style={{ padding: '1rem', borderRadius: '0.75rem', textAlign: 'center' }}>
                                    <h4 style={{ margin: '0 0 0.5rem', opacity: 0.8, fontSize: '0.9rem' }}>Number → Word</h4>
                                    {(() => {
                                        const subset = responses.filter(r => r.question.category === 'major-image');
                                        const avg = subset.length ? subset.reduce((a, b) => a + b.duration, 0) / subset.length : 0;
                                        const acc = subset.length ? (subset.filter(r => r.isCorrect).length / subset.length) * 100 : 0;
                                        return (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{avg.toFixed(2)}s</div>
                                                <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>{Math.round(acc)}% Accuracy</div>
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div className="glass" style={{ padding: '1rem', borderRadius: '0.75rem', textAlign: 'center' }}>
                                    <h4 style={{ margin: '0 0 0.5rem', opacity: 0.8, fontSize: '0.9rem' }}>Word → Number</h4>
                                    {(() => {
                                        const subset = responses.filter(r => r.question.category === 'major-reverse');
                                        const avg = subset.length ? subset.reduce((a, b) => a + b.duration, 0) / subset.length : 0;
                                        const acc = subset.length ? (subset.filter(r => r.isCorrect).length / subset.length) * 100 : 0;
                                        return (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{avg.toFixed(2)}s</div>
                                                <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>{Math.round(acc)}% Accuracy</div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}

                        <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {responses.map((resp, idx) => {
                                const isNumToWord = resp.question.category === 'major-image';
                                const number = isNumToWord ? resp.question.source : resp.question.answer;
                                const word = isNumToWord ? resp.question.answer : resp.question.source;
                                
                                return (
                                    <div key={idx} style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        padding: '1rem',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: '0.75rem',
                                        borderLeft: `4px solid ${resp.isCorrect ? 'var(--success)' : 'var(--error)'}`
                                    }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span>{number}</span>
                                                <span style={{ opacity: 0.4, fontSize: '0.9rem' }}>↔</span>
                                                <span>{word}</span>
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: resp.isCorrect ? 'var(--success)' : 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ opacity: 0.7, color: 'var(--foreground)' }}>You:</span>
                                                <span style={{ fontWeight: '600' }}>{resp.given || '(empty)'}</span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', fontSize: '0.9rem', opacity: 0.6, fontWeight: '500' }}>
                                            {resp.duration.toFixed(1)}s
                                        </div>
                                    </div>
                                );
                            })}
                        </div>                                        


                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={reset}>
                                Run Again
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

