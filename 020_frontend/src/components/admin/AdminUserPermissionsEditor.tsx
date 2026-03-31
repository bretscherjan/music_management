import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { User, Permission } from '@/types';

interface AdminUserPermissionsEditorProps {
    user: User;
}

export function AdminUserPermissionsEditor({ user }: AdminUserPermissionsEditorProps) {
    const queryClient = useQueryClient();
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
        () => user.permissions?.map(p => p.permission.key) || []
    );

    const { data: allPermissions, isLoading: permissionsLoading } = useQuery({
        queryKey: ['all-permissions'],
        queryFn: () => userService.getAllPermissions(),
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

    const handleTogglePermission = (key: string) => {
        setSelectedPermissions(prev => 
            prev.includes(key) 
                ? prev.filter(p => p !== key) 
                : [...prev, key]
        );
    };

    const handleSave = () => {
        updatePermissionsMutation.mutate(selectedPermissions);
    };

    if (permissionsLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Group permissions by category
    const groupedPermissions = allPermissions?.reduce((acc, p) => {
        const category = p.category || 'Sonstige';
        if (!acc[category]) acc[category] = [];
        acc[category].push(p);
        return acc;
    }, {} as Record<string, Permission[]>) || {};

    return (
        <div className="space-y-6 pt-4">
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
