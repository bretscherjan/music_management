-- CreateTable
CREATE TABLE `VerifiedAttendance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `status` ENUM('PRESENT', 'EXCUSED', 'UNEXCUSED') NOT NULL,
    `comment` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `adminId` INTEGER NOT NULL,

    INDEX `VerifiedAttendance_eventId_idx`(`eventId`),
    INDEX `VerifiedAttendance_userId_idx`(`userId`),
    UNIQUE INDEX `VerifiedAttendance_eventId_userId_key`(`eventId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `VerifiedAttendance` ADD CONSTRAINT `VerifiedAttendance_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VerifiedAttendance` ADD CONSTRAINT `VerifiedAttendance_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
