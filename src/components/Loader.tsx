import React from 'react';

export default function Loader() {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem',
            width: '100%',
            minHeight: '200px'
        }}>
            <div className="spinner"></div>
            <style jsx>{`
                .spinner {
                    width: 50px;
                    height: 50px;
                    border: 3px solid rgba(255, 255, 255, 0.1);
                    border-radius: 50%;
                    border-top-color: var(--primary);
                    border-left-color: var(--accent);
                    animation: spin 1s ease-in-out infinite;
                    box-shadow: 0 0 15px rgba(99, 102, 241, 0.3);
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
