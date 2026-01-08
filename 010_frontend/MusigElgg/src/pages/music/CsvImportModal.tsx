import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useMusicMutations } from './musicHelper';

interface CsvImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose }) => {
    const { importCsv } = useMusicMutations();
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State for import results
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
        details?: { totalRows: number; successCount: number; errorCount: number; errors: any[] };
    } | null>(null);

    if (!isOpen) return null;

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (file: File) => {
        if (file.type === "text/csv" || file.name.endsWith('.csv')) {
            setSelectedFile(file);
            setResult(null);
        } else {
            setResult({
                success: false,
                message: "Bitte laden Sie eine gültige CSV-Datei hoch."
            });
        }
    };

    const handleImport = () => {
        if (!selectedFile) return;

        importCsv.mutate({ file: selectedFile }, {
            onSuccess: (data) => {
                setResult({
                    success: true,
                    message: "Import erfolgreich abgeschlossen",
                    details: data
                });
                setSelectedFile(null);
            },
            onError: (error) => {
                setResult({
                    success: false,
                    message: `Fehler beim Import: ${error.message}`
                });
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div className="fixed inset-0 bg-gray-500/75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                    Noten importieren (CSV)
                                </h3>
                                <div className="mt-4">
                                    {!result?.success ? (
                                        <div
                                            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${dragActive ? 'border-secondary-500 bg-secondary-50' : 'border-gray-300 hover:border-secondary-400'}`}
                                            onDragEnter={handleDrag}
                                            onDragLeave={handleDrag}
                                            onDragOver={handleDrag}
                                            onDrop={handleDrop}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <div className="space-y-1 text-center">
                                                {selectedFile ? (
                                                    <div className="flex flex-col items-center p-4">
                                                        <FileText className="h-10 w-10 text-secondary-600 mb-2" />
                                                        <p className="text-sm text-gray-700 font-medium">{selectedFile.name}</p>
                                                        <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                                                            className="mt-2 text-xs text-red-600 hover:text-red-800"
                                                        >
                                                            Entfernen
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                                        <div className="flex text-sm text-gray-600 justify-center">
                                                            <span className="relative cursor-pointer bg-white rounded-md font-medium text-secondary-600 hover:text-secondary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-secondary-500">
                                                                <span>Datei auswählen</span>
                                                                <input ref={fileInputRef} type="file" className="sr-only" accept=".csv" onChange={handleChange} />
                                                            </span>
                                                            <p className="pl-1">oder hierhinein ziehen</p>
                                                        </div>
                                                        <p className="text-xs text-gray-500">CSV bis zu 10MB</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-md bg-green-50 p-4">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
                                                </div>
                                                <div className="ml-3">
                                                    <h3 className="text-sm font-medium text-green-800">Import erfolgreich</h3>
                                                    <div className="mt-2 text-sm text-green-700">
                                                        <p>Verarbeitet: {result.details?.totalRows}</p>
                                                        <p>Erfolgreich: {result.details?.successCount}</p>
                                                        {result.details?.errorCount! > 0 && <p>Fehler: {result.details?.errorCount}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Error Display */}
                                    {result && !result.success && (
                                        <div className="rounded-md bg-red-50 p-4 mt-4">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                                                </div>
                                                <div className="ml-3">
                                                    <h3 className="text-sm font-medium text-red-800">Fehler</h3>
                                                    <div className="mt-2 text-sm text-red-700">
                                                        <p>{result.message}</p>
                                                        {result.details?.errors?.slice(0, 3).map((err, i) => (
                                                            <p key={i} className="text-xs mt-1">
                                                                Zeile {err.lineNumber}: {err.message}
                                                            </p>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        {!result?.success ? (
                            <button
                                type="button"
                                disabled={!selectedFile || importCsv.isPending}
                                onClick={handleImport}
                                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm ${(!selectedFile || importCsv.isPending) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {importCsv.isPending ? 'Importiere...' : 'Importieren'}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => { onClose(); setResult(null); setSelectedFile(null); }}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                Schließen
                            </button>
                        )}
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={onClose}
                        >
                            Abbrechen
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
