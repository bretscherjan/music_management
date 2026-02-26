import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { Task, AdminNote, TaskHistory } from '@/types/workspace';
import {
    PDFMAKE_STYLES, PDFMAKE_DEFAULT_STYLE, PDFMAKE_TABLE_LAYOUT,
    buildPdfTitleBlock, DEFAULT_PDF_OPTIONS, type PdfOptions
} from '@/utils/pdfTheme';

// Initialize vfs_fonts
// @ts-ignore
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
    // @ts-ignore
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts && (pdfFonts as any).vfs) {
    // @ts-ignore
    pdfMake.vfs = (pdfFonts as any).vfs;
}


interface ExportData {
    tasks: Task[];
    notes: AdminNote[];
    history: TaskHistory[];
}

// Helper to parse markdown-like structure
const parseMarkdown = (text: string): any[] => {
    if (!text) return [];

    const lines = text.split('\n');
    const content: any[] = [];
    let currentList: any[] = [];

    lines.forEach(line => {
        const trimmed = line.trim();

        // Headers
        if (trimmed.startsWith('# ')) {
            if (currentList.length) { content.push({ ul: currentList }); currentList = []; }
            content.push({ text: trimmed.substring(2), style: 'markdownH1', margin: [0, 10, 0, 5] });
        }
        else if (trimmed.startsWith('## ')) {
            if (currentList.length) { content.push({ ul: currentList }); currentList = []; }
            content.push({ text: trimmed.substring(3), style: 'markdownH2', margin: [0, 8, 0, 4] });
        }
        else if (trimmed.startsWith('### ')) {
            if (currentList.length) { content.push({ ul: currentList }); currentList = []; }
            content.push({ text: trimmed.substring(4), style: 'markdownH3', margin: [0, 6, 0, 3] });
        }
        // Lists
        else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            currentList.push(parseInlineFormatting(trimmed.substring(2)));
        }
        // Checked/Unchecked items
        else if (trimmed.startsWith('- [ ] ')) {
            currentList.push({ text: '☐ ' + trimmed.substring(6) });
        }
        else if (trimmed.startsWith('- [x] ')) {
            currentList.push({ text: '☑ ' + trimmed.substring(6) });
        }
        // Regular text
        else {
            if (currentList.length) { content.push({ ul: currentList }); currentList = []; }
            if (trimmed.length > 0) {
                content.push({ text: parseInlineFormatting(trimmed), margin: [0, 0, 0, 2] });
            }
        }
    });

    if (currentList.length) { content.push({ ul: currentList }); }

    return content;
};

// Helper for bold/italic parsing: **bold**, *italic*
const parseInlineFormatting = (text: string): any[] => {
    const parts: any[] = [];
    // Simple bold parser (supports **text**)
    const boldSplit = text.split(/(\*\*[^\*]+\*\*)/g);

    boldSplit.forEach(part => {
        if (part.startsWith('**') && part.endsWith('**')) {
            parts.push({ text: part.substring(2, part.length - 2), bold: true });
        } else {
            // Check for italic *text* inside non-bold parts
            const italicSplit = part.split(/(\*[^\*]+\*)/g);
            italicSplit.forEach(subPart => {
                if (subPart.startsWith('*') && subPart.endsWith('*') && subPart.length > 2) {
                    parts.push({ text: subPart.substring(1, subPart.length - 1), italics: true });
                } else {
                    parts.push(subPart);
                }
            });
        }
    });
    return parts;
};

export const generatePdf = (data: ExportData, opts: PdfOptions = DEFAULT_PDF_OPTIONS) => {
    const { tasks, notes, history } = data;

    const content: any[] = [];

    // Title block
    content.push(...buildPdfTitleBlock('Admin Workspace Export', null, opts));

    // 1. Overview Stats
    content.push({
        columns: [
            { width: '*', text: `Offene Tasks: ${tasks.filter(t => !t.completed).length}`, style: 'statBox' },
            { width: '*', text: `Erledigt: ${tasks.filter(t => t.completed).length}`, style: 'statBox' },
            { width: '*', text: `Notizen: ${notes.length}`, style: 'statBox' }
        ],
        margin: [0, 0, 0, 20]
    });

    // 2. Tasks Section (Grouped by Category)
    if (tasks.length > 0) {
        content.push({ text: 'Aufgaben Übersicht', style: 'sectionHeader', margin: [0, 10, 0, 10] });

        // Group tasks
        const tasksByCategory: Record<string, Task[]> = {};
        tasks.forEach(t => {
            const cat = t.category?.name || 'Allgemein';
            if (!tasksByCategory[cat]) tasksByCategory[cat] = [];
            tasksByCategory[cat].push(t);
        });

        Object.keys(tasksByCategory).sort().forEach(category => {
            const catTasks = tasksByCategory[category];

            content.push({
                text: category,
                style: 'categoryHeader',
                margin: [0, 10, 0, 5],
                color: catTasks[0]?.category?.color || '#000000'
            });

            const taskRows = catTasks.map(task => [
                { text: task.completed ? 'Done' : 'Open', style: task.completed ? 'statusDone' : 'statusOpen' },
                { text: task.title, margin: [0, 2] },
                { text: task.priority || '', alignment: 'center' },
                {
                    // @ts-ignore
                    text: task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : '-',
                    style: 'smallText'
                },
                {
                    // @ts-ignore
                    text: task.dueDate ? new Date(task.dueDate).toLocaleDateString('de-CH') : '-',
                    style: 'smallText', alignment: 'right'
                }
            ]);

            content.push({
                table: {
                    headerRows: 1,
                    widths: [40, '*', 50, 80, 60],
                    body: [
                        [
                            { text: '', style: 'tableHeader' },
                            { text: 'Titel', style: 'tableHeader' },
                            { text: 'Prio', style: 'tableHeader' },
                            { text: 'Zugewiesen', style: 'tableHeader' },
                            { text: 'Fällig', style: 'tableHeader' },
                        ],
                        ...taskRows
                    ]
                },
                layout: PDFMAKE_TABLE_LAYOUT,
                margin: [0, 0, 0, 15]
            });
        });

        content.push({ text: '', pageBreak: 'after' });
    }

    // 3. Notes Section
    if (notes.length > 0) {
        content.push({ text: 'Notizen & Protokolle', style: 'sectionHeader', margin: [0, 10, 0, 10] });

        notes.forEach((note, index) => {
            content.push({
                stack: [
                    {
                        text: note.title + (note.pinned ? ' 📌' : ''),
                        style: 'noteTitle'
                    },
                    {
                        columns: [
                            // @ts-ignore
                            { text: `Erstellt: ${note.owner?.firstName} ${note.owner?.lastName}`, style: 'metaText' },
                            { text: new Date(note.createdAt).toLocaleDateString('de-CH'), alignment: 'right', style: 'metaText' }
                        ]
                    },
                    { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 0.5, lineColor: '#cccccc' }] },
                ],
                margin: [0, index === 0 ? 0 : 20, 0, 10],
                unbreakable: true
            });

            // Parse Markdown Content
            content.push({
                stack: parseMarkdown(note.content),
                margin: [10, 0, 0, 0]
            });
        });
    }

    // 4. History Section (if requested/present)
    if (history.length > 0) {
        content.push({ text: '', pageBreak: 'before' });
        content.push({ text: 'Änderungsverlauf', style: 'sectionHeader', margin: [0, 10, 0, 10] });

        // Compact table for history
        const historyRows = history.slice(0, 50).map(h => [
            { text: new Date(h.createdAt).toLocaleDateString('de-CH') + ' ' + new Date(h.createdAt).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' }), style: 'smallText' },
            // @ts-ignore
            { text: h.task?.title || 'System', style: 'smallText' },
            { text: h.action, style: 'smallText' },
            // @ts-ignore
            { text: h.user ? `${h.user.firstName} ${h.user.lastName}` : 'System', style: 'smallText' }
        ]);

        content.push({
            table: {
                headerRows: 1,
                widths: ['auto', '*', 'auto', 'auto'],
                body: [
                    [{ text: 'Zeit', style: 'tableHeader' }, { text: 'Task', style: 'tableHeader' }, { text: 'Aktion', style: 'tableHeader' }, { text: 'User', style: 'tableHeader' }],
                    ...historyRows
                ]
            },
            layout: PDFMAKE_TABLE_LAYOUT
        });
    }

    const docDefinition: any = {
        pageOrientation: 'portrait',
        content,
        styles: PDFMAKE_STYLES,
        defaultStyle: PDFMAKE_DEFAULT_STYLE
    };

    pdfMake.createPdf(docDefinition).download(`workspace-export-${new Date().toISOString().split('T')[0]}.pdf`);
};
