import { CheckCircle2, XCircle, HelpCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface AttendanceSummaryProps {
    summary?: {
        yes: number;
        no: number;
        maybe: number;
        pending: number;
        total: number;
    };
    className?: string;
}

export function AttendanceSummary({ summary, className }: AttendanceSummaryProps) {
    if (!summary) return null;

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <TooltipProvider delayDuration={300}>
                {/* Yes - Green */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-emerald-600 bg-emerald-100 text-emerald-700 min-w-[50px] justify-center h-7 cursor-help">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm font-semibold">{summary.yes}</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Zugesagt</p>
                    </TooltipContent>
                </Tooltip>

                {/* No - Red */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-red-600 bg-red-600 text-white min-w-[50px] justify-center h-7 cursor-help">
                            <XCircle className="h-4 w-4" />
                            <span className="text-sm font-semibold">{summary.no}</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Abgesagt</p>
                    </TooltipContent>
                </Tooltip>

                {/* Maybe - Yellow/Orange */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-amber-600 bg-amber-100 text-amber-700 min-w-[50px] justify-center h-7 cursor-help">
                            <HelpCircle className="h-4 w-4" />
                            <span className="text-sm font-semibold">{summary.maybe}</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Vielleicht</p>
                    </TooltipContent>
                </Tooltip>

                {/* Pending - Gray/White */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-slate-800 bg-white text-slate-800 min-w-[50px] justify-center h-7 cursor-help">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm font-semibold">{summary.pending}</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Ausstehend / Offen</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}
