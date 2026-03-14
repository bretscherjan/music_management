import { useState, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { fileService } from '@/services/fileService';
import { registerService } from '@/services/registerService';
import { userService } from '@/services/userService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Shield, Info } from 'lucide-react';

interface ManageBulkAccessDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedFileIds: number[];
    selectedFolderIds: number[];
}

export function ManageBulkAccessDialog({ open, onOpenChange, selectedFileIds, selectedFolderIds }: ManageBulkAccessDialogProps) {
    const queryClient = useQueryClient();
    const [mode, setMode] = useState<'all' | 'admin' | 'custom'>('all');
    const [allowedRegisters, setAllowedRegisters] = useState<number[]>([]);
    const [allowedUsers, setAllowedUsers] = useState<number[]>([]);
    const [deniedUsers, setDeniedUsers] = useState<number[]>([]);
    const [recursive, setRecursive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch master data
    const { data: registers = [] } = useQuery({ queryKey: ['registers'], queryFn: registerService.getAll });
    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: () => userService.getAll()
    });

    // --- Smart Dropdown Filtering ---
    const usersWithRegisterAccess = useMemo(() => {
        if (allowedRegisters.length === 0) return new Set<number>();
        return new Set(
            users
                .filter((u: any) => u.registerId && allowedRegisters.includes(u.registerId))
                .map((u: any) => u.id)
        );
    }, [users, allowedRegisters]);

    const usersForAllowDropdown = useMemo(() => {
        return users.filter((u: any) =>
            !allowedUsers.includes(u.id) &&
            !usersWithRegisterAccess.has(u.id)
        );
    }, [users, allowedUsers, usersWithRegisterAccess]);

    const usersForDenyDropdown = useMemo(() => {
        return users.filter((u: any) =>
            usersWithRegisterAccess.has(u.id) &&
            !deniedUsers.includes(u.id) &&
            !allowedUsers.includes(u.id)
        );
    }, [users, usersWithRegisterAccess, deniedUsers, allowedUsers]);

    const mutation = useMutation({
        mutationFn: (data: any) => fileService.bulkUpdateAccess(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folderContents'] });
            handleClose();
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Fehler beim Aktualisieren der Berechtigungen');
        },
    });

    const handleClose = () => {
        setError(null);
        // Reset state
        setMode('all');
        setAllowedRegisters([]);
        setAllowedUsers([]);
        setDeniedUsers([]);
        setRecursive(false);
        onOpenChange(false);
    };

    const handleSubmit = () => {
        const accessRules: any[] = [];

        if (mode === 'admin') {
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
            fileIds: selectedFileIds,
            folderIds: selectedFolderIds,
            visibility: mode === 'all' ? 'all' : 'limit',
            accessRules: JSON.stringify(accessRules),
            recursive: recursive
        });
    };

    const itemCount = selectedFileIds.length + selectedFolderIds.length;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Mehrfachbearbeitung: Berechtigungen ({itemCount} Objekte)</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="bg-muted/50 p-3 rounded-md flex items-start gap-3 text-sm">
                        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium">Hinweis zur Mehrfachbearbeitung</p>
                            <p className="text-muted-foreground">
                                Die hier gewählten Einstellungen werden auf alle {itemCount} ausgewählten Elemente angewendet. Bestehende spezifische Berechtigungen werden überschrieben.
                            </p>
                        </div>
                    </div>

                    {/* Mode Selection */}
                    <RadioGroup value={mode} onValueChange={(v: 'all' | 'admin' | 'custom') => setMode(v)}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="all" id="bulk-all" />
                            <Label htmlFor="bulk-all">Öffentlich (Alle Mitglieder)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="admin" id="bulk-admin" />
                            <Label htmlFor="bulk-admin">Nur Admins</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="custom" id="bulk-custom" />
                            <Label htmlFor="bulk-custom">Benutzerdefiniert (Bestimmte Register/Benutzer)</Label>
                        </div>
                    </RadioGroup>

                    {/* Custom Configurator */}
                    {mode === 'custom' && (
                        <div className="space-y-6 border p-4 rounded-md">
                            <p className="text-xs text-muted-foreground">
                                Standardmäßig hat niemand Zugriff. Fügen Sie Register oder einzelne Benutzer hinzu.
                            </p>

                            {/* 1. Registers */}
                            <div className="space-y-2">
                                <Label className="font-bold">Register freigeben</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {registers.map((reg: any) => (
                                        <div key={reg.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`bulk-reg-${reg.id}`}
                                                checked={allowedRegisters.includes(reg.id)}
                                                onCheckedChange={(checked: boolean) => {
                                                    if (checked) {
                                                        setAllowedRegisters([...allowedRegisters, reg.id]);
                                                    } else {
                                                        setAllowedRegisters(allowedRegisters.filter(id => id !== reg.id));
                                                        const registerUserIds = users.filter((u: any) => u.registerId === reg.id).map((u: any) => u.id);
                                                        setDeniedUsers(deniedUsers.filter(id => !registerUserIds.includes(id)));
                                                    }
                                                }}
                                            />
                                            <label htmlFor={`bulk-reg-${reg.id}`} className="text-sm">
                                                {reg.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 2. Specific Users Allow */}
                            <div className="space-y-2">
                                <Label className="font-bold">Zusätzliche Benutzer freigeben</Label>
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
                                            <div key={uid} className="bg-success/10 text-brand-primary text-xs px-2 py-1 rounded flex items-center gap-1">
                                                {u.firstName} {u.lastName}
                                                <button onClick={() => setAllowedUsers(allowedUsers.filter(id => id !== uid))}>x</button>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            </div>

                            {/* 3. Specific Users Deny */}
                            <div className="space-y-2">
                                <Label className="font-bold text-red-600">Benutzer blockieren (Ausnahmen)</Label>
                                <select
                                    className="w-full border p-2 rounded text-sm"
                                    disabled={usersForDenyDropdown.length === 0}
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
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {deniedUsers.map(uid => {
                                        const u = users.find((user: any) => user.id === uid);
                                        return u ? (
                                            <div key={uid} className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded flex items-center gap-1">
                                                {u.firstName} {u.lastName}
                                                <button onClick={() => setDeniedUsers(deniedUsers.filter(id => id !== uid))}>x</button>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recursive Option */}
                    {selectedFolderIds.length > 0 && (
                        <div className="flex items-center space-x-2 bg-primary/5 p-4 rounded-md border border-primary/20">
                            <Checkbox
                                id="bulk-recursive"
                                checked={recursive}
                                onCheckedChange={(checked: boolean) => setRecursive(checked)}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="bulk-recursive" className="font-bold cursor-pointer">
                                    Rekursiv auf Unterordner anwenden
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Diese Einstellungen werden auch auf alle enthaltenen Dateien und Unterordner angewendet.
                                </p>
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
                        Überall anwenden
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
