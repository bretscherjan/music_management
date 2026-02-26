/**
 * Shared PDF design tokens — mirrors 010_backend/src/utils/pdfStyles.js
 * Used by all frontend PDF generators (pdfmake + jsPDF/autotable).
 */

// ─── Brand colours ────────────────────────────────────────────────────────────
export const BRAND = {
    primary: '#BDD18C',
    accent: '#1c471eff',
    altRow: '#f0f5fb',
    border: '#d1dce8',
    textDark: '#1e293b',
    textMid: '#475569',
    textLight: '#94a3b8',
    green: '#16a34a',
    amber: '#d97706',
    red: '#dc2626',
} as const;

// RGB tuples for jsPDF (autotable expects number arrays)
export const BRAND_RGB = {
    primary: [30, 58, 95] as [number, number, number],
    accent: [37, 99, 235] as [number, number, number],
    altRow: [240, 245, 251] as [number, number, number],
    border: [209, 220, 232] as [number, number, number],
    textDark: [30, 41, 59] as [number, number, number],
    textMid: [71, 85, 105] as [number, number, number],
    textLight: [148, 163, 184] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
} as const;

// ─── PDF options (4 checkboxes) ───────────────────────────────────────────────
export interface PdfOptions {
    showAssocName: boolean;  // "Musig Elgg" in header/title
    showDocTitle: boolean;  // Document name in running header
    showDate: boolean;  // Generation date
    showPageNumbers: boolean;  // "Seite X von Y" footer
}

export const DEFAULT_PDF_OPTIONS: PdfOptions = {
    showAssocName: true,
    showDocTitle: true,
    showDate: true,
    showPageNumbers: true,
};

// Convert PdfOptions to URL query params for backend requests
export function pdfOptsToParams(opts: PdfOptions): Record<string, string> {
    return {
        showAssocName: opts.showAssocName ? '1' : '0',
        showDocTitle: opts.showDocTitle ? '1' : '0',
        showDate: opts.showDate ? '1' : '0',
        showPageNumbers: opts.showPageNumbers ? '1' : '0',
    };
}

// ─── pdfmake styles (frontend) ────────────────────────────────────────────────
export const PDFMAKE_STYLES: Record<string, object> = {
    header: { fontSize: 20, bold: true, color: BRAND.primary, margin: [0, 0, 0, 4] },
    subheader: { fontSize: 11, color: BRAND.textMid, margin: [0, 0, 0, 14] },
    sectionHeader: { fontSize: 14, bold: true, color: BRAND.accent, margin: [0, 14, 0, 7] },
    categoryHeader: { fontSize: 12, bold: true, decoration: 'underline', color: BRAND.textDark },
    tableHeader: { bold: true, fontSize: 10, color: '#ffffff', fillColor: BRAND.primary, margin: [6, 5, 6, 5] },
    cellText: { fontSize: 10, color: BRAND.textDark, margin: [6, 4, 6, 4] },
    smallText: { fontSize: 9, color: BRAND.textMid },
    metaText: { fontSize: 8, color: BRAND.textLight },
    noteTitle: { fontSize: 13, bold: true, color: BRAND.accent },
    markdownH1: { fontSize: 13, bold: true, color: BRAND.textDark },
    markdownH2: { fontSize: 12, bold: true, color: BRAND.textMid },
    markdownH3: { fontSize: 11, bold: true, italics: true },
    statusDone: { fontSize: 9, bold: true, color: BRAND.green },
    statusOpen: { fontSize: 9, bold: true, color: BRAND.red },
    statBox: { fontSize: 11, bold: true, alignment: 'center', color: BRAND.textDark },
};

export const PDFMAKE_DEFAULT_STYLE = { fontSize: 10, lineHeight: 1.3, color: BRAND.textDark };

// Table layout: alternating rows, no vertical lines, top border = primary
export const PDFMAKE_TABLE_LAYOUT = {
    hLineWidth: (i: number, node: any) => (i === 0 || i === node.table.body.length) ? 1 : 0.5,
    vLineWidth: () => 0,
    hLineColor: (i: number) => i === 0 ? BRAND.primary : BRAND.border,
    fillColor: (rowIndex: number) => rowIndex === 0 ? null : (rowIndex % 2 === 1 ? BRAND.altRow : '#ffffff'),
    paddingLeft: () => 6,
    paddingRight: () => 6,
    paddingTop: () => 4,
    paddingBottom: () => 4,
};

// ─── pdfmake title block builder ──────────────────────────────────────────────
export function buildPdfTitleBlock(title: string, subtitle: string | null, opts: PdfOptions): any[] {
    const today = new Date().toLocaleDateString('de-CH', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const block: any[] = [];

    if (opts.showAssocName) {
        block.push({ text: 'Musig Elgg', fontSize: 9, color: BRAND.textLight, bold: true, margin: [0, 0, 0, 4] });
    }
    block.push({ text: title, style: 'header' });
    if (subtitle) block.push({ text: subtitle, style: 'subheader' });
    block.push(opts.showDate
        ? { text: `Generiert am ${today}`, fontSize: 8, color: BRAND.textLight, margin: [0, 2, 0, 20] }
        : { text: '', margin: [0, 0, 0, 20] }
    );
    return block;
}

// ─── jsPDF / autotable helpers ────────────────────────────────────────────────
export function getAutoTableStyles() {
    return {
        headStyles: {
            fillColor: BRAND_RGB.primary,
            textColor: BRAND_RGB.white,
            fontStyle: 'bold' as const,
            fontSize: 10,
            cellPadding: 5,
        },
        alternateRowStyles: { fillColor: BRAND_RGB.altRow },
        styles: {
            fontSize: 10,
            textColor: BRAND_RGB.textDark,
            cellPadding: 4,
        },
        tableLineColor: BRAND_RGB.border,
        tableLineWidth: 0.1,
    };
}

// Add a jsPDF title block (call before autoTable)
export function addJsPdfTitle(
    doc: any,
    title: string,
    subtitle: string | null,
    opts: PdfOptions
): number {
    let y = 18;

    if (opts.showAssocName) {
        doc.setFontSize(8);
        doc.setTextColor(...BRAND_RGB.textLight);
        doc.text('Musig Elgg', 14, y);
        y += 6;
    }

    doc.setFontSize(18);
    doc.setTextColor(...BRAND_RGB.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, y);
    y += 8;

    if (subtitle) {
        doc.setFontSize(10);
        doc.setTextColor(...BRAND_RGB.textMid);
        doc.setFont('helvetica', 'normal');
        doc.text(subtitle, 14, y);
        y += 6;
    }

    if (opts.showDate) {
        const today = new Date().toLocaleDateString('de-CH');
        doc.setFontSize(8);
        doc.setTextColor(...BRAND_RGB.textLight);
        doc.text(`Generiert am: ${today}`, 14, y);
        y += 8;
    }

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BRAND_RGB.textDark);
    return y + 2; // return next Y position for content
}
