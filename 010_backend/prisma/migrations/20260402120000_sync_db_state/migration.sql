-- DropIndex
DROP INDEX `idx_user_lastSeenAt` ON `User`;

-- DropIndex
DROP INDEX `idx_user_status` ON `User`;

-- DropIndex
DROP INDEX `idx_user_status_lastSeenAt` ON `User`;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `expiresAt` DATETIME(3) NULL,
    ADD COLUMN `type` ENUM('REGULAR', 'GUEST') NOT NULL DEFAULT 'REGULAR';

-- CreateTable
CREATE TABLE `Permission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `category` VARCHAR(191) NULL,

    UNIQUE INDEX `Permission_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
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

-- CreateTable
CREATE TABLE `UserPermission` (
    `userId` INTEGER NOT NULL,
    `permissionId` INTEGER NOT NULL,
    `grantedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `grantedBy` INTEGER NULL,

    INDEX `UserPermission_userId_idx`(`userId`),
    INDEX `UserPermission_permissionId_idx`(`permissionId`),
    PRIMARY KEY (`userId`, `permissionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserPermission` ADD CONSTRAINT `UserPermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserPermission` ADD CONSTRAINT `UserPermission_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

