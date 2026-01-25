/*
  Warnings:

  - A unique constraint covering the columns `[resetToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Event` ADD COLUMN `isPublic` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `File` ADD COLUMN `folderId` INTEGER NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `resetToken` VARCHAR(191) NULL,
    ADD COLUMN `resetTokenExpiry` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `Folder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `parentId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Folder_parentId_idx`(`parentId`),
    UNIQUE INDEX `Folder_name_parentId_key`(`name`, `parentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FolderAccess` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `folderId` INTEGER NOT NULL,
    `accessType` ENUM('ALLOW', 'DENY') NOT NULL DEFAULT 'ALLOW',
    `targetType` ENUM('USER', 'REGISTER') NOT NULL,
    `userId` INTEGER NULL,
    `registerId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FolderAccess_folderId_idx`(`folderId`),
    INDEX `FolderAccess_userId_idx`(`userId`),
    INDEX `FolderAccess_registerId_idx`(`registerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_EventToRegister` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_EventToRegister_AB_unique`(`A`, `B`),
    INDEX `_EventToRegister_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `User_resetToken_key` ON `User`(`resetToken`);

-- AddForeignKey
ALTER TABLE `File` ADD CONSTRAINT `File_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `Folder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Folder` ADD CONSTRAINT `Folder_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Folder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FolderAccess` ADD CONSTRAINT `FolderAccess_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `Folder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FolderAccess` ADD CONSTRAINT `FolderAccess_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FolderAccess` ADD CONSTRAINT `FolderAccess_registerId_fkey` FOREIGN KEY (`registerId`) REFERENCES `Register`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_EventToRegister` ADD CONSTRAINT `_EventToRegister_A_fkey` FOREIGN KEY (`A`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_EventToRegister` ADD CONSTRAINT `_EventToRegister_B_fkey` FOREIGN KEY (`B`) REFERENCES `Register`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
