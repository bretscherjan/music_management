import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEventsHelper } from '../../helpers/useEventsHelper';

export const CheckInPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { checkIn } = useEventsHelper();
    const [qrCode, setQrCode] = useState('');
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState('');

    const handleCheckIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        try {
            await checkIn(id, qrCode);
            setStatus('success');
            setMsg('Erfolgreich eingecheckt!');
            setTimeout(() => navigate('/events-member'), 2000);
        } catch (error) {
            setStatus('error');
            setMsg('Fehler beim Check-in Invalid Code?');
        }
    };

    return (
        <div className="p-6 max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-primary-800 mb-6">Event Check-In</h1>
            <div className="bg-white p-6 rounded-xl shadow-card">
                <form onSubmit={handleCheckIn} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">QR Code (Simulation)</label>
                        <input
                            type="text"
                            value={qrCode}
                            onChange={e => setQrCode(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                            placeholder="QR Code Content..."
                        />
                    </div>
                    <button type="submit" className="w-full btn btn-primary py-3">
                        Check In Bestätigen
                    </button>
                </form>
                {status === 'success' && <div className="mt-4 p-3 bg-green-100 text-green-800 rounded">{msg}</div>}
                {status === 'error' && <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">{msg}</div>}
            </div>
        </div>
    );
};
