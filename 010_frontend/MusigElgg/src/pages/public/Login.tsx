import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, Key, AlertCircle, Music, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../helpers/authStore';

export function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, loginWithPasskey, isLoading } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

    const handleEmailLogin = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Bitte füllen Sie alle Felder aus.');
            return;
        }

        const success = await login(email, password);
        if (success) {
            navigate(from, { replace: true });
        } else {
            setError('Ungültige Anmeldedaten. Bitte versuchen Sie es erneut.');
        }
    };

    const handlePasskeyLogin = async () => {
        setError('');
        const success = await loginWithPasskey();
        if (success) {
            navigate(from, { replace: true });
        } else {
            setError('Passkey-Authentifizierung fehlgeschlagen.');
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-800 via-primary-900 to-primary-950 p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5"></div>

                <div className="relative">
                    <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                        Zurück zur Webseite
                    </Link>
                </div>

                <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mb-8">
                        <Music className="text-white" size={40} />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4">Musig Elgg</h1>
                    <p className="text-xl text-neutral-200 mb-8">Mitgliederbereich</p>
                    <p className="text-neutral-300 leading-relaxed max-w-md">
                        Willkommen im geschützten Bereich für Vereinsmitglieder.
                        Hier finden Sie Ihren Probenplan, Noten und alle wichtigen Vereinsinformationen.
                    </p>
                </div>

                <div className="relative">
                    <p className="text-neutral-400 text-sm">
                        © {new Date().getFullYear()} Musig Elgg. Alle Rechte vorbehalten.
                    </p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-neutral-50">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="w-16 h-16 mx-auto rounded-xl gradient-primary flex items-center justify-center mb-4">
                            <Music className="text-white" size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-primary-800">Musig Elgg</h1>
                        <p className="text-neutral-500">Mitgliederbereich</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-card p-8">
                        <h2 className="text-2xl font-bold text-primary-800 mb-2">Anmelden</h2>
                        <p className="text-neutral-500 mb-8">Melden Sie sich mit Ihren Zugangsdaten an.</p>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                                <AlertCircle size={20} />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleEmailLogin} className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                                    E-Mail
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="mitglied@musig-elgg.ch"
                                        className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                                    Passwort
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" className="w-4 h-4 rounded border-neutral-300 text-primary-800 focus:ring-primary-500" />
                                    <span className="text-sm text-neutral-600">Angemeldet bleiben</span>
                                </label>
                                <a href="#" className="text-sm text-primary-700 hover:text-primary-800 font-medium">
                                    Passwort vergessen?
                                </a>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-primary-800 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Anmelden...' : 'Anmelden'}
                            </button>
                        </form>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-neutral-200"></div>
                            </div>
                            <div className="relative flex justify-center">
                                <span className="px-4 bg-white text-sm text-neutral-500">oder</span>
                            </div>
                        </div>

                        <button
                            onClick={handlePasskeyLogin}
                            disabled={isLoading}
                            className="w-full py-3 border-2 border-secondary-500 text-secondary-600 rounded-lg font-medium hover:bg-secondary-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Key size={20} />
                            Mit Passkey anmelden
                        </button>

                        {/* Demo Credentials */}
                        <div className="mt-8 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                            <p className="text-xs text-neutral-500 font-medium mb-2">Demo-Zugangsdaten:</p>
                            <p className="text-xs text-neutral-600">Admin: admin@musig-elgg.ch / admin</p>
                            <p className="text-xs text-neutral-600">Mitglied: mitglied@musig-elgg.ch / member</p>
                        </div>
                    </div>

                    <p className="text-center text-sm text-neutral-500 mt-6">
                        <Link to="/" className="text-primary-700 hover:text-primary-800 font-medium">
                            ← Zurück zur Webseite
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
