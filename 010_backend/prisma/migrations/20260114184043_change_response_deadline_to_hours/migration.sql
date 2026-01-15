/*
  Warnings:

  - You are about to drop the column `responseDeadline` on the `Event` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Event` DROP COLUMN `responseDeadline`,
    ADD COLUMN `responseDeadlineHours` INTEGER NOT NULL DEFAULT 48;
