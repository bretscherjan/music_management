-- CreateTable
CREATE TABLE `SheetMusic` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `composer` VARCHAR(191) NULL,
    `arranger` VARCHAR(191) NULL,
    `genre` VARCHAR(191) NULL,
    `difficulty` ENUM('easy', 'medium', 'hard') NULL,
    `publisher` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SheetMusic_title_idx`(`title`),
    INDEX `SheetMusic_genre_idx`(`genre`),
    INDEX `SheetMusic_difficulty_idx`(`difficulty`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SheetMusicBookmark` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `sheetMusicId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SheetMusicBookmark_userId_idx`(`userId`),
    INDEX `SheetMusicBookmark_sheetMusicId_idx`(`sheetMusicId`),
    UNIQUE INDEX `SheetMusicBookmark_userId_sheetMusicId_key`(`userId`, `sheetMusicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventSheetMusic` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventId` INTEGER NOT NULL,
    `sheetMusicId` INTEGER NOT NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EventSheetMusic_eventId_idx`(`eventId`),
    INDEX `EventSheetMusic_sheetMusicId_idx`(`sheetMusicId`),
    UNIQUE INDEX `EventSheetMusic_eventId_sheetMusicId_key`(`eventId`, `sheetMusicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SheetMusicBookmark` ADD CONSTRAINT `SheetMusicBookmark_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SheetMusicBookmark` ADD CONSTRAINT `SheetMusicBookmark_sheetMusicId_fkey` FOREIGN KEY (`sheetMusicId`) REFERENCES `SheetMusic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventSheetMusic` ADD CONSTRAINT `EventSheetMusic_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventSheetMusic` ADD CONSTRAINT `EventSheetMusic_sheetMusicId_fkey` FOREIGN KEY (`sheetMusicId`) REFERENCES `SheetMusic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
