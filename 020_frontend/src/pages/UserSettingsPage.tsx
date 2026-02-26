import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Key, User as UserIcon, Bell, Eye, EyeOff } from 'lucide-react';
import type { NotificationSettings } from '@/types';
import { pushNotificationService } from '@/services/pushNotificationService';
import { toast } from 'sonner';


export function UserSettingsPage() {
    const queryClient = useQueryClient();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showPasswords, setShowPasswords] = useState(false);

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
            toast.success('Profil erfolgreich aktualisiert');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Fehler beim Aktualisieren des Profils');
        }
    });

    // Change Password Mutation
    const changePasswordMutation = useMutation({
        mutationFn: userService.changePassword,
        onSuccess: () => {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            toast.success('Passwort erfolgreich geändert');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Fehler beim Ändern des Passworts');
        }
    });

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfileMutation.mutate({ firstName, lastName, phoneNumber });
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('Die neuen Passwörter stimmen nicht überein');
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
                            <div className="space-y-2 relative">
                                <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
                                <div className="relative">
                                    <Input
                                        id="currentPassword"
                                        type={showPasswords ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(!showPasswords)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground h-4 w-4"
                                    >
                                        {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 relative">
                                <Label htmlFor="newPassword">Neues Passwort</Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showPasswords ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={8}
                                        placeholder="Min. 8 Zeichen, A-Z, a-z, 0-9"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(!showPasswords)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground h-4 w-4"
                                    >
                                        {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 relative">
                                <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showPasswords ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(!showPasswords)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground h-4 w-4"
                                    >
                                        {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

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
            setIsPushSubscribed(hasSubscription);

            // Log details if subscribed
            if (hasSubscription) {
                try {

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
            await pushNotificationService.sendTestNotification();
        } catch (error) {
            console.error('Test push failed:', error);
        }
    };

    // Update Settings Mutation
    const mutation = useMutation({
        mutationFn: userService.updateNotificationSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notificationSettings'] });
            toast.success('Einstellungen gespeichert');
        },
    });

    const handleToggle = (key: keyof NotificationSettings) => {
        if (!settings) return;
        mutation.mutate({
            ...settings,
            [key]: !settings[key]
        });
    };

    const handlePushToggle = async (key: keyof NotificationSettings) => {
        if (!settings) return;
        const willEnable = !settings[key];

        // If trying to enable push and not subscribed, try to subscribe first
        if (willEnable && !isPushSubscribed) {
            try {
                // This triggers browser permission prompt if needed
                await pushNotificationService.subscribeToPushNotifications();
                setIsPushSubscribed(true);
            } catch (error) {
                console.error("Failed to subscribe to push", error);
                // Can't enable setting if subscription failed
                return;
            }
        }

        handleToggle(key);
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
                                    onCheckedChange={() => handlePushToggle('pushNewEvents')}
                                    disabled={mutation.isPending}
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
                                    onCheckedChange={() => handlePushToggle('pushEventUpdates')}
                                    disabled={mutation.isPending}
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
                                    onCheckedChange={() => handlePushToggle('pushEventCancellations')}
                                    disabled={mutation.isPending}
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
                                    onCheckedChange={() => handlePushToggle('pushNewFiles')}
                                    disabled={mutation.isPending}
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
                                    onCheckedChange={() => handlePushToggle('pushFileDeleted')}
                                    disabled={mutation.isPending}
                                />
                                <Label htmlFor="push-file-deleted" className="text-sm cursor-pointer">Push</Label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pt-6 border-t">
                    <h3 className="text-lg font-medium">Termin-Erinnerungen</h3>
                    <p className="text-sm text-muted-foreground">
                        Konfigurieren Sie hier, wann und wie Sie an Termine erinnert werden möchten.
                    </p>

                    <ReminderConfig
                        settings={settings}
                        onUpdate={mutation.mutate}
                        isPushSubscribed={isPushSubscribed}
                        onSubscribeRequest={async () => {
                            try {
                                await pushNotificationService.subscribeToPushNotifications();
                                setIsPushSubscribed(true);
                            } catch (error) {
                                console.error("Failed to subscribe", error);
                            }
                        }}
                    />
                </div>

            </CardContent>
        </Card >
    );
}

function ReminderConfig({ settings, onUpdate, isPushSubscribed, onSubscribeRequest }: {
    settings: NotificationSettings,
    onUpdate: (s: NotificationSettings) => void,
    isPushSubscribed: boolean,
    onSubscribeRequest: () => Promise<void>
}) {
    const [activeTab, setActiveTab] = useState<'rehearsal' | 'performance' | 'other'>('rehearsal');

    // Helper to get current category settings or defaults
    const getCatSettings = (cat: 'rehearsal' | 'performance' | 'other') => {
        return settings.reminderSettings?.[cat] || {
            enabled: false,
            emailEnabled: false,
            pushEnabled: false,
            minutesBefore: [],
            onlyIfAttending: false
        };
    };

    const updateCatSettings = (updates: Partial<any>) => {
        const current = getCatSettings(activeTab);
        const updatedCrypto = { ...current, ...updates };

        const newReminderSettings = {
            ...(settings.reminderSettings || {}),
            [activeTab]: updatedCrypto
        };

        onUpdate({
            ...settings,
            reminderSettings: newReminderSettings
        });
    };

    const currentSettings = getCatSettings(activeTab);

    // Time handling
    const [customTime, setCustomTime] = useState('');
    const [customUnit, setCustomUnit] = useState('minutes'); // minutes, hours, days

    const addTime = () => {
        const val = parseInt(customTime);
        if (isNaN(val) || val <= 0) return;

        let minutes = val;
        if (customUnit === 'hours') minutes = val * 60;
        if (customUnit === 'days') minutes = val * 1440;

        if (currentSettings.minutesBefore.includes(minutes)) return;

        updateCatSettings({
            minutesBefore: [...currentSettings.minutesBefore, minutes].sort((a, b) => a - b)
        });
        setCustomTime('');
    };

    const removeTime = (min: number) => {
        updateCatSettings({
            minutesBefore: currentSettings.minutesBefore.filter(m => m !== min)
        });
    };

    const formatMinutes = (min: number) => {
        if (min >= 1440 && min % 1440 === 0) return `${min / 1440} Tag${min / 1440 > 1 ? 'e' : ''}`;
        if (min >= 60 && min % 60 === 0) return `${min / 60} Std.`;
        return `${min} Min.`;
    };

    return (
        <div className="space-y-4">
            {/* Custom Tabs */}
            <div className="flex space-x-2 border-b">
                {[
                    { id: 'rehearsal', label: 'Proben' },
                    { id: 'performance', label: 'Auftritte' },
                    { id: 'other', label: 'Sonstiges' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        type="button"
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-2">

                {/* Enable Switch */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                    <div className="space-y-0.5">
                        <Label className="text-base">Erinnerungen aktivieren</Label>
                        <p className="text-xs text-muted-foreground">
                            Für {activeTab === 'rehearsal' ? 'Proben' : activeTab === 'performance' ? 'Auftritte' : 'sonstige Termine'}
                        </p>
                    </div>
                    <Switch
                        checked={currentSettings.enabled}
                        onCheckedChange={(c) => updateCatSettings({ enabled: c })}
                    />
                </div>

                {currentSettings.enabled && (
                    <>
                        {/* Channels */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="p-4 border rounded-lg space-y-3">
                                <Label>Benachrichtigungsweg</Label>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="cat-email" className="font-normal cursor-pointer">Per E-Mail</Label>
                                        <Switch
                                            id="cat-email"
                                            checked={currentSettings.emailEnabled}
                                            onCheckedChange={(c) => updateCatSettings({ emailEnabled: c })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="cat-push" className="font-normal cursor-pointer">Per Push</Label>
                                        <Switch
                                            id="cat-push"
                                            checked={currentSettings.pushEnabled}
                                            onCheckedChange={async (c) => {
                                                if (c && !isPushSubscribed) {
                                                    await onSubscribeRequest();
                                                }
                                                updateCatSettings({ pushEnabled: c })
                                            }}
                                        />
                                    </div>
                                    {!isPushSubscribed && (
                                        <p className="text-[10px] text-destructive">Push im Browser nicht aktiviert</p>
                                    )}
                                </div>
                            </div>

                            {/* Attendance Filter */}
                            <div className="p-4 border rounded-lg space-y-3">
                                <Label>Bedingung</Label>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            id="filter-all"
                                            name="att-filter"
                                            checked={!currentSettings.onlyIfAttending}
                                            onChange={() => updateCatSettings({ onlyIfAttending: false })}
                                            className="h-4 w-4"
                                        />
                                        <Label htmlFor="filter-all" className="font-normal cursor-pointer">
                                            Immer (wenn eingeladen)
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            id="filter-yes"
                                            name="att-filter"
                                            checked={currentSettings.onlyIfAttending}
                                            onChange={() => updateCatSettings({ onlyIfAttending: true })}
                                            className="h-4 w-4"
                                        />
                                        <Label htmlFor="filter-yes" className="font-normal cursor-pointer">
                                            Nur wenn ich zugesagt habe
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Times */}
                        <div className="space-y-3">
                            <Label>Erinnerungszeitpunkte</Label>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2">
                                {currentSettings.minutesBefore.map((min: number) => (
                                    <div key={min} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm">
                                        <span>{formatMinutes(min)} vorher</span>
                                        <button
                                            onClick={() => removeTime(min)}
                                            className="ml-1 text-muted-foreground hover:text-foreground"
                                            type="button"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                {currentSettings.minutesBefore.length === 0 && (
                                    <span className="text-sm text-muted-foreground italic">Keine Zeiten festgelegt</span>
                                )}
                            </div>

                            {/* Add Time */}
                            <div className="flex items-end gap-2 max-w-sm pt-2">
                                <div className="grid gap-1 flex-1">
                                    <Label className="text-xs">Wert</Label>
                                    <Input
                                        type="number"
                                        placeholder="z.B. 1"
                                        value={customTime}
                                        onChange={(e) => setCustomTime(e.target.value)}
                                        min="1"
                                    />
                                </div>
                                <div className="grid gap-1 w-24">
                                    <Label className="text-xs">Einheit</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={customUnit}
                                        onChange={(e) => setCustomUnit(e.target.value)}
                                    >
                                        <option value="minutes">Min.</option>
                                        <option value="hours">Std.</option>
                                        <option value="days">Tage</option>
                                    </select>
                                </div>
                                <Button type="button" variant="secondary" onClick={addTime} disabled={!customTime}>
                                    Hinzufügen
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                                <Button variant="outline" size="sm" onClick={() => {
                                    if (!currentSettings.minutesBefore.includes(60))
                                        updateCatSettings({ minutesBefore: [...currentSettings.minutesBefore, 60].sort((a, b) => a - b) })
                                }} type="button">+ 1 Std.</Button>
                                <Button variant="outline" size="sm" onClick={() => {
                                    if (!currentSettings.minutesBefore.includes(1440))
                                        updateCatSettings({ minutesBefore: [...currentSettings.minutesBefore, 1440].sort((a, b) => a - b) })
                                }} type="button">+ 1 Tag</Button>
                                <Button variant="outline" size="sm" onClick={() => {
                                    if (!currentSettings.minutesBefore.includes(2880))
                                        updateCatSettings({ minutesBefore: [...currentSettings.minutesBefore, 2880].sort((a, b) => a - b) })
                                }} type="button">+ 2 Tage</Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default UserSettingsPage;
