"use client";

import { useState } from 'react';

interface AddWordFormProps {
    onAdd: (term: string, definition: string, example?: string) => void;
}

export default function AddWordForm({ onAdd }: AddWordFormProps) {
    const [term, setTerm] = useState('');
    const [definition, setDefinition] = useState('');
    const [example, setExample] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!term.trim() || !definition.trim()) return;
        onAdd(term, definition, example);
        setTerm('');
        setDefinition('');
        setExample('');
        setIsExpanded(false);
    };

    if (!isExpanded) {
        return (
            <button
                className="btn btn-primary"
                style={{ width: '100%', marginBottom: '2rem' }}
                onClick={() => setIsExpanded(true)}
            >
                + Add New Word
            </button>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="glass card animate-fade-in" style={{ marginBottom: '2rem' }}>
            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>Word</label>
                <input
                    className="input-field"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="e.g. Serendipity"
                    autoFocus
                    required
                />
            </div>
            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>Definition</label>
                <textarea
                    className="input-field"
                    value={definition}
                    onChange={(e) => setDefinition(e.target.value)}
                    placeholder="The occurrence of events by chance in a happy or beneficial way."
                    rows={3}
                    required
                    style={{ resize: 'vertical' }}
                />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>Example (Optional)</label>
                <input
                    className="input-field"
                    value={example}
                    onChange={(e) => setExample(e.target.value)}
                    placeholder="Use it in a sentence..."
                />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Word</button>
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsExpanded(false)}
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
