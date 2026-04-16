import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Search, FileText, Folder, Calendar, Users, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { useCan } from '@/context/AuthContext';
import { searchService, type SearchResults, type SearchCategory } from '@/services/searchService';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// ─── Types ───────────────────────────────────────────────────────────────────

interface GlobalSearchProps {
    open: boolean;
    onClose: () => void;
}

type FilterCategory = 'all' | 'files' | 'folders' | 'events' | 'members';

interface FilterPill {
    value: FilterCategory;
    label: string;
    permission?: string;
    icon: React.ComponentType<{ className?: string }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMimeIcon(mimetype: string): string {
    if (mimetype.startsWith('image/')) return '🖼️';
    if (mimetype === 'application/pdf') return '📄';
    if (mimetype.includes('word') || mimetype.includes('document')) return '📝';
    if (mimetype.includes('sheet') || mimetype.includes('excel')) return '📊';
    if (mimetype.includes('presentation') || mimetype.includes('powerpoint')) return '📋';
    if (mimetype.startsWith('audio/')) return '🎵';
    if (mimetype.startsWith('video/')) return '🎬';
    if (mimetype.includes('zip') || mimetype.includes('archive')) return '📦';
    return '📎';
}

function getCategoryLabel(category: string): string {
    const map: Record<string, string> = {
        rehearsal: 'Probe',
        performance: 'Auftritt',
        other: 'Sonstiges',
    };
    return map[category] ?? category;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
    const navigate = useNavigate();
    const can = useCan();
    const inputRef = useRef<HTMLInputElement>(null);

    const [query, setQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
    const [results, setResults] = useState<SearchResults>({ files: [], folders: [], events: [], members: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const debouncedQuery = useDebounce(query, 300);

    // Filter pills – only show categories the user has permission to see
    const allPills: FilterPill[] = [
        { value: 'all', label: 'Alle', icon: Search },
        { value: 'files', label: 'Dateien', permission: 'files:read', icon: FileText },
        { value: 'folders', label: 'Ordner', permission: 'folders:read', icon: Folder },
        { value: 'events', label: 'Termine', permission: 'events:read', icon: Calendar },
        { value: 'members', label: 'Mitglieder', permission: 'members:read', icon: Users },
    ];

    const visiblePills = allPills.filter((p) => !p.permission || can(p.permission));

    // ── Fetch results ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!open) return;

        if (!debouncedQuery || debouncedQuery.trim().length < 2) {
            setResults({ files: [], folders: [], events: [], members: [] });
            setHasSearched(false);
            return;
        }

        let cancelled = false;
        setIsLoading(true);

        searchService
            .search(debouncedQuery.trim(), activeFilter as SearchCategory)
            .then((data) => {
                if (!cancelled) {
                    setResults(data);
                    setHasSearched(true);
                    setActiveIndex(-1);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setResults({ files: [], folders: [], events: [], members: [] });
                    setHasSearched(true);
                }
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [debouncedQuery, activeFilter, open]);

    // ── Reset on close ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!open) {
            setQuery('');
            setActiveFilter('all');
            setResults({ files: [], folders: [], events: [], members: [] });
            setHasSearched(false);
            setActiveIndex(-1);
        } else {
            // Auto-focus input when opened
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    // ── Build flat result list for keyboard nav ────────────────────────────
    const flatResults = buildFlatResults(results, can);

    // ── Keyboard navigation ────────────────────────────────────────────────
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, flatResults.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, -1));
            } else if (e.key === 'Enter' && activeIndex >= 0) {
                e.preventDefault();
                const item = flatResults[activeIndex];
                if (item) handleResultClick(item.href);
            } else if (e.key === 'Escape') {
                onClose();
            }
        },
        [flatResults, activeIndex, onClose]
    );

    const handleResultClick = (href: string) => {
        onClose();
        navigate(href);
    };

    // ── Total result count ────────────────────────────────────────────────
    const totalResults = results.files.length + results.folders.length + results.events.length + results.members.length;
    const isEmpty = hasSearched && debouncedQuery.trim().length >= 2 && totalResults === 0;

    // ─── Render ────────────────────────────────────────────────────────────
    return (
        <DialogPrimitive.Root open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogPrimitive.Portal>
                {/* Overlay */}
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

                {/* Modal panel – full-screen on mobile, centered floating on desktop */}
                <DialogPrimitive.Content
                    aria-describedby={undefined}
                    onEscapeKeyDown={onClose}
                    className={cn(
                        'fixed z-50 bg-white outline-none overflow-hidden flex flex-col',
                        'data-[state=open]:animate-in data-[state=closed]:animate-out',
                        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                        // Mobile: full screen
                        'inset-0',
                        'data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:slide-out-to-bottom-4',
                        // Desktop: centered floating card
                        'sm:inset-auto sm:top-[10vh] sm:left-1/2 sm:-translate-x-1/2',
                        'sm:w-full sm:max-w-xl sm:rounded-2xl sm:shadow-2xl',
                        'sm:max-h-[75vh]',
                        'sm:data-[state=open]:slide-in-from-bottom-2 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95',
                    )}
                >
                    {/* Visually hidden title for accessibility */}
                    <DialogPrimitive.Title className="sr-only">Globale Suche</DialogPrimitive.Title>

                    {/* ── Search Input ─────────────────────────────────────── */}
                    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border flex-shrink-0">
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />
                        ) : (
                            <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        )}
                        <input
                            ref={inputRef}
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Suchen…"
                            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className="rounded-full p-1.5 hover:bg-muted transition-colors"
                                aria-label="Suche löschen"
                            >
                                <X className="h-4 w-4 text-muted-foreground" />
                            </button>
                        )}
                        {/* Esc badge on desktop / Close button on mobile */}
                        <button
                            onClick={onClose}
                            className="sm:hidden rounded-full p-1.5 hover:bg-muted transition-colors"
                            aria-label="Schließen"
                        >
                            <X className="h-5 w-5 text-muted-foreground" />
                        </button>
                        <kbd className="hidden sm:flex items-center gap-1 text-[10px] font-mono bg-muted border border-border rounded px-1.5 py-0.5 text-muted-foreground leading-none">
                            Esc
                        </kbd>
                    </div>

                    {/* ── Category Filter Pills ──────────────────────────────── */}
                    {visiblePills.length > 1 && (
                        <div className="flex gap-2 px-4 py-2.5 border-b border-border overflow-x-auto flex-shrink-0 scrollbar-hide">
                            {visiblePills.map((pill) => (
                                <button
                                    key={pill.value}
                                    onClick={() => setActiveFilter(pill.value)}
                                    className={cn(
                                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors',
                                        activeFilter === pill.value
                                            ? 'bg-primary text-white'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                                    )}
                                >
                                    <pill.icon className="h-3 w-3" />
                                    {pill.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ── Results ──────────────────────────────────────────────── */}
                    <div className="flex-1 overflow-y-auto overscroll-contain">
                        {/* Empty state – no query */}
                        {!query && (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <Search className="h-10 w-10 mb-3 opacity-25" />
                                <p className="text-sm font-medium">Suche nach Dateien, Terminen…</p>
                                <p className="text-xs mt-1 opacity-60">Mindestens 2 Zeichen eingeben</p>
                            </div>
                        )}

                        {/* Empty state – no results */}
                        {isEmpty && (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <Search className="h-10 w-10 mb-3 opacity-25" />
                                <p className="text-sm font-medium">Keine Ergebnisse gefunden</p>
                                <p className="text-xs mt-1 opacity-60">Keine Treffer für „{debouncedQuery}"</p>
                            </div>
                        )}

                        {/* Results list */}
                        {totalResults > 0 && (
                            <div className="py-2">
                                {/* Files */}
                                {results.files.length > 0 && can('files:read') && (
                                    <ResultSection title="Dateien" icon={FileText}>
                                        {results.files.map((file, idx) => {
                                            const globalIdx = getGlobalIndex(results, 'files', idx, can);
                                            return (
                                                <ResultItem
                                                    key={`file-${file.id}`}
                                                    isActive={activeIndex === globalIdx}
                                                    onClick={() => handleResultClick(`/member/files?fileId=${file.id}`)}
                                                    onMouseEnter={() => setActiveIndex(globalIdx)}
                                                    icon={<span className="text-base leading-none">{getMimeIcon(file.mimetype)}</span>}
                                                    primary={file.originalName}
                                                    secondary={file.folder === '/' ? 'Stammverzeichnis' : file.folder}
                                                />
                                            );
                                        })}
                                    </ResultSection>
                                )}

                                {/* Folders */}
                                {results.folders.length > 0 && can('folders:read') && (
                                    <ResultSection title="Ordner" icon={Folder}>
                                        {results.folders.map((folder, idx) => {
                                            const globalIdx = getGlobalIndex(results, 'folders', idx, can);
                                            return (
                                                <ResultItem
                                                    key={`folder-${folder.id}`}
                                                    isActive={activeIndex === globalIdx}
                                                    onClick={() => handleResultClick(`/member/files?folderId=${folder.id}`)}
                                                    onMouseEnter={() => setActiveIndex(globalIdx)}
                                                    icon={<Folder className="h-4 w-4 text-primary" />}
                                                    primary={folder.name}
                                                    secondary={folder.parentId ? 'Unterordner' : 'Hauptordner'}
                                                />
                                            );
                                        })}
                                    </ResultSection>
                                )}

                                {/* Events */}
                                {results.events.length > 0 && can('events:read') && (
                                    <ResultSection title="Termine" icon={Calendar}>
                                        {results.events.map((event, idx) => {
                                            const globalIdx = getGlobalIndex(results, 'events', idx, can);
                                            const dateStr = (() => {
                                                try { return format(new Date(event.date), 'dd. MMM yyyy', { locale: de }); }
                                                catch { return event.date; }
                                            })();
                                            return (
                                                <ResultItem
                                                    key={`event-${event.id}`}
                                                    isActive={activeIndex === globalIdx}
                                                    onClick={() => handleResultClick(`/member/events/${event.id}`)}
                                                    onMouseEnter={() => setActiveIndex(globalIdx)}
                                                    icon={<Calendar className="h-4 w-4 text-primary" />}
                                                    primary={event.title}
                                                    secondary={`${dateStr} · ${event.startTime} · ${getCategoryLabel(event.category)}`}
                                                />
                                            );
                                        })}
                                    </ResultSection>
                                )}

                                {/* Members */}
                                {results.members.length > 0 && can('members:read') && (
                                    <ResultSection title="Mitglieder" icon={Users}>
                                        {results.members.map((member, idx) => {
                                            const globalIdx = getGlobalIndex(results, 'members', idx, can);
                                            return (
                                                <ResultItem
                                                    key={`member-${member.id}`}
                                                    isActive={activeIndex === globalIdx}
                                                    onClick={() => handleResultClick(`/member/members/${member.id}`)}
                                                    onMouseEnter={() => setActiveIndex(globalIdx)}
                                                    icon={
                                                        member.profilePicture ? (
                                                            <img src={member.profilePicture} alt="" className="h-6 w-6 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                                                                {member.firstName[0]}{member.lastName[0]}
                                                            </div>
                                                        )
                                                    }
                                                    primary={`${member.firstName} ${member.lastName}`}
                                                    secondary={member.register?.name ?? (member.role === 'admin' ? 'Admin' : 'Mitglied')}
                                                />
                                            );
                                        })}
                                    </ResultSection>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── Footer keyboard hints (desktop only) ─────────────────── */}
                    {totalResults > 0 && (
                        <div className="hidden sm:flex border-t border-border px-4 py-2 items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                            <span>↑↓ Navigieren</span>
                            <span>↵ Öffnen</span>
                            <span>Esc Schließen</span>
                        </div>
                    )}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ResultSection({
    title,
    icon: Icon,
    children,
}: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
}) {
    return (
        <div className="mb-1">
            <div className="flex items-center gap-1.5 px-4 py-1.5">
                <Icon className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {title}
                </span>
            </div>
            {children}
        </div>
    );
}

function ResultItem({
    isActive,
    onClick,
    onMouseEnter,
    icon,
    primary,
    secondary,
}: {
    isActive: boolean;
    onClick: () => void;
    onMouseEnter: () => void;
    icon: React.ReactNode;
    primary: string;
    secondary?: string;
}) {
    return (
        <button
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                isActive ? 'bg-primary text-white' : 'hover:bg-muted'
            )}
        >
            <div
                className={cn(
                    'flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center',
                    isActive ? 'bg-white/20' : 'bg-muted'
                )}
            >
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p
                    className={cn(
                        'text-sm font-medium truncate',
                        isActive ? 'text-white' : 'text-foreground'
                    )}
                >
                    {primary}
                </p>
                {secondary && (
                    <p
                        className={cn(
                            'text-xs truncate mt-0.5',
                            isActive ? 'text-white/70' : 'text-muted-foreground'
                        )}
                    >
                        {secondary}
                    </p>
                )}
            </div>
        </button>
    );
}

// ─── Utilities for keyboard navigation ────────────────────────────────────────

type ResultType = 'files' | 'folders' | 'events' | 'members';

interface FlatResult {
    href: string;
    type: ResultType;
}

function buildFlatResults(results: SearchResults, can: (p: string) => boolean): FlatResult[] {
    const flat: FlatResult[] = [];
    if (can('files:read')) {
        results.files.forEach((f) => flat.push({ href: `/member/files?fileId=${f.id}`, type: 'files' }));
    }
    if (can('folders:read')) {
        results.folders.forEach((f) => flat.push({ href: `/member/files?folderId=${f.id}`, type: 'folders' }));
    }
    if (can('events:read')) {
        results.events.forEach((e) => flat.push({ href: `/member/events/${e.id}`, type: 'events' }));
    }
    if (can('members:read')) {
        results.members.forEach((m) => flat.push({ href: `/member/members/${m.id}`, type: 'members' }));
    }
    return flat;
}

/**
 * Returns the global (flat) index for a specific item so keyboard nav and
 * mouse hover stay in sync across all visible category sections.
 */
function getGlobalIndex(
    results: SearchResults,
    type: ResultType,
    localIdx: number,
    can: (p: string) => boolean
): number {
    let offset = 0;
    const order: { type: ResultType; permission: string }[] = [
        { type: 'files', permission: 'files:read' },
        { type: 'folders', permission: 'folders:read' },
        { type: 'events', permission: 'events:read' },
        { type: 'members', permission: 'members:read' },
    ];
    for (const entry of order) {
        if (entry.type === type) break;
        if (can(entry.permission)) offset += results[entry.type].length;
    }
    return offset + localIdx;
}

export default GlobalSearch;
