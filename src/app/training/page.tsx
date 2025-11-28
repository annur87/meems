"use client";

import { useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { bootstrapDigitPaoSystem, bootstrapCardPaoSystem } from '@/lib/firebase';
import { digitPaoList } from '@/data/digit-pao';
import { cardPaoList } from '@/data/card-pao';

const games = [
    {
        id: 'number-wall',
        title: 'The Number Wall',
        description: 'Test capacity and speed in encoding long sequences of abstract digits.',
        week: 'Week 1 Focus',
        href: '/training/number-wall',
        color: 'from-blue-500 to-cyan-500' // Placeholder for gradient logic
    },
    {
        id: 'card-blitz',
        title: 'Card Conversion Blitz',
        description: 'Train instant, reflexive conversion of playing cards into mnemonic images.',
        week: 'Week 2 Focus',
        href: '/training/card-blitz',
        color: 'from-red-500 to-orange-500'
    },
    {
        id: 'names-gauntlet',
        title: 'The Names Gauntlet',
        description: 'Practice associating arbitrary names with distinct facial features.',
        week: 'Week 3 Focus',
        href: '/training/names-gauntlet',
        color: 'from-green-500 to-emerald-500'
    },
    {
        id: 'binary-surge',
        title: 'Binary Code Surge',
        description: 'High-intensity conversion of non-decimal data (0s and 1s).',
        week: 'Week 4 Focus',
        href: '/training/binary-surge',
        color: 'from-purple-500 to-pink-500'
    },
    {
        id: 'spoken-numbers',
        title: 'Spoken Number Terror',
        description: 'Ultimate test of concentration with sequentially presented auditory digits.',
        week: 'Week 5 Focus',
        href: '/training/spoken-numbers',
        color: 'from-yellow-500 to-amber-500'
    },
    {
        id: 'decathlon',
        title: 'Decathlon Simulation',
        description: 'Test mental stamina with a sequential simulation of multiple disciplines.',
        week: 'Week 6 Focus',
        href: '/training/decathlon',
        color: 'from-slate-500 to-gray-500'
    },
    {
        id: 'abstract-matrix',
        title: 'The Abstract Matrix',
        description: 'Visual-spatial overload: Link abstract patterns to coordinates and numbers.',
        week: 'Week 7 - Extreme',
        href: '/training/abstract-matrix',
        color: 'from-cyan-500 to-teal-500'
    },
    {
        id: 'multilingual-list',
        title: 'The Multilingual List',
        description: 'Phonetic bridge training with foreign language vocabulary.',
        week: 'Week 8 - Extreme',
        href: '/training/multilingual-list',
        color: 'from-orange-500 to-red-500'
    },
    {
        id: 'word-palace',
        title: 'Word-Palace Builder',
        description: 'Practice the Phonetic Link or Visual Conversion technique for words.',
        week: 'Supplementary',
        href: '/training/word-palace',
        color: 'from-indigo-500 to-violet-500'
    },
    {
        id: 'image-vault',
        title: 'The Image Vault',
        description: 'Manage and drill your mnemonic systems (Major, PAO, Palaces).',
        week: 'Foundational',
        href: '/training/image-vault',
        color: 'from-rose-500 to-pink-500'
    },
    {
        id: 'instant-visualization',
        title: 'Instant Visualization Test',
        description: 'Explosive image creation speed drill for digits and words.',
        week: 'Foundational Drill',
        href: '/training/instant-visualization',
        color: 'from-teal-500 to-cyan-500'
    },
    {
        id: 'sensory-walkthrough',
        title: 'The Sensory Walkthrough',
        description: 'Force deeper palace immersion with guided sensory prompts.',
        week: 'Foundational Drill',
        href: '/training/sensory-walkthrough',
        color: 'from-emerald-500 to-green-500'
    },
    {
        id: 'system-checker',
        title: 'System Component Checker',
        description: 'Rapid-fire integrity test for Major and PAO mappings.',
        week: 'Foundational Drill',
        href: '/training/system-component-checker',
        color: 'from-slate-500 to-slate-700'
    },
    {
        id: 'names-international',
        title: 'International Names',
        description: 'Memorize names and faces from diverse international backgrounds.',
        week: 'Week 3 Focus',
        href: '/training/names-international',
        color: 'from-green-600 to-teal-600'
    },
    {
        id: 'image-sequence',
        title: 'Image Sequence',
        description: 'Rapid-fire visual memory test with high-speed image presentation.',
        week: 'Week 4 Focus',
        href: '/training/image-sequence',
        color: 'from-pink-500 to-rose-500'
    },
    {
        id: 'n-back',
        title: 'N-Back Challenge',
        description: 'Classic working memory training. Match current position with N steps back.',
        week: 'Cognitive Drill',
        href: '/training/n-back',
        color: 'from-violet-500 to-purple-500'
    },
    {
        id: 'quick-math',
        title: 'Quick Math',
        description: 'High-speed arithmetic drills to improve mental calculation speed.',
        week: 'Cognitive Drill',
        href: '/training/quick-math',
        color: 'from-yellow-500 to-orange-500'
    },
    {
        id: 'philosophical-attribution',
        title: 'Philosophical Attribution',
        description: 'Memorize quotes verbatim and nail the speaker + source on demand.',
        week: 'Foundational Drill',
        href: '/training/philosophical-attribution',
        color: 'from-lime-500 to-emerald-500'
    },
    {
        id: 'focus-shifter',
        title: 'Focus Shifter',
        description: 'Rapidly switch between processing numbers and visual-spatial information.',
        week: 'Concentration Drill',
        href: '/training/focus-shifter',
        color: 'from-fuchsia-500 to-purple-500'
    },
    {
        id: 'urban-locus-tracer',
        title: 'Urban Locus Tracer',
        description: 'Build and test your memory palace using real-world map locations.',
        week: 'Spatial Memory',
        href: '/training/urban-locus-tracer',
        color: 'from-blue-500 to-indigo-500'
    },
    {
        id: 'visualization-latency',
        title: 'Visualization Latency',
        description: 'Measure and improve your image creation speed with precision timing.',
        week: 'Speed Drill',
        href: '/training/visualization-latency',
        color: 'from-red-500 to-pink-500'
    },
    {
        id: 'card-sequence',
        title: 'Card Sequence Memory',
        description: 'Memorize sequences of playing cards with speed and accuracy.',
        week: 'Week 2 Focus',
        href: '/training/card-sequence',
        color: 'from-amber-500 to-yellow-500'
    },
    {
        id: 'chain-reaction',
        title: 'Chain Reaction Latency',
        description: 'Measure transition speed between consecutive mnemonic images in a chain.',
        week: 'System Fluidity',
        href: '/training/chain-reaction',
        color: 'from-cyan-500 to-blue-500'
    }
];

export default function TrainingHub() {
    useEffect(() => {
        // Bootstrap Digit PAO system if needed
        const initDigitPao = async () => {
            const paoEntries = digitPaoList.map(p => ({
                id: p.number,
                ...p
            }));
            await bootstrapDigitPaoSystem(paoEntries);
        };
        
        const initCardPao = async () => {
            const paoEntries = cardPaoList.map(p => ({
                id: p.card,
                ...p
            }));
            await bootstrapCardPaoSystem(paoEntries);
        };

        initDigitPao();
        initCardPao();
    }, []);

    return (
        <>
            <Header />
            <main className="container" style={{ maxWidth: '1000px' }}>
                <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Memory Athlete Training
                    </h1>
                    <p style={{ color: '#94a3b8', maxWidth: '600px', margin: '0 auto' }}>
                        Master the core disciplines of competitive memory sports with this 6-Week Boot Camp plan.
                    </p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '1.5rem',
                    paddingBottom: '2rem'
                }}>
                    {games.map((game) => (
                        <Link href={game.href} key={game.id} style={{ display: 'block' }}>
                            <div className="glass card" style={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                cursor: 'pointer'
                            }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{
                                    fontSize: '0.75rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    marginBottom: '0.5rem',
                                    color: 'var(--primary)',
                                    fontWeight: 'bold'
                                }}>
                                    {game.week}
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                                    {game.title}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5', flex: 1 }}>
                                    {game.description}
                                </p>
                                <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', color: 'var(--accent)', fontSize: '0.9rem', fontWeight: '600' }}>
                                    Start Training <span style={{ marginLeft: '0.5rem' }}>→</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>
        </>
    );
}
