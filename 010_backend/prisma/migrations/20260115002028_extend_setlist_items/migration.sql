/*
  Warnings:

  - A unique constraint covering the columns `[eventId,position]` on the table `EventSheetMusic` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `EventSheetMusic_eventId_sheetMusicId_key` ON `EventSheetMusic`;

-- AlterTable
ALTER TABLE `EventSheetMusic` ADD COLUMN `customDescription` TEXT NULL,
    ADD COLUMN `customTitle` VARCHAR(191) NULL,
    ADD COLUMN `duration` INTEGER NULL,
    ADD COLUMN `type` ENUM('sheetMusic', 'pause', 'custom') NOT NULL DEFAULT 'sheetMusic',
    MODIFY `sheetMusicId` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `EventSheetMusic_eventId_position_key` ON `EventSheetMusic`(`eventId`, `position`);
