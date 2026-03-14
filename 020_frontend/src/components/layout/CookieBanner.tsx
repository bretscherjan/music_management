import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { storage } from '@/lib/storage';

const STORAGE_KEY = 'cookie-consent';

// Resets on hard page reload, but persists during SPA navigation.
// Prevents the banner from reappearing on every tab-focus-switch after declining.
let dismissedInSession = false;

// ── CSS-Cookie-Monster ─────────────────────────────────────────────────────
function CookieMonster({ eating }: { eating: boolean }) {
    return (
        <div className="relative w-11 h-11 shrink-0">
            {/* Grüner runder Kopf */}
            <div className="w-11 h-11 rounded-full bg-success/50 relative overflow-hidden shadow-md">
                {/* Linkes Auge */}
                <div className="absolute top-1 left-1.5 w-4 h-4 rounded-full bg-white shadow-sm">
                    <div className="absolute inset-0.5 rounded-full bg-slate-900">
                        <div className="absolute top-0.5 left-0.5 w-1 h-1 rounded-full bg-white" />
                    </div>
                </div>
                {/* Rechtes Auge */}
                <div className="absolute top-1 right-1.5 w-4 h-4 rounded-full bg-white shadow-sm">
                    <div className="absolute inset-0.5 rounded-full bg-slate-900">
                        <div className="absolute top-0.5 left-0.5 w-1 h-1 rounded-full bg-white" />
                    </div>
                </div>
                {/* Mund */}
                <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 bg-red-500 transition-all duration-150"
                    style={{ height: eating ? '20px' : '9px', borderRadius: '0 0 40px 40px' }}
                >
                    <div className="flex justify-around px-0.5 pt-0.5">
                        <div className="w-1.5 h-2 bg-white rounded-b" />
                        <div className="w-1.5 h-2 bg-white rounded-b" />
                        <div className="w-1.5 h-2 bg-white rounded-b" />
                    </div>
                </div>
            </div>
            {/* Guetzli neben dem Mund – verschwindet beim Fressen */}
            <span
                className="absolute -right-1.5 bottom-1 text-base transition-all duration-200 select-none"
                style={{ opacity: eating ? 0 : 1, transform: eating ? 'scale(0) rotate(45deg)' : 'scale(1)' }}
            >🍪</span>
        </div>
    );
}

// ── Krümel-Partikel ────────────────────────────────────────────────────────
const CRUMBS = [
    { left: '15%', delay: '0ms',   size: '1rem'   },
    { left: '30%', delay: '80ms',  size: '0.8rem' },
    { left: '48%', delay: '40ms',  size: '1.1rem' },
    { left: '62%', delay: '120ms', size: '0.75rem' },
    { left: '78%', delay: '60ms',  size: '0.9rem' },
    { left: '90%', delay: '100ms', size: '0.7rem' },
];

export function CookieBanner() {
    const [visible, setVisible] = useState(false);
    const [eating, setEating]   = useState(false);
    const [crumbs, setCrumbs]   = useState(false);

    useEffect(() => {
        const check = () => {
            // Only show if not already dismissed in this JS session (prevents
            // popping up on every window-focus after declining) AND not accepted.
            if (!dismissedInSession && storage.getItem(STORAGE_KEY) !== 'accepted') {
                setVisible(true);
            }
        };

        check(); // initial check on mount

        // Fires when localStorage changes in another tab/window
        window.addEventListener('storage', check);
        // Fires when user returns to the tab after DevTools interactions
        window.addEventListener('focus', check);

        return () => {
            window.removeEventListener('storage', check);
            window.removeEventListener('focus', check);
        };
    }, []);

    if (!visible) return null;

    // Guetzli Ässe → kein Fressen, sofort schliessen + dauerhaft speichern
    const accept = () => {
        storage.setItem(STORAGE_KEY, 'accepted');
        dismissedInSession = true;
        setVisible(false);
    };

    // Guetzli am Krümelmonster geh → Monster frisst, dann schliessen (kein localStorage)
    const decline = () => {
        dismissedInSession = true; // nicht nochmals zeigen bis Hard-Reload
        setEating(true);
        setCrumbs(true);
        setTimeout(() => setVisible(false), 1100);
    };

    return (
        <>
            <style>{`
                @keyframes cm-idle {
                    0%, 100% { transform: rotate(-4deg) translateY(0); }
                    50%       { transform: rotate(4deg)  translateY(-2px); }
                }
                @keyframes cm-munch {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50%       { transform: translateY(-4px) scale(1.08); }
                }
                @keyframes crumb-fly {
                    0%   { transform: translateY(0)     rotate(0deg)   scale(1);   opacity: 1; }
                    100% { transform: translateY(-55px) rotate(390deg) scale(0.2); opacity: 0; }
                }
                .cm-idle  { animation: cm-idle  2.4s ease-in-out infinite; }
                .cm-munch { animation: cm-munch 0.18s ease-in-out infinite; }
                .crumb-particle { animation: crumb-fly 1s ease-out forwards; }
            `}</style>

            <div className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-t border-slate-200 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
                {/* Fliegende Krümel wenn Monster frisst */}
                {crumbs && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {CRUMBS.map((c, i) => (
                            <span
                                key={i}
                                className="crumb-particle absolute bottom-4 select-none"
                                style={{ left: c.left, animationDelay: c.delay, fontSize: c.size }}
                            >🍪</span>
                        ))}
                    </div>
                )}

                <div className="container-app flex flex-wrap items-center gap-3 py-2.5 px-4">
                    {/* Krümelmonster */}
                    <div className={eating ? 'cm-munch' : 'cm-idle'}>
                        <CookieMonster eating={eating} />
                    </div>

                    <p className="text-sm text-slate-600 flex-1 min-w-[160px]">
                        <span className="font-semibold text-slate-700">Om nom nom!</span>{' '}
                        Diese Seite verwendet nur technisch notwendige Guetzli – kein Tracking, keine Werbung.
                    </p>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                            onClick={accept}
                            className="text-sm font-medium bg-brand-primary text-white px-4 py-1.5 rounded-full hover:opacity-90 active:scale-95 transition-all"
                        >
                            🍪 Guetzli Ässe
                        </button>
                        <button
                            onClick={decline}
                            disabled={eating}
                            className="text-sm text-slate-500 px-3 py-1.5 rounded-full hover:bg-slate-100 active:scale-95 transition-all whitespace-nowrap disabled:opacity-60"
                        >
                            Guetzli am Krümelmonster geh
                        </button>
                        <button
                            onClick={accept}
                            aria-label="Schliessen"
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
