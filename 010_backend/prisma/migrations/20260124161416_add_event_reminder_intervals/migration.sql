-- AlterTable
ALTER TABLE `Event` ADD COLUMN `reminderIntervals` JSON NULL,
    ADD COLUMN `remindersSent` JSON NULL;

-- AlterTable
ALTER TABLE `NotificationSettings` ADD COLUMN `defaultReminderIntervals` JSON NULL;
