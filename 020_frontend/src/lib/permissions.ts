import type { Permission } from '@/types';

export const PERMISSION_CATEGORY_ORDER = [
    'Termine',
    'Dateien',
    'Mappen',
    'Mitglieder',
    'Toolkit',
    'Theorie',
    'Grifftabelle',
    'Workspace',
    'Noten',
    'Register',
    'News',
    'Statistiken',
    'Engagement',
    'Protokoll',
    'DB',
    'CMS',
    'Chat',
];

export const PERMISSION_DEPENDENCIES: Record<string, string[]> = {
    'events:write': ['events:read'],
    'events:admin': ['events:read'],
    'events:delete': ['events:read', 'events:write'],
    'files:upload': ['files:read'],
    'files:permissions': ['files:read', 'files:upload'],
    'folders:write': ['folders:read', 'sheetMusic:read'],
    'members:write': ['members:read'],
    'members:permissions': ['members:read', 'members:write'],
    'grifftabelle:write': ['grifftabelle:read'],
    'workspace:mentions': ['workspace:read'],
    'workspace:write': ['workspace:read', 'workspace:mentions'],
    'sheetMusic:write': ['sheetMusic:read'],
    'sheetMusic:manage': ['sheetMusic:read', 'sheetMusic:write'],
    'registers:write': ['registers:read'],
    'news:write': ['news:read'],
    'db:write': ['db:read'],
    'cms:write': ['cms:read'],
    'chat:create': ['chat:read'],
};

export const MEMBER_PRESET_KEYS = [
    'events:read',
    'files:read',
    'folders:read',
    'members:read',
    'chat:create',
];

export function expandPermissionKeys(permissionKeys: string[]) {
    const resolved = new Set<string>();

    const visit = (permissionKey: string) => {
        if (!permissionKey || resolved.has(permissionKey)) {
            return;
        }

        resolved.add(permissionKey);
        (PERMISSION_DEPENDENCIES[permissionKey] || []).forEach(visit);
    };

    permissionKeys.forEach(visit);

    return Array.from(resolved);
}

export function removePermissionWithDependents(permissionKeys: string[], permissionKey: string) {
    const selected = new Set(permissionKeys);
    const toRemove = new Set<string>([permissionKey]);

    let changed = true;
    while (changed) {
        changed = false;

        for (const key of Array.from(selected)) {
            const dependencies = PERMISSION_DEPENDENCIES[key] || [];
            if (dependencies.some((dependency) => toRemove.has(dependency)) && !toRemove.has(key)) {
                toRemove.add(key);
                changed = true;
            }
        }
    }

    return permissionKeys.filter((key) => !toRemove.has(key));
}

export function orderPermissions(permissions: Permission[]) {
    return [...permissions].sort((left, right) => {
        const leftCategoryIndex = PERMISSION_CATEGORY_ORDER.indexOf(left.category || '');
        const rightCategoryIndex = PERMISSION_CATEGORY_ORDER.indexOf(right.category || '');

        if (leftCategoryIndex !== rightCategoryIndex) {
            return leftCategoryIndex - rightCategoryIndex;
        }

        return left.key.localeCompare(right.key);
    });
}