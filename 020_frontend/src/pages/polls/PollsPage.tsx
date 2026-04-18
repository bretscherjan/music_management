import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useCan, useAuth } from '@/context/AuthContext';
import { useMarkRead } from '@/context/UnreadContext';
import { pollService } from '@/services/pollService';
import api from '@/lib/api';
import { PageHeader } from '@/components/common/PageHeader';
import {
    exportPollAnalyticsPdf,
    DEFAULT_POLL_PDF_OPTIONS,
} from '@/utils/pollPdfExport';
import type { PollPdfOptions } from '@/utils/pollPdfExport';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetClose,
} from '@/components/ui/sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';

import {
    Plus,
    BarChart2,
    MoreVertical,
    Pencil,
    Trash2,
    SlidersHorizontal,
    CheckCircle2,
    Lock,
    Users,
    EyeOff,
    CalendarDays,
    XCircle,
    Check,
    X,
    FileDown,
} from 'lucide-react';

import type {
    Poll,
    PollKind,
    PollType,
    PollAnonymity,
    PollResultsVisibility,
    PollStatus,
    PollOption,
    PollOptionResult,
    PollTextAnswerResult,
    PollAnalyticsData,
    CreatePollDto,
    UpdatePollDto,
    CreatePollAudienceRuleDto,
} from '@/types';

// ─── Local types ──────────────────────────────────────────────────────────────

type FilterTab = 'active' | 'archiv' | 'my-votes';

interface Register {
    id: number;
    name: string;
}

interface Member {
    id: number;
    firstName: string;
    lastName: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isPollClosed(poll: Poll): boolean {
    if (poll.status === 'CLOSED') return true;
    if (poll.endsAt && new Date() > new Date(poll.endsAt)) return true;
    return false;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('de-CH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function formatDateInput(iso: string | null | undefined): string {
    if (!iso) return '';
    return iso.split('T')[0];
}

// ─── PollKind Badge ───────────────────────────────────────────────────────────

function PollKindBadge({ kind }: { kind: PollKind }) {
    if (kind === 'VOTE') {
        return (
            <Badge className="bg-purple-100 text-purple-700 border-0 text-[11px]">
                Abstimmung
            </Badge>
        );
    }
    return (
        <Badge className="bg-blue-100 text-blue-700 border-0 text-[11px]">
            Umfrage
        </Badge>
    );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function PollStatusBadge({ poll }: { poll: Poll }) {
    const closed = isPollClosed(poll);
    if (closed) {
        return (
            <Badge className="gap-1 bg-muted text-muted-foreground border-0 text-[11px]">
                <XCircle className="h-3 w-3" />
                Geschlossen
            </Badge>
        );
    }
    return (
        <Badge className="gap-1 bg-emerald-100 text-emerald-700 border-0 text-[11px]">
            <CheckCircle2 className="h-3 w-3" />
            Aktiv
        </Badge>
    );
}

// ─── Result Bars (VOTE polls) ────────────────────────────────────────────────

function ResultBars({ poll }: { poll: Poll }) {
    const options = poll.summary?.options ?? [];
    return (
        <div className="space-y-3">
            {options.map((opt: PollOptionResult) => {
                const isMyVote = poll.myVoteOptionIds.includes(opt.id);
                return (
                    <div key={opt.id} className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                            <span className={cn('text-sm flex-1', isMyVote && 'font-semibold text-[hsl(359,100%,45%)]')}>
                                {isMyVote && <Check className="inline h-3.5 w-3.5 mr-1 text-[hsl(359,100%,45%)]" />}
                                {opt.text}
                            </span>
                            <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                                {opt.percentage}% · {opt.voteCount}
                            </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${opt.percentage}%`,
                                    backgroundColor: isMyVote
                                        ? 'hsl(359,100%,45%)'
                                        : 'hsl(359,100%,45%,0.3)',
                                }}
                            />
                        </div>
                        {opt.voters && opt.voters.length > 0 && (
                            <p className="text-[10px] text-muted-foreground pl-0.5">
                                {opt.voters.map(v => `${v.firstName ?? ''} ${v.lastName ?? ''}`.trim()).join(', ')}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Survey Text Answers (SURVEY polls) ──────────────────────────────────────

function SurveyAnswers({ poll }: { poll: Poll }) {
    const answers: PollTextAnswerResult[] = poll.summary?.textAnswers ?? [];
    if (answers.length === 0) {
        return (
            <p className="text-xs text-muted-foreground italic">
                Noch keine Antworten vorhanden.
            </p>
        );
    }
    return (
        <div className="space-y-2">
            {answers.map((ta, idx) => (
                <div key={idx} className="rounded-xl bg-muted/50 px-3 py-2.5">
                    <p className="text-sm">{ta.answer}</p>
                    {(ta.firstName || ta.lastName) && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                            — {ta.firstName} {ta.lastName}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}

// ─── Voting Form ──────────────────────────────────────────────────────────────

function VotingForm({
    poll,
    onVote,
    isVoting,
}: {
    poll: Poll;
    onVote: (optionIds: number[], textAnswer?: string) => void;
    isVoting: boolean;
}) {
    const [selected, setSelected] = useState<number[]>(poll.myVoteOptionIds);
    const [textAnswer, setTextAnswer] = useState(poll.myTextAnswer ?? '');
    const [customText, setCustomText] = useState('');
    const [isAddingOption, setIsAddingOption] = useState(false);
    const queryClient = useQueryClient();

    const addOptionMutation = useMutation({
        mutationFn: (text: string) => pollService.addCustomOption(poll.id, text),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['polls'] });
            setCustomText('');
            setIsAddingOption(false);
            toast.success('Option hinzugefügt');
        },
        onError: () => toast.error('Fehler beim Hinzufügen der Option'),
    });

    // ── SURVEY: free-text input ──────────────────────────────────────────────
    if (poll.pollKind === 'SURVEY') {
        return (
            <div className="space-y-3 pt-1">
                {poll.hasVoted && poll.myTextAnswer && (
                    <p className="text-xs text-muted-foreground">
                        Deine aktuelle Antwort: <span className="font-medium text-foreground">„{poll.myTextAnswer}"</span>
                    </p>
                )}
                <Textarea
                    placeholder="Deine Antwort…"
                    value={textAnswer}
                    onChange={e => setTextAnswer(e.target.value)}
                    rows={3}
                    className="resize-none rounded-xl"
                    maxLength={2000}
                />
                <Button
                    className="w-full h-11 rounded-xl"
                    style={{ backgroundColor: 'hsl(359,100%,45%)' }}
                    disabled={!textAnswer.trim() || isVoting}
                    onClick={() => onVote([], textAnswer.trim())}
                >
                    {isVoting
                        ? 'Wird gespeichert...'
                        : poll.hasVoted
                            ? 'Antwort aktualisieren'
                            : 'Absenden'}
                </Button>
            </div>
        );
    }

    // ── VOTE: option selection ───────────────────────────────────────────────
    const options: PollOption[] = poll.options ?? [];
    const maxChoices = poll.type === 'MULTIPLE' ? (poll.maxChoices > 1 ? poll.maxChoices : options.length) : 1;
    const limitReached = poll.type === 'MULTIPLE' && selected.length >= maxChoices;

    const toggleOption = (optId: number) => {
        if (poll.type === 'SINGLE') {
            setSelected([optId]);
        } else {
            setSelected(prev => {
                if (prev.includes(optId)) return prev.filter(id => id !== optId);
                if (prev.length >= maxChoices) return prev;
                return [...prev, optId];
            });
        }
    };

    const maxChoicesHint = poll.type === 'MULTIPLE'
        ? limitReached
            ? `Maximale Auswahl erreicht (${maxChoices})`
            : `Wähle bis zu ${maxChoices} Option${maxChoices !== 1 ? 'en' : ''}`
        : null;

    return (
        <div className="space-y-2 pt-1">
            {maxChoicesHint && (
                <p className={cn('text-xs', limitReached ? 'text-[hsl(359,100%,45%)] font-medium' : 'text-muted-foreground')}>
                    {maxChoicesHint}
                </p>
            )}
            {options.map((opt) => {
                const isChecked = selected.includes(opt.id);
                const isDisabled = !isChecked && limitReached && poll.type === 'MULTIPLE';
                return (
                    <button
                        key={opt.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => toggleOption(opt.id)}
                        className={cn(
                            'w-full min-h-[48px] flex items-center gap-3 px-4 rounded-xl border text-sm font-medium transition-all',
                            isChecked
                                ? 'bg-red-50 border-[hsl(359,100%,45%)] text-[hsl(359,100%,45%)]'
                                : isDisabled
                                    ? 'bg-muted/40 border-border text-muted-foreground opacity-50 cursor-not-allowed'
                                    : 'bg-card border-border hover:bg-muted/60 text-foreground'
                        )}
                    >
                        <span
                            className={cn(
                                'flex-shrink-0 flex items-center justify-center border-2 transition-all',
                                poll.type === 'SINGLE' ? 'w-4 h-4 rounded-full' : 'w-4 h-4 rounded',
                                isChecked
                                    ? 'border-[hsl(359,100%,45%)] bg-[hsl(359,100%,45%)]'
                                    : 'border-border bg-background'
                            )}
                        >
                            {isChecked && <Check className="h-2.5 w-2.5 text-white" />}
                        </span>
                        <span className="flex-1 text-left">{opt.text}</span>
                        {opt.addedBy && (
                            <span className="text-[10px] text-muted-foreground">
                                +{opt.addedBy.firstName}
                            </span>
                        )}
                    </button>
                );
            })}

            {poll.allowCustomOptions && !isPollClosed(poll) && (
                <div>
                    {isAddingOption ? (
                        <div className="flex gap-2 mt-2">
                            <Input
                                autoFocus
                                placeholder="Eigene Option..."
                                value={customText}
                                onChange={e => setCustomText(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && customText.trim()) {
                                        addOptionMutation.mutate(customText.trim());
                                    } else if (e.key === 'Escape') {
                                        setIsAddingOption(false);
                                    }
                                }}
                                className="h-10"
                                maxLength={200}
                            />
                            <Button
                                size="sm"
                                onClick={() => customText.trim() && addOptionMutation.mutate(customText.trim())}
                                disabled={!customText.trim() || addOptionMutation.isPending}
                                className="h-10"
                            >
                                OK
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsAddingOption(false)}
                                className="h-10"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setIsAddingOption(true)}
                            className="w-full h-11 flex items-center gap-2 px-4 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors mt-1"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Eigene Option hinzufügen...
                        </button>
                    )}
                </div>
            )}

            <Button
                className="w-full mt-3 h-11 rounded-xl"
                style={{ backgroundColor: 'hsl(359,100%,45%)' }}
                disabled={selected.length === 0 || isVoting}
                onClick={() => onVote(selected)}
            >
                {isVoting ? 'Wird gespeichert...' : poll.hasVoted ? 'Stimme ändern' : 'Abstimmen'}
            </Button>
        </div>
    );
}

// ─── Poll Card ────────────────────────────────────────────────────────────────

function PollCard({
    poll,
    onEdit,
    onDelete,
    onAnalytics,
    canManage,
    highlighted = false,
}: {
    poll: Poll;
    onEdit: (poll: Poll) => void;
    onDelete: (poll: Poll) => void;
    onAnalytics: (poll: Poll) => void;
    canManage: boolean;
    highlighted?: boolean;
}) {
    const [showChangeVote, setShowChangeVote] = useState(false);
    const queryClient = useQueryClient();

    const voteMutation = useMutation({
        mutationFn: (payload: { optionIds: number[]; textAnswer?: string }) =>
            pollService.castVote(poll.id, payload),
        onSuccess: (data) => {
            queryClient.setQueryData<Poll[]>(['polls'], (old = []) =>
                old.map(p =>
                    p.id === poll.id
                        ? {
                            ...p,
                            hasVoted: data.hasVoted,
                            myVoteOptionIds: data.myVoteOptionIds,
                            myTextAnswer: data.myTextAnswer ?? null,
                            showResults: data.showResults,
                            summary: data.summary ?? p.summary,
                        }
                        : p
                )
            );
            toast.success(poll.pollKind === 'SURVEY' ? 'Antwort gespeichert!' : 'Stimme abgegeben!');
            setShowChangeVote(false);
        },
        onError: () => toast.error('Fehler beim Abstimmen'),
    });

    const closed = isPollClosed(poll);
    const totalParticipants = poll.summary?.totalParticipants ?? 0;

    const showResults = poll.showResults && !!poll.summary;
    const showVoteForm = !closed && (!poll.hasVoted || showChangeVote);

    return (
        <div
            id={`poll-${poll.id}`}
            className={cn(
                'bg-white rounded-2xl overflow-hidden shadow-sm transition-all duration-500',
                highlighted && 'ring-2 ring-primary shadow-lg'
            )}
        >
            {/* Header */}
            <div className="px-4 pt-4 pb-2 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                        <PollKindBadge kind={poll.pollKind} />
                        <PollStatusBadge poll={poll} />
                        {poll.type === 'MULTIPLE' && (
                            <Badge variant="outline" className="text-[10px] h-5">Mehrfachauswahl</Badge>
                        )}
                        {poll.anonymity === 'FULLY_ANONYMOUS' && (
                            <Badge variant="outline" className="gap-1 text-[10px] h-5">
                                <EyeOff className="h-2.5 w-2.5" />Anonym
                            </Badge>
                        )}
                    </div>
                    <h3 className="font-semibold text-base leading-snug">{poll.title}</h3>
                </div>

                {canManage && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 -mt-1 -mr-1">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(poll)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAnalytics(poll)}>
                                <BarChart2 className="h-4 w-4 mr-2" />
                                Analytics
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => onDelete(poll)}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Löschen
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {/* Question */}
            <div className="px-4 pb-3">
                <p className="text-sm text-foreground/80">{poll.question}</p>
            </div>

            {/* Body: Results or Voting */}
            <div className="px-4 pb-4">
                {showResults && !showVoteForm && (
                    <div className="space-y-3">
                        {poll.pollKind === 'SURVEY'
                            ? <SurveyAnswers poll={poll} />
                            : <ResultBars poll={poll} />
                        }
                        {!closed && poll.hasVoted && (
                            <button
                                type="button"
                                className="text-xs text-[hsl(359,100%,45%)] hover:underline underline-offset-2 mt-1"
                                onClick={() => setShowChangeVote(true)}
                            >
                                {poll.pollKind === 'SURVEY' ? 'Antwort ändern' : 'Stimme ändern'}
                            </button>
                        )}
                    </div>
                )}

                {showVoteForm && (
                    <VotingForm
                        poll={poll}
                        onVote={(ids, textAnswer) => voteMutation.mutate({ optionIds: ids, textAnswer })}
                        isVoting={voteMutation.isPending}
                    />
                )}

                {!showResults && !showVoteForm && closed && (
                    <p className="text-xs text-muted-foreground italic">
                        {poll.resultsVisibility === 'ADMINS_ONLY'
                            ? 'Ergebnisse nur für Admins sichtbar'
                            : 'Abstimmung geschlossen'}
                    </p>
                )}

                {!showResults && !showVoteForm && !closed && poll.hasVoted && (
                    <p className="text-sm text-muted-foreground italic">
                        {poll.pollKind === 'SURVEY'
                            ? 'Danke für deine Antwort! Ergebnisse werden nach der Umfrage sichtbar.'
                            : 'Danke für deine Stimme! Ergebnisse werden nach der Abstimmung sichtbar.'}
                    </p>
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-border/50 flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
                <span className="text-[11px]">
                    Erstellt von {poll.createdBy.firstName} {poll.createdBy.lastName}
                </span>
                {poll.endsAt && (
                    <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        bis {formatDate(poll.endsAt)}
                    </span>
                )}
                {/* Audience summary */}
                {poll.audienceRules && poll.audienceRules.length > 0 ? (
                    <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Für: {poll.audienceRules
                            .map(r => {
                                if (r.targetType === 'ALL') return 'Alle';
                                if (r.targetType === 'REGISTER') return r.register?.name ?? `Register #${r.registerId}`;
                                return r.user ? `${r.user.firstName} ${r.user.lastName}` : `Mitglied #${r.userId}`;
                            })
                            .join(', ')}
                    </span>
                ) : (
                    <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Alle Mitglieder
                    </span>
                )}
                <span className="ml-auto flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {totalParticipants}
                </span>
                {poll.resultsVisibility === 'ADMINS_ONLY' && (
                    <span className="flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Nur Admins
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── Delete Poll Dialog ───────────────────────────────────────────────────────

function DeletePollDialog({
    poll,
    onClose,
}: {
    poll: Poll | null;
    onClose: () => void;
}) {
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: () => pollService.delete(poll!.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['polls'] });
            toast.success('Abstimmung gelöscht');
            onClose();
        },
        onError: () => toast.error('Fehler beim Löschen'),
    });

    return (
        <Dialog open={!!poll} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Abstimmung löschen</DialogTitle>
                    <DialogDescription>
                        Möchtest du &ldquo;{poll?.title}&rdquo; wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Abbrechen
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => deleteMutation.mutate()}
                        disabled={deleteMutation.isPending}
                    >
                        {deleteMutation.isPending ? 'Löschen...' : 'Löschen'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Analytics PDF Export Dialog ─────────────────────────────────────────────

function AnalyticsPdfDialog({
    open,
    data,
    onClose,
}: {
    open: boolean;
    data: PollAnalyticsData | null;
    onClose: () => void;
}) {
    const [opts, setOpts] = useState<PollPdfOptions>({ ...DEFAULT_POLL_PDF_OPTIONS });
    const isSurvey = data?.poll.pollKind === 'SURVEY';
    const canIncludeVoters = data?.poll.anonymity !== 'FULLY_ANONYMOUS';
    const voterLabel = isSurvey ? 'Namen der Teilnehmer einschliessen' : 'Wählernamen einschliessen';

    const handleExport = () => {
        if (!data) return;
        exportPollAnalyticsPdf(data, opts);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>PDF exportieren</DialogTitle>
                    <DialogDescription>Wähle die Exportoptionen.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dokument</p>
                        {(
                            [
                                { key: 'showAssocName', label: 'Vereinsname anzeigen' },
                                { key: 'showDocTitle', label: 'Dokumenttitel anzeigen' },
                                { key: 'showDate', label: 'Datum anzeigen' },
                                { key: 'showPageNumbers', label: 'Seitenzahlen anzeigen' },
                            ] as { key: keyof PollPdfOptions; label: string }[]
                        ).map(({ key, label }) => (
                            <div key={key} className="flex items-center justify-between">
                                <Label htmlFor={`pdf-${key}`} className="text-sm font-normal cursor-pointer">{label}</Label>
                                <Switch
                                    id={`pdf-${key}`}
                                    checked={opts[key] as boolean}
                                    onCheckedChange={(v) => setOpts(o => ({ ...o, [key]: v }))}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="space-y-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Inhalt</p>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="pdf-voters" className={cn('text-sm font-normal cursor-pointer', !canIncludeVoters && 'opacity-40')}>
                                {voterLabel}
                            </Label>
                            <Switch
                                id="pdf-voters"
                                checked={opts.includeVoterNames}
                                disabled={!canIncludeVoters}
                                onCheckedChange={(v) => setOpts(o => ({ ...o, includeVoterNames: v }))}
                            />
                        </div>
                        {!isSurvey && (
                            <div className="flex items-center justify-between">
                                <Label htmlFor="pdf-detailed" className="text-sm font-normal cursor-pointer">
                                    Detaillierte Statistiken
                                </Label>
                                <Switch
                                    id="pdf-detailed"
                                    checked={opts.includeDetailedStats}
                                    onCheckedChange={(v) => setOpts(o => ({ ...o, includeDetailedStats: v }))}
                                />
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose}>Abbrechen</Button>
                    <Button onClick={handleExport} style={{ backgroundColor: 'hsl(359,100%,45%)' }}>
                        <FileDown className="h-4 w-4 mr-1.5" />
                        Exportieren
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Analytics Sheet ──────────────────────────────────────────────────────────

function AnalyticsSheet({
    pollId,
    open,
    onClose,
}: {
    pollId: number | null;
    open: boolean;
    onClose: () => void;
}) {
    const [showPdfDialog, setShowPdfDialog] = useState(false);

    const analyticsQuery = useQuery({
        queryKey: ['poll-analytics', pollId],
        queryFn: () => pollService.getAnalytics(pollId!),
        enabled: open && pollId !== null,
    });

    const data = analyticsQuery.data ?? null;
    const analytics = data?.analytics;
    const poll = data?.poll;
    const isSurveyPoll = poll?.pollKind === 'SURVEY';

    const chartData = analytics?.options.map(o => ({
        name: o.text.length > 20 ? o.text.slice(0, 20) + '…' : o.text,
        fullName: o.text,
        voteCount: o.voteCount,
        percentage: o.percentage,
    })) ?? [];

    const showVoters = poll && poll.anonymity !== 'FULLY_ANONYMOUS' && analytics && analytics.voters.length > 0;

    const optionById: Record<number, string> = {};
    analytics?.options.forEach(o => { optionById[o.id] = o.text; });

    return (
        <>
            <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
                <SheetContent side="bottom" className="h-[92dvh] overflow-y-auto rounded-t-2xl pb-safe">
                    <SheetHeader className="mb-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <SheetTitle className="text-left">Analytics</SheetTitle>
                                {poll && (
                                    <p className="text-sm text-muted-foreground mt-0.5 text-left">{poll.title}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {data && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-9 gap-1.5"
                                        onClick={() => setShowPdfDialog(true)}
                                    >
                                        <FileDown className="h-4 w-4" />
                                        PDF
                                    </Button>
                                )}
                                <SheetClose asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </SheetClose>
                            </div>
                        </div>
                    </SheetHeader>

                    {analyticsQuery.isLoading && (
                        <div className="space-y-3 px-1">
                            <Skeleton className="h-16 rounded-xl" />
                            <Skeleton className="h-48 rounded-xl" />
                        </div>
                    )}

                    {analyticsQuery.isError && (
                        <p className="text-sm text-destructive text-center py-8">Fehler beim Laden der Analytics</p>
                    )}

                    {data && analytics && (
                        <div className="space-y-6 px-1">
                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-muted rounded-2xl p-4 text-center">
                                    <p className="text-3xl font-bold">{analytics.totalParticipants}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Teilnehmer</p>
                                </div>
                                <div className="bg-muted rounded-2xl p-4 text-center">
                                    <p className="text-3xl font-bold">{analytics.totalVotes}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{isSurveyPoll ? 'Antworten' : 'Stimmen'}</p>
                                </div>
                            </div>

                            {/* SURVEY: Text answers list */}
                            {isSurveyPoll && (
                                <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                                    <p className="text-sm font-medium px-4 pt-4 pb-2">Freitextantworten</p>
                                    {(analytics.textAnswers ?? []).length === 0 ? (
                                        <p className="text-sm text-muted-foreground px-4 pb-4 italic">Noch keine Antworten vorhanden.</p>
                                    ) : (
                                        <div className="divide-y divide-border/50">
                                            {(analytics.textAnswers ?? []).map((ta, idx) => (
                                                <div key={idx} className="px-4 py-3">
                                                    <p className="text-sm">{ta.answer}</p>
                                                    {(ta.firstName || ta.lastName) && poll.anonymity !== 'FULLY_ANONYMOUS' && (
                                                        <p className="text-[10px] text-muted-foreground mt-1">
                                                            — {ta.firstName} {ta.lastName}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* VOTE: Bar Chart */}
                            {!isSurveyPoll && chartData.length > 0 && (
                                <div className="bg-white rounded-2xl p-4 shadow-sm">
                                    <p className="text-sm font-medium mb-3">Ergebnisse</p>
                                    <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 48)}>
                                        <BarChart
                                            data={chartData}
                                            layout="vertical"
                                            margin={{ top: 0, right: 40, left: 8, bottom: 0 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" tick={{ fontSize: 11 }} />
                                            <YAxis
                                                type="category"
                                                dataKey="name"
                                                tick={{ fontSize: 11 }}
                                                width={120}
                                            />
                                            <Tooltip
                                                formatter={(value, _name, props: any) => [
                                                    `${value} Stimmen (${props.payload?.percentage ?? 0}%)`,
                                                    props.payload?.fullName ?? '',
                                                ]}
                                            />
                                            <Bar dataKey="voteCount" radius={[0, 4, 4, 0]}>
                                                {chartData.map((_entry, index) => (
                                                    <Cell key={index} fill="#E60004" />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {/* VOTE: Voter list */}
                            {!isSurveyPoll && showVoters && (
                                <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                                    <p className="text-sm font-medium px-4 pt-4 pb-2">Teilnehmer & Auswahl</p>
                                    <div className="divide-y divide-border/50">
                                        {analytics.voters.map((voter) => (
                                            <div key={voter.id} className="px-4 py-2.5 flex items-start justify-between gap-3">
                                                <span className="text-sm font-medium">
                                                    {voter.firstName} {voter.lastName}
                                                </span>
                                                <span className="text-xs text-muted-foreground text-right">
                                                    {(voter.optionIds ?? [])
                                                        .map(oid => optionById[oid] ?? `Option ${oid}`)
                                                        .join(', ')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            <AnalyticsPdfDialog
                open={showPdfDialog}
                data={data}
                onClose={() => setShowPdfDialog(false)}
            />
        </>
    );
}

// ─── Audience Chip ────────────────────────────────────────────────────────────

function AudienceChip({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-xs font-medium">
            {label}
            <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
            </button>
        </span>
    );
}

// ─── Create / Edit Poll Dialog ────────────────────────────────────────────────

interface PollFormOption {
    id?: number;   // undefined = new option
    text: string;
}

interface PollFormState {
    title: string;
    question: string;
    pollKind: PollKind;
    type: PollType;
    maxChoices: number;
    anonymity: PollAnonymity;
    resultsVisibility: PollResultsVisibility;
    allowCustomOptions: boolean;
    status: PollStatus;
    endsAt: string;
    options: PollFormOption[];
    audienceRules: CreatePollAudienceRuleDto[];
}

const DEFAULT_FORM: PollFormState = {
    title: '',
    question: '',
    pollKind: 'SURVEY',
    type: 'SINGLE',
    maxChoices: 2,
    anonymity: 'VISIBLE_TO_ADMINS',
    resultsVisibility: 'AFTER_VOTE',
    allowCustomOptions: false,
    status: 'ACTIVE',
    endsAt: '',
    options: [{ text: '' }, { text: '' }],
    audienceRules: [],
};

function pollToForm(poll: Poll): PollFormState {
    return {
        title: poll.title,
        question: poll.question,
        pollKind: poll.pollKind,
        type: poll.type,
        maxChoices: poll.maxChoices > 1 ? poll.maxChoices : 2,
        anonymity: poll.anonymity,
        resultsVisibility: poll.resultsVisibility,
        allowCustomOptions: poll.allowCustomOptions,
        status: poll.status,
        endsAt: formatDateInput(poll.endsAt),
        options: poll.options?.map(o => ({ id: o.id, text: o.text })) ?? [{ text: '' }, { text: '' }],
        audienceRules: poll.audienceRules?.map(r => ({
            targetType: r.targetType,
            userId: r.userId,
            registerId: r.registerId,
        })) ?? [],
    };
}

function CreatePollDialog({
    open,
    editPoll,
    onClose,
}: {
    open: boolean;
    editPoll?: Poll | null;
    onClose: () => void;
}) {
    const queryClient = useQueryClient();
    const isEdit = !!editPoll;

    const [form, setForm] = useState<PollFormState>(DEFAULT_FORM);

    useEffect(() => {
        if (open) {
            setForm(editPoll ? pollToForm(editPoll) : { ...DEFAULT_FORM });
        }
    }, [open, editPoll]);

    const registersQuery = useQuery<Register[]>({
        queryKey: ['registers'],
        queryFn: () => api.get('/registers').then(r => r.data.registers),
        enabled: open,
    });

    const membersQuery = useQuery<Member[]>({
        queryKey: ['users'],
        queryFn: () => api.get('/users').then(r => r.data.users),
        enabled: open,
    });

    const registers: Register[] = registersQuery.data ?? [];
    const members: Member[] = membersQuery.data ?? [];

    const createMutation = useMutation({
        mutationFn: (data: CreatePollDto) => pollService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['polls'] });
            toast.success('Abstimmung erstellt');
            onClose();
        },
        onError: () => toast.error('Fehler beim Erstellen der Abstimmung'),
    });

    const updateMutation = useMutation({
        mutationFn: (data: UpdatePollDto) => pollService.update(editPoll!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['polls'] });
            toast.success('Abstimmung aktualisiert');
            onClose();
        },
        onError: () => toast.error('Fehler beim Aktualisieren'),
    });

    const isPending = createMutation.isPending || updateMutation.isPending;

    const set = <K extends keyof PollFormState>(key: K, value: PollFormState[K]) =>
        setForm(f => ({ ...f, [key]: value }));

    const handleSubmit = () => {
        if (!form.title.trim() || !form.question.trim()) {
            toast.error('Titel und Frage sind erforderlich');
            return;
        }

        const isSurvey = form.pollKind === 'SURVEY';

        // Options validation only for VOTE polls
        if (!isSurvey) {
            const filledCount = form.options.filter(o => o.text.trim().length > 0).length;
            if (filledCount < 2) {
                toast.error('Mindestens 2 Optionen erforderlich');
                return;
            }
            if (form.type === 'MULTIPLE' && form.maxChoices < 2) {
                toast.error('Max. Stimmen muss mindestens 2 sein');
                return;
            }
        }

        const filledOptions = form.options
            .map(o => ({ ...o, text: o.text.trim() }))
            .filter(o => o.text.length > 0);

        const audienceRules = form.audienceRules.length > 0 ? form.audienceRules : undefined;
        const endsAt = form.endsAt ? new Date(form.endsAt).toISOString() : null;

        if (isEdit) {
            const dto: UpdatePollDto = {
                title: form.title.trim(),
                question: form.question.trim(),
                pollKind: form.pollKind,
                type: isSurvey ? 'SINGLE' : form.type,
                maxChoices: (!isSurvey && form.type === 'MULTIPLE') ? form.maxChoices : 1,
                anonymity: form.anonymity,
                resultsVisibility: form.resultsVisibility,
                allowCustomOptions: isSurvey ? false : form.allowCustomOptions,
                status: form.status,
                endsAt,
                audienceRules,
                options: isSurvey ? undefined : filledOptions,
            };
            updateMutation.mutate(dto);
        } else {
            const dto: CreatePollDto = {
                title: form.title.trim(),
                question: form.question.trim(),
                pollKind: form.pollKind,
                type: isSurvey ? 'SINGLE' : form.type,
                maxChoices: (!isSurvey && form.type === 'MULTIPLE') ? form.maxChoices : 1,
                anonymity: form.anonymity,
                resultsVisibility: form.resultsVisibility,
                allowCustomOptions: isSurvey ? false : form.allowCustomOptions,
                endsAt,
                options: isSurvey ? [] : filledOptions.map(o => o.text),
                audienceRules,
            };
            createMutation.mutate(dto);
        }
    };

    const updateOption = (idx: number, val: string) =>
        setForm(f => {
            const opts = [...f.options];
            opts[idx] = { ...opts[idx], text: val };
            return { ...f, options: opts };
        });

    const addOption = () => setForm(f => ({ ...f, options: [...f.options, { text: '' }] }));

    const removeOption = (idx: number) =>
        setForm(f => ({ ...f, options: f.options.filter((_, i) => i !== idx) }));

    const addAudienceRule = (rule: CreatePollAudienceRuleDto) => {
        const exists = form.audienceRules.some(
            r => r.targetType === rule.targetType &&
                r.userId === rule.userId &&
                r.registerId === rule.registerId
        );
        if (!exists) setForm(f => ({ ...f, audienceRules: [...f.audienceRules, rule] }));
    };

    const removeAudienceRule = (idx: number) =>
        setForm(f => ({ ...f, audienceRules: f.audienceRules.filter((_, i) => i !== idx) }));

    const getAudienceLabel = (rule: CreatePollAudienceRuleDto): string => {
        if (rule.targetType === 'ALL') return 'Alle Mitglieder';
        if (rule.targetType === 'REGISTER') {
            const reg = registers.find(r => r.id === rule.registerId);
            return reg ? `Register: ${reg.name}` : `Register #${rule.registerId}`;
        }
        const m = members.find(m => m.id === rule.userId);
        return m ? `${m.firstName} ${m.lastName}` : `Mitglied #${rule.userId}`;
    };

    const selectCls = "w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer";
    const isSurveyMode = form.pollKind === 'SURVEY';

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Abstimmung bearbeiten' : 'Neue Abstimmung'}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? 'Ändere die Einstellungen der Abstimmung.' : 'Erstelle eine neue Abstimmung.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* ── Section: Allgemein ──────────────────────────────── */}
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Allgemein</p>

                    {/* Title */}
                    <div className="space-y-1.5">
                        <Label htmlFor="poll-title">Titel</Label>
                        <Input
                            id="poll-title"
                            placeholder="z. B. Vereinsausflug 2025"
                            value={form.title}
                            onChange={e => set('title', e.target.value)}
                            maxLength={200}
                        />
                    </div>

                    {/* Question */}
                    <div className="space-y-1.5">
                        <Label htmlFor="poll-question">Frage</Label>
                        <Textarea
                            id="poll-question"
                            placeholder="z. B. Wohin soll der Ausflug gehen?"
                            value={form.question}
                            onChange={e => set('question', e.target.value)}
                            rows={2}
                            className="resize-none rounded-xl"
                        />
                    </div>

                    {/* Type: Umfrage / Abstimmung */}
                    <div className="space-y-1.5">
                        <Label>Art</Label>
                        <div className="segmented-control">
                            <button
                                type="button"
                                className={cn('segmented-control-option', form.pollKind === 'SURVEY' && 'is-active')}
                                onClick={() => set('pollKind', 'SURVEY')}
                            >
                                Umfrage
                            </button>
                            <button
                                type="button"
                                className={cn('segmented-control-option', form.pollKind === 'VOTE' && 'is-active')}
                                onClick={() => set('pollKind', 'VOTE')}
                            >
                                Abstimmung
                            </button>
                        </div>
                        {isSurveyMode && (
                            <p className="text-[11px] text-muted-foreground">
                                Mitglieder geben eine freitextliche Antwort. Keine vordefinierten Optionen.
                            </p>
                        )}
                    </div>

                    <div className="border-t border-border/60" />
                    {/* ── Section: Einstellungen ──────────────────────────── */}
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Einstellungen</p>

                    {/* Choice type — VOTE only */}
                    {!isSurveyMode && (
                    <div className="space-y-1.5">
                        <Label>Auswahltyp</Label>
                        <div className="flex items-center justify-between gap-4">
                            <div className="segmented-control flex-1">
                                <button
                                    type="button"
                                    className={cn('segmented-control-option', form.type === 'SINGLE' && 'is-active')}
                                    onClick={() => set('type', 'SINGLE')}
                                >
                                    Einzelwahl
                                </button>
                                <button
                                    type="button"
                                    className={cn('segmented-control-option', form.type === 'MULTIPLE' && 'is-active')}
                                    onClick={() => set('type', 'MULTIPLE')}
                                >
                                    Mehrfachwahl
                                </button>
                            </div>
                            {form.type === 'MULTIPLE' && (
                                <div className="flex items-center gap-2 shrink-0">
                                    <Label htmlFor="max-choices" className="text-xs whitespace-nowrap text-muted-foreground">Max.</Label>
                                    <Input
                                        id="max-choices"
                                        type="number"
                                        min={2}
                                        max={20}
                                        value={form.maxChoices}
                                        onChange={e => set('maxChoices', Math.max(2, parseInt(e.target.value) || 2))}
                                        className="w-16 h-9 text-center"
                                    />
                                </div>
                            )}
                        </div>
                        {form.type === 'MULTIPLE' && (
                            <p className="text-[11px] text-muted-foreground">
                                Mitglieder können bis zu {form.maxChoices} Optionen wählen.
                            </p>
                        )}
                    </div>
                    )}

                    {/* Anonymity — RadioGroup style cards */}
                    <div className="space-y-2">
                        <Label>Anonymität</Label>
                        <div className="space-y-2">
                            {(
                                [
                                    {
                                        value: 'FULLY_ANONYMOUS' as PollAnonymity,
                                        label: 'Vollständig anonym',
                                        hint: 'Niemand sieht, wer wie abgestimmt hat',
                                    },
                                    {
                                        value: 'VISIBLE_TO_ADMINS' as PollAnonymity,
                                        label: 'Nur für Admins sichtbar',
                                        hint: 'Admins sehen die Namen, Mitglieder nicht',
                                    },
                                    {
                                        value: 'VISIBLE_TO_ALL' as PollAnonymity,
                                        label: 'Für alle sichtbar',
                                        hint: 'Alle sehen, wer für welche Option gestimmt hat',
                                    },
                                ] as { value: PollAnonymity; label: string; hint: string; icon: string }[]
                            ).map(({ value, label, hint, icon }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => set('anonymity', value)}
                                    className={cn(
                                        'w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all',
                                        form.anonymity === value
                                            ? 'border-[hsl(359,100%,45%)] bg-red-50'
                                            : 'border-border bg-card hover:bg-muted/40'
                                    )}
                                >
                                    <span className="text-base mt-0.5">{icon}</span>
                                    <span className="flex-1 min-w-0">
                                        <span className={cn('block text-sm font-medium', form.anonymity === value && 'text-[hsl(359,100%,45%)]')}>
                                            {label}
                                        </span>
                                        <span className="block text-[11px] text-muted-foreground mt-0.5">{hint}</span>
                                    </span>
                                    <span className={cn(
                                        'flex-shrink-0 mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all',
                                        form.anonymity === value
                                            ? 'border-[hsl(359,100%,45%)] bg-[hsl(359,100%,45%)]'
                                            : 'border-border'
                                    )}>
                                        {form.anonymity === value && <Check className="h-2.5 w-2.5 text-white" />}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Results visibility — styled segmented control */}
                    <div className="space-y-1.5">
                        <Label>Ergebnisse zeigen</Label>
                        <div className="space-y-2">
                            {(
                                [
                                    {
                                        value: 'AFTER_VOTE' as PollResultsVisibility,
                                        label: 'Nach Abstimmung',
                                        hint: 'Mitglieder sehen Ergebnisse erst nach ihrer Stimmabgabe',
                                    },
                                    {
                                        value: 'ALWAYS' as PollResultsVisibility,
                                        label: 'Immer sichtbar',
                                        hint: 'Jeder sieht die Ergebnisse jederzeit',
                                    },
                                    {
                                        value: 'ADMINS_ONLY' as PollResultsVisibility,
                                        label: 'Nur Admins',
                                        hint: 'Nur Administratoren können Ergebnisse einsehen',
                                    },
                                ] as { value: PollResultsVisibility; label: string; hint: string }[]
                            ).map(({ value, label, hint }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => set('resultsVisibility', value)}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left transition-all',
                                        form.resultsVisibility === value
                                            ? 'border-[hsl(359,100%,45%)] bg-red-50'
                                            : 'border-border bg-card hover:bg-muted/40'
                                    )}
                                >
                                    <span className="flex-1 min-w-0">
                                        <span className={cn('block text-sm font-medium', form.resultsVisibility === value && 'text-[hsl(359,100%,45%)]')}>
                                            {label}
                                        </span>
                                        <span className="block text-[11px] text-muted-foreground">{hint}</span>
                                    </span>
                                    <span className={cn(
                                        'flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all',
                                        form.resultsVisibility === value
                                            ? 'border-[hsl(359,100%,45%)] bg-[hsl(359,100%,45%)]'
                                            : 'border-border'
                                    )}>
                                        {form.resultsVisibility === value && <Check className="h-2.5 w-2.5 text-white" />}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Allow custom options — VOTE only */}
                    {!isSurveyMode && (
                    <div className="flex items-center justify-between">
                        <Label htmlFor="poll-custom-opts" className="font-normal cursor-pointer">
                            Eigene Optionen erlauben
                        </Label>
                        <Switch
                            id="poll-custom-opts"
                            checked={form.allowCustomOptions}
                            onCheckedChange={v => set('allowCustomOptions', v)}
                        />
                    </div>
                    )}

                    {/* Status (edit only) */}
                    {isEdit && (
                        <div className="flex items-center justify-between">
                            <Label htmlFor="poll-status" className="font-normal cursor-pointer">
                                Aktiv
                            </Label>
                            <Switch
                                id="poll-status"
                                checked={form.status === 'ACTIVE'}
                                onCheckedChange={v => set('status', v ? 'ACTIVE' : 'CLOSED')}
                            />
                        </div>
                    )}

                    {/* Deadline */}
                    <div className="space-y-1.5">
                        <Label htmlFor="poll-ends-at">Frist (optional)</Label>
                        <Input
                            id="poll-ends-at"
                            type="date"
                            value={form.endsAt}
                            onChange={e => set('endsAt', e.target.value)}
                            className="w-48"
                        />
                    </div>

                    {/* ── Section: Optionen (VOTE only) ─────────────────── */}
                    {!isSurveyMode && (
                    <>
                    <div className="border-t border-border/60" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Optionen verwalten</p>
                    {/* Options — shown for both create and edit */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Antwortmöglichkeiten</Label>
                            {isEdit && (
                                <span className="text-[11px] text-muted-foreground">
                                    Änderungen setzen betroffene Stimmen zurück
                                </span>
                            )}
                        </div>

                        {/* Vote-reset warning (edit mode, when existing options changed) */}
                        {isEdit && (() => {
                            const originalOptions = editPoll?.options ?? [];
                            const hasChanges = form.options.some(o =>
                                o.id && originalOptions.find(orig => orig.id === o.id)?.text !== o.text
                            );
                            const hasRemovals = originalOptions.some(orig =>
                                !form.options.find(o => o.id === orig.id)
                            );
                            return (hasChanges || hasRemovals) ? (
                                <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-800">
                                    <span className="text-base leading-none mt-0.5">⚠️</span>
                                    <span>Geänderte oder gelöschte Optionen: Die dazugehörigen Stimmen werden unwiderruflich zurückgesetzt.</span>
                                </div>
                            ) : null;
                        })()}

                        {form.options.map((opt, idx) => {
                            const isExisting = !!opt.id;
                            const originalText = editPoll?.options?.find(o => o.id === opt.id)?.text;
                            const isModified = isExisting && originalText !== undefined && opt.text !== originalText;
                            // Show vote count for existing options in edit mode
                            const voteCount = isEdit && isExisting
                                ? (editPoll?.summary?.options?.find(o => o.id === opt.id)?.voteCount ?? 0)
                                : 0;
                            const hasVotes = voteCount > 0;
                            return (
                                <div key={opt.id ?? `new-${idx}`} className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            placeholder={`Option ${idx + 1}`}
                                            value={opt.text}
                                            onChange={e => updateOption(idx, e.target.value)}
                                            maxLength={200}
                                            className={cn(isModified && 'border-amber-400 focus-visible:ring-amber-400')}
                                        />
                                        {!isExisting && (
                                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-emerald-600 font-medium pointer-events-none">
                                                Neu
                                            </span>
                                        )}
                                        {isModified && (
                                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-amber-600 font-medium pointer-events-none">
                                                Geändert
                                            </span>
                                        )}
                                        {isExisting && !isModified && hasVotes && (
                                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium pointer-events-none">
                                                {voteCount} Stimme{voteCount !== 1 ? 'n' : ''}
                                            </span>
                                        )}
                                    </div>
                                    {form.options.length > 2 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                'h-10 w-10 shrink-0',
                                                isExisting && hasVotes && 'text-amber-600 hover:text-destructive hover:bg-destructive/10'
                                            )}
                                            onClick={() => removeOption(idx)}
                                            title={isExisting && hasVotes ? `Option löschen (${voteCount} Stimmen zurückgesetzt)` : 'Entfernen'}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                        <button
                            type="button"
                            onClick={addOption}
                            className="w-full h-10 flex items-center gap-2 px-4 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Option hinzufügen
                        </button>
                    </div>
                    </> // end !isSurveyMode options section
                    )}

                    {/* ── Section: Zielgruppe ─────────────────────────────── */}
                    <div className="border-t border-border/60" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Zielgruppe</p>

                    {/* Audience Targeting */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            {form.audienceRules.length > 0 && (
                                <button
                                    type="button"
                                    className="text-xs text-muted-foreground hover:text-destructive ml-auto"
                                    onClick={() => setForm(f => ({ ...f, audienceRules: [] }))}
                                >
                                    Alle zurücksetzen
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Ohne Einschränkung sehen alle Mitglieder diese Abstimmung.
                        </p>

                        {/* Selected chips */}
                        {form.audienceRules.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 py-1">
                                {form.audienceRules.map((rule, idx) => (
                                    <AudienceChip
                                        key={idx}
                                        label={getAudienceLabel(rule)}
                                        onRemove={() => removeAudienceRule(idx)}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-2">
                            {/* Register select */}
                            {registers.length > 0 && (
                                <div className="relative">
                                    <select
                                        className={selectCls}
                                        value=""
                                        onChange={e => {
                                            const id = parseInt(e.target.value);
                                            if (id) addAudienceRule({ targetType: 'REGISTER', registerId: id });
                                        }}
                                    >
                                        <option value="">+ Register hinzufügen…</option>
                                        {registers
                                            .filter(r => !form.audienceRules.some(ar => ar.targetType === 'REGISTER' && ar.registerId === r.id))
                                            .map(r => (
                                                <option key={r.id} value={r.id}>{r.name}</option>
                                            ))}
                                    </select>
                                </div>
                            )}

                            {/* Member select */}
                            {members.length > 0 && (
                                <div className="relative">
                                    <select
                                        className={selectCls}
                                        value=""
                                        onChange={e => {
                                            const id = parseInt(e.target.value);
                                            if (id) addAudienceRule({ targetType: 'USER', userId: id });
                                        }}
                                    >
                                        <option value="">+ Mitglied hinzufügen…</option>
                                        {members
                                            .filter(m => !form.audienceRules.some(ar => ar.targetType === 'USER' && ar.userId === m.id))
                                            .map(m => (
                                                <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                                            ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose} disabled={isPending}>
                        Abbrechen
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isPending}
                        style={{ backgroundColor: 'hsl(359,100%,45%)' }}
                    >
                        {isPending ? 'Wird gespeichert...' : isEdit ? 'Speichern' : 'Erstellen'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Filter Drawer ────────────────────────────────────────────────────────────

function FilterDrawer({
    open,
    activeTab,
    onTabChange,
    onClose,
}: {
    open: boolean;
    activeTab: FilterTab;
    onTabChange: (tab: FilterTab) => void;
    onClose: () => void;
}) {
    const options: { value: FilterTab; label: string }[] = [
        { value: 'active', label: 'Aktiv' },
        { value: 'archiv', label: 'Archiv' },
        { value: 'my-votes', label: 'Meine Stimmen' },
    ];

    return (
        <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
            <SheetContent side="bottom" className="rounded-t-2xl pb-safe">
                <SheetHeader className="mb-4">
                    <SheetTitle>Filter</SheetTitle>
                </SheetHeader>
                <div className="space-y-2 pb-4">
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => { onTabChange(opt.value); onClose(); }}
                            className={cn(
                                'w-full h-12 flex items-center justify-between px-4 rounded-xl border text-sm font-medium transition-all',
                                activeTab === opt.value
                                    ? 'bg-red-50 border-[hsl(359,100%,45%)] text-[hsl(359,100%,45%)]'
                                    : 'bg-card border-border hover:bg-muted/60'
                            )}
                        >
                            {opt.label}
                            {activeTab === opt.value && <Check className="h-4 w-4" />}
                        </button>
                    ))}
                </div>
            </SheetContent>
        </Sheet>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: FilterTab }) {
    const messages: Record<FilterTab, string> = {
        active: 'Keine aktiven Abstimmungen',
        archiv: 'Keine archivierten Abstimmungen',
        'my-votes': 'Du hast noch nicht abgestimmt',
    };
    return (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <BarChart2 className="h-10 w-10 opacity-30" />
            <p className="text-sm">{messages[tab]}</p>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PollsPage() {
    const can = useCan();
    const { user } = useAuth();
    useMarkRead('POLLS');
    const canWrite = can('polls:write');
    const isAdmin = user?.role === 'admin';
    const [searchParams] = useSearchParams();
    const linkedPollId = searchParams.get('id') ? parseInt(searchParams.get('id')!) : null;

    const [activeTab, setActiveTab] = useState<FilterTab>('active');
    const [showCreate, setShowCreate] = useState(false);
    const [editPoll, setEditPoll] = useState<Poll | null>(null);
    const [deletePoll, setDeletePoll] = useState<Poll | null>(null);
    const [analyticsPollId, setAnalyticsPollId] = useState<number | null>(null);
    const [showFilter, setShowFilter] = useState(false);
    const [highlightedPollId, setHighlightedPollId] = useState<number | null>(linkedPollId);

    const pollsQuery = useQuery<Poll[]>({
        queryKey: ['polls'],
        queryFn: () => pollService.getAll(),
    });

    const polls = pollsQuery.data ?? [];

    // When polls load and a linked id is present, switch to correct tab + scroll
    useEffect(() => {
        if (!linkedPollId || polls.length === 0) return;
        const target = polls.find(p => p.id === linkedPollId);
        if (!target) return;
        const closed = isPollClosed(target);
        setActiveTab(closed ? 'archiv' : 'active');
        // Scroll after render
        setTimeout(() => {
            const el = document.getElementById(`poll-${linkedPollId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 150);
        // Remove highlight after 3s
        const t = setTimeout(() => setHighlightedPollId(null), 3000);
        return () => clearTimeout(t);
    }, [linkedPollId, polls]); // eslint-disable-line react-hooks/exhaustive-deps

    const filteredPolls = polls.filter((poll) => {
        const closed = isPollClosed(poll);
        if (activeTab === 'active') return !closed;
        if (activeTab === 'archiv') return closed;
        if (activeTab === 'my-votes') return poll.hasVoted;
        return false;
    });

    return (
        <div className="theme-member min-h-screen bg-[hsl(220,13%,91%)]">
            <PageHeader
                title="Abstimmungen"
                actions={
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-11 w-11 rounded-2xl shadow-sm bg-white/80"
                            onClick={() => setShowFilter(true)}
                            aria-label="Filter"
                        >
                            <SlidersHorizontal className="h-5 w-5" />
                        </Button>
                        {canWrite && (
                            <Button
                                className="h-11 w-11 sm:w-auto sm:px-5 gap-1.5 rounded-2xl shadow-sm"
                                style={{ backgroundColor: 'hsl(359,100%,45%)' }}
                                onClick={() => setShowCreate(true)}
                            >
                                <Plus className="h-5 w-5" />
                                <span className="hidden sm:inline">Neue Abstimmung</span>
                            </Button>
                        )}
                    </div>
                }
            />

            <div className="px-4 py-3">
                {/* Segmented control */}
                <div className="segmented-control mb-4">
                    <button
                        className={cn('segmented-control-option', activeTab === 'active' && 'is-active')}
                        onClick={() => setActiveTab('active')}
                    >
                        Aktiv
                    </button>
                    <button
                        className={cn('segmented-control-option', activeTab === 'archiv' && 'is-active')}
                        onClick={() => setActiveTab('archiv')}
                    >
                        Archiv
                    </button>
                    <button
                        className={cn('segmented-control-option', activeTab === 'my-votes' && 'is-active')}
                        onClick={() => setActiveTab('my-votes')}
                    >
                        Meine Stimmen
                    </button>
                </div>

                {/* Loading */}
                {pollsQuery.isLoading && (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="h-40 rounded-2xl" />
                        ))}
                    </div>
                )}

                {/* Error */}
                {pollsQuery.isError && (
                    <p className="text-sm text-destructive text-center py-10">
                        Fehler beim Laden der Abstimmungen
                    </p>
                )}

                {/* Polls list */}
                {!pollsQuery.isLoading && !pollsQuery.isError && (
                    <>
                        {filteredPolls.length === 0 ? (
                            <EmptyState tab={activeTab} />
                        ) : (
                            <div className="space-y-3">
                                {filteredPolls.map((poll) => (
                                    <PollCard
                                        key={poll.id}
                                        poll={poll}
                                        canManage={isAdmin || canWrite}
                                        onEdit={(p) => setEditPoll(p)}
                                        onDelete={(p) => setDeletePoll(p)}
                                        onAnalytics={(p) => setAnalyticsPollId(p.id)}
                                        highlighted={highlightedPollId === poll.id}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Create / Edit Dialog */}
            <CreatePollDialog
                open={showCreate || !!editPoll}
                editPoll={editPoll}
                onClose={() => {
                    setShowCreate(false);
                    setEditPoll(null);
                }}
            />

            {/* Delete Dialog */}
            <DeletePollDialog
                poll={deletePoll}
                onClose={() => setDeletePoll(null)}
            />

            {/* Analytics Sheet */}
            <AnalyticsSheet
                pollId={analyticsPollId}
                open={analyticsPollId !== null}
                onClose={() => setAnalyticsPollId(null)}
            />

            {/* Filter Drawer */}
            <FilterDrawer
                open={showFilter}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onClose={() => setShowFilter(false)}
            />
        </div>
    );
}
