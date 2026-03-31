import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { registerService } from '@/services/registerService';
import { userService } from '@/services/userService';
import { useCan } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { UserType, AdminCreateUserDto } from '@/types';

interface CreateUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
    const can = useCan();
    const canReadRegisters = can('registers:read');
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<AdminCreateUserDto>({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        registerId: null,
        role: 'member',
        type: 'REGULAR',
        expiresAt: null
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { data: registers } = useQuery({
        queryKey: ['registers'],
        queryFn: () => registerService.getAll(),
        enabled: open && canReadRegisters,
    });

    const createMutation = useMutation({
        mutationFn: async (data: AdminCreateUserDto) => {
            const payload = {
                ...data,
                registerId: data.registerId ? parseInt(data.registerId.toString()) : null,
                expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null
            };
            return userService.create(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            handleClose();
        },
        onError: (err: any) => {
            console.error('Create User Error:', err);
            const message = err.response?.data?.message || 'Fehler beim Erstellen';
            setError(message);
            setIsLoading(false);
        },
    });

    const handleClose = () => {
        setError(null);
        setIsLoading(false);
        setFormData({
            email: '',
            password: '',
            firstName: '',
            lastName: '',
            phoneNumber: '',
            registerId: null,
            role: 'member',
            type: 'REGULAR',
            expiresAt: null
        });
        onOpenChange(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        createMutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Neues Mitglied erstellen</DialogTitle>
                    <DialogDescription>
                        Erstellen Sie ein neues Benutzerkonto für ein Vereinsmitglied oder einen Gast.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">Vorname</Label>
                            <Input
                                id="firstName"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Nachname</Label>
                            <Input
                                id="lastName"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">E-Mail</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Initial-Passwort</Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password || ''}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                minLength={8}
                                placeholder="Mindestens 8 Zeichen"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber">Telefonnummer</Label>
                            <Input
                                id="phoneNumber"
                                type="tel"
                                value={formData.phoneNumber || ''}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                placeholder="+41 79 123 45 67"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="role">Rolle</Label>
                            <select
                                id="role"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="member">Mitglied</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="register">Register</Label>
                            <select
                                id="register"
                                value={formData.registerId || ''}
                                onChange={(e) => setFormData({ ...formData, registerId: e.target.value ? Number(e.target.value) : null })}
                                disabled={!canReadRegisters}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">Kein Register</option>
                                {registers?.map((reg) => (
                                    <option key={reg.id} value={reg.id}>
                                        {reg.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Benutzertyp</Label>
                            <select
                                id="type"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as UserType })}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="REGULAR">Regulär</option>
                                <option value="GUEST">Gast</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="expiresAt">Ablaufdatum (optional)</Label>
                            <Input
                                id="expiresAt"
                                type="date"
                                value={formData.expiresAt || ''}
                                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Abbrechen
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Erstellen
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
