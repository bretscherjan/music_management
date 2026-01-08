-- Database Schema for Musig Elgg
-- Generated for MySQL

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- Registers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Registers` (
    `Id` CHAR(36) NOT NULL,
    `Name` VARCHAR(100) NOT NULL,
    `Description` VARCHAR(500) NULL,
    `SortOrder` INT NOT NULL DEFAULT 0,
    PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Users
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Users` (
    `Id` CHAR(36) NOT NULL,
    `Email` VARCHAR(255) NOT NULL,
    `FirstName` VARCHAR(100) NOT NULL,
    `LastName` VARCHAR(100) NOT NULL,
    `Role` VARCHAR(50) NOT NULL, -- Admin, Member, Public
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1,
    `PhoneNumber` VARCHAR(50) NULL,
    `RegisterId` CHAR(36) NULL,
    `PasswordHash` LONGTEXT NOT NULL,
    `Status` INT NOT NULL DEFAULT 0,
    `Instrument` VARCHAR(100) NULL,
    `EntryDate` DATETIME(6) NULL,
    `CreatedAt` DATETIME(6) NOT NULL,
    `UpdatedAt` DATETIME(6) NOT NULL,
    PRIMARY KEY (`Id`),
    UNIQUE KEY `IX_Users_Email` (`Email`),
    CONSTRAINT `FK_Users_Registers_RegisterId` FOREIGN KEY (`RegisterId`) REFERENCES `Registers` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- EventCategories
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `EventCategories` (
    `Id` CHAR(36) NOT NULL,
    `Name` VARCHAR(100) NOT NULL,
    `Description` VARCHAR(500) NULL,
    `ColorHex` VARCHAR(20) NULL,
    PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- EventSeries
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `EventSeries` (
    `Id` CHAR(36) NOT NULL,
    `Name` VARCHAR(200) NOT NULL,
    `Description` VARCHAR(2000) NULL,
    `StartDate` DATETIME(6) NULL,
    `EndDate` DATETIME(6) NULL,
    PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Events
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Events` (
    `Id` CHAR(36) NOT NULL,
    `Title` VARCHAR(200) NOT NULL,
    `Description` VARCHAR(2000) NULL,
    `StartTime` DATETIME(6) NOT NULL,
    `EndTime` DATETIME(6) NOT NULL,
    `Location` VARCHAR(300) NULL,
    `MaxParticipants` INT NULL,
    `IsPublic` TINYINT(1) NOT NULL DEFAULT 0,
    `IsCancelled` TINYINT(1) NOT NULL DEFAULT 0,
    `IsDraft` TINYINT(1) NOT NULL DEFAULT 1,
    `AttendanceQrCode` VARCHAR(500) NULL,
    `CreatedAt` DATETIME(6) NOT NULL,
    `UpdatedAt` DATETIME(6) NOT NULL,
    `CategoryId` CHAR(36) NULL,
    `SeriesId` CHAR(36) NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Events_EventCategories_CategoryId` FOREIGN KEY (`CategoryId`) REFERENCES `EventCategories` (`Id`) ON DELETE SET NULL,
    CONSTRAINT `FK_Events_EventSeries_SeriesId` FOREIGN KEY (`SeriesId`) REFERENCES `EventSeries` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- EventParticipants
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `EventParticipants` (
    `EventId` CHAR(36) NOT NULL,
    `UserId` CHAR(36) NOT NULL,
    `Status` VARCHAR(50) NOT NULL, -- Attending, Declined, Maybe
    `Reason` VARCHAR(500) NULL,
    `RegisteredAt` DATETIME(6) NOT NULL,
    PRIMARY KEY (`EventId`, `UserId`),
    CONSTRAINT `FK_EventParticipants_Events_EventId` FOREIGN KEY (`EventId`) REFERENCES `Events` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_EventParticipants_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- RegisterLimits
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `RegisterLimits` (
    `Id` CHAR(36) NOT NULL,
    `EventId` CHAR(36) NOT NULL,
    `RegisterId` CHAR(36) NOT NULL,
    `MaxCount` INT NOT NULL,
    PRIMARY KEY (`Id`),
    UNIQUE KEY `IX_RegisterLimits_EventId_RegisterId` (`EventId`, `RegisterId`),
    CONSTRAINT `FK_RegisterLimits_Events_EventId` FOREIGN KEY (`EventId`) REFERENCES `Events` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_RegisterLimits_Registers_RegisterId` FOREIGN KEY (`RegisterId`) REFERENCES `Registers` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- MusicPieces
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `MusicPieces` (
    `Id` CHAR(36) NOT NULL,
    `CatalogNumber` VARCHAR(50) NULL,
    `Title` VARCHAR(200) NOT NULL,
    `Composer` VARCHAR(150) NULL,
    `Arranger` VARCHAR(150) NULL,
    `Publisher` VARCHAR(150) NULL,
    `Genre` VARCHAR(100) NULL,
    `StorageLocation` VARCHAR(200) NULL,
    `StorageCabinet` VARCHAR(50) NULL,
    `StorageShelf` VARCHAR(50) NULL,
    `InstrumentationCode` VARCHAR(50) NULL,
    `Instrumentation` VARCHAR(500) NULL,
    `DifficultyLevel` INT NULL,
    `DifficultyDescription` VARCHAR(50) NULL,
    `DurationSeconds` INT NULL,
    `Year` INT NULL,
    `CopiesCount` INT NOT NULL DEFAULT 1,
    `IsAvailable` TINYINT(1) NOT NULL DEFAULT 1,
    `PdfPath` VARCHAR(500) NULL,
    `AudioPath` VARCHAR(500) NULL,
    `Notes` VARCHAR(2000) NULL,
    `CreatedAt` DATETIME(6) NOT NULL,
    `UpdatedAt` DATETIME(6) NOT NULL,
    PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- MusicAttachments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `MusicAttachments` (
    `Id` CHAR(36) NOT NULL,
    `MusicPieceId` CHAR(36) NOT NULL,
    `FileName` VARCHAR(255) NOT NULL,
    `FilePath` VARCHAR(500) NOT NULL,
    `FileType` VARCHAR(50) NOT NULL,
    `Type` VARCHAR(50) NOT NULL, -- PDF, Audio, Other
    `UploadedAt` DATETIME(6) NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_MusicAttachments_MusicPieces_MusicPieceId` FOREIGN KEY (`MusicPieceId`) REFERENCES `MusicPieces` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- AssignedTasks
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `AssignedTasks` (
    `Id` CHAR(36) NOT NULL,
    `Title` VARCHAR(200) NOT NULL,
    `Description` VARCHAR(2000) NULL,
    `DueDate` DATETIME(6) NULL,
    `Status` VARCHAR(50) NOT NULL, -- Open, InProgress, Completed
    `Priority` INT NOT NULL DEFAULT 3,
    `Recurrence` VARCHAR(50) NOT NULL DEFAULT 'None',
    `NextOccurrence` DATETIME(6) NULL,
    `CreatedAt` DATETIME(6) NOT NULL,
    `UpdatedAt` DATETIME(6) NOT NULL,
    `CompletedAt` DATETIME(6) NULL,
    `ArchivedAt` DATETIME(6) NULL,
    `CreatedById` CHAR(36) NULL,
    `AssigneeId` CHAR(36) NULL,
    `AssignedRegisterId` CHAR(36) NULL,
    `EventId` CHAR(36) NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_AssignedTasks_Users_CreatedById` FOREIGN KEY (`CreatedById`) REFERENCES `Users` (`Id`) ON DELETE SET NULL,
    CONSTRAINT `FK_AssignedTasks_Users_AssigneeId` FOREIGN KEY (`AssigneeId`) REFERENCES `Users` (`Id`) ON DELETE SET NULL,
    CONSTRAINT `FK_AssignedTasks_Registers_AssignedRegisterId` FOREIGN KEY (`AssignedRegisterId`) REFERENCES `Registers` (`Id`) ON DELETE SET NULL,
    CONSTRAINT `FK_AssignedTasks_Events_EventId` FOREIGN KEY (`EventId`) REFERENCES `Events` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- TaskChecklistItems
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `TaskChecklistItems` (
    `Id` CHAR(36) NOT NULL,
    `TaskId` CHAR(36) NOT NULL,
    `Text` VARCHAR(500) NOT NULL,
    `IsCompleted` TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_TaskChecklistItems_AssignedTasks_TaskId` FOREIGN KEY (`TaskId`) REFERENCES `AssignedTasks` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- TaskComments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `TaskComments` (
    `Id` CHAR(36) NOT NULL,
    `TaskId` CHAR(36) NOT NULL,
    `AuthorId` CHAR(36) NOT NULL,
    `Text` VARCHAR(2000) NOT NULL,
    `CreatedAt` DATETIME(6) NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_TaskComments_AssignedTasks_TaskId` FOREIGN KEY (`TaskId`) REFERENCES `AssignedTasks` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_TaskComments_Users_AuthorId` FOREIGN KEY (`AuthorId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------------------------
-- Seed Data: EventCategories
-- ----------------------------------------------------------------------------
INSERT INTO `EventCategories` (`Id`, `Name`, `Description`, `ColorHex`) VALUES
('11111111-1111-1111-1111-111111111111', 'Konzert', 'Öffentliche Konzerte und Auftritte', '#801010'),
('22222222-2222-2222-2222-222222222222', 'Probe', 'Reguläre Proben', '#C5A059'),
('33333333-3333-3333-3333-333333333333', 'Vereinsanlass', 'Interne Vereinsanlässe', '#801010')
ON DUPLICATE KEY UPDATE `Name`=`Name`;

SET FOREIGN_KEY_CHECKS = 1;
