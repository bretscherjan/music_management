-- AlterTable
ALTER TABLE `NotificationSettings` ADD COLUMN `pushEventCancellations` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `pushEventUpdates` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `pushFileDeleted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `pushNewEvents` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `pushNewFiles` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `pushReminders` BOOLEAN NOT NULL DEFAULT true;
