-- CreateTable: PollTextAnswer (free-text answers for SURVEY-kind polls)
CREATE TABLE `PollTextAnswer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pollId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `answer` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PollTextAnswer_pollId_userId_key`(`pollId`, `userId`),
    INDEX `PollTextAnswer_pollId_idx`(`pollId`),
    INDEX `PollTextAnswer_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PollTextAnswer` ADD CONSTRAINT `PollTextAnswer_pollId_fkey` FOREIGN KEY (`pollId`) REFERENCES `Poll`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PollTextAnswer` ADD CONSTRAINT `PollTextAnswer_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
