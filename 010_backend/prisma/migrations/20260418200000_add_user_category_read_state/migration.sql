-- CreateEnum
CREATE TYPE "ReadCategory" AS ENUM ('EVENTS', 'NEWS', 'POLLS');

-- CreateTable
CREATE TABLE `UserCategoryReadState` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `category` ENUM('EVENTS', 'NEWS', 'POLLS') NOT NULL,
    `lastCheckedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserCategoryReadState_userId_idx`(`userId`),
    UNIQUE INDEX `UserCategoryReadState_userId_category_key`(`userId`, `category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserCategoryReadState` ADD CONSTRAINT `UserCategoryReadState_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
