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
        <section className="py-24 bg-card">
            <div className="container-app">
                <div className="text-center mb-16 px-4">
                    <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                        Aktuelles & Highlights
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                        Bleiben Sie auf dem Laufenden mit unseren neuesten Flyern und Programmen.
                    </p>
                </div>

                <div className="flex flex-wrap justify-center gap-10 max-w-6xl mx-auto px-4">
                    {promos.map((promo) => (
                        <div key={promo.id} className="w-full md:max-w-[calc(50%-1.25rem)] lg:max-w-[calc(33.333%-1.75rem)] flex flex-col">
                            <Card className="overflow-hidden border-border/10 hover:border-brand-primary/20 transition-all shadow-sm hover:shadow-2xl group bg-background flex flex-col h-full rounded-3xl">
                                <div className="relative w-full aspect-[3/4] bg-muted/30 overflow-hidden flex items-center justify-center">
                                    {promo.filename.toLowerCase().endsWith('.pdf') ? (
                                        <iframe
                                            src={`${getMediaUrl(`/uploads/cms/flyers/${promo.filename}`)}#toolbar=0`}
                                            className="w-full h-full border-none bg-white"
                                            title={promo.title}
                                        />
                                    ) : (
                                        <img
                                            src={getMediaUrl(`/uploads/cms/flyers/${promo.filename}`)}
                                            alt={promo.title}
                                            className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                                        />
                                    )}
                                </div>

                                <CardContent className="p-8 w-full flex-grow flex flex-col text-center md:text-left">
                                    <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-brand-primary transition-colors line-clamp-1">
                                        {promo.title}
                                    </h3>
                                    {promo.description && (
                                        <p className="text-sm text-muted-foreground/80 line-clamp-3 mb-6 leading-relaxed">
                                            {promo.description}
                                        </p>
                                    )}
                                    <div className="mt-auto pt-6 flex items-center gap-3">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            asChild
                                            className="flex-1 rounded-xl bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 border-none h-11"
                                        >
                                            <a href={getMediaUrl(`/uploads/cms/flyers/${promo.filename}`)} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="h-4 w-4 mr-2" /> Ansehen
                                            </a>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            asChild
                                            className="shrink-0 rounded-xl h-11 w-11 border-border/20"
                                        >
                                            <a href={getMediaUrl(`/uploads/cms/flyers/${promo.filename}`)} download={promo.filename}>
                                                <Download className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
