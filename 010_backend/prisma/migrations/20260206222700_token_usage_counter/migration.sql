-- AlterTable FileShareToken
-- Change `used` Boolean to `usageCount` Int for limited-use tokens

ALTER TABLE `FileShareToken` ADD COLUMN `usageCount` INTEGER NOT NULL DEFAULT 0;
ALTER TABLE `FileShareToken` DROP COLUMN `used`;
