/**
 * LLM Service – Abstracts communication with Ollama (local) or OpenAI (cloud).
 * Used for turning raw transcriptions into structured meeting protocols.
 */
const axios = require('axios');

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'ollama'; // 'ollama' or 'openai'
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const SYSTEM_PROMPT = `Du bist ein erfahrener Protokollführer eines Schweizer Musikvereins. 
Erstelle aus dem folgenden transkribierten Text ein gut strukturiertes, formelles Sitzungsprotokoll auf Hochdeutsch.

Das Protokoll soll folgende Struktur haben:

# Protokoll [Art der Sitzung]

**Datum:** [falls erkennbar, sonst "Siehe Angaben"]
**Anwesende:** [falls erkennbar aus dem Text]

## Tagesordnung
[Nummerierte Liste der besprochenen Themen]

## Besprochene Punkte
[Für jeden Tagesordnungspunkt eine kurze Zusammenfassung der Diskussion]

## Beschlüsse
[Alle gefassten Beschlüsse als nummerierte Liste]

## Nächste Schritte / Aufgaben
[Wer macht was bis wann]

## Nächste Sitzung
[Falls erwähnt]

---

Wichtige Regeln:
- Schreibe in der dritten Person und im Präteritum
- Sei präzise und sachlich
- Fasse redundante Diskussionen zusammen
- Hebe Beschlüsse und Abstimmungsergebnisse hervor
- Wenn etwas unklar ist, markiere es mit [unklar]
- Ergänze KEINE Informationen, die nicht im Text vorkommen`;

/**
 * Summarize raw transcription text into a structured protocol.
 * @param {string} rawText - The raw transcription text
 * @returns {Promise<string>} - The structured protocol in Markdown
 */
async function summarize(rawText) {
    // Truncate if the text is extremely long (LLM context limits)
    const maxChars = 50000;
    const text = rawText.length > maxChars
        ? rawText.substring(0, maxChars) + '\n\n[... Text wurde gekürzt wegen Längenbeschränkung ...]'
        : rawText;

    if (LLM_PROVIDER === 'openai') {
        return summarizeOpenAI(text);
    }
    return summarizeOllama(text);
}

async function summarizeOllama(text) {
    try {
        const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
            model: OLLAMA_MODEL,
            prompt: `Hier ist der transkribierte Text der Sitzung:\n\n${text}`,
            system: SYSTEM_PROMPT,
            stream: false,
            options: {
                temperature: 0.3,
                num_predict: 4096,
            },
        }, {
            timeout: 10 * 60 * 1000, // 10 minutes for long texts
        });

        return response.data.response;
    } catch (err) {
        console.error('Ollama summarization failed:', err.message);
        throw new Error(`LLM-Zusammenfassung fehlgeschlagen: ${err.message}`);
    }
}

async function summarizeOpenAI(text) {
    if (!OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY ist nicht konfiguriert');
    }

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: OPENAI_MODEL,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: `Hier ist der transkribierte Text der Sitzung:\n\n${text}` },
            ],
            temperature: 0.3,
            max_tokens: 4096,
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            timeout: 5 * 60 * 1000,
        });

        return response.data.choices[0].message.content;
    } catch (err) {
        console.error('OpenAI summarization failed:', err.message);
        throw new Error(`LLM-Zusammenfassung fehlgeschlagen: ${err.message}`);
    }
}

/**
 * Check if the LLM service is available.
 */
async function checkHealth() {
    if (LLM_PROVIDER === 'openai') {
        return { provider: 'openai', status: OPENAI_API_KEY ? 'configured' : 'missing_key' };
    }

    try {
        const response = await axios.get(`${OLLAMA_URL}/api/tags`, { timeout: 5000 });
        const models = response.data.models || [];
        const hasModel = models.some((m) => m.name.startsWith(OLLAMA_MODEL.split(':')[0]));
        return {
            provider: 'ollama',
            status: hasModel ? 'ok' : 'model_missing',
            model: OLLAMA_MODEL,
            available_models: models.map((m) => m.name),
        };
    } catch (err) {
        return { provider: 'ollama', status: 'unavailable', detail: err.message };
    }
}

module.exports = { summarize, checkHealth };
