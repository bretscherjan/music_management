import { useState, useMemo } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { fileService } from '@/services/fileService';
import { registerService } from '@/services/registerService';
import { userService } from '@/services/userService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Upload, File as FileIcon, X, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import type { UploadFileDto } from '@/types';

interface FileUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentFolderId: number | null;
    currentFolderName: string;
}

interface FileUploadStatus {
    file: File;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
}

export function FileUploadDialog({ open, onOpenChange, currentFolderId, currentFolderName }: FileUploadDialogProps) {
    const queryClient = useQueryClient();
    const [fileStatuses, setFileStatuses] = useState<FileUploadStatus[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);

    // Permission state
    const [mode, setMode] = useState<'all' | 'admin' | 'custom'>('all');
    const [allowedRegisters, setAllowedRegisters] = useState<number[]>([]);
    const [allowedUsers, setAllowedUsers] = useState<number[]>([]);
    const [deniedUsers, setDeniedUsers] = useState<number[]>([]);

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

    const handleClose = () => {
        if (isUploading) return;
        setFileStatuses([]);
        setGlobalError(null);
        onOpenChange(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files).map((file) => ({
                file,
                status: 'pending' as const,
            }));
            setFileStatuses(newFiles);
            setGlobalError(null);
        }
    };

    const removeFile = (index: number) => {
        setFileStatuses((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (fileStatuses.length === 0 || isUploading) return;

        setIsUploading(true);
        setGlobalError(null);

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

        const options: UploadFileDto = {
            visibility: mode === 'all' ? 'all' : 'limit',
            folderId: currentFolderId,
            accessRules: JSON.stringify(accessRules),
        };

        let hasError = false;

        for (let i = 0; i < fileStatuses.length; i++) {
            const entry = fileStatuses[i];
            if (entry.status === 'success') continue;

            // Mark as uploading
            setFileStatuses((prev) =>
                prev.map((f, idx) => (idx === i ? { ...f, status: 'uploading' } : f))
            );

            try {
                await fileService.upload(entry.file, options);
                setFileStatuses((prev) =>
                    prev.map((f, idx) => (idx === i ? { ...f, status: 'success' } : f))
                );
            } catch (err: any) {
                hasError = true;
                const msg = err.response?.data?.message || 'Fehler beim Hochladen';
                setFileStatuses((prev) =>
                    prev.map((f, idx) => (idx === i ? { ...f, status: 'error', error: msg } : f))
                );
            }
        }

        setIsUploading(false);
        queryClient.invalidateQueries({ queryKey: ['folderContents'] });

        if (!hasError) {
            // All successful – close after short delay so user sees success state
            setTimeout(() => {
                setFileStatuses([]);
                onOpenChange(false);
            }, 800);
        }
    };

    const pendingCount = fileStatuses.filter((f) => f.status === 'pending' || f.status === 'error').length;
    const successCount = fileStatuses.filter((f) => f.status === 'success').length;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Dateien hochladen</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* File Input */}
                    <div className="space-y-2">
                        <Label htmlFor="file">Dateien auswählen</Label>
                        <Input
                            id="file"
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            disabled={isUploading}
                            className="cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground">
                            Mehrere Dateien können gleichzeitig ausgewählt werden (Strg+Klick oder Shift+Klick).
                        </p>
                    </div>

                    {/* File List */}
                    {fileStatuses.length > 0 && (
                        <div className="space-y-1 max-h-52 overflow-y-auto rounded-md border p-2">
                            {fileStatuses.map((entry, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-2 text-sm p-1.5 rounded hover:bg-muted/50"
                                >
                                    {entry.status === 'uploading' && (
                                        <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                                    )}
                                    {entry.status === 'success' && (
                                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                    )}
                                    {entry.status === 'error' && (
                                        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                                    )}
                                    {entry.status === 'pending' && (
                                        <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                                    )}
                                    <span className="flex-1 truncate" title={entry.file.name}>
                                        {entry.file.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground shrink-0">
                                        {(entry.file.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                    {entry.status === 'error' && (
                                        <span className="text-xs text-destructive shrink-0">{entry.error}</span>
                                    )}
                                    {(entry.status === 'pending' || entry.status === 'error') && !isUploading && (
                                        <button
                                            type="button"
                                            onClick={() => removeFile(idx)}
                                            className="shrink-0 text-muted-foreground hover:text-destructive"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Progress summary while uploading */}
                    {isUploading && (
                        <p className="text-sm text-muted-foreground text-center">
                            {successCount} / {fileStatuses.length} Dateien hochgeladen…
                        </p>
                    )}

                    {/* Folder Info */}
                    <div className="space-y-2">
                        <Label>Speicherort</Label>
                        <div className="p-2 bg-muted rounded-md text-sm font-medium flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            {currentFolderName}
                        </div>
                    </div>

                    {/* Permission Section */}
                    <div className="space-y-4 border rounded-md p-4">
                        <Label className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Berechtigungen setzen
                        </Label>

                        <RadioGroup value={mode} onValueChange={(v: 'all' | 'admin' | 'custom') => setMode(v)}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="all" id="upload-all" />
                                <Label htmlFor="upload-all" className="text-sm font-normal">Alle Mitglieder (Öffentlich)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="admin" id="upload-admin" />
                                <Label htmlFor="upload-admin" className="text-sm font-normal">Nur Admins</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="custom" id="upload-custom" />
                                <Label htmlFor="upload-custom" className="text-sm font-normal">Benutzerdefiniert</Label>
                            </div>
                        </RadioGroup>

                        {mode === 'custom' && (
                            <div className="mt-4 space-y-4 text-sm scale-95 origin-top border-t pt-4">
                                {/* Registers */}
                                <div className="space-y-2">
                                    <Label className="font-semibold text-xs">Register</Label>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                        {registers.map(reg => (
                                            <div key={reg.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`up-reg-${reg.id}`}
                                                    checked={allowedRegisters.includes(reg.id)}
                                                    onCheckedChange={(checked: boolean) => {
                                                        if (checked) setAllowedRegisters([...allowedRegisters, reg.id]);
                                                        else {
                                                            setAllowedRegisters(allowedRegisters.filter(id => id !== reg.id));
                                                            const regUsers = users.filter((u: any) => u.registerId === reg.id).map((u: any) => u.id);
                                                            setDeniedUsers(deniedUsers.filter(id => !regUsers.includes(id)));
                                                        }
                                                    }}
                                                />
                                                <label htmlFor={`up-reg-${reg.id}`} className="text-xs truncate">{reg.name}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Additional Users */}
                                <div className="space-y-2">
                                    <Label className="font-semibold text-xs">Zusätzliche Benutzer</Label>
                                    <select
                                        className="w-full border p-1 rounded text-xs"
                                        onChange={(e) => {
                                            const uid = parseInt(e.target.value);
                                            if (uid && !allowedUsers.includes(uid)) setAllowedUsers([...allowedUsers, uid]);
                                            e.target.value = '';
                                        }}
                                    >
                                        <option value="">Auswählen...</option>
                                        {usersForAllowDropdown.map((u: any) => (
                                            <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                                        ))}
                                    </select>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {allowedUsers.map(uid => {
                                            const u = users.find((user: any) => user.id === uid);
                                            return u ? (
                                                <div key={uid} className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    {u.firstName} {u.lastName}
                                                    <button type="button" onClick={() => setAllowedUsers(allowedUsers.filter(id => id !== uid))}>x</button>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                </div>

                                {/* Denied Users */}
                                <div className="space-y-2">
                                    <Label className="font-semibold text-xs text-red-600">Ausnahmen (Blockieren)</Label>
                                    <select
                                        className="w-full border p-1 rounded text-xs"
                                        disabled={usersForDenyDropdown.length === 0}
                                        onChange={(e) => {
                                            const uid = parseInt(e.target.value);
                                            if (uid && !deniedUsers.includes(uid)) setDeniedUsers([...deniedUsers, uid]);
                                            e.target.value = '';
                                        }}
                                    >
                                        <option value="">Auswählen...</option>
                                        {usersForDenyDropdown.map((u: any) => (
                                            <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                                        ))}
                                    </select>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {deniedUsers.map(uid => {
                                            const u = users.find((user: any) => user.id === uid);
                                            return u ? (
                                                <div key={uid} className="bg-red-100 text-red-800 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    {u.firstName} {u.lastName}
                                                    <button type="button" onClick={() => setDeniedUsers(deniedUsers.filter(id => id !== uid))}>x</button>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {globalError && (
                        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                            {globalError}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button type="button" variant="outline" onClick={handleClose} disabled={isUploading}>
                            Abbrechen
                        </Button>
                        <Button type="submit" disabled={pendingCount === 0 || isUploading}>
                            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Upload className="mr-2 h-4 w-4" />
                            {fileStatuses.length > 1
                                ? `${fileStatuses.length} Dateien hochladen`
                                : 'Hochladen'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

