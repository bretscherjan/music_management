/*
  Warnings:

  - Added the required column `responseDeadline` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Event` ADD COLUMN `responseDeadline` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `File` MODIFY `visibility` ENUM('all', 'limit', 'admin', 'register') NOT NULL DEFAULT 'all';

-- CreateTable
CREATE TABLE `FileAccess` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fileId` INTEGER NOT NULL,
    `accessType` ENUM('ALLOW', 'DENY') NOT NULL DEFAULT 'ALLOW',
    `targetType` ENUM('USER', 'REGISTER') NOT NULL,
    `userId` INTEGER NULL,
    `registerId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FileAccess_fileId_idx`(`fileId`),
    INDEX `FileAccess_userId_idx`(`userId`),
    INDEX `FileAccess_registerId_idx`(`registerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FileAccess` ADD CONSTRAINT `FileAccess_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `File`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FileAccess` ADD CONSTRAINT `FileAccess_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FileAccess` ADD CONSTRAINT `FileAccess_registerId_fkey` FOREIGN KEY (`registerId`) REFERENCES `Register`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
