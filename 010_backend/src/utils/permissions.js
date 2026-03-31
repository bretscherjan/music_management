const DEFAULT_PERMISSIONS = {
    regular: [
        'calendar:read',
        'files:read',
        'sheetMusic:read',
        'chat:read',
        'chat:write',
        'members:read',
    ],
    admin: [
        'calendar:read',
        'calendar:write',
        'files:read',
        'files:write',
        'files:delete',
        'sheetMusic:read',
        'sheetMusic:write',
        'sheetMusic:delete',
        'chat:read',
        'chat:write',
        'chat:manage',
        'members:read',
        'members:write',
        'cms:read',
        'cms:write',
        'workspace:read',
        'workspace:write',
        'admin:access',
    ],
};

const PERMISSION_DEFINITIONS = [
    { key: 'calendar:read', description: 'Termine ansehen', category: 'Termine' },
    { key: 'calendar:write', description: 'Termine erstellen/bearbeiten/löschen', category: 'Termine' },
    { key: 'files:read', description: 'Dateien ansehen', category: 'Dateien' },
    { key: 'files:write', description: 'Dateien hochladen/bearbeiten', category: 'Dateien' },
    { key: 'files:delete', description: 'Dateien löschen', category: 'Dateien' },
    { key: 'sheetMusic:read', description: 'Noten ansehen', category: 'Noten' },
    { key: 'sheetMusic:write', description: 'Noten verwalten', category: 'Noten' },
    { key: 'sheetMusic:delete', description: 'Noten löschen', category: 'Noten' },
    { key: 'chat:read', description: 'Chat ansehen', category: 'Chat' },
    { key: 'chat:write', description: 'Chat-Nachrichten schreiben', category: 'Chat' },
    { key: 'chat:manage', description: 'Chat verwalten (Mitglieder entfernen)', category: 'Chat' },
    { key: 'members:read', description: 'Mitgliederliste ansehen', category: 'Mitglieder' },
    { key: 'members:write', description: 'Mitglieder verwalten', category: 'Mitglieder' },
    { key: 'cms:read', description: 'CMS-Inhalte ansehen', category: 'CMS' },
    { key: 'cms:write', description: 'CMS-Inhalte bearbeiten', category: 'CMS' },
    { key: 'workspace:read', description: 'Workspace ansehen', category: 'Admin' },
    { key: 'workspace:write', description: 'Workspace verwalten', category: 'Admin' },
    { key: 'admin:access', description: 'Admin-Zugang', category: 'Admin' },
];

function isDefaultPermission(permissionKey) {
    return DEFAULT_PERMISSIONS.regular.includes(permissionKey);
}

function isAdminOnly(permissionKey) {
    return !DEFAULT_PERMISSIONS.regular.includes(permissionKey);
}

module.exports = {
    DEFAULT_PERMISSIONS,
    PERMISSION_DEFINITIONS,
    isDefaultPermission,
    isAdminOnly,
};
