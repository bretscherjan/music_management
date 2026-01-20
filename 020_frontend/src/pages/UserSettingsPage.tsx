import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Key, User as UserIcon, AlertCircle, CheckCircle, Bell } from 'lucide-react';
import type { NotificationSettings } from '@/types';
import { pushNotificationService } from '@/services/pushNotificationService';

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

                {/* Notification Settings */}
                <NotificationSettingsCard />

            </div>
        </div>
    );
}

function NotificationSettingsCard() {
    const queryClient = useQueryClient();
    const [success, setSuccess] = useState(false);
    const [isPushSubscribed, setIsPushSubscribed] = useState(false);

    // Fetch Settings
    const { data: settings, isLoading } = useQuery({
        queryKey: ['notificationSettings'],
        queryFn: userService.getNotificationSettings,
    });

    // Check push subscription status on mount and when settings change
    useEffect(() => {
        const checkPushStatus = async () => {
            const hasSubscription = await pushNotificationService.hasActiveSubscription();
            console.log('Push subscription status:', hasSubscription);
            setIsPushSubscribed(hasSubscription);

            // Log details if subscribed
            if (hasSubscription) {
                try {
                    const reg = await navigator.serviceWorker.getRegistration();
                    const sub = await reg?.pushManager?.getSubscription();
                    console.log('Current Browser Subscription:', sub);

                    // Sync with backend to ensure it exists there too
                    await pushNotificationService.syncSubscription();
                } catch (e) {
                    console.error('Error getting detailed sub info:', e);
                }
            }
        };
        checkPushStatus();
    }, [settings]);

    const handleTestPush = async () => {
        try {
            console.log('Sending test push notification...');
            await pushNotificationService.sendTestNotification();
            console.log('Test push request sent.');
        } catch (error) {
            console.error('Test push failed:', error);
        }
    };

    // Update Settings Mutation
    const mutation = useMutation({
        mutationFn: userService.updateNotificationSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notificationSettings'] });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        },
    });

    const handleToggle = (key: keyof NotificationSettings) => {
        if (!settings) return;
        mutation.mutate({
            ...settings,
            [key]: !settings[key]
        });
    };

    const handleReminderTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (!settings) return;
        mutation.mutate({
            ...settings,
            reminderTimeBeforeHours: parseInt(e.target.value)
        });
    };

    if (isLoading || !settings) {
        return (
            <Card>
                <CardContent className="py-6 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Benachrichtigungen
                </CardTitle>
                <CardDescription>
                    Wählen Sie für jede Benachrichtigung, ob Sie per E-Mail und/oder Push benachrichtigt werden möchten.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {isPushSubscribed && (
                    <div className="flex justify-end mb-4">
                        <Button variant="outline" size="sm" onClick={handleTestPush}>
                            <Bell className="mr-2 h-4 w-4" />
                            Test Push senden
                        </Button>
                    </div>
                )}

                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Events</h3>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Neue Termine</Label>
                        <p className="text-xs text-muted-foreground">Wenn ein neuer Termin erstellt wird</p>
                        <div className="flex items-center gap-6 mt-2">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="email-new-events"
                                    checked={settings.notifyOnEventCreate}
                                    onCheckedChange={() => handleToggle('notifyOnEventCreate')}
                                    disabled={mutation.isPending}
                                />
                                <Label htmlFor="email-new-events" className="text-sm cursor-pointer">E-Mail</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="push-new-events"
                                    checked={settings.pushNewEvents}
                                    onCheckedChange={() => handleToggle('pushNewEvents')}
                                    disabled={mutation.isPending || !isPushSubscribed}
                                />
                                <Label htmlFor="push-new-events" className="text-sm cursor-pointer">Push</Label>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Terminänderungen</Label>
                        <p className="text-xs text-muted-foreground">Wenn ein Termin bearbeitet wird</p>
                        <div className="flex items-center gap-6 mt-2">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="email-event-updates"
                                    checked={settings.notifyOnEventUpdate}
                                    onCheckedChange={() => handleToggle('notifyOnEventUpdate')}
                                    disabled={mutation.isPending}
                                />
                                <Label htmlFor="email-event-updates" className="text-sm cursor-pointer">E-Mail</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="push-event-updates"
                                    checked={settings.pushEventUpdates}
                                    onCheckedChange={() => handleToggle('pushEventUpdates')}
                                    disabled={mutation.isPending || !isPushSubscribed}
                                />
                                <Label htmlFor="push-event-updates" className="text-sm cursor-pointer">Push</Label>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Terminabsagen</Label>
                        <p className="text-xs text-muted-foreground">Wenn ein Termin gelöscht wird</p>
                        <div className="flex items-center gap-6 mt-2">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="email-event-cancel"
                                    checked={settings.notifyOnEventDelete}
                                    onCheckedChange={() => handleToggle('notifyOnEventDelete')}
                                    disabled={mutation.isPending}
                                />
                                <Label htmlFor="email-event-cancel" className="text-sm cursor-pointer">E-Mail</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="push-event-cancel"
                                    checked={settings.pushEventCancellations}
                                    onCheckedChange={() => handleToggle('pushEventCancellations')}
                                    disabled={mutation.isPending || !isPushSubscribed}
                                />
                                <Label htmlFor="push-event-cancel" className="text-sm cursor-pointer">Push</Label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Dateien</h3>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Neue Dateien</Label>
                        <p className="text-xs text-muted-foreground">Wenn eine neue Datei hochgeladen wird</p>
                        <div className="flex items-center gap-6 mt-2">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="email-new-files"
                                    checked={settings.notifyOnFileUpload}
                                    onCheckedChange={() => handleToggle('notifyOnFileUpload')}
                                    disabled={mutation.isPending}
                                />
                                <Label htmlFor="email-new-files" className="text-sm cursor-pointer">E-Mail</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="push-new-files"
                                    checked={settings.pushNewFiles}
                                    onCheckedChange={() => handleToggle('pushNewFiles')}
                                    disabled={mutation.isPending || !isPushSubscribed}
                                />
                                <Label htmlFor="push-new-files" className="text-sm cursor-pointer">Push</Label>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Datei gelöscht</Label>
                        <p className="text-xs text-muted-foreground">Wenn eine Datei gelöscht wird</p>
                        <div className="flex items-center gap-6 mt-2">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="email-file-deleted"
                                    checked={settings.notifyOnFileDelete}
                                    onCheckedChange={() => handleToggle('notifyOnFileDelete')}
                                    disabled={mutation.isPending}
                                />
                                <Label htmlFor="email-file-deleted" className="text-sm cursor-pointer">E-Mail</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="push-file-deleted"
                                    checked={settings.pushFileDeleted}
                                    onCheckedChange={() => handleToggle('pushFileDeleted')}
                                    disabled={mutation.isPending || !isPushSubscribed}
                                />
                                <Label htmlFor="push-file-deleted" className="text-sm cursor-pointer">Push</Label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Erinnerungen</h3>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Terminerinnerungen</Label>
                        <p className="text-xs text-muted-foreground">Automatische Erinnerung vor dem Termin</p>
                        <div className="flex items-center gap-6 mt-2">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="email-reminders"
                                    checked={settings.notifyEventReminder}
                                    onCheckedChange={() => handleToggle('notifyEventReminder')}
                                    disabled={mutation.isPending}
                                />
                                <Label htmlFor="email-reminders" className="text-sm cursor-pointer">E-Mail</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="push-reminders"
                                    checked={settings.pushReminders}
                                    onCheckedChange={() => handleToggle('pushReminders')}
                                    disabled={mutation.isPending || !isPushSubscribed}
                                />
                                <Label htmlFor="push-reminders" className="text-sm cursor-pointer">Push</Label>
                            </div>
                        </div>
                    </div>

                    {settings.notifyEventReminder && (
                        <div className="grid gap-2">
                            <Label htmlFor="reminderTimeBeforeHours">Zeitpunkt der Erinnerung</Label>
                            <select
                                id="reminderTimeBeforeHours"
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={settings.reminderTimeBeforeHours}
                                onChange={handleReminderTimeChange}
                                disabled={mutation.isPending}
                            >
                                <option value="1">1 Stunde vorher</option>
                                <option value="2">2 Stunden vorher</option>
                                <option value="12">12 Stunden vorher</option>
                                <option value="24">24 Stunden vorher</option>
                                <option value="48">48 Stunden vorher</option>
                                <option value="168">1 Woche vorher</option>
                            </select>
                        </div>
                    )}
                </div>

                {success && (
                    <div className="p-3 rounded-md bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-sm flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        <span>Einstellungen gespeichert</span>
                    </div>
                )}
            </CardContent>
        </Card>

    );
}

export default UserSettingsPage;
