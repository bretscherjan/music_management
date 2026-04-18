const PERMISSION_DEFINITIONS = [
    { key: 'events:read', description: 'Termine ansehen und Ablauf exportieren', category: 'Termine' },
    { key: 'events:write', description: 'Termine erstellen und bearbeiten', category: 'Termine' },
    { key: 'events:admin', description: 'Anwesenheiten und Termin-Administration verwalten', category: 'Termine' },
    { key: 'events:delete', description: 'Termine löschen', category: 'Termine' },
    { key: 'files:read', description: 'Dateien ansehen und herunterladen', category: 'Dateien' },
    { key: 'files:upload', description: 'Dateien hochladen und organisieren', category: 'Dateien' },
    { key: 'files:permissions', description: 'Datei-Berechtigungen und Löschaktionen verwalten', category: 'Dateien' },
    { key: 'folders:read', description: 'Mappen ansehen und exportieren', category: 'Mappen' },
    { key: 'folders:write', description: 'Mappen erstellen und bearbeiten', category: 'Mappen' },
    { key: 'members:read', description: 'Mitgliederliste ansehen', category: 'Mitglieder' },
    { key: 'members:write', description: 'Mitglieder erstellen und bearbeiten', category: 'Mitglieder' },
    { key: 'members:permissions', description: 'Mitglieder-Berechtigungen verwalten', category: 'Mitglieder' },
    { key: 'toolkit:read', description: 'Toolkit ansehen', category: 'Toolkit' },
    { key: 'theory:read', description: 'Theorie ansehen', category: 'Theorie' },
    { key: 'grifftabelle:read', description: 'Grifftabelle ansehen', category: 'Grifftabelle' },
    { key: 'grifftabelle:write', description: 'Grifftabelle bearbeiten', category: 'Grifftabelle' },
    { key: 'workspace:read', description: 'Workspace ansehen', category: 'Workspace' },
    { key: 'workspace:mentions', description: 'Workspace-Erwähnungen lesen', category: 'Workspace' },
    { key: 'workspace:write', description: 'Workspace erstellen und bearbeiten', category: 'Workspace' },
    { key: 'sheetMusic:read', description: 'Notenbestand ansehen und exportieren', category: 'Noten' },
    { key: 'sheetMusic:write', description: 'Noten in Mappen und Setlisten verwenden', category: 'Noten' },
    { key: 'sheetMusic:manage', description: 'Noten vollständig erstellen und verwalten', category: 'Noten' },
    { key: 'registers:read', description: 'Register ansehen', category: 'Register' },
    { key: 'registers:write', description: 'Register erstellen und bearbeiten', category: 'Register' },
    { key: 'news:read', description: 'News ansehen', category: 'News' },
    { key: 'news:write', description: 'News erstellen und bearbeiten', category: 'News' },
    { key: 'statistics:read', description: 'Statistiken ansehen', category: 'Statistiken' },
    { key: 'engagement:read', description: 'Engagement-Auswertungen ansehen', category: 'Engagement' },
    { key: 'protokoll:read', description: 'Protokoll-Funktionen nutzen', category: 'Protokoll' },
    { key: 'db:read', description: 'Datenbank-Ansichten ansehen', category: 'DB' },
    { key: 'db:write', description: 'Datenbank verändern', category: 'DB' },
    { key: 'cms:read', description: 'CMS-Inhalte ansehen', category: 'CMS' },
    { key: 'cms:write', description: 'CMS-Inhalte erstellen und bearbeiten', category: 'CMS' },
    { key: 'chat:read', description: 'Zugeteilte Chats lesen und nutzen', category: 'Chat' },
    { key: 'chat:create', description: 'Neue Chats erstellen und Chat-Verwaltung nutzen', category: 'Chat' },
    { key: 'polls:read', description: 'Abstimmungen ansehen und daran teilnehmen', category: 'Abstimmungen' },
    { key: 'polls:write', description: 'Abstimmungen erstellen, bearbeiten und löschen', category: 'Abstimmungen' },
];

const PERMISSION_DEPENDENCIES = {
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
    'polls:write': ['polls:read'],
    'chat:create': ['chat:read'],
};

const MEMBER_PRESET_KEYS = [
    'events:read',
    'files:read',
    'folders:read',
    'members:read',
    'chat:create',
    'polls:read',
];

const SYSTEM_PERMISSION_TEMPLATES = [
    {
        systemKey: 'admin',
        name: 'Admin',
        description: 'Vollzugriff auf alle aktuell verfugbaren Berechtigungen.',
        isSystem: true,
        permissionKeys: getAllPermissionKeys(),
    },
    {
        systemKey: 'member',
        name: 'Member',
        description: 'Aktuelle Standard-Funktionen fur Mitglieder.',
        isSystem: true,
        permissionKeys: MEMBER_PRESET_KEYS,
    },
];

function getAllPermissionKeys() {
    return PERMISSION_DEFINITIONS.map((permission) => permission.key);
}

function expandPermissionKeys(permissionKeys = []) {
    const resolved = new Set();

    const visit = (permissionKey) => {
        if (!permissionKey || resolved.has(permissionKey)) {
            return;
        }

        resolved.add(permissionKey);

        const dependencies = PERMISSION_DEPENDENCIES[permissionKey] || [];
        dependencies.forEach(visit);
    };

    permissionKeys.forEach(visit);

    return getAllPermissionKeys().filter((permissionKey) => resolved.has(permissionKey));
}

const DEFAULT_PERMISSIONS = {
    regular: expandPermissionKeys(MEMBER_PRESET_KEYS),
    admin: expandPermissionKeys(getAllPermissionKeys()),
};

function getDefaultPermissionKeys(userLike = {}) {
    const role = typeof userLike === 'string' ? userLike : userLike.role;
    const type = typeof userLike === 'object' ? userLike.type : 'REGULAR';

    if (role === 'admin') {
        return DEFAULT_PERMISSIONS.admin;
    }

    if (type === 'GUEST') {
        return [];
    }

    return DEFAULT_PERMISSIONS.regular;
}

function isDefaultPermission(permissionKey) {
    return DEFAULT_PERMISSIONS.regular.includes(permissionKey);
}

function isAdminOnly(permissionKey) {
    return !DEFAULT_PERMISSIONS.regular.includes(permissionKey);
}

module.exports = {
    DEFAULT_PERMISSIONS,
    PERMISSION_DEFINITIONS,
    PERMISSION_DEPENDENCIES,
    MEMBER_PRESET_KEYS,
    SYSTEM_PERMISSION_TEMPLATES,
    expandPermissionKeys,
    getAllPermissionKeys,
    getDefaultPermissionKeys,
    isDefaultPermission,
    isAdminOnly,
};
