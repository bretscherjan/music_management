import { useQuery } from '@tanstack/react-query';
import { cmsService } from '@/services/cmsService';
import { Loader2 } from 'lucide-react';
import { getMediaUrl } from '@/lib/api';
import { useEffect, useRef, useState } from 'react';

export function SponsorSlider() {
    const { data: sponsors = [], isLoading } = useQuery({
        queryKey: ['sponsors', 'active'],
        queryFn: async () => {
            const all = await cmsService.getSponsors();
            return all.filter(s => s.active);
        }
    });

    const sliderRef = useRef<HTMLDivElement>(null);
    const [animationDuration, setAnimationDuration] = useState<number>(40);

    // Berechne die Animationsdauer basierend auf der Viewport-Breite
    // Die Basis-Geschwindigkeit ist 40 Sekunden für Desktop (1920px)
    useEffect(() => {
        const calculateDuration = () => {
            if (sliderRef.current) {

                
                
                // Referenz: Bei 1920px breite (Desktop) soll es 40s sein
                // Bei anderen Breiten proportional anpassen
                const baseWidth = 1920;
                const baseDuration = 40;
                
                // Berechne die Dauer proportional zur Breite
                const windowWidth = window.innerWidth;
                const ratio = windowWidth / baseWidth;
                const newDuration = baseDuration / ratio;
                
                setAnimationDuration(newDuration);
            }
        };

        // Einmalig beim Mount
        const timer = setTimeout(calculateDuration, 100);
        
        // Rekalkuliere bei Fenster-Größenänderung
        window.addEventListener('resize', calculateDuration);
        
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', calculateDuration);
        };
    }, [sponsors.length]);

    if (isLoading) {
        return (
            <div className="py-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    if (sponsors.length === 0) return null;

    // Multiple copies for a very long track to ensure seamless looping
    const duplicatedSponsors = [...sponsors, ...sponsors, ...sponsors, ...sponsors, ...sponsors, ...sponsors];

    return (
        <section className="py-12 bg-muted/30 overflow-hidden">
            <div className="container mx-auto px-4 mb-8 text-center text-sm font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))] opacity-70">
                Unsere Sponsoren
            </div>

            <div className="relative">
                {/* Fade edges */}
                <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[hsl(var(--background))] to-transparent" />
                <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[hsl(var(--background))] to-transparent" />

                <div 
                    ref={sliderRef}
                    className="py-4 whitespace-nowrap flex items-center gap-12 select-none"
                    style={{
                        animation: `marquee-sponsors ${animationDuration}s linear infinite`,
                    } as React.CSSProperties}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.animationPlayState = 'paused';
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.animationPlayState = 'running';
                    }}
                >
                    {duplicatedSponsors.map((sponsor, idx) => (
                        <a
                            key={`${sponsor.id}-${idx}`}
                            href={sponsor.websiteUrl || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-shrink-0"
                            draggable={false}
                        >
                            <img
                                src={getMediaUrl(sponsor.logoUrl)}
                                alt={sponsor.name}
                                className="h-12 w-auto grayscale hover:grayscale-0 transition-opacity opacity-60 hover:opacity-100 object-contain max-w-[150px]"
                                draggable={false}
                            />
                        </a>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes marquee-sponsors {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </section>
    );
}
