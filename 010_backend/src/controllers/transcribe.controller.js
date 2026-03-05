const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');

// Whisper server URL – can be overridden via environment variable
const WHISPER_URL = process.env.WHISPER_URL || 'http://ollama.letsbuild.ch:9000/';

// Store audio in memory (max 200 MB) – large enough for long meetings
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 200 * 1024 * 1024 },
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
 * GET /api/transcribe/health
 * Checks whether the Whisper server is reachable and ready.
 */
const checkHealth = async (_req, res) => {
    try {
        const response = await axios.get(`${WHISPER_URL}/health`, { timeout: 5000 });
        return res.json(response.data);
    } catch (err) {
        return res.status(503).json({
            status: 'unavailable',
            message: 'Whisper-Server ist nicht erreichbar',
            detail: err.message,
        });
    }
};

/**
 * POST /api/transcribe
 * Receives an audio blob from the frontend, forwards it to the Whisper
 * container and returns the transcribed Standard German text.
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

        const response = await axios.post(`${WHISPER_URL}/transcribe`, form, {
            headers: form.getHeaders(),
            // Allow up to 30 minutes for very long recordings
            timeout: 30 * 60 * 1000,
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
        });

        return res.json(response.data);
    } catch (err) {
        const detail = err.response?.data?.detail || err.message;
        return res.status(500).json({
            message: 'Transkription fehlgeschlagen',
            detail,
        });
    }
};

module.exports = { upload, checkHealth, transcribe };
