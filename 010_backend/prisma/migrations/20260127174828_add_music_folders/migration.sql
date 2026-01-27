-- AlterTable
ALTER TABLE `File` ADD COLUMN `sheetMusicId` INTEGER NULL;

-- CreateTable
CREATE TABLE `MusicFolder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MusicFolderItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `folderId` INTEGER NOT NULL,
    `sheetMusicId` INTEGER NOT NULL,
    `position` INTEGER NOT NULL DEFAULT 0,

    INDEX `MusicFolderItem_folderId_idx`(`folderId`),
    INDEX `MusicFolderItem_sheetMusicId_idx`(`sheetMusicId`),
    UNIQUE INDEX `MusicFolderItem_folderId_sheetMusicId_key`(`folderId`, `sheetMusicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `File` ADD CONSTRAINT `File_sheetMusicId_fkey` FOREIGN KEY (`sheetMusicId`) REFERENCES `SheetMusic`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MusicFolderItem` ADD CONSTRAINT `MusicFolderItem_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `MusicFolder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MusicFolderItem` ADD CONSTRAINT `MusicFolderItem_sheetMusicId_fkey` FOREIGN KEY (`sheetMusicId`) REFERENCES `SheetMusic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
