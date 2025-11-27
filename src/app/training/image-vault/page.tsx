"use client";

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import {
    MajorEntry,
    PaoEntry,
    Palace,
    saveImageVaultData,
    getImageVaultData
} from '@/lib/firebase';

type SystemType = 'major' | 'pao' | 'palace';

export default function ImageVault() {
    const [activeTab, setActiveTab] = useState<SystemType>('major');
    const [searchQuery, setSearchQuery] = useState('');
    const [syncing, setSyncing] = useState(false);
    const [lastSynced, setLastSynced] = useState<Date | null>(null);

    // Major System
    const [majorSystem, setMajorSystem] = useState<MajorEntry[]>([]);
    const [editingMajor, setEditingMajor] = useState<string | null>(null);
    const [newMajorNumber, setNewMajorNumber] = useState('');
    const [newMajorImage, setNewMajorImage] = useState('');

    // PAO System
    const [paoSystem, setPaoSystem] = useState<PaoEntry[]>([]);
    const [editingPao, setEditingPao] = useState<string | null>(null);
    const [newPaoCard, setNewPaoCard] = useState('');
    const [newPaoPerson, setNewPaoPerson] = useState('');
    const [newPaoAction, setNewPaoAction] = useState('');
    const [newPaoObject, setNewPaoObject] = useState('');

    // Memory Palaces
    const [palaces, setPalaces] = useState<Palace[]>([]);
    const [editingPalace, setEditingPalace] = useState<string | null>(null);
    const [newPalaceName, setNewPalaceName] = useState('');
    const [newLocation, setNewLocation] = useState('');

    // Load from Firebase on mount
    useEffect(() => {
        const loadData = async () => {
            const data = await getImageVaultData();

            if (data) {
                setMajorSystem(data.majorSystem || []);
                setPaoSystem(data.paoSystem || []);
                setPalaces(data.palaces || []);
                if (data.lastUpdated) {
                    setLastSynced(new Date(data.lastUpdated));
                }
            } else {
                // Initialize with sample data
                const sampleMajor: MajorEntry[] = [
                    { id: '1', number: '00', images: ['Sauce', 'Seas'] },
                    { id: '2', number: '01', images: ['Suit', 'Seed'] },
                    { id: '3', number: '02', images: ['Sun', 'Sane'] },
                    { id: '4', number: '10', images: ['Toes', 'Dice'] },
                    { id: '5', number: '11', images: ['Toad', 'Dad'] },
                    { id: '6', number: '20', images: ['Nose', 'Noose'] },
                ];
                setMajorSystem(sampleMajor);

                const samplePao: PaoEntry[] = [
                    { id: '1', card: 'AS', person: 'Albert Einstein', action: 'Calculating', object: 'Chalkboard' },
                    { id: '2', card: '2H', person: 'Harry Potter', action: 'Casting', object: 'Wand' },
                    { id: '3', card: 'KC', person: 'King Kong', action: 'Climbing', object: 'Building' },
                ];
                setPaoSystem(samplePao);

                const samplePalaces: Palace[] = [
                    { id: '1', name: 'Home Journey', locations: ['Front Door', 'Hallway', 'Living Room', 'Kitchen', 'Bedroom'] },
                    { id: '2', name: 'Office Route', locations: ['Parking Lot', 'Elevator', 'Reception', 'Desk', 'Conference Room'] },
                ];
                setPalaces(samplePalaces);
            }
        };

        loadData();
    }, []);

    // Save to Firebase with debounce
    const syncToFirebase = async (data: { majorSystem?: MajorEntry[], paoSystem?: PaoEntry[], palaces?: Palace[] }) => {
        setSyncing(true);
        const success = await saveImageVaultData(data);
        if (success) {
            setLastSynced(new Date());
        }
        setSyncing(false);
    };

    // Save to Firebase whenever data changes
    useEffect(() => {
        // Only sync if majorSystem has been initialized (e.g., not an empty array from initial state)
        // and if it's not the very first render before data is loaded.
        if (majorSystem.length > 0 || (majorSystem.length === 0 && lastSynced !== null)) {
            syncToFirebase({ majorSystem });
        }
    }, [majorSystem]);

    useEffect(() => {
        if (paoSystem.length > 0 || (paoSystem.length === 0 && lastSynced !== null)) {
            syncToFirebase({ paoSystem });
        }
    }, [paoSystem]);

    useEffect(() => {
        if (palaces.length > 0 || (palaces.length === 0 && lastSynced !== null)) {
            syncToFirebase({ palaces });
        }
    }, [palaces]);

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

    // PAO System Functions
    const addPaoEntry = () => {
        if (!newPaoCard || !newPaoPerson) return;

        const newEntry: PaoEntry = {
            id: Date.now().toString(),
            card: newPaoCard.toUpperCase(),
            person: newPaoPerson,
            action: newPaoAction,
            object: newPaoObject
        };

        setPaoSystem([...paoSystem, newEntry].sort((a, b) => a.card.localeCompare(b.card)));

        setNewPaoCard('');
        setNewPaoPerson('');
        setNewPaoAction('');
        setNewPaoObject('');
    };

    const updatePaoEntry = (id: string, field: keyof PaoEntry, value: string) => {
        setPaoSystem(paoSystem.map(e =>
            e.id === id ? { ...e, [field]: value } : e
        ));
    };

    const deletePaoEntry = (id: string) => {
        setPaoSystem(paoSystem.filter(e => e.id !== id));
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

    // Search/Filter Functions
    const filteredMajor = majorSystem.filter(e =>
        e.number.includes(searchQuery) ||
        e.images.some(img => img.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredPao = paoSystem.filter(e =>
        e.card.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.person.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.object.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredPalaces = palaces.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.locations.some(l => l.toLowerCase().includes(searchQuery.toLowerCase()))
    );

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
                            {syncing ? (
                                <div style={{ color: 'var(--accent)' }}>
                                    <span style={{ marginRight: '0.5rem' }}>●</span>
                                    Syncing...
                                </div>
                            ) : lastSynced ? (
                                <div style={{ color: 'var(--success)' }}>
                                    <span style={{ marginRight: '0.5rem' }}>✓</span>
                                    Synced {lastSynced.toLocaleTimeString()}
                                </div>
                            ) : (
                                <div style={{ opacity: 0.5 }}>
                                    Not synced
                                </div>
                            )}
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
                        onClick={() => { setActiveTab('pao'); setSearchQuery(''); }}
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
                        PAO System ({paoSystem.length})
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
                        {/* Add New Entry */}
                        <div className="glass card" style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Add Entry</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr auto', gap: '1rem', alignItems: 'end' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem', opacity: 0.7 }}>Number</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="00"
                                        value={newMajorNumber}
                                        onChange={(e) => setNewMajorNumber(e.target.value.replace(/\D/g, '').slice(0, 2))}
                                        maxLength={2}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem', opacity: 0.7 }}>Image</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Sauce"
                                        value={newMajorImage}
                                        onChange={(e) => setNewMajorImage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addMajorEntry()}
                                    />
                                </div>
                                <button className="btn btn-primary" onClick={addMajorEntry}>
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Entries List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {filteredMajor.length === 0 ? (
                                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
                                    {searchQuery ? 'No results found' : 'No entries yet. Add your first one above!'}
                                </div>
                            ) : (
                                filteredMajor.map((entry) => (
                                    <div key={entry.id} className="glass-panel" style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                                {entry.number}
                                            </div>
                                            <button
                                                onClick={() => deleteMajorEntry(entry.id)}
                                                style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.9rem' }}
                                            >
                                                Delete All
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {entry.images.map((image, idx) => (
                                                <div key={idx} style={{
                                                    background: 'rgba(99, 102, 241, 0.2)',
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '0.5rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem'
                                                }}>
                                                    <span>{image}</span>
                                                    <button
                                                        onClick={() => deleteMajorImage(entry.number, image)}
                                                        style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: '1' }}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* PAO System Tab */}
                {activeTab === 'pao' && (
                    <div className="animate-fade-in">
                        {/* Add New Entry */}
                        <div className="glass card" style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Add PAO Entry</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem', opacity: 0.7 }}>Card</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="AS"
                                        value={newPaoCard}
                                        onChange={(e) => setNewPaoCard(e.target.value.toUpperCase().slice(0, 2))}
                                        maxLength={2}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem', opacity: 0.7 }}>Person</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Albert Einstein"
                                        value={newPaoPerson}
                                        onChange={(e) => setNewPaoPerson(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem', opacity: 0.7 }}>Action</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Calculating"
                                        value={newPaoAction}
                                        onChange={(e) => setNewPaoAction(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem', opacity: 0.7 }}>Object</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Chalkboard"
                                        value={newPaoObject}
                                        onChange={(e) => setNewPaoObject(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addPaoEntry()}
                                    />
                                </div>
                                <button className="btn btn-primary" onClick={addPaoEntry}>
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Entries List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {filteredPao.length === 0 ? (
                                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
                                    {searchQuery ? 'No results found' : 'No PAO entries yet. Add your first one above!'}
                                </div>
                            ) : (
                                filteredPao.map((entry) => (
                                    <div key={entry.id} className="glass-panel" style={{ padding: '1rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr auto', gap: '1rem', alignItems: 'center' }}>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                                                {entry.card}
                                            </div>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={entry.person}
                                                onChange={(e) => updatePaoEntry(entry.id, 'person', e.target.value)}
                                                style={{ padding: '0.5rem' }}
                                            />
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={entry.action}
                                                onChange={(e) => updatePaoEntry(entry.id, 'action', e.target.value)}
                                                style={{ padding: '0.5rem' }}
                                            />
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={entry.object}
                                                onChange={(e) => updatePaoEntry(entry.id, 'object', e.target.value)}
                                                style={{ padding: '0.5rem' }}
                                            />
                                            <button
                                                onClick={() => deletePaoEntry(entry.id)}
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
                                            {palace.locations.map((location, idx) => (
                                                <div key={idx} style={{
                                                    padding: '0.75rem',
                                                    background: 'rgba(0,0,0,0.2)',
                                                    borderRadius: '0.5rem',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                                        <span style={{ opacity: 0.5, minWidth: '30px' }}>{idx + 1}.</span>
                                                        <span style={{ flex: 1 }}>{location}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button
                                                            onClick={() => moveLocation(palace.id, idx, 'up')}
                                                            disabled={idx === 0}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                color: idx === 0 ? 'rgba(255,255,255,0.2)' : 'var(--primary)',
                                                                cursor: idx === 0 ? 'not-allowed' : 'pointer',
                                                                fontSize: '1.2rem'
                                                            }}
                                                        >
                                                            ↑
                                                        </button>
                                                        <button
                                                            onClick={() => moveLocation(palace.id, idx, 'down')}
                                                            disabled={idx === palace.locations.length - 1}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                color: idx === palace.locations.length - 1 ? 'rgba(255,255,255,0.2)' : 'var(--primary)',
                                                                cursor: idx === palace.locations.length - 1 ? 'not-allowed' : 'pointer',
                                                                fontSize: '1.2rem'
                                                            }}
                                                        >
                                                            ↓
                                                        </button>
                                                        <button
                                                            onClick={() => deleteLocation(palace.id, location)}
                                                            style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '1.2rem' }}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
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
