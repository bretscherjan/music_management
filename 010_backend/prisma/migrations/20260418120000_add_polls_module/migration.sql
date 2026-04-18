-- CreateEnum
CREATE TABLE IF NOT EXISTS `_prisma_migrations` (`id` VARCHAR(36) NOT NULL, PRIMARY KEY (`id`));

-- CreateEnum (MySQL stores enums on the column, not as separate types)

-- CreateTable: Poll
CREATE TABLE `Poll` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `question` TEXT NOT NULL,
    `pollKind` ENUM('SURVEY', 'VOTE') NOT NULL DEFAULT 'SURVEY',
    `type` ENUM('SINGLE', 'MULTIPLE') NOT NULL DEFAULT 'SINGLE',
    `maxChoices` INTEGER NOT NULL DEFAULT 1,
    `anonymity` ENUM('FULLY_ANONYMOUS', 'VISIBLE_TO_ADMINS', 'VISIBLE_TO_ALL') NOT NULL DEFAULT 'FULLY_ANONYMOUS',
    `resultsVisibility` ENUM('ADMINS_ONLY', 'AFTER_VOTE', 'ALWAYS') NOT NULL DEFAULT 'AFTER_VOTE',
    `allowCustomOptions` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('ACTIVE', 'CLOSED') NOT NULL DEFAULT 'ACTIVE',
    `endsAt` DATETIME(3) NULL,
    `createdById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Poll_status_idx`(`status`),
    INDEX `Poll_pollKind_idx`(`pollKind`),
    INDEX `Poll_createdById_idx`(`createdById`),
    INDEX `Poll_endsAt_idx`(`endsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: PollOption
CREATE TABLE `PollOption` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pollId` INTEGER NOT NULL,
    `text` VARCHAR(191) NOT NULL,
    `addedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PollOption_pollId_idx`(`pollId`),
    INDEX `PollOption_addedById_idx`(`addedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: PollVote
CREATE TABLE `PollVote` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pollId` INTEGER NOT NULL,
    `optionId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PollVote_pollId_optionId_userId_key`(`pollId`, `optionId`, `userId`),
    INDEX `PollVote_pollId_idx`(`pollId`),
    INDEX `PollVote_optionId_idx`(`optionId`),
    INDEX `PollVote_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: PollAudience
CREATE TABLE `PollAudience` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pollId` INTEGER NOT NULL,
    `targetType` ENUM('ALL', 'REGISTER', 'USER') NOT NULL DEFAULT 'ALL',
    `userId` INTEGER NULL,
    `registerId` INTEGER NULL,

    INDEX `PollAudience_pollId_idx`(`pollId`),
    INDEX `PollAudience_userId_idx`(`userId`),
    INDEX `PollAudience_registerId_idx`(`registerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey: Poll → User (createdBy)
ALTER TABLE `Poll` ADD CONSTRAINT `Poll_createdById_fkey`
    FOREIGN KEY (`createdById`) REFERENCES `User`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: PollOption → Poll
ALTER TABLE `PollOption` ADD CONSTRAINT `PollOption_pollId_fkey`
    FOREIGN KEY (`pollId`) REFERENCES `Poll`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: PollOption → User (addedBy)
ALTER TABLE `PollOption` ADD CONSTRAINT `PollOption_addedById_fkey`
    FOREIGN KEY (`addedById`) REFERENCES `User`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: PollVote → Poll
ALTER TABLE `PollVote` ADD CONSTRAINT `PollVote_pollId_fkey`
    FOREIGN KEY (`pollId`) REFERENCES `Poll`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: PollVote → PollOption
ALTER TABLE `PollVote` ADD CONSTRAINT `PollVote_optionId_fkey`
    FOREIGN KEY (`optionId`) REFERENCES `PollOption`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: PollVote → User
ALTER TABLE `PollVote` ADD CONSTRAINT `PollVote_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: PollAudience → Poll
ALTER TABLE `PollAudience` ADD CONSTRAINT `PollAudience_pollId_fkey`
    FOREIGN KEY (`pollId`) REFERENCES `Poll`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: PollAudience → User
ALTER TABLE `PollAudience` ADD CONSTRAINT `PollAudience_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: PollAudience → Register
ALTER TABLE `PollAudience` ADD CONSTRAINT `PollAudience_registerId_fkey`
    FOREIGN KEY (`registerId`) REFERENCES `Register`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
