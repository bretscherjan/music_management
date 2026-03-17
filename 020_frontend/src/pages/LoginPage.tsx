import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react'; // Eye & EyeOff hinzugefügt

const loginSchema = z.object({
    email: z.string().email('Bitte gültige E-Mail-Adresse eingeben'),
    password: z.string().min(1, 'Passwort ist erforderlich'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // State für die Sichtbarkeit

    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/member';

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            await login(data);
            navigate(from, { replace: true });
        } catch (err) {
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 429) {
                    const msg = err.response?.data?.message;
                    setError(msg || 'Zu viele Anfragen. Bitte versuche es spaeter erneut.');
                } else if (!err.response) {
                    setError('Netzwerkfehler. Bitte pruefe deine Verbindung oder CORS-Einstellungen.');
                } else {
                    setError('Login fehlgeschlagen. Bitte pruefe deine Zugangsdaten.');
                }
            } else {
                setError('Login fehlgeschlagen. Bitte pruefe deine Zugangsdaten.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Header */}
            <header className="border-b bg-card">
                <div className="container-app flex items-center justify-between h-16">
                    <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <img src="/musig.png" alt="Musig Elgg Logo" className="h-12 w-auto" />
                        <div className="flex flex-col">
                            <span className="text-xl font-bold text-brand-secondary">
                                Elgg
                            </span>
                        </div>
                    </Link>
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-primary transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Zurück zur Startseite
                    </Link>
                </div>
            </header>

            {/* Login Form */}
            <div className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-xl border-border/10 rounded-[2rem] overflow-hidden">
                    <CardHeader className="text-center space-y-4 bg-muted/30">
                        <div className="flex justify-center">
                            <img src="/logo_red.png" alt="Musig Elgg Logo" className="h-24 w-auto" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-brand-primary">
                            Mitgliederbereich
                        </CardTitle>
                        <CardDescription className="text-base">
                            Melde dich an, um auf den Konzertmeister zuzugreifen
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/30 text-primary/80 text-sm border border-destructive/90">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">E-Mail</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    autoComplete="email"
                                    {...register('email')}
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">{errors.email.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Passwort</Label>
                                    <Link
                                        to="/forgot-password"
                                        className="text-sm text-brand-primary hover:underline"
                                    >
                                        Passwort vergessen?
                                    </Link>
                                </div>
                                {/* Container für Input + Button */}
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        className="pr-10" // Platz für das Icon rechts lassen
                                        {...register('password')}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand-primary focus:outline-none"
                                        aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-destructive">{errors.password.message}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl"
                                size="lg"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
                                        Anmelden...
                                    </span>
                                ) : (
                                    'Anmelden'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Footer */}
            <footer className="border-t py-6 text-center text-sm text-muted-foreground bg-card">
                <div className="container-app">
                    © {new Date().getFullYear()} Musig Elgg – Alle Rechte vorbehalten
                </div>
            </footer>
        </div>
    );
}

export default LoginPage;