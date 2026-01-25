import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, ArrowLeft, Lock, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export function ResetPasswordPage() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetMutation = useMutation({
        mutationFn: (pass: string) => authService.resetPassword(token!, pass),
        onSuccess: () => {
            setIsSuccess(true);
            setError(null);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Fehler beim Zurücksetzen des Passworts');
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError('Die Passwörter stimmen nicht überein.');
            return;
        }

        if (password.length < 8) {
            setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
            return;
        }

        if (!token) {
            setError('Ungültiger Link.');
            return;
        }

        resetMutation.mutate(password);
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-background flex flex-col font-sans">
                <Navbar />
                <main className="flex-1 flex items-center justify-center p-4">
                    <Card className="max-w-md w-full border-destructive/50">
                        <CardHeader className="text-center">
                            <CardTitle className="text-destructive">Ungültiger Link</CardTitle>
                            <CardDescription>
                                Der Link zum Zurücksetzen ist ungültig oder fehlt.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="flex justify-center">
                            <Link to="/forgot-password">
                                <Button variant="outline">Neuen Link anfordern</Button>
                            </Link>
                        </CardFooter>
                    </Card>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <Navbar />

            <main className="flex-1 flex items-center justify-center p-4 py-12">
                <Card className="max-w-md w-full shadow-lg border-primary/10">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-bold">Neues Passwort erstellen</CardTitle>
                        <CardDescription>
                            Bitte wähle ein neues, sicheres Passwort für dein Konto.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isSuccess ? (
                            <div className="text-center space-y-4 py-4 animate-in fade-in zoom-in duration-300">
                                <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-medium text-green-800">Passwort geändert!</h3>
                                <p className="text-sm text-muted-foreground">
                                    Dein Passwort wurde erfolgreich aktualisiert. Du wirst gleich zum Login weitergeleitet...
                                </p>
                                <Button className="mt-4" onClick={() => navigate('/login')}>
                                    Zum Login
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Neues Passwort</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Mindestens 8 Zeichen"
                                            className="pl-9 pr-10"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={8}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="confirmPassword"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Passwort wiederholen"
                                            className="pl-9"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive flex items-center gap-2">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={resetMutation.isPending || !password || !confirmPassword}
                                >
                                    {resetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Passwort speichern
                                </Button>
                            </form>
                        )}
                    </CardContent>
                    {!isSuccess && (
                        <CardFooter className="flex justify-center border-t pt-6">
                            <Link
                                to="/login"
                                className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Abbrechen
                            </Link>
                        </CardFooter>
                    )}
                </Card>
            </main>

            <Footer />
        </div>
    );
}
