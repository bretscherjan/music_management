-- AlterTable
ALTER TABLE `File` ADD COLUMN `folder` VARCHAR(191) NOT NULL DEFAULT '/';

-- AlterTable
ALTER TABLE `User` ADD COLUMN `phoneNumber` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Setting` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Setting_key_key`(`key`),
    INDEX `Setting_key_idx`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `File_folder_idx` ON `File`(`folder`);
