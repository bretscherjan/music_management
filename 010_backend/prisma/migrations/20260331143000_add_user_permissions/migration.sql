CREATE TABLE `Permission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `category` VARCHAR(191) NULL,

    UNIQUE INDEX `Permission_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `UserPermission` (
    `userId` INTEGER NOT NULL,
    `permissionId` INTEGER NOT NULL,
    `grantedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `grantedBy` INTEGER NULL,

    INDEX `UserPermission_userId_idx`(`userId`),
    INDEX `UserPermission_permissionId_idx`(`permissionId`),
    PRIMARY KEY (`userId`, `permissionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `UserPermission`
    ADD CONSTRAINT `UserPermission_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `UserPermission`
    ADD CONSTRAINT `UserPermission_permissionId_fkey`
    FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO `Permission` (`key`, `description`, `category`) VALUES
    ('calendar:read', 'Termine ansehen', 'Termine'),
    ('calendar:write', 'Termine erstellen/bearbeiten/löschen', 'Termine'),
    ('files:read', 'Dateien ansehen', 'Dateien'),
    ('files:write', 'Dateien hochladen/bearbeiten', 'Dateien'),
    ('files:delete', 'Dateien löschen', 'Dateien'),
    ('sheetMusic:read', 'Noten ansehen', 'Noten'),
    ('sheetMusic:write', 'Noten verwalten', 'Noten'),
    ('sheetMusic:delete', 'Noten löschen', 'Noten'),
    ('chat:read', 'Chat ansehen', 'Chat'),
    ('chat:write', 'Chat-Nachrichten schreiben', 'Chat'),
    ('chat:manage', 'Chat verwalten (Mitglieder entfernen)', 'Chat'),
    ('members:read', 'Mitgliederliste ansehen', 'Mitglieder'),
    ('members:write', 'Mitglieder verwalten', 'Mitglieder'),
    ('cms:read', 'CMS-Inhalte ansehen', 'CMS'),
    ('cms:write', 'CMS-Inhalte bearbeiten', 'CMS'),
    ('workspace:read', 'Workspace ansehen', 'Admin'),
    ('workspace:write', 'Workspace verwalten', 'Admin'),
    ('admin:access', 'Admin-Zugang', 'Admin')
ON DUPLICATE KEY UPDATE
    `description` = VALUES(`description`),
    `category` = VALUES(`category`);

INSERT INTO `UserPermission` (`userId`, `permissionId`)
SELECT `User`.`id`, `Permission`.`id`
FROM `User`
JOIN `Permission` ON `Permission`.`key` IN (
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
    'admin:access'
)
LEFT JOIN `UserPermission`
    ON `UserPermission`.`userId` = `User`.`id`
    AND `UserPermission`.`permissionId` = `Permission`.`id`
WHERE `User`.`role` = 'admin'
  AND `UserPermission`.`userId` IS NULL;

SET @has_user_type_column := (
        SELECT COUNT(*)
        FROM `INFORMATION_SCHEMA`.`COLUMNS`
        WHERE `TABLE_SCHEMA` = DATABASE()
            AND `TABLE_NAME` = 'User'
            AND `COLUMN_NAME` = 'type'
);

SET @member_permission_backfill_sql := IF(
        @has_user_type_column > 0,
        'INSERT INTO `UserPermission` (`userId`, `permissionId`)
SELECT `User`.`id`, `Permission`.`id`
FROM `User`
JOIN `Permission` ON `Permission`.`key` IN (
        ''calendar:read'',
        ''files:read'',
        ''sheetMusic:read'',
        ''chat:read'',
        ''chat:write'',
        ''members:read''
)
LEFT JOIN `UserPermission`
        ON `UserPermission`.`userId` = `User`.`id`
        AND `UserPermission`.`permissionId` = `Permission`.`id`
WHERE `User`.`role` <> ''admin''
    AND `User`.`type` = ''REGULAR''
    AND `UserPermission`.`userId` IS NULL',
        'INSERT INTO `UserPermission` (`userId`, `permissionId`)
SELECT `User`.`id`, `Permission`.`id`
FROM `User`
JOIN `Permission` ON `Permission`.`key` IN (
        ''calendar:read'',
        ''files:read'',
        ''sheetMusic:read'',
        ''chat:read'',
        ''chat:write'',
        ''members:read''
)
LEFT JOIN `UserPermission`
        ON `UserPermission`.`userId` = `User`.`id`
        AND `UserPermission`.`permissionId` = `Permission`.`id`
WHERE `User`.`role` <> ''admin''
    AND `UserPermission`.`userId` IS NULL'
);

PREPARE member_permission_backfill_stmt FROM @member_permission_backfill_sql;
EXECUTE member_permission_backfill_stmt;
DEALLOCATE PREPARE member_permission_backfill_stmt;
