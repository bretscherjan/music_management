import { useState, useRef, useEffect, useCallback } from 'react';
import {
    Mic, MicOff, Upload, Loader2, FileText, Download,
    ClipboardList, Sparkles, Check, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import protokollService from '@/services/protokollService';
import type { TranscribeProgress } from '@/services/protokollService';

type Step = 'input' | 'transcribing' | 'editing' | 'summarizing';
type Tab = 'upload' | 'record';

function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

export function ProtokollPage() {
    // ── State ─────────────────────────────────────────────────────
    const [step, setStep] = useState<Step>('input');
    const [tab, setTab] = useState<Tab>('upload');
    const [file, setFile] = useState<File | null>(null);

    // Recording state
    const [isRecording, setIsRecording] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [audioLevel, setAudioLevel] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const animFrameRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Transcription state
    const [progress, setProgress] = useState(0);
    const [progressLabel, setProgressLabel] = useState('');
    const [rawText, setRawText] = useState('');
    const [protocolText, setProtocolText] = useState('');
    const [activeTab, setActiveTab] = useState<'raw' | 'protocol'>('raw');
    const [title, setTitle] = useState('');
    const [durationSeconds, setDurationSeconds] = useState(0);

    // Initialize title
    useEffect(() => {
        const now = new Date();
        setTitle(
            `Protokoll - ${now.toLocaleDateString('de-CH')} ${now.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}`
        );
    }, []);

    // ── Audio Level ───────────────────────────────────────────────
    const trackAudioLevel = (stream: MediaStream) => {
        const ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const tick = () => {
            const data = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(data);
            const avg = data.reduce((a, b) => a + b, 0) / data.length;
            setAudioLevel(Math.min(100, avg * 2));
            animFrameRef.current = requestAnimationFrame(tick);
        };
        tick();
    };

    const stopAll = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
        mediaRecorderRef.current = null;
        streamRef.current = null;
    }, []);

    useEffect(() => () => stopAll(), [stopAll]);

    // ── Recording ─────────────────────────────────────────────────
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            trackAudioLevel(stream);

            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm')
                    ? 'audio/webm'
                    : '';

            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
            chunksRef.current = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };
            recorder.start(1000);
            mediaRecorderRef.current = recorder;

            setElapsed(0);
            setIsRecording(true);
            timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
        } catch {
            toast.error('Mikrofonzugriff verweigert');
        }
    };

    const stopRecording = async (): Promise<Blob> => {
        return new Promise((resolve) => {
            const recorder = mediaRecorderRef.current!;
            recorder.onstop = () => {
                const mimeType = chunksRef.current[0]?.type || 'audio/webm';
                resolve(new Blob(chunksRef.current, { type: mimeType }));
            };
            recorder.stop();
            if (timerRef.current) clearInterval(timerRef.current);
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
            setIsRecording(false);
        });
    };

    // ── Transcription ─────────────────────────────────────────────
    const handleTranscribe = async (audioBlob: Blob, filename: string) => {
        setStep('transcribing');
        setProgress(0);
        setProgressLabel('Starte Transkription…');

        try {
            const result = await protokollService.transcribe(audioBlob, filename, (event: TranscribeProgress) => {
                switch (event.type) {
                    case 'progress':
                        setProgress(event.percent || 0);
                        setProgressLabel(`Chunk ${event.chunk}/${event.total} (${event.percent}%)`);
                        break;
                    case 'error':
                        toast.error(event.detail || 'Fehler bei einem Chunk');
                        break;
                }
            });

            setRawText(result.text);
            setDurationSeconds(result.duration_seconds || 0);
            setStep('editing');
            setActiveTab('raw');
            toast.success('Transkription abgeschlossen!');
        } catch (err: any) {
            toast.error(err.message || 'Transkription fehlgeschlagen');
            setStep('input');
        }
    };

    const handleUploadTranscribe = () => {
        if (!file) return;
        handleTranscribe(file, file.name);
    };

    const handleStopAndTranscribe = async () => {
        const blob = await stopRecording();
        handleTranscribe(blob, 'aufnahme.webm');
    };

    // ── Summarize ─────────────────────────────────────────────────
    const handleSummarize = async () => {
        if (!rawText.trim()) return;
        setStep('summarizing');

        try {
            const protocol = await protokollService.summarize(rawText);
            setProtocolText(protocol);
            setStep('editing');
            setActiveTab('protocol');
            toast.success('Zusammenfassung erstellt!');
        } catch (err: any) {
            toast.error(err.message || 'Zusammenfassung fehlgeschlagen');
            setStep('editing');
        }
    };

    // ── Export ─────────────────────────────────────────────────────
    const handleExport = async (format: 'txt' | 'pdf' | 'md') => {
        const content = activeTab === 'protocol' && protocolText ? protocolText : rawText;
        try {
            await protokollService.exportProtokoll(title, content, format);
            toast.success(`${format.toUpperCase()} heruntergeladen`);
        } catch {
            toast.error('Export fehlgeschlagen');
        }
    };

    // ── Drag & Drop ───────────────────────────────────────────────
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && (droppedFile.type.startsWith('audio/') || droppedFile.type.startsWith('video/'))) {
            setFile(droppedFile);
        } else {
            toast.error('Bitte eine Audio- oder Videodatei auswählen');
        }
    };

    // ── Render ─────────────────────────────────────────────────────
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-[#BDD18C]/20 rounded-xl">
                    <ClipboardList className="h-7 w-7 text-[#405116]" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Protokoll</h1>
                    <p className="text-sm text-gray-500">
                        Audio aufnehmen oder hochladen → automatisch transkribieren & zusammenfassen
                    </p>
                </div>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-2 text-sm">
                {[
                    { key: 'input', label: '1. Audio' },
                    { key: 'transcribing', label: '2. Transkription' },
                    { key: 'editing', label: '3. Bearbeiten & Export' },
                ].map((s, i) => {
                    const isCurrent = step === s.key || (step === 'summarizing' && s.key === 'editing');
                    const isDone =
                        (s.key === 'input' && step !== 'input') ||
                        (s.key === 'transcribing' && (step === 'editing' || step === 'summarizing'));
                    return (
                        <div key={s.key} className="flex items-center gap-2">
                            {i > 0 && <div className="w-8 h-px bg-gray-300" />}
                            <div
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${isCurrent
                                    ? 'bg-[#BDD18C] text-[#405116]'
                                    : isDone
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-400'
                                    }`}
                            >
                                {isDone && <Check className="h-3 w-3" />}
                                {s.label}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ═══ STEP 1: Audio Input ═══ */}
            {step === 'input' && (
                <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
                    {/* Tab Switcher */}
                    <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                        <button
                            onClick={() => setTab('upload')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${tab === 'upload'
                                ? 'bg-white shadow-sm text-gray-900'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Upload className="h-4 w-4" />
                            Datei hochladen
                        </button>
                        <button
                            onClick={() => setTab('record')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${tab === 'record'
                                ? 'bg-white shadow-sm text-gray-900'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Mic className="h-4 w-4" />
                            Live aufnehmen
                        </button>
                    </div>

                    {/* Upload Tab */}
                    {tab === 'upload' && (
                        <div className="space-y-4">
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                onDragLeave={() => setIsDragOver(false)}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${isDragOver
                                    ? 'border-[#BDD18C] bg-[#BDD18C]/5'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                                <p className="text-gray-600 mb-2">
                                    Audiodatei hier hineinziehen
                                </p>
                                <p className="text-xs text-gray-400 mb-3">
                                    oder Datei auswählen (WAV, MP3, WebM, OGG, MP4 – bis 500 MB)
                                </p>
                                <input
                                    type="file"
                                    accept="audio/*,video/*"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                    id="audio-upload"
                                />
                                <Button variant="outline" size="sm" onClick={() => document.getElementById('audio-upload')?.click()}>
                                    Datei auswählen
                                </Button>
                            </div>

                            {file && (
                                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm font-medium">{file.name}</span>
                                        <span className="text-xs text-gray-400">
                                            ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                                        </span>
                                    </div>
                                    <Button onClick={handleUploadTranscribe} className="gap-2">
                                        <Sparkles className="h-4 w-4" />
                                        Transkribieren
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Record Tab */}
                    {tab === 'record' && (
                        <div className="flex flex-col items-center gap-6 py-6">
                            {/* Audio Level */}
                            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-red-500 transition-all duration-100 rounded-full"
                                    style={{ width: `${isRecording ? audioLevel : 0}%` }}
                                />
                            </div>

                            {/* Timer */}
                            <span className="text-4xl font-mono tabular-nums">
                                {formatTime(elapsed)}
                            </span>

                            {/* Controls */}
                            {!isRecording ? (
                                <Button
                                    onClick={startRecording}
                                    className="gap-2 bg-red-600 hover:bg-red-700 text-white"
                                    size="lg"
                                >
                                    <Mic className="h-5 w-5" />
                                    Aufnahme starten
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleStopAndTranscribe}
                                    variant="destructive"
                                    size="lg"
                                    className="gap-2 animate-pulse"
                                >
                                    <MicOff className="h-5 w-5" />
                                    Stoppen & Transkribieren
                                </Button>
                            )}

                            <p className="text-xs text-gray-400 text-center">
                                Dialekt wird automatisch in Hochdeutsch transkribiert.
                                <br />
                                Aufnahmen bis zu 3 Stunden möglich.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ STEP 2: Transcribing ═══ */}
            {step === 'transcribing' && (
                <div className="bg-white rounded-2xl shadow-sm border p-8 text-center space-y-6">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-[#BDD18C]" />
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-1">
                            Transkribiere Audio…
                        </h2>
                        <p className="text-sm text-gray-500">{progressLabel}</p>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                        <div
                            className="h-full bg-[#BDD18C] transition-all duration-300 rounded-full"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-400">
                        Dies kann bei langen Aufnahmen einige Minuten dauern.
                    </p>
                </div>
            )}

            {/* ═══ STEP 3: Editing & Export ═══ */}
            {(step === 'editing' || step === 'summarizing') && (
                <div className="space-y-4">
                    {/* Title */}
                    <div className="bg-white rounded-2xl shadow-sm border p-4">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Protokolltitel
                        </label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="z.B. Vorstandssitzung März 2026"
                            className="text-lg"
                        />
                    </div>

                    {/* Text Tabs */}
                    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                        <div className="flex border-b">
                            <button
                                onClick={() => setActiveTab('raw')}
                                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'raw'
                                    ? 'text-[#405116] border-b-2 border-[#BDD18C] bg-[#BDD18C]/5'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Rohtext
                            </button>
                            <button
                                onClick={() => setActiveTab('protocol')}
                                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'protocol'
                                    ? 'text-[#405116] border-b-2 border-[#BDD18C] bg-[#BDD18C]/5'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Strukturiertes Protokoll
                                {!protocolText && (
                                    <span className="ml-1 text-[10px] text-gray-400">(noch nicht erstellt)</span>
                                )}
                            </button>
                        </div>

                        <div className="p-4">
                            {activeTab === 'raw' && (
                                <Textarea
                                    value={rawText}
                                    onChange={(e) => setRawText(e.target.value)}
                                    rows={16}
                                    className="font-mono text-sm resize-y"
                                    placeholder="Transkribierter Text erscheint hier…"
                                />
                            )}
                            {activeTab === 'protocol' && (
                                protocolText ? (
                                    <Textarea
                                        value={protocolText}
                                        onChange={(e) => setProtocolText(e.target.value)}
                                        rows={16}
                                        className="font-mono text-sm resize-y"
                                    />
                                ) : (
                                    <div className="text-center py-12 text-gray-400">
                                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                                        <p>Noch kein Protokoll erstellt.</p>
                                        <p className="text-xs mt-1">Klicke unten auf "Zusammenfassung generieren".</p>
                                    </div>
                                )
                            )}
                        </div>

                        {/* Info bar */}
                        {durationSeconds > 0 && (
                            <div className="px-4 pb-3 flex items-center gap-4 text-xs text-gray-400">
                                <span>Dauer: {formatTime(Math.round(durationSeconds))}</span>
                                <span>Zeichen: {(activeTab === 'protocol' ? protocolText : rawText).length.toLocaleString()}</span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                        {/* Summarize Button */}
                        <Button
                            onClick={handleSummarize}
                            disabled={step === 'summarizing' || !rawText.trim()}
                            className="gap-2"
                            variant="default"
                        >
                            {step === 'summarizing' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="h-4 w-4" />
                            )}
                            {step === 'summarizing' ? 'Generiere…' : 'Zusammenfassung generieren'}
                        </Button>

                        <div className="flex-1" />

                        {/* Export Buttons */}
                        <Button
                            onClick={() => handleExport('txt')}
                            variant="outline"
                            className="gap-2"
                        >
                            <Download className="h-4 w-4" />
                            TXT
                        </Button>
                        <Button
                            onClick={() => handleExport('md')}
                            variant="outline"
                            className="gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Markdown
                        </Button>
                        <Button
                            onClick={() => handleExport('pdf')}
                            variant="outline"
                            className="gap-2"
                        >
                            <Download className="h-4 w-4" />
                            PDF
                        </Button>
                    </div>

                    {/* New Protocol Button */}
                    <div className="text-center pt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setStep('input');
                                setRawText('');
                                setProtocolText('');
                                setProgress(0);
                                setFile(null);
                                setElapsed(0);
                                const now = new Date();
                                setTitle(
                                    `Protokoll - ${now.toLocaleDateString('de-CH')} ${now.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}`
                                );
                            }}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            Neues Protokoll erstellen
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
