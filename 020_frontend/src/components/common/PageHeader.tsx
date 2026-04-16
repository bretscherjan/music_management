import React from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
    /** Main page title */
    title: string;
    /** Optional subtitle shown below the title */
    subtitle?: string;
    /** Optional Lucide icon shown to the left of the title */
    Icon?: LucideIcon;
    /**
     * Slot for primary action button(s) — rendered top-right.
     *
     * Standard responsive button pattern:
     *   <Button className="h-11 w-11 sm:w-auto sm:px-5 gap-1.5 rounded-2xl shadow-sm">
     *       <Plus className="h-5 w-5 flex-shrink-0" />
     *       <span className="hidden sm:inline">Label</span>
     *   </Button>
     */
    actions?: React.ReactNode;
    /** Extra className on the wrapper div */
    className?: string;
}

/**
 * PageHeader — the single standardised section header for every member-area page.
 *
 * Typography:
 *   Title    → text-xl sm:text-2xl md:text-3xl — scales to fit without truncation
 *   Subtitle → text-sm text-muted-foreground
 *   Icon     → always rendered inline-left of the title when provided
 *
 * Layout:
 *   Title (+ optional Icon) on the left, actions on the right.
 *
 * Spacing:
 *   pt-3 pb-5 — small top gap, generous bottom separation from first card.
 */
export function PageHeader({
    title,
    subtitle,
    Icon,
    actions,
    className,
}: PageHeaderProps) {
    return (
        <div className={cn('flex items-center justify-between gap-4 pt-3 pb-5', className)}>
            {/* Left: title + subtitle */}
            <div className="flex flex-col gap-0.5 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2 leading-tight">
                    {Icon && <Icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-primary flex-shrink-0" />}
                    <span className="break-words">{title}</span>
                </h1>
                {subtitle && (
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
            </div>

            {/* Right: action button(s) */}
            {actions && (
                <div className="flex items-center gap-2 flex-shrink-0">
                    {actions}
                </div>
            )}
        </div>
    );
}
