const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const PDFDocument = require('pdfkit');
const llmService = require('../services/llm.service');

const WHISPER_URL = process.env.WHISPER_URL || 'http://whisper-api:8000';

// Store audio in memory (max 500 MB) – large enough for 3h recordings
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 500 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['audio/', 'video/'];
        if (allowed.some((prefix) => file.mimetype.startsWith(prefix))) {
            cb(null, true);
        } else {
            cb(new Error('Nur Audio- oder Videodateien sind erlaubt'));
        }
    },
});

/**
 * POST /api/protokoll/transcribe
 * Forwards audio to Whisper's chunked endpoint and streams progress back.
 */
const transcribe = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Keine Audiodatei übermittelt' });
    }

    try {
        const form = new FormData();
        form.append('audio', req.file.buffer, {
            filename: req.file.originalname || 'recording.webm',
            contentType: req.file.mimetype || 'audio/webm',
        });

        // Check file size to decide endpoint
        const isLarge = req.file.size > 20 * 1024 * 1024; // > 20 MB → chunked
        const endpoint = isLarge ? '/transcribe-chunked' : '/transcribe';

        if (!isLarge) {
            // Simple transcription for short files
            const response = await axios.post(`${WHISPER_URL}${endpoint}`, form, {
                headers: { ...form.getHeaders() },
                timeout: 30 * 60 * 1000,
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
            });
            return res.json(response.data);
        }

        // Chunked transcription with SSE passthrough
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const response = await axios.post(`${WHISPER_URL}${endpoint}`, form, {
            headers: { ...form.getHeaders() },
            timeout: 3 * 60 * 60 * 1000, // 3 hours
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            responseType: 'stream',
        });

        response.data.pipe(res);

        response.data.on('end', () => {
            res.end();
        });

        response.data.on('error', (err) => {
            console.error('SSE stream error:', err);
            res.end();
        });

    } catch (err) {
        const detail = err.response?.data?.detail || err.message;
        if (!res.headersSent) {
            return res.status(500).json({
                message: 'Transkription fehlgeschlagen',
                detail,
            });
        }
    }
};

/**
 * POST /api/protokoll/summarize
 * Takes raw transcription text and returns a structured protocol via LLM.
 */
const summarize = async (req, res) => {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length < 10) {
        return res.status(400).json({ message: 'Text ist zu kurz oder fehlt' });
    }

    try {
        const protocol = await llmService.summarize(text);
        return res.json({ protocol });
    } catch (err) {
        return res.status(500).json({
            message: 'Zusammenfassung fehlgeschlagen',
            detail: err.message,
        });
    }
};

/**
 * POST /api/protokoll/export
 * Takes title + content + format, generates downloadable file.
 */
const exportProtokoll = async (req, res) => {
    const { title, content, format } = req.body;

    if (!content || !format) {
        return res.status(400).json({ message: 'content und format sind erforderlich' });
    }

    const safeTitle = (title || 'Protokoll').replace(/[^a-zA-Z0-9äöüÄÖÜß\s_-]/g, '').substring(0, 100);

    try {
        switch (format) {
            case 'txt': {
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.txt"`);
                return res.send(content);
            }

            case 'md': {
                res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.md"`);
                return res.send(content);
            }

            case 'pdf': {
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.pdf"`);

                const doc = new PDFDocument({
                    margin: 50,
                    size: 'A4',
                    info: {
                        Title: safeTitle,
                        Author: 'Musig Elgg',
                    },
                });

                doc.pipe(res);

                // Title
                doc.fontSize(20).font('Helvetica-Bold').text(safeTitle, { align: 'center' });
                doc.moveDown(1);

                // Parse markdown-like content into PDF
                const lines = content.split('\n');
                for (const line of lines) {
                    if (line.startsWith('# ')) {
                        doc.moveDown(0.5);
                        doc.fontSize(18).font('Helvetica-Bold').text(line.substring(2));
                        doc.moveDown(0.3);
                    } else if (line.startsWith('## ')) {
                        doc.moveDown(0.5);
                        doc.fontSize(14).font('Helvetica-Bold').text(line.substring(3));
                        doc.moveDown(0.2);
                    } else if (line.startsWith('**') && line.endsWith('**')) {
                        doc.fontSize(11).font('Helvetica-Bold').text(line.replace(/\*\*/g, ''));
                    } else if (line.startsWith('- ') || line.startsWith('* ')) {
                        doc.fontSize(11).font('Helvetica').text(`  • ${line.substring(2)}`, { indent: 15 });
                    } else if (line.match(/^\d+\.\s/)) {
                        doc.fontSize(11).font('Helvetica').text(`  ${line}`, { indent: 15 });
                    } else if (line.trim() === '---') {
                        doc.moveDown(0.3);
                        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
                        doc.moveDown(0.3);
                    } else if (line.trim() === '') {
                        doc.moveDown(0.3);
                    } else {
                        // Handle inline bold **text**
                        const parts = line.split(/(\*\*[^*]+\*\*)/g);
                        if (parts.length > 1) {
                            let xPos = doc.x;
                            for (const part of parts) {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                    doc.font('Helvetica-Bold').fontSize(11);
                                    doc.text(part.replace(/\*\*/g, ''), { continued: true });
                                } else {
                                    doc.font('Helvetica').fontSize(11);
                                    doc.text(part, { continued: true });
                                }
                            }
                            doc.text(''); // End line
                        } else {
                            doc.fontSize(11).font('Helvetica').text(line);
                        }
                    }
                }

                doc.end();
                return;
            }

            default:
                return res.status(400).json({ message: `Unbekanntes Format: ${format}` });
        }
    } catch (err) {
        console.error('Export failed:', err);
        if (!res.headersSent) {
            return res.status(500).json({ message: 'Export fehlgeschlagen', detail: err.message });
        }
    }
};

/**
 * GET /api/protokoll/health
 * Check both Whisper and LLM availability.
 */
const checkHealth = async (_req, res) => {
    const results = {};

    // Check Whisper
    try {
        const wr = await axios.get(`${WHISPER_URL}/health`, { timeout: 5000 });
        results.whisper = wr.data;
    } catch (err) {
        results.whisper = { status: 'unavailable', detail: err.message };
    }

    // Check LLM
    results.llm = await llmService.checkHealth();

    const allOk = results.whisper?.status === 'ok' && results.llm?.status === 'ok';
    return res.status(allOk ? 200 : 503).json(results);
};

module.exports = { upload, transcribe, summarize, exportProtokoll, checkHealth };
