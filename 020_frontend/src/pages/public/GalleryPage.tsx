import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cmsService } from '@/services/cmsService';
import { Loader2, X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMediaUrl } from '@/lib/api';

export function GalleryPage() {
    const { data: images = [], isLoading } = useQuery({
        queryKey: ['gallery', 'public'],
        queryFn: async () => {
            const all = await cmsService.getGalleryImages();
            return all.sort((a, b) => a.position - b.position);
        }
    });

    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const openLightbox = (index: number) => setSelectedIndex(index);
    const closeLightbox = () => setSelectedIndex(null);
    const showNext = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (selectedIndex !== null) {
            setSelectedIndex((selectedIndex + 1) % images.length);
        }
    };
    const showPrev = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (selectedIndex !== null) {
            setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pb-20 pt-24 md:pt-32">
            <div className="container-app">
                <header className="mb-12 md:mb-20 text-center">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[hsl(var(--musig-primary))] mb-6 tracking-tight">
                        Galerie
                    </h1>
                    <div className="h-1.5 w-24 bg-[hsl(var(--musig-primary))] mx-auto rounded-full opacity-20" />
                    <p className="mt-8 text-lg text-muted-foreground max-w-2xl mx-auto px-4">
                        Eindrücke aus unserem Vereinsleben, Konzerten und gemeinsamen Anlässen.
                    </p>
                </header>

                {images.length > 0 ? (
                    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 px-4 md:px-0 space-y-4">
                        {images.map((image, index) => (
                            <div
                                key={image.id}
                                className="relative break-inside-avoid rounded-xl overflow-hidden cursor-zoom-in group border-2 border-transparent hover:border-primary/20 transition-all shadow-sm hover:shadow-xl bg-muted"
                                onClick={() => openLightbox(index)}
                            >
                                <img
                                    src={getMediaUrl(`/uploads/cms/gallery/${image.filename}`)}
                                    alt={image.title || 'Galeriebild'}
                                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                                    {image.title && <h3 className="text-white font-bold text-lg mb-1 drop-shadow-md">{image.title}</h3>}
                                    {image.description && <p className="text-white/80 text-sm line-clamp-2 drop-shadow-md">{image.description}</p>}
                                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full p-2 text-white">
                                        <Maximize2 className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-32 opacity-50">
                        <p className="text-xl">Aktuell sind keine Bilder verfügbar.</p>
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {selectedIndex !== null && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300"
                    onClick={closeLightbox}
                >
                    <button
                        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-50 p-2"
                        onClick={closeLightbox}
                    >
                        <X className="h-8 w-8" />
                    </button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white hover:bg-white/10 rounded-full h-12 w-12 hidden md:flex"
                        onClick={showPrev}
                    >
                        <ChevronLeft className="h-8 w-8" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white hover:bg-white/10 rounded-full h-12 w-12 hidden md:flex"
                        onClick={showNext}
                    >
                        <ChevronRight className="h-8 w-8" />
                    </Button>

                    <div className="relative max-w-6xl w-full h-full flex flex-col items-center justify-center gap-6" onClick={(e) => e.stopPropagation()}>
                        <div className="relative group w-full h-full flex items-center justify-center">
                            <img
                                src={getMediaUrl(`/uploads/cms/gallery/${images[selectedIndex].filename}`)}
                                alt={images[selectedIndex].title || 'Vollbild'}
                                className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                            />
                        </div>

                        {(images[selectedIndex].title || images[selectedIndex].description) && (
                            <div className="text-center px-4 max-w-3xl">
                                {images[selectedIndex].title && <h2 className="text-2xl font-bold text-white mb-2">{images[selectedIndex].title}</h2>}
                                {images[selectedIndex].description && <p className="text-white/70">{images[selectedIndex].description}</p>}
                            </div>
                        )}

                        <div className="text-white/40 text-sm font-mono tracking-tighter">
                            {selectedIndex + 1} / {images.length}
                        </div>
                    </div>

                    {/* Mobile Swipe Simulation / Taps */}
                    <div className="absolute inset-y-0 left-0 w-20 md:hidden" onClick={showPrev} />
                    <div className="absolute inset-y-0 right-0 w-20 md:hidden" onClick={showNext} />
                </div>
            )}
        </div>
    );
}
