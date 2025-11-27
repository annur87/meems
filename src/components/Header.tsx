import Link from 'next/link';

type HeaderProps = {
    compact?: boolean;
};

const IconTraining = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6h16" />
        <path d="M4 18h16" />
        <path d="M6 6v12" />
        <path d="M18 6v12" />
        <path d="M6 12h12" />
    </svg>
);

const IconDigits = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a2 2 0 1 1 4 0v8" />
        <path d="M6 16h4" />
        <path d="M14 8h4l-4 8h4" />
    </svg>
);

const IconWords = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 6h10" />
        <path d="M5 12h14" />
        <path d="M5 18h8" />
    </svg>
);

const IconSequence = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <path d="M9 3v18" />
        <path d="M15 3v18" />
        <path d="M3 9h18" />
        <path d="M3 15h18" />
    </svg>
);

const IconAnalytics = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 19V9" />
        <path d="M12 19V5" />
        <path d="M19 19v-7" />
    </svg>
);

const navLinks = [
    { href: '/training', label: 'Training', icon: <IconTraining /> },
    { href: '/digits', label: 'Digits', icon: <IconDigits /> },
    { href: '/words', label: 'Words', icon: <IconWords /> },
    { href: '/training/card-sequence', label: 'Sequence', icon: <IconSequence /> },
    { href: '/analytics', label: 'Analytics', icon: <IconAnalytics /> },
];

export default function Header({ compact = false }: HeaderProps = {}) {
    return (
        <div className="sticky-nav">
            <div className="sticky-nav__container">
                {navLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        title={link.label}
                        aria-label={link.label}
                        prefetch={false}
                        className="sticky-nav__item"
                    >
                        <span className="sticky-nav__icon">{link.icon}</span>
                        <span className="sticky-nav__label">{link.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
