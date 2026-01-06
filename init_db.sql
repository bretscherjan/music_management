-- Create Database
CREATE DATABASE IF NOT EXISTS musig_elgg
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE musig_elgg;

-- Disable foreign key checks to allow dropping/creating tables in any order
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables if they exist
DROP TABLE IF EXISTS `RoleChangeRequests`;
DROP TABLE IF EXISTS `PollVotes`;
DROP TABLE IF EXISTS `PollOptions`;
DROP TABLE IF EXISTS `Polls`;
DROP TABLE IF EXISTS `Attendances`;
DROP TABLE IF EXISTS `Events`;
DROP TABLE IF EXISTS `UserRoles`;
DROP TABLE IF EXISTS `Roles`;
DROP TABLE IF EXISTS `FileEntities`;
DROP TABLE IF EXISTS `Users`;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Roles
CREATE TABLE `Roles` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `Name` VARCHAR(255) NOT NULL,
    `Level` INT NOT NULL
);

INSERT INTO `Roles` (`Id`, `Name`, `Level`) VALUES
(1, 'Admin', 100),
(2, 'Board', 50),
(3, 'Conductor', 40),
(4, 'Member', 10),
(5, 'Candidate', 0);

-- 2. Users
CREATE TABLE `Users` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `Email` VARCHAR(255) NOT NULL UNIQUE,
    `PasswordHash` VARCHAR(255) NOT NULL,
    `FirstName` VARCHAR(255) NOT NULL,
    `LastName` VARCHAR(255) NOT NULL,
    `Address` VARCHAR(255) NOT NULL DEFAULT '',
    `Phone` VARCHAR(50) NOT NULL DEFAULT '',
    `Instrument` VARCHAR(255) NOT NULL DEFAULT '',
    `JoinDate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1
);

INSERT INTO `Users` (`Id`, `Email`, `PasswordHash`, `FirstName`, `LastName`, `Address`, `Phone`, `Instrument`, `IsActive`) VALUES
(1, 'admin@musigelgg.ch', 'demo1234', 'System', 'Admin', 'Adminstrasse 1', '0790000000', 'None', 1),
(2, 'praesi@musigelgg.ch', 'demo1234', 'Hans', 'Musterpräsident', 'Vorstandsweg 10', '0791234567', 'Trompete', 1),
(3, 'dirigent@musigelgg.ch', 'demo1234', 'Simon', 'Taktstock', 'Notenweg 5', '0789876543', 'Dirigent', 1),
(4, 'mitglied@musigelgg.ch', 'demo1234', 'Fritz', 'Posaune', 'Dorfstrasse 22', '0765554433', 'Posaune', 1);

-- 3. UserRoles
CREATE TABLE `UserRoles` (
    `UserId` INT NOT NULL,
    `RoleId` INT NOT NULL,
    PRIMARY KEY (`UserId`, `RoleId`),
    CONSTRAINT `FK_UserRoles_Users` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_UserRoles_Roles` FOREIGN KEY (`RoleId`) REFERENCES `Roles` (`Id`) ON DELETE CASCADE
);

-- Admin (Admin, Board, Member)
INSERT INTO `UserRoles` (`UserId`, `RoleId`) VALUES (1, 1), (1, 2), (1, 4);
-- Praesi (Board, Member)
INSERT INTO `UserRoles` (`UserId`, `RoleId`) VALUES (2, 2), (2, 4);
-- Dirigent (Conductor, Member)
INSERT INTO `UserRoles` (`UserId`, `RoleId`) VALUES (3, 3), (3, 4);
-- Mitglied (Member)
INSERT INTO `UserRoles` (`UserId`, `RoleId`) VALUES (4, 4);


-- 4. Events
CREATE TABLE `Events` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `Title` VARCHAR(255) NOT NULL,
    `Description` TEXT NOT NULL,
    `Type` VARCHAR(50) NOT NULL,
    `StartTime` DATETIME NOT NULL,
    `EndTime` DATETIME NOT NULL,
    `Location` VARCHAR(255) NOT NULL,
    `Clothing` VARCHAR(255) NOT NULL DEFAULT '',
    `RegistrationDeadline` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO `Events` (`Title`, `Description`, `Type`, `StartTime`, `EndTime`, `Location`, `Clothing`) VALUES
('Musikprobe (Gesamt)', 'Vorbereitung Jahreskonzert - Fokus: Polka & Marsch. Bitte pünktlich!', 'Rehearsal', DATE_ADD(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL '2:2' DAY_HOUR), 'Werkgebäude Elgg', 'Zivil'),
('Registerprobe (Holz)', 'Details folgen.', 'Rehearsal', DATE_ADD(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL '5:2' DAY_HOUR), 'Singsaal Sekundarschule', 'Zivil'),
('Jahreskonzert 2026', 'Unser Highlight des Jahres! Motto: "Reise um die Welt".', 'Concert', DATE_ADD(NOW(), INTERVAL 30 DAY), DATE_ADD(NOW(), INTERVAL '30:4' DAY_HOUR), 'Gemeindesaal Elgg', 'Uniform'),
('Vorstandssitzung', 'Budget 2027 und Traktanden GV.', 'Meeting', DATE_ADD(NOW(), INTERVAL 10 DAY), DATE_ADD(NOW(), INTERVAL '10:3' DAY_HOUR), 'Restaurant Löwen', 'Zivil');

-- 5. Attendances
CREATE TABLE `Attendances` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `EventId` INT NOT NULL,
    `UserId` INT NOT NULL,
    `Status` INT NOT NULL, -- 0: Unanswered, 1: Present, 2: Absent, 3: Excused, 4: Maybe
    `Comment` TEXT NOT NULL,
    `UpdatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `FK_Attendances_Events` FOREIGN KEY (`EventId`) REFERENCES `Events` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_Attendances_Users` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
);

-- 6. Polls
CREATE TABLE `Polls` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `Title` VARCHAR(255) NOT NULL,
    `Description` TEXT NOT NULL,
    `DueDate` DATETIME NOT NULL,
    `IsActive` TINYINT(1) NOT NULL DEFAULT 1
);

INSERT INTO `Polls` (`Title`, `Description`, `DueDate`, `IsActive`) VALUES
('Wahl Konzertmotto 2027', 'Bitte wählt euren Favoriten für das nächste Konzert.', DATE_ADD(NOW(), INTERVAL 14 DAY), 1);

-- 7. PollOptions
CREATE TABLE `PollOptions` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `PollId` INT NOT NULL,
    `Text` VARCHAR(255) NOT NULL,
    CONSTRAINT `FK_PollOptions_Polls` FOREIGN KEY (`PollId`) REFERENCES `Polls` (`Id`) ON DELETE CASCADE
);

INSERT INTO `PollOptions` (`PollId`, `Text`) VALUES
(1, 'Filmmusik'),
(1, 'Best of 80er'),
(1, 'Schweizer Hits');

-- 8. PollVotes
CREATE TABLE `PollVotes` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `PollOptionId` INT NOT NULL,
    `UserId` INT NOT NULL,
    `VotedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `FK_PollVotes_PollOptions` FOREIGN KEY (`PollOptionId`) REFERENCES `PollOptions` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_PollVotes_Users` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
);

INSERT INTO `PollVotes` (`PollOptionId`, `UserId`) VALUES (1, 2); -- Praesi votes Filmmusik

-- 9. FileEntities
CREATE TABLE `FileEntities` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `Name` VARCHAR(255) NOT NULL,
    `Path` VARCHAR(500) NOT NULL,
    `ContentType` VARCHAR(100) NOT NULL DEFAULT '',
    `Size` BIGINT NOT NULL DEFAULT 0,
    `ParentId` INT NULL,
    `IsFolder` TINYINT(1) NOT NULL DEFAULT 0,
    `AccessLevel` VARCHAR(50) NOT NULL DEFAULT 'Member',
    `UploadedByUserId` INT NOT NULL,
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `FK_FileEntities_Parent` FOREIGN KEY (`ParentId`) REFERENCES `FileEntities` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_FileEntities_Users` FOREIGN KEY (`UploadedByUserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
);

-- Root Folders
INSERT INTO `FileEntities` (`Name`, `Path`, `IsFolder`, `AccessLevel`, `UploadedByUserId`) VALUES
('Notenarchiv', 'Notenarchiv', 1, 'Member', 1),
('Vorstand', 'Vorstand', 1, 'Board', 1);

-- 10. RoleChangeRequests
CREATE TABLE `RoleChangeRequests` (
    `Id` INT AUTO_INCREMENT PRIMARY KEY,
    `TargetUserId` INT NOT NULL,
    `NewRoleId` INT NOT NULL,
    `RequestedByUserId` INT NOT NULL,
    `ApprovedByUserId` INT NULL,
    `Status` INT NOT NULL DEFAULT 0, -- 0: Pending
    `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `ProcessedAt` DATETIME NULL,
    CONSTRAINT `FK_RCR_TargetUser` FOREIGN KEY (`TargetUserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_RCR_NewRole` FOREIGN KEY (`NewRoleId`) REFERENCES `Roles` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_RCR_Requester` FOREIGN KEY (`RequestedByUserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_RCR_Approver` FOREIGN KEY (`ApprovedByUserId`) REFERENCES `Users` (`Id`)
);

INSERT INTO `RoleChangeRequests` (`TargetUserId`, `NewRoleId`, `RequestedByUserId`, `Status`) VALUES
(4, 3, 2, 0); -- Praesi requests Conductor role for Mitglied (Pending)
