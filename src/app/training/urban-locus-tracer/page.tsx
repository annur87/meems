"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { saveLandmark, getLandmarks, deleteLandmark, type Landmark } from '@/lib/firebase';
import RealMap from '@/components/RealMap';

type GamePhase = 'add' | 'recall' | 'result';

interface RecallResult {
    landmarkId: string;
    correctName: string;
    selectedName: string;
    isCorrect: boolean;
}

// Hardcoded user ID for now (in production, use actual auth)
const USER_ID = 'default_user';

export default function UrbanLocusTracerPage() {
    
    // Game State
    const [phase, setPhase] = useState<GamePhase>('add');
    const [landmarks, setLandmarks] = useState<Landmark[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Map State
    const [cityCenter, setCityCenter] = useState<[number, number]>([23.8103, 90.4125]); // Dhaka
    const [cityZoom, setCityZoom] = useState(14);
    
    // Add Mode State
    const [newLandmarkName, setNewLandmarkName] = useState('');
    const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);
    
    // Recall Mode State
    const [recallQueue, setRecallQueue] = useState<Landmark[]>([]);
    const [currentLandmark, setCurrentLandmark] = useState<Landmark | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [recallResults, setRecallResults] = useState<RecallResult[]>([]);
    
    // Load landmarks on mount
    useEffect(() => {
        loadLandmarks();
    }, []);
    
    const loadLandmarks = async () => {
        setIsLoading(true);
        try {
            const data = await getLandmarks(USER_ID);
            setLandmarks(data);
        } catch (error) {
            console.error('Error loading landmarks:', error);
        }
        setIsLoading(false);
    };
    
    const handleMapClick = (lat: number, lng: number) => {
        if (phase === 'add') {
            setPendingLocation({ lat, lng });
        }
    };
    
    const handleSaveLandmark = async () => {
        if (!pendingLocation || !newLandmarkName.trim()) return;
        
        try {
            await saveLandmark(USER_ID, {
                name: newLandmarkName.trim(),
                lat: pendingLocation.lat,
                lng: pendingLocation.lng,
                createdAt: Date.now()
            });
            setNewLandmarkName('');
            setPendingLocation(null);
            await loadLandmarks();
        } catch (error) {
            console.error('Error saving landmark:', error);
        }
    };
    
    const handleDeleteLandmark = async (landmarkId: string) => {
        try {
            await deleteLandmark(USER_ID, landmarkId);
            await loadLandmarks();
        } catch (error) {
            console.error('Error deleting landmark:', error);
        }
    };
    
    const startRecall = () => {
        if (landmarks.length < 2) {
            alert('Add at least 2 landmarks before starting recall!');
            return;
        }
        
        // Shuffle landmarks
        const shuffled = [...landmarks].sort(() => Math.random() - 0.5);
        setRecallQueue(shuffled);
        setCurrentLandmark(shuffled[0]);
        setRecallResults([]);
        setSearchQuery('');
        setPhase('recall');
        
        // Center on first landmark
        setCityCenter([shuffled[0].lat, shuffled[0].lng]);
        setCityZoom(17); // Zoom in close
    };
    
    const handleSelectAnswer = (selectedLandmark: Landmark) => {
        if (!currentLandmark) return;
        
        const isCorrect = selectedLandmark.id === currentLandmark.id;
        const newResult: RecallResult = {
            landmarkId: currentLandmark.id,
            correctName: currentLandmark.name,
            selectedName: selectedLandmark.name,
            isCorrect
        };
        
        const newResults = [...recallResults, newResult];
        setRecallResults(newResults);
        
        // Move to next
        const remaining = recallQueue.slice(1);
        if (remaining.length > 0) {
            setCurrentLandmark(remaining[0]);
            setRecallQueue(remaining);
            setSearchQuery('');
            setCityCenter([remaining[0].lat, remaining[0].lng]);
        } else {
            setPhase('result');
        }
    };
    
    const resetGame = () => {
        setPhase('add');
        setRecallResults([]);
        setSearchQuery('');
        setCityCenter([23.8103, 90.4125]);
        setCityZoom(14);
    };
    
    const filteredLandmarks = landmarks.filter(l => 
        l.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return (
        <div className="container" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>🗺️ Urban Locus Tracer</h1>
                <Link href="/training" className="btn btn-secondary">← Back</Link>
            </div>
            
            {/* Phase Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button 
                    className={`btn ${phase === 'add' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPhase('add')}
                    disabled={phase === 'recall'}
                >
                    Add Landmarks ({landmarks.length})
                </button>
                <button 
                    className={`btn ${phase === 'recall' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={startRecall}
                    disabled={phase === 'recall' || landmarks.length < 2}
                >
                    Start Recall
                </button>
            </div>
            
            {/* Main Content */}
            <div style={{ display: 'flex', gap: '1rem', height: '600px' }}>
                
                {/* Map Area */}
                <div style={{ flex: 1, position: 'relative' }}>
                    <RealMap 
                        center={cityCenter}
                        zoom={cityZoom}
                        markers={
                            phase === 'add' 
                                ? [
                                    ...landmarks.map(l => ({
                                        id: l.id,
                                        lat: l.lat,
                                        lng: l.lng,
                                        title: l.name,
                                        color: '#3b82f6',
                                        popup: l.name
                                    })),
                                    ...(pendingLocation ? [{
                                        id: 'pending',
                                        lat: pendingLocation.lat,
                                        lng: pendingLocation.lng,
                                        title: 'New Location',
                                        color: '#f59e0b',
                                        popup: 'Click to place'
                                    }] : [])
                                ]
                                : phase === 'recall' && currentLandmark
                                    ? [{
                                        id: currentLandmark.id,
                                        lat: currentLandmark.lat,
                                        lng: currentLandmark.lng,
                                        title: '???',
                                        color: '#ef4444',
                                        popup: undefined
                                    }]
                                    : []
                        }
                        onMapClick={handleMapClick}
                        onMarkerClick={() => {}}
                    />
                    
                    {phase === 'add' && pendingLocation && (
                        <div className="glass card" style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', padding: '1rem', zIndex: 1000 }}>
                            <input 
                                type="text"
                                placeholder="Enter landmark name..."
                                value={newLandmarkName}
                                onChange={(e) => setNewLandmarkName(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSaveLandmark()}
                                style={{ marginBottom: '0.5rem', width: '250px' }}
                                autoFocus
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-primary" onClick={handleSaveLandmark} disabled={!newLandmarkName.trim()}>
                                    Save
                                </button>
                                <button className="btn btn-secondary" onClick={() => setPendingLocation(null)}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {phase === 'recall' && currentLandmark && (
                        <div className="glass card" style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', padding: '1rem', zIndex: 1000, textAlign: 'center' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                What is this location?
                            </div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '0.5rem' }}>
                                {recallResults.length + 1} / {recallQueue.length + recallResults.length}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Right Panel */}
                <div className="glass card" style={{ width: '350px', padding: '1.5rem', overflowY: 'auto' }}>
                    {phase === 'add' && (
                        <>
                            <h3 style={{ marginBottom: '1rem' }}>Your Landmarks</h3>
                            <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '1rem' }}>
                                Click anywhere on the map to add a new landmark.
                            </p>
                            
                            {landmarks.length === 0 ? (
                                <div style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>
                                    No landmarks yet. Click the map to add one!
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {landmarks.map(landmark => (
                                        <div key={landmark.id} className="glass" style={{ padding: '0.75rem', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{landmark.name}</div>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                                                    {landmark.lat.toFixed(4)}, {landmark.lng.toFixed(4)}
                                                </div>
                                            </div>
                                            <button 
                                                className="btn btn-secondary" 
                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                                onClick={() => handleDeleteLandmark(landmark.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                    
                    {phase === 'recall' && (
                        <>
                            <h3 style={{ marginBottom: '1rem' }}>Select Location</h3>
                            <input 
                                type="text"
                                placeholder="Search landmarks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ marginBottom: '1rem', width: '100%' }}
                            />
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {filteredLandmarks.map(landmark => (
                                    <button
                                        key={landmark.id}
                                        className="glass"
                                        style={{ 
                                            padding: '0.75rem', 
                                            borderRadius: '0.5rem', 
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            border: 'none',
                                            background: 'rgba(255,255,255,0.05)',
                                            transition: 'all 0.2s'
                                        }}
                                        onClick={() => handleSelectAnswer(landmark)}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    >
                                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{landmark.name}</div>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                    
                    {phase === 'result' && (
                        <>
                            <h3 style={{ marginBottom: '1rem' }}>Results</h3>
                            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>
                                    {Math.round((recallResults.filter(r => r.isCorrect).length / recallResults.length) * 100)}%
                                </div>
                                <div style={{ opacity: 0.7 }}>
                                    {recallResults.filter(r => r.isCorrect).length} / {recallResults.length} correct
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                                {recallResults.map((result, i) => (
                                    <div key={i} className="glass" style={{ padding: '0.75rem', borderRadius: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                            <span style={{ fontSize: '1.2rem' }}>{result.isCorrect ? '✅' : '❌'}</span>
                                            <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{result.correctName}</span>
                                        </div>
                                        {!result.isCorrect && (
                                            <div style={{ fontSize: '0.8rem', opacity: 0.6, marginLeft: '1.7rem' }}>
                                                You selected: {result.selectedName}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={resetGame}>
                                Back to Add Mode
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
