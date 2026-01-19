import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { registerService } from '@/services/registerService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

import api from '@/lib/api'; // Using api directly as userService.create might not exist yet

interface CreateUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        registerId: '' as string | number,
        role: 'member'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { data: registers } = useQuery({
        queryKey: ['registers'],
        queryFn: () => registerService.getAll(),
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            // We use the auth/register endpoint but as admin we might want a specific admin createUser endpoint
            // to set roles directly. For now, let's assume /auth/register is public, 
            // but we want to set registerId etc. 
            // Ideally we have a userService.create(data) which calls POST /users (admin only)
            // Let's implement that in userService later or now.
            // Using api.post('/users') assuming we will add it to user.routes.js
            // Wait, standard auth register is usually for self-signup. 
            // Admin creation should use a protected route.
            return api.post('/users', {
                ...data,
                registerId: data.registerId ? parseInt(data.registerId.toString()) : undefined
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            handleClose();
        },
        onError: (err: any) => {
            console.error('Create User Error:', err);
            const message = err.response?.data?.message || 'Fehler beim Erstellen';
            const details = err.response?.data?.errors
                ? ': ' + err.response.data.errors.map((e: any) => e.message).join(', ')
                : '';
            setError(message + details);
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
            registerId: '',
            role: 'member'
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
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Neues Mitglied erstellen</DialogTitle>
                    <DialogDescription>
                        Erstellen Sie ein neues Benutzerkonto für ein Vereinsmitglied.
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

                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber">Telefonnummer</Label>
                            <Input
                                id="phoneNumber"
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                placeholder="+41 79 123 45 67"
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

                    <div className="space-y-2">
                        <Label htmlFor="password">Initial-Passwort</Label>
                        <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            minLength={8}
                            placeholder="Mindestens 8 Zeichen"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="role">Rolle</Label>
                            <select
                                id="role"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
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
                                value={formData.registerId}
                                onChange={(e) => setFormData({ ...formData, registerId: e.target.value })}
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
