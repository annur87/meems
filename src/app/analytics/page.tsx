"use client";

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import { getGameResults, GameResult } from '@/lib/firebase';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';

export default function Analytics() {
    const [results, setResults] = useState<GameResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<'all' | 'digit' | 'word' | 'card' | 'names'>('all');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await getGameResults();
                setResults(data);
            } catch (error) {
                console.error('Failed to fetch analytics:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <>
                <Header />
                <main className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
                    Loading analytics...
                </main>
            </>
        );
    }

    // Process data for charts with memoization
    const frequencyData = useMemo(() => {
        const gamesPerDayMap = new Map<string, { date: string, digit: number, word: number, card: number, names: number }>();
        results.forEach(r => {
            const date = r.date;
            if (!gamesPerDayMap.has(date)) {
                gamesPerDayMap.set(date, { date, digit: 0, word: 0, card: 0, names: 0 });
            }
            const entry = gamesPerDayMap.get(date)!;
            if (r.type === 'digit' || r.type === 'number-wall' || r.type === 'binary-surge' || r.type === 'spoken-numbers') entry.digit++;
            else if (r.type === 'card-blitz') entry.card++;
            else if (r.type === 'names-gauntlet') entry.names++;
            else entry.word++;
        });
        return Array.from(gamesPerDayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    }, [results]);

    const filteredResults = useMemo(() => {
        return results.filter(r => {
            if (filterType === 'all') return true;
            if (filterType === 'digit') return r.type === 'digit' || r.type === 'number-wall' || r.type === 'binary-surge' || r.type === 'spoken-numbers';
            if (filterType === 'card') return r.type === 'card-blitz';
            if (filterType === 'names') return r.type === 'names-gauntlet';
            return r.type === 'word';
        });
    }, [results, filterType]);

    const performanceData = useMemo(() => {
        return filteredResults.map(r => ({
            date: new Date(r.timestamp).toLocaleDateString(),
            timestamp: r.timestamp,
            percentage: r.percentage,
            type: r.type,
            label: `${(r.type === 'digit' || r.type === 'number-wall' || r.type === 'binary-surge' || r.type === 'spoken-numbers') ? 'Digits' : r.type === 'card-blitz' ? 'Cards' : r.type === 'names-gauntlet' ? 'Names' : 'Words'} (${r.count})`
        })).sort((a, b) => a.timestamp - b.timestamp);
    }, [filteredResults]);

    return (
        <>
            <Header />
            <main className="container">
                <h1 style={{ fontSize: '2rem', marginBottom: '2rem', textAlign: 'center', background: 'linear-gradient(to right, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Analytics & Progression
                </h1>

                {results.length === 0 ? (
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
                        <p>No game data available yet. Play some games to see your stats!</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* Summary Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                                <h3 style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>Total Games</h3>
                                <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{results.length}</p>
                            </div>
                            <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                                <h3 style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>Digit Games</h3>
                                <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{results.filter(r => r.type === 'digit' || r.type === 'number-wall' || r.type === 'binary-surge' || r.type === 'spoken-numbers').length}</p>
                            </div>
                            <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                                <h3 style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>Word Games</h3>
                                <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{results.filter(r => r.type === 'word').length}</p>
                            </div>
                            <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                                <h3 style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>Card Games</h3>
                                <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{results.filter(r => r.type === 'card-blitz').length}</p>
                            </div>
                            <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                                <h3 style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>Name Games</h3>
                                <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{results.filter(r => r.type === 'names-gauntlet').length}</p>
                            </div>
                        </div>

                        {/* Frequency Chart */}
                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Activity Frequency</h3>
                            <div style={{ height: '300px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={frequencyData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="date" stroke="#94a3b8" />
                                        <YAxis stroke="#94a3b8" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '0.5rem' }}
                                            itemStyle={{ color: '#e2e8f0' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="digit" name="Digit Memory" fill="var(--primary)" stackId="a" />
                                        <Bar dataKey="word" name="Word Memory" fill="var(--accent)" stackId="a" />
                                        <Bar dataKey="card" name="Card Memory" fill="#ef4444" stackId="a" />
                                        <Bar dataKey="names" name="Names & Faces" fill="#10b981" stackId="a" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Performance Chart */}
                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3>Performance History</h3>
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value as any)}
                                    className="input-field"
                                    style={{ width: 'auto', padding: '0.3rem 1rem' }}
                                >
                                    <option value="all">All Games</option>
                                    <option value="digit">Digit Memory</option>
                                    <option value="word">Word Memory</option>
                                    <option value="card">Card Memory</option>
                                    <option value="names">Names & Faces</option>
                                </select>
                            </div>

                            <div style={{ height: '300px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={performanceData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="date" stroke="#94a3b8" />
                                        <YAxis stroke="#94a3b8" domain={[0, 100]} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '0.5rem' }}
                                            itemStyle={{ color: '#e2e8f0' }}
                                            labelFormatter={(label, payload) => {
                                                if (payload && payload.length > 0) {
                                                    return `${label} - ${payload[0].payload.label}`;
                                                }
                                                return label;
                                            }}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="percentage" name="Score %" stroke="var(--success)" strokeWidth={2} dot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>
                )}
            </main>
        </>
    );
}
