"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { saveLandmark, getLandmarks, deleteLandmark, type Landmark } from '@/lib/firebase';
import RealMap from '@/components/RealMap';

type GamePhase = 'add' | 'recall' | 'result';

interface RecallResult {
    landmarkId: string;
    correctName: string;
    correctLat: number;
    correctLng: number;
    selectedLat: number;
    selectedLng: number;
    distanceError: number; // in meters
}

// Haversine formula to calculate distance between two lat/lng points in meters
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
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
    const [newLandmarkType, setNewLandmarkType] = useState('school');
    const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [drawnRectangles, setDrawnRectangles] = useState<any[]>([]);
    
    // Recall Mode State
    const [recallQueue, setRecallQueue] = useState<Landmark[]>([]);
    const [currentLandmark, setCurrentLandmark] = useState<Landmark | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [recallResults, setRecallResults] = useState<RecallResult[]>([]);
    const [pendingRecallClick, setPendingRecallClick] = useState(false);
    
    // Edit Mode State
    const [editingLandmark, setEditingLandmark] = useState<Landmark | null>(null);
    const [editName, setEditName] = useState('');
    const [editType, setEditType] = useState('');
    const [editLat, setEditLat] = useState('');
    const [editLng, setEditLng] = useState('');
    const [editMode, setEditMode] = useState<'map' | 'manual'>('map');
    const [pendingEditLocation, setPendingEditLocation] = useState<{ lat: number; lng: number } | null>(null);
    
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
        } else if (phase === 'recall' && pendingRecallClick && currentLandmark) {
            // Calculate distance
            const distance = calculateDistance(
                currentLandmark.lat,
                currentLandmark.lng,
                lat,
                lng
            );
            
            const newResult: RecallResult = {
                landmarkId: currentLandmark.id,
                correctName: currentLandmark.name,
                correctLat: currentLandmark.lat,
                correctLng: currentLandmark.lng,
                selectedLat: lat,
                selectedLng: lng,
                distanceError: distance
            };
            
            const newResults = [...recallResults, newResult];
            setRecallResults(newResults);
            setPendingRecallClick(false);
            
            // Move to next
            const remaining = recallQueue.slice(1);
            if (remaining.length > 0) {
                setCurrentLandmark(remaining[0]);
                setRecallQueue(remaining);
                setCityCenter([23.8103, 90.4125]); // Reset to Dhaka center
                setCityZoom(14);
            } else {
                setPhase('result');
            }
        } else if (editingLandmark && editMode === 'map') {
            setPendingEditLocation({ lat, lng });
        }
    };
    
    const handleSaveLandmark = async () => {
        if (!pendingLocation || !newLandmarkName.trim()) return;
        
        try {
            await saveLandmark(USER_ID, {
                name: newLandmarkName.trim(),
                type: newLandmarkType,
                lat: pendingLocation.lat,
                lng: pendingLocation.lng,
                createdAt: Date.now()
            });
            setNewLandmarkName('');
            setNewLandmarkType('school');
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
        setPendingRecallClick(true);
        setPhase('recall');
        
        // Reset to Dhaka center
        setCityCenter([23.8103, 90.4125]);
        setCityZoom(14);
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
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <h1 style={{ margin: 0 }}>🗺️ Urban Locus Tracer</h1>
                <Link href="/training" className="btn btn-secondary">← Back</Link>
            </div>
            
            {/* Phase Tabs */}
            <div style={{ padding: '1rem 2rem', display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
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
            <div style={{ display: 'flex', gap: 0, flex: 1, overflow: 'hidden' }}>
                
                {/* Map Area */}
                <div style={{ flex: 1, position: 'relative' }}>
                    <RealMap 
                        center={cityCenter}
                        zoom={cityZoom}
                        drawingMode={isDrawingMode && phase === 'add'}
                        drawnRectangles={drawnRectangles}
                        onRectangleDrawn={(rect) => setDrawnRectangles([...drawnRectangles, rect])}
                        onRectangleDeleted={(index) => setDrawnRectangles(drawnRectangles.filter((_, i) => i !== index))}
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
                        <div className="glass card" style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', padding: '1rem', zIndex: 1000, minWidth: '300px' }}>
                            <div style={{ marginBottom: '0.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', opacity: 0.7 }}>Type</label>
                                <select 
                                    value={newLandmarkType}
                                    onChange={(e) => setNewLandmarkType(e.target.value)}
                                    style={{ width: '100%', marginBottom: '0.5rem' }}
                                >
                                    <option value="school">School</option>
                                    <option value="university">University</option>
                                    <option value="hospital">Hospital</option>
                                    <option value="restaurant">Restaurant</option>
                                    <option value="shopping">Shopping Mall</option>
                                    <option value="park">Park</option>
                                    <option value="mosque">Mosque</option>
                                    <option value="government">Government Building</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <input 
                                type="text"
                                placeholder="Enter landmark name..."
                                value={newLandmarkName}
                                onChange={(e) => setNewLandmarkName(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSaveLandmark()}
                                style={{ marginBottom: '0.5rem', width: '100%' }}
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
                                {currentLandmark.type ? `What ${currentLandmark.type} is this?` : 'What is this location?'}
                            </div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '0.5rem' }}>
                                {recallResults.length + 1} / {recallQueue.length + recallResults.length}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Right Panel */}
                <div className="glass card" style={{ width: '280px', padding: '1.5rem', overflowY: 'auto', borderRadius: 0, borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                    {phase === 'add' && (
                        <>
                            <h3 style={{ marginBottom: '1rem' }}>Your Landmarks</h3>
                            <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem' }}>
                                Click anywhere on the map to add a new landmark.
                            </p>
                            <button 
                                className={`btn ${isDrawingMode ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ width: '100%', marginBottom: '1rem', fontSize: '0.85rem' }}
                                onClick={() => setIsDrawingMode(!isDrawingMode)}
                            >
                                {isDrawingMode ? '🟦 Drawing Mode ON' : '⬜ Drawing Mode OFF'}
                            </button>
                            
                            {landmarks.length === 0 ? (
                                <div style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>
                                    No landmarks yet. Click the map to add one!
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {landmarks.map(landmark => (
                                        <div key={landmark.id} className="glass" style={{ padding: '0.75rem', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{landmark.name}</div>
                                                <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                                                    {landmark.type} • {landmark.lat.toFixed(4)}, {landmark.lng.toFixed(4)}
                                                </div>
                                            </div>
                                            <button 
                                                className="btn btn-secondary" 
                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                                                onClick={() => handleDeleteLandmark(landmark.id)}
                                            >
                                                Del
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                    
                    {phase === 'recall' && (
                        <>
                            <h3 style={{ marginBottom: '1rem' }}>Instructions</h3>
                            <div className="glass" style={{ padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                                <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                    <strong>Click on the map</strong> where you think <strong>{currentLandmark?.name}</strong> is located.
                                </p>
                                <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                    Your accuracy will be measured in meters.
                                </p>
                            </div>
                            
                            <div style={{ fontSize: '0.9rem', opacity: 0.7, textAlign: 'center' }}>
                                Progress: {recallResults.length} / {recallQueue.length + recallResults.length}
                            </div>
                        </>
                    )}
                    
                    {phase === 'result' && (
                        <>
                            <h3 style={{ marginBottom: '1rem' }}>Results</h3>
                            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                                    {Math.round(recallResults.reduce((sum, r) => sum + r.distanceError, 0) / recallResults.length)}m
                                </div>
                                <div style={{ opacity: 0.7 }}>
                                    Average Error
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                                {recallResults.map((result, i) => (
                                    <div key={i} className="glass" style={{ padding: '0.75rem', borderRadius: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{result.correctName}</span>
                                            <span style={{ 
                                                fontSize: '0.9rem', 
                                                fontWeight: 'bold',
                                                color: result.distanceError < 100 ? '#22c55e' : result.distanceError < 500 ? '#f59e0b' : '#ef4444'
                                            }}>
                                                {Math.round(result.distanceError)}m
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                                            Actual: {result.correctLat.toFixed(4)}, {result.correctLng.toFixed(4)}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                                            Your guess: {result.selectedLat.toFixed(4)}, {result.selectedLng.toFixed(4)}
                                        </div>
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
