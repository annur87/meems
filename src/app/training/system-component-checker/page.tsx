"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { MajorEntry, PaoEntry, getImageVaultData, saveGameResult } from '@/lib/firebase';
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

        for (let i = 0; i < questionCount; i++) {
            const category = pools[Math.floor(Math.random() * pools.length)];
            let question: DrillQuestion | null = null;

            if ((category === 'major-image' || category === 'major-reverse') && availableMajor.length) {
                // For major-mastery, we want to ensure we cover the range if possible, but random is fine for now
                // If count is large (e.g. 200), we might want to be more systematic, but random sampling is the current pattern.
                // To support "mix of all", if count >= available * 2, we should just generate all.
                // But let's stick to random for consistency with existing code, or improve if needed.
                const entry = availableMajor[Math.floor(Math.random() * availableMajor.length)];
                question = buildQuestionFromMajor(entry, category === 'major-reverse');
            } else if (category !== 'major-image' && category !== 'major-reverse' && availablePao.length) {
                const entry = availablePao[Math.floor(Math.random() * availablePao.length)];
                question = buildQuestionFromPao(entry, category);
            }

            if (question) {
                generated.push({ ...question, id: `${question.id}-${i}-${Date.now()}` });
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

    const handleSubmit = (skip = false) => {
        const currentQuestion = questions[currentIndex];
        if (!currentQuestion) return;
        const duration = (Date.now() - questionStartRef.current) / 1000;
        const sanitized = skip ? '' : answer;
        const isCorrect = !skip && normalize(sanitized) === normalize(currentQuestion.answer);

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
            <main className="container" style={{ maxWidth: '900px' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <Link href="/training" style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem', display: 'inline-block' }}>
                        ← Back to Training
                    </Link>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>System Component Checker</h1>
                    <p style={{ color: '#94a3b8', maxWidth: '600px' }}>
                        Rapid-fire integrity drill for your Major and PAO systems. Instant retrieval only—no hesitation.
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
                    <div className="glass card animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>Question</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                    {currentIndex + 1} / {questions.length}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>{isTimed ? 'Timer' : 'Mode'}</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: isTimed && timer <= 10 ? 'var(--error)' : 'var(--success)' }}>
                                    {isTimed ? `${timer}s` : 'Untimed'}
                                </div>
                            </div>
                        </div>

                        <div className="glass" style={{ padding: '1rem', borderRadius: '0.75rem' }}>
                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{questionLabels[currentQuestion.category]}</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', marginTop: '0.5rem' }}>{currentQuestion.prompt}</div>
                        </div>

                        <input
                            className="input-field"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Type answer and press Enter"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSubmit(false);
                                }
                            }}
                            autoFocus
                        />

                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <button className="btn btn-primary" style={{ flex: 1, minWidth: '150px' }} onClick={() => handleSubmit(false)}>
                                Submit
                            </button>
                            <button className="btn btn-secondary" style={{ flex: 1, minWidth: '150px' }} onClick={() => handleSubmit(true)}>
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
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div className="glass" style={{ padding: '1rem', borderRadius: '0.75rem' }}>
                                    <h4 style={{ margin: '0 0 0.5rem', opacity: 0.8 }}>Number → Word</h4>
                                    {(() => {
                                        const subset = responses.filter(r => r.question.category === 'major-image');
                                        const avg = subset.length ? subset.reduce((a, b) => a + b.duration, 0) / subset.length : 0;
                                        const acc = subset.length ? (subset.filter(r => r.isCorrect).length / subset.length) * 100 : 0;
                                        return (
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Avg: <b>{avg.toFixed(2)}s</b></span>
                                                <span>Acc: <b>{Math.round(acc)}%</b></span>
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div className="glass" style={{ padding: '1rem', borderRadius: '0.75rem' }}>
                                    <h4 style={{ margin: '0 0 0.5rem', opacity: 0.8 }}>Word → Number</h4>
                                    {(() => {
                                        const subset = responses.filter(r => r.question.category === 'major-reverse');
                                        const avg = subset.length ? subset.reduce((a, b) => a + b.duration, 0) / subset.length : 0;
                                        const acc = subset.length ? (subset.filter(r => r.isCorrect).length / subset.length) * 100 : 0;
                                        return (
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Avg: <b>{avg.toFixed(2)}s</b></span>
                                                <span>Acc: <b>{Math.round(acc)}%</b></span>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}

                        <div style={{ maxHeight: '320px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead style={{ position: 'sticky', top: 0, background: 'rgba(15,23,42,0.95)' }}>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>Prompt</th>
                                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>Your Answer</th>
                                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>Correct</th>
                                        <th style={{ textAlign: 'center', padding: '0.5rem' }}>Time (s)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {responses.map((resp, idx) => (
                                        <tr key={`${resp.question.id}-${idx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '0.5rem', fontWeight: 600 }}>{resp.question.prompt}</td>
                                            <td style={{ padding: '0.5rem', color: resp.isCorrect ? 'var(--success)' : 'var(--error)' }}>
                                                {resp.given || '—'}
                                            </td>
                                            <td style={{ padding: '0.5rem', opacity: 0.8 }}>{resp.question.answer}</td>
                                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>{resp.duration.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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

