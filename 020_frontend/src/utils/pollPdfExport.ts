import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import {
    PDFMAKE_STYLES,
    PDFMAKE_DEFAULT_STYLE,
    PDFMAKE_TABLE_LAYOUT,
    BRAND,
    buildPdfTitleBlock,
    type PdfOptions,
} from '@/utils/pdfTheme';
import type { PollAnalyticsData, PollTextAnswerResult } from '@/types';

// Initialize pdfmake fonts
// @ts-ignore
if (pdfFonts?.pdfMake?.vfs) {
    // @ts-ignore
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if ((pdfFonts as any)?.vfs) {
    // @ts-ignore
    pdfMake.vfs = (pdfFonts as any).vfs;
}

export interface PollPdfOptions extends PdfOptions {
    /** Include voter/respondent names (only if anonymity allows) */
    includeVoterNames: boolean;
    /** VOTE only: include per-option detail section */
    includeDetailedStats: boolean;
}

export const DEFAULT_POLL_PDF_OPTIONS: PollPdfOptions = {
    showAssocName: true,
    showDocTitle: true,
    showDate: true,
    showPageNumbers: true,
    includeVoterNames: false,
    includeDetailedStats: true,
};

export function exportPollAnalyticsPdf(
    data: PollAnalyticsData,
    opts: PollPdfOptions = DEFAULT_POLL_PDF_OPTIONS
) {
    const { poll } = data;
    const isSurvey = poll.pollKind === 'SURVEY';

    if (isSurvey) {
        exportSurveyPdf(data, opts);
    } else {
        exportVotePdf(data, opts);
    }
}

// ─── SURVEY PDF ───────────────────────────────────────────────────────────────

function exportSurveyPdf(data: PollAnalyticsData, opts: PollPdfOptions) {
    const { poll, analytics } = data;
    const { totalParticipants, textAnswers = [] } = analytics;
    const canShowNames = opts.includeVoterNames && poll.anonymity !== 'FULLY_ANONYMOUS';

    const statusLabel = poll.status === 'ACTIVE' ? 'Aktiv' : 'Geschlossen';
    const endsLabel = poll.endsAt
        ? new Date(poll.endsAt).toLocaleDateString('de-CH')
        : '—';

    const content: any[] = [];

    // ── Title block ────────────────────────────────────────────────────────────
    content.push(...buildPdfTitleBlock(poll.title, poll.question, opts));

    // ── Meta row ───────────────────────────────────────────────────────────────
    content.push({
        columns: [
            { text: 'Typ: Umfrage', style: 'smallText' },
            { text: `Status: ${statusLabel}`, style: 'smallText', alignment: 'center' },
            { text: `Frist: ${endsLabel}`, style: 'smallText', alignment: 'right' },
        ],
        margin: [0, 0, 0, 16],
    });

    // ── Stat box ───────────────────────────────────────────────────────────────
    content.push({
        columns: [
            {
                width: '*',
                stack: [
                    { text: String(totalParticipants), style: 'statBox', fontSize: 22 },
                    { text: 'Antworten', style: 'smallText', alignment: 'center' },
                ],
            },
        ],
        margin: [0, 0, 0, 20],
    });

    // ── Answers ────────────────────────────────────────────────────────────────
    content.push({ text: 'Antworten', style: 'sectionHeader' });

    if (textAnswers.length === 0) {
        content.push({ text: 'Keine Antworten vorhanden.', style: 'smallText', margin: [0, 0, 0, 20] });
    } else if (canShowNames) {
        // Named answer table: Name | Antwort
        const rows = (textAnswers as PollTextAnswerResult[]).map(ta => [
            {
                text: ta.firstName || ta.lastName
                    ? `${ta.firstName ?? ''} ${ta.lastName ?? ''}`.trim()
                    : 'Anonym',
                style: 'cellText',
            },
            { text: ta.answer, style: 'cellText' },
        ]);

        content.push({
            table: {
                headerRows: 1,
                widths: [120, '*'],
                body: [
                    [
                        { text: 'Teilnehmer', style: 'tableHeader' },
                        { text: 'Antwort', style: 'tableHeader' },
                    ],
                    ...rows,
                ],
            },
            layout: PDFMAKE_TABLE_LAYOUT,
            margin: [0, 0, 0, 20],
        });
    } else {
        // Anonymous: just a list of answers, visually formatted as cards
        (textAnswers as PollTextAnswerResult[]).forEach((ta, idx) => {
            content.push({
                stack: [
                    {
                        canvas: [
                            {
                                type: 'rect',
                                x: 0, y: 0,
                                w: 480, h: 1,
                                color: '#E8E8E8',
                            },
                        ],
                        margin: [0, idx === 0 ? 0 : 8, 0, 8],
                    },
                    {
                        columns: [
                            {
                                canvas: [
                                    {
                                        type: 'rect',
                                        x: 0, y: 2,
                                        w: 3, h: 14,
                                        r: 1,
                                        color: BRAND.primary,
                                    },
                                ],
                                width: 10,
                            },
                            { text: ta.answer, style: 'cellText', width: '*' },
                        ],
                        columnGap: 6,
                    },
                ],
            });
        });
        content.push({ text: '', margin: [0, 12, 0, 0] });
    }

    // ── Footer note ────────────────────────────────────────────────────────────
    if (poll.anonymity === 'FULLY_ANONYMOUS') {
        content.push({
            text: 'ℹ Diese Umfrage ist vollständig anonym. Teilnehmernamen wurden nicht erfasst.',
            style: 'smallText',
            color: BRAND.textLight,
            margin: [0, 8, 0, 0],
        });
    }

    const docDefinition: any = {
        pageOrientation: 'portrait',
        content,
        styles: PDFMAKE_STYLES,
        defaultStyle: PDFMAKE_DEFAULT_STYLE,
        ...(opts.showPageNumbers && {
            footer: (currentPage: number, pageCount: number) => ({
                text: `Seite ${currentPage} von ${pageCount}`,
                alignment: 'center',
                fontSize: 8,
                color: BRAND.textLight,
                margin: [0, 8, 0, 0],
            }),
        }),
    };

    const filename = `umfrage-${poll.id}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdfMake.createPdf(docDefinition).download(filename);
}

// ─── VOTE PDF ─────────────────────────────────────────────────────────────────

function exportVotePdf(data: PollAnalyticsData, opts: PollPdfOptions) {
    const { poll, analytics } = data;
    const { totalVotes, totalParticipants, options, voters } = analytics;

    const statusLabel = poll.status === 'ACTIVE' ? 'Aktiv' : 'Geschlossen';
    const endsLabel = poll.endsAt
        ? new Date(poll.endsAt).toLocaleDateString('de-CH')
        : '—';

    const content: any[] = [];

    // ── Title block ────────────────────────────────────────────────────────────
    content.push(...buildPdfTitleBlock(poll.title, poll.question, opts));

    // ── Meta row ───────────────────────────────────────────────────────────────
    content.push({
        columns: [
            { text: 'Typ: Abstimmung', style: 'smallText' },
            { text: `Status: ${statusLabel}`, style: 'smallText', alignment: 'center' },
            { text: `Frist: ${endsLabel}`, style: 'smallText', alignment: 'right' },
        ],
        margin: [0, 0, 0, 16],
    });

    // ── Summary stat boxes ─────────────────────────────────────────────────────
    content.push({
        columns: [
            {
                width: '*',
                stack: [
                    { text: String(totalParticipants), style: 'statBox', fontSize: 22 },
                    { text: 'Teilnehmer', style: 'smallText', alignment: 'center' },
                ],
                margin: [0, 0, 8, 0],
            },
            {
                width: '*',
                stack: [
                    { text: String(totalVotes), style: 'statBox', fontSize: 22 },
                    { text: 'Stimmen', style: 'smallText', alignment: 'center' },
                ],
                margin: [8, 0, 0, 0],
            },
        ],
        margin: [0, 0, 0, 20],
    });

    // ── Results table ──────────────────────────────────────────────────────────
    content.push({ text: 'Ergebnisse', style: 'sectionHeader' });

    const resultRows = options.map(opt => [
        { text: opt.text, style: 'cellText' },
        { text: String(opt.voteCount), style: 'cellText', alignment: 'center' },
        { text: `${opt.percentage}%`, style: 'cellText', alignment: 'center' },
        {
            columns: [
                { canvas: buildBarCanvas(opt.percentage), width: '*' },
            ],
        },
    ]);

    content.push({
        table: {
            headerRows: 1,
            widths: ['*', 50, 50, 100],
            body: [
                [
                    { text: 'Option', style: 'tableHeader' },
                    { text: 'Stimmen', style: 'tableHeader', alignment: 'center' },
                    { text: '%', style: 'tableHeader', alignment: 'center' },
                    { text: 'Verteilung', style: 'tableHeader' },
                ],
                ...resultRows,
            ],
        },
        layout: PDFMAKE_TABLE_LAYOUT,
        margin: [0, 0, 0, 20],
    });

    // ── Voter names table (opt-in, only if non-anonymous) ──────────────────────
    if (opts.includeVoterNames && voters && voters.length > 0) {
        content.push({ text: 'Teilnehmer & Auswahl', style: 'sectionHeader' });

        const optionById: Record<number, string> = {};
        options.forEach(o => { optionById[o.id] = o.text; });

        const voterRows = voters.map(v => [
            { text: `${v.firstName ?? ''} ${v.lastName ?? ''}`.trim(), style: 'cellText' },
            {
                text: (v.optionIds ?? [])
                    .map(oid => optionById[oid] ?? `Option ${oid}`)
                    .join(', '),
                style: 'cellText',
            },
        ]);

        content.push({
            table: {
                headerRows: 1,
                widths: ['*', '*'],
                body: [
                    [
                        { text: 'Name', style: 'tableHeader' },
                        { text: 'Gewählt', style: 'tableHeader' },
                    ],
                    ...voterRows,
                ],
            },
            layout: PDFMAKE_TABLE_LAYOUT,
            margin: [0, 0, 0, 20],
        });
    }

    // ── Detailed stats ─────────────────────────────────────────────────────────
    if (opts.includeDetailedStats && options.length > 0) {
        content.push({ text: 'Detailansicht', style: 'sectionHeader' });

        options.forEach((opt, idx) => {
            const voterList =
                opt.voters && opt.voters.length > 0
                    ? opt.voters.map(v => `${v.firstName ?? ''} ${v.lastName ?? ''}`.trim()).join(', ')
                    : '—';

            content.push({
                stack: [
                    {
                        columns: [
                            { text: opt.text, bold: true, fontSize: 11, color: BRAND.textDark },
                            { text: `${opt.voteCount} Stimme(n) · ${opt.percentage}%`, alignment: 'right', style: 'smallText' },
                        ],
                        margin: [0, idx === 0 ? 0 : 10, 0, 2],
                    },
                    ...(opts.includeVoterNames && opt.voters
                        ? [{ text: voterList, style: 'smallText', margin: [0, 0, 0, 4] }]
                        : []),
                ],
            });
        });
    }

    const docDefinition: any = {
        pageOrientation: 'portrait',
        content,
        styles: PDFMAKE_STYLES,
        defaultStyle: PDFMAKE_DEFAULT_STYLE,
        ...(opts.showPageNumbers && {
            footer: (currentPage: number, pageCount: number) => ({
                text: `Seite ${currentPage} von ${pageCount}`,
                alignment: 'center',
                fontSize: 8,
                color: BRAND.textLight,
                margin: [0, 8, 0, 0],
            }),
        }),
    };

    const filename = `abstimmung-${poll.id}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdfMake.createPdf(docDefinition).download(filename);
}

/** Builds a simple horizontal bar canvas element for pdfmake */
function buildBarCanvas(percentage: number): any {
    const totalWidth = 90;
    const fillWidth = Math.max(1, Math.round((percentage / 100) * totalWidth));
    return [
        {
            type: 'rect',
            x: 0, y: 4,
            w: totalWidth, h: 8,
            r: 3,
            color: '#E8E8E8',
        },
        {
            type: 'rect',
            x: 0, y: 4,
            w: fillWidth, h: 8,
            r: 3,
            color: '#E60004',
        },
    ];
}
