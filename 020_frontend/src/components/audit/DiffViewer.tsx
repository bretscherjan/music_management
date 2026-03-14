import React from 'react';
import { X } from 'lucide-react';

interface DiffViewerProps {
    oldValue: any;
    newValue: any;
    onClose: () => void;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ oldValue, newValue, onClose }) => {
    // Helper to flatten or process objects? 
    // Ideally we just compare top level keys or do modest recursion.
    // For simplicity, let's look at all unique keys from both objects.

    // Safety check if values are strings (serialized JSON) or objects
    const parse = (val: any) => {
        if (typeof val === 'string') {
            try { return JSON.parse(val); } catch (e) { return val; }
        }
        return val;
    };

    const oldObj = parse(oldValue) || {};
    const newObj = parse(newValue) || {};

    const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]));

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-end z-50 transition-opacity" onClick={onClose}>
            <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col transform transition-transform" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-800">Änderungsdetails</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full">
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-12 gap-4 font-mono text-sm border-b pb-2 mb-2 font-bold text-gray-500">
                        <div className="col-span-3">Feld</div>
                        <div className="col-span-4">Vorher</div>
                        <div className="col-span-1 text-center">→</div>
                        <div className="col-span-4">Nachher</div>
                    </div>

                    {allKeys.map(key => {
                        const vOld = oldObj[key];
                        const vNew = newObj[key];

                        // Simple equality check (works for primitives)
                        const isChanged = JSON.stringify(vOld) !== JSON.stringify(vNew);
                        const isAdded = vOld === undefined;
                        const isRemoved = vNew === undefined;

                        if (!isChanged) return null; // Skip unchanged fields? Or show all? Usually only changed.
                        // Let's show only changed fields for cleanliness.

                        // Format value
                        const format = (v: any) => {
                            if (v === undefined) return <span className="text-gray-300 italic">undefined</span>;
                            if (v === null) return <span className="text-gray-400 italic">null</span>;
                            if (typeof v === 'object') return JSON.stringify(v); // simplified
                            return String(v);
                        };

                        return (
                            <div key={key} className="grid grid-cols-12 gap-4 py-2 border-b hover:bg-gray-50 items-center">
                                <div className="col-span-3 font-semibold text-gray-700 truncate" title={key}>{key}</div>
                                <div className={`col-span-4 break-words ${isRemoved ? 'bg-red-50 text-red-700 p-1 rounded' : 'text-gray-600'}`}>
                                    {format(vOld)}
                                </div>
                                <div className="col-span-1 text-center text-gray-400">→</div>
                                <div className={`col-span-4 break-words ${isAdded ? 'bg-success/5 text-success p-1 rounded' : isChanged ? 'bg-yellow-50 text-yellow-700 p-1 rounded' : 'text-gray-600'}`}>
                                    {format(vNew)}
                                </div>
                            </div>
                        );
                    })}

                    {allKeys.length === 0 && (
                        <div className="text-center text-gray-500 py-10">Keine Daten verfügbar</div>
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50 text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-gray-800">
                        Schliessen
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DiffViewer;
