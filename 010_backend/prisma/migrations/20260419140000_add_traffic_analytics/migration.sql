-- Add PageView and TrafficDailySummary tables for cookie-less web analytics

CREATE TABLE `PageView` (
    `id`          INT NOT NULL AUTO_INCREMENT,
    `path`        VARCHAR(500) NOT NULL,
    `referrer`    VARCHAR(500) NULL,
    `country`     VARCHAR(5) NULL,
    `deviceType`  VARCHAR(10) NOT NULL,
    `visitorHash` VARCHAR(64) NOT NULL,
    `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PageView_createdAt_idx`(`createdAt`),
    INDEX `PageView_path_idx`(`path`),
    INDEX `PageView_visitorHash_idx`(`visitorHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `TrafficDailySummary` (
    `id`               INT NOT NULL AUTO_INCREMENT,
    `date`             DATE NOT NULL,
    `path`             VARCHAR(500) NOT NULL,
    `views`            INT NOT NULL DEFAULT 0,
    `uniqueVisitors`   INT NOT NULL DEFAULT 0,
    `deviceBreakdown`  JSON NOT NULL,
    `countryBreakdown` JSON NOT NULL,
    `createdAt`        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`        DATETIME(3) NOT NULL,

    UNIQUE INDEX `TrafficDailySummary_date_path_key`(`date`, `path`),
    INDEX `TrafficDailySummary_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
