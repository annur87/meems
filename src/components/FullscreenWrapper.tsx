"use client";

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface FullscreenWrapperProps {
    children: ReactNode;
    enabled: boolean; // Only enable fullscreen when game is active (not in setup/result)
    onExit?: () => void; // Optional callback when exiting fullscreen
}

export default function FullscreenWrapper({ children, enabled, onExit }: FullscreenWrapperProps) {
    const router = useRouter();
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Enter fullscreen when enabled
    useEffect(() => {
        if (enabled && !isFullscreen) {
            enterFullscreen();
        } else if (!enabled && isFullscreen) {
            exitFullscreen();
        }
    }, [enabled]);

    // Listen for fullscreen changes (user pressing ESC)
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isCurrentlyFullscreen = !!document.fullscreenElement;
            setIsFullscreen(isCurrentlyFullscreen);

            if (!isCurrentlyFullscreen && enabled && onExit) {
                onExit();
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [enabled, onExit]);

    const enterFullscreen = async () => {
        try {
            await document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } catch (err) {
            console.error('Error entering fullscreen:', err);
        }
    };

    const exitFullscreen = async () => {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            }
            setIsFullscreen(false);
        } catch (err) {
            console.error('Error exiting fullscreen:', err);
        }
    };

    const handleExitClick = async () => {
        await exitFullscreen();
        if (onExit) {
            onExit();
        }
    };

    return (
        <div style={{
            position: isFullscreen ? 'fixed' : 'relative',
            top: 0,
            left: 0,
            width: '100%',
            height: isFullscreen ? '100vh' : 'auto',
            background: isFullscreen ? 'var(--background)' : 'transparent',
            zIndex: isFullscreen ? 9999 : 'auto',
            overflow: isFullscreen ? 'auto' : 'visible'
        }}>
            {/* Exit Button - Only show in fullscreen */}
            {isFullscreen && (
                <button
                    onClick={handleExitClick}
                    style={{
                        position: 'fixed',
                        top: '1rem',
                        right: '1rem',
                        background: 'rgba(239, 68, 68, 0.9)',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        color: 'white',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        zIndex: 10000,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(220, 38, 38, 1)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)';
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    <span style={{ fontSize: '1.2rem' }}>✕</span>
                    <span>Exit Fullscreen</span>
                </button>
            )}

            {/* Content */}
            <div style={{
                padding: isFullscreen ? '2rem' : '0',
                maxWidth: isFullscreen ? '1400px' : '100%',
                margin: isFullscreen ? '0 auto' : '0',
                height: '100%'
            }}>
                {children}
            </div>
        </div>
    );
}
