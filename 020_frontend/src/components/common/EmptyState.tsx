import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn('flex flex-col items-center justify-center gap-3 py-12 px-6 text-center', className)}>
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                <Icon className="w-7 h-7 text-muted-foreground/50" />
            </div>
            <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                {description && (
                    <p className="text-xs text-muted-foreground max-w-xs">{description}</p>
                )}
            </div>
            {action && (
                <Button size="sm" onClick={action.onClick} className="mt-1">
                    {action.label}
                </Button>
            )}
        </div>
    );
}
