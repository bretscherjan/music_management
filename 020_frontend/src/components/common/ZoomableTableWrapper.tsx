import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ZoomableTableWrapperProps {
    children: React.ReactNode;
    title?: string;
    className?: string;
}

export function ZoomableTableWrapper({ children, title, className }: ZoomableTableWrapperProps) {
    const [zoomLevel, setZoomLevel] = useState(1);
    const STEP = 0.1;
    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 1.5;

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + STEP, MAX_ZOOM));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - STEP, MIN_ZOOM));
    const handleReset = () => setZoomLevel(1);

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex items-center justify-between bg-muted/20 p-2 rounded-t-lg border-x border-t">
                <div className="font-medium text-sm text-muted-foreground px-2">
                    {title || 'Tabelle'}
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleZoomOut}
                        disabled={zoomLevel <= MIN_ZOOM}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Verkleinern"
                    >
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-mono w-12 text-center select-none">
                        {Math.round(zoomLevel * 100)}%
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleZoomIn}
                        disabled={zoomLevel >= MAX_ZOOM}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Vergrössern"
                    >
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleReset}
                        disabled={zoomLevel === 1}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground ml-1"
                        title="Zurücksetzen"
                    >
                        <RotateCcw className="h-3 w-3" />
                    </Button>
                </div>
            </div>

            <div className="border border-t-0 rounded-b-lg overflow-hidden bg-card">
                {/* Horizontal scroll container */}
                <div className="overflow-x-auto w-full">
                    {/* Zoom container */}
                    <div
                        style={{
                            transform: `scale(${zoomLevel})`,
                            transformOrigin: '0 0',
                            width: `${100 / zoomLevel}%`
                        }}
                        className="transition-transform duration-200"
                    >
                        {children}
                    </div>
                </div>
            </div>

            <p className="text-[10px] text-muted-foreground text-center italic sm:hidden max-w-[250px] mx-auto">
                Tipp: Nutze die Lupe oben rechts zum Zoomen oder wische seitlich in der Tabelle.
            </p>
        </div>
    );
}
