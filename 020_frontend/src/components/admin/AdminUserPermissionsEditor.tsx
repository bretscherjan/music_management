import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { User, Permission, PermissionTemplate } from '@/types';
import { expandPermissionKeys, orderPermissions, removePermissionWithDependents } from '@/lib/permissions';

interface AdminUserPermissionsEditorProps {
    user: User;
}

export function AdminUserPermissionsEditor({ user }: AdminUserPermissionsEditorProps) {
    const queryClient = useQueryClient();
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
        () => user.permissions?.map(p => p.permission.key) || []
    );
    const [activeTemplateId, setActiveTemplateId] = useState<number | null>(null);
    const [templateName, setTemplateName] = useState('');
    const [templateDescription, setTemplateDescription] = useState('');

    useEffect(() => {
        setSelectedPermissions(user.permissions?.map(p => p.permission.key) || []);
    }, [user]);

    const { data: allPermissions, isLoading: permissionsLoading } = useQuery({
        queryKey: ['all-permissions'],
        queryFn: () => userService.getAllPermissions(),
    });

    const { data: templates = [], isLoading: templatesLoading } = useQuery({
        queryKey: ['permission-templates'],
        queryFn: () => userService.getPermissionTemplates(),
    });

    const updatePermissionsMutation = useMutation({
        mutationFn: (keys: string[]) => userService.updatePermissions(user.id, keys),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['users', user.id] });
            toast.success('Berechtigungen erfolgreich aktualisiert');
        },
        onError: (err: { response?: { data?: { message?: string } } }) => {
            toast.error(err.response?.data?.message || 'Fehler beim Aktualisieren der Berechtigungen');
        }
    });

    const createTemplateMutation = useMutation({
        mutationFn: (payload: { name: string; description?: string | null; permissionKeys: string[] }) => userService.createPermissionTemplate(payload),
        onSuccess: (template) => {
            queryClient.invalidateQueries({ queryKey: ['permission-templates'] });
            setActiveTemplateId(template.id);
            toast.success('Vorlage erfolgreich erstellt');
        },
        onError: (err: { response?: { data?: { message?: string } } }) => {
            toast.error(err.response?.data?.message || 'Fehler beim Erstellen der Vorlage');
        }
    });

    const updateTemplateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: { name: string; description?: string | null; permissionKeys: string[] } }) =>
            userService.updatePermissionTemplate(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permission-templates'] });
            toast.success('Vorlage erfolgreich aktualisiert');
        },
        onError: (err: { response?: { data?: { message?: string } } }) => {
            toast.error(err.response?.data?.message || 'Fehler beim Aktualisieren der Vorlage');
        }
    });

    const deleteTemplateMutation = useMutation({
        mutationFn: (id: number) => userService.deletePermissionTemplate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permission-templates'] });
            setActiveTemplateId(null);
            setTemplateName('');
            setTemplateDescription('');
            toast.success('Vorlage erfolgreich gelöscht');
        },
        onError: (err: { response?: { data?: { message?: string } } }) => {
            toast.error(err.response?.data?.message || 'Fehler beim Löschen der Vorlage');
        }
    });

    const orderedPermissions = orderPermissions(allPermissions || []);
    const normalizedTemplates = useMemo(() => templates.map((template) => ({
        ...template,
        permissionKeys: expandPermissionKeys(Array.isArray(template.permissionKeys) ? template.permissionKeys : []),
    })), [templates]);
    const activeTemplate = activeTemplateId
        ? normalizedTemplates.find((template) => template.id === activeTemplateId) ?? null
        : null;

    const handleTogglePermission = (key: string) => {
        setSelectedPermissions((prev) => {
            if (prev.includes(key)) {
                return removePermissionWithDependents(prev, key);
            }

            return expandPermissionKeys([...prev, key]);
        });
    };

    const handleApplyTemplate = (template: PermissionTemplate) => {
        setActiveTemplateId(template.id);
        setTemplateName(template.name);
        setTemplateDescription(template.description || '');
        setSelectedPermissions(expandPermissionKeys(Array.isArray(template.permissionKeys) ? template.permissionKeys : []));
    };

    const handleStartNewTemplate = () => {
        setActiveTemplateId(null);
        setTemplateName('');
        setTemplateDescription('');
    };

    const handleSaveTemplate = () => {
        const payload = {
            name: templateName.trim(),
            description: templateDescription.trim() || null,
            permissionKeys: selectedPermissions,
        };

        if (!payload.name) {
            toast.error('Bitte gib der Vorlage einen Namen');
            return;
        }

        if (activeTemplateId) {
            updateTemplateMutation.mutate({ id: activeTemplateId, payload });
            return;
        }

        createTemplateMutation.mutate(payload);
    };

    const handleSave = () => {
        updatePermissionsMutation.mutate(selectedPermissions);
    };

    if (permissionsLoading || templatesLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const groupedPermissions = orderedPermissions.reduce((acc, p) => {
        const category = p.category || 'Sonstige';
        if (!acc[category]) acc[category] = [];
        acc[category].push(p);
        return acc;
    }, {} as Record<string, Permission[]>) || {};

    const isTemplateMutationPending = createTemplateMutation.isPending || updateTemplateMutation.isPending || deleteTemplateMutation.isPending;

    return (
        <div className="space-y-6 pt-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-base">Vorlagen</CardTitle>
                    <Button variant="outline" size="sm" onClick={handleStartNewTemplate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Neue Vorlage
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {normalizedTemplates.map((template) => {
                            const templateSelected = template.permissionKeys.every((key) => selectedPermissions.includes(key));

                            return (
                                <div
                                    key={template.id}
                                    className={`rounded-lg border p-4 ${activeTemplateId === template.id ? 'border-primary bg-primary/5' : 'bg-muted/20'}`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{template.name}</span>
                                                {template.isSystem && (
                                                    <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase text-secondary-foreground">
                                                        System
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {template.description || 'Keine Beschreibung'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {template.permissionKeys.length} Berechtigungen
                                            </p>
                                        </div>
                                        <Checkbox checked={templateSelected} onCheckedChange={() => handleApplyTemplate(template)} />
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        <Button type="button" variant="outline" size="sm" onClick={() => handleApplyTemplate(template)}>
                                            Anwenden
                                        </Button>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => handleApplyTemplate(template)}>
                                            Bearbeiten
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                        <div className="grid gap-2">
                            <Label htmlFor="template-name">Vorlagenname</Label>
                            <Input
                                id="template-name"
                                value={templateName}
                                onChange={(event) => setTemplateName(event.target.value)}
                                placeholder="z.B. Vorstand light"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="template-description">Beschreibung</Label>
                            <Textarea
                                id="template-description"
                                value={templateDescription}
                                onChange={(event) => setTemplateDescription(event.target.value)}
                                placeholder="Kurze Beschreibung der Vorlage"
                                rows={3}
                            />
                        </div>
                        <div className="flex flex-wrap justify-between gap-2">
                            <p className="text-xs text-muted-foreground">
                                Die aktuell gewählten Berechtigungen werden beim Speichern in dieser Vorlage abgelegt.
                            </p>
                            <div className="flex gap-2">
                                {activeTemplate && !activeTemplate.isSystem && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={isTemplateMutationPending}
                                        onClick={() => deleteTemplateMutation.mutate(activeTemplate.id)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Löschen
                                    </Button>
                                )}
                                <Button type="button" size="sm" disabled={isTemplateMutationPending} onClick={handleSaveTemplate}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {activeTemplateId ? 'Vorlage speichern' : 'Vorlage erstellen'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(groupedPermissions).map(([category, perms]) => (
                    <div key={category} className="space-y-3">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{category}</h4>
                        <div className="space-y-2">
                            {perms.map(p => (
                                <div key={p.key} className="flex items-start space-x-2">
                                    <Checkbox 
                                        id={`perm-${p.key}`} 
                                        checked={selectedPermissions.includes(p.key)}
                                        onCheckedChange={() => handleTogglePermission(p.key)}
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <Label 
                                            htmlFor={`perm-${p.key}`}
                                            className="text-sm font-medium leading-none cursor-pointer"
                                        >
                                            {p.key}
                                        </Label>
                                        {p.description && (
                                            <p className="text-xs text-muted-foreground">
                                                {p.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end pt-4">
                <Button 
                    onClick={handleSave} 
                    disabled={updatePermissionsMutation.isPending}
                    size="sm"
                >
                    {updatePermissionsMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    Berechtigungen speichern
                </Button>
            </div>
        </div>
    );
}
