import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { fileService } from '@/services/fileService';
import { registerService } from '@/services/registerService';
import { userService } from '@/services/userService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Shield } from 'lucide-react';
import type { FileEntity } from '@/types';

interface ManageAccessDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    file: FileEntity | null;
}

export function ManageAccessDialog({ open, onOpenChange, file }: ManageAccessDialogProps) {
    const queryClient = useQueryClient();
    const [mode, setMode] = useState<'all' | 'admin' | 'custom'>('all');
    const [allowedRegisters, setAllowedRegisters] = useState<number[]>([]);
    const [allowedUsers, setAllowedUsers] = useState<number[]>([]);
    const [deniedUsers, setDeniedUsers] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Fetch master data
    const { data: registers = [] } = useQuery({ queryKey: ['registers'], queryFn: registerService.getAll });
    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: () => userService.getAll()
    });

    // Initialize state when file opens
    useEffect(() => {
        if (open && file) {
            // Check for admin-only mode
            const isAdminOnly = file.accessRules?.some(r =>
                r.targetType === 'ADMIN_ONLY' && r.accessType === 'ALLOW'
            );

            if (isAdminOnly) {
                setMode('admin');
            } else if (file.visibility === 'limit' || file.visibility === 'admin') {
                setMode('custom');
            } else {
                setMode('all');
            }

            const initialAllowedRegs: number[] = [];
            const initialAllowedUsers: number[] = [];
            const initialDeniedUsers: number[] = [];

            file.accessRules?.forEach(rule => {
                if (rule.targetType === 'REGISTER' && rule.accessType === 'ALLOW' && rule.registerId) {
                    initialAllowedRegs.push(rule.registerId);
                }
                if (rule.targetType === 'USER' && rule.accessType === 'ALLOW' && rule.userId) {
                    initialAllowedUsers.push(rule.userId);
                }
                if (rule.targetType === 'USER' && rule.accessType === 'DENY' && rule.userId) {
                    initialDeniedUsers.push(rule.userId);
                }
            });

            setAllowedRegisters(initialAllowedRegs);
            setAllowedUsers(initialAllowedUsers);
            setDeniedUsers(initialDeniedUsers);
        }
    }, [open, file]);

    // --- Smart Dropdown Filtering ---

    // Users who already have access via a selected register
    const usersWithRegisterAccess = useMemo(() => {
        if (allowedRegisters.length === 0) return new Set<number>();
        return new Set(
            users
                .filter((u: any) => u.registerId && allowedRegisters.includes(u.registerId))
                .map((u: any) => u.id)
        );
    }, [users, allowedRegisters]);

    // "Additional Users" dropdown: Exclude users who already have access (via register or already allowed)
    const usersForAllowDropdown = useMemo(() => {
        return users.filter((u: any) =>
            !allowedUsers.includes(u.id) && // Not already in allowed list
            !usersWithRegisterAccess.has(u.id) // Not already covered by a register
        );
    }, [users, allowedUsers, usersWithRegisterAccess]);

    // "Block Users" dropdown: Only users who have access via a register, not already blocked, and not explicitly allowed
    const usersForDenyDropdown = useMemo(() => {
        return users.filter((u: any) =>
            usersWithRegisterAccess.has(u.id) && // Has access via a register (can be revoked)
            !deniedUsers.includes(u.id) && // Not already in blocked list
            !allowedUsers.includes(u.id) // Not explicitly allowed (contradictory)
        );
    }, [users, usersWithRegisterAccess, deniedUsers, allowedUsers]);

    const mutation = useMutation({
        mutationFn: (data: any) => fileService.updateAccess(file!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
            queryClient.invalidateQueries({ queryKey: ['folderContents'] });
            handleClose();
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Fehler beim Aktualisieren der Berechtigungen');
        },
    });

    const handleClose = () => {
        setError(null);
        onOpenChange(false);
    };

    const handleSubmit = () => {
        if (!file) return;

        const accessRules: any[] = [];

        if (mode === 'admin') {
            // Admin-only marker
            accessRules.push({ accessType: 'ALLOW', targetType: 'ADMIN_ONLY' });
        } else if (mode === 'custom') {
            allowedRegisters.forEach(regId => {
                accessRules.push({ accessType: 'ALLOW', targetType: 'REGISTER', registerId: regId });
            });
            allowedUsers.forEach(userId => {
                accessRules.push({ accessType: 'ALLOW', targetType: 'USER', userId: userId });
            });
            deniedUsers.forEach(userId => {
                accessRules.push({ accessType: 'DENY', targetType: 'USER', userId: userId });
            });
        }

        mutation.mutate({
            visibility: mode === 'all' ? 'all' : 'limit',
            accessRules: JSON.stringify(accessRules),
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Berechtigungen verwalten: {file?.originalName}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Mode Selection */}
                    <RadioGroup value={mode} onValueChange={(v: 'all' | 'admin' | 'custom') => setMode(v)}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="all" id="r1" />
                            <Label htmlFor="r1">Öffentlich (Alle Mitglieder)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="admin" id="r-admin" />
                            <Label htmlFor="r-admin">Nur Admins</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="custom" id="r2" />
                            <Label htmlFor="r2">Benutzerdefiniert (Bestimmte Register/Benutzer)</Label>
                        </div>
                    </RadioGroup>

                    {/* Custom Configurator */}
                    {mode === 'custom' && (
                        <div className="space-y-6 border p-4 rounded-md">
                            <p className="text-xs text-muted-foreground">
                                Standardmäßig hat niemand Zugriff. Fügen Sie Register oder einzelne Benutzer hinzu, um ihnen Zugriff zu gewähren.
                            </p>

                            {/* 1. Registers */}
                            <div className="space-y-2">
                                <Label className="font-bold">Register freigeben</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {registers.map(reg => (
                                        <div key={reg.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`reg-${reg.id}`}
                                                checked={allowedRegisters.includes(reg.id)}
                                                onCheckedChange={(checked: boolean) => {
                                                    if (checked) {
                                                        setAllowedRegisters([...allowedRegisters, reg.id]);
                                                    } else {
                                                        setAllowedRegisters(allowedRegisters.filter(id => id !== reg.id));
                                                        // Also remove denied users from this register as they no longer have access to revoke
                                                        const registerUserIds = users.filter((u: any) => u.registerId === reg.id).map((u: any) => u.id);
                                                        setDeniedUsers(deniedUsers.filter(id => !registerUserIds.includes(id)));
                                                    }
                                                }}
                                            />
                                            <label htmlFor={`reg-${reg.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                {reg.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 2. Specific Users Allow - only users NOT covered by a register */}
                            <div className="space-y-2">
                                <Label className="font-bold">Zusätzliche Benutzer freigeben</Label>
                                <p className="text-xs text-muted-foreground">Benutzer, die nicht in einem freigegebenen Register sind.</p>
                                <select
                                    className="w-full border p-2 rounded text-sm"
                                    onChange={(e) => {
                                        const uid = parseInt(e.target.value);
                                        if (uid && !allowedUsers.includes(uid)) setAllowedUsers([...allowedUsers, uid]);
                                        e.target.value = '';
                                    }}
                                >
                                    <option value="">Benutzer auswählen...</option>
                                    {usersForAllowDropdown.map((u: any) => (
                                        <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                                    ))}
                                </select>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {allowedUsers.map(uid => {
                                        const u = users.find((user: any) => user.id === uid);
                                        return u ? (
                                            <div key={uid} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded flex items-center gap-1">
                                                {u.firstName} {u.lastName}
                                                <button onClick={() => setAllowedUsers(allowedUsers.filter(id => id !== uid))} className="hover:text-green-950">x</button>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            </div>

                            {/* 3. Specific Users Deny - only users who have access via a register */}
                            <div className="space-y-2">
                                <Label className="font-bold text-red-600">Benutzer blockieren (Ausnahmen)</Label>
                                <p className="text-xs text-muted-foreground">Benutzer aus freigegebenen Registern, denen der Zugriff entzogen wird.</p>
                                {usersForDenyDropdown.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic">Keine Benutzer zum Blockieren verfügbar. Wählen Sie zuerst ein Register aus.</p>
                                ) : (
                                    <select
                                        className="w-full border p-2 rounded text-sm"
                                        onChange={(e) => {
                                            const uid = parseInt(e.target.value);
                                            if (uid && !deniedUsers.includes(uid)) setDeniedUsers([...deniedUsers, uid]);
                                            e.target.value = '';
                                        }}
                                    >
                                        <option value="">Benutzer auswählen...</option>
                                        {usersForDenyDropdown.map((u: any) => (
                                            <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                                        ))}
                                    </select>
                                )}
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {deniedUsers.map(uid => {
                                        const u = users.find((user: any) => user.id === uid);
                                        return u ? (
                                            <div key={uid} className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded flex items-center gap-1">
                                                {u.firstName} {u.lastName}
                                                <button onClick={() => setDeniedUsers(deniedUsers.filter(id => id !== uid))} className="hover:text-red-950">x</button>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="text-sm text-destructive bg-destructive/10 p-2 rounded mb-4">
                        {error}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Abbrechen</Button>
                    <Button onClick={handleSubmit} disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Shield className="mr-2 h-4 w-4" />
                        Speichern
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
