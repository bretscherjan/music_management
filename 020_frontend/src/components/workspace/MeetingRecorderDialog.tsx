import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import transcribeService from '@/services/transcribeService';

interface MeetingRecorderDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (title: string, content: string) => void;
}

type RecorderState = 'idle' | 'recording' | 'transcribing' | 'done';

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

export function MeetingRecorderDialog({ open, onClose, onSave }: MeetingRecorderDialogProps) {
    const [recorderState, setRecorderState] = useState<RecorderState>('idle');
    const [elapsed, setElapsed] = useState(0);
    const [transcribedText, setTranscribedText] = useState('');
    const [noteTitle, setNoteTitle] = useState('');
    const [audioLevel, setAudioLevel] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animFrameRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setRecorderState('idle');
            setElapsed(0);
            setTranscribedText('');
            const now = new Date();
            setNoteTitle(
                `Protokoll - ${now.toLocaleDateString('de-CH')} ${now.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}`
            );
        } else {
            stopAll();
        }
    }, [open]);

    const stopAll = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
        mediaRecorderRef.current = null;
        streamRef.current = null;
    };

    const trackAudioLevel = (stream: MediaStream) => {
        const ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const tick = () => {
            const data = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(data);
            const avg = data.reduce((a, b) => a + b, 0) / data.length;
            setAudioLevel(Math.min(100, avg * 2));
            animFrameRef.current = requestAnimationFrame(tick);
        };
        tick();
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            trackAudioLevel(stream);

            // Prefer webm/opus; fall back to whatever is available
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

            recorder.start(1000); // collect every 1s
            mediaRecorderRef.current = recorder;

            setElapsed(0);
            setRecorderState('recording');

            timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
        } catch (err) {
            console.error(err);
            toast.error('Mikrofonzugriff verweigert');
        }
    };

    const stopAndTranscribe = async () => {
        if (!mediaRecorderRef.current) return;

        if (timerRef.current) clearInterval(timerRef.current);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

        setRecorderState('transcribing');

        await new Promise<void>((resolve) => {
            const recorder = mediaRecorderRef.current!;
            recorder.onstop = () => resolve();
            recorder.stop();
        });

        if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());

        const mimeType = chunksRef.current[0]?.type || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });

        try {
            const result = await transcribeService.transcribe(blob, 'sitzung.webm');
            setTranscribedText(result.text);
            setRecorderState('done');
        } catch (err) {
            console.error(err);
            toast.error('Transkription fehlgeschlagen – ist der Whisper-Server gestartet?');
            setRecorderState('idle');
        }
    };

    const handleSave = () => {
        if (!noteTitle.trim() || !transcribedText.trim()) return;
        onSave(noteTitle.trim(), transcribedText.trim());
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>🎙 Sitzungsaufnahme</DialogTitle>
                    <DialogDescription>
                        Nimm die Sitzung auf. Schweizerdeutscher Dialekt wird automatisch in
                        Hochdeutsch transkribiert.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Recording controls */}
                    {recorderState !== 'done' && (
                        <div className="flex flex-col items-center gap-4 py-4">
                            {/* Audio level visualizer */}
                            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-red-500 transition-all duration-100 rounded-full"
                                    style={{ width: `${audioLevel}%` }}
                                />
                            </div>

                            {/* Timer */}
                            <span className="text-3xl font-mono tabular-nums text-center">
                                {formatTime(elapsed)}
                            </span>

                            {recorderState === 'idle' && (
                                <Button
                                    onClick={startRecording}
                                    className="gap-2 bg-red-600 hover:bg-red-700 text-white"
                                    size="lg"
                                >
                                    <Mic className="h-5 w-5" />
                                    Aufnahme starten
                                </Button>
                            )}

                            {recorderState === 'recording' && (
                                <Button
                                    onClick={stopAndTranscribe}
                                    variant="destructive"
                                    size="lg"
                                    className="gap-2 animate-pulse"
                                >
                                    <MicOff className="h-5 w-5" />
                                    Stoppen &amp; Transkribieren
                                </Button>
                            )}

                            {recorderState === 'transcribing' && (
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                    <span>
                                        Transkribiere mit Whisper…
                                        <br />
                                        <span className="text-xs">(dies kann einige Minuten dauern)</span>
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Result editor */}
                    {recorderState === 'done' && (
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Titel</label>
                                <Input
                                    value={noteTitle}
                                    onChange={(e) => setNoteTitle(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">
                                    Transkription (bearbeitbar)
                                </label>
                                <Textarea
                                    value={transcribedText}
                                    onChange={(e) => setTranscribedText(e.target.value)}
                                    rows={12}
                                    className="font-mono text-sm"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Abbrechen
                    </Button>
                    {recorderState === 'done' && (
                        <Button onClick={handleSave} disabled={!noteTitle.trim()} className="gap-2">
                            <Save className="h-4 w-4" />
                            Als Notiz speichern
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
