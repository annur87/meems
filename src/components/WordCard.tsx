import { Word } from '@/types';

interface WordCardProps {
    word: Word;
    onDelete: (id: string) => void;
}

export default function WordCard({ word, onDelete }: WordCardProps) {
    return (
        <div className="glass-panel card animate-fade-in" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>{word.term}</h3>
                <button
                    onClick={() => onDelete(word.id)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', opacity: 0.6, fontSize: '1.2rem' }}
                    aria-label="Delete word"
                >
                    &times;
                </button>
            </div>
            <p style={{ fontSize: '1rem', marginBottom: '0.5rem', lineHeight: '1.5' }}>{word.definition}</p>
            {word.example && (
                <p style={{ fontSize: '0.9rem', color: '#94a3b8', fontStyle: 'italic' }}>"{word.example}"</p>
            )}
        </div>
    );
}
