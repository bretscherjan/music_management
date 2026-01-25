/*
  Warnings:

  - You are about to drop the column `reminderIntervals` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `remindersSent` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `defaultReminderIntervals` on the `NotificationSettings` table. All the data in the column will be lost.
  - You are about to drop the column `notifyEventReminder` on the `NotificationSettings` table. All the data in the column will be lost.
  - You are about to drop the column `pushReminders` on the `NotificationSettings` table. All the data in the column will be lost.
  - You are about to drop the column `reminderTimeBeforeHours` on the `NotificationSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Event` DROP COLUMN `reminderIntervals`,
    DROP COLUMN `remindersSent`;

-- AlterTable
ALTER TABLE `FileAccess` MODIFY `targetType` ENUM('USER', 'REGISTER', 'ADMIN_ONLY') NOT NULL;

-- AlterTable
ALTER TABLE `FolderAccess` MODIFY `targetType` ENUM('USER', 'REGISTER', 'ADMIN_ONLY') NOT NULL;

-- AlterTable
ALTER TABLE `NotificationSettings` DROP COLUMN `defaultReminderIntervals`,
    DROP COLUMN `notifyEventReminder`,
    DROP COLUMN `pushReminders`,
    DROP COLUMN `reminderTimeBeforeHours`,
    ADD COLUMN `reminderSettings` JSON NULL;
