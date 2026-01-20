-- CreateTable
CREATE TABLE `NotificationSettings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `notifyOnEventCreate` BOOLEAN NOT NULL DEFAULT true,
    `notifyOnEventUpdate` BOOLEAN NOT NULL DEFAULT true,
    `notifyOnEventDelete` BOOLEAN NOT NULL DEFAULT true,
    `notifyOnFileUpload` BOOLEAN NOT NULL DEFAULT true,
    `notifyOnFileDelete` BOOLEAN NOT NULL DEFAULT false,
    `notifyEventReminder` BOOLEAN NOT NULL DEFAULT true,
    `reminderTimeBeforeHours` INTEGER NOT NULL DEFAULT 24,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `NotificationSettings_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `NotificationSettings` ADD CONSTRAINT `NotificationSettings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
