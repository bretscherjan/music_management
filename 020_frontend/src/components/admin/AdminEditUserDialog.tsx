import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { User, AdminUpdateUserDto, UserStatus, UserRole, Register } from '@/types';

interface AdminEditUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: User | null;
    registers: Register[] | undefined;
}

export function AdminEditUserDialog({ open, onOpenChange, user, registers }: AdminEditUserDialogProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<AdminUpdateUserDto>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                status: user.status,
                role: user.role,
                registerId: user.registerId,
            });
        }
    }, [user]);

    const updateMutation = useMutation({
        mutationFn: (data: AdminUpdateUserDto) => {
            if (!user) throw new Error('No user selected');
            return userService.updateUser(user.id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            handleClose();
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Fehler beim Speichern');
            setIsLoading(false);
        },
    });

    const handleClose = () => {
        setError(null);
        setIsLoading(false);
        onOpenChange(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        updateMutation.mutate(formData);
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Mitglied bearbeiten: {user.firstName} {user.lastName}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">Vorname</Label>
                            <Input
                                id="firstName"
                                value={formData.firstName || ''}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Nachname</Label>
                            <Input
                                id="lastName"
                                value={formData.lastName || ''}
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
                            value={formData.email || ''}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <select
                                id="status"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="active">Aktiv</option>
                                <option value="passive">Passiv</option>
                                <option value="former">Ehemalig</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Rolle</Label>
                            <select
                                id="role"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="member">Mitglied</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="register">Register</Label>
                        <select
                            id="register"
                            value={formData.registerId || ''}
                            onChange={(e) => setFormData({ ...formData, registerId: e.target.value ? Number(e.target.value) : null })}
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
                            Speichern
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
