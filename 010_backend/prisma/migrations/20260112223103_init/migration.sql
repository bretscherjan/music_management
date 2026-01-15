-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `profilePicture` VARCHAR(191) NULL,
    `status` ENUM('active', 'passive', 'former') NOT NULL DEFAULT 'active',
    `role` ENUM('member', 'admin') NOT NULL DEFAULT 'member',
    `registerId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_email_idx`(`email`),
    INDEX `User_registerId_idx`(`registerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Register` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Register_name_key`(`name`),
    INDEX `Register_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Event` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `location` VARCHAR(191) NULL,
    `category` ENUM('rehearsal', 'performance', 'other') NOT NULL DEFAULT 'other',
    `visibility` ENUM('all', 'register', 'admin') NOT NULL DEFAULT 'all',
    `date` DATETIME(3) NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `isRecurring` BOOLEAN NOT NULL DEFAULT false,
    `recurrenceRule` VARCHAR(191) NULL,
    `excludedDates` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Event_date_idx`(`date`),
    INDEX `Event_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Attendance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `status` ENUM('yes', 'no', 'maybe') NOT NULL DEFAULT 'maybe',
    `comment` TEXT NULL,
    `eventId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Attendance_eventId_idx`(`eventId`),
    INDEX `Attendance_userId_idx`(`userId`),
    UNIQUE INDEX `Attendance_eventId_userId_key`(`eventId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `File` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `filename` VARCHAR(191) NOT NULL,
    `originalName` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `mimetype` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `visibility` ENUM('all', 'admin', 'register') NOT NULL DEFAULT 'all',
    `targetRegisterId` INTEGER NULL,
    `eventId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `File_visibility_idx`(`visibility`),
    INDEX `File_targetRegisterId_idx`(`targetRegisterId`),
    INDEX `File_eventId_idx`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `News` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `authorId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `News_authorId_idx`(`authorId`),
    INDEX `News_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_registerId_fkey` FOREIGN KEY (`registerId`) REFERENCES `Register`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `File` ADD CONSTRAINT `File_targetRegisterId_fkey` FOREIGN KEY (`targetRegisterId`) REFERENCES `Register`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `File` ADD CONSTRAINT `File_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `News` ADD CONSTRAINT `News_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
