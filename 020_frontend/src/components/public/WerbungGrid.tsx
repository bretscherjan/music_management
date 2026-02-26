import { useQuery } from '@tanstack/react-query';
import { cmsService } from '@/services/cmsService';
import { Loader2, ExternalLink, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getMediaUrl } from '@/lib/api';

export function WerbungGrid() {
    const { data: promos = [], isLoading } = useQuery({
        queryKey: ['promos', 'homepage'],
        queryFn: async () => {
            const all = await cmsService.getFlyers(); // Flyers are used for 'Werbung'
            return all.filter(p => p.active && p.showOnHomePage).sort((a, b) => a.position - b.position);
        }
    });

    if (isLoading) {
        return (
            <div className="py-12 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
            </div>
        );
    }

    if (promos.length === 0) return null;

    return (
        <section className="py-20 bg-zinc-50/50">
            <div className="container-app">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--musig-primary))] mb-4">
                        Aktuelles
                    </h2>
                    <div className="h-1 w-20 bg-[hsl(var(--musig-primary))] mx-auto rounded-full opacity-20" />
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center max-w-6xl mx-auto px-4`}>
                    {promos.map((promo) => (
                        <Card key={promo.id} className="overflow-hidden border-2 border-primary/5 hover:border-primary/20 transition-all shadow-sm hover:shadow-xl group bg-white flex flex-col items-center text-center">
                            <div className="relative w-full aspect-[3/4] bg-zinc-100 overflow-hidden flex items-center justify-center">
                                {promo.filename.toLowerCase().endsWith('.pdf') ? (
                                    <iframe
                                        src={`${getMediaUrl(`/uploads/cms/flyers/${promo.filename}`)}#toolbar=0&navpanes=0&scrollbar=0`}
                                        className="w-full h-full border-none"
                                        title={promo.title}
                                    />
                                ) : (
                                    <img
                                        src={getMediaUrl(`/uploads/cms/flyers/${promo.filename}`)}
                                        alt={promo.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                )}

                                {/* Overlay Actions */}
                                <div className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        asChild
                                        className="rounded-full shadow-lg"
                                    >
                                        <a href={getMediaUrl(`/uploads/cms/flyers/${promo.filename}`)} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4 mr-2" /> Ansehen
                                        </a>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        asChild
                                        className="rounded-full bg-white shadow-lg border-none"
                                    >
                                        <a href={getMediaUrl(`/uploads/cms/flyers/${promo.filename}`)} download={promo.filename}>
                                            <Download className="h-4 w-4" />
                                        </a>
                                    </Button>
                                </div>
                            </div>

                            <CardContent className="p-6 w-full">
                                <h3 className="text-lg font-bold text-[hsl(var(--musig-primary))] mb-2 line-clamp-1">
                                    {promo.title}
                                </h3>
                                {promo.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {promo.description}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))}

                    {/* Centering spacer for grid if 1 or 2 items (using grid-cols-1 md:grid-cols-2 lg:grid-cols-3) */}
                    {/* CSS handles the layout, but for exact centering we wrap with max-width and mx-auto */}
                </div>
            </div>
        </section>
    );
}
