import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { LoginDto } from '../../api/web-api-client';

function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); // Clear previous errors
        try {
            const dto = { email, password } as LoginDto;
            await login(dto);
            navigate('/internal/dashboard');
        } catch (error) {
            alert('Login failed'); // As per instruction
            setError("Login failed. Check credentials."); // Keeping original error message for display
        }
    };

    return (
        <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <h1 className="text-3xl font-heading font-bold text-primary mb-6 text-center">Musig Elgg Login</h1>

                {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 border p-2"
                            placeholder="admin@musigelgg.ch"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 border p-2"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-primary text-white font-bold py-2 px-4 rounded hover:bg-red-700 transition-colors"
                    >
                        Login
                    </button>
                    <div className="text-center mt-4">
                        <a href="/" className="text-sm text-gray-500 hover:text-primary">Zurück zur Website</a>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default LoginPage;
