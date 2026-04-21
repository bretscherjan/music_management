-- CreateTable: Setlist (standalone, optionally linked to an event)
CREATE TABLE `Setlist` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `eventId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Setlist_eventId_idx`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: SetlistItem
CREATE TABLE `SetlistItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `setlistId` INTEGER NOT NULL,
    `sheetMusicId` INTEGER NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `title` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `duration` INTEGER NULL,
    `type` ENUM('sheetMusic', 'pause', 'custom') NOT NULL DEFAULT 'sheetMusic',

    INDEX `SetlistItem_setlistId_idx`(`setlistId`),
    INDEX `SetlistItem_sheetMusicId_idx`(`sheetMusicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey: Setlist -> Event
ALTER TABLE `Setlist` ADD CONSTRAINT `Setlist_eventId_fkey`
    FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: SetlistItem -> Setlist
ALTER TABLE `SetlistItem` ADD CONSTRAINT `SetlistItem_setlistId_fkey`
    FOREIGN KEY (`setlistId`) REFERENCES `Setlist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: SetlistItem -> SheetMusic
ALTER TABLE `SetlistItem` ADD CONSTRAINT `SetlistItem_sheetMusicId_fkey`
    FOREIGN KEY (`sheetMusicId`) REFERENCES `SheetMusic`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
