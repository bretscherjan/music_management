import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Key, User as UserIcon, Eye, EyeOff, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/PageHeader';

export function UserSettingsPage() {
    const queryClient = useQueryClient();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);

    const { data: user, isLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: userService.getProfile,
    });

    useEffect(() => {
        if (user) {
            setFirstName(user.firstName);
            setLastName(user.lastName);
            setPhoneNumber(user.phoneNumber || '');
        }
    }, [user]);

    const updateProfileMutation = useMutation({
        mutationFn: userService.updateProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast.success('Profil erfolgreich aktualisiert');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Fehler beim Aktualisieren des Profils');
        },
    });

    const changePasswordMutation = useMutation({
        mutationFn: userService.changePassword,
        onSuccess: () => {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            toast.success('Passwort erfolgreich geaendert');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Fehler beim Aendern des Passworts');
        },
    });

    const handleProfileSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        updateProfileMutation.mutate({ firstName, lastName, phoneNumber });
    };

    const handlePasswordSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('Die neuen Passwoerter stimmen nicht ueberein');
            return;
        }

        if (newPassword.length < 8) {
            toast.error('Das neue Passwort muss mindestens 8 Zeichen lang sein');
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
        if (!passwordRegex.test(newPassword)) {
            toast.error('Das Passwort muss mindestens einen Grossbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten');
            return;
        }

        changePasswordMutation.mutate({ currentPassword, newPassword, confirmPassword });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <PageHeader
                title="Benutzereinstellungen"
                subtitle="Profil und Sicherheitseinstellungen verwalten"
                Icon={Settings}
            />

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserIcon className="h-5 w-5" />
                            Profil
                        </CardTitle>
                        <CardDescription>Persoenliche Informationen bearbeiten</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleProfileSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">E-Mail</Label>
                                <Input id="email" value={user?.email || ''} disabled className="bg-muted" />
                                <p className="text-xs text-muted-foreground">
                                    Die E-Mail-Adresse kann nicht geaendert werden.
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Vorname</Label>
                                    <Input
                                        id="firstName"
                                        value={firstName}
                                        onChange={(event) => setFirstName(event.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Nachname</Label>
                                    <Input
                                        id="lastName"
                                        value={lastName}
                                        onChange={(event) => setLastName(event.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber">Telefonnummer</Label>
                                <Input
                                    id="phoneNumber"
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(event) => setPhoneNumber(event.target.value)}
                                    placeholder="+41 79 123 45 67"
                                />
                            </div>

                            <Button type="submit" disabled={updateProfileMutation.isPending}>
                                {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" />
                                Speichern
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5" />
                            Passwort aendern
                        </CardTitle>
                        <CardDescription>Setzen Sie ein neues Passwort</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            {[
                                ['currentPassword', 'Aktuelles Passwort', currentPassword, setCurrentPassword],
                                ['newPassword', 'Neues Passwort', newPassword, setNewPassword],
                                ['confirmPassword', 'Passwort bestaetigen', confirmPassword, setConfirmPassword],
                            ].map(([id, label, value, setter]) => (
                                <div key={id as string} className="space-y-2 relative">
                                    <Label htmlFor={id as string}>{label as string}</Label>
                                    <div className="relative">
                                        <Input
                                            id={id as string}
                                            type={showPasswords ? 'text' : 'password'}
                                            value={value as string}
                                            onChange={(event) => (setter as React.Dispatch<React.SetStateAction<string>>)(event.target.value)}
                                            required
                                            minLength={id === 'newPassword' ? 8 : undefined}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords((current) => !current)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground h-4 w-4"
                                        >
                                            {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <Button type="submit" disabled={changePasswordMutation.isPending}>
                                {changePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" />
                                Passwort aendern
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default UserSettingsPage;
