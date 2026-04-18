import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Save, ShieldCheck, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { Permission, PermissionTemplate } from '@/types';
import { expandPermissionKeys, orderPermissions, removePermissionWithDependents } from '@/lib/permissions';

interface BulkPermissionDialogProps {
    open: boolean;
    onClose: () => void;
    selectedUserIds: number[];
}

type Step = 'edit' | 'confirm';

export function BulkPermissionDialog({ open, onClose, selectedUserIds }: BulkPermissionDialogProps) {
    const queryClient = useQueryClient();
    const [step, setStep] = useState<Step>('edit');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

    const { data: allPermissions, isLoading: permissionsLoading } = useQuery({
        queryKey: ['all-permissions'],
        queryFn: () => userService.getAllPermissions(),
    });

    const { data: templates = [], isLoading: templatesLoading } = useQuery({
        queryKey: ['permission-templates'],
        queryFn: () => userService.getPermissionTemplates(),
    });

    const orderedPermissions = orderPermissions(allPermissions || []);

    const normalizedTemplates = useMemo(() => templates.map((t) => ({
        ...t,
        permissionKeys: expandPermissionKeys(Array.isArray(t.permissionKeys) ? t.permissionKeys : []),
    })), [templates]);

    const groupedPermissions = useMemo(() =>
        orderedPermissions.reduce((acc, p) => {
            const cat = p.category || 'Sonstige';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(p);
            return acc;
        }, {} as Record<string, Permission[]>),
        [orderedPermissions]
    );

    const bulkMutation = useMutation({
        mutationFn: () => userService.bulkUpdatePermissions(selectedUserIds, selectedPermissions),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success(`Berechtigungen für ${selectedUserIds.length} Mitglieder aktualisiert`);
            handleClose();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Fehler beim Aktualisieren der Berechtigungen');
        }
    });

    const handleClose = () => {
        setStep('edit');
        setSelectedPermissions([]);
        onClose();
    };

    const handleToggle = (key: string) => {
        setSelectedPermissions(prev =>
            prev.includes(key)
                ? removePermissionWithDependents(prev, key)
                : expandPermissionKeys([...prev, key])
        );
    };

    const handleApplyTemplate = (t: PermissionTemplate & { permissionKeys: string[] }) => {
        setSelectedPermissions(expandPermissionKeys(t.permissionKeys));
    };

    const isLoading = permissionsLoading || templatesLoading;

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        Berechtigungen anpassen
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                            ({selectedUserIds.length} Mitglieder)
                        </span>
                    </DialogTitle>
                </DialogHeader>

                {step === 'edit' && (
                    <div className="flex-1 overflow-y-auto space-y-6 py-2">
                        {isLoading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <>
                                {/* Template quick-apply */}
                                {normalizedTemplates.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Vorlage anwenden
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {normalizedTemplates.map((t) => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => handleApplyTemplate(t)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors hover:bg-primary/10 hover:border-primary hover:text-primary"
                                                >
                                                    {t.name}
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => setSelectedPermissions([])}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed text-sm text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                                            >
                                                Alles entfernen
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Grouped permissions */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {Object.entries(groupedPermissions).map(([category, perms]) => (
                                        <div key={category} className="space-y-2">
                                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                {category}
                                            </h4>
                                            <div className="space-y-2">
                                                {perms.map((p) => (
                                                    <div key={p.key} className="flex items-start space-x-2">
                                                        <Checkbox
                                                            id={`bulk-perm-${p.key}`}
                                                            checked={selectedPermissions.includes(p.key)}
                                                            onCheckedChange={() => handleToggle(p.key)}
                                                        />
                                                        <div className="grid gap-0.5 leading-none">
                                                            <Label
                                                                htmlFor={`bulk-perm-${p.key}`}
                                                                className="text-sm font-medium cursor-pointer"
                                                            >
                                                                {p.key}
                                                            </Label>
                                                            {p.description && (
                                                                <p className="text-xs text-muted-foreground">{p.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {step === 'confirm' && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 py-6 text-center">
                        <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                            <AlertTriangle className="h-6 w-6 text-amber-600" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-semibold">Bist du sicher?</p>
                            <p className="text-sm text-muted-foreground">
                                Die Berechtigungen von{' '}
                                <span className="font-medium text-foreground">{selectedUserIds.length} Personen</span>
                                {' '}werden überschrieben mit{' '}
                                <span className="font-medium text-foreground">{selectedPermissions.length} Berechtigungen</span>.
                                Dies kann nicht rückgängig gemacht werden.
                            </p>
                        </div>
                    </div>
                )}

                <DialogFooter className="gap-2">
                    {step === 'edit' ? (
                        <>
                            <Button variant="outline" onClick={handleClose}>Abbrechen</Button>
                            <Button
                                onClick={() => setStep('confirm')}
                                disabled={isLoading}
                            >
                                <Save className="mr-2 h-4 w-4" />
                                Weiter
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => setStep('edit')}>Zurück</Button>
                            <Button
                                onClick={() => bulkMutation.mutate()}
                                disabled={bulkMutation.isPending}
                            >
                                {bulkMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                )}
                                Berechtigungen anwenden
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
