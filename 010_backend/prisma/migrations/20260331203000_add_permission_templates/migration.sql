CREATE TABLE `PermissionTemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `systemKey` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `permissionKeys` JSON NOT NULL,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `createdBy` INTEGER NULL,
    `updatedBy` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PermissionTemplate_systemKey_key`(`systemKey`),
    INDEX `PermissionTemplate_name_idx`(`name`),
    INDEX `PermissionTemplate_isSystem_idx`(`isSystem`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `PermissionTemplate` (`systemKey`, `name`, `description`, `permissionKeys`, `isSystem`, `createdAt`, `updatedAt`)
VALUES
    (
        'admin',
        'Admin',
        'Vollzugriff auf alle aktuell verfugbaren Berechtigungen.',
        JSON_ARRAY(
            'events:read', 'events:write', 'events:admin', 'events:delete',
            'files:read', 'files:upload', 'files:permissions',
            'folders:read', 'folders:write',
            'members:read', 'members:write', 'members:permissions',
            'toolkit:read', 'theory:read',
            'grifftabelle:read', 'grifftabelle:write',
            'workspace:read', 'workspace:mentions', 'workspace:write',
            'sheetMusic:read', 'sheetMusic:write', 'sheetMusic:manage',
            'registers:read', 'registers:write',
            'news:read', 'news:write',
            'statistics:read', 'engagement:read', 'protokoll:read',
            'db:read', 'db:write',
            'cms:read', 'cms:write',
            'chat:read', 'chat:create'
        ),
        true,
        NOW(3),
        NOW(3)
    ),
    (
        'member',
        'Member',
        'Aktuelle Standard-Funktionen fur Mitglieder.',
        JSON_ARRAY('events:read', 'files:read', 'folders:read', 'members:read', 'chat:create'),
        true,
        NOW(3),
        NOW(3)
    )
ON DUPLICATE KEY UPDATE `systemKey` = `systemKey`;
