import Link from 'next/link';

export default function Header() {
    return (
        <header className="glass" style={{ position: 'sticky', top: 0, zIndex: 50, padding: '1rem', marginBottom: '2rem' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link href="/" prefetch={false} style={{ fontSize: '1.5rem', fontWeight: 'bold', background: 'linear-gradient(to right, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    WordVault
                </Link>
                <nav style={{ display: 'flex', gap: '1rem' }}>
                    <Link href="/" prefetch={false} style={{ fontSize: '0.9rem', opacity: 0.8 }}>List</Link>
                    <Link href="/practice" prefetch={false} style={{ fontSize: '0.9rem', opacity: 0.8 }}>Practice</Link>
                    <Link href="/training" prefetch={false} style={{ fontSize: '0.9rem', opacity: 0.8 }}>Training</Link>
                    <Link href="/digits" prefetch={false} style={{ fontSize: '0.9rem', opacity: 0.8 }}>Digits</Link>
                    <Link href="/words" prefetch={false} style={{ fontSize: '0.9rem', opacity: 0.8 }}>Words</Link>
                    <Link href="/analytics" prefetch={false} style={{ fontSize: '0.9rem', opacity: 0.8 }}>Analytics</Link>
                </nav>
            </div>
        </header>
    );
}
