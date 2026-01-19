import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Key, User as UserIcon, AlertCircle, CheckCircle } from 'lucide-react';

export function UserSettingsPage() {
    const queryClient = useQueryClient();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [profileSuccess, setProfileSuccess] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    // Fetch Profile
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

    // Update Profile Mutation
    const updateProfileMutation = useMutation({
        mutationFn: userService.updateProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            setProfileSuccess(true);
            setProfileError(null);
            setTimeout(() => setProfileSuccess(false), 3000);
        },
        onError: (err: any) => {
            setProfileError(err.response?.data?.message || 'Fehler beim Aktualisieren des Profils');
            setProfileSuccess(false);
        }
    });

    // Change Password Mutation
    const changePasswordMutation = useMutation({
        mutationFn: userService.changePassword,
        onSuccess: () => {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordSuccess(true);
            setPasswordError(null);
            setTimeout(() => setPasswordSuccess(false), 3000);
        },
        onError: (err: any) => {
            setPasswordError(err.response?.data?.message || 'Fehler beim Ändern des Passworts');
            setPasswordSuccess(false);
        }
    });

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfileMutation.mutate({ firstName, lastName, phoneNumber });
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setPasswordError('Die neuen Passwörter stimmen nicht überein');
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError('Das neue Passwort muss mindestens 8 Zeichen lang sein');
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
        if (!passwordRegex.test(newPassword)) {
            setPasswordError('Das Passwort muss mindestens einen Grossbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten');
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
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Benutzereinstellungen</h1>
                <p className="text-muted-foreground">
                    Verwalten Sie Ihr Profil und Sicherheitseinstellungen
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Profile Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserIcon className="h-5 w-5" />
                            Profil
                        </CardTitle>
                        <CardDescription>
                            Persönliche Informationen bearbeiten
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleProfileSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">E-Mail</Label>
                                <Input id="email" value={user?.email || ''} disabled className="bg-muted" />
                                <p className="text-xs text-muted-foreground">
                                    Die E-Mail-Adresse kann nicht geändert werden.
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Vorname</Label>
                                    <Input
                                        id="firstName"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Nachname</Label>
                                    <Input
                                        id="lastName"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
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
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="+41 79 123 45 67"
                                />
                            </div>

                            {profileError && (
                                <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{profileError}</span>
                                </div>
                            )}

                            {profileSuccess && (
                                <div className="p-3 rounded-md bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-sm flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Profil erfolgreich aktualisiert</span>
                                </div>
                            )}

                            <Button type="submit" disabled={updateProfileMutation.isPending}>
                                {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" />
                                Speichern
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Password Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5" />
                            Passwort ändern
                        </CardTitle>
                        <CardDescription>
                            Setzen Sie ein neues Passwort
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
                                <Input
                                    id="currentPassword"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Neues Passwort</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    placeholder="Min. 8 Zeichen, A-Z, a-z, 0-9"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>

                            {passwordError && (
                                <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{passwordError}</span>
                                </div>
                            )}

                            {passwordSuccess && (
                                <div className="p-3 rounded-md bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-sm flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Passwort erfolgreich geändert</span>
                                </div>
                            )}

                            <Button type="submit" disabled={changePasswordMutation.isPending}>
                                {changePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" />
                                Passwort ändern
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div >
    );
}

export default UserSettingsPage;
