'use strict';
/**
 * Shared PDF design system — used by ALL backend PDF generators.
 * Ensures consistent colours, fonts, layout and header/footer across every export.
 */
const path = require('path');

// ─── Brand colours ────────────────────────────────────────────────────────────
const BRAND = {
    primary:   '#E60004',   // Signal-Rot  – Dokumenttitel, Tabellenkopf-Hintergrund
    accent:    '#2D2A27',   // Warmes Dunkelgrau – Abschnittstitel
    altRow:    '#FDF8F2',   // Warmes Creme – alternierende Tabellenzeilen
    border:    '#E0DAD3',   // Warmes Hellgrau – Tabellenlinien
    textDark:  '#1A1A1B',   // Anthrazit – Fliesstext
    textMid:   '#5A5856',   // Mittleres Warmgrau – Untertitel
    textLight: '#9A9694',   // Helles Warmgrau – Footer / Metadaten
    // Semantic status colours
    green:     '#16a34a',
    amber:     '#d97706',
    red:       '#dc2626',
};

// ─── Roboto fonts (ship with pdfmake) ─────────────────────────────────────────
const FONTS = {
    Roboto: {
        normal:      path.join(__dirname, '../../node_modules/pdfmake/fonts/Roboto/Roboto-Regular.ttf'),
        bold:        path.join(__dirname, '../../node_modules/pdfmake/fonts/Roboto/Roboto-Medium.ttf'),
        italics:     path.join(__dirname, '../../node_modules/pdfmake/fonts/Roboto/Roboto-Italic.ttf'),
        bolditalics: path.join(__dirname, '../../node_modules/pdfmake/fonts/Roboto/Roboto-MediumItalic.ttf'),
    }
};

// ─── Named styles (used as style: 'xxx' in pdfmake content) ──────────────────
const STYLES = {
    header:        { fontSize: 20, bold: true,  color: BRAND.primary, margin: [0, 0, 0, 4] },
    subheader:     { fontSize: 11, color: BRAND.textMid, margin: [0, 0, 0, 14] },
    sectionHeader: { fontSize: 14, bold: true,  color: BRAND.accent,  margin: [0, 14, 0, 7] },
    tableHeader:   { bold: true, fontSize: 10, color: 'white', fillColor: BRAND.primary, margin: [6, 5, 6, 5] },
    cellText:      { fontSize: 10, color: BRAND.textDark, margin: [6, 4, 6, 4] },
    smallText:     { fontSize: 9,  color: BRAND.textMid },
    metaText:      { fontSize: 8,  color: BRAND.textLight },
    noteTitle:     { fontSize: 13, bold: true, color: BRAND.accent },
    statusDone:    { fontSize: 9,  bold: true, color: BRAND.green },
    statusOpen:    { fontSize: 9,  bold: true, color: BRAND.red },
    // Markdown helpers (pdfGenerator / workspace)
    markdownH1:    { fontSize: 13, bold: true,   color: BRAND.textDark },
    markdownH2:    { fontSize: 12, bold: true,   color: BRAND.textMid  },
    markdownH3:    { fontSize: 11, bold: true,   italics: true },
    categoryHeader:{ fontSize: 12, bold: true,   decoration: 'underline' },
};

// ─── Default body style ───────────────────────────────────────────────────────
const DEFAULT_STYLE = { fontSize: 10, font: 'Roboto', lineHeight: 1.3, color: BRAND.textDark };

// ─── Standard table layout with alternating row shading ──────────────────────
const TABLE_LAYOUT = {
    hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 1 : 0.5,
    vLineWidth: ()  => 0,
    hLineColor: (i) => i === 0 ? BRAND.primary : BRAND.border,
    // row 0 is the header — let the tableHeader style supply its own fillColor
    fillColor:  (rowIndex) => rowIndex === 0 ? null : (rowIndex % 2 === 1 ? BRAND.altRow : '#ffffff'),
    paddingLeft:   () => 6,
    paddingRight:  () => 6,
    paddingTop:    () => 4,
    paddingBottom: () => 4,
};

// ─── Options helper ───────────────────────────────────────────────────────────
/**
 * Parse the four boolean PDF options from an Express req.query object.
 * Defaults all options to true when absent or set to '1' / 'true'.
 */
function parseOpts(query = {}) {
    const parse = (val, def = true) => {
        if (val === undefined || val === null) return def;
        return val === 'true' || val === '1' || val === true;
    };
    return {
        showAssocName:   parse(query.showAssocName),
        showDocTitle:    parse(query.showDocTitle),
        showDate:        parse(query.showDate),
        showPageNumbers: parse(query.showPageNumbers),
    };
}

// ─── Title block (first-page header area) ─────────────────────────────────────
/**
 * Returns an array of pdfmake content nodes for the title area on page 1.
 * @param {string} title      - Main document title
 * @param {string} [subtitle] - Optional subtitle / date range / context info
 * @param {object} opts       - Parsed PDF options from parseOpts()
 */
function buildTitleBlock(title, subtitle, opts = {}) {
    const { showAssocName = true, showDate = true } = opts;
    const block = [];

    if (showAssocName) {
        block.push({
            text: 'Musig Elgg',
            fontSize: 9, color: BRAND.textLight, bold: true,
            letterSpacing: 1, margin: [0, 0, 0, 4]
        });
    }

    block.push({ text: title, style: 'header' });

    if (subtitle) {
        block.push({ text: subtitle, style: 'subheader' });
    }

    if (showDate) {
        block.push({
            text: `Generiert am ${new Date().toLocaleDateString('de-CH', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}`,
            fontSize: 8, color: BRAND.textLight, margin: [0, 2, 0, 20]
        });
    } else {
        block.push({ text: '', margin: [0, 0, 0, 20] });
    }

    return block;
}

// ─── Repeating header / footer ────────────────────────────────────────────────
/**
 * Returns pdfmake `header` and `footer` function values.
 * @param {string} docTitle  - Short document name shown in running header
 * @param {object} opts      - Parsed PDF options
 */
function buildHeaderFooter(docTitle, opts = {}) {
    const { showAssocName = true, showDocTitle = true, showDate = true, showPageNumbers = true } = opts;
    const today = new Date().toLocaleDateString('de-CH');

    const header = showAssocName || showDocTitle || showDate
        ? (currentPage) => {
            if (currentPage === 1) return null;
            const leftParts = [];
            if (showAssocName) leftParts.push({ text: 'Musig Elgg', bold: true });
            if (showDocTitle && docTitle) leftParts.push({ text: (leftParts.length ? '  ·  ' : '') + docTitle });
            return {
                columns: [
                    { stack: [{ text: leftParts, fontSize: 8, color: BRAND.textLight }], margin: [40, 18, 0, 0] },
                    showDate
                        ? { text: today, fontSize: 8, color: BRAND.textLight, alignment: 'right', margin: [0, 18, 40, 0] }
                        : {}
                ]
            };
          }
        : undefined;

    const footer = showPageNumbers
        ? (currentPage, pageCount) => ({
            text: `Seite ${currentPage} von ${pageCount}`,
            alignment: 'center', fontSize: 8, color: BRAND.textLight, margin: [0, 8, 0, 0]
          })
        : undefined;

    return { header, footer };
}

module.exports = { BRAND, FONTS, STYLES, DEFAULT_STYLE, TABLE_LAYOUT, parseOpts, buildTitleBlock, buildHeaderFooter };
