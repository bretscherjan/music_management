INSERT INTO `Permission` (`key`, `description`, `category`) VALUES
    ('events:read', 'Termine ansehen', 'Termine'),
    ('events:write', 'Termine erstellen und bearbeiten', 'Termine'),
    ('events:admin', 'Anwesenheiten und Termin-Administration verwalten', 'Termine'),
    ('events:delete', 'Termine löschen', 'Termine'),
    ('files:read', 'Dateien ansehen und herunterladen', 'Dateien'),
    ('files:upload', 'Dateien hochladen und organisieren', 'Dateien'),
    ('files:permissions', 'Datei-Berechtigungen und Löschaktionen verwalten', 'Dateien'),
    ('folders:read', 'Mappen ansehen und exportieren', 'Mappen'),
    ('folders:write', 'Mappen erstellen und bearbeiten', 'Mappen'),
    ('members:read', 'Mitgliederliste ansehen', 'Mitglieder'),
    ('members:write', 'Mitglieder erstellen und bearbeiten', 'Mitglieder'),
    ('members:permissions', 'Mitglieder-Berechtigungen verwalten', 'Mitglieder'),
    ('toolkit:read', 'Toolkit ansehen', 'Toolkit'),
    ('theory:read', 'Theorie ansehen', 'Theorie'),
    ('grifftabelle:read', 'Grifftabelle ansehen', 'Grifftabelle'),
    ('grifftabelle:write', 'Grifftabelle bearbeiten', 'Grifftabelle'),
    ('workspace:read', 'Workspace ansehen', 'Workspace'),
    ('workspace:mentions', 'Workspace-Erwähnungen lesen', 'Workspace'),
    ('workspace:write', 'Workspace erstellen und bearbeiten', 'Workspace'),
    ('sheetMusic:read', 'Notenbestand ansehen', 'Noten'),
    ('sheetMusic:write', 'Noten in Mappen und Setlisten verwenden', 'Noten'),
    ('sheetMusic:manage', 'Noten vollständig erstellen und verwalten', 'Noten'),
    ('registers:read', 'Register ansehen', 'Register'),
    ('registers:write', 'Register erstellen und bearbeiten', 'Register'),
    ('news:read', 'News ansehen', 'News'),
    ('news:write', 'News erstellen und bearbeiten', 'News'),
    ('statistics:read', 'Statistiken ansehen', 'Statistiken'),
    ('engagement:read', 'Engagement-Auswertungen ansehen', 'Engagement'),
    ('protokoll:read', 'Protokoll-Funktionen nutzen', 'Protokoll'),
    ('db:read', 'Datenbank-Ansichten ansehen', 'DB'),
    ('db:write', 'Datenbank verändern', 'DB'),
    ('cms:read', 'CMS-Inhalte ansehen', 'CMS'),
    ('cms:write', 'CMS-Inhalte erstellen und bearbeiten', 'CMS'),
    ('chat:read', 'Zugeteilte Chats lesen und nutzen', 'Chat'),
    ('chat:create', 'Neue Chats erstellen und Chat-Verwaltung nutzen', 'Chat')
ON DUPLICATE KEY UPDATE
    `description` = VALUES(`description`),
    `category` = VALUES(`category`);

INSERT INTO `UserPermission` (`userId`, `permissionId`, `grantedBy`)
SELECT `up`.`userId`, `newPermission`.`id`, `up`.`grantedBy`
FROM `UserPermission` `up`
JOIN `Permission` `oldPermission` ON `oldPermission`.`id` = `up`.`permissionId`
JOIN (
    SELECT 'calendar:read' AS `oldKey`, 'events:read' AS `newKey`
    UNION ALL SELECT 'calendar:write', 'events:write'
    UNION ALL SELECT 'calendar:write', 'events:admin'
    UNION ALL SELECT 'calendar:write', 'events:delete'
    UNION ALL SELECT 'files:read', 'files:read'
    UNION ALL SELECT 'files:write', 'files:upload'
    UNION ALL SELECT 'files:delete', 'files:permissions'
    UNION ALL SELECT 'sheetMusic:read', 'folders:read'
    UNION ALL SELECT 'sheetMusic:read', 'sheetMusic:read'
    UNION ALL SELECT 'sheetMusic:write', 'folders:write'
    UNION ALL SELECT 'sheetMusic:write', 'sheetMusic:write'
    UNION ALL SELECT 'sheetMusic:write', 'sheetMusic:manage'
    UNION ALL SELECT 'sheetMusic:delete', 'sheetMusic:manage'
    UNION ALL SELECT 'chat:read', 'chat:read'
    UNION ALL SELECT 'chat:write', 'chat:create'
    UNION ALL SELECT 'chat:manage', 'chat:create'
    UNION ALL SELECT 'members:read', 'members:read'
    UNION ALL SELECT 'members:write', 'members:write'
    UNION ALL SELECT 'cms:read', 'cms:read'
    UNION ALL SELECT 'cms:read', 'news:read'
    UNION ALL SELECT 'cms:write', 'cms:write'
    UNION ALL SELECT 'cms:write', 'news:write'
    UNION ALL SELECT 'workspace:read', 'workspace:read'
    UNION ALL SELECT 'workspace:read', 'workspace:mentions'
    UNION ALL SELECT 'workspace:write', 'workspace:write'
    UNION ALL SELECT 'admin:access', 'toolkit:read'
    UNION ALL SELECT 'admin:access', 'theory:read'
    UNION ALL SELECT 'admin:access', 'grifftabelle:read'
    UNION ALL SELECT 'admin:access', 'grifftabelle:write'
    UNION ALL SELECT 'admin:access', 'registers:read'
    UNION ALL SELECT 'admin:access', 'registers:write'
    UNION ALL SELECT 'admin:access', 'statistics:read'
    UNION ALL SELECT 'admin:access', 'engagement:read'
    UNION ALL SELECT 'admin:access', 'protokoll:read'
    UNION ALL SELECT 'admin:access', 'db:read'
    UNION ALL SELECT 'admin:access', 'db:write'
) `mapping` ON `mapping`.`oldKey` = `oldPermission`.`key`
JOIN `Permission` `newPermission` ON `newPermission`.`key` = `mapping`.`newKey`
LEFT JOIN `UserPermission` `existing`
    ON `existing`.`userId` = `up`.`userId`
    AND `existing`.`permissionId` = `newPermission`.`id`
WHERE `existing`.`userId` IS NULL;

DELETE FROM `Permission`
WHERE `key` IN (
    'calendar:read',
    'calendar:write',
    'files:write',
    'files:delete',
    'sheetMusic:delete',
    'chat:write',
    'chat:manage',
    'admin:access'
);