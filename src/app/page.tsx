"use client";

import Header from '@/components/Header';
import AddWordForm from '@/components/AddWordForm';
import WordCard from '@/components/WordCard';
import { useWords } from '@/hooks/useWords';

export default function Home() {
  const { words, loading, addWord, deleteWord } = useWords();

  return (
    <>
      <Header />
      <main className="container">
        <AddWordForm onAdd={addWord} />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>Loading your vault...</div>
        ) : words.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', opacity: 0.6 }} className="glass-panel">
            <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Your vault is empty.</p>
            <p style={{ fontSize: '0.9rem' }}>Add your first word above to start remembering.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {words.map((word) => (
              <WordCard key={word.id} word={word} onDelete={deleteWord} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
