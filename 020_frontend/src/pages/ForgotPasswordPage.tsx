import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetMutation = useMutation({
        mutationFn: authService.forgotPassword,
        onSuccess: () => {
            setIsSubmitted(true);
            setError(null);
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Fehler beim Senden der Anfrage');
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        resetMutation.mutate(email);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <Navbar />

            <main className="flex-1 flex items-center justify-center p-4 py-12">
                <Card className="max-w-md w-full shadow-lg border-primary/10">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-bold">Passwort vergessen?</CardTitle>
                        <CardDescription>
                            Kein Problem. Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen deines Passworts.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isSubmitted ? (
                            <div className="text-center space-y-4 py-4 animate-in fade-in zoom-in duration-300">
                                <div className="mx-auto w-12 h-12 bg-success/10 text-success rounded-full flex items-center justify-center mb-2">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-medium text-brand-primary">E-Mail versendet!</h3>
                                <p className="text-sm text-muted-foreground">
                                    Falls ein Konto für <strong>{email}</strong> existiert, haben wir dir Anweisungen zum Zurücksetzen gesendet.
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Bitte prüfe auch deinen Spam-Ordner.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">E-Mail-Adresse</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            className="pl-9"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
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
                                    disabled={resetMutation.isPending || !email}
                                >
                                    {resetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Link senden
                                </Button>
                            </form>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-center border-t pt-6">
                        <Link
                            to="/login"
                            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Zurück zum Login
                        </Link>
                    </CardFooter>
                </Card>
            </main>

            <Footer />
        </div>
    );
}
