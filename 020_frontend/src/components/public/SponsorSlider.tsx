import { useRef, useState } from 'react';

// Import all sponsor images statically
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

// 4× kopiert: Animation scrollt genau eine Kopie (25 % des Tracks),
// dann springt sie nahtlos zurück — für den Beobachter unsichtbar.
const ITEMS = [...SPONSORS, ...SPONSORS, ...SPONSORS, ...SPONSORS, ...SPONSORS, ...SPONSORS];

export function SponsorSlider() {
    const trackRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);

    return (
        <section className="py-10 bg-[hsl(var(--background))] border-t border-[hsl(var(--border))]">
            <style>{`
                @keyframes sponsor-scroll {
                    0%   { transform: translateX(0); }
                    100% { transform: translateX(-25%); }
                }
                .sponsor-track {
                    animation: sponsor-scroll 30s linear infinite;
                }
                .sponsor-track.paused {
                    animation-play-state: paused;
                }
            `}</style>

            <div className="container-app mb-6">
                <p className="text-center text-sm font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))] opacity-70">
                    Unsere Gönner
                </p>
            </div>

            {/* Slider wrapper with fade edges */}
            <div
                className="relative overflow-hidden"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                {/* Left fade */}
                <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[hsl(var(--background))] to-transparent" />
                {/* Right fade */}
                <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[hsl(var(--background))] to-transparent" />

                <div
                    ref={trackRef}
                    className={`flex items-center gap-10 will-change-transform sponsor-track${isPaused ? ' paused' : ''}`}
                >
                    {ITEMS.map((sponsor, i) => (
                        <div
                            key={i}
                            className="flex-shrink-0 h-20 w-40 flex items-center justify-center"
                        >
                            <img
                                src={sponsor.src}
                                alt={sponsor.alt}
                                className="max-h-16 max-w-[9rem] w-auto object-contain grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-500"
                                draggable={false}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
