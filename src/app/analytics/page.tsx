"use client";

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import { getGameResults, GameResult } from '@/lib/firebase';
import Loader from '@/components/Loader';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, AreaChart, Area
} from 'recharts';

const GAME_CONFIG: Record<string, { label: string, color: string, unit: string }> = {
    'digit': { label: 'Digit Memory', color: '#3b82f6', unit: 'digits' },
    'word': { label: 'Word Memory', color: '#8b5cf6', unit: 'words' },
    'card-blitz': { label: 'Card Blitz', color: '#ef4444', unit: 'cards' },
    'names-gauntlet': { label: 'Names Gauntlet', color: '#10b981', unit: 'names' },
    'number-wall': { label: 'Number Wall', color: '#06b6d4', unit: 'digits' },
    'binary-surge': { label: 'Binary Surge', color: '#6366f1', unit: 'digits' },
    'spoken-numbers': { label: 'Spoken Numbers', color: '#f59e0b', unit: 'digits' },
    'abstract-matrix': { label: 'Abstract Matrix', color: '#ec4899', unit: 'cells' },
    'n-back': { label: 'N-Back', color: '#8b5cf6', unit: 'n-level' },
    'quick-math': { label: 'Quick Math', color: '#f97316', unit: 'problems' },
    'card-sequence': { label: 'Card Sequence', color: '#ef4444', unit: 'cards' },
    'names-international': { label: 'Intl. Names', color: '#10b981', unit: 'names' },
    'image-sequence': { label: 'Image Sequence', color: '#ec4899', unit: 'images' },
    // Defaults for others
    'default': { label: 'Training', color: '#94a3b8', unit: 'items' }
};

const getGameConfig = (type: string) => GAME_CONFIG[type] || { label: type.replace(/-/g, ' '), color: GAME_CONFIG['default'].color, unit: 'items' };

export default function Analytics() {
    const [results, setResults] = useState<GameResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGame, setSelectedGame] = useState<string>('word');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await getGameResults();
                setResults(data);
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch analytics:', error);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Get unique game types played
    const playedGameTypes = useMemo(() => {
        const types = new Set(results.map(r => r.type));
        return Array.from(types).sort();
    }, [results]);

    // Filter results based on selection
    const filteredResults = useMemo(() => {
        if (selectedGame === 'all') return results;
        return results.filter(r => r.type === selectedGame);
    }, [results, selectedGame]);

    // Calculate stats
    const stats = useMemo(() => {
        if (filteredResults.length === 0) return null;

        const totalGames = filteredResults.length;
        const avgScore = Math.round(filteredResults.reduce((acc, r) => acc + r.percentage, 0) / totalGames);
        const bestScore = Math.max(...filteredResults.map(r => r.percentage));

        // For difficulty/volume (count)
        const avgCount = Math.round(filteredResults.reduce((acc, r) => acc + r.count, 0) / totalGames * 10) / 10;
        const maxCount = Math.max(...filteredResults.map(r => r.count));

        // Number Wall & Word Memory Specifics
        let avgCorrect = 0;
        let avgRecall = 0;
        if (selectedGame === 'number-wall' || selectedGame === 'word') {
            avgCorrect = Math.round(filteredResults.reduce((acc, r) => acc + (r.correct || 0), 0) / totalGames);
            avgRecall = Math.round(filteredResults.reduce((acc, r) => acc + (r.recallPercentage || 0), 0) / totalGames);
        }

        return { totalGames, avgScore, bestScore, avgCount, maxCount, avgCorrect, avgRecall };
    }, [filteredResults, selectedGame]);

    // Prepare chart data
    const chartData = useMemo(() => {
        // Sort by timestamp ascending for charts
        const sorted = [...filteredResults].sort((a, b) => a.timestamp - b.timestamp);

        return sorted.map(r => ({
            date: new Date(r.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            fullDate: new Date(r.timestamp).toLocaleString(),
            percentage: r.percentage,
            count: r.count,
            type: r.type,
            config: getGameConfig(r.type),
            accuracy: r.accuracy || r.percentage,
            recall: r.recallPercentage || 0,
            correct: r.correct || 0,
            total: r.total || r.count
        }));
    }, [filteredResults]);

    // Frequency data for "All" view
    const frequencyData = useMemo(() => {
        if (selectedGame !== 'all') return [];

        const dayMap = new Map<string, any>();

        // Sort results by date
        const sorted = [...results].sort((a, b) => a.timestamp - b.timestamp);

        sorted.forEach(r => {
            const date = new Date(r.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            if (!dayMap.has(date)) {
                dayMap.set(date, { date });
            }
            const entry = dayMap.get(date);
            // Initialize type if needed
            if (!entry[r.type]) entry[r.type] = 0;
            entry[r.type]++;
        });

        return Array.from(dayMap.values());
    }, [results, selectedGame]);

    if (loading) {
        return (
            <>
                <Header />
                <main className="container" style={{ paddingTop: '4rem' }}>
                    <Loader />
                </main>
            </>
        );
    }

    return (
        <>
            <Header />
            <main className="container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h1 style={{ fontSize: '2rem', background: 'linear-gradient(to right, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                        Analytics
                    </h1>

                    <select
                        value={selectedGame}
                        onChange={(e) => setSelectedGame(e.target.value)}
                        className="input-field"
                        style={{ width: 'auto', minWidth: '200px' }}
                    >
                        <option value="all">All Games Overview</option>
                        {playedGameTypes.map(type => (
                            <option key={type} value={type}>
                                {getGameConfig(type).label}
                            </option>
                        ))}
                    </select>
                </div>

                {results.length === 0 ? (
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
                        <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No game data available yet.</p>
                        <p style={{ opacity: 0.7 }}>Play some games to start tracking your progress!</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* Stats Cards */}
                        {stats && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem' }}>Total Games</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalGames}</div>
                                </div>

                                {selectedGame === 'number-wall' || selectedGame === 'word' ? (
                                    <>
                                        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem' }}>Avg. Correct {selectedGame === 'word' ? 'Words' : 'Digits'}</div>
                                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                                {stats.avgCorrect}
                                            </div>
                                        </div>
                                        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem' }}>Avg. Accuracy</div>
                                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: stats.avgScore >= 90 ? 'var(--success)' : stats.avgScore >= 70 ? 'orange' : 'var(--error)' }}>
                                                {stats.avgScore}%
                                            </div>
                                        </div>
                                        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem' }}>Avg. Recall %</div>
                                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                                                {stats.avgRecall}%
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem' }}>Avg. Accuracy</div>
                                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: stats.avgScore >= 80 ? 'var(--success)' : stats.avgScore >= 50 ? 'orange' : 'var(--error)' }}>
                                                {stats.avgScore}%
                                            </div>
                                        </div>
                                        {selectedGame !== 'all' && (
                                            <>
                                                <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                                                    <div style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem' }}>Best Accuracy</div>
                                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>
                                                        {stats.bestScore}%
                                                    </div>
                                                </div>
                                                <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                                                    <div style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem' }}>Avg. {getGameConfig(selectedGame).unit}</div>
                                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                                                        {stats.avgCount}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Charts */}
                        {selectedGame === 'all' ? (
                            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                <h3 style={{ marginBottom: '1.5rem' }}>Activity Frequency</h3>
                                <div style={{ height: '350px', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={frequencyData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                            <XAxis dataKey="date" stroke="#94a3b8" />
                                            <YAxis stroke="#94a3b8" />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '0.5rem' }}
                                                itemStyle={{ color: '#e2e8f0' }}
                                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                            />
                                            <Legend />
                                            {playedGameTypes.map(type => (
                                                <Bar
                                                    key={type}
                                                    dataKey={type}
                                                    name={getGameConfig(type).label}
                                                    fill={getGameConfig(type).color}
                                                    stackId="a"
                                                />
                                            ))}
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                    <h3 style={{ marginBottom: '1.5rem' }}>Performance Trend (Accuracy)</h3>
                                    <div style={{ height: '300px', width: '100%' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData}>
                                                <defs>
                                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                <XAxis dataKey="date" stroke="#94a3b8" />
                                                <YAxis stroke="#94a3b8" domain={[0, 100]} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '0.5rem' }}
                                                    labelFormatter={(label, payload) => {
                                                        if (payload && payload.length > 0) return payload[0].payload.fullDate;
                                                        return label;
                                                    }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="percentage"
                                                    stroke="var(--success)"
                                                    fillOpacity={1}
                                                    fill="url(#colorScore)"
                                                    name="Accuracy %"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                    <h3 style={{ marginBottom: '1.5rem' }}>Difficulty Progression ({getGameConfig(selectedGame).unit})</h3>
                                    <div style={{ height: '300px', width: '100%' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                <XAxis dataKey="date" stroke="#94a3b8" />
                                                <YAxis stroke="#94a3b8" />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '0.5rem' }}
                                                    labelFormatter={(label, payload) => {
                                                        if (payload && payload.length > 0) return payload[0].payload.fullDate;
                                                        return label;
                                                    }}
                                                />
                                                <Line
                                                    type="stepAfter"
                                                    dataKey="count"
                                                    stroke="var(--accent)"
                                                    strokeWidth={2}
                                                    dot={{ r: 4 }}
                                                    name={`Count (${getGameConfig(selectedGame).unit})`}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Recent History List */}
                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1rem' }}>Recent Activity</h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                            <th style={{ textAlign: 'left', padding: '0.75rem', opacity: 0.7 }}>Date</th>
                                            <th style={{ textAlign: 'left', padding: '0.75rem', opacity: 0.7 }}>Game</th>
                                            <th style={{ textAlign: 'center', padding: '0.75rem', opacity: 0.7 }}>Score</th>
                                            <th style={{ textAlign: 'right', padding: '0.75rem', opacity: 0.7 }}>Difficulty</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredResults.slice().sort((a, b) => b.timestamp - a.timestamp).slice(0, 10).map((r, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '0.75rem' }}>{new Date(r.timestamp).toLocaleString()}</td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '0.2rem 0.5rem',
                                                        borderRadius: '0.25rem',
                                                        background: `${getGameConfig(r.type).color}33`,
                                                        color: getGameConfig(r.type).color,
                                                        fontSize: '0.8rem',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {getGameConfig(r.type).label}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold', color: r.percentage >= 80 ? 'var(--success)' : 'inherit' }}>
                                                    {(r.type === 'number-wall' || r.type === 'word') && r.accuracy !== undefined ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
                                                            <span>{r.correct}/{r.total}</span>
                                                            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{r.accuracy}% Acc</span>
                                                        </div>
                                                    ) : (
                                                        `${r.percentage}%`
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                    {r.count} {getGameConfig(r.type).unit}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                )}
            </main>
        </>
    );
}
