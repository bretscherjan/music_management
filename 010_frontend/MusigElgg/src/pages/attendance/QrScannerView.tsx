import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useAttendanceMutations } from './attendanceHelper';
import { CheckCircle, XCircle, Camera } from 'lucide-react';

export const QrScannerView: React.FC = () => {
    const { checkinQr } = useAttendanceMutations();
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(true);

    const handleScan = (detectedCodes: any[]) => {
        if (detectedCodes && detectedCodes.length > 0) {
            const rawValue = detectedCodes[0].rawValue;
            if (rawValue && rawValue !== result) {
                setResult(rawValue);
                setIsScanning(false); // Pause scanning
                checkinQr.mutate(rawValue, {
                    onSuccess: () => {
                        setError(null);
                        // Auto resume after success? Or keep success message?
                        // Let's keep success message for 3s then resume
                        setTimeout(() => {
                            setResult(null);
                            setIsScanning(true);
                        }, 3000);
                    },
                    onError: () => {
                        setError("Ungültiger Code oder bereits eingecheckt.");
                        setTimeout(() => {
                            setResult(null);
                            setIsScanning(true);
                            setError(null);
                        }, 3000);
                    }
                });
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-neutral-50 min-h-[400px] rounded-xl">
            <h2 className="text-xl font-bold text-primary-800 mb-6 flex items-center">
                <Camera className="mr-2 h-6 w-6" />
                Anwesenheit Scannen
            </h2>

            <div className="w-full max-w-sm aspect-square relative rounded-xl overflow-hidden shadow-2xl bg-black">
                {isScanning ? (
                    <Scanner
                        onScan={handleScan}
                        allowMultiple={true}
                        scanDelay={1000}
                        components={{
                            onOff: true,
                            torch: true
                        }}
                        styles={{
                            container: { width: '100%', height: '100%' },
                            video: { width: '100%', height: '100%', objectFit: 'cover' }
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-black/80 text-white">
                        {checkinQr.isPending ? "Verarbeite..." : "Pausiert"}
                    </div>
                )}

                {/* Gold Frame Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    {/* Safe Area / Frame */}
                    <div className="w-64 h-64 relative">
                        {/* Corners */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-secondary-500 rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-secondary-500 rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-secondary-500 rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-secondary-500 rounded-br-lg"></div>

                        {/* Pulse Animation */}
                        {isScanning && (
                            <div className="absolute inset-0 border-2 border-secondary-500/30 rounded-lg animate-pulse"></div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-6 w-full max-w-sm">
                {result && !error && checkinQr.isSuccess && (
                    <div className="flex items-center justify-center text-green-700 bg-green-50 px-4 py-3 rounded-lg border border-green-200 animate-in fade-in slide-in-from-bottom-2">
                        <CheckCircle className="h-6 w-6 mr-2 flex-shrink-0" />
                        <div>
                            <p className="font-bold">Check-in Erfolgreich!</p>
                        </div>
                    </div>
                )}

                {(error || checkinQr.isError) && (
                    <div className="flex items-center justify-center text-red-700 bg-red-50 px-4 py-3 rounded-lg border border-red-200 animate-in fade-in slide-in-from-bottom-2">
                        <XCircle className="h-6 w-6 mr-2 flex-shrink-0" />
                        <div>
                            <p className="font-bold">Fehler</p>
                            <p className="text-sm">{error || "Verbindung fehlgeschlagen"}</p>
                        </div>
                    </div>
                )}

                {!result && !error && (
                    <p className="text-neutral-500 text-sm text-center">
                        Richte die Kamera auf den QR-Code.
                    </p>
                )}
            </div>
        </div>
    );
};
