"use client";

import { useState, useEffect } from 'react';
import { Word } from '@/types';

const STORAGE_KEY = 'wordvault_words';

export function useWords() {
    const [words, setWords] = useState<Word[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setWords(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse words", e);
            }
        }
        setLoading(false);
    }, []);

    const saveWords = (newWords: Word[]) => {
        setWords(newWords);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newWords));
    };

    const addWord = (term: string, definition: string, example?: string) => {
        const newWord: Word = {
            id: crypto.randomUUID(),
            term,
            definition,
            example,
            createdAt: Date.now(),
        };
        saveWords([newWord, ...words]);
    };

    const deleteWord = (id: string) => {
        saveWords(words.filter(w => w.id !== id));
    };

    return { words, loading, addWord, deleteWord };
}
