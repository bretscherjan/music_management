import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowLeft } from 'lucide-react';

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
            setError('Login fehlgeschlagen. Bitte überprüfe deine Zugangsdaten.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-[hsl(var(--background))]">
            {/* Simple header with logo */}
            <header className="border-b bg-white">
                <div className="container-app flex items-center justify-between h-16">
                    <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <img src="/logo.png" alt="Musig Elgg Logo" className="h-12 w-auto" />
                        <div className="flex flex-col">
                            <span className="text-xl font-bold text-[hsl(var(--musig-burgundy))]">
                                Musig Elgg
                            </span>
                            <span className="text-xs text-[hsl(var(--muted-foreground))]">
                                Musikverein seit 1896
                            </span>
                        </div>
                    </Link>
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--musig-burgundy))] transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Zurück zur Startseite
                    </Link>
                </div>
            </header>

            {/* Login Form */}
            <div className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-xl border-2 border-[hsl(var(--border))]">
                    <CardHeader className="text-center space-y-4 bg-gradient-to-br from-[hsl(var(--musig-burgundy))]/5 to-[hsl(var(--musig-gold))]/5">
                        <div className="flex justify-center">
                            <img src="/logo.png" alt="Musig Elgg Logo" className="h-24 w-auto" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-[hsl(var(--musig-burgundy))]">
                            Mitgliederbereich
                        </CardTitle>
                        <CardDescription className="text-base">
                            Melde dich an, um auf den Konzertmeister zuzugreifen
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/20">
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
                                <Label htmlFor="password">Passwort</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    {...register('password')}
                                />
                                {errors.password && (
                                    <p className="text-sm text-destructive">{errors.password.message}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-[hsl(var(--musig-burgundy))] hover:bg-[hsl(var(--musig-burgundy))]/90"
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
            <footer className="border-t py-4 text-center text-sm text-[hsl(var(--muted-foreground))] bg-white">
                <div className="container-app">
                    © {new Date().getFullYear()} Musig Elgg – Alle Rechte vorbehalten
                </div>
            </footer>
        </div>
    );
}

export default LoginPage;
