import { useRef, useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '@/services/eventService';
import { CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AttendanceStatus } from '@/types';

interface SwipeableEventCardProps {
    eventId: number;
    currentStatus?: AttendanceStatus | null;
    isLocked?: boolean;
    children: React.ReactNode;
}

const SWIPE_THRESHOLD = 60; // px needed to reveal panel
const PANEL_WIDTH = 180; // width of the action panel in px

export function SwipeableEventCard({
    eventId,
    currentStatus,
    isLocked = false,
    children,
}: SwipeableEventCardProps) {
    const queryClient = useQueryClient();

    const containerRef = useRef<HTMLDivElement>(null);
    const startXRef = useRef<number>(0);
    const startYRef = useRef<number>(0);
    const currentTranslateRef = useRef<number>(0);
    const isDraggingRef = useRef<boolean>(false);
    const isScrollingRef = useRef<boolean | null>(null); // null = not yet determined

    const [translateX, setTranslateX] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const { mutate: setAttendance, isPending } = useMutation({
        mutationFn: (status: AttendanceStatus) =>
            eventService.setAttendance(eventId, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            closePanel();
        },
        onError: () => {
            closePanel();
        },
    });

    const closePanel = useCallback(() => {
        setIsAnimating(true);
        setTranslateX(0);
        setIsOpen(false);
        currentTranslateRef.current = 0;
        setTimeout(() => setIsAnimating(false), 300);
    }, []);

    const openPanel = useCallback(() => {
        setIsAnimating(true);
        setTranslateX(-PANEL_WIDTH);
        setIsOpen(true);
        currentTranslateRef.current = -PANEL_WIDTH;
        setTimeout(() => setIsAnimating(false), 300);
    }, []);

    // ── Touch handlers ──────────────────────────────────────────────────────

    const onTouchStart = useCallback((e: React.TouchEvent) => {
        if (isLocked || isPending) return;
        startXRef.current = e.touches[0].clientX;
        startYRef.current = e.touches[0].clientY;
        isDraggingRef.current = true;
        isScrollingRef.current = null;
    }, [isLocked, isPending]);

    const onTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDraggingRef.current) return;

        const dx = e.touches[0].clientX - startXRef.current;
        const dy = e.touches[0].clientY - startYRef.current;

        // Determine scroll vs swipe on first significant movement
        if (isScrollingRef.current === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
            isScrollingRef.current = Math.abs(dy) > Math.abs(dx);
        }

        // If scrolling vertically, let native scroll happen
        if (isScrollingRef.current) return;

        // Horizontal swipe: prevent page scroll
        e.preventDefault();

        const base = isOpen ? -PANEL_WIDTH : 0;
        const raw = base + dx;
        // Clamp: max open = -PANEL_WIDTH, min = 0 (no over-swipe right)
        const clamped = Math.max(-PANEL_WIDTH, Math.min(0, raw));

        setTranslateX(clamped);
        currentTranslateRef.current = clamped;
    }, [isOpen]);

    const onTouchEnd = useCallback(() => {
        if (!isDraggingRef.current || isScrollingRef.current) {
            isDraggingRef.current = false;
            return;
        }
        isDraggingRef.current = false;

        const tx = currentTranslateRef.current;

        if (isOpen) {
            // Close if swiped far enough right
            if (tx > -PANEL_WIDTH + SWIPE_THRESHOLD) {
                closePanel();
            } else {
                openPanel();
            }
        } else {
            // Open if swiped far enough left
            if (tx < -SWIPE_THRESHOLD) {
                openPanel();
            } else {
                closePanel();
            }
        }
    }, [isOpen, closePanel, openPanel]);

    // ── Mouse handlers (desktop) ────────────────────────────────────────────

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        if (isLocked || isPending) return;
        startXRef.current = e.clientX;
        isDraggingRef.current = true;
        isScrollingRef.current = false;
    }, [isLocked, isPending]);

    const onMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDraggingRef.current) return;
        e.preventDefault();

        const dx = e.clientX - startXRef.current;
        const base = isOpen ? -PANEL_WIDTH : 0;
        const clamped = Math.max(-PANEL_WIDTH, Math.min(0, base + dx));

        setTranslateX(clamped);
        currentTranslateRef.current = clamped;
    }, [isOpen]);

    const onMouseUp = useCallback(() => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;

        const tx = currentTranslateRef.current;

        if (isOpen) {
            if (tx > -PANEL_WIDTH + SWIPE_THRESHOLD) closePanel();
            else openPanel();
        } else {
            if (tx < -SWIPE_THRESHOLD) openPanel();
            else closePanel();
        }
    }, [isOpen, closePanel, openPanel]);

    // Stop link navigation when panel is open or being interacted with
    const handleLinkClick = useCallback((e: React.MouseEvent) => {
        if (isOpen || Math.abs(currentTranslateRef.current) > 5) {
            e.preventDefault();
            e.stopPropagation();
            if (isOpen) closePanel();
        }
    }, [isOpen, closePanel]);

    const handleActionClick = (status: AttendanceStatus) => (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setAttendance(status);
    };

    return (
        <div
            className="swipeable-card-wrapper"
            style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}
        >
            {/* Action Panel (revealed behind the card) */}
            <div
                className="swipeable-action-panel"
                style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: `${PANEL_WIDTH}px`,
                    display: 'flex',
                    alignItems: 'stretch',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                }}
                aria-hidden="true"
            >
                <ActionButton
                    status="yes"
                    onClick={handleActionClick('yes')}
                    isActive={currentStatus === 'yes'}
                    disabled={isPending}
                />
                <ActionButton
                    status="no"
                    onClick={handleActionClick('no')}
                    isActive={currentStatus === 'no'}
                    disabled={isPending}
                />
                <ActionButton
                    status="maybe"
                    onClick={handleActionClick('maybe')}
                    isActive={currentStatus === 'maybe'}
                    disabled={isPending}
                />
            </div>

            {/* Sliding Card Content */}
            <div
                ref={containerRef}
                className={cn('swipeable-card-content', isAnimating && 'swipeable-card-animating')}
                style={{
                    transform: `translateX(${translateX}px)`,
                    transition: isAnimating ? 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
                    userSelect: 'none',
                    touchAction: 'pan-y',
                    cursor: isDraggingRef.current ? 'grabbing' : 'grab',
                }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onClick={handleLinkClick}
            >
                {children}
            </div>

            {/* Swipe hint indicator (shown only when not open) */}
            {!isOpen && !isLocked && (
                <div
                    className="swipe-hint-indicator"
                    style={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        gap: 2,
                        opacity: 0.25,
                        pointerEvents: 'none',
                        transition: 'opacity 0.3s',
                    }}
                >
                    {['▸', '▸', '▸'].map((_, i) => (
                        <span
                            key={i}
                            style={{
                                fontSize: 10,
                                color: 'currentColor',
                                opacity: 1 - i * 0.3,
                                animationDelay: `${i * 0.15}s`,
                            }}
                        >
                            ◂
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Sub-component: each action button in the panel ─────────────────────────

interface ActionButtonProps {
    status: AttendanceStatus;
    onClick: (e: React.MouseEvent) => void;
    isActive: boolean;
    disabled?: boolean;
}

const actionConfig = {
    yes: {
        icon: CheckCircle,
        label: 'Ja',
        bg: 'bg-green-500 hover:bg-green-600 active:bg-green-700',
        activeBg: 'bg-green-600',
        text: 'text-white',
    },
    no: {
        icon: XCircle,
        label: 'Nein',
        bg: 'bg-red-500 hover:bg-red-600 active:bg-red-700',
        activeBg: 'bg-red-600',
        text: 'text-white',
    },
    maybe: {
        icon: HelpCircle,
        label: '?',
        bg: 'bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600',
        activeBg: 'bg-yellow-500',
        text: 'text-white',
    },
} as const;

function ActionButton({ status, onClick, isActive, disabled }: ActionButtonProps) {
    const { icon: Icon, label, bg, activeBg, text } = actionConfig[status];

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1',
                text,
                isActive ? activeBg : bg,
                'transition-colors duration-150',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'border-0 outline-none',
            )}
            style={{ minWidth: 0 }}
            aria-label={`Anwesenheit: ${label}`}
        >
            <Icon className={cn('h-6 w-6', isActive && 'drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]')} />
            <span className="text-xs font-semibold">{label}</span>
        </button>
    );
}

export default SwipeableEventCard;
