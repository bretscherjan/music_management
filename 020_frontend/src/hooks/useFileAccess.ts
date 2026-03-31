import { useMemo, useCallback } from 'react';
import { useUser } from '@/context/AuthContext';
import type { FileEntity, Folder, FileAccessRule } from '@/types';

interface FileAccessResult {
    canAccess: boolean;
    canEdit: boolean;
    canDelete: boolean;
    isRestricted: boolean;
    restrictionReason?: string;
}

function checkAccessRules(
    rules: FileAccessRule[] | undefined,
    userId: number | undefined,
    userRegisterId: number | undefined
): { canAccess: boolean; restrictionReason?: string } {
    if (!rules || rules.length === 0) {
        return { canAccess: true };
    }

    const adminOnlyRule = rules.find(r => r.targetType === 'ADMIN_ONLY');
    if (adminOnlyRule) {
        return { canAccess: false, restrictionReason: 'Nur für Administratoren' };
    }

    const userDeny = rules.find(
        r => r.targetType === 'USER' && r.userId === userId && r.accessType === 'DENY'
    );
    if (userDeny) {
        return { canAccess: false, restrictionReason: 'Zugriff verweigert' };
    }

    if (userRegisterId) {
        const registerDeny = rules.find(
            r => r.targetType === 'REGISTER' && r.registerId === userRegisterId && r.accessType === 'DENY'
        );
        if (registerDeny) {
            return { canAccess: false, restrictionReason: 'Register hat keinen Zugriff' };
        }
    }

    const userAllow = rules.find(
        r => r.targetType === 'USER' && r.userId === userId && r.accessType === 'ALLOW'
    );
    if (userAllow) {
        return { canAccess: true };
    }

    if (userRegisterId) {
        const registerAllow = rules.find(
            r => r.targetType === 'REGISTER' && r.registerId === userRegisterId && r.accessType === 'ALLOW'
        );
        if (registerAllow) {
            return { canAccess: true };
        }
    }

    const hasAllowRules = rules.some(r => r.accessType === 'ALLOW');
    if (hasAllowRules) {
        return { canAccess: false, restrictionReason: 'Kein Zugriff (Allowlist)' };
    }

    return { canAccess: true };
}

function checkLegacyVisibility(
    visibility: string | undefined,
    targetRegisterId: number | null | undefined,
    userRegisterId: number | null | undefined
): { canAccess: boolean; restrictionReason?: string } {
    if (visibility === 'all') {
        return { canAccess: true };
    }
    if (visibility === 'admin') {
        return { canAccess: false, restrictionReason: 'Nur für Administratoren' };
    }
    if (visibility === 'register') {
        const hasAccess = targetRegisterId === userRegisterId;
        return { 
            canAccess: hasAccess, 
            restrictionReason: hasAccess ? undefined : 'Nur für bestimmtes Register' 
        };
    }
    if (visibility === 'limit') {
        return { canAccess: false, restrictionReason: 'Eingeschränkt' };
    }
    return { canAccess: true };
}

export function useFileAccess() {
    const user = useUser();

    const checkFileAccess = useCallback((file: FileEntity): FileAccessResult => {
        if (!user) {
            return { canAccess: false, canEdit: false, canDelete: false, isRestricted: true };
        }

        const isAdmin = user.role === 'admin';

        if (isAdmin) {
            return { 
                canAccess: true, 
                canEdit: true, 
                canDelete: true, 
                isRestricted: false 
            };
        }

        const { canAccess, restrictionReason } = checkAccessRules(
            file.accessRules,
            user.id,
            user.registerId ?? undefined
        );

        if (!canAccess) {
            const legacyCheck = checkLegacyVisibility(
                file.visibility,
                file.targetRegisterId,
                user.registerId ?? null
            );
            
            if (legacyCheck.canAccess) {
                return {
                    canAccess: true,
                    canEdit: false,
                    canDelete: false,
                    isRestricted: true,
                    restrictionReason: legacyCheck.restrictionReason
                };
            }

            return {
                canAccess: false,
                canEdit: false,
                canDelete: false,
                isRestricted: true,
                restrictionReason: restrictionReason || legacyCheck.restrictionReason
            };
        }

        return {
            canAccess: true,
            canEdit: false,
            canDelete: false,
            isRestricted: !!(file.accessRules && file.accessRules.length > 0)
        };
    }, [user]);

    const checkFolderAccess = useCallback((folder: Folder): FileAccessResult => {
        if (!user) {
            return { canAccess: false, canEdit: false, canDelete: false, isRestricted: true };
        }

        const isAdmin = user.role === 'admin';

        if (isAdmin) {
            return { 
                canAccess: true, 
                canEdit: true, 
                canDelete: true, 
                isRestricted: false 
            };
        }

        const { canAccess, restrictionReason } = checkAccessRules(
            folder.accessRules,
            user.id,
            user.registerId ?? undefined
        );

        return {
            canAccess,
            canEdit: false,
            canDelete: false,
            isRestricted: !!(folder.accessRules && folder.accessRules.length > 0),
            restrictionReason
        };
    }, [user]);

    const canUpload = useMemo(() => {
        return user?.role === 'admin';
    }, [user]);

    const canManageAccess = useMemo(() => {
        return user?.role === 'admin';
    }, [user]);

    return {
        checkFileAccess,
        checkFolderAccess,
        canUpload,
        canManageAccess,
        isAdmin: user?.role === 'admin'
    };
}
