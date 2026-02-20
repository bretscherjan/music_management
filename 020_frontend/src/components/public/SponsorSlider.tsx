import { useState } from 'react';

// Images bleiben gleich
import suzuki from '@/img/sponsoren/suzuki.jpeg';
import car_market from '@/img/sponsoren/car_market.png';
import maeschli from '@/img/sponsoren/maeschli.jpg';
import muellhaupt from '@/img/sponsoren/muellhaupt.jpeg';
import carXpert from '@/img/sponsoren/carXpert.png';
import schnyder from '@/img/sponsoren/schnyder.jpg';
import crea_hairstyle from '@/img/sponsoren/crea_hairstyle.jpg'

const SPONSORS = [
    { src: suzuki, alt: 'Suzuki' },
    { src: car_market, alt: 'Car Market' },
    { src: maeschli, alt: 'Maeschli' },
    { src: muellhaupt, alt: 'Muellhaupt' },
    { src: carXpert, alt: 'Car Xpert' },
    { src: schnyder, alt: 'Schnyder' },
    { src: crea_hairstyle, alt: 'Crea Hairstyle' },
];

// Zweimal reicht völlig aus für einen nahtlosen Loop
const ITEMS = [...SPONSORS, ...SPONSORS];

export function SponsorSlider() {
    const [isPaused, setIsPaused] = useState(false);

    return (
        <section className="py-10 bg-[hsl(var(--background))] border-t border-[hsl(var(--border))] overflow-hidden">
            <style>{`
                @keyframes scroll {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }
                .animate-scroll {
                    animation: scroll var(--animation-duration, 30s) linear infinite;
                }
                .paused {
                    animation-play-state: paused;
                }
            `}</style>

            <div className="container-app mb-8">
                <p className="text-center text-xs md:text-sm font-semibold uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] opacity-70">
                    Unsere Gönner
                </p>
            </div>

            <div
                className="group relative flex overflow-hidden p-2"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
            >
                {/* Fade Overlays - auf Mobile etwas schmaler für mehr Sichtbarkeit */}
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 md:w-32 bg-gradient-to-r from-[hsl(var(--background))] to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 md:w-32 bg-gradient-to-l from-[hsl(var(--background))] to-transparent" />

                <div
                    className={`flex min-w-full shrink-0 items-center justify-around gap-12 md:gap-20 animate-scroll ${isPaused ? 'paused' : ''}`}
                    style={{ '--animation-duration': '25s' } as React.CSSProperties}
                >
                    {ITEMS.map((sponsor, i) => (
                        <div
                            key={i}
                            className="flex shrink-0 items-center justify-center w-32 md:w-40"
                        >
                            <img
                                src={sponsor.src}
                                alt={sponsor.alt}
                                className="h-10 md:h-14 w-auto object-contain grayscale hover:grayscale-0 opacity-50 hover:opacity-100 transition-all duration-500"
                                draggable={false}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
